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
    <div className="flex flex-col w-full mb-6">
      <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
        {translator("Multiplier", language)}
      </span>
      <input
        id={"amount-input"}
        className={`bg-[#202329] w-full min-w-0 font-chakra text-xs text-white rounded-md px-2 disabled:cursor-not-allowed disabled:opacity-50 md:px-5 py-3 placeholder-[#94A3B8] placeholder-opacity-40 outline-none`}
        value={inputMultiplier}
        type="number"
        maxLength={maxLength}
        step={step}
        min={minVal}
        max={maxVal}
        disabled={disabled}
        onChange={(e) => {
          setInputMultiplier(parseFloat(e.target.value));
        }}
      />
    </div>
  );
};

export default MultiplierInput;
