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

export default function SubHeader() {
  const router = useRouter();
  const {
    setShowWalletModal,
    setLiveBets,
    language,
    selectedCoin,
    coinData,
    showLiveStats,
    setShowLiveStats,
    enableSounds,
    setEnableSounds,
    liveTokenPrice,
  } = useGlobalContext();

  type Card = {
    game: GameType;
    wallet: string;
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
                    {trimStringToLength(card.wallet ? card.wallet : "", 3)}
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

        {/* <div className={`border-2 border-white border-opacity-5 rounded-[5px] p-3 cursor-pointer ${showFullScreen ? "bg-[#d9d9d9] bg-opacity-10" : ""}`} onClick={() => setShowFullScreen(!showFullScreen)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" fill="none">
            <g opacity="0.75" clipPath="url(#clip0_3204_4400)">
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
            router.pathname === "/" ? "hidden md:flex" : "hidden md:flex"
          } border-2 border-[#26282C] rounded-[5px] p-[0.563rem] cursor-pointer transition-all hover:bg-[#26282C]/50 hover:transition-all ${
            showLiveStats
              ? "bg-[#26282C] border-[#26282C] hover:bg-[#26282C]"
              : ""
          }`}
          onClick={() => setShowLiveStats(!showLiveStats)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g opacity="0.75" clipPath="url(#clip0_3181_1728)">
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
            router.pathname === "/" ? "hidden md:flex" : "hidden md:flex"
          } border-2 border-[#26282C] rounded-[5px] p-[0.563rem] cursor-pointer ml-3 transition-all hover:bg-[#26282C]/50 hover:transition-all ${
            enableSounds
              ? "bg-[#26282C] border-[#26282C] hover:bg-[#26282C]"
              : ""
          }`}
          onClick={() => setEnableSounds(!enableSounds)}
        >
          {!enableSounds && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 500 500"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              xmlSpace="preserve"
              fill={enableSounds ? "white" : "#94A3B8"}
              style={{
                fillRule: "evenodd",
                clipRule: "evenodd",
                strokeLinejoin: "round",
                strokeMiterlimit: 2,
              }}
            >
              <g id="Mute" transform="matrix(1,0,0,1,0.169573,-0.924101)">
                <path d="M320.661,49.169C320.661,46.504 319.247,44.04 316.947,42.695C314.647,41.35 311.806,41.326 309.484,42.632C273.448,62.902 161.379,125.941 139.236,138.397C136.874,139.725 135.413,142.224 135.413,144.933C135.413,173.139 135.413,328.709 135.413,356.915C135.413,359.624 136.874,362.123 139.236,363.452C161.379,375.907 273.448,438.946 309.484,459.216C311.806,460.523 314.647,460.499 316.947,459.153C319.247,457.808 320.661,455.344 320.661,452.679C320.661,389.55 320.661,112.298 320.661,49.169ZM113.8,148.047C113.8,146.058 113.01,144.15 111.604,142.744C110.197,141.337 108.289,140.547 106.3,140.547L50.288,140.547C48.299,140.547 46.392,141.337 44.985,142.744C43.579,144.15 42.788,146.058 42.788,148.047L42.788,353.801C42.788,355.79 43.579,357.698 44.985,359.104C46.392,360.511 48.299,361.301 50.288,361.301C63.931,361.301 92.657,361.301 106.3,361.301C108.289,361.301 110.197,360.511 111.604,359.104C113.01,357.698 113.8,355.79 113.8,353.801L113.8,148.047ZM408,231.88L380.997,204.878C375.997,199.878 367.878,199.878 362.878,204.878C357.878,209.878 357.878,217.997 362.878,222.997L389.88,250L362.878,277.003C357.878,282.003 357.878,290.122 362.878,295.122C367.878,300.122 375.997,300.122 380.997,295.122L408,268.12L435.003,295.122C440.003,300.122 448.122,300.122 453.122,295.122C458.122,290.122 458.122,282.003 453.122,277.003L426.12,250L453.122,222.997C458.122,217.997 458.122,209.878 453.122,204.878C448.122,199.878 440.003,199.878 435.003,204.878L408,231.88Z" />
              </g>
            </svg>
          )}
          {enableSounds && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 500 500"
              version="1.1"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              xmlSpace="preserve"
              style={{
                fillRule: "evenodd",
                clipRule: "evenodd",
                strokeLinejoin: "round",
                strokeMiterlimit: 2,
              }}
            >
              <g id="Audio-on" transform="matrix(1,0,0,1,-3.80678,-0.924101)">
                <path d="M320.661,49.169C320.661,46.504 319.247,44.04 316.947,42.695C314.647,41.35 311.806,41.326 309.484,42.632C273.448,62.902 161.379,125.941 139.236,138.397C136.874,139.725 135.413,142.224 135.413,144.933C135.413,173.139 135.413,328.709 135.413,356.915C135.413,359.624 136.874,362.123 139.236,363.452C161.379,375.907 273.448,438.946 309.484,459.216C311.806,460.523 314.647,460.499 316.947,459.153C319.247,457.808 320.661,455.344 320.661,452.679C320.661,389.55 320.661,112.298 320.661,49.169ZM395.861,142.758C424.207,179.443 439.037,215.803 439.199,251.982C439.36,287.983 424.936,323.546 396.083,358.811C391.606,364.284 392.414,372.363 397.887,376.841C403.36,381.318 411.439,380.51 415.917,375.037C449.107,334.469 465.009,293.282 464.824,251.867C464.639,210.629 448.448,168.905 416.139,127.09C411.815,121.495 403.762,120.462 398.166,124.785C392.571,129.109 391.538,137.162 395.861,142.758ZM113.8,148.047C113.8,146.058 113.01,144.15 111.604,142.744C110.197,141.337 108.289,140.547 106.3,140.547L50.288,140.547C48.299,140.547 46.392,141.337 44.985,142.744C43.579,144.15 42.788,146.058 42.788,148.047L42.788,353.801C42.788,355.79 43.579,357.698 44.985,359.104C46.392,360.511 48.299,361.301 50.288,361.301C63.931,361.301 92.657,361.301 106.3,361.301C108.289,361.301 110.197,360.511 111.604,359.104C113.01,357.698 113.8,355.79 113.8,353.801L113.8,148.047ZM348.057,192.589C375.819,238.172 375.755,276.239 349.213,307.656C344.649,313.057 345.33,321.148 350.731,325.711C356.133,330.275 364.224,329.594 368.787,324.193C402.218,284.622 404.91,236.673 369.943,179.259C366.264,173.22 358.375,171.303 352.335,174.981C346.296,178.66 344.379,186.549 348.057,192.589Z" />
              </g>
            </svg>
          )}
        </div>

        <div
          className={`${
            router.pathname === "/" ? "hidden md:flex" : "hidden md:flex"
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
            className={`border-2 border-white/5 rounded-[5px] p-[0.563rem] cursor-pointer transition-all hover:bg-[#26282C]/50 hover:transition-all ${
              showLiveStats
                ? "bg-[#26282C] border-[#26282C] hover:bg-[#26282C]"
                : ""
            }`}
            onClick={() => setShowLiveStats(!showLiveStats)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g opacity="0.75" clipPath="url(#clip0_3181_1728)">
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
            className={`border-2 border-white/5 rounded-[5px] p-[0.563rem] cursor-pointer ml-2 transition-all hover:bg-[#26282C]/50 hover:transition-all ${
              enableSounds
                ? "bg-[#26282C] border-[#26282C] hover:bg-[#26282C]"
                : ""
            }`}
            onClick={() => setEnableSounds(!enableSounds)}
          >
            {!enableSounds && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 500 500"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                xmlSpace="preserve"
                fill={enableSounds ? "white" : "#94A3B8"}
                style={{
                  fillRule: "evenodd",
                  clipRule: "evenodd",
                  strokeLinejoin: "round",
                  strokeMiterlimit: 2,
                }}
              >
                <g id="Mute" transform="matrix(1,0,0,1,0.169573,-0.924101)">
                  <path d="M320.661,49.169C320.661,46.504 319.247,44.04 316.947,42.695C314.647,41.35 311.806,41.326 309.484,42.632C273.448,62.902 161.379,125.941 139.236,138.397C136.874,139.725 135.413,142.224 135.413,144.933C135.413,173.139 135.413,328.709 135.413,356.915C135.413,359.624 136.874,362.123 139.236,363.452C161.379,375.907 273.448,438.946 309.484,459.216C311.806,460.523 314.647,460.499 316.947,459.153C319.247,457.808 320.661,455.344 320.661,452.679C320.661,389.55 320.661,112.298 320.661,49.169ZM113.8,148.047C113.8,146.058 113.01,144.15 111.604,142.744C110.197,141.337 108.289,140.547 106.3,140.547L50.288,140.547C48.299,140.547 46.392,141.337 44.985,142.744C43.579,144.15 42.788,146.058 42.788,148.047L42.788,353.801C42.788,355.79 43.579,357.698 44.985,359.104C46.392,360.511 48.299,361.301 50.288,361.301C63.931,361.301 92.657,361.301 106.3,361.301C108.289,361.301 110.197,360.511 111.604,359.104C113.01,357.698 113.8,355.79 113.8,353.801L113.8,148.047ZM408,231.88L380.997,204.878C375.997,199.878 367.878,199.878 362.878,204.878C357.878,209.878 357.878,217.997 362.878,222.997L389.88,250L362.878,277.003C357.878,282.003 357.878,290.122 362.878,295.122C367.878,300.122 375.997,300.122 380.997,295.122L408,268.12L435.003,295.122C440.003,300.122 448.122,300.122 453.122,295.122C458.122,290.122 458.122,282.003 453.122,277.003L426.12,250L453.122,222.997C458.122,217.997 458.122,209.878 453.122,204.878C448.122,199.878 440.003,199.878 435.003,204.878L408,231.88Z" />
                </g>
              </svg>
            )}
            {enableSounds && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 500 500"
                version="1.1"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                xmlSpace="preserve"
                style={{
                  fillRule: "evenodd",
                  clipRule: "evenodd",
                  strokeLinejoin: "round",
                  strokeMiterlimit: 2,
                }}
              >
                <g id="Audio-on" transform="matrix(1,0,0,1,-3.80678,-0.924101)">
                  <path d="M320.661,49.169C320.661,46.504 319.247,44.04 316.947,42.695C314.647,41.35 311.806,41.326 309.484,42.632C273.448,62.902 161.379,125.941 139.236,138.397C136.874,139.725 135.413,142.224 135.413,144.933C135.413,173.139 135.413,328.709 135.413,356.915C135.413,359.624 136.874,362.123 139.236,363.452C161.379,375.907 273.448,438.946 309.484,459.216C311.806,460.523 314.647,460.499 316.947,459.153C319.247,457.808 320.661,455.344 320.661,452.679C320.661,389.55 320.661,112.298 320.661,49.169ZM395.861,142.758C424.207,179.443 439.037,215.803 439.199,251.982C439.36,287.983 424.936,323.546 396.083,358.811C391.606,364.284 392.414,372.363 397.887,376.841C403.36,381.318 411.439,380.51 415.917,375.037C449.107,334.469 465.009,293.282 464.824,251.867C464.639,210.629 448.448,168.905 416.139,127.09C411.815,121.495 403.762,120.462 398.166,124.785C392.571,129.109 391.538,137.162 395.861,142.758ZM113.8,148.047C113.8,146.058 113.01,144.15 111.604,142.744C110.197,141.337 108.289,140.547 106.3,140.547L50.288,140.547C48.299,140.547 46.392,141.337 44.985,142.744C43.579,144.15 42.788,146.058 42.788,148.047L42.788,353.801C42.788,355.79 43.579,357.698 44.985,359.104C46.392,360.511 48.299,361.301 50.288,361.301C63.931,361.301 92.657,361.301 106.3,361.301C108.289,361.301 110.197,360.511 111.604,359.104C113.01,357.698 113.8,355.79 113.8,353.801L113.8,148.047ZM348.057,192.589C375.819,238.172 375.755,276.239 349.213,307.656C344.649,313.057 345.33,321.148 350.731,325.711C356.133,330.275 364.224,329.594 368.787,324.193C402.218,284.622 404.91,236.673 369.943,179.259C366.264,173.22 358.375,171.303 352.335,174.981C346.296,178.66 344.379,186.549 348.057,192.589Z" />
                </g>
              </svg>
            )}
          </div>
        </div>
        <CoinSelector />
      </div>
    </div>
  );
}
