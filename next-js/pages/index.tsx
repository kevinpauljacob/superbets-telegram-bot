import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Solana } from "iconsax-react";
import { useEffect, useState } from "react";
import Image from "next/legacy/image";

import {
  obfuscatePubKey,
  connection,
  translator,
  User,
} from "@/context/transactions";
import {
  getAllDomains,
  getFavoriteDomain,
  reverseLookup,
} from "@bonfida/spl-name-service";
import { useWallet } from "@solana/wallet-adapter-react";
import { translationsMap, useGlobalContext } from "@/components/GlobalContext";
import StoreBanner from "@/components/Banner";
import FomoExit from "@/components/FomoExit";
import FomoPlay from "@/components/FomoPlay";
import FomoSupply from "@/components/FomoSupply";
import FOMOHead from "@/components/HeadElement";
import Bets from "@/components/games/Bets";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const wallet = useWallet();
  const { getBalance } = useGlobalContext();

  const maintenance = false;

  const { language, setLanguage, userData, setUserData, showWalletModal } =
    useGlobalContext();

  const [refetch, setRefetch] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (wallet?.publicKey && !showWalletModal) {
      getBalance();
    }
  }, [wallet?.publicKey, showWalletModal]);

  useEffect(() => {
    //@ts-ignore
    setLanguage(localStorage.getItem("language") ?? "en");
  }, []);

  /* useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]); 
 */
  return (
    <>
      <FOMOHead title={"Home | FOMO.wtf - 0% House Edge, Pure Wins"} />
      <div className="flex flex-col lg:flex-row text-white w-full overflow-hidden relative overflow-x-hidden px-4 xl:px-6">
        <div className="flex flex-1 flex-col md:px-[2.5%]">
          <div className="">
            <StoreBanner />
          </div>
          <div className="mb-7">
            <FomoPlay />
          </div>
          {/* <div className="mb-7">
            <FomoExit />
          </div> */}
          <div className="mb-5">
            <Bets refresh={true} />
          </div>
        </div>
        {/* <div className="lg:ml-4">
        <FomoSupply />
      </div> */}
      </div>
    </>
  );
}
