import { use, useState } from "react";
import { useGlobalContext } from "@/components/GlobalContext";
import LeaderboardTable from "@/components/Leaderboard";
import {
  formatNumber,
  obfuscatePubKey,
  translator,
  truncateNumber,
} from "@/context/transactions";
import { pointTiers } from "@/context/config";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import FOMOHead from "@/components/HeadElement";
import dynamic from "next/dynamic";
import { errorCustom, successCustom } from "@/components/toasts/ToastGroup";
import user from "@/models/staking/user";
import {
  AdaptiveModal,
  AdaptiveModalContent,
} from "@/components/AdaptiveModal";

const Countdown = dynamic(() => import("react-countdown-now"), {
  ssr: false,
});

interface Bet {
  _id: string;
  account: string;
  game: string;
  amount: number;
  amountWon: number;
  amountLost: number;
  result: "Pending" | "Won" | "Lost";
  createdAt: string;
  tokenMint: string;
  chosenNumbers?: number[];
  strikeNumber?: number;
  strikeMultiplier?: number;
  houseEdge: number;
  nonce: number;
}

export default function Leaderboard() {
  const [page, setPage] = useState(1);
  const [showTooltip, setShowTooltip] = useState(false);
  const [modal, setModal] = useState(false);
  // const [highestProfit, setHighestProfit] = useState<number | null>(null);
  // const [lastGameTime, setLastGameTime] = useState<string | null>(null);
  // const [myBets, setMyBets] = useState<any[]>([]);

  const {
    language,
    session,
    coinData,
    isClaimModalOpen,
    myData,
    reached500,
    claimInfo,
    maxPages,
    transactionsPerPage,
    threshold,
    data,
    setIsClaimModalOpen,
    setMyData,
    setReached500,
    setClaimInfo,
    setMaxPages,
    setData,
    getLeaderBoard,
    fetchClaimInfo,
  } = useGlobalContext();

  const currentDate = new Date();
  const targetDate = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate() + 1,
      0,
      0,
      0,
    ),
  );
  const tokenAmount = useMemo(
    () =>
      Math.max(0, coinData?.find((c) => c.tokenMint === "SUPER")?.amount ?? 0),
    [coinData],
  );

  const renderer = ({
    days,
    hours,
    minutes,
    seconds,
    completed,
  }: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
  }) => {
    const formatValue = (value: number) => value.toString().padStart(2, "0");
    if (completed) {
      // Countdown completed
      return (
        <>
          <TimeBox val={"00"} dimension="Hour" />
          <TimeBox val={"00"} dimension="Min" />
          <TimeBox val={"00"} dimension="Sec" />
        </>
      );
    } else {
      // Render the countdown
      return (
        <>
          <TimeBox val={formatValue(hours)} dimension="Hour" />
          <TimeBox val={formatValue(minutes)} dimension="Min" />
          <TimeBox val={formatValue(seconds)} dimension="Sec" />
        </>
      );
    }
  };

  const TimeBox = ({ val, dimension }: { val: string; dimension: string }) => {
    return (
      <div className="bg-black bg-opacity-25 flex flex-col items-center justify-center w-16 h-16 xl:w-24 xl:h-24">
        <span className="text-white text-opacity-75 text-[1.35rem] xl:text-[2rem]">
          {val}
        </span>
        <span className="text-white text-opacity-50 text-sm">{dimension}</span>
      </div>
    );
  };

  const handleCloseModal = () => {
    setModal(false);
  };

  return (
    <>
      <FOMOHead
        title={"Leaderboard | SUPERBETS.GAMES - 0% House Edge, Pure Wins"}
      />
      <div className="flex flex-col items-start w-full overflow-hidden min-h-screen flex-1 relative p-2 md:pt-[2rem] md:px-[3rem]">
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-stretch gap-4">
          <div className="w-full h-auto lg:w-[70%] min-h-] max-w-[80rem] flex items-center justify-between">
            <div
              className="relative w-full rounded-[10px] h-full min-h-[220px] sm:min-h-[260px] min-w-[18.5rem] overflow-hidden"
              style={{
                background:
                  "linear-gradient(268.94deg, #5F4DFF -24.59%, rgba(57, 46, 153, 0.3) 59.68%)",
              }}
            >
              <Image
                className="absolute bottom-0 -left-8"
                src="/assets/leaderboard-banner-lower-rec.png"
                alt="banner-aesthetic"
                width={220}
                height={150}
              />
              <Image
                className="absolute top-0 left-28"
                src="/assets/leaderboard-banner-upper-rec.png"
                alt="banner-aesthetic"
                width={180}
                height={130}
              />
              <Image
                className="absolute top-0 right-0"
                src="/assets/leaderboard-banner-gift.svg"
                alt="banner-aesthetic"
                width={93}
                height={96}
              />
              <div className="absolute flex items-center justify-between gap-8 pl-6 pr-10 top-0 left-0 w-full h-full">
                <div className="flex flex-col justify-between gap-8">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Image
                      src={"/assets/leaderboardTrophy.svg"}
                      width={80}
                      height={80}
                      alt={"User"}
                      className="rounded-full overflow-hidden"
                    />
                    <div>
                      <h2 className="font-bold text-white text-[2rem] lg:text-3xl xl:text-4xl 2xl:text-5xl mb-1">
                        Win $1
                      </h2>
                      <p className="text-[#94A3B8] font-medium text-sm xl:text-base">
                        Get Rewarded 1 $USDC once you reach 500 Coins!
                      </p>
                    </div>
                  </div>
                  <div
                    className="hidden sm:block font-semibold text-sm text-white/90 bg-[#5F4DFF]/50 rounded-[10px] border-2 border-[#FFFFFF0D] py-2.5 px-3.5 w-max"
                    onClick={() => setModal(true)}
                  >
                    How it Works
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-start gap-2 xl:gap-4">
                  <span className="text-lg xl:text-xl text-white text-opacity-50">
                    Leaderboard Resets in
                  </span>
                  <div className="flex items-center gap-1 rounded-[0.625rem] overflow-hidden">
                    <Countdown date={targetDate} renderer={renderer} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* user box */}
          <div className="w-full flex-1 h-auto flex flex-col justify-start bg-[#1B1C30] rounded-[0.625rem] p-4 gap-4">
            {/* user info  */}
            <div className="flex items-center gap-2">
              {session?.user?.image ? (
                <Image
                  src={session?.user?.image ?? ""}
                  width={45}
                  height={45}
                  alt={"User"}
                  className="rounded-full overflow-hidden"
                />
              ) : (
                <div className="bg-[#252740] rounded-full p-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    className="text-white size-6"
                  >
                    <path
                      stroke-Linecap="round"
                      stroke-Linejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
              )}

              <div className="flex flex-col items-start">
                <span className="text-white font-semibold text-sm text-opacity-75">
                  {session?.user?.name ?? "Player"}
                </span>
                <span className="text-white text-xs font-medium text-opacity-50">
                  {session?.user?.email
                    ? session.user.email
                    : "player@superbets.com"}
                </span>
              </div>
            </div>
            {/* progress  */}
            <div className="bg-[#252740] bg-opacity-50 rounded-[0.625rem] p-4">
              {myData?.isWeb2User ? (
                <div className="text-white text-xs font-medium text-opacity-50 mb-1">
                  Claim $1 progress
                </div>
              ) : (
                <div className="text-white text-xs font-medium text-opacity-50 mb-1 relative">
                  Not Eligible{" "}
                  <span
                    className="text-white text-opacity-35 underline cursor-pointer"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    Why?
                  </span>
                  {showTooltip && (
                    <>
                      <div className="absolute left-5 -top-[70px] mt-2 p-2 bg-[#D9D9D9] text-[#1A1A1A] text-xs rounded shadow-lg z-10 w-60">
                        Users who have deposited/withdrawn crypto from wallet
                        are not eligible!
                      </div>
                      <div className="absolute z-10 left-[76px] -top-[24px] bg-[#D9D9D9] rotate-45 p-2"></div>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between gap-8">
                {myData?.isWeb2User ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-white text-sm font-semibold text-opacity-75">
                      {formatNumber((tokenAmount * 100) / threshold, 2)}%
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-white text-sm font-semibold text-opacity-75">
                      0.00%
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Image
                    src={"/assets/headCoin.png"}
                    width={13}
                    height={13}
                    alt={"User"}
                    className="rounded-full overflow-hidden"
                  />
                  <span className="text-white text-sm font-semibold text-opacity-75">
                    {tokenAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    /500
                  </span>
                </div>
              </div>
              <div
                className={`relative flex transition-width duration-1000 w-full rounded-full overflow-hidden h-1 bg-[#282E3D] mt-2 mb-2`}
              >
                <div className="absolute h-full w-full bg-transparent flex items-center justify-evenly">
                  {Array.from({ length: 0 }, (_, index) => index + 1).map(
                    (_, index) => (
                      <div key={index} className="bg-[#202138] w-1 h-1" />
                    ),
                  )}
                </div>
                {myData?.isWeb2User && (
                  <div
                    style={{
                      width: `${(tokenAmount * 100) / threshold}%`,
                    }}
                    className="h-full bg-[#5F4DFF]"
                  />
                )}
              </div>
            </div>
            {!reached500 ? (
              <div className="bg-[#252740] bg-opacity-50 rounded-[0.625rem] p-4">
                <div className="text-white text-xs font-medium text-opacity-50 mb-1">
                  Winners progress
                </div>
                <div className="flex items-center justify-between gap-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-white text-sm font-semibold text-opacity-75">
                      {formatNumber((claimInfo.claimedCount * 100) / 10, 2)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src={"/assets/leaderboardTrophy.svg"}
                      width={13}
                      height={13}
                      alt={"User"}
                      className="rounded-full overflow-hidden"
                    />
                    <span className="text-white text-sm font-semibold text-opacity-75">
                      {claimInfo.claimedCount}/10
                    </span>
                  </div>
                </div>
                <div
                  className={`relative flex transition-width duration-1000 w-full rounded-full overflow-hidden h-1 bg-[#282E3D] mt-2 mb-2`}
                >
                  <div className="absolute h-full w-full bg-transparent flex items-center justify-evenly">
                    {Array.from({ length: 9 }, (_, index) => index + 1).map(
                      (_, index) => (
                        <div key={index} className="bg-[#202138] w-1 h-1" />
                      ),
                    )}
                  </div>
                  <div
                    style={{
                      width: `${claimInfo.claimedCount * 10}%`,
                    }}
                    className="h-full bg-[#5F4DFF]"
                  />
                </div>
              </div>
            ) : (
              <div
                className={`bg-[#5F4DFF] hover:bg-[#5F4DFF]/50 transition-all duration-300 text-white ${myData?.isUSDCClaimed ? "bg-opacity-50" : "bg-opacity-70"} rounded-[10px] text-center text-sm text-opacity-90 font-semibold w-full py-3 cursor-pointer`}
                onClick={() => {
                  if (!myData?.isUSDCClaimed) setIsClaimModalOpen(!isClaimModalOpen);
                }}
              >
                {myData?.isUSDCClaimed
                  ? "Reward Claimed"
                  : "Claim your 1 USDC!"}
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex flex-1 flex-col items-start gap-5 pb-10">
          <LeaderboardTable
            data={data}
            page={page}
            setPage={setPage}
            maxPages={maxPages}
          />
        </div>
        {/* Modal */}
        {modal && (
          <AdaptiveModal open={modal} onOpenChange={handleCloseModal}>
            <AdaptiveModalContent
              className={`bg-[#121418] sm:overflow-y-auto min-h-[40dvh] max-h-[85dvh] w-full px-8 pb-6`}
            >
              <div className="pt-6 sm:pt-0">
                <h1 className="text-white text-opacity-90 font-bold text-2xl">
                  How It Works?
                </h1>
                <div className="flex flex-col items-center py-8 w-full">
                  <div className="bg-[#FFFFFF05] text-[#FFFFFFBF] text-sm text-center rounded-[10px] p-5 w-full">
                    Get 100 coins when you sign up.
                  </div>
                  <svg
                    width="2"
                    height="25"
                    viewBox="0 0 2 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="1"
                      y1="4.8822e-08"
                      x2="0.999999"
                      y2="25"
                      stroke="white"
                      stroke-opacity="0.2"
                      stroke-width="2"
                      stroke-dasharray="2 2"
                    />
                  </svg>
                  <div className="bg-[#FFFFFF05] text-[#FFFFFFBF] text-sm text-center rounded-[10px] p-5 w-full">
                    Use your coins to bet on any casino games.
                  </div>
                  <svg
                    width="2"
                    height="25"
                    viewBox="0 0 2 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="1"
                      y1="4.8822e-08"
                      x2="0.999999"
                      y2="25"
                      stroke="white"
                      stroke-opacity="0.2"
                      stroke-width="2"
                      stroke-dasharray="2 2"
                    />
                  </svg>
                  <div className="bg-[#FFFFFF05] text-[#FFFFFFBF] text-sm text-center rounded-[10px] p-5 w-full">
                    The first 10 players to reach 500 coins on the leaderboard
                    win 1 $USDC each
                  </div>
                  <svg
                    width="2"
                    height="25"
                    viewBox="0 0 2 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="1"
                      y1="4.8822e-08"
                      x2="0.999999"
                      y2="25"
                      stroke="white"
                      stroke-opacity="0.2"
                      stroke-width="2"
                      stroke-dasharray="2 2"
                    />
                  </svg>
                  <div className="bg-[#FFFFFF05] text-[#FFFFFFBF] text-sm text-center rounded-[10px] p-5 w-full">
                    Every 24 hours, the leaderboard resets. All coins are
                    burned, and everyone starts fresh with 100 coins.
                  </div>
                </div>
                <div
                  className="bg-[#5F4DFF]/50 hover:bg-[#5F4DFF]/50 transition-all duration-300 text-white  rounded-[10px] text-center text-sm text-opacity-90 font-semibold w-full py-3 cursor-pointer"
                  onClick={() => setModal(false)}
                >
                  Close
                </div>
              </div>
            </AdaptiveModalContent>
          </AdaptiveModal>
        )}
      </div>
    </>
  );
}
