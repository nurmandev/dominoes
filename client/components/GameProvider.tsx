import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  GameContextType,
  numberPair,
  tileType,
  boneYardDistSpecType,
  Game,
  PlayerId,
  userWin,
  GameOver,
  ResumeGame,
} from "@/types";
import { useSocket } from "./SocketProvider";
import { useParams, useRouter } from "next/navigation";
import useCreateAPI from "@/utils/api";
import useCurrentUser from "@/hooks/useCurrentUser";
import { toast } from "react-toastify";

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [draggedTile, setDraggedTile] = useState<tileType | null>(null);
  const recentlyDroppedTile = useRef<tileType | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [opponentPlay, setOpponentPlay] = useState<{
    tilePlayed: tileType;
    playedOn: tileType | null;
  } | null>(null);
  const oppenentPullFrom = useRef<numberPair>([0, 0]);
  const { slug } = useParams();
  const router = useRouter();
  const { socket } = useSocket();
  const API = useCreateAPI();
  const { user } = useCurrentUser();

  const playerId: PlayerId = useMemo(() => {
    const index = game?.players.findIndex(
      (player) => player.user._id === user?._id
    );
    return index !== -1 ? (index as PlayerId) : (null as any);
  }, [game, user]);

  const [firstPlayer, setFirstPlayer] = useState(-2);
  const [permits, setPermits] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [distCallback, setDistCallback] = useState<
    ((position: numberPair) => Promise<tileType | undefined>)[]
  >([]);
  const distributeTile = useRef<tileType[]>([]);
  const [boneYardDistSpec, setBoneYardDistSpec] =
    useState<boneYardDistSpecType>({
      active: false,
      distribute: false,
      instant: false,
      drawAmount: 0,
      required: [],
      callbacks: [],
    });

  const [isTurn, setIsTurn] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [deck, setDeck] = useState<numberPair[]>([]);
  const [playerWin, setPlayerWin] = useState<userWin | null>(null);
  const [opponentWin, setOpponentWin] = useState<userWin | null>(null);
  const [gameOver, setGameOver] = useState<GameOver | null>(null);
  const [resumeGame, setResumeGame] = useState<ResumeGame | null>(null);

  const makeTile = (tiles: numberPair[]): tileType[] =>
    tiles.map((tile) => ({
      id: Number(`${tile[0]}${tile[1]}`),
      tile,
    }));

  const selectFromBoneYard = () => {
    const index = Math.floor(Math.random() * distributeTile.current.length);
    console.log("here", index);
    return distributeTile.current.splice(index, 1)[0];
  };

  const selectFromBoneYardServer = async (): Promise<tileType> => {
    if (!socket) return { id: 0, tile: [0, 0] as numberPair };
    return new Promise((resolve, reject) => {
      socket.emit("pickFromBoneyard", { gameId: slug });

      socket.on("pickedFromBoneyardResponse", ({ pickedTile }) => {
        const tile = {
          id: Number(`${pickedTile[0]}${pickedTile[1]}`),
          tile: pickedTile,
        };
        console.log("tile", tile);
        resolve(tile as unknown as tileType);
      });

      socket.on("pickedFromBoneyardError", (error) => {
        toast.error(error);
        reject(new Error(error));
      });

      // setTimeout(() => {
      //   toast.error("Request timed out");
      //   reject(new Error("Request timed out"));
      // }, 5000);
    });
  };

  const requestTile = (
    instant: boolean,
    callbackID: number,
    required?: number[],
    amount?: number
  ) => {
    setDistCallback((arr) => {
      const requestSpec = {
        active: true,
        distribute: false,
        instant: instant,
        drawAmount: instant && amount ? amount : 0,
        callbacks: [arr[callbackID]],
      };
      setBoneYardDistSpec((prevObj) => ({ ...prevObj, ...requestSpec }));

      return arr;
    });
  };

  const registerDistCallback = (
    callback: (position: numberPair) => Promise<tileType | undefined>
  ) => {
    setDistCallback((prevArr) => [...prevArr, callback]);
    return distCallback.length;
  };

  const unRegisterDistCallback = (index: number) => {
    setDistCallback((prevArr) => {
      const newList = [...prevArr];
      newList.splice(index, 1);
      return newList;
    });
  };

  useEffect(() => {
    API.get(`/game/${slug}`)
      .then(({ data }) => {
        if (!data.data || data.data.players.length === 0) {
          return toast.error("Game not found");
        }
        setGame(data.data);
      })
      .catch((err) => {
        toast.error("Game not found");
        setTimeout(() => router.push("/"), 2000);
      });
  }, [slug]);

  useEffect(() => {
    if (socket) {
      socket.on("boneyard", ({ choices: userDeck, isTurn }) => {
        if (!distributeTile.current.length) {
          distributeTile.current = makeTile(userDeck);
          setDeck(userDeck);
          setIsTurn(isTurn);
        }
      });

      socket.on("userPlayed", () => setIsTurn(false));

      socket.on(
        "opponentPlayed",
        ({ tile, gameboard, isTurn: isCurrentTurn }) => {
          setIsTurn(isCurrentTurn);

          const playedTile = { id: tile.id, tile: tile.tile } as tileType;
          const temp = gameboard[gameboard.length - 1].tileConnectedTo;
          const playedTileConnectedTo = {
            id: temp?.id,
            tile: temp?.tile,
          } as tileType;

          setOpponentPlay({
            tilePlayed: playedTile,
            playedOn: playedTileConnectedTo.id
              ? playedTileConnectedTo
              : { id: 0, tile: [0, 0] },
          });
        }
      );

      socket.on("gameWon", ({ tiles, points }) => {
        setIsTurn(false);
        setCanPlay(false);
        const newTiles = tiles.map((tile: numberPair) => ({
          id: Number(`${tile[0]}${tile[1]}`),
          tile,
        }));
        setPlayerWin({ points, tiles: newTiles });
        setFirstPlayer(-2);
      });
      socket.on("opponentWon", ({ tiles, points }) => {
        setIsTurn(false);
        setCanPlay(false);
        const newTiles = tiles.map((tile: numberPair) => ({
          id: Number(`${tile[0]}${tile[1]}`),
          tile,
        }));
        setOpponentWin({ points, tiles: newTiles });
        setFirstPlayer(-2);
      });

      socket.on("gameOver", ({ winner, loser, tiles, points, youWin }) => {
        setIsTurn(false);
        setCanPlay(false);
        const newTiles = tiles.map((tile: numberPair) => ({
          id: Number(`${tile[0]}${tile[1]}`),
          tile,
        }));
        setGameOver({ winner, loser });
        if (youWin) {
          setPlayerWin({ points, tiles: newTiles });
        } else {
          setOpponentWin({ points, tiles: newTiles });
        }
        setFirstPlayer(-2);
      });

      // Handle resuming game (loading existing state)
      socket.on(
        "resumeGame",
        ({
          gameboard,
          playerTiles,
          isTurn,
          boneyardCount,
          opponentTilesCount,
        }) => {
          console.log("resuming game 1");
          setResumeGame({
            gameboard,
            playerTiles: makeTile(playerTiles),
            boneyardCount,
            opponentTilesCount,
            isTurn,
          });
          setIsTurn(isTurn);
          setCanPlay(isTurn);
          // Set other game state data like boneyard and gameboard here
        }
      );

      return () => {
        socket.off("boneyard");
        socket.off("opponentPlayed");
        socket.off("userPlayed");
        socket.off("resumeGame");
        socket.off("gameWon");
        socket.off("playerReady");
        socket.off("joinGameError");
      };
    }
  }, [socket, playerId]);

  useEffect(() => {
    if (!distributeTile.current.length) return;

    setDistCallback((arr) => {
      const requestSpec = {
        active: true,
        distribute: true,
        instant: true,
        drawAmount: 7,
        callbacks: arr,
      };
      setBoneYardDistSpec((prevObj) => ({ ...prevObj, ...requestSpec }));

      return arr;
    });
  }, [distributeTile.current, distCallback]);

  return (
    <GameContext.Provider
      value={{
        draggedTile,
        setDraggedTile,
        recentlyDroppedTile,
        gameOver,
        resumeGame,
        setResumeGame,
        selectFromBoneYard,
        selectFromBoneYardServer,
        deck,
        boneYardDistSpec,
        setBoneYardDistSpec,
        setDeck,
        permits,
        setPermits,
        playerWin,
        opponentWin,
        isTurn,
        setIsTurn,
        registerDistCallback,
        unRegisterDistCallback,
        requestTile,
        playerId,
        firstPlayer,
        setFirstPlayer,
        canPlay: canPlay && isTurn,
        setCanPlay,
        opponentPlay,
        setOpponentPlay,
        oppenentPullFrom,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
