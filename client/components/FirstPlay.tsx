import React from "react";
import { useGameContext } from "./GameProvider";
import GameAlert from "@/components/GameAlert";

function FirstPlay() {
  const { playerId, firstPlayer, playerWin, opponentWin } = useGameContext();

  return (
    <div>
      {firstPlayer > -1 && (
        <GameAlert
          text="First move"
          isTop={firstPlayer !== playerId}
          subText="(highest bone)"
        />
      )}
      {playerWin && (
        <GameAlert
          text={`${playerWin.points}`}
          isTop={false}
          subText="Points"
          delay={5000}
        />
      )}
      {opponentWin && (
        <GameAlert
          text={`${opponentWin.points}`}
          isTop={true}
          subText="Points"
          delay={5000}
        />
      )}
    </div>
  );
}

export default FirstPlay;
