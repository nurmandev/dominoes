import React, { useState, useRef, useEffect } from "react";
import DropZone from "./DropZone";
import Anchor from "./Anchor";
import useMeasure from "react-use-measure";
import { numberPair, tileType } from "@/types";
import { useSocket } from "./SocketProvider";
import { useGameContext } from "./GameProvider";
import { useParams } from "next/navigation";
import { TileAlignSpec } from "@/utils/game-utils";

interface GameBoardProps {
  anchors: TileAlignSpec[];
  setAnchors: React.Dispatch<React.SetStateAction<TileAlignSpec[]>>;
}

const GameBoard: React.FC<GameBoardProps> = ({ anchors, setAnchors }) => {
  const [defaultDrop, setDefaultDrop] = useState<boolean>(true);
  const [playBoardRef, bounds] = useMeasure();
  const [tilesBoxRef, tilesBound] = useMeasure();
  const { socket } = useSocket();
  const { playerId, opponentWin, playerWin, resumeGame, setResumeGame } =
    useGameContext();
  const { slug: gameId } = useParams();
  const activeHover = useRef<number | null>(null);
  const droppedTile = useRef<number | null>(null);
  const droppedOn = useRef<number | null>(null);
  const [transform, setTransform] = useState<string>("");
  const [scale, setScale] = useState<number>(1);

  // Padding/Threshold for the board boundaries
  const padding = 60; // Adjust this value as needed

  // Get the center of the game board
  const getBoardCenter = (): numberPair => {
    const midX = (bounds.right - bounds.left) / 2;
    const midY = (bounds.bottom - bounds.top) / 2;
    return [midX, midY];
  };

  // Calculate the bounding area of all the tiles/anchors
  const calculateBoundingBox = () => {
    const xCoordinates = anchors.map((anchor) => anchor._coordinates[0]);
    const yCoordinates = anchors.map((anchor) => anchor._coordinates[1]);

    const minX = Math.min(...xCoordinates);
    const maxX = Math.max(...xCoordinates);
    const minY = Math.min(...yCoordinates);
    const maxY = Math.max(...yCoordinates);

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  // Adjust the bounding box to center the tiles
  const adjustBoundingBoxToCenter = () => {
    const [boardCenterX, boardCenterY] = getBoardCenter();
    const { minX, minY, width, height } = calculateBoundingBox();

    const boundingBoxMidX = minX + width / 2;
    const boundingBoxMidY = minY + height / 2;

    // Calculate the translation needed to center the bounding box on the board
    const translateX = boardCenterX - boundingBoxMidX;
    const translateY = boardCenterY - boundingBoxMidY;

    // Calculate the scaling factor with padding in mind
    const paddedBoardWidth = bounds.width - 2 * padding;
    const paddedBoardHeight = bounds.height - 2 * padding;

    const scaleX = paddedBoardWidth / width;
    const scaleY = paddedBoardHeight / height;
    const newScale = Math.min(scaleX, scaleY, 1); // Ensure scale doesn't exceed 1 (no zooming out if not needed)

    setTransform(`translate(${translateX}px, ${translateY}px)`);
    setScale(newScale);
  };

  const initailSetAnchor = (
    tile: tileType,
    coordinates: numberPair,
    id: number,
    isOpponent = false
  ) => {
    const tileCoordinate: numberPair = [
      coordinates[0] - tilesBound.x,
      coordinates[1] - tilesBound.y,
    ];
    const newTile = new TileAlignSpec(tile, tileCoordinate);
    setAnchors((prevState) => {
      // Check if the tile with the same ID already exists in the state
      const tileExists = prevState.some((anchor) => anchor.id === newTile.id);

      // If the tile exists, replace it; otherwise, add it
      if (tileExists) {
        return prevState.map((anchor) =>
          anchor.id === newTile.id ? newTile : anchor
        );
      }

      // If the tile doesn't exist, add it to the state
      return [...prevState, newTile];
    });

    droppedTile.current = tile.id;
    droppedOn.current = id;

    if (!isOpponent) {
      const triggeredAnchor = anchors.find(
        (anchor) => anchor.id === droppedOn.current
      );

      socket?.emit("tilePlayed", {
        gameId,
        playerId,
        droppedTile: newTile,
        triggeredTile: triggeredAnchor,
      });
    }
  };

  useEffect(() => {
    if (anchors.length === 1) {
      const [midX, midY] = getBoardCenter();
      setAnchors((anchor) =>
        anchor.map((root) => {
          root.root = true;
          root.coordinates = [midX, midY];
          root.scale = 1;
          root.tilt = root.tile[0] === root.tile[1] ? 0 : 90;
          if (socket) {
            socket.emit("updateBoard", {
              gameboardTile: {
                currentTile: root,
              },
              gameId,
            });
          }
          return root;
        })
      );
      setDefaultDrop(false);
    } else {
      if (droppedTile.current !== -1) {
        const triggeredAnchor = anchors.find(
          (anchor) => anchor.id === droppedOn.current
        );
        console.log(droppedTile.current);
        const droppedAnchorIndex = anchors.findIndex(
          (anchor) => anchor.id === droppedTile.current
        );
        const droppedAnchor = anchors[droppedAnchorIndex];
        const newDroppedAnchor = triggeredAnchor?.setConnection(droppedAnchor);
        if (newDroppedAnchor) {
          setAnchors((arr) => {
            const newArr = [...arr];
            newArr[droppedAnchorIndex] = newDroppedAnchor;
            return newArr;
          });
          if (socket) {
            socket.emit("updateBoard", {
              gameboardTile: {
                currentTile: newDroppedAnchor,
                tileConnectedTo: triggeredAnchor,
              },
              gameId,
            });
          }
        }
      }
    }
  }, [anchors.length, socket, gameId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (anchors.length > 0) {
        adjustBoundingBoxToCenter();
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [anchors, bounds]);

  useEffect(() => {
    if (opponentWin || playerWin) {
      const timeoutId = setTimeout(() => {
        setAnchors([]);
        setTransform("");
        setScale(1);
        setDefaultDrop(true);
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [opponentWin, playerWin]);

  useEffect(() => {
    if (!resumeGame || !resumeGame.gameboard.length) return;

    const { gameboard } = resumeGame;
    let index = 0;

    console.log("gameboard 22", gameboard);

    const intervalId = setInterval(() => {
      if (index >= gameboard.length) {
        // Once done setting all anchors, clear the interval and reset the resumeGame state
        clearInterval(intervalId);
        setResumeGame(null);
        return;
      }
      console.log("currentIndex", index, gameboard[index]);
      const tile = {
        id: gameboard[index].currentTile.id,
        tile: gameboard[index].currentTile.tile,
      };
      const [midX, midY] = getBoardCenter();
      const newTile = new TileAlignSpec(tile, [midX, midY]);
      droppedTile.current = tile.id;
      if (index > 0) {
        droppedOn.current = gameboard[index].tileConnectedTo.id;
      }

      setAnchors((prevAnchors) => {
        const updatedAnchors = [...prevAnchors, newTile];
        return updatedAnchors;
      });

      index++;
    }, 500); // Adjust interval duration as needed (e.g., 500ms)

    // Cleanup interval on unmount or when resumeGame changes
    return () => clearInterval(intervalId);
  }, [resumeGame]);

  const registerDrop = (count: number) => {
    if (count !== 0) setDefaultDrop(false);
  };

  return (
    <div
      id="play-board"
      ref={playBoardRef}
      className="absolute top-10 h-3/4 w-full z-0 "
    >
      <div
        className=" w-full h-full"
        ref={tilesBoxRef}
        style={{
          transform: transform, // Apply translation
          scale: scale, // Apply scaling
          transition: "transform 0.3s ease, scale 0.3s ease", // Smooth transition
        }}
      >
        {anchors.map(
          ({ root, coordinates, canAccept, tile, tilt, scale, id }) => {
            return (
              <>
                <Anchor
                  key={id}
                  {...{
                    root,
                    coordinates,
                    tile: { id, tile },
                    tilt,
                    canAccept,
                    scale,
                    initailSetAnchor,
                    activeHover,
                  }}
                />
                <div
                  className="w-1 h-1 bg-red-900 absolute z-50"
                  style={{
                    top: (bounds.bottom - bounds.top) / 2,
                    right: (bounds.right - bounds.left) / 2,
                  }}
                ></div>
              </>
            );
          }
        )}
      </div>
      {defaultDrop && (
        <DropZone
          {...{
            position: [
              (bounds.right - bounds.left) / 2,
              (bounds.bottom - bounds.top) / 2,
            ],
            initailSetAnchor,
            activeHover,
            id: 0,
            scale: 1,
            registerDrop,
          }}
        />
      )}
    </div>
  );
};

export default GameBoard;
