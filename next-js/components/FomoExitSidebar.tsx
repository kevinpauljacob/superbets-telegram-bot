import Link from "next/link";
import FomoExitIcon from "@/public/assets/sidebar-icons/FomoExitIcon";
import { translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import { useEffect, useState } from "react";

export default function FomoExitSidebar() {
  const { language } = useGlobalContext();

  const [gameTime, setGameTime] = useState("0s")

  useEffect(() => {
    function getHighestTimeDifference() {
      const now = new Date().getTime();
      const target = new Date(Date.UTC(2024, 5, 2, 19, 30, 0)).getTime();

      const diffInSeconds = Math.floor((target - now) / 1000);

      const days = Math.floor(diffInSeconds / (24 * 60 * 60));
      const hours = Math.floor(diffInSeconds / (60 * 60)) % 24;
      const minutes = Math.floor(diffInSeconds / 60) % 60;
      const seconds = diffInSeconds % 60;

      if (days > 0) {
        setGameTime(`${days}d`);
      } else if (hours > 0) {
        setGameTime(`${hours}h`);
      } else if (minutes > 0) {
        setGameTime(`${minutes}m`);
      } else {
        setGameTime(`${Math.max(seconds,0)}s`);
      }
    }

    getHighestTimeDifference();

    let intervalId = setInterval(async () => {
        getHighestTimeDifference();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Link href="https://exitscam.live" target="_blank">
      <div className={`mt-0`}>
        <div className="w-full transition-all cursor-pointer rounded-md flex items-center justify-between gap-2 pl-4 pr-4 py-2 bg-[#1f2024] focus:bg-[#1f2024] group">
          <div className="flex items-center gap-3">
            <FomoExitIcon className="min-w-[1.25rem] min-h-[1.25rem] transition-all text-white group-hover:text-[#5F4DFF] group-focus:text-[#5F4DFF] opacity-50 hover:opacity-100" />
            <span className="mt-0.5 transition-all text-sm font-changa font-medium text-white text-opacity-90 group-hover:text-opacity-100 group-focus:text-opacity-100">
              FOMO: EXIT
            </span>
          </div>
          <span className="text-xs text-fomo-green font-medium mt-[0.5px]">
            {gameTime}
          </span>
        </div>
      </div>
    </Link>
  );
}
