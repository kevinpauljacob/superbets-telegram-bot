import { useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "../GlobalContext";
import { GameType } from "@/utils/provably-fair";
import { maxPayouts } from "@/context/transactions";

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
  const [highestBetAmt, setHighestBetAmt] = useState(0);

  const tempBetAmt = betAmt === undefined ? 0 : betAmt;
  let tempMaxBetAmt: number | undefined;
  let potentialMaxBetAmt = 0;
  let highestMaxBetAmt =
    leastMultiplier !== undefined &&
    (maxPayouts[game as GameType] / leastMultiplier).toFixed(2);
  const minBetAmt = parseFloat(process.env.MINIMUM_BET_AMOUNT ?? "0.0001");
  // console.log("game", game);
  // console.log("maxBetAmtMultiplier", multiplier);
  // console.log("betAmt", betAmt);
  // console.log("tempBetAmt", tempBetAmt);
  console.log("least multiplier", leastMultiplier);
  console.log("highestMaxBetAmt", highestMaxBetAmt);

  if (tempBetAmt !== undefined && currentMultiplier !== undefined) {
    potentialMaxBetAmt = maxPayouts[game as GameType] / currentMultiplier || 0;
    console.log("potentialMaxBetAmt", potentialMaxBetAmt);
    if (tempBetAmt * currentMultiplier > maxPayouts[game as GameType]) {
    }

    tempMaxBetAmt = Number.isFinite(highestMaxBetAmt)
      ? Number(potentialMaxBetAmt.toFixed(2))
      : 0;
    setMaxBetAmt(tempMaxBetAmt);

    // console.log("original maxBetAmt", tempMaxBetAmt);
    if (coinData && coinData[0].amount) {
      tempMaxBetAmt = Math.min(
        tempMaxBetAmt,
        parseFloat(coinData[0].amount.toFixed(4)),
      );
      setMaxBetAmt(tempMaxBetAmt);
    }

    // console.log("final maxBetAmt", maxBetAmt);
    // console.log("maxPayouts", maxPayouts[game as GameType]);
  }

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
    <div className="mb-0 flex w-full flex-col">
      <div className="mb-1 flex w-full items-center justify-between text-xs font-changa text-opacity-90">
        <label className="text-white/90 font-changa">Bet Amount</label>
        <span
          onClick={handleSetMaxBet}
          className="text-[#94A3B8] text-opacity-90 cursor-pointer font-changa text-xs"
        >
          <span>
            Max Bet: {maxBetAmt} $SOL {"  "}
          </span>
          <span
            className={`font-chakra font-medium underline text-white ${
              betAmountsModal ? "text-opacity-100" : "text-opacity-50"
            }`}
            onClick={() => handleBetAmountsModal()}
          >
            why?
          </span>
        </span>
      </div>

      <div
        className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
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
            if (maxBetAmt !== undefined && enteredAmount > maxBetAmt) {
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
          className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8]  font-chakra placeholder-opacity-40 outline-none`}
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
          methods.formState.errors["amount"] ? "opacity-100" : "opacity-0"
        } mt-1.5 flex items-center gap-1 text-xs text-[#D92828]`}
      >
        {methods.formState.errors["amount"]
          ? methods.formState.errors["amount"]!.message!.toString()
          : "NONE"}
      </span>

      {betAmountsModal && (
        <div className="fadeInDown relative flex items-center gap-3 bg-[#0C0F16] rounded-[5px] p-2 mb-4">
          <div className="flex items-center border-r border-white/10 h-11 w-[80%] pl-6 pr-8">
            <div className="relative h-[5px] rounded-full bg-[#2A2E38] w-full">
              <input
                type="range"
                min={minBetAmt}
                max={maxBetAmt}
                value={maxBetAmt}
                className="maxBetsSlider absolute top-[-8px] w-full bg-transparent appearance-none z-20"
              />
              <div
                className="absolute rounded-l-full h-[5px] bg-[#8795A8] z-10"
                style={{
                  width: `${
                    (potentialMaxBetAmt / Number(highestMaxBetAmt)) * 100
                  }%`,
                }}
              >
                <div className="relative">
                  <div
                    className="absolute text-white text-[11px] font-semibold font-chakra -top-5 -right-[30px] w-max"
                    // style={{ left: `${potentialMaxBetAmt / highestMaxBetAmt}%` }}
                  >
                    Max {potentialMaxBetAmt.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="absolute text-white text-opacity-50 text-[10px] font-medium font-chakra top-2 -left-4">
                {minBetAmt}
              </div>
              <div className="absolute text-white text-opacity-50 text-[10px] font-medium font-chakra top-2 -right-3">
                {highestMaxBetAmt}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center text-white font-chakra font-medium w-[20%]">
            <span className="text-[10px] text-white text-opacity-50">
              Multiplier
            </span>
            <span>
              <span>
                {isNaN(currentMultiplier) ? "0" : `${currentMultiplier ?? 0}x`}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
