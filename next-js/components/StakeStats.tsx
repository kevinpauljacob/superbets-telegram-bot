import { formatNumber, stakingTiers, translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import Image from "next/legacy/image";
import { truncateNumber } from "@/context/gameTransactions";

export default function StakeStats() {
  const { userData, solBal, language } = useGlobalContext();
  let stats = [
    {
      title: translator("FOMO Staked", language),
      icon: "/assets/logowhite.svg",
      value: truncateNumber(userData?.stakedAmount ?? 0, 4),
    },
    {
      title: translator("FOMO Available", language),
      icon: "/assets/logowhite.svg",
      value: truncateNumber(solBal, 4),
    },
    {
      title: translator("Multiplier", language),
      icon: "",
      value: userData?.multiplier ?? 0.5,
    },
  ];
  return (
    <div className="w-full flex flex-col items-start gap-2">
      <div className="px-8 py-6 flex flex-col bg-staking-bg w-full rounded-[5px]">
        <div className="flex flex-row items-center justify-between">
          <p className="text-xl font-semibold text-white text-opacity-90">
            {translator("My Current Tier", language)}{" "}
            <span className="text-staking-secondary">
              T{userData?.tier ?? 0}
            </span>
          </p>
          {(userData?.tier ?? 0) < 7 && (
            <span className="flex text-white text-xs text-opacity-50 font-sans">
              {translator("Next Tier", language)}
            </span>
          )}
        </div>
        {(userData?.tier ?? 0) < 7 && (
          <span className="text-white text-sm text-opacity-50 font-medium">
            {
              //@ts-ignore
              translator(stakingTiers[userData?.tier ?? 0]?.text ?? "")
            }
          </span>
        )}
        <div className="flex flex-row items-end justify-between mt-4 font-sans">
          {(userData?.tier ?? 0) < 7 ? (
            <>
              <p className="hidden sm:block text-white text-xs text-opacity-50 font-medium">
                {translator("Stake", language)}{" "}
                {stakingTiers[(userData?.tier ?? 0) + 1]?.limit -
                  (userData?.stakedAmount ?? 0)}{" "}
                {translator("more $FOMO to reach", language)} T
                {(userData?.tier ?? 0) + 1} (
                <span className="text-staking-secondary ml-1">
                  {stakingTiers[(userData?.tier ?? 0) + 1]?.multiplier ?? 0.5}x
                </span>{" "}
                {translator("multiplier", language)} )
              </p>
              <p className="sm:hidden text-base font-semibold text-white">
                {truncateNumber(
                  (((userData?.tier ?? 0) < 7
                    ? userData?.stakedAmount ?? 0
                    : 600000) *
                    100) /
                    stakingTiers[(userData?.tier ?? 0) + 1]?.limit,
                  2,
                )}
                %
              </p>
              <div className="flex flex-col items-end">
                <span className="text-base font-semibold text-opacity-75 text-staking-secondary">
                  T{(userData?.tier ?? 0) + 1}
                </span>
                <span className="text-sm text-white text-right text-opacity-75 font-semibold font-chakra">
                  {stakingTiers[(userData?.tier ?? 0) + 1]?.limit} $FOMO
                </span>
              </div>
            </>
          ) : (
            <span className="text-white text-sm text-opacity-50 font-medium mt-5">
              <span className="text-staking-secondary">FOMO</span>{" "}
              {translator("is You and You are", language)}{" "}
              <span className="text-staking-secondary">FOMO</span>
            </span>
          )}
        </div>
        <div className="relative flex transition-width duration-1000 w-full rounded-full overflow-hidden bg-[#282E3D] opacity-50 h-5 sm:h-9 mt-2 mb-3">
          <div
            style={{
              width: `${
                (((userData?.tier ?? 0) < 7
                  ? userData?.stakedAmount ?? 0
                  : 600000) *
                  100) /
                stakingTiers[(userData?.tier ?? 0) + 1]?.limit
              }%`,
            }}
            className="h-full bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)]"
          />
          <span
            className={`${
              truncateNumber(
                (((userData?.tier ?? 0) < 7
                  ? userData?.stakedAmount ?? 0
                  : 600000) *
                  100) /
                  stakingTiers[(userData?.tier ?? 0) + 1]?.limit,
                2,
              ).toString() === "0.00"
                ? "text-opacity-100"
                : ""
            } w-full h-full absolute top-0 left-0 flex items-center justify-center z-10 text-white font-semibold text-sm`}
          >
            <span className="hidden sm:block">
              {truncateNumber(
                (((userData?.tier ?? 0) < 7
                  ? userData?.stakedAmount ?? 0
                  : 600000) *
                  100) /
                  stakingTiers[(userData?.tier ?? 0) + 1]?.limit,
                2,
              )}
              %
            </span>
          </span>
        </div>
        <p className="sm:hidden text-white text-xs text-opacity-50 font-medium">
          {translator("Stake", language)}{" "}
          {stakingTiers[(userData?.tier ?? 0) + 1]?.limit -
            (userData?.stakedAmount ?? 0)}{" "}
          {translator("more $FOMO to reach", language)} T
          {(userData?.tier ?? 0) + 1}
          <span className="text-[#94A3B8]">
            (
            <span className="text-staking-secondary ml-1">
              {stakingTiers[(userData?.tier ?? 0) + 1]?.multiplier ?? 0.5}x
            </span>{" "}
            {translator("multiplier", language)} )
          </span>
        </p>
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2 font-sans">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-staking-bg rounded-[5px] p-4 h-24 w-full flex flex-col justify-between"
          >
            <span className="text-white text-opacity-50 font-medium text-xs">
              {stat.title}
            </span>
            <span
              className={`relative font-chakra flex flex-row items-center w-full justify-end ${
                index !== 2 ? "text-staking-secondary" : "text-white"
              } font-semibold text-xl`}
            >
              {/* {stat.icon.length > 0 && (
                <Image
                  src={stat.icon}
                  width={27}
                  height={27}
                  alt={"FOMO"}
                  className=""
                />
              )} */}
              {stat.value}
              {index === 2 ? "x" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
