import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { errorHandler } from './helpers/ResponseHelpers';
import { connectDB } from './db';
import cors from 'cors';
import { config } from 'dotenv';
import socketMiddleware from './middlewares/socketMiddleware';

import UserRoutes from './routes/User.route';
import GameRoutes from './routes/Game.route';
import SocketController from './controllers/Socket.controller';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: [
      'https://dominoes-six.vercel.app',
      'http://localhost:3000',
      'http://172.20.10.2:3000',
      'https://dominoes-vddr.onrender.com',
      'https://dominoes-tan.vercel.app',
    ],
  })
);
config();
connectDB();

app.use('/api/user', UserRoutes);
app.use('/api/game', GameRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://dominoes-six.vercel.app',
      'http://localhost:3000',
      'http://172.20.10.2:3000',
      'https://dominoes-vddr.onrender.com',
      'https://dominoes-tan.vercel.app',
    ],
  },
});

io.engine.use(socketMiddleware);

io.on('connection', (socket) => {
  socket.on('createGame', () => {
    SocketController.createGame(socket, io, socket.request.token);
  });
  socket.on('joinGame', ({ gameId }) => {
    SocketController.joinGame(gameId, socket, io, socket.request.token);
  });
  socket.on('initialTiles', ({ gameId }) => {
    SocketController.joinGame(gameId, socket, io, socket.request.token);
  });
  socket.on('ready', ({ gameId, player }) => {
    SocketController.handleReady(gameId, socket, io, player);
  });
  socket.on('startGame', ({ gameId, playerId }) => {
    SocketController.startGame(socket, gameId, playerId);
  });
  socket.on('pickFromBoneyard', ({ gameId }) => {
    SocketController.pickFromBoneyard(socket, gameId, socket.request.token);
  });
  socket.on('updateBoard', ({ gameId, gameboardTile }) => {
    SocketController.updateBoard(socket, gameId, gameboardTile);
  });
  socket.on(
    'tilePlayed',
    ({ gameId, playerId, droppedTile, triggeredTile }) => {
      SocketController.tilePlayed(
        socket,
        gameId,
        playerId,
        droppedTile,
        triggeredTile
      );
    }
  );
  socket.on('disconnect', () => {
    console.log(`${socket.id} has disconnected`);

    const rooms = Object.keys(socket.rooms).filter(
      (room) => room !== socket.id
    );

    for (const room of rooms) {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);

      io.to(room).emit('userLeft', { socketId: socket.id });
    }
  });
  socket.on('leave', (room) => {
    console.log('leave', room);
    socket.leave(room);
  });
  socket.on('error', (err) => {
    console.log(err);
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
