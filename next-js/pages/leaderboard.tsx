import { useGlobalContext } from "@/components/GlobalContext";
import LeaderboardTable from "@/components/Leaderboard";
import {
  formatNumber,
  obfuscatePubKey,
  stakingTiers,
  pointTiers,
  translator,
} from "@/context/transactions";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/legacy/image";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { truncateNumber } from "@/context/gameTransactions";

export default function Leaderboard() {
  const wallet = useWallet();
  const router = useRouter();
  const { language, userData, pointTier, setPointTier } = useGlobalContext();

  useEffect(() => {
    let points = userData?.points ?? 0;
    const tier = Object.entries(pointTiers).reduce((prev, next) => {
      return points >= next[1]?.limit ? next : prev;
    });
    console.log(tier, pointTiers["2"]);
    console.log("pointTiers", pointTiers);
    setPointTier({
      index: parseInt(tier[0]),
      limit: tier[1]?.limit,
      image: `/assets/badges/T-${tier[0]}.png`,
      label: tier[1].label,
    });
  }, [userData]);

  return (
    <div className="flex flex-col items-start w-full overflow-hidden min-h-screen flex-1 relative">
      {/* Navbar  */}
      <span className="text-white text-opacity-90 font-semibold text-[1.5rem] sm:text-[2rem] mt-[1rem] font-chakra tracking-[.02em] flex items-center justify-center gap-x-2 px-5 sm:px-10 2xl:px-[5%]">
        {translator("Leaderboard", language).toUpperCase()}
      </span>
      <div className="flex gap-[12px] px-5 sm:px-10 2xl:px-[5%] mt-6 w-full h-full ">
        <div className="flex flex-col lg:flex-row items-center w-full md:w-[55%] lg:w-[60%] h-full p-8 rounded-md gap-[3.4rem] bg-staking-bg">
          {/* point bar and info  */}
          <div className="flex flex-col w-full rounded-[5px] h-full ">
            <div className="flex flex-row items-end justify-between">
              <div className="flex flex-col justify-center sm:flex-row sm:items-center sm:justify-start gap-2 w-full">
                <div className="flex relative min-w-[4.5rem] h-[4.5rem]">
                  <Image
                    src={pointTier.image}
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
                    {pointTier?.label ?? ""}
                  </span>
                </div>
              </div>
              {/* {(pointTier?.index ?? 0) < 7 && (
              <div className="hidden sm:flex sm:flex-col sm:items-end">
                <span className="text-white text-base text-opacity-50">
                  {translator("Next Tier", language)}
                </span>
                <span className="text-base font-semibold text-opacity-75 text-[#9945FF]">
                  {pointTiers[pointTier?.index + 1]?.label ?? ""}
                </span>
              </div>
            )} */}
            </div>

            {/* next tier data - mob view 
            {(pointTier?.index ?? 0) < 7 && (
              <div className="flex sm:hidden mt-5 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex text-white text-xs text-opacity-50">
                    {translator("Next Tier", language)}
                  </span>
                  <span className="text-base font-semibold text-opacity-75 text-[#9945FF]">
                    {pointTiers[pointTier?.index + 1]?.label ?? ""}
                  </span>
                </div>

                <span className="flex items-center justify-start text-base -mt-1 text-white text-right text-opacity-50 font-semibold">
                  {formatNumber(pointTiers[pointTier?.index + 1]?.limit ?? 0) +
                    " Points"}
                </span>
              </div>
            )} */}

            <div className="flex flex-row justify-between font-chakra mt-4">
              <span className="text-sm text-white text-right text-opacity-75">
                Your level progress
              </span>
              {(pointTier?.index ?? 0) < 7 && (
                <div className="flex flex-col items-end">
                  <span className="text-sm text-white text-right text-opacity-75">
                    {formatNumber(
                      pointTiers[pointTier?.index + 1]?.limit ?? 0,
                      0,
                    ) + " Points"}
                  </span>
                </div>
              )}
            </div>

            <div
              className={`${
                (Math.min(userData?.points ?? 0, 1_000_000) * 100) /
                  pointTiers[pointTier?.index + 1]?.limit ?? 1
                  ? "opacity-50"
                  : ""
              } relative flex transition-width duration-1000 w-full rounded-full overflow-hidden h-6 bg-[#282E3D] mt-2 mb-2`}
            >
              <div
                style={{
                  width: `${
                    (Math.min(userData?.points ?? 0, 1_000_000) * 100) /
                      pointTiers[pointTier?.index + 1]?.limit ?? 1
                  }%`,
                }}
                className="h-full bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)]"
              />
              <span className="w-full h-full absolute top-0 left-0 flex items-center justify-center z-10 text-white font-semibold font-chakra text-xs">
                {formatNumber(
                  (Math.min(userData?.points ?? 0, 1_000_000) * 100) /
                    (pointTiers[pointTier?.index + 1]?.limit ?? 1_000_000),
                  2,
                )}{" "}
                %
              </span>
            </div>
            <div className="flex flex-row justify-between font-chakra capitalize">
              <span className="text-staking-secondary text-opacity-75 text-sm font-medium">
                {pointTier?.label ?? ""}
              </span>
              <span className="flex items-center gap-1 text-staking-secondary text-opacity-75 text-sm font-medium">
                <div className="flex relative min-w-[1rem] h-[1rem]">
                  <Image
                    src={`/assets/badges/T-${pointTier?.index + 1}.png`}
                    layout="fill"
                    objectFit="contain"
                    objectPosition="center"
                  />
                </div>
                {pointTiers[pointTier?.index + 1]?.label ?? ""}
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
                Boost Your Tier by Staking!
              </p>
              <p className="text-[#94A3B8] font-semibold text-[11px] text-opacity-50 max-w-[290px]">
                You can stake your $FOMO to obtain higher multiplier for your
                points!
              </p>
            </div>
          </div>
          <div className="flex gap-[12px] w-full h-[50%]">
            <div className="flex flex-col justify-between gap-[12px] bg-staking-bg rounded-[5px] p-4 w-full h-full">
              <p className="text-xs font-medium text-opacity-50 text-white">
                Current Tier
              </p>
              <p className="font-chakra text-2xl font-semibold text-[#94A3B8] text-right">
                T{userData?.tier ?? 0}
              </p>
            </div>
            <div className="flex flex-col justify-between gap-[12px] bg-staking-bg rounded-[5px] p-4 w-full h-full">
              <p className="text-xs font-medium text-opacity-50 text-white">
                Current Multiplier
              </p>
              <p className="font-chakra text-2xl font-semibold text-[#94A3B8] text-right">
                {`${userData?.multiplier ?? 0.5}x`}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-1 flex-col items-start px-5 sm:px-10 2xl:px-[5%] gap-5 pb-10">
        <LeaderboardTable />
      </div>
    </div>
  );
}
