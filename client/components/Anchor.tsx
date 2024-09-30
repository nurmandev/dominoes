import React, { useState } from "react";
import DominoesTile from "./DominoesTile";
import DropZone from "./DropZone";
import { useSpring, animated, config } from "@react-spring/web";
import { AnchorProp } from "@/types";
import { useGameContext } from "./GameProvider";

function Anchor({
  root,
  coordinates,
  tilt,
  tile,
  canAccept,
  scale,
  initailSetAnchor,
  activeHover,
}: AnchorProp) {
  const springProp = useSpring({
    top: coordinates[1],
    left: coordinates[0],
    transform: `scale(${scale}) rotate(${tilt}deg)`,
    config: config.gentle,
  });
  const [drop, setDrop] = useState(true);
  const [dropCount, setDropCount] = useState(0);
  const { draggedTile, opponentPlay } = useGameContext();

  const registerDrop = (_: number) => {
    const type =
      root && tile.tile[0] === tile.tile[1] ? "spinner" : "not-spinner";
    setDropCount((count) => count + 1);
    setDrop(
      (dropCount + 1 <= 2 && type === "not-spinner") ||
        (dropCount + 1 <= 4 && type === "spinner")
    );
  };

  return (
    <animated.div className="absolute w-fit top " style={{ ...springProp }}>
      <DominoesTile tile={tile} />
      <div className="  absolute  top-1/2 left-1/2">
        {drop &&
          canAccept.some((i) =>
            (draggedTile || opponentPlay?.tilePlayed)?.tile.includes(i)
          ) && (
            <DropZone
              position={null}
              id={tile.id}
              {...{ activeHover, initailSetAnchor, scale, registerDrop }}
            />
          )}
      </div>
    </animated.div>
  );
}
export default Anchor;
