import { minGameAmount } from "@/context/gameTransactions";
import { useGlobalContext } from "../GlobalContext";
import Link from "next/link";

export default function GameFooterInfo({
  multiplier,
  amount,
  chance,
}: {
  multiplier: number;
  amount: number;
  chance: number;
}) {
  const { coinData } = useGlobalContext();
  return (
    <div className="flex flex-col sm:flex-row w-full justify-between">
      {coinData && coinData[0].amount > 0.0001 && (
        <>
          <div className="flex flex-col w-full">
            <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
              Multiplier
            </span>
            <span className="bg-[#202329] text-xs text-white rounded-md px-5 py-2">
              {multiplier.toFixed(2)}x
            </span>
          </div>
          {/* <div className="flex justify-between">
              <span className="text-[#F0F0F0] text-opacity-75">Tax</span>
              <span className="text-[#F0F0F0] text-opacity-75">
                {ROLL_TAX * 100}%
              </span>
            </div> */}
          <div className="flex flex-col w-full sm:mx-8 my-3 sm:my-0">
            <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
              Winning Amount
            </span>
            <span className="bg-[#202329] text-xs text-white rounded-md px-5 py-2">
              {amount.toFixed(5)} $SOL
            </span>
          </div>
          <div className="flex flex-col w-full">
            <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
              Chance
            </span>
            <span className="bg-[#202329] text-xs text-white rounded-md px-5 py-2">
              {chance.toFixed(2)}%
            </span>
          </div>
        </>
      )}

      {!coinData ||
        (coinData[0].amount < 0.0001 && (
          <div className="w-full rounded-lg bg-[#d9d9d90d] bg-opacity-10 flex items-center px-3 py-3 text-white md:px-6">
            <div className="w-full text-center font-changa font-medium text-sm md:text-base text-[#F0F0F0] text-opacity-75">
              Please deposit funds to start playing. View{" "}
              <Link href="/balance">
                <u>WALLET</u>
              </Link>
            </div>
          </div>
        ))}
    </div>
  );
}
