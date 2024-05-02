import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useWallet } from "@solana/wallet-adapter-react";
import { obfuscatePubKey } from "@/context/transactions";
import {
  Game,
  OpenSidebar,
  SidebarOpenElement,
  ToggleGameToken,
} from "./Sidebar";
import FomoExitIcon from "@/public/assets/FomoExitIcon";
import FomoPlayIcon from "@/public/assets/FomoPlayIcon";
import Dollar from "@/public/assets/Dollar";
import Flag from "@/public/assets/Flag";
import Fomo from "@/public/assets/Fomo";
import Twitter from "@/public/assets/Twitter";
import Birdeye from "@/public/assets/Birdeye";
import Telegram from "@/public/assets/Telegram";
import Home from "@/public/assets/Home";
import { useGlobalContext } from "./GlobalContext";
import { useRouter } from "next/router";

export default function Sidebar({
  mobileSidebar,
  setSidebar,
}: {
  mobileSidebar: boolean;
  setSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();

  const [showExitTokens, setShowExitTokens] = useState(false);
  const [showPlayTokens, setShowPlayTokens] = useState(false);

  useEffect(() => {
    setSidebar(false);
  }, [router.pathname]);

  return (
    <div
      className={`${
        mobileSidebar ? "fadeIn fixed" : "fadeOutDown hidden"
      } top-[6.6rem] z-20 md:hidden bg-[#121418] no-scrollbar overflow-y-auto text-white flex flex-col justify-between w-full h-[calc(100vh-11rem)]`}
    >
      <OpenSidebar
        showExitTokens={showExitTokens}
        setShowExitTokens={setShowExitTokens}
        showPlayTokens={showPlayTokens}
        setShowPlayTokens={setShowPlayTokens}
      />
    </div>
  );
}
