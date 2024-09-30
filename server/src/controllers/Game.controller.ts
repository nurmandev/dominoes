import Game from './../models/Game.model';
import { asyncHandler } from '../helpers/AsyncHelper';
import { ServerError, SuccessResponse } from '../helpers/ResponseHelpers';

const GameController = {
  createRoom: asyncHandler(async (req, res) => {
    const { gameId } = req.body;

    const newGame = await Game.create({
      gameId,
      players: [{ user: req.user?._id, score: 0, tiles: [] }],
    });
    const game = await newGame.populate({
      path: 'players.user',
      select: '-tiles',
    });

    return SuccessResponse(res, game, 'Room created successfully', 201);
  }),

  getPlayerId: asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const userId: any = req.user?._id;

    const game = await Game.findOne({ gameId });
    if (!game || game.players.length === 0) {
      return ServerError(res, 'Game not found');
    }

    const index = game?.players.findIndex(
      (player) => player.user._id.toString() === userId.toString()
    );

    return SuccessResponse(res, index, 'Get Player index success', 201);
  }),

  joinRoom: asyncHandler(async (req, res) => {
    const { gameId } = req.body;
    const userId: any = req.user?._id;

    let game = await Game.findOne({ gameId });
    if (!game || game.players.length === 0) {
      return ServerError(res, 'Game not found');
    }

    const isPlayerInGame = game.players.some(
      (player) => player.user.toString() === userId.toString()
    );
    if (isPlayerInGame) {
      return ServerError(res, 'Already in this game', 400);
    }

    if (game.players.length > 1) {
      return ServerError(res, 'Room is already full');
    }

    game.players.push({
      user: userId,
      score: 0,
      tiles: [],
    });

    if (game.players.length === 2) {
      game.active = true;
    }

    await game.save();
    game = await game.populate({
      path: 'players.user',
      select: '-tiles',
    });

    return SuccessResponse(res, game, 'Room joined successfully');
  }),

  getGame: asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const game = await Game.findOne({ gameId: slug }).populate({
      path: 'players.user',
      select: '-tiles',
    });

    if (!game) {
      return ServerError(res, 'Game not found', 400);
    }

    return SuccessResponse(res, game, 'Room retrieved successfully');
  }),

  getAllGames: asyncHandler(async (req, res) => {
    const games = await Game.find({
      'players.0': { $exists: true },
      'players.1': { $exists: false },
      active: false,
    }).populate({
      path: 'players.user',
      select: '-tiles',
    });

    return SuccessResponse(
      res,
      games,
      'Rooms with one player retrieved successfully'
    );
  }),
};

export default GameController;
