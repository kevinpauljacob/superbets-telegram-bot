import { use, useState } from "react";
import { useGlobalContext } from "@/components/GlobalContext";
import LeaderboardTable from "@/components/Leaderboard";
import {
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
import { errorCustom } from "@/components/toasts/ToastGroup";

const Countdown = dynamic(() => import("react-countdown-now"), {
  ssr: false,
});

export default function Leaderboard() {
  const wallet = useWallet();
  const { liveBets } = useGlobalContext();
  const [topThreeUsers, setTopThreeUsers] = useState<any[]>([]);
  const [maxPages, setMaxPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [myData, setMyData] = useState<any>();
  const [activity, setActivity] = useState();
  const [highestWin, setHighestWin] = useState<number | null>(null);

  const { language, userData, pointTier, setPointTier, session, coinData } =
    useGlobalContext();
  const transactionsPerPage = 10;

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
            activity: timeSince(user.updatedAt),
          };
        });

        setMaxPages(Math.ceil(users.length / transactionsPerPage));

        setData(users);

        setTopThreeUsers(users.slice(0, 3));

        if (session?.user?.email) {
          let userInfo = users.find(
            (info: any) =>
              (info?.email && info?.email === session?.user?.email) ||
              (info?.wallet && info?.wallet === session?.user?.wallet),
          );

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

  console.log("liveBets", liveBets);
  useEffect(() => {
    getLeaderBoard();
  }, []);

  // useEffect(() => {
  //   let maxWin: number | null = null;

  //   liveBets.forEach((bet) => {
  //     if (bet.gameSeed.account === session?.user?._id) {
  //       if (maxWin === null || bet.amountWon > maxWin) {
  //         maxWin = bet.amountWon;
  //       }
  //     }
  //   });

  //   setHighestWin(maxWin);
  // }, [liveBets, userId]);

  useEffect(() => {
    let points = userData?.points ?? 0;
    const tier = Object.entries(pointTiers).reduce((prev, next) => {
      return points >= next[1]?.limit ? next : prev;
    });
    // console.log(tier, pointTiers["2"]);
    // console.log("pointTiers", pointTiers);
    setPointTier({
      index: parseInt(tier[0]),
      limit: tier[1]?.limit,
      image: `/assets/badges/T-${tier[0]}.png`,
      label: tier[1].label,
    });
  }, [userData]);

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

  const timeSince = (date: string | Date): string => {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1)
      return interval + " yr" + (interval > 1 ? "s" : "") + " ago";

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1)
      return interval + " mo" + (interval > 1 ? "s" : "") + " ago";

    interval = Math.floor(seconds / 86400);
    if (interval >= 1)
      return interval + " d" + (interval > 1 ? "s" : "") + " ago";

    interval = Math.floor(seconds / 3600);
    if (interval >= 1)
      return interval + " hr" + (interval > 1 ? "s" : "") + " ago";

    interval = Math.floor(seconds / 60);
    if (interval >= 1)
      return interval + " min" + (interval > 1 ? "s" : "") + " ago";

    return Math.floor(seconds) + " s ago";
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
      <div className="bg-black bg-opacity-25 flex flex-col items-center justify-center w-24 h-24">
        <span className="text-white text-opacity-75 text-[2rem]">{val}</span>
        <span className="text-white text-opacity-50 text-sm">{dimension}</span>
      </div>
    );
  };

  return (
    <>
      <FOMOHead title={"Leaderboard | SUPERBETS.GAMES - 0% House Edge, Pure Wins"} />
      <div className="flex flex-col items-start w-full overflow-hidden min-h-screen flex-1 relative p-2 md:pt-[2rem] md:px-[3rem]">
        {/* Navbar  */}
        {/* <span className="text-white text-opacity-90 font-semibold text-[1.5rem] sm:text-[2rem] mt-[1rem] font-chakra tracking-[.02em] flex items-center justify-center gap-x-2 px-5 sm:px-10 2xl:px-[5%]">
          {translator("Leaderboard", language).toUpperCase()}
        </span> */}

        <div className="w-full flex flex-col lg:flex-row items-center lg:items-stretch gap-4">
          <div className="w-full h-auto lg:w-[70%] max-w-[80rem] flex items-center justify-between relative">
            <div className="hidden sm:block w-full h-full min-w-[18.5rem]">
              <Image
                src={"/assets/leaderboard-bg.svg"}
                alt="banners"
                width="100"
                height="100"
                unoptimized
                className="w-[100%]"
              />
            </div>
            <div className="sm:hidden w-full h-full min-w-[18.5rem]">
              <Image
                src={"/assets/leaderboard-bg-mobile.svg"}
                alt="banners"
                width="100"
                height="100"
                unoptimized
                className="w-[100%]"
              />
            </div>
            <div className="absolute flex items-center justify-between gap-4 pl-6 pr-10 top-0 left-0 w-full h-full">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                  <Image
                    src={"/assets/leaderboardTrophy.svg"}
                    width={80}
                    height={80}
                    alt={"User"}
                    className="rounded-full overflow-hidden"
                  />
                  <div>
                    <h2 className="font-bold text-white text-3xl sm:text-5xl mb-1">
                      Win $1 campaign
                    </h2>
                    <p className="text-[#94A3B8] font-medium text-sm sm:text-base">
                      Get Rewarded 1 $USDC once you reach 500 Coins!
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block font-semibold text-sm text-white/90 bg-[#5F4DFF]/50 rounded-[10px] border-2 border-[#FFFFFF0D] p-2.5 w-max">
                  How it Works
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-start gap-4">
                <span className="text-xl text-white text-opacity-50">
                  Leaderboard Resets in
                </span>
                <div className="flex items-center gap-1 rounded-[0.625rem] overflow-hidden">
                  <Countdown date={targetDate} renderer={renderer} />
                </div>
              </div>
            </div>
          </div>
          {/* user box */}
          <div className="w-full flex-1 h-auto flex flex-col justify-start bg-[#1B1C30] rounded-[0.625rem] p-4 gap-4">
            {/* user info  */}
            <div className="flex items-center gap-2">
              <Image
                src={session?.user?.image ?? ""}
                width={45}
                height={45}
                alt={"User"}
                className="rounded-full overflow-hidden"
              />
              <div className="flex flex-col items-start">
                <span className="text-white font-semibold text-sm text-opacity-75">
                  {session?.user?.name ?? "Player"}
                </span>
                <span className="text-white text-xs font-medium text-opacity-50">
                  {session?.user?.email ?? "player@superbets.com"}
                </span>
              </div>
            </div>
            {/* progress  */}
            <div className="bg-[#252740] bg-opacity-50 rounded-[0.625rem] p-4">
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-xs font-medium text-opacity-50">
                    Claim $1 progress
                  </span>
                  <span className="text-white text-sm font-semibold text-opacity-75">
                    {(tokenAmount * 100) / threshold}%
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
            <div className="flex gap-4 text-white">
              <div className="flex flex-col items-center bg-[#252740] bg-opacity-50 rounded-[0.625rem] p-4 w-full">
                <div className="text-white/50 text-xs font-medium">
                  Activity
                </div>
                <div className="text-white/75 font-semibold">
                  {myData?.activity}
                </div>
              </div>
              <div className="flex flex-col items-center bg-[#252740] bg-opacity-50 rounded-[0.625rem] p-4 w-full">
                <div className="text-white/50 text-xs font-medium">
                  Biggest Gain
                </div>
                <div className="text-white/75 font-semibold">+</div>
              </div>
            </div>
          </div>
        </div>

        {/* {topThreeUsers.length > 0 && 
          <div className="flex flex-col md:flex-row gap-2.5 w-full mt-16 mb-8">
            {[topThreeUsers[1], topThreeUsers[0], topThreeUsers[2]].map(
              (user, index) => {
                const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3;
                return (
                  <div
                    key={index}
                    className={`p-[2.5px] w-full rounded-[10px] bg-gradient-to-b ${index === 1 ? "from-[#37475F]" : "from-[#FFC5331A]"} from-56.4% to-[#121418] to-100%`}
                  >
                    <div className="relative bg-[#121418] text-white rounded-[8px] p-8">
                      <div className="flex items-center justify-center gap-2">
                        <Image
                          src={user?.image ?? "/assets/user.svg"}
                          alt="user"
                          width={26}
                          height={26}
                          className="rounded-full overflow-hidden"
                        />
                        <div className="font-semibold text-lg">
                          {user?.name ?? obfuscatePubKey(user?.wallet)}
                        </div>
                      </div>
                      <div className="bg-[#181E29] h-[2px] my-5"></div>
                      <div>
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <div>Activity</div>
                          <div>Coins</div>
                        </div>
                        <div className="flex items-center justify-between text-white/75">
                          <div>2s ago</div>
                          <div className="flex items-center gap-2">
                            <Image
                              src="/assets/leaderboardCoin.svg"
                              alt="coin"
                              width={15}
                              height={15}
                            />
                            <div>
                              {parseInt(
                                user?.deposit?.amount ?? 0,
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Image
                        className="absolute -top-5 left-1/2 transform -translate-x-1/2"
                        src={`/assets/${index === 0 ? "first" : index === 1 ? "second" : "third"}.svg`}
                        alt={`${index + 1}st`}
                        width={40}
                        height={40}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div> */}

        {/* <div className="flex gap-[12px] px-5 sm:px-10 2xl:px-[5%] mt-6 w-full h-full ">
          <div className="flex flex-col lg:flex-row items-center w-full md:w-[55%] lg:w-[60%] h-full p-8 rounded-md gap-[3.4rem] bg-staking-bg">
            <div className="flex flex-col w-full rounded-[5px] h-full ">
              <div className="flex flex-row items-end justify-between">
                <div className="flex flex-col justify-center sm:flex-row sm:items-center sm:justify-start gap-2 w-full">
                  <div className="flex relative min-w-[4.5rem] h-[4.5rem]">
                    <Image
                      src={pointTier.image}
                      alt={pointTier.label}
                      layout="fill"
                      objectFit="contain"
                      objectPosition="center"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 items-center sm:items-start font-chakra">
                    <span className="text-white text-xl tracking-wider font-bold">
                      {wallet.publicKey
                        ? obfuscatePubKey(wallet.publicKey.toBase58())
                        : "...."}
                    </span>
                    <span className="text-staking-secondary text-sm font-medium">
                      {pointTier?.label
                        ? translator(
                            pointTier?.label.split(" ")?.[0],
                            language,
                          ) +
                          " " +
                          pointTier?.label.split(" ")?.[1]
                        : ""}
                    </span>
                  </div>
                </div>
                {(pointTier?.index ?? 0) < 7 && (
                  <div className="hidden sm:flex sm:flex-col sm:items-end">
                    <span className="text-white text-base text-opacity-50">
                      {translator("Next Tier", language)}
                    </span>
                    <span className="text-base font-semibold text-opacity-75 text-[#5F4DFF]">
                      {pointTiers[pointTier?.index + 1]?.label ?? ""}
                    </span>
                  </div>
                )}
              </div>
              next tier data - mob view
              {(pointTier?.index ?? 0) < 7 && (
                <div className="flex sm:hidden mt-5 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex text-white text-xs text-opacity-50">
                      {translator("Next Tier", language)}
                    </span>
                    <span className="text-base font-semibold text-opacity-75 text-[#5F4DFF]">
                      {pointTiers[pointTier?.index + 1]?.label ?? ""}
                    </span>
                  </div>

                  <span className="flex items-center justify-start text-base -mt-1 text-white text-right text-opacity-50 font-semibold">
                    {formatNumber(pointTiers[pointTier?.index + 1]?.limit ?? 0) +
                    " Points"}
                  </span>
                </div>
              )}
              <div className="flex flex-row justify-between font-chakra mt-4">
                <span className="text-sm text-white text-right text-opacity-75">
                  {translator("Your level progress", language)}
                </span>
                {(pointTier?.index ?? 0) < 7 && (
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-white text-right text-opacity-75">
                      {truncateNumber(
                        pointTiers[pointTier?.index + 1]?.limit ?? 0,
                        0,
                      ) + ` ${translator("Points", language)}`}
                    </span>
                  </div>
                )}
              </div>
              <div
                className={`${
                  (Math.min(userData?.points ?? 0, 1_000_000) * 100) /
                    pointTiers[pointTier?.index + 1]?.limit ?? 1
                    ? "opacity-90"
                    : ""
                } relative flex transition-width duration-1000 w-full rounded-full overflow-hidden h-6 bg-[#282E3D] mt-2 mb-2`}
              >
                <div
                  style={{
                    width: `10%`,
                  }}
                  className="h-full bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)]"
                />
                <span className="w-full h-full absolute top-0 left-0 flex items-center justify-center z-10 text-white font-semibold font-chakra text-xs">
                  {truncateNumber(
                    (Math.min(userData?.points ?? 0, 1_000_000) * 100) /
                      (pointTiers[pointTier?.index + 1]?.limit ?? 1_000_000),
                    2,
                  )}{" "}
                  %
                </span>
              </div>
              <div className="flex flex-row justify-between font-chakra capitalize">
                <span className="text-staking-secondary text-opacity-75 text-sm font-medium">
                  {pointTier?.label
                    ? pointTier?.label.includes(" ")
                      ? translator(pointTier?.label.split(" ")[0], language) +
                        " " +
                        pointTier?.label.split(" ")[1]
                      : translator(pointTier?.label, language)
                    : ""}
                </span>
                <span className="flex items-center gap-1 text-staking-secondary text-opacity-75 text-sm font-medium">
                  <div className="flex relative min-w-[1rem] h-[1rem]">
                    <Image
                      src={`/assets/badges/T-${pointTier?.index + 1}.png`}
                      alt={pointTier.label}
                      layout="fill"
                      objectFit="contain"
                      objectPosition="center"
                    />
                  </div>
                  {pointTiers[pointTier?.index + 1]?.label
                    ? pointTiers[pointTier?.index + 1]?.label.includes(" ")
                      ? translator(
                          pointTiers[pointTier?.index + 1]?.label.split(" ")[0],
                          language,
                        ) +
                        " " +
                        pointTiers[pointTier?.index + 1]?.label.split(" ")[1]
                      : translator(
                          pointTiers[pointTier?.index + 1]?.label,
                          language,
                        )
                    : ""}
                </span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex flex-col justify-between gap-[12px] md:w-[45%] lg-w-[40%] h-[232px]">
            <div className="flex items-center gap-[12px] bg-staking-bg rounded-[5px] p-4 h-[50%]">
              <div className="flex justify-center items-center bg-[#202329] rounded-lg w-[73px] h-[68px]">
                <Image
                  src="/assets/boost.svg"
                  alt="boost logo"
                  height={36}
                  width={36}
                />
              </div>
              <div>
                <p className="text-white font-semibold text-base text-opacity-75">
                  {translator("Boost Your Tier by Staking!", language)}
                </p>
                <p className="text-[#94A3B8] font-semibold text-[11px] text-opacity-50 max-w-[290px]">
                  {translator(
                    "You can stake your $FOMO to obtain higher multiplier for your points!",
                    language,
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-[12px] w-full h-[50%]">
              <div className="flex flex-col justify-between gap-[12px] bg-staking-bg rounded-[5px] p-4 w-full h-full">
                <p className="text-xs font-medium text-opacity-50 text-white">
                  {translator("Current Tier", language)}
                </p>
                <p className="font-chakra text-2xl font-semibold text-[#94A3B8] text-right">
                  T{userData?.tier ?? 0}
                </p>
              </div>
              <div className="flex flex-col justify-between gap-[12px] bg-staking-bg rounded-[5px] p-4 w-full h-full">
                <p className="text-xs font-medium text-opacity-50 text-white">
                  {translator("Current Multiplier", language)}
                </p>
                <p className="font-chakra text-2xl font-semibold text-[#94A3B8] text-right">
                  {`${userData?.multiplier ?? 0.5}x`}
                </p>
              </div>
            </div>
          </div>
        </div> */}

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
    </>
  );
}
