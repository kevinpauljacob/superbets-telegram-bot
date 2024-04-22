import Image from "next/image";
import { useGlobalContext } from "./GlobalContext";
import Link from "next/link";
import { wsEndpoint, trimStringToLength } from "@/context/gameTransactions";
import { useEffect, useRef, useState } from "react";
import { GameType } from "@/utils/provably-fair";
import { useRouter } from "next/router";

export default function SubHeader() {
  const router = useRouter();
  const { coinData, showWalletModal, setShowWalletModal } = useGlobalContext();

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
    fetch(`/api/games/global/getRecentHistory`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return console.error(data.message);
        setCards(data.data);
      });

    const socket = new WebSocket(wsEndpoint);

    socket.onopen = () => {
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
      <div
        className={`${
          router.pathname === "/" ? "flex" : "hidden md:flex"
        } w-full text-white h-[4.4rem] flex items-center border-b border-[#1E2220] px-4 lg:pl-4 lg:pr-4 bg-[#121418]`}
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
                {card.result === "Won" ? (
                  <p className="text-[#72F238] font-changa text-sm mt-1">
                    +${(card.absAmount ?? 0).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-[#F23838] font-change text-sm mt-1">
                    -${(card.absAmount ?? 0).toFixed(2)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center border-l border-[#1E2220] pl-4 md:min-w-fit">
          <div className="flex items-center gap-2">
            <div className="flex items-center h-10 px-4 py-1 gap-2 border-2 border-white border-opacity-5 rounded-[5px]">
              <Image src={"/assets/sol.png"} alt="" width={20} height={17} />
              <span className="font-chakra text-2xl text-[#94A3B8]">
                {(coinData ? coinData[0].amount : 0).toFixed(4)}
              </span>
            </div>
            <div
              onClick={() => {
                setShowWalletModal(true);
              }}
              className="flex items-center h-10 px-4 py-2 gap-1.5 bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] transition-all cursor-pointer rounded-[5px]"
            >
              <Image src={"/assets/wallet.png"} alt="" width={20} height={20} />
              <span className="text-sm leading-3 mt-0.5 text-white text-opacity-90">
                Wallet
              </span>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`${
          router.pathname === "/" ? "hidden" : "flex"
        } md:hidden items-center justify-between my-4 mx-2 rounded-[5px] bg-[#121418] py-3 px-4 md:min-w-fit`}
      >
        <Image src={"/assets/wallet2.png"} alt="" width={30} height={30} />
        <div className="flex items-center gap-2">
          <div className="flex items-center h-[2.3rem] px-4 gap-1.5 border-2 border-white border-opacity-5 rounded-[5px]">
            <Image src={"/assets/sol.png"} alt="" width={14} height={14} />
            <span className="text-base font-chakra leading-3 mt-0.5 text-[#94A3B8]">
              {(coinData ? coinData[0].amount : 0).toFixed(3)}
            </span>
          </div>
          <div
            onClick={() => {
              setShowWalletModal(true);
            }}
            className="flex items-center h-[2.3rem] px-5 gap-1 bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] transition-all cursor-pointer rounded-[5px]"
          >
            <Image src={"/assets/wallet.png"} alt="" width={15} height={15} />
            <span className="text-xs mt-0.5 text-white text-opacity-90">
              Wallet
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
