import { formatNumber, tiers, translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import Image from "next/legacy/image";

export default function StakeStats() {
  const { userData, solBal, language } = useGlobalContext();
  let stats = [
    {
      title: translator("FOMO Staked", language),
      icon: "/assets/logowhite.svg",
      value: formatNumber(userData?.stakedAmount ?? 0),
    },
    {
      title: translator("FOMO Available", language),
      icon: "/assets/logowhite.svg",
      value: formatNumber(solBal),
    },
    {
      title: translator("Multiplier", language),
      icon: "",
      value: userData?.multiplier ?? 0.5,
    },
  ];
  return (
    <div className="w-full flex flex-col items-start gap-2">
      <span className="text-base font-semibold text-white text-opacity-50">
        {translator("Staking Stats", language)}
      </span>
      <div className="px-4 py-2 flex flex-col bg-[#19161C] w-full rounded-[5px]">
        <div className="flex flex-row items-center justify-between">
          <p className="text-xl font-semibold text-white text-opacity-90">
            {translator("Current Tier", language)}{" "}
            <span className="text-[#9945FF]">T{userData?.tier ?? 0}</span>
          </p>
          {(userData?.tier ?? 0) < 7 && (
            <span className="hidden sm:flex text-white text-xs text-opacity-50">
              {translator("Next Tier", language)}
            </span>
          )}
          <span
            className={`flex sm:hidden text-xl ${
              (userData?.tier ?? 0) === 0
                ? "text-white text-opacity-75"
                : "text-[#1FCDF0]"
            }`}
          >
            {userData?.tier === 7
              ? "2"
              : //@ts-ignore
                tiers[userData?.tier ?? 0]?.multiplier ?? 0.5}
            x
          </span>
        </div>
        {(userData?.tier ?? 0) < 7 && (
          <span className="text-white text-sm text-opacity-50 font-medium">
            {
              //@ts-ignore
              tiers[userData?.tier ?? 0]?.text ?? ""
            }
          </span>
        )}
        {/* next tier data - mob view  */}
        <div className="flex sm:hidden flex-col mt-5 items-start">
          {(userData?.tier ?? 0) < 7 && (
            <div className="flex items-center gap-2">
              <span className="flex text-white text-xs text-opacity-50">
                {translator("Next Tier", language)}
              </span>
              <span className="text-base font-semibold text-opacity-75 text-[#9945FF]">
                T{(userData?.tier ?? 0) + 1}
              </span>
            </div>
          )}
          <span className="flex items-center justify-start text-base -mt-1 text-white text-right text-opacity-50 font-semibold">
            {userData?.tier === 7 ? (
              <>
                <span className="text-[#9945FF] mr-1">FOMO</span>
                {translator("is You and You are", language)}{" "}
                <span className="text-[#9945FF] ml-1">FOMO</span>
              </>
            ) : (
              formatNumber(
                //@ts-ignore
                tiers[
                  parseInt(
                    Object.keys(tiers).find(
                      (key) => parseInt(key) === (userData?.tier ?? 0),
                    ) ?? "0",
                  )
                ]?.limit,
              ) + " FOMO"
            )}
          </span>
        </div>
        <div className="hidden sm:flex flex-row items-end justify-between">
          {(userData?.tier ?? 0) < 7 ? (
            <>
              <p className="text-white text-sm text-opacity-50 font-medium">
                {translator("Stake", language)}{" "}
                {formatNumber(
                  //@ts-ignore
                  tiers[
                    parseInt(
                      Object.keys(tiers).find(
                        (key) => parseInt(key) === (userData?.tier ?? 0),
                      ) ?? "0",
                    )
                  ]?.limit - (userData?.stakedAmount ?? 0),
                )}{" "}
                {translator("more FOMO to reach", language)} T
                {(userData?.tier ?? 0) + 1} (
                <span className="text-[#9945FF] ml-1">
                  {userData?.tier === 7
                    ? 2
                    : userData?.tier === 6
                    ? 2
                    : //@ts-ignore
                      tiers[(userData?.tier ?? 0) + 1]?.multiplier ?? 0.5}
                  x
                </span>{" "}
                {translator("multiplier", language)} )
              </p>
              <div className="flex flex-col items-end">
                <span className="text-base font-semibold text-opacity-75 text-[#9945FF]">
                  T{(userData?.tier ?? 0) + 1}
                </span>
                <span className="text-sm text-white text-right text-opacity-75 font-semibold">
                  {formatNumber(
                    //@ts-ignore
                    tiers[
                      parseInt(
                        Object.keys(tiers).find(
                          (key) => parseInt(key) === (userData?.tier ?? 0),
                        ) ?? "0",
                      )
                    ]?.limit,
                  )}{" "}
                  FOMO
                </span>
              </div>
            </>
          ) : (
            <span className="text-white text-sm text-opacity-50 font-medium mt-5">
              <span className="text-[#9945FF]">FOMO</span>{" "}
              {translator("is You and You are", language)}{" "}
              <span className="text-[#9945FF]">FOMO</span>
            </span>
          )}
        </div>
        <div className="relative flex transition-width duration-1000 w-full rounded-full overflow-hidden h-9 bg-[#9945FF] bg-opacity-10 mt-2 mb-3">
          <div
            style={{
              width: `${
                (((userData?.tier ?? 0) < 7
                  ? userData?.stakedAmount ?? 0
                  : 600000) *
                  100) /
                //@ts-ignore
                tiers[
                  parseInt(
                    Object.keys(tiers).find(
                      (key) => parseInt(key) === (userData?.tier ?? 0),
                    ) ?? "0",
                  )
                ].limit
              }%`,
            }}
            className="h-full bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)]"
          />
          <span className="w-full h-full absolute top-0 left-0 flex items-center justify-center z-10 text-black font-semibold text-sm text-opacity-75">
            {(userData?.tier ?? 0) < 7
              ? (
                  ((userData?.stakedAmount ?? 0) * 100) /
                  //@ts-ignore
                  tiers[
                    parseInt(
                      Object.keys(tiers).find(
                        (key) => parseInt(key) === (userData?.tier ?? 0),
                      ) ?? "0",
                    )
                  ].limit
                ).toFixed(2)
              : 100}
            %
          </span>
        </div>
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-[#19161C] rounded-[5px] p-4 h-24 w-full ${
              index === 2 ? "hidden sm:flex" : "flex"
            } flex-col justify-between`}
          >
            <span className="text-white text-opacity-50 font-medium text-xs">
              {stat.title}
            </span>
            <span
              className={`relative flex flex-row items-center w-full justify-end ${
                index === 2 ? "text-[#9945FF]" : "text-white"
              } text-opacity-75 font-semibold text-2xl`}
            >
              {stat.icon.length > 0 && (
                <Image
                  src={stat.icon}
                  width={27}
                  height={27}
                  alt={"FOMO"}
                  className=""
                />
              )}
              {stat.value} {index === 2 ? "x" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
