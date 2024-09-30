"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "react-feather";
import PlayerDeck from "@/components/PlayerDeck";
import GameBoard from "@/components/GameBoard";
import { GameProvider, useGameContext } from "@/components/GameProvider";
import OpponentDeck from "@/components/OpponentDeck";
import BoneYard from "@/components/BoneYard";
import FirstPlay from "@/components/FirstPlay";
import { useSocket } from "@/components/SocketProvider";
import useCreateAPI from "@/utils/api";
import { Game } from "@/types";
import useCurrentUser from "@/hooks/useCurrentUser";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { TileAlignSpec } from "@/utils/game-utils";
import GameOver from "@/components/GameOver";

function GamePage({ params }: { params: { slug: string } }) {
  const { socket } = useSocket();
  const API = useCreateAPI();
  const router = useRouter();
  const { slug } = params;
  const [game, setGame] = useState<Game | null>(null);
  const { user } = useCurrentUser();
  const [anchors, setAnchors] = useState<TileAlignSpec[]>([]);

  const playerId = useMemo(
    () =>
      game?.players.findIndex((player) => player.user._id === user?._id) ?? -1,
    [game?.players]
  );

  useEffect(() => {
    API.get(`/game/${slug}`)
      .then(({ data }) => {
        if (!data.data || data.data.players.length === 0) {
          return toast.error("Game not found");
        }
        setGame(data.data);
      })
      .catch((err) => {
        console.log("error", err);
        toast.error("Game not found");
        setTimeout(() => router.push("/"), 2000);
      });
  }, []);

  useEffect(() => {
    if (socket && playerId >= 0) {
      console.log("Emit gamestart");
      socket.emit("startGame", { gameId: params.slug, playerId });
      return () => {
        socket.off("startGame");
      };
    }
  }, [socket, playerId]);

  return (
    <GameProvider>
      <div
        id="game"
        className='bg-dark-blue bg-[url("/game-bg.png")] relative bg-cover justify-center bg-center flex items-end min-w-screen min-h-screen overflow-hidden z-0'
      >
        <GameOver />
        <OpponentDeck />
        <div className="bg-main-blue  relative border-[9px] rounded-2xl border-black-15 w-full min-h-[calc(100vh_-_24px)] h-full max-w-[700px]">
          <div className="bg-main-blue rounded-9 w-full h-full"></div>

          <Link id="back-button" className="pointer-events-auto z-[2]" href="/">
            <div className="absolute flex items-center justify-center z-[2] -left-8 top-12 bg-main-orange w-[60px] h-[60px] rounded-9">
              <ArrowLeft size={24} color="#ffffff" />
            </div>
          </Link>

          <div
            id="game-count"
            className="absolute gap-6 pt-7 pb-4 flex items-center justify-center flex-col -right-8 top-12 bg-main-gray w-[60px] rounded-9"
          >
            <Image
              src="/dots.png"
              width="10"
              height="10"
              alt="dots"
              className="h-2.5 w-2.5 mx-auto"
            />
            <p>20</p>
          </div>
          <PlayerDeck anchors={anchors} />
          <GameBoard anchors={anchors} setAnchors={setAnchors} />
          <BoneYard />
          <FirstPlay />
        </div>
      </div>
    </GameProvider>
  );
}

export default GamePage;
