import React, { useEffect, useState } from "react";
import { useHover } from "@use-gesture/react";
import { DropZoneProp } from "@/types";
import { useGameContext } from "./GameProvider";

function DropZone({
  position,
  initailSetAnchor,
  id,
  scale,
  registerDrop,
}: DropZoneProp) {
  const {
    draggedTile,
    recentlyDroppedTile,
    opponentPlay,
    oppenentPullFrom,
    setOpponentPlay,
    setIsTurn,
  } = useGameContext();

  const bind = useHover(({ xy: [x, y], hovering }) => {
    if (hovering) {
      if (draggedTile) {
        recentlyDroppedTile.current = draggedTile;
        registerDrop(1);
        console.log("hello");
        initailSetAnchor(draggedTile, [x, y], id);
        setIsTurn(false);
      }
    }
  });

  useEffect(() => {
    if (opponentPlay?.playedOn?.id === id) {
      initailSetAnchor(
        opponentPlay.tilePlayed,
        oppenentPullFrom.current,
        id,
        true
      );
      setOpponentPlay(null);
    }
  }, [opponentPlay]);

  return (
    <div
      {...bind()}
      className={`-translate-x-1/2 -translate-y-1/2 ${"bg-main-orange/50"}  `}
      style={{
        width: `${400 * scale}px`,
        height: `${400 * scale}px`,
        position: "absolute",
        top: position ? `${position[1]}px` : "0",
        left: position ? `${position[0]}px` : "0",
        transition: "background-color 100ms ease-in-out 10ms",
      }}
    />
  );
}

export default DropZone;
