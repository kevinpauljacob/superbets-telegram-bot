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

export default function SubHeader() {
  const router = useRouter();
  const {
    setShowWalletModal,
    setLiveBets,
    language,
    selectedCoinData,
    setSelectedCoinData,
    setSelectedCoin,
    selectedCoin,
    coinData,
  } = useGlobalContext();
  const [showSelectCoinModal, setShowSelectCoinModal] = useState(false);

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
                <p className="text-[#72F238] font-changa text-sm mt-1">
                  +{truncateNumber(card.amountWon ?? 0, 2)} SOL
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center border-l border-[#1E2220] pl-4 md:min-w-fit">
          <div className="flex items-center gap-2">
            <div className="relative flex flex-col w-36">
              <div
                className="flex flex-row justify-left items-center px-4 py-1 gap-2 border-2 border-white border-opacity-5 rounded-[5px] cursor-pointer"
                onClick={() => setShowSelectCoinModal(!showSelectCoinModal)}
              >
                <img
                  src={
                    selectedCoinData
                      ? selectedCoinData.img
                      : "https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png"
                  }
                  alt=""
                  className="w-7 h-7"
                />
                <span className="font-chakra text-2xl text-[#94A3B8]">
                  {truncateNumber(
                    selectedCoinData ? selectedCoinData.amount : 0,
                    3,
                  )}
                </span>
                <div className="grow" />
                <Image
                  src={"/assets/chevron.svg"}
                  alt=""
                  width={12}
                  height={12}
                  className={showSelectCoinModal ? "transform rotate-180" : ""}
                />
              </div>

              {showSelectCoinModal && (
                <div className="absolute mt-12 bg-[#121418] w-36 rounded-[5px] border-2 border-white border-opacity-5">
                  {SPL_TOKENS.map((coin, index) => (
                    <div
                      key={index}
                      className="flex items-center h-10 px-4 py-2 gap-1.5 hover:bg-[#1E2220] cursor-pointer"
                      onClick={() => {
                        let cd = SPL_TOKENS.find(
                          (c) => c.tokenMint === coin.tokenMint,
                        )!;
                        setSelectedCoinData({
                          wallet: "",
                          type: true,
                          amount:
                            coinData?.find((c) => c.tokenMint === cd.tokenMint)
                              ?.amount || 0,
                          tokenMint: cd.tokenMint,
                          img: cd.icon,
                        });
                        setSelectedCoin(cd.tokenMint);
                        setShowSelectCoinModal(false);
                      }}
                    >
                      <img src={coin.icon} alt="" className="w-5 h-5" />
                      <span className="text-sm leading-3 mt-0.5 text-white text-opacity-90">
                        {coin.tokenName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              onClick={() => {
                setShowWalletModal(true);
              }}
              className="flex items-center h-10 px-4 py-2 gap-1.5 bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] transition-all cursor-pointer rounded-[5px]"
            >
              <Image src={"/assets/wallet.png"} alt="" width={20} height={20} />
              <span className="text-sm leading-3 mt-0.5 text-white text-opacity-90">
                {translator("Wallet", language)}
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
          {/* balance */}
          <div className="flex items-center h-[2.3rem] px-4 gap-1.5 border-2 border-white border-opacity-5 rounded-[5px]">
            <Image src={"/assets/sol.png"} alt="" width={14} height={14} />
            <span className="text-base font-chakra leading-3 mt-0.5 text-[#94A3B8]">
              {truncateNumber(
                selectedCoinData ? selectedCoinData.amount : 0,
                3,
              )}
            </span>
          </div>
          {/* wallet button  */}
          <div
            onClick={() => {
              setShowWalletModal(true);
            }}
            className="flex items-center h-[2.3rem] px-5 gap-1 bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] transition-all cursor-pointer rounded-[5px]"
          >
            <Image src={"/assets/wallet.png"} alt="" width={15} height={15} />
            <span className="text-xs mt-0.5 text-white text-opacity-90">
              {translator("Wallet", language)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}