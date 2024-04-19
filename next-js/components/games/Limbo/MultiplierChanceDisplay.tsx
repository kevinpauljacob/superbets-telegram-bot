import { useGlobalContext } from "@/components/GlobalContext";
import { Dispatch, SetStateAction, useState } from "react";

export const MultiplierChanceDisplay = ({
  multiplier,
  setMultiplier,
}: {
  multiplier: number;
  setMultiplier: Dispatch<SetStateAction<number>>;
}) => {
  const { coinData, setShowWalletModal } = useGlobalContext();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMultiplier(parseFloat(event.target.value));
  };

  return (
    <div className="flex px-0 xl:px-4 mb-0 md:mb-5 gap-4 flex-row w-full justify-between">
      {coinData && coinData[0].amount > 0.0001 && (
        <>
          <div className="flex flex-col w-full">
            <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
              Multiplier
            </span>
            <input
              type="number"
              step=".01"
              min={1.01}
              className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3"
              value={multiplier}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-col w-full">
            <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
              Chance
            </span>
            <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
              {(100 / multiplier).toFixed(8)}%
            </span>
          </div>
        </>
      )}

      {!coinData ||
        (coinData[0].amount < 0.0001 && (
          <div className="w-full rounded-lg bg-[#d9d9d90d] bg-opacity-10 flex items-center px-3 py-3 text-white md:px-6">
            <div className="w-full text-center font-changa font-medium text-sm md:text-base text-[#F0F0F0] text-opacity-75">
              Please deposit funds to start playing. View{" "}
              <u
                onClick={() => {
                  setShowWalletModal(true);
                }}
              >
                WALLET
              </u>
            </div>
          </div>
        ))}
    </div>
  );
};
