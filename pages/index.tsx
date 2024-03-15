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
import Sidebar from "@/components/OldSidebar";
import StoreBanner from "@/components/StoreBanner";
import FomoExit from "@/components/FomoExit";
import FomoPlay from "@/components/FomoPlay";
import FomoSupply from "@/components/FomoSupply";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const wallet = useWallet();

  const maintenance = false;

  const { language, setLanguage, userData, setUserData } = useGlobalContext();

  const [refetch, setRefetch] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {}, [wallet?.publicKey, refetch]);

  useEffect(() => {
    //@ts-ignore
    setLanguage(localStorage.getItem("language") ?? "en");
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  return (
    <div className="flex text-white w-full overflow-hidden min-h-screen flex-1  relative overflow-x-hidden p-6">
      <div>
        <div className="mb-7">
          <StoreBanner />
        </div>
        <div className="mb-7">
          <FomoExit />
        </div>
        <div className="mb-7">
          <FomoPlay />
        </div>
      </div>
      <div className="ml-4">
        <FomoSupply />
      </div>
    </div>
  );
}
