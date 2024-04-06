import Image from "next/image";
import coin from "/public/assets/coin.svg";
import { useGlobalContext } from "./GlobalContext";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  RENDER_ENDPOINT,
  trimStringToLength,
} from "@/context/gameTransactions";
import { useEffect, useState } from "react";
import { GameType } from "@/utils/vrf";

export default function SubHeader() {
  const { coinData } = useGlobalContext();

  type Card = {
    game: GameType;
    wallet: string;
    absAmount: number;
    result: "Won" | "Lost";
  };
  const [cards, setCards] = useState<Array<Card>>([]);

  useEffect(() => {
    const socket = new WebSocket(RENDER_ENDPOINT);

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
      setCards((prev) => [...prev, payload]);
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
        <div className="flex w-full items-center overflow-x-auto">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-[#1E2220] flex items-center rounded-md mx-2.5 min-w-[150px]"
            >
              <Image src="/assets/cardImg.png" alt="" width={52} height={52} />
              <div className="pl-2 pr-4 py-1">
                <div className="flex items-center">
                  <Image
                    src="/assets/userImg.png"
                    alt=""
                    width={23}
                    height={23}
                  />
                  <span className="text-sm">
                    {trimStringToLength(card.wallet, 3)}
                  </span>
                </div>
                <p
                  className={
                    card.result === "Won" ? "text-[#72F238]" : "text-[#F23838]"
                  }
                >
                  +${card.absAmount}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:flex items-center border-l border-[#1E2220] pl-4 md:min-w-fit">
          <div className="flex items-center gap-2">
            <div className="flex items-center px-4 py-1 gap-2 border-2 border-white border-opacity-5 rounded-[5px]">
              <Image src={"/assets/sol.png"} alt="" width={20} height={17} />
              <span className="font-changa text-2xl">
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
