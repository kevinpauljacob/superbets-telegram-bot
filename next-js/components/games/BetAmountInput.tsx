import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "../GlobalContext";
import { GameType } from "@/utils/provably-fair";
import { maxPayouts } from "@/context/transactions";
import Image from "next/image";
import BalanceAlert from "./BalanceAlert";
import { FaInfo } from "react-icons/fa6";
import { InfoCircle } from "iconsax-react";
import { BsInfoCircleFill } from "react-icons/bs";
import DicePointer from "@/public/assets/DicePointer";
import { translator } from "@/context/transactions";
import { truncateNumber } from "@/context/gameTransactions";

export default function BetAmount({
  betAmt,
  setBetAmt,
  currentMultiplier,
  leastMultiplier,
  game,
  disabled = false,
}: {
  betAmt: number | undefined;
  setBetAmt: React.Dispatch<React.SetStateAction<number | undefined>>;
  currentMultiplier: number;
  leastMultiplier: number;
  game: string;
  disabled?: boolean;
}) {
  const methods = useForm();
  const { coinData, maxBetAmt, setMaxBetAmt, language } = useGlobalContext();
  const [betAmountsModal, setBetAmountsModal] = useState(false);

  const [isHovered, setIsHovered] = useState<boolean>(false);

  const minBetAmt = parseFloat(process.env.MINIMUM_BET_AMOUNT ?? "0");
  const highestMaxBetAmt =
    leastMultiplier !== undefined &&
    (maxPayouts[game as GameType] / leastMultiplier).toFixed(2);

  const tempBetAmt = betAmt ?? 0;

  const [currentMaxBetAmt, setCurrentMaxBetAmt] = useState(0);
  const [inputString, setInputString] = useState("");

  useEffect(() => {
    if (tempBetAmt !== undefined && currentMultiplier !== undefined) {
      let calculatedMaxBetAmt =
        maxPayouts[game as GameType] / currentMultiplier;
      setCurrentMaxBetAmt(
        isFinite(calculatedMaxBetAmt) ? calculatedMaxBetAmt : 0,
      );

      if (
        betAmt &&
        betAmt > (isFinite(calculatedMaxBetAmt) ? calculatedMaxBetAmt : 0)
      ) {
        methods.setError("amount", {
          type: "manual",
          message: "Bet amount cannot exceed the maximum bet!",
        });
      } else {
        methods.clearErrors("amount");
      }
    }
  }, [tempBetAmt, betAmt, currentMultiplier, game]);

  useEffect(() => {
    setMaxBetAmt(
      Math.min(
        truncateNumber(currentMaxBetAmt, 4),
        coinData && coinData[0]?.amount
          ? truncateNumber(coinData[0].amount, 4)
          : truncateNumber(currentMaxBetAmt, 4),
      ),
    );
  }, [currentMaxBetAmt, coinData]);

  const handleSetMaxBet = () => {
    setBetAmt(maxBetAmt);
    setInputString((maxBetAmt ?? 0).toString());
  };

  const handleHalfBet = () => {
    if (betAmt || coinData) {
      let newBetAmt =
        !betAmt || betAmt === 0
          ? coinData
            ? coinData[0]?.amount / 2
            : 0
          : betAmt! / 2;

      newBetAmt = parseFloat(newBetAmt.toFixed(4));

      if (newBetAmt < minBetAmt) {
        newBetAmt = minBetAmt;
      }

      setBetAmt(newBetAmt);
      setInputString(newBetAmt.toString());
    }
  };

  const handleDoubleBet = () => {
    if (betAmt !== undefined || coinData) {
      const newBetAmt =
        betAmt === 0
          ? coinData
            ? parseFloat((coinData[0]?.amount * 2).toFixed(4))
            : 0
          : parseFloat(((betAmt ?? 0) * 2).toFixed(4));

      const finalBetAmt = maxBetAmt
        ? newBetAmt > maxBetAmt
          ? maxBetAmt
          : newBetAmt
        : newBetAmt;

      setBetAmt(finalBetAmt);
      setInputString(finalBetAmt.toString());
    }
  };

  const handleBetAmountsModal = () => {
    setBetAmountsModal(!betAmountsModal);
  };

  return (
    <div className="relative flex w-full flex-col mb-[1.4rem] z-10">
      <div className="flex w-full items-center justify-between text-xs font-changa text-opacity-90">
        <label className="text-white/90 font-changa">{translator("Bet Amount", language)}</label>
        <span className="flex items-center text-[#94A3B8] text-opacity-90 font-changa text-xs gap-2">
          <span className="cursor-pointer" onClick={handleSetMaxBet}>
            {maxBetAmt} $SOL
          </span>
          <span
            className={`group font-chakra font-medium cursor-pointer underline hover:text-opacity-100 transition-all duration-300 text-white ${
              betAmountsModal ? "text-opacity-100" : "text-opacity-50"
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
              if (game !== "keno" && game !== "wheel" && game !== "coinflip")
                handleBetAmountsModal();
            }}
          >
            {translator("Why", language)}?
          </span>
        </span>
      </div>
      {betAmountsModal &&
      game !== "keno" &&
      game !== "wheel" &&
      game !== "coinflip" &&
      game !== "options" ? (
        <div className="fadeInDown_04 relative flex flex-col items-center gap-3 bg-[#0C0F16] rounded-[5px] px-6 pt-7 pb-4 mt-2 mb-1.5">
          <div className="flex items-center border-b border-white/10 h-full w-full px-3 pb-8 pt-3">
            <div className="relative h-[4px] rounded-full bg-[#2A2E38] w-full mx-3">
              <input
                type="range"
                min={minBetAmt}
                max={maxBetAmt}
                value={maxBetAmt}
                disabled={disabled}
                className="maxBetsSlider absolute top-[-8px] w-full bg-transparent appearance-none z-20 disabled:cursor-default disabled:opacity-50"
              />
              <div
                className="absolute rounded-full h-[5px] bg-[#8795A8] z-10"
                style={{
                  width: `${
                    (currentMaxBetAmt / Number(highestMaxBetAmt)) * 100
                  }%`,
                }}
              >
                <div className="relative">
                  <div className="absolute text-[#94A3B8] text-[11px] font-semibold font-chakra -top-7 -right-[24px] w-max">
                    <span className="text-white">
                      {translator("Max", language)} {currentMaxBetAmt.toFixed(2)}
                    </span>
                    <svg
                      width="6"
                      height="4"
                      viewBox="0 0 6 4"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="relative w-2 h-2 left-1/2 -translate-x-1/2 text-white"
                    >
                      <path
                        opacity="0.5"
                        d="M3.70711 3.2929C3.31658 3.68342 2.68342 3.68342 2.29289 3.29289L0.707116 1.7071C0.0771532 1.07714 0.523321 0 1.41422 0L4.5858 0C5.4767 0 5.92287 1.07714 5.2929 1.70711L3.70711 3.2929Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="absolute text-white text-opacity-50 text-[11px] font-medium font-chakra top-2.5 -left-2">
                {minBetAmt.toFixed(2)}
              </div>
              <div className="absolute group cursor-pointer text-white text-opacity-50 text-[11px] font-medium font-chakra top-2.5 -right-3.5">
                {highestMaxBetAmt}
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-2.5 w-full">
            <div className="flex flex-col items-center bg-[#202329]/50 text-white font-chakra font-semibold rounded-[5px] py-2 w-full">
              <span className="text-[10px] text-white text-opacity-50 mb-1">
                {translator("Multiplier", language)}
              </span>
              <span className="text-xs font-medium">
                {isNaN(currentMultiplier)
                  ? "0"
                  : `${currentMultiplier.toFixed(2) ?? 0.0}x`}
              </span>
            </div>
            <div className="flex flex-col items-center bg-[#202329]/50 text-white font-chakra font-semibold rounded-[5px] py-2 w-full">
              <span className="cursor-pointer group relative text-[10px] text-white text-opacity-50 mb-1">
                {translator("Max Bet", language)}
                {/* <BsInfoCircleFill className="text-white text-opacity-50 w-3 h-3 absolute top-1/2 -translate-y-1/2 -right-4" />
                <span className="absolute hidden group-hover:block transition-all z-[1000] text-justify w-80 p-2 rounded-[5px] top-5 -right-16 translate-x-[30%] md:translate-x-1/4 bg-[#080808] text-white/50 text-xs text-regular font-changa">
                  The maximum amount you can bet with the current multiplier (
                  <span className="text-white/80 font-medium">
                    {isNaN(currentMultiplier)
                      ? "0"
                      : `${currentMultiplier ?? 0}x`}
                  </span>
                  ) is{" "}
                  <span className="text-white/80 font-medium">
                    {currentMaxBetAmt.toFixed(2)} SOL
                  </span>
                  . {translator("Your current wallet balance is", language)}{" "}
                  <span className="text-white/80 font-medium">
                    {coinData && coinData[0]?.amount
                      ? parseFloat(coinData[0].amount.toFixed(4))
                      : 0.0}
                  </span>{" "}
                  . {translator("The maximum amount you can bet in this game is", language)}{" "}
                  <span className="text-white/80 font-medium">
                    {highestMaxBetAmt} SOL
                  </span>
                  .
                </span> */}
              </span>
              <span className="text-xs font-medium">
                {isNaN(currentMaxBetAmt)
                  ? "0"
                  : `${currentMaxBetAmt.toFixed(2) ?? 0.0}`}
              </span>
            </div>
            <div className="flex flex-col items-center bg-[#202329]/50 text-white font-chakra font-semibold rounded-[5px] py-2 w-full">
              <span className="text-[10px] text-white text-opacity-50 mb-1">
                {translator("Balance", language)}
              </span>
              <span className="text-xs font-medium">
                {coinData ? (coinData[0]?.amount).toFixed(2) : 0.0}
              </span>
            </div>
          </div>
        </div>
      ) : null}
      {isHovered &&
      (game === "keno" ||
        game === "wheel" ||
        game === "coinflip" ||
        game === "options") ? (
        <div
          className={`absolute z-[1000] ${
            game === "options" ? "top-[1rem]" : "-top-[5.2rem]"
          } min-w-full fadeIn flex items-center gap-3 bg-[#0C0F16] rounded-[5px] p-3 mt-2 mb-1.5 `}
        >
          <div className="flex items-center border-r lg:border-0 min-[1412px]:border-r border-white/10 text-[#94A3B8] text-chakra text-[11px] font-medium h-11 w-[80%] lg:w-full min-[1412px]:w-[80%]">
            <span className="flex items-center justify-center bg-[#202329]/50 rounded-[8px] h-[49px] min-w-[49px]">
              <Image
                src="/assets/coins.svg"
                alt="coins"
                height="33"
                width="33"
              />
            </span>

            <span className="text-[11px] font-medium font-chakra mx-3 min-[1412px]:max-w-[200px]">
              {translator("Maximum amount for a single bet in this game is", language)}
              <span className="text-white/90 font-semibold"> 20.00 SOL</span>
               .
            </span>
          </div>
          <div className="flex flex-col items-center text-white font-chakra font-medium w-[20%] min-[1412px]:flex lg:hidden">
            <span className="text-[11px] text-white text-center font-semibold text-opacity-50">
              {translator("Max Bet", language)}
            </span>
            <span className="flex items-center justify-center gap-1">
              {20}
              <Image src="/assets/sol.png" alt="coins" height="11" width="14" />
            </span>
          </div>
        </div>
      ) : null}
      <div
        className={`relative group flex mt-1 h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
      >
        <input
          id={"amount-input"}
          {...methods.register("amount", {
            required: "Amount is required",
          })}
          type={"number"}
          step={"any"}
          autoComplete="off"
          onChange={(e) => {
            let enteredAmount = parseFloat(e.target.value);
            // console.log(enteredAmount, currentMaxBetAmt);
            if (maxBetAmt !== undefined && enteredAmount > currentMaxBetAmt) {
              methods.setError("amount", {
                type: "manual",
                message: "Bet amount cannot exceed the maximum bet!",
              });
            } else {
              methods.clearErrors("amount");
            }
            setBetAmt(enteredAmount);
            setInputString(e.target.value);
          }}
          placeholder={"0.0"}
          disabled={disabled}
          value={betAmt ?? NaN}
          lang="en"
          className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra placeholder-opacity-40 outline-none disabled:cursor-default disabled:opacity-50`}
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
          methods.formState.errors["amount"]
            ? "opacity-100 mt-1.5"
            : "opacity-0 h-0"
        } flex items-center gap-1 text-xs text-[#D92828]`}
      >
        {methods.formState.errors["amount"]
          ? methods.formState.errors["amount"]!.message!.toString()
          : "NONE"}
      </span>

      {/* <BalanceAlert /> */}
    </div>
  );
}
