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
  } = useGlobalContext();

  type Card = {
    game: GameType;
    wallet: string;
    amountWon: number;
    result: "Won" | "Lost";
    userTier: number;
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
                  +{truncateNumber(card.amountWon ?? 0, 2)} SOL
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center border-l border-[#1E2220] pl-4 md:min-w-fit">
          <CoinSelector />
        </div>
      </div>
      <div
        className={`${
          router.pathname === "/" ? "hidden" : "flex"
        } md:hidden items-center justify-between my-4 mx-2 rounded-[5px] bg-[#121418] py-3 px-4 md:min-w-fit`}
      >
        <Image src={"/assets/wallet2.png"} alt="" width={30} height={30} />
        <CoinSelector />
      </div>
    </div>
  );
}
