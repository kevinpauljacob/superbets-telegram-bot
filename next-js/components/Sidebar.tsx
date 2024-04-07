import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import dollar from "/public/assets/dollar.png";
import play from "/public/assets/play.png";
import search from "/public/assets/search.png";
import twitter from "/public/assets/twitter.png";
import telegram from "@/public/assets/telegram.png";
import ottersec from "@/public/assets/ottersec.png";
import upArrow from "@/public/assets/upArrow.png";
import downArrow from "@/public/assets/downArrow.png";
import { useWallet } from "@solana/wallet-adapter-react";
import { obfuscatePubKey, pointTiers } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";

// Define types for game object
type Game = {
  src: string;
  token: string;
  link: string;
  active: boolean;
};

// Define type for game toggle function
type ToggleGameToken = (index: number) => void;

export default function Sidebar() {
  const wallet = useWallet();
  const router = useRouter();
  const [showExitTokens, setShowExitTokens] = useState<boolean>(false);
  const [showPlayTokens, setShowPlayTokens] = useState<boolean>(false);

  const { userData } = useGlobalContext();

  const [exitGames, setExitGames] = useState<Game[]>([
    {
      src: "/assets/sol.png",
      token: "SOL",
      link: "",
      active: false,
    },
    {
      src: "/assets/jup.png",
      token: "JUP",
      link: "",
      active: false,
    },
    {
      src: "/assets/usdt.png",
      token: "USDT",
      link: "",
      active: false,
    },
  ]);

  const [casinoGames, setCasinoGames] = useState<Game[]>([
    {
      src: "/assets/sol.png",
      token: "Dice To Win",
      link: "/dice", // Update the links to include "/"
      active: false,
    },
    {
      src: "/assets/jup.png",
      token: "Coin Flip",
      link: "/coinflip", // Update the links to include "/"
      active: false,
    },
    {
      src: "/assets/usdt.png",
      token: "Options",
      link: "/options", // Update the links to include "/"
      active: false,
    },
  ]);

  const toggleExitToken: ToggleGameToken = (index) => {
    const updatedExitGames = exitGames.map((token, i) => ({
      ...token,
      active: i === index ? !token.active : false,
    }));
    setExitGames(updatedExitGames);
  };

  const toggleCasinoToken: ToggleGameToken = (index) => {
    const updatedCasinoGames = casinoGames.map((token, i) => ({
      ...token,
      active: i === index ? !token.active : false,
    }));
    setCasinoGames(updatedCasinoGames);
  };

  useEffect(() => {
    // Function to update active state based on current path
    const updateActiveState = (path: string) => {
      // Update the active state for exit games
      setExitGames((prevExitGames) =>
        prevExitGames.map((game) => ({
          ...game,
          active: game.link === path,
        })),
      );

      // Update the active state for casino games
      setCasinoGames((prevCasinoGames) =>
        prevCasinoGames.map((game) => ({
          ...game,
          active: game.link === path,
        })),
      );
    };

    // Call the function initially with the current pathname
    updateActiveState(router.pathname);

    // Return a cleanup function
    return () => {
      // Cleanup code here (if any)
    };
  }, [router.pathname]);

  useEffect(() => {
    // Function to check if any game link matches the current pathname
    const isGameActive = (games: Game[]) => {
      return games.some((game) => game.link === router.pathname);
    };

    // Update showExitTokens based on exit game links
    setShowExitTokens(isGameActive(exitGames));

    // Update showPlayTokens based on casino game links
    setShowPlayTokens(isGameActive(casinoGames));
  }, [router.pathname, exitGames, casinoGames]);

  return (
    <div
      className={`hidden bg-[#121418] text-white md:flex flex-col justify-between px-3.5 pb-3.5 w-[290px] h-[calc(100vh-118px)]`}
    >
      <div>
        <div className="flex flex-col rounded-md py-3.5 ">
          <div className="flex items-center w-full mb-2 justify-around">
            <Image
              src={`/assets/badges/T-${userData?.tier ?? 0}.png`}
              alt="userBadge"
              width={55}
              height={55}
            />
            <div className="ml-1">
              <p className="text-white/75 font-changa text-xl">
                {obfuscatePubKey(wallet.publicKey?.toBase58() ?? "")}
              </p>
              <p className="text-white/50 font-chakra font-bold text-sm">
                {userData?.points &&
                  Object.entries(pointTiers).reduce((prev, next) => {
                    return userData.points >= next[1]?.limit ? next : prev;
                  })[1].label}
              </p>
            </div>
          </div>
          <Link
            href=""
            className="text-center font-chakra text-base font-medium hover:bg-[#9945FF] transition duration-300 ease-in-out hover:text-white hover:transition hover:duration-300 hover:ease-in-out text-[#9945FF] border border-[#9945FF] rounded-md py-1.5 w-full"
          >
            View Dashboard
          </Link>
        </div>
        <div>
          <div className="mt-4">
            <div
              className={`flex items-center justify-between rounded-md p-1 ${
                showExitTokens ? "bg-[#161519]" : ""
              }`}
            >
              <p className="flex items-center">
                <Image src={dollar} alt="" width={22} height={22} />
                <span
                  className={`${
                    showExitTokens ? "text-opacity-75" : "text-opacity-50"
                  } text-base font-changa text-white ml-2 `}
                >
                  Exit Games
                </span>
              </p>
              <button
                className={`${
                  showExitTokens ? "bg-white/10" : "bg-[#1D1A21]"
                } hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out rounded-md p-3`}
                onClick={() => setShowExitTokens(!showExitTokens)}
              >
                <Image
                  src={showExitTokens ? upArrow : downArrow}
                  alt=""
                  width={10}
                  height={10}
                  className=""
                />
              </button>
            </div>
            {showExitTokens && (
              <ul className="mt-1">
                {exitGames.map((token, index) => (
                  <Link
                    href={token.link}
                    key={index}
                    onClick={() => toggleExitToken(index)}
                    className={`${
                      token.active ? "bg-white/10" : ""
                    } flex items-center rounded-md p-2`}
                  >
                    <Image src={token.src} alt="" width={18} height={18} />
                    <span
                      className={`ml-3 font-changa ${
                        token.active ? "text-[#7839C5]" : "text-white/50"
                      }`}
                    >
                      ${token.token}
                    </span>
                  </Link>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4">
            <div
              className={`flex items-center justify-between rounded-md p-1 ${
                showPlayTokens ? "bg-[#161519]" : ""
              }`}
            >
              <p className="flex items-center">
                <Image src={play} alt="" width={22} height={22} />
                <span
                  className={`${
                    showPlayTokens ? "text-opacity-75" : "text-opacity-50"
                  } text-base font-changa text-white ml-2 `}
                >
                  Casino Games
                </span>
              </p>
              <button
                className={`${
                  showPlayTokens ? "bg-white/10" : "bg-[#1D1A21]"
                } hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out rounded-md p-3`}
                onClick={() => setShowPlayTokens(!showPlayTokens)}
              >
                <Image
                  src={showPlayTokens ? upArrow : downArrow}
                  alt=""
                  width={10}
                  height={10}
                  className=""
                />
              </button>
            </div>
            {showPlayTokens && (
              <ul className="mt-1">
                {casinoGames.map((token, index) => (
                  <Link
                    href={token.link}
                    key={index}
                    onClick={() => toggleCasinoToken(index)}
                    className={`${
                      token.active ? "bg-white/10" : ""
                    } flex items-center rounded-md p-2`}
                  >
                    <Image src={token.src} alt="" width={18} height={18} />
                    <span
                      className={`ml-3 font-changa ${
                        token.active ? "text-[#7839C5]" : "text-white/50"
                      }`}
                    >
                      {token.token}
                    </span>
                  </Link>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div>
        <div className="flex flex-col">
          <Link
            href="/"
            className="hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out bg-[#181A1D] rounded-md text-center font-bold text-white/50 py-2 mb-1.5"
          >
            DCA
          </Link>
          <Link
            href="/"
            className="hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out bg-[#181A1D] rounded-md text-center font-bold text-white/50 py-2 mb-1.5"
          >
            Roadmap
          </Link>
          <Link
            href="/"
            className="hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out bg-[#181A1D] rounded-md text-center font-bold text-white/50 py-2 mb-1.5"
          >
            Buy $FOMO
          </Link>
        </div>
        <div className="mt-9">
          <div className="flex justify-center">
            <Image
              src={search}
              alt=""
              width={14}
              height={14}
              className="mx-1.5"
            />
            <Image
              src={twitter}
              alt=""
              width={18}
              height={14}
              className="mx-1.5"
            />
            <Image
              src={telegram}
              alt=""
              width={18}
              height={15}
              className="mx-1.5"
            />
          </div>
          <div className="flex items-center justify-center my-3">
            <Image src={ottersec} alt="" width={17} height={17} />
            <p className="text-xs font-light text-white/50">
              Audited by OtterSec
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
