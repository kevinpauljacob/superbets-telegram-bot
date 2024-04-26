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
import StoreBanner from "@/components/Banner";
import FomoExit from "@/components/FomoExit";
import FomoPlay from "@/components/FomoPlay";
import FomoSupply from "@/components/FomoSupply";
import Footer from "@/components/Footer";


const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const wallet = useWallet();
  const { getBalance } = useGlobalContext();

  const maintenance = false;

  const { language, setLanguage, userData, setUserData } = useGlobalContext();

  const [refetch, setRefetch] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (wallet?.publicKey) {
      getBalance();
    }
  }, [wallet?.publicKey]);

  useEffect(() => {
    //@ts-ignore
    setLanguage(localStorage.getItem("language") ?? "en");
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  return (
    <>
      <div className="flex flex-col lg:flex-row text-white w-full overflow-hidden min-h-screen relative overflow-x-hidden p-4 xl:p-6">
        <div className="flex flex-1 flex-col md:px-[2.5%]">
          <div className="">
            <StoreBanner />
          </div>
          <div className="mb-7">
            <FomoPlay />
          </div>
          <div className="mb-7">
            <FomoExit />
          </div>
        </div>
        {/* <div className="lg:ml-4">
        <FomoSupply />
      </div> */}
      </div>
      <div className="w-full">
        <Footer />
      </div>
    </>
  );
}
