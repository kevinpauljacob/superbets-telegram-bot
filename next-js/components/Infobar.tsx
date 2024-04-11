import { translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";

export default function InfoBar() {
  const { language, globalInfo, livePrice } = useGlobalContext();
  return (
    <div className="w-full min-h-[2rem] sticky top-0 z-[100] py-1 bg-[linear-gradient(90deg,#1D3B7C_0%,#1D3B7C_100%)] text-[#E7E7E7] text-opacity-70 flex items-center justify-center text-xs gap-5">
      <div className="flex items-center gap-1">
        <span className="text-[#e7e7e7] text-opacity-70 text-xs font-normal">
          {translator("Unique Players", language)} :
        </span>
        <span className="text-[#e7e7e7] text-opacity-70 text-xs font-semibold">
          {12.345}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[#e7e7e7] text-opacity-70 text-xs font-normal">
          {translator("Total Volume", language)} :
        </span>
        <span className="text-[#e7e7e7] text-opacity-70 text-xs font-semibold">
          {" "}
          $
          {((globalInfo?.totalVolume ?? 0) * livePrice).toLocaleString(
            "en-US",
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            },
          )}
        </span>
      </div>
    </div>
  );
}
