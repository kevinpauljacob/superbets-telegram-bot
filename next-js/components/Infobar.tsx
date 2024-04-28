import { translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import { useState, useEffect } from "react";

export default function InfoBar() {
  const { language } = useGlobalContext();

  const [stats, setStats] = useState({
    totalVolume: 0,
    totalPlayers: 0,
  });

  useEffect(() => {
    fetch("/api/games/global/getAggStats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.stats);
      });
  }, []);

  return (
    <div className="w-full min-h-[2rem] z-[100] py-1 bg-[linear-gradient(90deg,#1D3B7C_0%,#1D3B7C_100%)] text-[#E7E7E7] text-opacity-70 flex items-center justify-center text-xs gap-5">
      <div className="flex items-center gap-1">
        <span className="text-[#e7e7e7] text-opacity-70 text-xs font-normal">
          {translator("Unique Players", language)} :
        </span>
        <span className="text-[#e7e7e7] text-opacity-70 text-xs font-medium">
          {stats.totalPlayers}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[#e7e7e7] text-opacity-70 text-xs font-normal">
          {translator("Total Volume", language)} :
        </span>
        <span className="text-[#e7e7e7] text-opacity-70 text-xs font-medium">
          {" "}
          {(stats.totalVolume ?? 0).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}{" "}
          SOL
        </span>
      </div>
    </div>
  );
}
