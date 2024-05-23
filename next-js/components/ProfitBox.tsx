import { useGlobalContext } from "./GlobalContext";
import { translator } from "@/context/transactions";
import { truncateNumber } from "@/context/gameTransactions";

export default function ProfitBox({
  multiplier,
  amount,
}: {
  multiplier: number;
  amount: number;
}) {
  const { houseEdge, language } = useGlobalContext();

  return (
    <div className="mb-0 flex w-full flex-col">
      <div className="mb-1 flex w-full items-center justify-between text-xs font-changa text-opacity-90">
        <label className="text-white/90 font-changa">
          {translator("Profit", language)}
        </label>
      </div>

      <div
        className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
      >
        <span
          className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra outline-none`}
        >
          {truncateNumber(
            Math.max(0, amount * (multiplier * (1 - houseEdge) - 1)),
            4,
          )}{" "}
          $SOL
        </span>
      </div>
    </div>
  );
}
