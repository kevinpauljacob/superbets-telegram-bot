import { useState, useEffect } from "react";
import {
  FieldValues,
  UseFormReturn,
  useForm,
  useFormContext,
} from "react-hook-form";
import { useGlobalContext } from "../GlobalContext";
import { GameTokens, GameType } from "@/utils/provably-fair";
import { truncateNumber } from "@/context/transactions";
import { maxPayouts, minAmtFactor } from "@/context/config";
import Image from "next/image";
import { translator } from "@/context/transactions";
import { riskToChance } from "./Keno/RiskToChance";
import { SPL_TOKENS } from "@/context/config";

export default function BetAmount({
  betAmt,
  setBetAmt,
  currentMultiplier,
  leastMultiplier,
  game,
  disabled = false,
  ...rest
}: {
  betAmt: number | undefined;
  setBetAmt: React.Dispatch<React.SetStateAction<number | undefined>>;
  currentMultiplier: number;
  leastMultiplier: number;
  game: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  const {
    register,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useFormContext<FieldValues>();
  const {
    // methods,
    coinData,
    maxBetAmt,
    setMaxBetAmt,
    language,
    kenoRisk,
    selectedCoin,
    minGameAmount,
    setMinGameAmount,
    setBetAmtError,
  } = useGlobalContext();

  // Temperory max bet
  const multipliersForRisk = riskToChance[kenoRisk];
  const highestMultiplierForRisk = multipliersForRisk
    ? Math.max(...Object.values(multipliersForRisk).flat())
    : 1;

  const [betAmountsModal, setBetAmountsModal] = useState(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [currentMaxBetAmt, setCurrentMaxBetAmt] = useState(0);
  const [inputString, setInputString] = useState("");

  useEffect(() => {
    setMaxBetAmt(
      maxPayouts[selectedCoin.tokenMint as GameTokens][game as GameType],
    );
    setMinGameAmount(
      maxPayouts[selectedCoin.tokenMint as GameTokens][game as GameType] *
        minAmtFactor,
    );
  }, [leastMultiplier, game, kenoRisk, selectedCoin]);

  useEffect(() => {
    if (betAmt !== undefined && betAmt >= 0) {
      if (game === GameType.roulette1) {
        setInputString(betAmt.toFixed(9));
      } else {
        setInputString(betAmt.toString());
      }
    } else {
      setInputString("");
    }

    const effectiveMultiplier = currentMultiplier || highestMultiplierForRisk;

    if (betAmt !== undefined && effectiveMultiplier !== undefined) {
      let calculatedMaxBetAmt =
        maxPayouts[selectedCoin.tokenMint as GameTokens][game as GameType] /
        currentMultiplier;

      if (selectedCoin?.amount == undefined && selectedCoin?.amount == 0) {
        setCurrentMaxBetAmt(0);
      }
      setCurrentMaxBetAmt(
        isFinite(calculatedMaxBetAmt) ? calculatedMaxBetAmt : 0,
      );
    }
  }, [betAmt, currentMultiplier, game, selectedCoin]);

  const handleSetMaxBet = () => {
    const availableTokenAmt =
      selectedCoin?.tokenMint === "SUPER"
        ? (selectedCoin?.amount ?? 0)
        : Math.min(selectedCoin?.amount ?? 0, maxBetAmt ?? 0);

    //@ts-ignore
    document.getElementById(`${game}-amount`).value =
      availableTokenAmt.toFixed(6);
    setInputString(availableTokenAmt.toFixed(6));
    setValue(`${game}-amount`, availableTokenAmt.toFixed(6), {
      shouldValidate: true,
    });
  };

  const handleHalfBet = () => {
    const availableTokenAmt =
      selectedCoin?.tokenMint === "SUPER"
        ? (selectedCoin?.amount ?? 0)
        : Math.min(selectedCoin?.amount ?? 0, maxBetAmt ?? 0);
    let newBetAmt =
      !betAmt || betAmt === 0 ? availableTokenAmt / 2 : betAmt! / 2;

    newBetAmt = parseFloat(newBetAmt.toFixed(6));
    if (newBetAmt < minGameAmount) {
      newBetAmt = minGameAmount;
    }

    //@ts-ignore
    document.getElementById(`${game}-amount`).value = newBetAmt.toString();
    setInputString(newBetAmt.toString());
    setValue(`${game}-amount`, newBetAmt.toString(), {
      shouldValidate: true,
    });
  };

  const handleDoubleBet = () => {
    const availableTokenAmt =
      selectedCoin?.tokenMint === "SUPER"
        ? (selectedCoin?.amount ?? 0)
        : Math.min(selectedCoin?.amount ?? 0, maxBetAmt ?? 0);
    const possibleBetAmt =
      selectedCoin?.tokenMint === "SUPER"
        ? Math.min((betAmt ?? 0) * 2, selectedCoin?.amount ?? 0)
        : Math.min((betAmt ?? 0) * 2, maxBetAmt ?? 0);

    const newBetAmt =
      !betAmt || betAmt === 0
        ? parseFloat(availableTokenAmt.toFixed(6))
        : parseFloat(possibleBetAmt.toFixed(6));

    //@ts-ignore
    document.getElementById(`${game}-amount`).value = newBetAmt.toString();
    setInputString(newBetAmt.toString());
    setValue(`${game}-amount`, newBetAmt.toString(), {
      shouldValidate: true,
    });
  };

  useEffect(() => {
    if (betAmt !== undefined) {
      setInputString(betAmt.toString());
      setValue(`${game}-amount`, betAmt.toString(), {
        shouldValidate: true,
      });
    }
  }, [betAmt, setValue, game]);

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputString(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setBetAmt(numValue);
    }
  };
  useEffect(() => {
    handleBetAmount();
  }, [inputString, selectedCoin]);

  const handleBetAmount = () => {
    const maxBetAmt =
      maxPayouts[selectedCoin.tokenMint as GameTokens][game as GameType];
    const minGameAmount =
      maxPayouts[selectedCoin.tokenMint as GameTokens][game as GameType] *
      minAmtFactor;
    // console.log(
    //   "before",
    //   errors,
    //   errors?.amount?.message,
    //   inputString,
    //   currentMaxBetAmt,
    //   maxBetAmt,
    //   selectedCoin?.amount,
    //   minGameAmount,
    // );
    if (
      inputString === undefined ||
      inputString === "" ||
      inputString === "-"
    ) {
      setBetAmt(undefined);
      clearErrors(`${game}-amount`);
      return;
    }
    const numValue = parseFloat(inputString);
    if (isNaN(numValue) || numValue < 0) {
      setError(`${game}-amount`, {
        type: "manual",
        message: "Please enter a valid positive number",
      });
      setBetAmtError(true);
      return;
    }

    setBetAmtError(true);
    if (numValue > (selectedCoin?.amount ?? 0)) {
      setError(`${game}-amount`, {
        type: "manual",
        message: "Insufficient Balance",
      });
    } else if (numValue < minGameAmount) {
      setError(`${game}-amount`, {
        type: "manual",
        message: "Amount less than the minimum bet for this token.",
      });
    } else if (
      selectedCoin.tokenMint !== "SUPER" &&
      numValue > (maxBetAmt ?? 0)
    ) {
      setError(`${game}-amount`, {
        type: "manual",
        message: "Amount exceeds maximum allowed bet for this token.",
      });
    } else {
      clearErrors(`${game}-amount`);
      setBetAmtError(false);
    }
    // console.log(
    //   "after",
    //   errors,
    //   errors?.amount?.message,
    //   inputString,
    //   currentMaxBetAmt,
    //   maxBetAmt,
    //   selectedCoin?.amount,
    //   minGameAmount,
    // );
    setBetAmt(numValue);
  };

  const handleBetAmountsModal = () => {
    setBetAmountsModal(!betAmountsModal);
  };

  return (
    <div className="relative flex w-full flex-col mb-[1.4rem] z-10">
      <div className="flex w-full items-center justify-between text-xs font-changa text-opacity-90">
        <label className="text-white/90 font-changa">
          {translator("Bet Amount", language)}
        </label>
      </div>
      <div
        className={`relative group flex mt-1 h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
      >
        <input
          id={`${game}-amount`}
          {...register(`${game}-amount`, { required: "Amount is required" })}
          {...rest}
          type="number"
          step="any"
          autoComplete="off"
          onChange={handleBetChange}
          placeholder="0.0"
          disabled={disabled}
          // value={betAmt === undefined ? "" : betAmt}
          lang="en"
          min={0}
          className="flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra placeholder-opacity-40 outline-none disabled:cursor-default disabled:opacity-50"
        />
        <button
          type="button"
          className="text-xs font-medium text-white text-opacity-50 disabled:cursor-default disabled:opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={handleHalfBet}
          disabled={disabled}
        >
          1/2
        </button>
        <button
          type="button"
          className="text-xs mx-2 font-medium text-white text-opacity-50 disabled:cursor-default disabled:opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={handleDoubleBet}
          disabled={disabled}
        >
          2x
        </button>
        <button
          type="button"
          className="text-xs font-medium text-white text-opacity-50 disabled:cursor-default disabled:opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={handleSetMaxBet}
          disabled={disabled}
        >
          {translator("Max", language)}
        </button>
      </div>

      <span
        className={`${
          errors?.[`${game}-amount`]?.message
            ? "opacity-100 mt-1.5"
            : "opacity-0 h-0"
        } flex items-center gap-1 text-xs text-[#D92828]`}
      >
        {errors?.[`${game}-amount`]?.message?.toString() ?? "NONE"}
      </span>
      {betAmt &&
      betAmt > 0 &&
      selectedCoin?.tokenMint !== "SUPER" &&
      betAmt > currentMaxBetAmt ? (
        <span
          className={`opacity-100 mt-1.5 flex items-center gap-1 text-xs text-[#DCA815]`}
        >
          This bet can exceed the max payout for this game.
        </span>
      ) : (
        <></>
      )}
    </div>
  );
}
