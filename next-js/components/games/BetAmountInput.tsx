import { useForm } from "react-hook-form";
import { useGlobalContext } from "../GlobalContext";

export default function BetAmount({
  betAmt,
  setBetAmt,
}: {
  betAmt: number | undefined;
  setBetAmt: React.Dispatch<React.SetStateAction<number | undefined>>;
}) {
  const methods = useForm();
  const { coinData } = useGlobalContext();
  const min_bet = parseFloat(process.env.MINIMUM_BET_AMOUNT ?? "0.0001");
  return (
    <div className="mb-0 flex w-full flex-col">
      <div className="mb-1 flex w-full items-center justify-between text-xs font-changa text-opacity-90">
        <label className="text-white/90 font-changa">Bet Amount</label>
        <span
          onClick={() => setBetAmt(coinData ? coinData[0]?.amount : 0)}
          className="text-[#94A3B8] text-opacity-90 cursor-pointer font-changa text-xs"
        >
          {coinData ? coinData[0]?.amount.toFixed(4) : 0} $SOL
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
            setBetAmt(parseFloat(e.target.value));
          }}
          placeholder={"0.0"}
          min={0.0001}
          value={betAmt}
          lang="en"
          className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8]  font-chakra placeholder-opacity-40 outline-none`}
        />
        <span
          className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={() => setBetAmt(min_bet)}
        >
          Min
        </span>
        <span
          className="text-xs mx-2 font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={() => {
            if (
              (betAmt && betAmt / 2 > min_bet) ||
              (coinData && coinData[0]?.amount / 2 > min_bet)
            )
              setBetAmt(
                betAmt === 0
                  ? coinData
                    ? coinData[0]?.amount / 2
                    : 0
                  : betAmt! / 2,
              );
          }}
        >
          1/2
        </span>
        <span
          className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={() =>
            setBetAmt(
              betAmt
                ? coinData
                  ? betAmt * 2 < coinData[0].amount
                    ? betAmt * 2
                    : betAmt
                  : 0
                : undefined,
            )
          }
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
