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
import { useWallet } from "@solana/wallet-adapter-react";
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
  const wallet = useWallet();
  const [maxPages, setMaxPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [myData, setMyData] = useState<any>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reached500, setReached500] = useState(false);
  const [claimInfo, setClaimInfo] = useState({
    claimedCount: 0,
    spotsLeft: 10,
  });

  // const [highestProfit, setHighestProfit] = useState<number | null>(null);
  // const [lastGameTime, setLastGameTime] = useState<string | null>(null);
  // const [myBets, setMyBets] = useState<any[]>([]);

  const { language, session, coinData } = useGlobalContext();

  const transactionsPerPage = 10;
  const threshold = 500;
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

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

  const getLeaderBoard = async () => {
    try {
      const res = await fetch("/api/getInfo", {
        method: "POST",
        body: JSON.stringify({
          option: 4,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      let { success, message, users } = await res.json();
      if (success && Array.isArray(users)) {
        users = users.map((user, index) => {
          return {
            ...user,
            rank: index + 1,
          };
        });

        setMaxPages(Math.ceil(users.length / transactionsPerPage));

        setData(users);

        if (session?.user?.email) {
          let userInfo = users.find(
            (info: any) =>
              (info?.email && info?.email === session?.user?.email) ||
              (info?.wallet && info?.wallet === session?.user?.wallet),
          );

          if (userInfo.numOfGamesPlayed === 0) setIsModalOpen(true);

          setMyData(userInfo);
        }
      } else {
        setData([]);
        errorCustom(translator("Could not fetch leaderboard.", language));
      }
    } catch (e) {
      setData([]);
      errorCustom(translator("Could not fetch leaderboard.", language));
      console.error(e);
    }
  };

  const fetchClaimInfo = async () => {
    try {
      const response = await fetch("/api/games/user/claimUSDC");
      const data = await response.json();
      setClaimInfo(data);
    } catch (error) {
      console.error("Error fetching USDC claim information:", error);
    }
  };

  console.log("myData", myData);
  const claimUSDCReward = async () => {
    try {
      const response = await fetch("/api/games/user/claimUSDC", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: myData._id,
          email: session?.user?.email,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchClaimInfo();
        getLeaderBoard();
        successCustom("USDC reward claimed successfully.");
      } else {
        errorCustom(translator(data.message, language));
      }
    } catch (error) {
      console.error("Error claiming USDC reward:", error);
      errorCustom(translator("Error claiming USDC reward.", language));
    }
  };

  useEffect(() => {
    getLeaderBoard();
  }, [session?.user]);

  useEffect(() => {
    fetchClaimInfo();
  }, []);

  useEffect(() => {
    if (tokenAmount >= 500) {
      setReached500(true);
      if (!myData.isUSDCClaimed) setIsModalOpen(true);
    }
  }, [tokenAmount]);

  // const calculateHighestProfit = (bets: Bet[]): number => {
  //   return bets.reduce((maxProfit, bet) => {
  //     if (bet.result === "Won") {
  //       const profit = bet.amountWon - bet.amount;
  //       return Math.max(maxProfit, profit);
  //     }
  //     return maxProfit;
  //   }, 0);
  // };

  // const calculateLastGameTime = (bets: Bet[]): string => {
  //   if (bets.length === 0) return "N/A";

  //   const lastGame = bets.reduce((latest, bet) => {
  //     return new Date(bet.createdAt) > new Date(latest.createdAt)
  //       ? bet
  //       : latest;
  //   });

  //   const timeDiff = Date.now() - new Date(lastGame.createdAt).getTime();
  //   const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  //   const hours = Math.floor(
  //     (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  //   );
  //   const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  //   if (days > 0) {
  //     if (days > 1) return `${days} days ago`;
  //     else return `${days} day ago`;
  //   } else if (hours > 0) {
  //     if (hours > 1) return `${hours} hrs ago`;
  //     else return `${hours} hr ago`;
  //   } else {
  //     return `${minutes} min ago`;
  //   }
  // };

  // const userHistory = async () => {
  //   try {
  //     const res = await fetch(
  //       `/api/games/global/getUserHistory?email=${session?.user?.email}`,
  //     );
  //     const history = await res.json();
  //     if (history.success) {
  //       const bets: Bet[] = history?.data ?? [];
  //       setMyBets(bets);
  //       console.log("history", bets);

  //       // Calculate highest profit
  //       const highestProfit = calculateHighestProfit(bets);
  //       setHighestProfit(highestProfit);

  //       // Calculate time since last game
  //       const lastGameTimeInfo = calculateLastGameTime(bets);
  //       setLastGameTime(lastGameTimeInfo);
  //     } else {
  //       setMyBets([]);
  //       setHighestProfit(null);
  //       setLastGameTime(null);
  //     }
  //   } catch (err) {
  //     setMyBets([]);
  //     setHighestProfit(null);
  //     setLastGameTime(null);
  //     console.error(err);
  //   }
  // };

  // useEffect(() => {
  //   userHistory();
  // }, [session?.user]);

  return (
    <>
      <FOMOHead
        title={"Leaderboard | SUPERBETS.GAMES - 0% House Edge, Pure Wins"}
      />
      <div className="flex flex-col items-start w-full overflow-hidden min-h-screen flex-1 relative p-2 md:pt-[2rem] md:px-[3rem] relative">
        {/* Navbar  */}
        {/* <span className="text-white text-opacity-90 font-semibold text-[1.5rem] sm:text-[2rem] mt-[1rem] font-chakra tracking-[.02em] flex items-center justify-center gap-x-2 px-5 sm:px-10 2xl:px-[5%]">
          {translator("Leaderboard", language).toUpperCase()}
        </span> */}

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
                <div className="flex flex-col gap-8">
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
                        Win $1 campaign
                      </h2>
                      <p className="text-[#94A3B8] font-medium text-sm xl:text-base">
                        Get Rewarded 1 $USDC once you reach 500 Coins!
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block font-semibold text-sm text-white/90 bg-[#5F4DFF]/50 rounded-[10px] border-2 border-[#FFFFFF0D] p-2.5 w-max">
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
                    : wallet.publicKey?.toString()
                      ? wallet.publicKey?.toString()
                      : "player@superbets.com"}
                </span>
              </div>
            </div>
            {/* progress  */}
            <div className="bg-[#252740] bg-opacity-50 rounded-[0.625rem] p-4">
              <div className="text-white text-xs font-medium text-opacity-50 mb-1">
                Claim $1 progress
              </div>
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-sm font-semibold text-opacity-75">
                    {formatNumber((tokenAmount * 100) / threshold, 2)}%
                  </span>
                </div>
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
                  {Array.from({ length: 4 }, (_, index) => index + 1).map(
                    (_, index) => (
                      <div key={index} className="bg-[#202138] w-1 h-1" />
                    ),
                  )}
                </div>
                <div
                  style={{
                    width: `${(tokenAmount * 100) / threshold}%`,
                  }}
                  // className="h-full bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)]"
                  className="h-full bg-[#5F4DFF]"
                />
              </div>
            </div>
            {/* claim button  */}
            {/* <button
              type="submit"
              disabled={false}
              className={`disabled:cursor-default disabled:opacity-70 hover:duration-75 hover:opacity-90 w-full p-2 rounded-lg transition-all bg-[#5F4DFF] disabled:bg-[#555555] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] flex items-center justify-center font-chakra font-semibold text-sm text-opacity-90 tracking-wider text-white`}
            >
              {translator("Claim Now", language)}
            </button> */}

            {!reached500 ? (
              // <div className="flex gap-4 text-white">
              //   <div className="flex flex-col items-center bg-[#252740] bg-opacity-50 rounded-[0.625rem] p-4 w-full">
              //     <div className="text-white/50 text-xs font-medium">
              //       Activity
              //     </div>
              //     <div className="text-white/75 text-center text-sm xl:text-base font-semibold">
              //       {lastGameTime ?? "N/A"}
              //     </div>
              //   </div>
              //   <div className="flex flex-col items-center bg-[#252740] bg-opacity-50 rounded-[0.625rem] p-4 w-full">
              //     <div className="text-white/50 text-xs text-center font-medium">
              //       Biggest Gain
              //     </div>
              //     <div className="text-white/75  text-center text-sm xl:text-base font-semibold">
              //       +{highestProfit?.toFixed(2)}
              //     </div>
              //   </div>
              // </div>
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
                    // className="h-full bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)]"
                    className="h-full bg-[#5F4DFF]"
                  />
                </div>
              </div>
            ) : (
              <div
                className={`bg-[#5F4DFF] hover:bg-[#5F4DFF]/50 transition-all duration-300 text-white ${myData.isUSDCClaimed ? "bg-opacity-50" : "bg-opacity-70"} rounded-[10px] text-center text-sm text-opacity-90 font-semibold w-full py-3`}
                onClick={() => {
                  if (!myData.isUSDCClaimed) setIsModalOpen(!isModalOpen);
                }}
              >
                {myData.isUSDCClaimed ? "Reward Claimed" : "Claim your 1 USDC!"}
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
            myData={myData}
          />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <AdaptiveModal open={isModalOpen} onOpenChange={handleCloseModal}>
          <AdaptiveModalContent
            className={`bg-[#121418] sm:overflow-y-auto min-h-[40dvh] max-h-[85dvh] w-full pb-6`}
          >
            <div className="flex flex-col w-full gap-3.5 px-4 sm:p-0 pt-6 justify-center overflow-y-auto">
              {!reached500 && (
                <div className="mx-auto mb-4">
                  <Image
                    src={"/assets/supertoken.png"}
                    width={180}
                    height={150}
                    alt={"Coin"}
                  />
                </div>
              )}
              {!reached500 ? (
                <div className="flex flex-col bg-[#FFFFFF05] font-semibold text-lg text-white text-opacity-75 text-center p-3.5 rounded-md md:mt-8 font-changa">
                  <p className="pb-3">Congrats! you’ve received</p>
                  <p className="flex items-center justify-center gap-2 text-white font-bold text-[2.5rem]">
                    <Image
                      src={"/assets/headCoin.png"}
                      width={30}
                      height={30}
                      alt={"User"}
                      className="rounded-full overflow-hidden"
                    />
                    <span>100</span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col bg-[#FFFFFF05] font-semibold text-lg text-white text-opacity-75 text-center p-3.5 rounded-md md:mt-8 font-changa">
                  <p className="pb-3">Congrats! you've won</p>
                  <p className="text-white font-bold text-[2.5rem]">
                    <span>$1 USDC</span>
                  </p>
                </div>
              )}

              <div className="bg-[#252740] bg-opacity-50 rounded-[0.625rem] p-4">
                <div className="text-white text-xs font-medium text-opacity-50 mb-1">
                  Claim $1 progress
                </div>
                <div className="flex items-center justify-between gap-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-white text-sm font-semibold text-opacity-75">
                      {formatNumber((tokenAmount * 100) / threshold, 2)}%
                    </span>
                  </div>
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
                    {Array.from({ length: 4 }, (_, index) => index + 1).map(
                      (_, index) => (
                        <div key={index} className="bg-[#202138] w-1 h-1" />
                      ),
                    )}
                  </div>
                  <div
                    style={{
                      width: `${(tokenAmount * 100) / threshold}%`,
                    }}
                    // className="h-full bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)]"
                    className="h-full bg-[#5F4DFF]"
                  />
                </div>
              </div>

              {!reached500 && (
                <div className="mx-auto mb-4">
                  <Image
                    src={"/assets/campaign-banner.png"}
                    width={350}
                    height={300}
                    alt={"Banner"}
                  />
                </div>
              )}

              {reached500 && (
                <div
                  onClick={() => claimUSDCReward()}
                  className="bg-[#5F4DFF] text-white bg-opacity-50 rounded-[10px] text-center text-sm text-opacity-90 font-semibold w-full py-3"
                >
                  Claim your 1 USDC!
                </div>
              )}
            </div>
          </AdaptiveModalContent>
        </AdaptiveModal>
      )}
    </>
  );
}
