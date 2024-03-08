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
import InfoBar from "@/components/Infobar";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const wallet = useWallet();

  const maintenance = false;

  const { language, setLanguage, userData, setUserData } = useGlobalContext();

  const [refetch, setRefetch] = useState(true);

  useEffect(() => {}, [wallet?.publicKey, refetch]);

  useEffect(() => {
    //@ts-ignore
    setLanguage(localStorage.getItem("language") ?? "en");
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  return (
    <div className="flex flex-col items-center w-full overflow-hidden min-h-screen flex-1 bg-[#2B0A31] relative overflow-x-hidden">
      <Header />
      <div className="flex flex-1 w-full bg-black" />
    </div>
  );
}
