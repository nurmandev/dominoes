import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useGameContext } from "./GameProvider";
import { User } from "@/types";
import { useRouter } from "next/navigation";

function GameOver() {
  const { gameOver } = useGameContext();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [winner, setWinner] = useState<{ user: User; score: number } | null>(
    null
  );
  const [loser, setLoser] = useState<{ user: User; score: number } | null>(
    null
  );

  useEffect(() => {
    if (gameOver) {
      setTimeout(() => {
        setIsVisible(true);
        setWinner(gameOver.winner);
        setLoser(gameOver.loser);
      }, 5500);
    }
  }, [gameOver]);

  if (!isVisible) {
    return null;
  } else {
    return (
      <div className="fixed inset-0 flex justify-center items-center h-full w-full z-50  ">
        <div className="bg-main-gray rounded-xl p-8 flex flex-col items-center w-5/6 md:w-2/5 shadow-md">
          <div className=" text-3xl md:text-6xl font-bold mb-3">Gave Over</div>
          <div className=" mb-5">{winner?.user.username}</div>
          <div className="w-[100px] h-[100px] mb-10">
            <Image
              src="/default-avatar.png"
              width={100}
              height={100}
              alt="avatar"
              className="rounded-full"
            />
          </div>
          <div className="flex items-center justify-between w-full mb-5">
            <div className="flex items-center gap-5">
              <div className="bg-main-blue rounded-full py-1 px-2">1</div>
              <div className="w-[30px] h-[30px]">
                <Image
                  src="/default-avatar.png"
                  width={30}
                  height={30}
                  alt="avatar"
                  className="rounded-full"
                />
              </div>
              <div className="">{winner?.user.username}</div>
            </div>
            <div>{winner?.score}</div>
          </div>
          <div className="flex items-center justify-between w-full mb-14">
            <div className="flex items-center gap-5">
              <div className="bg-main-blue rounded-full py-1 px-2">2</div>
              <div className="w-[30px] h-[30px]">
                <Image
                  src="/default-avatar.png"
                  width={30}
                  height={30}
                  alt="avatar"
                  className="rounded-full"
                />
              </div>
              <div className="">{loser?.user.username}</div>
            </div>
            <div>{loser?.score}</div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-main-orange shadow-none font-medium rounded-2xl py-2 px-6 w-full h-auto  gap-3 text-nowrap"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }
}

export default GameOver;
