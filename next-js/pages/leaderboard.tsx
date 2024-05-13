import { useGlobalContext } from "@/components/GlobalContext";
import { Header } from "@/components/Header";
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
import { useContext, useEffect, useState } from "react";
import { IoMdInformationCircle } from "react-icons/io";

export default function Leaderboard() {
  const wallet = useWallet();
  const router = useRouter();
  const { language, userData, pointTier, setPointTier } = useGlobalContext();

  useEffect(() => {
    let points = userData?.points ?? 0;
    const tier = Object.entries(pointTiers).reduce((prev, next) => {
      return points >= next[1]?.limit ? next : prev;
    });

    setPointTier({
      index: parseInt(tier[0]),
      limit: tier[1]?.limit,
      image: `/assets/badges/T-${tier[0]}.png`,
      label: tier[1].label,
    });
  }, [userData]);


  return (
    <div className="flex flex-col items-center w-full overflow-hidden min-h-screen flex-1 relative">
      {/* Navbar  */}
      <div className="flex flex-col sm:flex-row w-full items-center bg-[#19161C80] py-7 px-5 sm:px-10 2xl:px-[8%]">
        <div className="hidden sm:flex relative min-w-[12rem] h-[12rem]">
          <Image
            src={pointTier.image}
            layout="fill"
            objectFit="contain"
            objectPosition="center"
          />
        </div>

        {/* point bar and info  */}
        <div className="px-4 py-2 flex flex-col w-full rounded-[5px]">
          <div className="flex flex-row items-end justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex sm:hidden relative min-w-[4.5rem] h-[4.5rem]">
                <Image
                  src={pointTier.image}
                  layout="fill"
                  objectFit="contain"
                  objectPosition="center"
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-white font-changa text-2xl">
                  {wallet.publicKey
                    ? obfuscatePubKey(wallet.publicKey.toBase58())
                    : "...."}
                </span>
                <p className="flex text-base text-white font-changa text-opacity-50 gap-1">
                  {translator("Current Tier", language)}
                  {" :"}
                  <span className="text-[#9945FF] font-changa font-bold">
                    {pointTier?.label ?? ""}
                  </span>
                </p>
              </div>
            </div>
            {(pointTier?.index ?? 0) < 7 && (
              <div className="hidden sm:flex sm:flex-col sm:items-end">
                <span className="text-white text-base text-opacity-50">
                  {translator("Next Tier", language)}
                </span>
                <span className="text-base font-semibold text-opacity-75 text-[#9945FF]">
                  {pointTiers[pointTier?.index + 1]?.label ?? ""}
                </span>
              </div>
            )}
          </div>

          {/* next tier data - mob view  */}
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
          )}

          <div className="hidden sm:flex flex-row items-end justify-end px-4">
            {(pointTier?.index ?? 0) < 7 && (
              <div className="flex flex-col items-end">
                <span className="text-sm text-white text-right text-opacity-75 font-semibold">
                  {formatNumber(pointTiers[pointTier?.index + 1]?.limit ?? 0) +
                    " Points"}
                </span>
              </div>
            )}
          </div>

          <div className="relative flex transition-width duration-1000 w-full rounded-full overflow-hidden h-9 bg-[#9945FF] bg-opacity-10 mt-2 mb-3">
            <div
              style={{
                width: `${
                  (Math.min(userData?.points ?? 0, 1_000_000) * 100) /
                    pointTiers[pointTier?.index + 1]?.limit ?? 1
                }%`,
              }}
              className="h-full bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)]"
            />
            <span className="w-full h-full absolute top-0 left-0 flex items-center justify-center z-10 text-black font-semibold text-sm text-opacity-75">
              {(
                (Math.min(userData?.points ?? 0, 1_000_000) * 100) /
                (pointTiers[pointTier?.index + 1]?.limit ?? 1_000_000)
              ).toFixed(2)}{" "}
              %
            </span>
          </div>
        </div>

        {/* stake box */}
        <div className="w-full sm:w-[50%] flex flex-row sm:flex-col items-stretch justify-between gap-2 p-4 bg-[#19161C] rounded-[10px]">
          <div className="w-full flex flex-col items-start bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)] rounded-md text-white p-3">
            <div className="flex items-baseline">
              <span className="font-changa font-semibold text-4xl sm:text-[2.5rem] mr-2">
                T{userData?.tier ?? 0}
              </span>
              <span className="font-changa font-semibold text-opacity-90 text-sm sm:text-xl ">
                {`(${userData?.multiplier ?? 0.5}x multiplier)`}
              </span>
              <span className="ml-1 z-30 group flex relative justify-start">
                <div className="hidden group-hover:flex max-w-[20rem] -ml-14 bg-[#171515] p-3 rounded-md absolute min-w-max top-full mt-2 items-center justify-center text-left">
                  <div className="grid grid-cols-2 items-center text-center">
                    <span className="text-[#9945FF] font-bold border border-white py-1.5 px-3">
                      Tokens
                    </span>
                    <span className="text-[#9945FF] font-bold border border-white py-1.5 px-3">
                      Multiplier
                    </span>
                    {Object.values(stakingTiers).map((tier, index) => {
                      return (
                        <>
                          <span className="border border-white py-1.5 px-3">
                            {tier?.limit}
                            {stakingTiers[index + 1]
                              ? `- ${stakingTiers[index + 1]?.limit - 1}`
                              : "+"}
                          </span>
                          <span className="border border-white py-1.5 px-3">
                            {tier.multiplier}
                          </span>
                        </>
                      );
                    })}
                  </div>
                </div>
                <IoMdInformationCircle />
              </span>
            </div>
            <span className="font-changa text-sm text-opacity-60 sm:mt-2">
              Boost your multiplier by staking!
            </span>
          </div>
          <button
            onClick={() => {
              router.push("stake");
            }}
            className="w-fit sm:w-full border px-4 py-1 border-[#9945ff] bg-[#9945ff] bg-opacity-10 rounded-[5px] font-semibold text-[#7637C3] text-center"
          >
            Stake $FOMO
          </button>
        </div>
      </div>
      <div className="w-full flex flex-1 flex-col items-start gap-5 px-5 sm:px-10 2xl:px-[8%] pb-10">
        <LeaderboardTable />
      </div>
    </div>
  );
}
