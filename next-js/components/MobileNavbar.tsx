import Image from "next/image";
import { useRouter } from "next/router";
import Menu from "/public/assets/menu.svg";
import ActiveMenu from "/public/assets/activeMenu.svg";
import Staking from "@/public/assets/Staking";
import Leaderboard from "/public/assets/Leaderboard1.svg";
import ActiveLeaderboard from "/public/assets/activeLeaderboard.svg";
import Store from "/public/assets/store1.svg";
import ActiveStore from "/public/assets/activeStore.svg";
import Dashboard from "/public/assets/dashboard.svg";
import ActiveDashboard from "/public/assets/activeDashboard.svg";
import Link from "next/link";

import { translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";

export default function MobileNavbar({
  sidebar,
  toggleSidebar,
}: {
  sidebar: boolean;
  toggleSidebar: () => void;
}) {
  const router = useRouter();
  const { language } = useGlobalContext();
  return (
    <div
      className={`${
        sidebar ? "z-50" : ""
      } md:hidden text-white bg-[#121418] border-b border-white/10 py-2 w-full`}
    >
      <ul className="flex flex-1">
        <button
          className="flex flex-col items-center justify-center border-r border-white/10 w-full"
          onClick={() => toggleSidebar()}
        >
          <li
            className={`${
              sidebar ? "bg-[#1E2024]" : ""
            } hover:bg-[#1E2024] flex flex-col items-center rounded-md w-[4.7rem] pt-1.5 pb-1`}
          >
            <Image
              src={sidebar ? ActiveMenu : Menu}
              alt="Menu"
              width={23}
              height={20}
            />
            <p
              className={`text-[10px] text-white/60 ${
                sidebar ? "text-[#8033D7]" : "text-white/60"
              } mt-1.5`}
            >
              {translator("Menu", language)}
            </p>
          </li>
        </button>
        {/* <Link
          href="/stake"
          className="flex flex-col items-center justify-center border-r border-white/10 w-full"
        >
          <li
            className={`${
              router.pathname === "/stake" ? "bg-[#1E2024]" : ""
            } hover:bg-[#1E2024] flex flex-col items-center rounded-md w-[4.7rem] pt-1.5 pb-1`}
          >
            <Staking
              className={`w-5 h-5 ${
                router.pathname === "/stake"
                  ? "text-[#8033D7]"
                  : "text-white/60"
              }`}
            />
            <p
              className={`text-[10px] text-white/60 ${
                router.pathname === "/stake"
                  ? "text-[#8033D7]"
                  : "text-white/60"
              } mt-1.5`}
            >
              {translator("Staking", language)}
            </p>
          </li>
        </Link> */}
        <Link
          href="/leaderboard"
          className="flex flex-col items-center justify-center border-r border-white/10 w-full"
        >
          <li
            className={`${
              router.pathname === "/leaderboard" ? "bg-[#1E2024]" : ""
            } hover:bg-[#1E2024] flex flex-col items-center rounded-md w-[4.7rem] pt-1.5 pb-1`}
          >
            <Image
              src={
                router.pathname === "/leaderboard"
                  ? ActiveLeaderboard
                  : Leaderboard
              }
              alt="Menu"
              width={23}
              height={20}
            />
            <p
              className={`text-[10px] text-white/60 ${
                router.pathname === "/leaderboard"
                  ? "text-[#8033D7]"
                  : "text-white/60"
              } mt-1.5`}
            >
              {translator("Leaderboard", language)}
            </p>
          </li>
        </Link>
        {/* <Link
          href="/store"
          className="flex flex-col items-center justify-center border-r border-white/10 w-full"
        >
          <li
            className={`${
              router.pathname === "/store" ? "bg-[#1E2024]" : ""
            } hover:bg-[#1E2024] flex flex-col items-center rounded-md w-[4.7rem] pt-1.5 pb-1`}
          >
            <Image
              src={router.pathname === "/store" ? ActiveStore : Store}
              alt="Menu"
              width={23}
              height={20}
            />
            <p
              className={`text-[10px] text-white/60 ${
                router.pathname === "/store"
                  ? "text-[#8033D7]"
                  : "text-white/60"
              } mt-1.5`}
            >
              {translator("Store", language)}
            </p>
          </li>
        </Link> */}
        <Link
          href="/"
          className="flex flex-col items-center justify-center w-full"
        >
          <li
            className={`${
              router.pathname === "/" ? "bg-[#1E2024]" : ""
            } hover:bg-[#1E2024] flex flex-col items-center rounded-md w-[4.7rem] pt-1.5 pb-1`}
          >
            <Image
              src={router.pathname === "/" ? ActiveDashboard : Dashboard}
              alt="Menu"
              width={23}
              height={20}
            />
            <p
              className={`text-[10px] text-white/60 ${
                router.pathname === "/" ? "text-[#8033D7]" : "text-white/60"
              } mt-1.5`}
            >
              {translator("Dashboard", language)}
            </p>
          </li>
        </Link>
      </ul>
    </div>
  );
}
