export default function BetSetting({
  betSetting,
  setBetSetting,
}: {
  betSetting: string;
  setBetSetting: any;
}) {
  return (
    <div className="w-full flex md:mb-6">
      <button
        className={`w-full border-2 hover:duration-75 rounded-md py-2 mr-1 text-white font-semibold text-sm transition duration-300 ease-in-out ${
          betSetting === "manual"
            ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
            : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
        }`}
        onClick={() => setBetSetting("manual")}
      >
        Manual
      </button>
      <button
        className={`w-full border-2 hover:duration-75 rounded-md py-2 ml-1 text-white font-semibold text-sm transition-all duration-300 ease-in-out ${
          betSetting === "auto"
            ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
            : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
        }`}
        onClick={() => setBetSetting("auto")}
      >
        Auto
      </button>
    </div>
  );
}
