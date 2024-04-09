import { translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";

export default function InfoBar() {
  const { language, globalInfo, livePrice } = useGlobalContext();
  return (
    <div className="w-full sticky top-0 z-[100] py-1 bg-[linear-gradient(90deg,#1D3B7C_0%,#1D3B7C_100%)] text-white text-opacity-70 flex items-center justify-center font-medium text-xs gap-5">
      <p className="text-center">
        {translator("Unique Players", language)} :{" "}
        <b>{globalInfo?.users ?? 0}</b>
      </p>
      <p className="text-center">
        {translator("Total Volume", language)} :{" "}
        <b>
          $
          {((globalInfo?.totalVolume ?? 0) * livePrice).toLocaleString(
            "en-US",
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            },
          )}
        </b>
      </p>
    </div>
  );
}
