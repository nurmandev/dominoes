import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useGameContext } from "./GameProvider";
import useDistributor from "@/hooks/useDistributor";
import {
  animated,
  config,
  useChain,
  useSpringRef,
  useTransition,
} from "@react-spring/web";
import DominoesTile from "./DominoesTile";
import { numberPair, tileType } from "@/types";
import { useSocket } from "./SocketProvider";

function OpponentDeck() {
  const { oppenentPullFrom, opponentPlay, playerWin, opponentWin, resumeGame } =
    useGameContext();
  const [hand, setHand, from, boundRef, tileRequestApi] = useDistributor();
  const { socket } = useSocket();
  const springRef = useSpringRef();
  const [points, setPoints] = useState(0);
  const [transform, setTransform] = useState("");

  const transRef = useSpringRef();
  const transitions = useTransition(hand, {
    ref: transRef,
    from: {
      transform: from ? `translate(${-from[0]}px, ${-from[1]}px)` : "",
      opacity: 0, // Start hidden
    },
    enter: {
      opacity: 1, // Fade in on reveal
      width: "100%",
      transform: `translate(0px, 0px)`,
    },
    leave: { width: "0%", opacity: 0 }, // Fade out on removal
    config: config.stiff,
  });

  const [revealed, setRevealed] = useState(false);

  useChain([springRef, transRef], [0, 0]);

  useEffect(() => {
    if (playerWin) {
      setTimeout(() => {
        setRevealed(true);
        setHand(playerWin.tiles);
        setTransform(`translate(0px, 150px)`);
      }, 1000);
      setTimeout(() => {
        setTransform(`translate(0px, 500px)`);
        setHand([]);
      }, 5000);
      setTimeout(() => {
        setTransform(`translate(0px,0px)`);
        setRevealed(false);
      }, 5500);
    }
  }, [playerWin]);

  useEffect(() => {
    if (opponentWin) {
      setPoints((prev) => prev + opponentWin.points);
    }
  }, [opponentWin]);

  useEffect(() => {
    if (!opponentPlay) return;
    const selectLastTile = () => {
      const parent = boundRef.current;
      if (parent) {
        const children = parent.children;
        const lastChild = children[children.length - 1];

        setHand((prevArr: tileType[]) => {
          const newArr = [...prevArr];
          newArr.pop();
          return newArr;
        });

        if (lastChild) {
          const rect = lastChild.getBoundingClientRect();
          return [rect.x, rect.y] as numberPair;
        }
      }
    };

    const lastTilecoor = selectLastTile();
    if (lastTilecoor) oppenentPullFrom.current = lastTilecoor;
  }, [boundRef, oppenentPullFrom, opponentPlay, setHand]);

  useEffect(() => {
    if (socket) {
      socket.on("opponentPickedFromBoneyard", () => {
        tileRequestApi(1);
      });

      return () => {
        socket.off("opponentPickedFromBoneyard");
      };
    }
  }, [socket]);

  useEffect(() => {
    if (!resumeGame) return;
    setHand(
      Array.from({ length: resumeGame.opponentTilesCount }, () => ({
        id: 0,
        tile: [0, 0] as numberPair,
      }))
    );
  }, [resumeGame]);

  return (
    <div
      id="other-player"
      className="absolute gap-2 top-0 bg-main-gray w-[260px] rounded-b-9 flex p-2 items-center z-40"
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
      <div
        ref={boundRef}
        className="relative flex-1 flex self-start items-center w-full h-[60px]"
        style={{ gap: revealed ? "4px" : 0 }}
      >
        {transitions((style, item) => (
          <div
            className={`relative h-full ${
              revealed ? "" : "w-6"
            } overflow-x-visible`}
            key={item.id}
          >
            <animated.div
              style={{
                ...style,
                transform: revealed ? transform : style.transform,
              }}
              className="h-full drop-shadow-2xl"
            >
              <DominoesTile tile={item} size={revealed ? "" : "small"} />
            </animated.div>
          </div>
        ))}
      </div>
      <div className="text-center ml-auto">
        <p>{points}</p>
        <p className="text-xs text-[#afb7c1]">points</p>
      </div>
    </div>
  );
}

export default OpponentDeck;
