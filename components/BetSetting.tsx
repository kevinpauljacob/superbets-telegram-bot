export default function BetSetting({
  betSetting,
  setBetSetting,
}: {
  betSetting: string;
  setBetSetting: any;
}) {
  return (
    <div className="w-full flex mb-8">
      <button
        className={`w-full border-2 rounded-md py-1 mr-1 text-white text-opacity-90 transition duration-300 ease-in-out ${
          betSetting === "manual"
            ? "bg-[#d9d9d90d] border-transparent"
            : "border-[#d9d9d90d]"
        }`}
        onClick={() => setBetSetting("manual")}
      >
        Manual
      </button>
      <button
        className={`w-full border-2 rounded-md py-1 ml-1 text-white text-opacity-90 transition duration-300 ease-in-out ${
          betSetting === "auto"
            ? "bg-[#d9d9d90d] border-transparent"
            : "border-[#d9d9d90d]"
        }`}
        onClick={() => setBetSetting("auto")}
      >
        Auto
      </button>
    </div>
  );
}
