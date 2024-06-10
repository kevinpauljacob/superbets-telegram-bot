import React from "react";
import { translator } from "@/context/transactions";
import { useGlobalContext } from "../GlobalContext";

interface MultiplierInputProps {
  inputMultiplier: number;
  setInputMultiplier: (value: number) => void;
  disabled: boolean;
  minVal: number;
  maxVal: number;
  step: number;
  maxLength: number;
}

const MultiplierInput = ({
  inputMultiplier,
  setInputMultiplier,
  disabled,
  minVal,
  maxVal,
  step,
  maxLength,
}: MultiplierInputProps) => {
  const { language } = useGlobalContext();
  return (
    <div className="flex flex-col w-full">
      <span className="text-[#F0F0F0]  text-xs mb-1">
        {translator("Multiplier", language)}
      </span>
      <input
        id={"amount-input"}
        className={`bg-[#202329] w-full min-w-0 font-chakra text-xs text-white rounded-md px-2 disabled:cursor-not-allowed disabled:opacity-50 md:px-5 py-3 placeholder-[#94A3B8] placeholder-opacity-40 outline-none`}
        value={inputMultiplier}
        type="number"
        step={step}
        min={minVal}
        max={maxVal}
        disabled={disabled}
        onChange={(e) => {
          let value = parseFloat(e.target.value);
          const parts = e.target.value.split(".");
          if (parts.length > 1 && parts[1].length > maxLength) {
            value = parseFloat(
              parts[0] + "." + parts[1].substring(0, maxLength),
            );
          }
          setInputMultiplier(value);
        }}
      />
    </div>
  );
};

export default MultiplierInput;
