import Image from "next/image";
import { useGlobalContext } from "./GlobalContext";
import Link from "next/link";
import { wsEndpoint } from "@/context/config";
import { useEffect, useRef, useState } from "react";
import { GameType } from "@/utils/provably-fair";
import { useRouter } from "next/router";
import useWebSocket from "react-use-websocket";
import { trimStringToLength, truncateNumber } from "@/context/transactions";
import CoinSelector from "./CoinSelector";
import { Card } from "iconsax-react";
import StatsSoundToggle from "./games/StatsSoundToggle";

export default function SubHeader() {
  const router = useRouter();
  const {
    setLiveBets,
    language,
    liveTokenPrice,
  } = useGlobalContext();

  type Card = {
    game: GameType;
    account: string;
    amountWon: number;
    result: "Won" | "Lost";
    userTier: number;
    tokenMint: string;
    usdValue: number;
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
      sendJsonMessage({
        clientType: "listener-client",
        channel: "fomo-casino_games-channel",
      });
    },
    onMessage: (event) => {
      const response = JSON.parse(event.data.toString());

      if (!response.payload) return;

      const payload = response.payload;
      if (payload.result === "Won") {
        payload.usdValue =
          payload.amountWon *
          (liveTokenPrice.find((x) => x.mintAddress === payload.tokenMint)
            ? liveTokenPrice.find((x) => x.mintAddress === payload.tokenMint)!
                .price
            : 1);
        setCards((prev) => {
          const newCards = [payload, ...prev];
          return newCards.slice(0, 15);
        });
      }

      setLiveBets((prev) => [payload, ...prev]);
    },
    shouldReconnect: () => {
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
        data.data = data.data.map((x: Card) => {
          x.usdValue =
            x.amountWon *
            (liveTokenPrice.find((y) => y.mintAddress === x.tokenMint)
              ? liveTokenPrice.find((y) => y.mintAddress === x.tokenMint)!.price
              : 1);
          return x;
        });
        setCards(data.data);
      });
  }, [liveTokenPrice]);

  return (
    <div className="flex flex-col w-full z-[80] absolute top-0 right-0">
      <div
        className={`${
          router.pathname === "/" ? "hidden" : "hidden md:hidden"
        } w-full text-white h-[4.4rem] flex items-center border-l border-b border-[#1E2220] px-4 lg:px-6 bg-[#121418]`}
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
                  {/* <Image
                    src={`/assets/badges/T-${card.userTier}.png`}
                    alt="userBadge"
                    width={13}
                    height={13}
                  /> */}
                  <span className="text-xs font-changa font-medium text-white">
                    {trimStringToLength(card?.account ?? "Player", 3)}
                  </span>
                </div>
                <p className="text-[#72F238] font-changa text-sm mt-1">
                  +${truncateNumber(card.usdValue ?? 0, 4)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div
          className={`${
            router.pathname === "/" ? "hidden md:flex" : "hidden md:flex"
          } h-10 border border-white border-opacity-5 rounded-[5px] mx-4`}
        />

        <StatsSoundToggle />
      </div>
      <div
        className={`${
          router.pathname === "/" ? "flex" : "flex"
        } md:hidden items-center justify-between my-4 mx-2 rounded-[5px] bg-[#121418] py-3 px-4 md:min-w-fit`}
      >
        <StatsSoundToggle />
        <CoinSelector />
      </div>
    </div>
  );
}
