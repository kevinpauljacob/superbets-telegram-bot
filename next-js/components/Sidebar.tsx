import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { connection, fomoToken, translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import Home from "@/public/assets/sidebar-icons/Home";
import FomoExitIcon from "@/public/assets/sidebar-icons/FomoExitIcon";
import FomoPlayIcon from "@/public/assets/sidebar-icons/FomoPlayIcon";
import Store from "@/public/assets/sidebar-icons/Store";
import Leaderboard from "@/public/assets/sidebar-icons/Leaderboard";
import Staking from "@/public/assets/sidebar-icons/Staking";
import Dollar from "@/public/assets/sidebar-icons/DCA";
import Twitter from "@/public/assets/Twitter";
import Birdeye from "@/public/assets/Birdeye";
import Telegram from "@/public/assets/Telegram";
import { truncateNumber } from "@/context/gameTransactions";
import FomoExitSidebar from "./FomoExitSidebar";

export type Game = {
  src: string;
  token: string;
  link: string;
  active: boolean;
};

export type ToggleGameToken = (index: number) => void;

const topIconCss =
  "group cursor-pointer mb-2.5 transition-all flex items-center justify-center rounded-md w-12 h-9 bg-transparent hover:bg-[#1E2024] focus:bg-[#1E2024] text-[#ababac] hover:text-[#9945FF] focus:text-[#9945FF]";
const bottomIconCss =
  "cursor-pointer mb-2.5 transition-all flex items-center justify-center rounded-md w-12 h-9 bg-[#181A1D] hover:bg-[#1E2024] focus:bg-[#1E2024] text-[#ababac] hover:text-[#9945FF] focus:text-[#9945FF]";

const closedIconCss =
  "w-5 h-5 text-white group-hover:text-[#9945FF] group-focus:text-[#9945FF] transition-all opacity-50";
const activeIconCss = "w-5 h-5 text-[#9945FF] transition-all";

export default function Sidebar({
  sidebar,
  setSidebar,
}: {
  sidebar: boolean;
  setSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const wallet = useWallet();
  const router = useRouter();

  const { language, setMobileSidebar } =
    useGlobalContext();

  const [showExitTokens, setShowExitTokens] = useState<boolean>(false);
  const [showPlayTokens, setShowPlayTokens] = useState<boolean>(false);


  return (
    <div
      className={`${
        sidebar ? "min-w-[15rem] justify-between" : "w-[4.15rem]"
      } z-50 relative transition-width hidden bg-[#121418] text-white md:flex flex-col items-center pb-3.5 no-scrollbar overflow-y-auto h-[calc(100dvh-6.25rem)]`}
    >
      {sidebar ? (
        <OpenSidebar
          sidebar={sidebar}
          showPlayTokens={showPlayTokens}
          setShowPlayTokens={setShowPlayTokens}
        />
      ) : (
        <div
          className={`${
            sidebar ? "fadeOutDown" : "fadeIn"
          } flex flex-col items-center justify-between w-full h-full`}
        >
          <div className="w-full flex flex-col items-center">
            <div
              onClick={() => {
                setSidebar(true);
              }}
              className="h-[4.4rem] w-full flex items-center justify-center"
            >
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
                if (router.pathname === "/") {
                  setSidebar(true);
                } else {
                  router.push("/");
                  setSidebar(false);
                }
              }}
              className={`${topIconCss}`}
            >
              <Home
                className={
                  router.pathname === "/" ? activeIconCss : closedIconCss
                }
              />
            </div>
            <Link href="https://exitscam.live" target="_blank">
              <div
                onClick={() => {
                  setSidebar(true);
                }}
                className={`${topIconCss}`}
              >
                <FomoExitIcon
                  className={
                    router.pathname === "/exit" ? activeIconCss : closedIconCss
                  }
                />
              </div>
            </Link>
            <div
              onClick={() => {
                setSidebar(true);
                setShowPlayTokens(true);
              }}
              className={`${topIconCss}`}
            >
              <FomoPlayIcon className={`${closedIconCss}`} />
            </div>
            <div
              onClick={() => {
                router.push("/store");
                setSidebar(true);
              }}
              className={`${topIconCss}`}
            >
              <Store
                className={
                  router.pathname === "/store" ? activeIconCss : closedIconCss
                }
              />
            </div>
            <div
              onClick={() => {
                router.push("/leaderboard");
                setSidebar(true);
              }}
              className={`${topIconCss}`}
            >
              <Leaderboard
                className={
                  router.pathname === "/leaderboard"
                    ? activeIconCss
                    : closedIconCss
                }
              />
            </div>
            <div
              onClick={() => {
                router.push("/stake");
                setSidebar(true);
              }}
              className={`${topIconCss}`}
            >
              <Staking
                className={
                  router.pathname === "/stake" ? activeIconCss : closedIconCss
                }
              />
            </div>
            <Link href="https://dca.fomosolana.com/" target="_blank">
              <div
                onClick={() => {
                  setSidebar(true);
                }}
                className={`${topIconCss}`}
              >
                <Dollar className={closedIconCss} />
              </div>
            </Link>
          </div>
          <div className="w-full flex flex-col items-center mb-2">
            <Link
              href={"https://x.com/FOMO_wtf"}
              target="_blank"
              className={`${bottomIconCss}`}
            >
              <Twitter className={`${closedIconCss}`} />
            </Link>
            <Link
              href={
                "https://birdeye.so/token/Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw?chain=solana"
              }
              target="_blank"
              className={`${bottomIconCss}`}
            >
              <Birdeye className="w-5 h-5 text-white group-hover:text-[#9945FF] group-focus:text-[#9945FF] transition-all " />
            </Link>
            <Link
              href={"https://t.me/FOMO_wtf"}
              target="_blank"
              className={`${bottomIconCss}`}
            >
              <Telegram className={`${closedIconCss}`} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export const SidebarOpenElement = ({
  text,
  Icon,
  link,
  className,
}: {
  text: string;
  Icon: any;
  link?: string;
  className?: string;
}) => {
  const router = useRouter();
  const { language } = useGlobalContext();
  return (
    <div
      onClick={() => {
        link && router.push(link);
      }}
      className="w-full transition-all cursor-pointer rounded-md flex items-end gap-3 pl-4 py-2 bg-transparent hover:bg-[#1f2024] focus:bg-[#1f2024] group"
    >
      <Icon className={className} />
      <span className="transition-all text-sm leading-[1rem] font-changa font-medium tracking-wider text-white text-opacity-90 group-hover:text-opacity-100 group-focus:text-opacity-100">
        {translator(text, language)}
      </span>
    </div>
  );
};

export const OpenSidebar = ({
  sidebar,
  showPlayTokens,
  setShowPlayTokens,
}: {
  sidebar: boolean;
  showPlayTokens: boolean;
  setShowPlayTokens: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const wallet = useWallet();
  const router = useRouter();
  const { fomoPrice, setSidebar, setMobileSidebar } = useGlobalContext();

  const [casinoGames, setCasinoGames] = useState<Game[]>([
    {
      src: "",
      token: "Dice",
      link: "/dice", // Update the links to include "/"
      active: false,
    },
    {
      src: "",
      token: "Dice 2",
      link: "/dice2", // Update the links to include "/"
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
    {
      src: "",
      token: "Limbo",
      link: "/limbo", // Update the links to include "/"
      active: false,
    },
    {
      src: "",
      token: "Keno",
      link: "/keno", // Update the links to include "/"
      active: false,
    },
    {
      src: "",
      token: "Wheel",
      link: "/wheel", // Update the links to include "/"
      active: false,
    },
    {
      src: "",
      token: "Mines",
      link: "/mines", // Update the links to include "/"
      active: false,
    },
  ]);

  const toggleCasinoToken: ToggleGameToken = (index) => {
    const updatedCasinoGames = casinoGames.map((token, i) => ({
      ...token,
      active: i === index ? !token.active : false,
    }));
    setCasinoGames(updatedCasinoGames);
  };
  const [priceChange24h, setPriceChange24h] = useState(0)
  const { language, setFomoPrice } = useGlobalContext();
 
  const url = `https://api.dexscreener.com/latest/dex/tokens/${fomoToken}`;
  useEffect(() => {

    /// code added to fetch fomo price
    const fetchFomoPrice = async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();
        const priceUsd = parseFloat(data?.pairs[0]?.priceUsd);
        const change24h = parseFloat(data?.pairs[0]?.priceChange?.h24); 
        if (!isNaN(priceUsd)) {
          setFomoPrice(priceUsd);
          setPriceChange24h(change24h);
        } else {
          console.error("Invalid price fetched:", data?.pairs[0]?.priceUsd);
          setFomoPrice(0);
          setPriceChange24h(0);
        }
      } catch (e) {
        console.error("Failed to fetch FOMO price:", e);
        setFomoPrice(0);
        setPriceChange24h(0);
      }
    };

    const intervalId = setInterval(fetchFomoPrice, 10000);
    fetchFomoPrice(); 

    return () => clearInterval(intervalId);

    //setShowPlayTokens(isGameActive(casinoGames));  // this is the part of initial code
  }, [router.pathname, casinoGames]);

  const openLinkCss =
    "w-full gap-2 flex items-center justify-center text-sm font-semibold text-white text-opacity-50 hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out bg-[#191A1D] rounded-md text-center py-2 mb-2";
  const priceChangeColor = priceChange24h >= 0 ? 'text-fomo-green' : 'text-fomo-red';
  return (
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
                ${truncateNumber(fomoPrice,3)}
              </span>
               <span
                className={`text-xs ${priceChangeColor} font-medium pt-[0.1px] leading-[0.6rem]`}
              >
              {priceChange24h.toFixed(2)}%
              </span> 
            </div>
          </div>
        </div>
        <div
          className={`${
            sidebar ? "fadeInUp" : "fadeOutDown"
          } w-full flex flex-col p-4 gap-1.5`}
        >
          <div
            onClick={() => {
              if (router.pathname === "/") {
                setSidebar(false);
                setMobileSidebar(false);
              }
            }}
          >
            <SidebarOpenElement
              text={"Home"}
              Icon={Home}
              link="/"
              className={
                router.pathname === "/" ? activeIconCss : closedIconCss
              }
            />
          </div>
          <FomoExitSidebar />
          <div className={`mt-0`}>
            <div
              onClick={() => setShowPlayTokens(!showPlayTokens)}
              className="w-full transition-all cursor-pointer rounded-md flex items-center justify-between gap-2 pl-4 pr-2 py-2 bg-transparent hover:bg-[#1f2024] focus:bg-[#1f2024] group"
            >
              <div className="flex items-center gap-3">
                <FomoPlayIcon className="min-w-[1.25rem] min-h-[1.25rem] transition-all text-white group-hover:text-[#9945FF] group-focus:text-[#9945FF] opacity-50 hover:opacity-100" />
                <span className="mt-0.5 transition-all text-sm font-changa font-medium text-white text-opacity-90 group-hover:text-opacity-100 group-focus:text-opacity-100">
                  FOMO: {translator("Play", language)}
                </span>
              </div>
              <button
                className={`${
                  showPlayTokens ? "bg-[#47484A]" : "bg-white bg-opacity-5"
                } hover:bg-[#47484A]transition text-sm duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out rounded-md w-8 h-6 flex justify-center items-center`}
              >
                <Image
                  src={
                    showPlayTokens
                      ? "/assets/upArrow.png"
                      : "/assets/downArrow.png"
                  }
                  alt=""
                  width={9}
                  height={9}
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
                    onClick={() => {
                      toggleCasinoToken(index);
                      setMobileSidebar(false);
                    }}
                    className={`${
                      router.pathname === token.link
                        ? "bg-white/10"
                        : "hover:bg-[#191a1d]"
                    } group flex transition-all items-center rounded-md p-2 pl-12 gap-2`}
                  >
                    {/* <Image src={token.src} alt="" width={15} height={15} /> */}
                    <span
                      className={`text-sm font-changa font-medium transition-all ${
                        token.active
                          ? "text-white/90"
                          : "text-white/50 group-hover:text-white/90"
                      }`}
                    >
                      {translator(token.token, language)}
                    </span>
                  </Link>
                ))}
              </ul>
            )}
          </div>
          <SidebarOpenElement
            text={"Store"}
            Icon={Store}
            link="/store"
            className={
              router.pathname === "/store" ? activeIconCss : closedIconCss
            }
          />
          <SidebarOpenElement
            text={"Leaderboard"}
            Icon={Leaderboard}
            link="/leaderboard"
            className={
              router.pathname === "/leaderboard" ? activeIconCss : closedIconCss
            }
          />
          <SidebarOpenElement
            text={"Staking"}
            Icon={Staking}
            link="/stake"
            className={
              router.pathname === "/stake" ? activeIconCss : closedIconCss
            }
          />
          <Link href="https://dca.fomosolana.com/" target="_blank">
            <SidebarOpenElement
              text={"DCA"}
              Icon={Dollar}
              // link="https://dca.fomosolana.com/"
              className={closedIconCss}
            />
          </Link>
        </div>
      </div>

      <div
        className={`${
          sidebar ? "fadeInUp" : "fadeOutDown"
        } w-full flex flex-col p-4 mb-0`}
      >
        <Link
          href="https://x.com/FOMO_wtf"
          className={`${openLinkCss}`}
          target="_blank"
        >
          <Twitter className="w-5 h-5" />
          {translator("Twitter", language)}
        </Link>
        <Link
          href="https://birdeye.so/token/Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw?chain=solana"
          className={`${openLinkCss}`}
          target="_blank"
        >
          <Birdeye className="w-5 h-5 text-white" />
          Birdeye
        </Link>
        <Link href="t.me/FOMO_wtf" className={`${openLinkCss}`} target="_blank">
          <Telegram className="w-5 h-5" />
          {translator("Telegram", language)}
        </Link>

        <div className="flex items-center justify-center my-2">
          <Image src={"/assets/ottersec.png"} alt="" width={17} height={17} />
          <p className="text-xs font-light text-white/50">
            {translator("Audited by OtterSec", language)}
          </p>
        </div>
      </div>
    </>
  );
};