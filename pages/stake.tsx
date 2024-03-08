import { Header } from "@/components/Header";
import InfoBar from "@/components/Infobar";
import StakeFomo from "@/components/StakeFomo";
import StakeStats from "@/components/StakeStats";
import Image from "next/legacy/image";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { connection, formatNumber, translator } from "@/context/transactions";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useGlobalContext } from "@/components/GlobalContext";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

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
    let intervalId = setInterval(async () => {
      try {
        let data = await fetch(
          "https://hermes.pyth.network/api/latest_price_feeds?ids%5B%5D=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
        ).then((res) => res.json());
        let price = data[0].price.price * Math.pow(10, data[0].price.expo);
        console.log(price);
        setLivePrice(price);
      } catch (e) {
        toast.error("Could not fetch live price.");
        setLivePrice(0);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const getWalletBalance = async () => {
    if (wallet && wallet.publicKey)
      try {
        let address = new PublicKey(
          "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw",
        );
        const ata = getAssociatedTokenAddressSync(address, wallet.publicKey);
        const res = await connection.getTokenAccountBalance(ata, "recent");
        // console.log("balance : ", res.value.uiAmount ?? 0);

        res.value.uiAmount ? setSolBal(res.value.uiAmount) : setSolBal(0);
      } catch (e) {
        toast.error("Unable to fetch balance.");
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
    <div className="flex flex-col items-center w-full overflow-hidden min-h-screen flex-1 bg-[#2B0A31] relative">
      <Header />
      <div className="w-full flex flex-1 flex-col items-start gap-5 px-5 sm:px-10 lg:px-40 2xl:px-[15%] bg-black pb-10">
        <span className="text-white text-opacity-90 font-semibold text-[1.5rem] sm:text-[2rem] mt-[4rem]">
          {/* {translator("You have", language)}{" "} */}
          {/* <span className="text-[#9945FF]">{solBal.toFixed(3)} FOMO</span>{" "} */}
          {/* {translator("available in your wallet to stake", language)} */}
          {translator("Stake your", language)}
          <span className="text-[#9945FF]"> FOMO </span>
          {translator("to boost your leaderboard points and more.", language)}
        </span>

        {/* <span className="text-white text-opacity-50 text-base font-medium">
          {translator(
            "Sake your FOMO tokens to receive multipliers for your points which gets you amazing rewards from our store.",
            language,
          )}
        </span> */}

        <div className="flex flex-col sm:flex-row items-start gap-5 w-full">
          <div className="flex w-full basis-full sm:basis-2/3">
            <StakeStats />
          </div>
          <div className="flex w-full basis-full sm:basis-1/3 sm:pt-8 ">
            <StakeFomo />
          </div>
        </div>

        {/* Global staking  */}
        <span className="text-white text-opacity-50 text-xl mt-5 sm:mt-10">
          {translator("Global Staking Overview", language)}
        </span>
        <div className="flex w-full sm:w-[64.8%]">
          <div className="w-full sm:w-[50%] relative p-3 sm:p-5 flex items-center gap-10 bg-[#19161C] bg-opacity-75 -mt-1">
            <div className="flex w-full sm:w-fit flex-col items-start gap-2">
              <span className="text-white text-opacity-50 text-xs sm:text-base">
                {translator("Total FOMO Staked", language)}
              </span>
              <div className="flex w-full mt-3 sm:mt-0 justify-end sm:justify-start items-end gap-2">
                <span className="text-white text-opacity-80 text-xl sm:text-2xl font-semibold">
                  {formatNumber(globalInfo?.stakedTotal)} FOMO
                </span>
                {/* <span className="text-[#9945FF] text-base font-semibold text-opacity-90">
                  (0.0%)
                </span> */}
              </div>
            </div>
            {/* <div className="absolute sm:relative top-2 sm:top-auto right-3 sm:right-auto w-[9rem] h-[1.5rem] sm:h-[2rem]">
              <Image
                src={"/assets/graphtotal.png"}
                layout="fill"
                objectFit="contain"
                objectPosition="center"
                className="flex sm:hidden"
                alt={"FOMO"}
              />
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
