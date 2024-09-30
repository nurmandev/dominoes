"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import PlayerProfileCard from "../../../components/PlayerProfileCard";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import { Socket } from "socket.io-client";
import { Game } from "@/types";
import createAPI from "@/utils/api";
import Link from "next/link";
import { useSocket } from "@/components/SocketProvider";
import useCurrentUser from "@/hooks/useCurrentUser";

function RoomPage({ params }: { params: { slug: string } }) {
  const { socket } = useSocket();
  const { slug } = params;
  const API = createAPI();
  const [game, setGame] = useState<Game | null>(null);
  const { user } = useCurrentUser();
  const router = useRouter();
  const [privacyToggle, setPrivacyToggle] = useState(false);
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [dropdownToggle, setDropdownToggle] = useState(false);
  const dropdownRef = useRef(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const playerId = useMemo(
    () =>
      game?.players.findIndex((player) => player.user._id === user?._id) ?? -1,
    [game?.players, user?._id]
  );
  const isParticipating = game?.players.some(
    (player) => player.user._id === user?._id
  );

  const startCountdown = () => {
    if (!socket) {
      toast.error("Socket disconnected");
      return;
    }
    setCountdown(3);
    const intervalId = setInterval(() => {
      setCountdown((prevCount) => {
        if (!prevCount) {
          return null;
        }
        if (prevCount <= 1) {
          clearInterval(intervalId);
          router.push(`/room/${params.slug}/game`);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
  };

  const handleReady = () => {
    console.log("event emmieted", game?.players?.length, !isParticipating);
    if (game?.players?.length === 1 && !isParticipating) {
      socket?.emit("joinGame", { gameId: slug });
    } else if (game?.players?.length === 2) {
      socket?.emit("ready", {
        gameId: slug,
        player: playerId,
      });
    }
  };

  const handlePrivacyToggleClick = () => {
    // handle toggle slider functionality
    setPrivacyToggle((prevState) => !prevState);
  };

  useEffect(() => {
    if (socket) {
      API.get(`/game/${slug}`)
        .then(({ data }) => {
          if (!data.data || data?.data?.players?.length === 0) {
            return toast.error("Game not found");
          }
          setGame(data.data);
          setPrivacyToggle(data.data.isPrivate);
        })
        .catch((err) => {
          toast.error("Game not found");
          setTimeout(() => router.push("/"), 2000);
        });

      socket.on("gameJoined", (joinedGame) => {
        console.log("gameJoined", joinedGame);
        setGame(joinedGame.game);
      });
      socket.on("playerReady", (player) => {
        player === 0
          ? setPlayer1Ready(true)
          : player === 1
          ? setPlayer2Ready(true)
          : null;
      });
      socket.on("joinGameError", () => {
        toast.error("Game not found or game is already filled");
        setTimeout(() => router.push("/"), 2000);
      });

      return () => {
        socket.off("gameJoined");
        socket.off("playerReady");
        socket.off("joinGameError");
      };
    }
  }, [socket]);

  useEffect(() => {
    if (player1Ready && player2Ready) {
      startCountdown();
    }
  }, [player1Ready, player2Ready]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href + "?join=true");
    toast.success("Link copied to clipboard");
  };

  const handleDropdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDropdownToggle((prevState) => !prevState);
  };

  useEffect(() => {
    const handleMousedown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as HTMLDivElement).contains(e.target as Node)
      ) {
        setDropdownToggle(false);
      }
    };

    document.addEventListener("mousedown", handleMousedown);
    return () => document.removeEventListener("mousedown", handleMousedown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth");
  };

  if (!game) {
    return (
      <div className="w-full h-screen bg-dark-blue flex justify-center items-center">
        <Image
          src="/dominoes.png"
          alt="dominoes"
          width={120}
          height={120}
          className="w-[120px] rounded-2xl h-[120px] animate-pulse"
        />
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="absolute left-0 top-0 h-[35%] w-full ">
        <Image
          fill={true}
          alt="dominios"
          src={"/home-header-backdrop-kRKY7btX.png"}
          style={{ objectFit: "cover" }}
          className=" absolute"
        />
        <div className=" absolute h-full w-full bg-gradient-radial-at-top from-main-blue/40 to-dark-blue" />
      </div>

      <main className="relative w-full px-6 sm:px-9 xl:px-28 z-10">
        <header className="flex justify-between py-6">
          <Link href="/">
            <svg
              className="fill-white h-8 stroke-2 rounded-full p-1 hover:bg-white/10"
              focusable="false"
              aria-hidden="true"
              viewBox="0 0 24 24"
              data-testid="ArrowBackIcon"
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"></path>
            </svg>
          </Link>
          <div
            className="w-10 h-10 rounded-full bg-green-400 relative hover:cursor-pointer"
            onClick={handleDropdownClick}
            ref={dropdownRef}
          >
            <Image
              width={40}
              height={40}
              src="/default-avatar.png"
              alt=""
              className="rounded-full w-10 h-10 bg-lime-400"
            />
            {dropdownToggle && (
              <div className=" absolute right-0 top-12 bg-main-blue rounded-xl w-36  drop-shadow-xl">
                <ul className="*:h-10 *:  py-3">
                  <li
                    className=" capitalize text-white px-4 py-2 flex items-center hover:bg-white/15"
                    onClick={handleLogout}
                  >
                    logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        </header>

        <div className="pt-6">
          <h1 className="pt-5 font-bold font-poppins text-[2rem] text-nowrap sm:text-[2.5rem] xl:text-5xl">
            {game?.players?.length} of 2 players,{" "}
            {countdown && player1Ready && player2Ready ? (
              <span className="pt-5 font-medium text-2xl sm:text-3xl md:text-4xl  text-nowrap block">
                Game starts in {countdown}
              </span>
            ) : (
              <span className="pt-5 font-medium text-2xl sm:text-3xl md:text-4xl  text-nowrap block">
                {game?.players?.length > 1
                  ? "Waiting for players to set ready..."
                  : "Waiting for players to join..."}
              </span>
            )}
          </h1>
        </div>

        <div className="pt-11 flex gap-3 items-center">
          <button
            disabled={
              (isParticipating && game?.players?.length < 2) ||
              (playerId === 0 && player1Ready) ||
              (playerId === 1 && player2Ready)
            }
            onClick={handleReady}
            className="bg-main-orange disabled:bg-[#424C5C] disabled:shadow-none disabled:pointer-events-none disabled:opacity-40 rounded-2xl py-2 px-6 w-fit h-auto flex gap-3 text-nowrap items-center"
          >
            {isParticipating ? "Set Ready" : "Join Game"}
            {"    "}
            <span>
              <svg
                className="fill-white h-6"
                focusable="false"
                aria-hidden="true"
                viewBox="0 0 24 24"
                data-testid="DoneIcon"
              >
                <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"></path>
              </svg>
            </span>
          </button>

          <div className="p-1 w-fit flex items-center gap-2 ">
            <div
              className="w-9 rounded-full hover:bg-white/5 hover:cursor-pointer"
              onClick={handlePrivacyToggleClick}
            >
              <input
                id="pubicToggle"
                type="checkbox"
                checked={privacyToggle}
                onChange={() => {}}
                className={`relative w-0 h-0 before:absolute before:transition-all before:duration-100 before:-top-[13.5px] before:w-4 before:h-4 before:bg-blue-500 before:rounded-full after:absolute after:w-6 after:h-2.5 after:bg-blue-400/35 after:rounded-full after:-top-[10px] ${
                  !privacyToggle ? "before:left-3" : "before:-left-0.5"
                }`}
              />
            </div>
            <p className="capitalize font-normal text-gray-200">
              {privacyToggle ? "private" : "public"}
            </p>
          </div>
        </div>

        <div className="pt-16 pb-8">
          <h5 className="text-xl sm:text-2xl font-medium font-poppins">
            Players
          </h5>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 md:w-fit pt-12">
          {game.players.map((player, i) => (
            <PlayerProfileCard
              isReady={i === 0 ? player1Ready : player2Ready}
              key={i}
              player={player.user}
            />
          ))}
        </div>

        <div className="mt-[70px] pb-8">
          <h3 className="font-medium text-xl sm:text-2xl font-poppins">
            Invite
          </h3>

          <div className="sm:max-w-[80%] rounded-2xl w-full mt-11 p-6 bg-main-blue shadow-card-shadow">
            <div className="w-full group">
              <textarea
                name="inviteUrl"
                className="bg-transparent outline-none resize-none overflow-hidden w-full h-5 peer"
                readOnly
              >
                {`http://localhost:3000/room/${params.slug}?join=true`}
              </textarea>
              <div className="relative h-px w-full rounded-full bg-gray-200 group-hover:h-0.5 peer-focus:h-0.5 after:w-full after:h-full after:absolute after:top-0 after:left-0 after:hidden  after:bg-main-orange after:peer-focus:block after:peer-focus:animate-expand" />
            </div>

            <p className="mt-3 text-base font-[500] text-gray-400">
              Invite players by sharing this link
            </p>

            <div className="py-3 w-full">
              <div className="flex justify-end gap-2">
                <div
                  onClick={handleCopy}
                  className="uppercase px-1.5 text-[#5088b9] font-light flex items-center hover:cursor-pointer hover:bg-white/5 rounded-2xl"
                >
                  <span className="">copy</span>

                  <svg
                    className="fill-[#5088b9] ml-2 h-5 "
                    focusable="false"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    data-testid="ContentCopyIcon"
                  >
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m0 16H8V7h11z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RoomPage;
