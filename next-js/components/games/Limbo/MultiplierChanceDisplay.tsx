import { useGlobalContext } from "@/components/GlobalContext";
import { setUncaughtExceptionCaptureCallback } from "process";
import { useState } from "react";

export const MultiplierChanceDisplay = () => {
  const [chance, setChance] = useState<number>(99.0);
  const { coinData, setShowWalletModal } = useGlobalContext();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (parseFloat(event.target.value) < 1.0) setChance(0);
    else {
      const newValue = 99 / parseFloat(event.target.value);
      setChance(newValue);
    }
  };

  return (
    <div className="flex px-0 xl:px-4 mb-0 px:mb-6 gap-4 flex-row w-full justify-between">
      {coinData && coinData[0].amount > 0.0001 && (
        <>
          <div className="flex flex-col w-full">
            <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
              Multiplier
            </span>
            <input
              type="number"
              step=".01"
              min={1.0}
              className="bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2"
              placeholder={"1.00"}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-col w-full">
            <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
              Chance
            </span>
            <span className="bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2">
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
