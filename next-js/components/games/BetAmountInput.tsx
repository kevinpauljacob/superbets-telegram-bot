import { useForm } from "react-hook-form";
import { useGlobalContext } from "../GlobalContext";
import { GameType } from "@/utils/provably-fair";
import { maxPayouts } from "@/context/transactions";
import { toast } from "react-hot-toast";

export default function BetAmount({
  betAmt,
  setBetAmt,
  multiplier,
  game,
}: {
  betAmt: number | undefined;
  setBetAmt: React.Dispatch<React.SetStateAction<number | undefined>>;
  multiplier: number | undefined;
  game: string | undefined;
}) {
  const methods = useForm();
  const { coinData, maxBetAmt, setMaxBetAmt } = useGlobalContext();
  const tempBetAmt = betAmt === undefined ? 0 : betAmt;
  let tempMaxBetAmt: number | undefined;
  const min_bet = parseFloat(process.env.MINIMUM_BET_AMOUNT ?? "0.0001");
  // console.log("game", game);
  // console.log("maxBetAmtMultiplier", multiplier);
  // console.log("betAmt", betAmt);
  // console.log("tempBetAmt", tempBetAmt);

  if (tempBetAmt !== undefined && multiplier !== undefined) {
    const potentialMaxBet = maxPayouts[game as GameType] / multiplier;
    if (tempBetAmt * multiplier > maxPayouts[game as GameType]) {
    }

    tempMaxBetAmt = Number.isFinite(potentialMaxBet)
      ? Number(potentialMaxBet.toFixed(4))
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

      if (newBetAmt < min_bet) {
        newBetAmt = min_bet;
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

  return (
    <div className="mb-0 flex w-full flex-col">
      <div className="mb-1 flex w-full items-center justify-between text-xs font-changa text-opacity-90">
        <label className="text-white/90 font-changa">Bet Amount</label>
        <span
          onClick={handleSetMaxBet}
          className="text-[#94A3B8] text-opacity-90 cursor-pointer font-changa text-xs"
        >
          {maxBetAmt} $SOL
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
                message: "Bet amount cannot exceed the maximum bet",
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
          onClick={handleSetMaxBet}
        >
          Max
        </span>
        <span
          className="text-xs mx-2 font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={handleHalfBet}
        >
          1/2
        </span>
        <span
          className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={handleDoubleBet}
        >
          2x
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
    </div>
  );
}
