import { tiers } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";

export default function StakeStats() {
  const { userData, solBal } = useGlobalContext();
  let stats = [
    {
      title: "My FOMO staked",
      icon: "",
      value: userData?.stakedAmount ?? 0,
    },
    {
      title: "My FOMO Available",
      icon: "",
      value: solBal,
    },
    {
      title: "My Multiplier",
      icon: "",
      value: userData?.multiplier ?? 0.5,
    },
  ];
  return (
    <div className="w-full flex flex-col items-start gap-2">
      <span className="text-base font-semibold text-white text-opacity-50">
        My Staking Stats
      </span>
      <div className="px-4 py-2 flex flex-col bg-[#19161C] w-full rounded-[5px]">
        <div className="flex flex-row items-center justify-between">
          <p className="text-xl font-semibold text-white text-opacity-90">
            My Current tier{" "}
            <span className="text-[#9945FF]">T{userData?.tier ?? 0}</span>
          </p>
          <span className="hidden sm:flex text-white text-xs text-opacity-50">
            Next Tier
          </span>
        </div>
        {/* next tier data - mob view  */}
        <div className="flex sm:hidden flex-col mt-5 items-start">
          <div className="flex items-center gap-2">
            <span className="flex text-white text-xs text-opacity-50">
              Next Tier
            </span>
            <span className="text-base font-semibold text-opacity-75 text-[#9945FF]">
              T{(userData?.tier ?? 0) + 1}
            </span>
          </div>
          <span className="text-base -mt-1 text-white text-right text-opacity-75 font-semibold">
            {userData?.tier === 7
              ? ""
              : userData?.tier === 6
              ? "2"
              : //@ts-ignore
                tiers[
                  parseInt(
                    Object.keys(tiers).find(
                      (key) => parseInt(key) === (userData?.tier ?? 0),
                    ) ?? "0",
                  )
                ].limit}{" "}
            $FOMO
          </span>
        </div>
        <div className="hidden sm:flex flex-row items-end justify-between">
          <p className="text-white text-sm text-opacity-50 font-medium">
            Stake{" "}
            {
              //@ts-ignore
              tiers[
                parseInt(
                  Object.keys(tiers).find(
                    (key) => parseInt(key) === (userData?.tier ?? 0),
                  ) ?? "0",
                )
              ].limit - (userData?.stakedAmount ?? 0)
            }{" "}
            more $FOMO to reach T{(userData?.tier ?? 0) + 1} (
            <span className="text-[#9945FF] ml-1">
              {userData?.tier === 7
                ? ""
                : //@ts-ignore
                  tiers[(userData?.tier ?? 0) + 1].multiplier}
              x
            </span>{" "}
            multiplier )
          </p>
          <div className="flex flex-col items-end">
            <span className="text-base font-semibold text-opacity-75 text-[#9945FF]">
              T{(userData?.tier ?? 0) + 1}
            </span>
            <span className="text-sm text-white text-right text-opacity-75 font-semibold">
              {userData?.tier === 7
                ? ""
                : //@ts-ignore
                  tiers[
                    parseInt(
                      Object.keys(tiers).find(
                        (key) => parseInt(key) === (userData?.tier ?? 0),
                      ) ?? "0",
                    )
                  ].limit}{" "}
              $FOMO
            </span>
          </div>
        </div>
        <div className="flex w-full rounded-full h-9 bg-[#9945FF] bg-opacity-10 mt-2 mb-3"></div>
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-[#19161C] rounded-[5px] p-4 h-24 w-full flex flex-col justify-between"
          >
            <span className="text-white text-opacity-50 font-medium text-xs">
              {stat.title}
            </span>
            <span
              className={`flex flex-row items-center w-full justify-end ${
                index === 2 ? "text-[#9945FF]" : "text-white"
              } text-opacity-75 font-semibold text-2xl`}
            >
              {stat.value} {index === 2 ? "x" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
