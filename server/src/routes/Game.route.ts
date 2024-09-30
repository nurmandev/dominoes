import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import GameController from '../controllers/Game.controller';

const router = Router();

router.post('/create', authMiddleware, GameController.createRoom);
router.post('/join', authMiddleware, GameController.joinRoom);
router.get('/all', authMiddleware, GameController.getAllGames);
router.get('/:slug', authMiddleware, GameController.getGame);
router.get('/playerId/:gameId', authMiddleware, GameController.getPlayerId);

export default router;
