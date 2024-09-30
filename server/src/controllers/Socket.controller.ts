/* eslint-disable indent */
/* eslint-disable multiline-ternary */
import axios, { AxiosResponse } from 'axios';
import { Server, Socket } from 'socket.io';
import {
  calculateOpponentTilesValue,
  checkForWin,
  findLargestDouble,
  generateBoneyard,
  generateRandomCharacters,
} from '../utils';
import Game from '../models/Game.model';
import { TileClassSpec } from '../types';

const currentGames: string[] = [];

const SocketController = {
  createGame: async (socket: Socket, io: Server, token?: string) => {
    try {
      const gameId = generateRandomCharacters();

      const res = await axios
        .post(
          `${process.env.BASE_URL}/api/game/create`,
          { gameId },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch((err) => socket.emit('createGameError', err));
      if (typeof res === 'boolean') {
        return;
      }

      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.leave(room);
        }
      }

      await socket.join(gameId);
      socket.emit('gameCreated', { gameId });
      io.emit('newGameCreated', { game: res.data.data });
      return true;
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  startGame: async (socket: Socket, gameId: string, playerId: number) => {
    try {
      const game = await Game.findOne({ gameId });

      if (!game) {
        throw new Error('Game not found');
      }

      // If the game is already in progress, resume it
      if (game.active && game.gameData && game.gameData.gameboard.length > 0) {
        // for (const room of socket.rooms) {
        //   if (room !== socket.id) {
        //     socket.leave(room);
        //   }
        // }

        // await socket.join(gameId);
        socket.emit('resumeGame', {
          gameboard: game.gameData.gameboard,
          boneyardCount: game.gameData.boneyard.length,
          playerTiles: game.players[playerId].tiles,
          opponentTilesCount: game.players[1 - playerId].tiles.length,
          isTurn: game.turn === playerId,
        });

        return true;
      }

      // If game is not in progress, start a new game
      if (currentGames.includes(gameId)) {
        return true;
      }

      currentGames.push(gameId);

      let boneyard = generateBoneyard();
      const player1Choices: number[] = [];
      const player2Choices: number[] = [];

      // Distribute tiles to players
      while (player1Choices.length < 7 || player2Choices.length < 7) {
        const random = Math.floor(Math.random() * 28);
        if (
          player1Choices.length < 7 &&
          !player2Choices.includes(random) &&
          !player1Choices.includes(random)
        ) {
          player1Choices.push(random);
        } else if (
          player2Choices.length < 7 &&
          !player1Choices.includes(random) &&
          !player2Choices.includes(random)
        ) {
          player2Choices.push(random);
        }
      }

      const player1Tiles = player1Choices.map((i) => boneyard[i]);
      const player2Tiles = player2Choices.map((i) => boneyard[i]);
      const max1 = findLargestDouble(player1Tiles);
      const max2 = findLargestDouble(player2Tiles);
      const turn =
        max1 < 0 && max2 < 0 ? -1 : max1 > max2 ? 0 : max2 > max1 ? 1 : -1;

      boneyard = boneyard.filter(
        (_, index) =>
          !player1Choices.includes(index) && !player2Choices.includes(index)
      );

      setTimeout(() => {
        socket.emit('boneyard', {
          choices:
            playerId === 0
              ? player1Tiles
              : playerId === 1
              ? player2Tiles
              : null,
          isTurn: turn === playerId,
        });

        socket.broadcast.emit('boneyard', {
          choices:
            playerId === 0
              ? player2Tiles
              : playerId === 1
              ? player1Tiles
              : null,
          isTurn: turn !== playerId && turn !== -1,
        });
      }, 500);

      // Save the new game state
      if (game) {
        game.gameData.boneyard = boneyard;
        game.gameData.gameboard = [];
        game.players[0].tiles = player1Tiles;
        game.players[1].tiles = player2Tiles;
        game.turn = turn === 0 ? 0 : 1;
        await game.save();
      }

      return true;
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  tilePlayed: async (
    socket: Socket,
    gameId: string,
    playerId: number,
    droppedTile: TileClassSpec,
    triggeredTile: TileClassSpec
  ) => {
    try {
      const game = await Game.findOne({ gameId }).populate({
        path: 'players.user',
      });
      if (!game) {
        return socket.emit('tileError', 'Game not found');
      }

      const gameboard = game.gameData.gameboard;

      if (
        game.turn !== playerId ||
        gameboard.some((i) => i.currentTile.id === droppedTile.id)
      ) {
        return socket.emit('tileError', 'Not your turn');
      }

      // Add the played tile to the game board
      gameboard.push({
        currentTile: droppedTile,
        tileConnectedTo: triggeredTile,
      });
      game.gameData.gameboard = gameboard;

      // Remove the played tile from the player's hand
      const playerTiles =
        playerId === 0 ? game.players[0].tiles : game.players[1].tiles;
      game.players[playerId].tiles = playerTiles.filter(
        (tile) => Number(`${tile[0]}${tile[1]}`) !== droppedTile.id
      );

      const opponentId = playerId === 0 ? 1 : 0;
      const hasWon: boolean = checkForWin(game, playerId);

      if (hasWon) {
        const points = calculateOpponentTilesValue(game, playerId);
        game.players[playerId].score += points;

        // Check if game is over (you can set your own game-ending conditions)
        const gameOver = game.players[playerId].score >= 100; // Example score threshold for game over

        if (gameOver) {
          // Emit game over event
          socket.emit('gameOver', {
            winner: game.players[playerId],
            loser: game.players[opponentId],
            tiles: game.players[opponentId].tiles,
            points,
            youWin: true,
          });
          socket.broadcast.emit('gameOver', {
            winner: game.players[playerId],
            loser: game.players[opponentId],
            tiles: game.players[playerId].tiles,
            points,
            youWin: false,
          });

          // Set game as inactive
          game.active = false;
          await game.save();
        } else {
          const index = currentGames.indexOf(gameId);
          if (index !== -1) {
            currentGames.splice(index, 1); // Removes the gameId from the array
          }

          socket.emit('gameWon', {
            tiles: game.players[opponentId].tiles,
            points,
          });
          socket.broadcast.emit('opponentWon', {
            tiles: game.players[playerId].tiles,
            points,
          });
          game.gameData.gameboard = [];
          game.gameData.boneyard = [];

          await game.save();

          setTimeout(() => {
            SocketController.startGame(socket, gameId, playerId);
          }, 5000);
        }
      } else {
        // Switch turn to opponent
        game.turn = opponentId;
        await game.save();
        socket.emit('userPlayed');
        socket.broadcast.emit('opponentPlayed', {
          tile: droppedTile,
          gameboard,
          isTurn: game.turn !== playerId,
        });
      }

      return true;
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  handleReady: async (
    gameId: string,
    socket: Socket,
    io: Server,
    playerId: number
  ) => {
    try {
      const game = await Game.findOne({ gameId });

      if (!game) {
        throw new Error('Game not found');
      }

      if (playerId === 0) {
        game.gameData.player1Ready = true;
      } else if (playerId === 1) {
        game.gameData.player2Ready = true;
      }

      io.to(gameId).emit('playerReady', playerId);

      await game.save();

      return true;
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  pickFromBoneyard: async (socket: Socket, gameId: string, token?: string) => {
    try {
      // Find the game by gameId
      const game = await Game.findOne({ gameId });
      if (!game) {
        return socket.emit('pickedFromBoneyardError', 'Game not found');
      }

      const res = await axios
        .get(`${process.env.BASE_URL}/api/game/playerid/${gameId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch((err) => socket.emit('pickedFromBoneyardError', err));

      if (typeof res === 'boolean') {
        return;
      }
      const playerId = res.data.data;
      if (game.turn !== playerId) {
        return socket.emit('pickedFromBoneyardError', 'Not your turn');
      }

      // Ensure there are tiles left in the boneyard
      if (game.gameData.boneyard.length === 0) {
        return socket.emit('pickedFromBoneyardError', 'Boneyard is empty');
      }

      // Randomly pick a tile from the boneyard
      const randomIndex = Math.floor(
        Math.random() * game.gameData.boneyard.length
      );
      const pickedTile = game.gameData.boneyard.splice(randomIndex, 1)[0]; // Remove the tile from the boneyard

      // Add the picked tile to the player's tiles
      if (playerId === 0) {
        game.players[0].tiles.push(pickedTile);
      } else if (playerId === 1) {
        game.players[1].tiles.push(pickedTile);
      }

      // Update the turn to the next player
      // game.turn = playerId === 0 ? 1 : 0;

      // Emit events to notify both players
      socket.emit('pickedFromBoneyardResponse', { pickedTile });
      socket.broadcast.emit('opponentPickedFromBoneyard');

      // Save the updated game state
      await game.save();
      return true;
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  joinGame: async (
    gameId: string,
    socket: Socket,
    io: Server,
    token?: string
  ) => {
    try {
      let res: AxiosResponse<any, any> | undefined;

      try {
        res = await axios.post(
          `${process.env.BASE_URL}/api/game/join`,
          { gameId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err: any) {
        if (err.response.status === 400) {
          return;
        }
        socket.emit('joinGameError');
      }

      if (!res) return;

      const game = res.data.data;
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.leave(room);
        }
      }

      await socket.join(gameId);

      io.to(gameId).emit('gameJoined', { game });
      io.emit('gameUpdated', { game });

      return true;
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  updateBoard: async (
    socket: Socket,
    gameId: string,
    gameboardTile: {
      currentTile: TileClassSpec;
      tileConnectedTo: TileClassSpec;
    }
  ) => {
    try {
      const game = await Game.findOne({ gameId });

      if (!game) {
        throw new Error('Game not found');
      }

      console.log(gameboardTile.currentTile);
      const gameboard = game.gameData.gameboard;

      const existingTileIndex = gameboard.findIndex(
        (tile) => tile.currentTile.id === gameboardTile.currentTile.id
      );

      if (existingTileIndex !== -1) {
        gameboard[existingTileIndex] = gameboardTile;
      } else {
        gameboard.push(gameboardTile);
      }
      const updatedGame = await Game.findOneAndUpdate(
        {
          gameId,
          $or: [
            { 'gameData.gameboard': { $ne: [] } },
            { 'gameData.boneyard': { $ne: [] } },
          ],
        }, // Check if gameboard or boneyard is not empty
        {
          $set: { 'gameData.gameboard': gameboard },
        },
        { new: true }
      );

      if (!updatedGame) {
        throw new Error(
          'Game was modified by another process. Please refresh.'
        );
      }

      socket.emit('gameUpdated', { game: updatedGame });
    } catch (err: any) {
      throw new Error(err.message);
    }
  },
};

export default SocketController;
