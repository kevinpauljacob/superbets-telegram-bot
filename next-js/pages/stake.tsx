import { Header } from "@/components/Header";
import InfoBar from "@/components/Infobar";
import StakeFomo from "@/components/StakeFomo";
import StakeStats from "@/components/StakeStats";
import Image from "next/legacy/image";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  connection,
  fomoToken,
  formatNumber,
  translator,
} from "@/context/transactions";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useGlobalContext } from "@/components/GlobalContext";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { errorCustom } from "@/components/toasts/ToastGroup";

export default function Stake() {
  const { data: session, status } = useSession();
  const wallet = useWallet();

  const {
    userData,
    setUserData,
    solBal,
    setSolBal,
    language,
    loading,
    globalInfo,
    setGlobalInfo,
    getGlobalInfo,
    getUserDetails,
    setLivePrice,
  } = useGlobalContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        let data = await fetch(
          "https://hermes.pyth.network/api/latest_price_feeds?ids%5B%5D=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
        ).then((res) => res.json());
        let price = data[0].price.price * Math.pow(10, data[0].price.expo);
        console.log(price);
        setLivePrice(price);
      } catch (e) {
        errorCustom("Could not fetch live price.");
        setLivePrice(0);
      }
    };
    fetchData();

    const intervalId = setInterval(fetchData, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const getWalletBalance = async () => {
    if (wallet && wallet.publicKey)
      try {
        let address = new PublicKey(fomoToken);
        const ata = getAssociatedTokenAddressSync(address, wallet.publicKey);
        const res = await connection.getTokenAccountBalance(ata, "recent");

        res.value.uiAmount ? setSolBal(res.value.uiAmount) : setSolBal(0);
      } catch (e) {
        errorCustom("Unable to fetch balance.");
        console.error(e);
      }
  };

  useEffect(() => {
    if (session?.user && wallet && wallet.publicKey) {
      getWalletBalance();
      getUserDetails();
    }
    getGlobalInfo();
  }, [session?.user, wallet.publicKey]);

  return (
    <div className="flex flex-col items-center w-full overflow-hidden min-h-screen flex-1 relative font-chakra h-full">
      <div className="w-full flex flex-1 flex-col items-start gap-5 px-5 sm:px-10 lg:px-40 pb-10">
        <span className="text-white text-opacity-90 font-semibold text-[1.5rem] sm:text-[2rem] mt-[1rem] sm:mt-[2rem] flex items-center justify-center gap-x-2">
          {translator("Stake", language).toUpperCase()}
        </span>

        <div className="flex flex-col sm:flex-row items-start gap-5 w-full">
          <div className="flex w-full basis-full sm:basis-2/3">
            <StakeStats />
          </div>
          <div className="flex w-full basis-full sm:basis-1/3 ">
            <StakeFomo />
          </div>
        </div>

        {/* Global staking  */}
        <span className="text-white text-opacity-50 text-base mt-5 sm:mt-10 font-sans">
          {translator("Global Staking Overview", language)}
        </span>
        <div className="flex w-full sm:w-[64.8%] font-sans">
          <div className="w-full sm:w-[50%] relative p-3 sm:p-5 flex items-center justify-between gap-10 bg-staking-bg bg-opacity-75 -mt-2">
            <div className="flex w-full sm:w-fit flex-col items-start gap-4 just">
              <span className="text-white text-opacity-50 text-xs sm:text-sm">
                {translator("Total FOMO Staked", language)}
              </span>
              <div className="flex w-full mt-3 sm:mt-0 justify-end sm:justify-start items-end gap-2 font-chakra">
                <span className="text-white text-opacity-80 text-2xl sm:text-2xl font-semibold">
                  {formatNumber(globalInfo?.stakedTotal)} $FOMO
                </span>
                <span className="text-staking-secondary text-opacity-80 text-base sm:text-base font-semibold">
                  (
                  {formatNumber(
                    (globalInfo?.stakedTotal / globalInfo?.totalVolume) * 100,
                  )}
                  % )
                </span>
              </div>
            </div>
            <Image src={"/assets/stakeLock.svg"} width={60} height={60} />
          </div>
        </div>
      </div>
    </div>
  );
}
