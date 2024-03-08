import { useGlobalContext } from "@/components/GlobalContext";
import { Header } from "@/components/Header";
import LeaderboardTable from "@/components/Leaderboard";
import {
  formatNumber,
  obfuscatePubKey,
  pointTiers,
  tiers,
  translator,
} from "@/context/transactions";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { IoMdInformationCircle } from "react-icons/io";

interface PointTier {
  index: number;
  limit: number;
  image: string;
  label: string;
}
export default function Leaderboard() {
  const wallet = useWallet();
  const router = useRouter();
  const { language } = useGlobalContext();

  const [pointTier, setPointTier] = useState<PointTier>({
    index: 0,
    limit: 0,
    image: "",
    label: "BRONZE",
  });

  const points = 701;

  useEffect(() => {
    pointTiers.some((tier, index) => {
      if (points >= pointTiers[5].limit) {
        setPointTier({
          index: 5,
          limit: pointTiers[5].limit,
          image: pointTiers[5].image,
          label: pointTiers[5].label,
        });
      } else if (
        points >= pointTiers[index].limit &&
        points < pointTiers[index + 1].limit
      ) {
        setPointTier({
          index: index,
          limit: pointTiers[index].limit,
          image: pointTiers[index].image,
          label: pointTiers[index].label,
        });
      }
    });
  }, [points]);

  useEffect(() => {
    console.log(pointTier);
  }, [pointTier]);

  return (
    <div className="flex flex-col items-center w-full overflow-hidden min-h-screen flex-1 bg-black relative">
      <Header />
      {/* Navbar  */}
      <div className="flex flex-col sm:flex-row w-full items-center bg-[#19161C80] py-7 px-5 sm:px-10 2xl:px-[8%]">
        <div className="hidden sm:flex relative min-w-[12rem] h-[12rem] border border-red-200"></div>

        {/* point bar and info  */}
        <div className="px-4 py-2 flex flex-col w-full rounded-[5px]">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex sm:hidden relative min-w-[4.5rem] h-[4.5rem] border border-red-200"></div>
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
            {(pointTier?.index ?? 0) < 5 && (
              <span className="hidden sm:flex text-white text-xs text-opacity-50">
                {translator("Next Tier", language)}
              </span>
            )}
          </div>

          {/* next tier data - mob view  */}
          {(pointTier?.index ?? 0) < 5 && (
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

          <div className="hidden sm:flex flex-row items-end justify-end">
            {(pointTier?.index ?? 0) < 5 && (
              <div className="flex flex-col items-end">
                <span className="text-base font-semibold text-opacity-75 text-[#9945FF]">
                  {pointTiers[pointTier?.index + 1]?.label ?? ""}
                </span>
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
                  (((pointTier?.index ?? 0) < 5 ? points ?? 0 : 500) * 100) /
                    pointTiers[pointTier?.index + 1]?.limit ?? 1
                }%`,
              }}
              className="h-full bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)]"
            />
            <span className="w-full h-full absolute top-0 left-0 flex items-center justify-center z-10 text-black font-semibold text-sm text-opacity-75">
              {(
                (((pointTier?.index ?? 0) < 5 ? points ?? 0 : 500) * 100) /
                (pointTiers[pointTier?.index + 1]?.limit ?? 500)
              ).toFixed(2)}{" "}
              %
            </span>
          </div>
        </div>

        {/* stake box */}
        <div className="w-full sm:w-[50%] flex flex-row sm:flex-col items-start justify-between gap-2 p-4 bg-[#19161C] rounded-[10px]">
          <div className="flex flex-col items-start">
            <div className="flex items-end">
              <span className="font-changa font-semibold text-2xl sm:text-[2.5rem] text-[#9945ff] leading-4 sm:leading-6">
                0
              </span>
              <span className="font-bold text-base sm:text-2xl text-[#9945ff] leading-4 sm:leading-[1.3rem] ml-0.5 mr-3">
                x
              </span>
              <span className="font-changa font-semibold text-white text-opacity-90 text-sm sm:text-xl leading-3 sm:leading-[1rem]">
                Boost
              </span>
              <IoMdInformationCircle className="text-white ml-1" />
            </div>
            <span className="font-changa text-sm text-white text-opacity-50 sm:mt-4">
              Boost your multiplier by staking!
            </span>
          </div>
          <button
            onClick={() => {
              router.push("stake");
            }}
            className="w-fit sm:w-full border px-4 py-1 border-[#9945ff] bg-[#9945ff] bg-opacity-10 rounded-[5px] font-semibold text-[#7637C3] text-center"
          >
            Stake Fomo
          </button>
        </div>
      </div>
      <div className="w-full flex flex-1 flex-col items-start gap-5 px-5 sm:px-10 2xl:px-[8%] bg-black pb-10">
        <LeaderboardTable />
      </div>
    </div>
  );
}
