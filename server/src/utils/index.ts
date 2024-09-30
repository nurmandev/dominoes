/* eslint-disable no-confusing-arrow */
import { Game } from '../models/Game.model';
import { numberPair } from '../types';

export const generateRandomCharacters = (length = 6) => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

function shuffleArray(array: numberPair[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const generateBoneyard = () => {
  const boneyard: numberPair[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      boneyard.push([i, j]);
    }
  }

  const arrangedBoneyard: numberPair[] = boneyard.map((tile) =>
    tile[1] > tile[0] ? [tile[1], tile[0]] : tile
  );

  return shuffleArray(arrangedBoneyard);
};

export const findLargestDouble = (pair: numberPair[]) => {
  return pair.reduce((max, current) => {
    const sum = current[0] + current[1];
    return current[0] === current[1] && sum > max ? sum : max;
  }, -Infinity);
};

export const checkForWin = (game: Game, playerId: number): boolean => {
  const playerTiles =
    playerId === 0 ? game.players[0].tiles : game.players[1].tiles;
  return playerTiles.length === 0;
};

export const calculateOpponentTilesValue = (
  game: Game,
  playerId: number
): number => {
  const opponentId = playerId === 0 ? 1 : 0;
  const opponentTiles = game.players[opponentId].tiles;

  // Sum the remaining pip values of opponent's tiles
  return opponentTiles.reduce((sum, tile) => sum + tile[0] + tile[1], 0);
};
