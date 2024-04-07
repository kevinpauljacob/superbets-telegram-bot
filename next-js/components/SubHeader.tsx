import Image from "next/image";
import { useGlobalContext } from "./GlobalContext";
import Link from "next/link";
import { wsEndpoint, trimStringToLength } from "@/context/gameTransactions";
import { useEffect, useRef, useState } from "react";
import { GameType } from "@/utils/vrf";

export default function SubHeader() {
  const { coinData } = useGlobalContext();

  type Card = {
    game: GameType;
    wallet: string;
    absAmount: number;
    result: "Won" | "Lost";
    userTier: string;
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

  useEffect(() => {
    const socket = new WebSocket(wsEndpoint);

    socket.onopen = () => {
      console.log("WebSocket connection opened");
      socket.send(
        JSON.stringify({
          clientType: "listener-client",
          channel: "fomo-casino_games-channel",
        }),
      );
    };

    socket.onmessage = async (event) => {
      const response = JSON.parse(event.data.toString());

      console.log("Received message from server:", response);
      if (!response.payload) return;

      const payload = response.payload;
      setCards((prev) => {
        const newCards = [payload, ...prev];
        return newCards.slice(0, 15);
      });
    };

    socket.onclose = (event) => {
      console.log("WebSocket connection closed:", event);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      console.log("Cleaning up WebSocket connection");
      socket.close();
    };
  }, []);

  return (
    <div className="flex flex-col w-full">
      <div className="w-full text-white h-[70px] flex items-center border-y border-[#1E2220] px-4 lg:pl-4 lg:pr-4 bg-[#121418]">
        <div className="flex w-full items-center overflow-x-auto no-scrollbar">
          <div ref={endOfListRef} />
          {cards.map((card, index) => (
            <Link
              key={index}
              className="bg-[#1E2220] flex items-center rounded-md mr-2 min-w-[180px] justify-around"
              href={`/${card.game}`}
            >
              <Image
                src={`/assets/games/${card.game}.png`}
                alt="gameBadge"
                width={52}
                height={52}
                className="rounded-md ml-2"
              />
              <div className="pl-2 pr-2 py-1">
                <div className="flex items-center gap-1">
                  <Image
                    src={`/assets/badges/T-${card.userTier}.png`}
                    alt="userBadge"
                    width={23}
                    height={23}
                  />
                  <span className="text-sm">
                    {trimStringToLength(card.wallet, 4)}
                  </span>
                </div>
                {card.result === "Won" ? (
                  <p className="text-[#72F238]">
                    +${card.absAmount.toFixed(2)}
                  </p>
                ) : (
                  <p className="text-[#F23838]">
                    -${card.absAmount.toFixed(2)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center border-l border-[#1E2220] pl-4 md:min-w-fit">
          <div className="flex items-center gap-2">
            <div className="flex items-center px-4 py-1 gap-2 border-2 border-white border-opacity-5 rounded-[5px]">
              <Image src={"/assets/sol.png"} alt="" width={20} height={17} />
              <span className="font-chakra text-2xl">
                {(coinData ? coinData[0].amount : 0).toFixed(4)}
              </span>
            </div>
            <Link
              href={"/balance"}
              className="flex items-center px-4 py-2 gap-2 bg-[#9945FF] cursor-pointer rounded-[5px]"
            >
              <Image src={"/assets/wallet.png"} alt="" width={20} height={20} />
              <span className="text-sm font-semibold text-white text-opacity-90">
                Wallet
              </span>
            </Link>
          </div>
        </div>
      </div>
      <div className="flex md:hidden items-center justify-between my-4 mx-2 rounded-[5px] bg-[#121418] border-l border-[#1E2220] p-2 md:min-w-fit">
        <Image src={"/assets/wallet2.png"} alt="" width={30} height={30} />
        <div className="flex items-center gap-2">
          <div className="flex items-center px-2 py-0.5 gap-2 border-2 border-white border-opacity-5 rounded-[5px]">
            <Image src={"/assets/sol.png"} alt="" width={13} height={11} />
            <span className="font-changa text-base text-[#94A3B8]">
              {(coinData ? coinData[0].amount : 0).toFixed(4)}
            </span>
          </div>
          <Link
            href={"/balance"}
            className="flex items-center px-2 py-1.5 gap-2 bg-[#9945FF] cursor-pointer rounded-[5px]"
          >
            <Image src={"/assets/wallet.png"} alt="" width={13} height={11} />
            <span className="text-xs text-white text-opacity-90">Wallet</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
