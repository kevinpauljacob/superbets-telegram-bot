import Image from "next/image";
import { useGlobalContext } from "./GlobalContext";
import Link from "next/link";
import {
  wsEndpoint,
  trimStringToLength,
  truncateNumber,
} from "@/context/gameTransactions";
import { useEffect, useRef, useState } from "react";
import { GameType } from "@/utils/provably-fair";
import { useRouter } from "next/router";
import useWebSocket from "react-use-websocket";
import { translator } from "@/context/transactions";
import { SPL_TOKENS } from "@/context/config";
import CoinSelector from "./CoinSelector";

export default function SubHeader() {
  const router = useRouter();
  const {
    setShowWalletModal,
    setLiveBets,
    language,
    setSelectedCoin,
    selectedCoin,
    coinData,
    showLiveStats,
    setShowLiveStats,
    showFullScreen,
    setShowFullScreen,
    enableSounds,
    setEnableSounds,
  } = useGlobalContext();

  type Card = {
    game: GameType;
    wallet: string;
    amountWon: number;
    result: "Won" | "Lost";
    userTier: number;
    tokenMint: string;
  };
  const [cards, setCards] = useState<Array<Card>>([]);

  const endOfListRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    endOfListRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [cards]);

  const { sendJsonMessage } = useWebSocket(wsEndpoint, {
    onOpen: () => {
      console.log("Connected to ws");
      sendJsonMessage({
        clientType: "listener-client",
        channel: "fomo-casino_games-channel",
      });
    },
    onMessage: (event) => {
      const response = JSON.parse(event.data.toString());

      if (!response.payload) return;

      const payload = response.payload;
      if (payload.result === "Won")
        setCards((prev) => {
          const newCards = [payload, ...prev];
          return newCards.slice(0, 15);
        });

      setLiveBets((prev) => [payload, ...prev]);
    },
    shouldReconnect: () => {
      console.log("Reconnecting to ws");
      return true;
    },
    retryOnError: true,
    reconnectInterval: (attemptNumber) =>
      Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
    reconnectAttempts: 25,
  });

  useEffect(() => {
    fetch(`/api/games/global/getRecentHistory`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return console.error(data.message);
        setCards(data.data);
      });
  }, []);

  return (
    <div className="flex flex-col w-full z-[80] absolute top-0 right-0">
      <div
        className={`${
          router.pathname === "/" ? "flex" : "hidden md:flex"
        } w-full text-white h-[4.4rem] flex items-center border-b border-[#1E2220] px-4 lg:px-6 bg-[#121418]`}
      >
        <div className="flex w-full items-center overflow-x-auto no-scrollbar">
          <div ref={endOfListRef} />
          {cards.map((card, index) => (
            <Link
              key={index}
              className="bg-[#1E2220] flex items-center rounded-md mr-2.5 min-w-[8.8rem]"
              href={`/${card.game}`}
            >
              <Image
                src={`/assets/live-win-cards/${card.game}.png`}
                alt="badge"
                width={52}
                height={52}
                className="rounded-md"
              />
              <div className="pl-2 pr-2">
                <div className="flex items-center gap-1">
                  <Image
                    src={`/assets/badges/T-${card.userTier}.png`}
                    alt="userBadge"
                    width={13}
                    height={13}
                  />
                  <span className="text-xs font-changa font-medium text-white">
                    {trimStringToLength(card.wallet, 3)}
                  </span>
                </div>
                <p className="text-[#72F238] font-changa text-sm mt-1">
                  +{truncateNumber(card.amountWon ?? 0, 2)}{" "}
                  {SPL_TOKENS.find(
                    (token) => token.tokenMint === card.tokenMint,
                  )?.tokenName ?? ""}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div
          className={`${
            router.pathname === "/" ? "hidden" : "hidden md:flex"
          } h-10 border border-white border-opacity-5 rounded-[5px] mx-4`}
        />

        {/* <div className={`border-2 border-white border-opacity-5 rounded-[5px] p-3 cursor-pointer ${showFullScreen ? "bg-[#d9d9d9] bg-opacity-10" : ""}`} onClick={() => setShowFullScreen(!showFullScreen)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" fill="none">
            <g opacity="0.75" clip-path="url(#clip0_3204_4400)">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M1.14286 10.2857C0.514286 10.2857 0 10.8 0 11.4286V14.8571C0 15.4857 0.514286 16 1.14286 16H4.57143C5.2 16 5.71429 15.4857 5.71429 14.8571C5.71429 14.2286 5.2 13.7143 4.57143 13.7143H2.28571V11.4286C2.28571 10.8 1.77143 10.2857 1.14286 10.2857ZM1.14286 5.71429C1.77143 5.71429 2.28571 5.2 2.28571 4.57143V2.28571H4.57143C5.2 2.28571 5.71429 1.77143 5.71429 1.14286C5.71429 0.514286 5.2 0 4.57143 0H1.14286C0.514286 0 0 0.514286 0 1.14286V4.57143C0 5.2 0.514286 5.71429 1.14286 5.71429ZM13.7143 13.7143H11.4286C10.8 13.7143 10.2857 14.2286 10.2857 14.8571C10.2857 15.4857 10.8 16 11.4286 16H14.8571C15.4857 16 16 15.4857 16 14.8571V11.4286C16 10.8 15.4857 10.2857 14.8571 10.2857C14.2286 10.2857 13.7143 10.8 13.7143 11.4286V13.7143ZM10.2857 1.14286C10.2857 1.77143 10.8 2.28571 11.4286 2.28571H13.7143V4.57143C13.7143 5.2 14.2286 5.71429 14.8571 5.71429C15.4857 5.71429 16 5.2 16 4.57143V1.14286C16 0.514286 15.4857 0 14.8571 0H11.4286C10.8 0 10.2857 0.514286 10.2857 1.14286Z" fill={showFullScreen ? "white" : "#94A3B8"} />
            </g>
            <defs>
              <clipPath id="clip0_3204_4400">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div> */}

        <div
          className={`${
            router.pathname === "/" ? "hidden" : "hidden md:flex"
          } border-2 border-white/5 rounded-[5px] p-[0.563rem] cursor-pointer transition-all hover:bg-[#26282C] hover:transition-all ${showLiveStats ? "bg-[#26282C] border-[#26282C]" : ""}`}
          onClick={() => setShowLiveStats(!showLiveStats)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g opacity="0.75" clip-path="url(#clip0_3181_1728)">
              <path
                d="M15 5H11V15H10V0H6V15H5V8H1V15H0V16H1H5H6H10H11H15H16V15H15V5Z"
                fill={showLiveStats ? "white" : "#94A3B8"}
              />
            </g>
            <defs>
              <clipPath id="clip0_3181_1728">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>

        <div
          className={`${
            router.pathname === "/" ? "hidden" : "hidden md:flex"
          } border-2 border-white/5 rounded-[5px] p-[0.563rem] cursor-pointer ml-3 transition-all hover:bg-[#26282C] hover:transition-all ${enableSounds ? "bg-[#26282C] border-[#26282C]" : ""}`}
          onClick={() => setEnableSounds(!enableSounds)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M10.2 1.45002C10.05 1.35002 9.85 1.40002 9.7 1.50002L4.85 5.00002H1.5C1.2 5.00002 1 5.20002 1 5.50002V10.5C1 10.8 1.2 11 1.5 11H4.85L9.7 14.55C9.8 14.6 9.9 14.65 10 14.65C10.1 14.65 10.15 14.65 10.25 14.6C10.4 14.5 10.5 14.35 10.5 14.15V1.90002C10.5 1.70002 10.4 1.50002 10.2 1.45002Z"
              fill={enableSounds ? "white" : "#94A3B8"}
            />
            <path
              d="M13.5492 4.65C13.3492 4.45 13.0492 4.45 12.8492 4.65C12.6492 4.85 12.6492 5.15 12.8492 5.35C13.5992 6.05 13.9992 7 13.9992 8C13.9992 9 13.5992 9.95 12.8492 10.65C12.6492 10.85 12.6492 11.15 12.8492 11.35C12.9492 11.45 13.0992 11.5 13.1992 11.5C13.2992 11.5 13.4492 11.45 13.5492 11.35C14.4992 10.45 14.9992 9.3 14.9992 8C14.9992 6.7 14.4992 5.55 13.5492 4.65Z"
              fill={enableSounds ? "white" : "#94A3B8"}
            />
            <path
              d="M12.3508 6.35008C12.1508 6.15008 11.8508 6.15008 11.6508 6.40008C11.4508 6.60008 11.5008 6.90008 11.7008 7.10008C11.9508 7.35008 12.1008 7.70008 12.1008 8.05008C12.1008 8.40008 11.9508 8.75008 11.7008 9.00008C11.5008 9.20008 11.5008 9.50008 11.6508 9.70008C11.7508 9.80008 11.9008 9.85008 12.0008 9.85008C12.1008 9.85008 12.2508 9.80008 12.3508 9.70008C12.8508 9.25008 13.1008 8.65008 13.1008 8.05008C13.1008 7.45008 12.8008 6.75008 12.3508 6.35008Z"
              fill={enableSounds ? "white" : "#94A3B8"}
            />
          </svg>
        </div>

        <div
          className={`${
            router.pathname === "/" ? "hidden" : "hidden md:flex"
          } h-10 border border-white border-opacity-5 rounded-[5px] mx-4`}
        />

        <div className="hidden md:flex items-center md:min-w-fit">
          <CoinSelector />
        </div>
      </div>
      <div
        className={`${
          router.pathname === "/" ? "hidden" : "flex"
        } md:hidden items-center justify-between my-4 mx-2 rounded-[5px] bg-[#121418] py-3 px-4 md:min-w-fit`}
      >
        <div className="flex items-center ">
          <div
            className={`border-2 border-white/5 rounded-[5px] p-[0.563rem] cursor-pointer transition-all hover:bg-[#26282C] hover:transition-all ${showLiveStats ? "bg-[#26282C] border-[#26282C]" : ""}`}
            onClick={() => setShowLiveStats(!showLiveStats)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g opacity="0.75" clip-path="url(#clip0_3181_1728)">
                <path
                  d="M15 5H11V15H10V0H6V15H5V8H1V15H0V16H1H5H6H10H11H15H16V15H15V5Z"
                  fill={showLiveStats ? "white" : "#94A3B8"}
                />
              </g>
              <defs>
                <clipPath id="clip0_3181_1728">
                  <rect width="16" height="16" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>

          <div
            className={`border-2 border-white/5 rounded-[5px] p-[0.563rem] cursor-pointer ml-2 transition-all hover:bg-[#26282C] hover:transition-all ${enableSounds ? "bg-[#26282C] border-[#26282C]" : ""}`}
            onClick={() => setEnableSounds(!enableSounds)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M10.2 1.45002C10.05 1.35002 9.85 1.40002 9.7 1.50002L4.85 5.00002H1.5C1.2 5.00002 1 5.20002 1 5.50002V10.5C1 10.8 1.2 11 1.5 11H4.85L9.7 14.55C9.8 14.6 9.9 14.65 10 14.65C10.1 14.65 10.15 14.65 10.25 14.6C10.4 14.5 10.5 14.35 10.5 14.15V1.90002C10.5 1.70002 10.4 1.50002 10.2 1.45002Z"
                fill={enableSounds ? "white" : "#94A3B8"}
              />
              <path
                d="M13.5492 4.65C13.3492 4.45 13.0492 4.45 12.8492 4.65C12.6492 4.85 12.6492 5.15 12.8492 5.35C13.5992 6.05 13.9992 7 13.9992 8C13.9992 9 13.5992 9.95 12.8492 10.65C12.6492 10.85 12.6492 11.15 12.8492 11.35C12.9492 11.45 13.0992 11.5 13.1992 11.5C13.2992 11.5 13.4492 11.45 13.5492 11.35C14.4992 10.45 14.9992 9.3 14.9992 8C14.9992 6.7 14.4992 5.55 13.5492 4.65Z"
                fill={enableSounds ? "white" : "#94A3B8"}
              />
              <path
                d="M12.3508 6.35008C12.1508 6.15008 11.8508 6.15008 11.6508 6.40008C11.4508 6.60008 11.5008 6.90008 11.7008 7.10008C11.9508 7.35008 12.1008 7.70008 12.1008 8.05008C12.1008 8.40008 11.9508 8.75008 11.7008 9.00008C11.5008 9.20008 11.5008 9.50008 11.6508 9.70008C11.7508 9.80008 11.9008 9.85008 12.0008 9.85008C12.1008 9.85008 12.2508 9.80008 12.3508 9.70008C12.8508 9.25008 13.1008 8.65008 13.1008 8.05008C13.1008 7.45008 12.8008 6.75008 12.3508 6.35008Z"
                fill={enableSounds ? "white" : "#94A3B8"}
              />
            </svg>
          </div>
        </div>
        <CoinSelector />
      </div>
    </div>
  );
}
