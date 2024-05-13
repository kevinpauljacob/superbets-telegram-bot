import { translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
export default function BetSetting({
  betSetting,
  setBetSetting,
  disabled = false,
}: {
  betSetting: string;
  setBetSetting: any;
  disabled?: boolean;
}) {
  const { language, setAutoBetCount } = useGlobalContext();
  return (
    <div className="w-full flex lg:mb-6">
      <button
        className={`w-full border-2 hover:duration-75 rounded-md py-2 mr-1 text-white font-semibold text-sm transition duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 ${
          betSetting === "manual"
            ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
            : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
        }`}
        onClick={() => setBetSetting("manual")}
        disabled={disabled}
      >
        {translator("Manual", language)}
      </button>
      <button
        className={`w-full border-2 hover:duration-75 rounded-md py-2 ml-1 text-white font-semibold text-sm transition-all duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 ${
          betSetting === "auto"
            ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
            : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
        }`}
        onClick={() => {
          setBetSetting("auto");
          setAutoBetCount(1)
        }}
        disabled={disabled}
      >
        {translator("Auto", language)}
      </button>
    </div>
  );
}
