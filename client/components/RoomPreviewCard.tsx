import React from "react";
import Image from "next/image";
import { Game } from "@/types";
import Link from "next/link";
import { Icons } from "./icons";

function RoomPreviewCard({ game }: { game?: Game }) {
  return (
    <Link href={`/room/${game?.gameId}?join=true`}>
      <div className="px-7 pt-8 pb-6 cursor-pointer bg-main-blue text-white rounded-3xl hover:bg-white/10">
        <h3 className="text-lg font-semibold">
          {game?.players[0]?.user.username}
        </h3>
        <p className="font-medium">Waiting for players...</p>

        <div className="mt-12 flex gap-3 items-center relative">
          {game?.players.map((player, index) => (
            <Image
              key={index}
              width={40}
              height={40}
              src="/default-avatar.png"
              alt=""
              className="w-10 h-10 rounded-2xl"
            />
          ))}
          <Icons.playButton />
        </div>
      </div>
    </Link>
  );
}

export default RoomPreviewCard;
