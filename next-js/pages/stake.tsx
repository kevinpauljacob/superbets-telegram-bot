import StakeFomo from "@/components/StakeFomo";
import StakeStats from "@/components/StakeStats";
import Image from "next/legacy/image";
import { useEffect, useState } from "react";
import { WalletContextState, useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { connection, translator, truncateNumber } from "@/context/transactions";
import { PublicKey } from "@solana/web3.js";
import { useGlobalContext } from "@/components/GlobalContext";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import FOMOHead from "@/components/HeadElement";
import { SPL_TOKENS } from "@/context/config";

export async function getFOMOBalance(
  wallet: WalletContextState,
  setFomoBalance: any,
) {
  if (wallet && wallet.publicKey)
    try {
      const fomoToken = SPL_TOKENS.find(
        (token) => token.tokenName === "FOMO",
      )?.tokenMint!;
      let address = new PublicKey(fomoToken);
      const ata = getAssociatedTokenAddressSync(address, wallet.publicKey);
      const res = await connection.getTokenAccountBalance(ata, "recent");

      res.value.uiAmount
        ? setFomoBalance(res.value.uiAmount)
        : setFomoBalance(0);
    } catch (e) {
      // errorCustom("Unable to fetch balance.");
      console.error(e);
    }
}

export default function Stake() {
  const { data: session } = useSession();
  const wallet = useWallet();

  const {
    setFomoBalance,
    language,
    globalInfo,
    getGlobalInfo,
    getUserDetails,
    setLivePrice,
    sidebar,
  } = useGlobalContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        let data = await fetch(
          "https://hermes.pyth.network/api/latest_price_feeds?ids%5B%5D=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
        ).then((res) => res.json());
        let price = data[0].price.price * Math.pow(10, data[0].price.expo);
        // console.log(price);
        setLivePrice(price);
      } catch (e) {
        // errorCustom("Could not fetch live price.");
        setLivePrice(0);
      }
    };
    fetchData();

    const intervalId = setInterval(fetchData, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // useEffect(() => {
  //   if (session?.user && wallet && wallet.publicKey) {
  //     getFOMOBalance(wallet, setFomoBalance);
  //     getUserDetails();
  //   }
  //   getGlobalInfo();
  // }, [session?.user, wallet.publicKey]);

  return <></>

  return (
    <>
      <FOMOHead title={"Stake | SUPERBETS.GAMES - 0% House Edge, Pure Wins"} />
      <div
        className={`flex flex-col ${
          sidebar ? "items-start sm:pl-14" : "items-center"
        } w-full min-h-screen flex-1 relative font-chakra h-fit`}
      >
        <div className="w-full flex flex-1 flex-col items-start gap-5 pb-1- px-3 sm:max-w-[90%]">
          <span className="text-white text-opacity-90 font-semibold text-[1.5rem] sm:text-[2rem] tracking-[.02em] mt-[1rem] flex items-center justify-center gap-x-2">
            {translator("Stake", language).toUpperCase()} FOMO
          </span>

          <div className="flex flex-col-reverse sm:flex-row items-start gap-5 w-full">
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
          <div className="flex w-full md:w-fit font-sans">
            <div className="w-full relative p-3 sm:p-5 flex items-center justify-between gap-28 lg:gap-[13rem] bg-staking-bg bg-opacity-75 -mt-2">
              <div className="flex w-full sm:w-fit flex-col items-start gap-4 just">
                <span className="text-white text-opacity-50 text-xs sm:text-sm">
                  {translator("Total FOMO Staked", language)}
                </span>
                <div className="flex w-full mt-3 sm:mt-0 justify-end sm:justify-start items-end gap-2 font-chakra">
                  <span className="flex items-center gap-1 text-white text-opacity-80 text-2xl sm:text-2xl font-semibold">
                    {truncateNumber(globalInfo?.stakedTotal)}{" "}
                    <span className="hidden sm:block">$FOMO</span>
                  </span>
                  {/* <span
                    className={`hidden sm:block text-staking-secondary text-opacity-80 text-base sm:text-base ${inter.className} font-semibold`}
                  >
                    (
                    {formatNumber(
                      (globalInfo?.stakedTotal / globalInfo?.totalVolume) * 100,
                    )}
                    % )
                  </span> */}
                </div>
              </div>
              <div className="hidden sm:flex">
                <Image
                  src={"/assets/stakeLock.svg"}
                  alt="Lock"
                  width={60}
                  height={60}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
