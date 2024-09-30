import { TileAlignSpec } from "@/utils/game-utils";
import { numberPair } from "./index.d";
import { RectReadOnly } from "react-use-measure";

export interface User {
  _id: string;
  username: string;
  address: string;
  games: Game[];
}

export interface Game {
  gameId: string;
  isPrivate: boolean;
  players: {
    user: User;
    score: number;
    tiles: numberPair[];
  }[];
}

export interface AnchorProp {
  root: boolean;
  coordinates: numberPair;
  tile: tileType;
  canAccept: number[];
  tilt: number;
  scale: number;
  initailSetAnchor: (
    tile: tileType,
    coordinates: numberPair,
    id: number
  ) => void;
  activeHover: React.MutableRefObject<number | null>;
}

export type numberPair = [number, number];
export type tileType = { id: number; tile: numberPair };

export type userWin = { points: number; tiles: tileType[] };

export interface DominoesTileProps {
  tile: tileType;
  size?: string;
}
export interface DropZoneProp {
  registerDrop: (count: number) => void;
  position: numberPair | null;
  initailSetAnchor: (
    tile: tileType,
    coordinates: numberPair,
    id: number,
    isOpponent?: boolean
  ) => void;
  activeHover: React.MutableRefObject<number | null>;
  id: number;
  scale: number;
}

export interface tileAlignSpecType {
  id: number;
  root: boolean;
  orientation: string;
  scale: number;
  tile: numberPair;
  isDouble: boolean;
  coordinates: numberPair;
  connectedAt: [[number], [number]];
  connections: tileAlignSpec[];
  setConnection: (
    to: number,
    tile: numberPair,
    scale: number,
    branchHeight: number,
    branchWidth: number,
    maxLayoutHeight: number,
    maxLayoutWidth: number
  ) => void;
  attach: any;
  calcDropLocation: (vec: numberPair) => string | undefined;
}

export interface boneYardDistSpecType {
  active: boolean;
  distribute: boolean;
  instant: boolean;
  drawAmount: number;
  required: number[] | null;
  callbacks: ((
    position: numberPair,
    distribute?: boolean
  ) => Promise<tileType | undefined>)[];
}

export type PlayerId = -1 | 0 | 1;

export interface GameOver {
  winner: { user: User; score: number };
  loser: { user: User; score: number };
}

export interface ResumeGame {
  boneyardCount: number;
  opponentTilesCount: number;
  gameboard: { currentTile: TileAlignSpec; tileConnectedTo: TileAlignSpec }[];
  playerTiles: tileType[];
  isTurn: true;
}

export interface GameContextType {
  draggedTile: tileType | null;
  setDraggedTile: React.Dispatch<React.SetStateAction<tileType | null>>;
  recentlyDroppedTile: React.MutableRefObject<tileType | null>;
  deck: numberPair[];
  isTurn: boolean;
  resumeGame: ResumeGame | null;
  setResumeGame: React.Dispatch<React.SetStateAction<ResumeGame | null>>;
  setIsTurn: (value: boolean) => void;
  firstPlayer: number;
  playerId: PlayerId;
  setFirstPlayer: React.Dispatch<React.SetStateAction<number>>;
  gameOver: GameOver | null;
  selectFromBoneYard: () => tileType;
  selectFromBoneYardServer: () => Promise<tileType>;
  opponentWin: userWin | null;
  playerWin: userWin | null;

  setDeck: (deck: numberPair[]) => void;

  permits: number[];
  setPermits: React.Dispatch<React.SetStateAction<number[]>>;
  canPlay: boolean;
  setCanPlay: React.Dispatch<React.SetStateAction<boolean>>;

  boneYardDistSpec: boneYardDistSpecType;
  setBoneYardDistSpec: React.Dispatch<
    React.SetStateAction<boneYardDistSpecType>
  >;
  registerDistCallback: (
    callback: (
      position: numberPair,
      distribute?: boolean
    ) => Promise<tileType | undefined>
  ) => number;
  unRegisterDistCallback: (index: number) => void;
  requestTile: (
    instant: boolean,
    callbackID: number,
    required?: number[],
    amount?: number
  ) => void;
  opponentPlay: {
    tilePlayed: tileType;
    playedOn: tileType | null;
  } | null;
  setOpponentPlay: React.Dispatch<
    React.SetStateAction<{
      tilePlayed: tileType;
      playedOn: tileType | null;
    } | null>
  >;
  oppenentPullFrom: React.MutableRefObject<numberPair>;
}

export interface AlertProps {
  text: string;
  subText?: string;
  isTop?: boolean;
  delay?: number;
}

export type useDistributorType = [
  tileType[],
  React.Dispatch<SetStateAction<tileType[]>>,
  numberPair | undefined,
  MutableRefObject<HTMLDivElement | null>,
  (amount?: number) => void
];

declare global {
  interface Window {
    tronWeb: any;
  }
}
