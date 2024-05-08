import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "../GlobalContext";
import { GameType } from "@/utils/provably-fair";
import { maxPayouts } from "@/context/transactions";
import BalanceAlert from "./BalanceAlert";
import { FaInfo } from "react-icons/fa6";
import { InfoCircle } from "iconsax-react";
import { BsInfoCircleFill } from "react-icons/bs";

export default function BetAmount({
  betAmt,
  setBetAmt,
  currentMultiplier,
  leastMultiplier,
  game,
}: {
  betAmt: number | undefined;
  setBetAmt: React.Dispatch<React.SetStateAction<number | undefined>>;
  currentMultiplier: number;
  leastMultiplier: number;
  game: string;
}) {
  const methods = useForm();
  const { coinData, maxBetAmt, setMaxBetAmt } = useGlobalContext();
  const [betAmountsModal, setBetAmountsModal] = useState(false);

  const minBetAmt = parseFloat(process.env.MINIMUM_BET_AMOUNT ?? "0");
  const highestMaxBetAmt =
    leastMultiplier !== undefined &&
    (maxPayouts[game as GameType] / leastMultiplier).toFixed(2);
  // console.log("highestMaxBetAmt", highestMaxBetAmt);

  const tempBetAmt = betAmt ?? 0;
  // console.log("tempBetAmt", tempBetAmt);

  const [currentMaxBetAmt, setCurrentMaxBetAmt] = useState(0);

  useEffect(() => {
    if (tempBetAmt !== undefined && currentMultiplier !== undefined) {
      let calculatedMaxBetAmt =
        maxPayouts[game as GameType] / currentMultiplier;
      setCurrentMaxBetAmt(
        isFinite(calculatedMaxBetAmt) ? calculatedMaxBetAmt : 0,
      );
    }
  }, [tempBetAmt, currentMultiplier, game]);

  useEffect(() => {
    // console.log("currentMaxBetAmt", currentMaxBetAmt);
    setMaxBetAmt(
      Math.min(
        Number(currentMaxBetAmt.toFixed(4)),
        coinData && coinData[0]?.amount
          ? parseFloat(coinData[0].amount.toFixed(4))
          : Number(currentMaxBetAmt.toFixed(4)),
      ),
    );
  }, [currentMaxBetAmt, coinData]);

  const handleSetMaxBet = () => {
    setBetAmt(maxBetAmt);
  };

  const handleHalfBet = () => {
    if (betAmt || coinData) {
      let newBetAmt =
        betAmt === 0 ? (coinData ? coinData[0]?.amount / 2 : 0) : betAmt! / 2;

      newBetAmt = parseFloat(newBetAmt.toFixed(4));

      if (newBetAmt < minBetAmt) {
        newBetAmt = minBetAmt;
      }

      setBetAmt(newBetAmt);
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
    }
  };

  const handleBetAmountsModal = () => {
    setBetAmountsModal(!betAmountsModal);
  };

  return (
    <div className="flex w-full flex-col mb-[1.4rem] z-10">
      <div className="flex w-full items-center justify-between text-xs font-changa text-opacity-90">
        <label className="text-white/90 font-changa">Bet Amount</label>
        <span
          onClick={handleSetMaxBet}
          className="text-[#94A3B8] text-opacity-90 cursor-pointer font-changa text-xs"
        >
          <span>
            {maxBetAmt} $SOL {"  "}
          </span>
          <span
            className={`font-chakra font-medium underline text-white ${
              betAmountsModal ? "text-opacity-100" : "text-opacity-50"
            }`}
            onClick={() => handleBetAmountsModal()}
          >
            Why?
          </span>
        </span>
      </div>
      {betAmountsModal && game !== "keno" && game !== "wheel" ? (
        <div className="fadeInDown_04 relative flex items-center gap-3 bg-[#0C0F16] rounded-[5px] p-2 mt-2 mb-1.5 h-[69px]">
          <div className="flex items-center border-r border-white/10 h-11 w-[80%] pl-6 pr-8">
            <div className="relative h-[4px] rounded-full bg-[#2A2E38] w-full">
              <input
                type="range"
                min={minBetAmt}
                max={maxBetAmt}
                value={maxBetAmt}
                className="maxBetsSlider absolute top-[-8px] w-full bg-transparent appearance-none z-20"
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
                  <div className="absolute text-[#94A3B8] text-[11px] font-semibold font-chakra -top-5 -right-[14px] w-max">
                    <span className="text-white">
                      {currentMaxBetAmt.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute text-white text-opacity-50 text-[11px] font-medium font-chakra top-2.5 -left-1">
                {minBetAmt}
              </div>
              <div className="absolute group cursor-pointer text-white text-opacity-50 text-[11px] font-medium font-chakra top-2.5 -right-2.5">
                {highestMaxBetAmt}
                <BsInfoCircleFill className="text-white text-opacity-50 w-3 h-3 absolute top-1/2 -translate-y-1/2 -right-3.5" />
                <span className="absolute hidden group-hover:block transition-all z-[1000] w-80 p-2 rounded-[5px] top-5 right-0 translate-x-[30%] md:translate-x-1/4 bg-[#080808] text-white/50 text-xs text-regular font-changa">
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
                  . The maximum amount you can bet in this game is{" "}
                  <span className="text-white/80 font-medium">
                    {highestMaxBetAmt} SOL
                  </span>
                  .
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center text-white font-chakra font-medium w-[20%]">
            <span className="text-[10px] text-white text-opacity-50">
              Multiplier
            </span>
            <span>
              <span>
                {isNaN(currentMultiplier)
                  ? "0"
                  : `${currentMultiplier.toFixed(2) ?? 0.0}x`}
              </span>
            </span>
          </div>
        </div>
      ) : null}
      {betAmountsModal && (game === "keno" || game === "wheel") ? (
        <div className="fadeInDow_04 relative flex items-center gap-3 bg-[#0C0F16] rounded-[5px] p-2 mt-2 mb-1.5">
          <div className="flex items-center border-r border-white/10 text-[#94A3B8] text-chakra text-[11px] font-medium h-11 w-[80%] p-6">
            The more you stake, the less fees you pay and the bigger your points
            multiplier
          </div>
          <div className="flex flex-col items-center text-white font-chakra font-medium w-[20%]">
            <span className="text-[10px] text-white text-opacity-50">
              Max Bet
            </span>
            <span>20 $SOL</span>
          </div>
        </div>
      ) : null}
      <div
        className={`group flex mt-1 h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
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
          }}
          placeholder={"0.0"}
          min={0.0001}
          value={betAmt}
          lang="en"
          className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra placeholder-opacity-40 outline-none`}
        />
        <span
          className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={handleHalfBet}
        >
          1/2
        </span>
        <span
          className="text-xs mx-2 font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={handleDoubleBet}
        >
          2x
        </span>
        <span
          className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={handleSetMaxBet}
        >
          Max
        </span>
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

      <BalanceAlert />
    </div>
  );
}
