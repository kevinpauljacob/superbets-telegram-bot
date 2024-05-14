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
    <div className="flex flex-col items-start w-full overflow-hidden min-h-screen flex-1 relative">
      {/* Navbar  */}
      <span className="text-white text-opacity-90 font-semibold text-[1.5rem] sm:text-[2rem] mt-[1rem] sm:mt-[2rem] flex items-center justify-center gap-x-2 px-5 sm:px-10 2xl:px-[8%]">
        {translator("Leaderboard", language).toUpperCase()}
      </span>
      <div className="flex flex-col sm:flex-row items-center py-7 px-5 sm:px-10 2xl:px-[8%] mt-6 w-full h-full">
        {/* point bar and info  */}
        <div className="px-6 py-4 flex flex-col w-full rounded-[5px] bg-staking-bg h-full ">
          <div className="flex flex-row items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="flex relative min-w-[4.5rem] h-[4.5rem]">
                <Image
                  src={pointTier.image}
                  layout="fill"
                  objectFit="contain"
                  objectPosition="center"
                />
              </div>
              <div className="flex flex-col items-start font-chakra">
                <span className="text-white text-2xl">
                  {wallet.publicKey
                    ? obfuscatePubKey(wallet.publicKey.toBase58())
                    : "...."}
                </span>
                <p className="flex text-base text-white text-opacity-50 gap-1">
                  <span className="text-staking-secondary">
                    {pointTier?.label ?? ""}
                  </span>
                </p>
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

          <div className="hidden sm:flex flex-row justify-between font-chakra mt-4">
            <span className="text-sm text-white text-right text-opacity-75">
              Your level progress
            </span>
            {(pointTier?.index ?? 0) < 7 && (
              <div className="flex flex-col items-end">
                <span className="text-sm text-white text-right text-opacity-75">
                  {formatNumber(pointTiers[pointTier?.index + 1]?.limit ?? 0) +
                    " Points"}
                </span>
              </div>
            )}
          </div>

          <div className="relative flex transition-width duration-1000 w-full rounded-full overflow-hidden h-9 bg-[#282E3D] mt-2 mb-3">
            <div
              style={{
                width: `${
                  (Math.min(userData?.points ?? 0, 1_000_000) * 100) /
                    pointTiers[pointTier?.index + 1]?.limit ?? 1
                }%`,
              }}
              className="h-full bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)]"
            />
            <span className="w-full h-full absolute top-0 left-0 flex items-center justify-center z-10 text-white font-semibold text-sm">
              {(
                (Math.min(userData?.points ?? 0, 1_000_000) * 100) /
                (pointTiers[pointTier?.index + 1]?.limit ?? 1_000_000)
              ).toFixed(2)}{" "}
              %
            </span>
          </div>
          <div className="hidden sm:flex flex-row justify-between font-chakra">
            <span className="text-sm text-white text-right text-opacity-75">
              {pointTier?.label ?? ""}
            </span>
            <span className="text-sm text-white text-right text-opacity-75">
              {pointTier?.label ?? ""}
            </span>
          </div>
        </div>

        {/* stake box */}
        <div className="w-full sm:w-[50%] flex flex-row sm:flex-col items-stretch justify-between gap-2 p-4 rounded-[10px] ">
          <div className="w-full h-full flex flex-col items-start bg-leaderboard-bg rounded-md text-white p-3 bg-cover bg-no-repeat opacity-80">
            <div className="flex items-baseline">
              <span className="font-chakra font-semibold text-4xl sm:text-[2.5rem] mr-2">
                T{userData?.tier ?? 0}
              </span>
              <span className="font-chakra font-semibold text-opacity-90 text-sm sm:text-xl ">
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
              </span>
            </div>
            <span className="font-sans text-sm text-opacity-60 sm:mt-2">
              Boost your multiplier by staking!
            </span>
            <button
              onClick={() => {
                router.push("stake");
              }}
              className="w-3/5 px-4 py-2 bg-white/30 rounded-[5px] font-semibold text-white text-center mt-6 font-chakra backdrop-blur-sm"
            >
              STAKE NOW
            </button>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-1 flex-col items-start gap-5 px-5 sm:px-10 2xl:px-[8%] pb-10">
        <LeaderboardTable />
      </div>
    </div>
  );
}
