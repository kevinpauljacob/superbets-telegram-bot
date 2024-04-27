import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import { useWallet } from "@solana/wallet-adapter-react";
import { obfuscatePubKey, pointTiers } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import Home from "@/public/assets/Home";
import FomoExitIcon from "@/public/assets/FomoExitIcon";
import FomoPlayIcon from "@/public/assets/FomoPlayIcon";
import Dollar from "@/public/assets/Dollar";
import Flag from "@/public/assets/Flag";
import Fomo from "@/public/assets/Fomo";
import Twitter from "@/public/assets/Twitter";
import Birdeye from "@/public/assets/Birdeye";
import Telegram from "@/public/assets/Telegram";

// Define types for game object
export type Game = {
  src: string;
  token: string;
  link: string;
  active: boolean;
};

// Define type for game toggle function
export type ToggleGameToken = (index: number) => void;

export default function Sidebar({
  sidebar,
  setSidebar,
}: {
  sidebar: boolean;
  setSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const wallet = useWallet();
  const router = useRouter();
  const { fomoPrice } = useGlobalContext();
  const [showExitTokens, setShowExitTokens] = useState<boolean>(false);
  const [showPlayTokens, setShowPlayTokens] = useState<boolean>(false);

  const { userData, getUserDetails } = useGlobalContext();

  const [exitGames, setExitGames] = useState<Game[]>([
    {
      src: "",
      token: "SOL",
      link: "",
      active: false,
    },
    {
      src: "",
      token: "JUP",
      link: "",
      active: false,
    },
    {
      src: "",
      token: "USDT",
      link: "",
      active: false,
    },
  ]);

  const [casinoGames, setCasinoGames] = useState<Game[]>([
    {
      src: "",
      token: "Dice 2",
      link: "/dice2", // Update the links to include "/"
      active: false,
    },
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

  // useEffect(() => {
  //   // Function to update active state based on current path
  //   const updateActiveState = (path: string) => {
  //     // Update the active state for exit games
  //     setExitGames((prevExitGames) =>
  //       prevExitGames.map((game) => ({
  //         ...game,
  //         active: game.link === path,
  //       })),
  //     );

  //     // Update the active state for casino games
  //     setCasinoGames((prevCasinoGames) =>
  //       prevCasinoGames.map((game) => ({
  //         ...game,
  //         active: game.link === path,
  //       })),
  //     );
  //   };

  //   // Call the function initially with the current pathname
  //   updateActiveState(router.pathname);

  //   // Return a cleanup function
  //   return () => {
  //     // Cleanup code here (if any)
  //   };
  // }, [router.pathname]);

  useEffect(() => {
    // Function to check if any game link matches the current pathname
    const isGameActive = (games: Game[]) => {
      return games.some((game) => game.link === router.pathname);
    };

    // Update showExitTokens based on exit game links
    // setShowExitTokens(isGameActive(exitGames));

    // Update showPlayTokens based on casino game links
    setShowPlayTokens(isGameActive(casinoGames));
  }, [router.pathname, exitGames, casinoGames]);

  useEffect(() => {
    if (!userData && wallet?.publicKey) getUserDetails();
  }, [wallet.publicKey]);

  const topIconCss =
    "cursor-pointer mb-2.5 transition-all flex items-center justify-center rounded-md w-12 h-9 bg-transparent hover:bg-[#1E2024] focus:bg-[#1E2024] text-[#ababac] hover:text-[#9945FF] focus:text-[#9945FF]";
  const bottomIconCss =
    "cursor-pointer mb-2.5 transition-all flex items-center justify-center rounded-md w-12 h-9 bg-[#181A1D] hover:bg-[#1E2024] focus:bg-[#1E2024] text-[#ababac] hover:text-[#9945FF] focus:text-[#9945FF]";

  const openLinkCss =
    "w-full gap-2 flex items-center justify-center text-sm font-semibold text-white text-opacity-50 hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out bg-[#191A1D] rounded-md text-center py-2 mb-2";

  return (
    <div
      className={`${
        sidebar ? "min-w-[15rem] justify-between" : "w-[4.15rem]"
      } z-50 relative transition-width hidden bg-[#121418] text-white md:flex flex-col items-center pb-3.5 h-[calc(100vh-6.25rem)]`}
    >
      {sidebar ? (
        <>
          <div className="w-full">
            <div
              className={`${
                sidebar ? "fadeInUp" : "fadeOutDown"
              } w-full flex flex-row items-center pl-5 gap-2 h-[4.4rem] border-r border-b border-[#1E2220]`}
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
                    ${fomoPrice.toFixed(3)}
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
                sidebar ? "fadeInUp" : "fadeOutDown"
              } w-full flex flex-col p-4`}
            >
              <SidebarOpenElement text={"Home"} Icon={Home} />
              <div className={`mt-0`}>
                <div className="w-full transition-all cursor-pointer rounded-md flex items-center justify-between gap-2 pl-4 pr-2 py-2 bg-transparent hover:bg-[#1f2024] focus:bg-[#1f2024] group">
                  <div className="flex items-center gap-2">
                    <FomoExitIcon className="min-w-[1rem] min-h-[1rem] transition-all text-[#ababac] group-hover:text-[#9945FF] group-focus:text-[#9945FF]" />
                    <span className="mt-0.5 transition-all text-base font-changa font-light text-white text-opacity-75 group-hover:text-opacity-100 group-focus:text-opacity-100">
                      FOMO: Exit
                    </span>
                  </div>
                  <button
                    className={`${
                      showExitTokens ? "bg-[#47484A]" : "bg-[#292C32]"
                    } hover:bg-[#47484A] transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out rounded-md p-3`}
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
                        } group flex transition-all items-center rounded-md p-2 pl-12 gap-2`}
                      >
                        {/* <Image src={token.src} alt="" width={15} height={15} /> */}
                        <span
                          className={`font-changa transition-all ${
                            token.active
                              ? "text-white/90"
                              : "text-white/50 group-hover:text-white/90"
                          }`}
                        >
                          {token.token}
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
                    <span className="mt-0.5 transition-all text-base font-changa font-light text-white text-opacity-75 group-hover:text-opacity-100 group-focus:text-opacity-100">
                      FOMO: Play
                    </span>
                  </div>
                  <button
                    className={`${
                      showPlayTokens ? "bg-[#47484A]" : "bg-[#292C32]"
                    } hover:bg-[#47484A] transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out rounded-md p-3`}
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
                        } group flex transition-all items-center rounded-md p-2 pl-12 gap-2`}
                      >
                        {/* <Image src={token.src} alt="" width={15} height={15} /> */}
                        <span
                          className={`font-changa transition-all ${
                            token.active
                              ? "text-white/90"
                              : "text-white/50 group-hover:text-white/90"
                          }`}
                        >
                          {token.token}
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
              sidebar ? "fadeInUp" : "fadeOutDown"
            } w-full flex flex-col p-4 mb-0`}
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
              <Image
                src={"/assets/ottersec.png"}
                alt=""
                width={17}
                height={17}
              />
              <p className="text-xs font-light text-white/50">
                Audited by OtterSec
              </p>
            </div>
          </div>
        </>
      ) : (
        <div
          className={`${
            sidebar ? "fadeOutDown" : "fadeIn"
          } flex flex-col items-center justify-between w-full h-full`}
        >
          <div className="w-full flex flex-col items-center">
            <div className="h-[4.4rem] w-full flex items-center justify-center">
              <div className="cursor-pointer transition-all flex items-center justify-center rounded-md w-12 h-12 bg-[#212121] hover:bg-[#1E2024] focus:bg-[#1E2024] text-[#ababac] hover:text-[#9945FF] focus:text-[#9945FF]">
                <Image
                  src={"/assets/logowhite.svg"}
                  width={35}
                  height={35}
                  alt={"FOMO"}
                  className=""
                />
              </div>
            </div>
            <div
              onClick={() => {
                router.push("/");
              }}
              className={`${topIconCss}`}
            >
              <Home className="w-4 h-4" />
            </div>
            <div
              onClick={() => {
                setSidebar(true);
                setShowExitTokens(true);
              }}
              className={`${topIconCss}`}
            >
              <FomoExitIcon className="w-4 h-4" />
            </div>
            <div
              onClick={() => {
                setSidebar(true);
                setShowPlayTokens(true);
              }}
              className={`${topIconCss}`}
            >
              <FomoPlayIcon className="w-4 h-4" />
            </div>
            <div className={`${topIconCss}`}>
              <Dollar className="w-4 h-4" />
            </div>
            <div className={`${topIconCss}`}>
              <Flag className="w-4 h-4" />
            </div>
            <div className={`${topIconCss}`}>
              <Fomo className="w-4 h-4" />
            </div>
          </div>
          <div className="w-full flex flex-col items-center mb-2">
            <div className={`${bottomIconCss}`}>
              <Twitter className="w-4 h-4" />
            </div>
            <div className={`${bottomIconCss}`}>
              <Birdeye className="w-4 h-4" />
            </div>
            <div className={`${bottomIconCss}`}>
              <Telegram className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const SidebarOpenElement = ({
  text,
  Icon,
}: {
  text: string;
  Icon: any;
}) => {
  return (
    <div className="w-full transition-all cursor-pointer rounded-md flex items-center gap-2 pl-4 py-2 bg-transparent hover:bg-[#1f2024] focus:bg-[#1f2024] group">
      <Icon className="w-4 h-4 transition-all text-[#ababac] group-hover:text-[#9945FF] group-focus:text-[#9945FF]" />
      <span className="transition-all text-base font-changa font-light text-white text-opacity-75 group-hover:text-opacity-100 group-focus:text-opacity-100">
        {text}
      </span>
    </div>
  );
};
