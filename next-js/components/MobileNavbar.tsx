import Image from "next/image";
import { useRouter } from "next/router";
import Menu from "/public/assets/menu.svg";
import ActiveMenu from "/public/assets/activeMenu.svg";
// import Staking from "@/public/assets/Staking";
import Staking from "/public/assets/staking.svg";
import ActiveStaking from "/public/assets/activeStaking.svg";
import Leaderboard from "/public/assets/Leaderboard1.svg";
import ActiveLeaderboard from "/public/assets/activeLeaderboard.svg";
import Store from "/public/assets/store1.svg";
import ActiveStore from "/public/assets/activeStore.svg";
// import Dashboard from "@/public/assets/dashboard";
import Dashboard from "/public/assets/dashboard.svg";
import ActiveDashboard from "/public/assets/activeDashboard.svg";
import Link from "next/link";

export default function MobileNavbar({
  sidebar,
  toggleSidebar,
}: {
  sidebar: boolean;
  toggleSidebar: () => void;
}) {
  const router = useRouter();
  return (
    <div
      className={`${
        sidebar ? "z-50" : ""
      } md:hidden text-white bg-[#121418] border-b border-white/10 py-2 w-full`}
    >
      <ul className="flex flex-1">
        <button
          className="flex flex-col items-center justify-center border-r border-white/10 w-1/5"
          onClick={() => toggleSidebar()}
        >
          <li
            className={`${
              sidebar ? "bg-[#1E2024]" : ""
            } hover:bg-[#1E2024] flex flex-col items-center rounded-md px-4 pt-1.5 pb-1`}
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
              Menu
            </p>
          </li>
        </button>
        <Link
          href="/stake"
          className="flex flex-col items-center justify-center border-r border-white/10 w-1/5"
        >
          <li
            className={`${
              router.pathname === "/stake" ? "bg-[#1E2024]" : ""
            } hover:bg-[#1E2024] flex flex-col items-center rounded-md px-4 pt-1.5 pb-1`}
          >
            <Image
              src={router.pathname === "/stake" ? ActiveStaking : Staking}
              alt="Menu"
              width={23}
              height={30}
            />
            <p
              className={`text-[10px] text-white/60 ${
                router.pathname === "/stake"
                  ? "text-[#8033D7]"
                  : "text-white/60"
              } mt-1.5`}
            >
              Staking
            </p>
          </li>
        </Link>
        <Link
          href="/leaderboard"
          className="flex flex-col items-center justify-center border-r border-white/10 w-1/5"
        >
          <li
            className={`${
              router.pathname === "/leaderboard" ? "bg-[#1E2024]" : ""
            } hover:bg-[#1E2024] flex flex-col items-center rounded-md px-2 pt-1.5 pb-1`}
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
              Leaderboard
            </p>
          </li>
        </Link>
        <Link
          href="/store"
          className="flex flex-col items-center justify-center border-r border-white/10 w-1/5"
        >
          <li
            className={`${
              router.pathname === "/store" ? "bg-[#1E2024]" : ""
            } hover:bg-[#1E2024] flex flex-col items-center rounded-md px-4 pt-1.5 pb-1`}
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
              Store
            </p>
          </li>
        </Link>
        <Link
          href="/"
          className="flex flex-col items-center justify-center w-1/5"
        >
          <li
            className={`${
              router.pathname === "/" ? "bg-[#1E2024]" : ""
            } hover:bg-[#1E2024] flex flex-col items-center rounded-md px-3 pt-1.5 pb-1`}
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
              Dashboard
            </p>
          </li>
        </Link>
      </ul>
    </div>
  );
}
