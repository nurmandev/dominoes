import mongoose, { Types, SchemaTypes } from 'mongoose';
import { numberPair, TileClassSpec } from '../types';

export interface Game {
  gameId: string;
  isPrivate: boolean;
  active: boolean;
  players: {
    user: Types.ObjectId;
    score: number;
    tiles: numberPair[];
  }[];
  gameData: {
    player1Ready: boolean;
    player2Ready: boolean;
    boneyard: numberPair[];
    gameboard: {
      currentTile: TileClassSpec;
      tileConnectedTo: TileClassSpec;
    }[];
  };
  turn: 0 | 1;
  winner?: Types.ObjectId | null;
}

const gameSchema = new mongoose.Schema<Game>(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
    },
    players: [
      {
        user: {
          type: SchemaTypes.ObjectId,
          ref: 'User',
          required: true,
        },
        score: {
          type: Number,
          default: 0, // Initialize score at 0
        },
        tiles: {
          type: [[Number, Number]], // Array of domino tiles
          default: [],
        },
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: false,
    },
    turn: {
      type: Number,
      required: true,
      default: 0,
    },
    gameData: {
      boneyard: {
        type: [[Number, Number]],
        default: [],
      },
      player1Ready: {
        type: Boolean,
        default: false,
      },
      player2Ready: {
        type: Boolean,
        default: false,
      },
      gameboard: [
        {
          currentTile: {
            type: SchemaTypes.Mixed,
            required: true,
          },
          tileConnectedTo: {
            type: SchemaTypes.Mixed,
          },
        },
      ],
    },
    winner: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
      default: null, // Optional winner tracking
    },
  },
  { timestamps: true }
);

export default mongoose.model<Game>('Game', gameSchema);
