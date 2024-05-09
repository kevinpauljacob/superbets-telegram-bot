import { useForm } from "react-hook-form";
import { useGlobalContext } from "./GlobalContext";
import { BsInfinity } from "react-icons/bs";
import { translator } from "@/context/transactions";

export default function AutoCount({
  loading,
  onChange,
}: {
  loading: boolean;
  onChange: any;
}) {
  const methods = useForm();
  const {
    useAutoConfig,
    setShowAutoModal,
    autoBetCount,
    startAuto,
    setAutoBetCount,
    language
  } = useGlobalContext();
  return (
    <div className="mb-0 flex w-full flex-col">
      <div className="mb-1 flex w-full items-center justify-between text-xs font-changa text-opacity-90">
        <label className="text-white/90 font-changa">{translator("Number of Bets", language)}</label>
      </div>

      <div
        className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
      >
        <input
          id={"count-input"}
          {...methods.register("betCount", {
            required: "Bet count is required",
          })}
          type={"number"}
          step={"any"}
          autoComplete="off"
          onChange={onChange}
          placeholder={
            autoBetCount.toString().includes("inf") ? "Infinity" : "00"
          }
          disabled={loading || startAuto}
          value={autoBetCount}
          className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra ${
            autoBetCount.toString().includes("inf")
              ? "placeholder-opacity-100"
              : "placeholder-opacity-40"
          } placeholder-opacity-40 outline-none`}
        />
        <span
          className={`text-2xl font-medium text-white text-opacity-50 ${
            autoBetCount.toString().includes("inf")
              ? "bg-[#47484A]"
              : "bg-[#292C32]"
          } hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-0.5 px-3`}
          onClick={() => setAutoBetCount("inf")}
        >
          <BsInfinity />
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
