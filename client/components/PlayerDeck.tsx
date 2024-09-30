import React, { useEffect, useState } from "react";
import Image from "next/image";
import DeckTile from "./DeckTile";
import {
  useTransition,
  animated,
  useSpring,
  config,
  useChain,
  useSpringRef,
} from "@react-spring/web";
import { useGameContext } from "./GameProvider";
import useDistributor, { requestType } from "@/hooks/useDistributor";
import { numberPair, tileType } from "@/types";
import { TileAlignSpec } from "@/utils/game-utils";

interface PlayerDeckProps {
  anchors: TileAlignSpec[];
}

const PlayerDeck: React.FC<PlayerDeckProps> = ({ anchors }) => {
  const {
    canPlay,
    draggedTile,
    isTurn,
    setBoneYardDistSpec,
    opponentWin,
    playerWin,
    resumeGame,
  } = useGameContext();
  const [hand, setHand, from, boundRef, tileRequestApi] = useDistributor(
    requestType.MAIN_DECK
  );
  const [revealed, setRevealed] = useState(false);
  const [points, setPoints] = useState(0);
  const [transform, setTransform] = useState("");

  const canPlayStyles = canPlay ? "" : "opacity-80 pointer-events-none ";

  const springRef = useSpringRef();
  const springProp = useSpring({
    ref: springRef,
    width: hand.length * 64 - 4,
    config: config.stiff,
  });

  const transRef = useSpringRef();
  const transitions = useTransition(hand, {
    ref: transRef,
    from: {
      transform: from
        ? `translate(${-from[0]}px, ${-from[1]}px) scale(0.5)`
        : "",
    },
    enter: {
      width: "100%",
      transform: `translate(0px, 0px) scale(1)`,
    },
    leave: { width: "0%" },
    config: config.stiff,
  });

  useChain([springRef, transRef], [0, 0]);

  const onDropComplete = ({ id }: { id: number }) => {
    setHand((prevArr: tileType[]) => prevArr.filter((tile) => tile.id !== id));
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (anchors.length > 0) {
        if (isTurn && canPlay && !checkPlayerDeckMatches(hand, anchors)) {
          tileRequestApi();
        } else {
          setBoneYardDistSpec({
            active: false,
            distribute: false,
            instant: false,
            drawAmount: 0,
            required: [],
            callbacks: [],
          });
        }
      }
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [anchors, hand, isTurn]);

  useEffect(() => {
    if (opponentWin) {
      setTimeout(() => {
        setRevealed(true);
        setTransform(`translate(0px, -100px)`);
      }, 1000);
      setTimeout(() => {
        setTransform(`translate(0px, -500px)`);
        setHand([]);
      }, 5000);
      setTimeout(() => {
        setTransform(`translate(0px,0px)`);
        setRevealed(false);
      }, 5500);
    }
  }, [opponentWin]);

  useEffect(() => {
    if (playerWin) {
      setPoints((prev) => prev + playerWin.points);
    }
  }, [playerWin]);

  useEffect(() => {
    if (!resumeGame) return;
    setHand(resumeGame?.playerTiles);
  }, [resumeGame]);

  function checkPlayerDeckMatches(
    playerDeck: tileType[],
    anchors: TileAlignSpec[]
  ): boolean {
    for (const deckTile of playerDeck) {
      for (const anchor of anchors) {
        if (anchor.canAccept.some((i) => deckTile.tile.includes(i))) {
          return true;
        }
      }
    }
    return false;
  }

  return (
    <div
      id="current-player"
      className="absolute -bottom-2 bg-[#617187] w-[calc(100%_+_6px)] rounded-t-9 -left-0.5 flex p-2 justify-between items-center "
      style={{
        zIndex: draggedTile ? 0 : 20,
      }}
    >
      <div className="w-[60px] h-[60px]">
        <Image
          src="/default-avatar.png"
          width={60}
          height={60}
          alt="avatar"
          className="rounded-lg"
        />
      </div>

      <animated.div
        ref={boundRef}
        style={{ ...springProp }}
        className={`absolute flex left-[50%] translate-x-[-50%] items-center self-end gap-1 h-[120px] ${canPlayStyles}`}
      >
        {transitions((style, tile) => (
          <animated.div
            key={tile?.id}
            style={{
              ...style,
              transform: revealed ? transform : style.transform,
            }}
          >
            <DeckTile {...{ tile, onDropComplete }} />
          </animated.div>
        ))}
      </animated.div>

      <div className="text-center">
        <p>{points}</p>
        <p className="text-xs text-[#afb7c1]">points</p>
      </div>
    </div>
  );
};

export default PlayerDeck;
