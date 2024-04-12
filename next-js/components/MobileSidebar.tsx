import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useWallet } from "@solana/wallet-adapter-react";
import { obfuscatePubKey } from "@/context/transactions";
import { Game, SidebarOpenElement, ToggleGameToken } from "./Sidebar";
import FomoExitIcon from "@/public/assets/FomoExitIcon";
import FomoPlayIcon from "@/public/assets/FomoPlayIcon";
import Dollar from "@/public/assets/Dollar";
import Flag from "@/public/assets/Flag";
import Fomo from "@/public/assets/Fomo";
import Twitter from "@/public/assets/Twitter";
import Birdeye from "@/public/assets/Birdeye";
import Telegram from "@/public/assets/Telegram";
import Home from "@/public/assets/Home";

export default function Sidebar({ mobileSidebar }: { mobileSidebar: boolean }) {
  const wallet = useWallet();
  const [showExitTokens, setShowExitTokens] = useState(false);
  const [showPlayTokens, setShowPlayTokens] = useState(false);

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
      src: "",
      token: "Dice To Win",
      link: "/dice", // Update the links to include "/"
      active: false,
    },
    {
      src: "",
      token: "Coin Flip",
      link: "/coinflip", // Update the links to include "/"
      active: false,
    },
    {
      src: "",
      token: "Options",
      link: "/options", // Update the links to include "/"
      active: false,
    },
  ]);

  const fomoToken = [
    {
      src: "/assets/sol.png",
      token: "SOL",
      active: true,
    },
    {
      src: "/assets/jup.png",
      token: "JUP",
      active: false,
    },
    {
      src: "/assets/usdt.png",
      token: "USDT",
      active: false,
    },
  ];

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

  const openLinkCss =
    "w-full gap-2 flex items-center justify-center text-sm font-semibold text-white text-opacity-50 hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out bg-[#191A1D] rounded-md text-center py-2 mb-2";

  return (
    <div
      className={`${
        mobileSidebar ? "fadeIn fixed" : "fadeOutDown hidden"
      } top-[6.6rem] z-20 md:hidden bg-[#121418] no-scrollbar overflow-y-auto text-white flex flex-col justify-between w-full h-[calc(100vh-11.2rem)]`}
    >
      <div className="w-full">
        <div
          className={`${
            mobileSidebar ? "fadeInUp" : "fadeOutDown"
          } w-full flex flex-row items-center pl-5 gap-2 h-[4.4rem] border-b border-[#1E2220]`}
        >
          <div className="cursor-pointer transition-all flex items-center justify-center rounded-md min-w-[3rem] min-h-[3rem] bg-[#212121]">
            <Image
              src={"/assets/logowhite.svg"}
              width={35}
              height={35}
              alt={"FOMO"}
              className=""
            />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-base font-semibold text-white text-opacity-90 font-chakra">
              $FOMO
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-[#94A3B8] font-medium font-chakra leading-3">
                $0.3113
              </span>
              <span
                className={`text-xs text-[#72F238] font-medium pt-[0.1px] leading-[0.6rem]`}
              >
                +2.57%
              </span>
            </div>
          </div>
        </div>
        <div
          className={`${
            mobileSidebar ? "fadeInUp" : "fadeOutDown"
          } w-full flex flex-col p-4`}
        >
          <SidebarOpenElement text={"Home"} Icon={Home} />
          <div className={`mt-0`}>
            <div className="w-full transition-all cursor-pointer rounded-md flex items-center justify-between gap-2 pl-4 pr-2 py-2 bg-transparent hover:bg-[#1f2024] focus:bg-[#1f2024] group">
              <div className="flex items-center gap-2">
                <FomoExitIcon className="min-w-[1rem] min-h-[1rem] transition-all text-[#ababac] group-hover:text-[#9945FF] group-focus:text-[#9945FF]" />
                <span className="mt-0.5 transition-all text-base font-changa text-[#c4c4c5] group-hover:text-white group-focus:text-white">
                  FOMO: Exit
                </span>
              </div>
              <button
                className={`${
                  showExitTokens ? "bg-white/10" : "bg-[#1D1A21]"
                } hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out rounded-md p-3`}
                onClick={() => setShowExitTokens(!showExitTokens)}
              >
                <Image
                  src={
                    showExitTokens
                      ? "/assets/upArrow.png"
                      : "/assets/downArrow.png"
                  }
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
                      token.active ? "bg-white/10" : "hover:bg-[#191a1d]"
                    } flex items-center rounded-md p-2 pl-6 gap-2`}
                  >
                    <Image src={token.src} alt="" width={15} height={15} />
                    <span
                      className={`font-changa ${
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
          <div className={`mt-0`}>
            <div className="w-full transition-all cursor-pointer rounded-md flex items-center justify-between gap-2 pl-4 pr-2 py-2 bg-transparent hover:bg-[#1f2024] focus:bg-[#1f2024] group">
              <div className="flex items-center gap-2">
                <FomoPlayIcon className="min-w-[1rem] min-h-[1rem] transition-all text-[#ababac] group-hover:text-[#9945FF] group-focus:text-[#9945FF]" />
                <span className="mt-0.5 transition-all text-base font-changa text-[#c4c4c5] group-hover:text-white group-focus:text-white">
                  FOMO: Play
                </span>
              </div>
              <button
                className={`${
                  showPlayTokens ? "bg-white/10" : "bg-[#1D1A21]"
                } hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out rounded-md p-3`}
                onClick={() => setShowPlayTokens(!showPlayTokens)}
              >
                <Image
                  src={
                    showPlayTokens
                      ? "/assets/upArrow.png"
                      : "/assets/downArrow.png"
                  }
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
                      token.active ? "bg-white/10" : "hover:bg-[#191a1d]"
                    } flex items-center rounded-md p-2 pl-6 gap-2`}
                  >
                    <Image src={token.src} alt="" width={15} height={15} />
                    <span
                      className={`font-changa ${
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
          <SidebarOpenElement text={"DCA"} Icon={Dollar} />
          <SidebarOpenElement text={"Roadmap"} Icon={Flag} />
          <SidebarOpenElement text={"Buy FOMO"} Icon={Fomo} />
        </div>
      </div>

      <div
        className={`${
          mobileSidebar ? "fadeInUp" : "fadeOutDown"
        } w-full flex flex-col p-4 mb-3`}
      >
        <Link href="/" className={`${openLinkCss}`}>
          <Twitter className="w-4 h-4" />
          Twitter
        </Link>
        <Link href="/" className={`${openLinkCss}`}>
          <Birdeye className="w-4 h-4" />
          Birdeye
        </Link>
        <Link href="/" className={`${openLinkCss}`}>
          <Telegram className="w-4 h-4" />
          Telegram
        </Link>

        <div className="flex items-center justify-center my-2">
          <Image src={"/assets/ottersec.png"} alt="" width={17} height={17} />
          <p className="text-xs font-light text-white/50">
            Audited by OtterSec
          </p>
        </div>
      </div>
    </div>
  );
}
