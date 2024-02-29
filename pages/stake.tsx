import { Header } from "@/components/Header";
import InfoBar from "@/components/Infobar";
import StakeFomo from "@/components/StakeFomo";
import StakeStats from "@/components/StakeStats";
import Image from "next/legacy/image";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { connection } from "@/context/transactions";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useGlobalContext } from "@/components/GlobalContext";

export default function Stake() {
  const { data: session, status } = useSession();
  const wallet = useWallet();
  const [totalStaked, setTotalStaked] = useState<number>(0.0);

  const { userData, setUserData, solBal, setSolBal } = useGlobalContext();

  const getWalletBalance = async () => {
    if (wallet && wallet.publicKey)
      try {
        
      } catch (e) {
        toast.error("Unable to fetch balance.");
        console.error(e);
      }
  };

  const getUserDetails = async () => {
    if (wallet && wallet.publicKey)
      try {
        let info =
          (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL;
        console.log("Balance:", info);
        setSolBal(
          (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL,
        );
      } catch (e) {
        toast.error("Unable to fetch balance.");
        console.error(e);
      }
  };

  useEffect(() => {
    if (session?.user) {
      getWalletBalance();
      getUserDetails();
    }
  }, [session?.user]);

  return (
    <div className="flex flex-col items-center w-full min-h-screen flex-1 bg-[#2B0A31] relative overflow-x-hidden">
      <InfoBar />
      <Header />
      {/* Navbar  */}
      <div className="w-full flex flex-1 flex-col items-start gap-5 px-5 sm:px-10 lg:px-40 2xl:px-[15%] bg-black pb-10">
        <span className="text-white text-opacity-90 font-semibold text-[2.5rem] mt-[4rem]">
          You have <span className="text-[#9945FF]">{solBal} $FOMO</span>{" "}
          available in your wallet to stake
        </span>

        <span className="text-white text-opacity-50 text-base font-medium">
          Sake your FOMO tokens to receive multipliers for your points which
          gets you amazing rewards from our store
        </span>

        <div className="flex sm:hidden w-full">
          <StakeFomo />
        </div>

        {/* Global staking  */}
        <span className="text-white text-opacity-50 text-xl mt-10">
          Global staking Overview
        </span>
        <div className="relative p-5 flex w-full sm:w-fit items-center gap-10 bg-[#19161C] bg-opacity-75 -mt-1">
          <div className="flex flex-col items-start gap-2">
            <span className="text-white text-opacity-50 text-base">
              Total FOMO staked
            </span>
            <div className="flex items-end gap-2">
              <span className="text-white text-opacity-80 text-2xl font-semibold">
                {totalStaked} $FOMO
              </span>
              <span className="text-[#9945FF] text-base font-semibold text-opacity-90">
                (22.5%)
              </span>
            </div>
          </div>
          <div className="absolute sm:static top-5 right-5">
            <Image
              src={"/assets/graphtotal.png"}
              width={145}
              height={30}
              className="flex sm:hidden"
              alt={"FOMO"}
            />
          </div>
        </div>

        <div className="flex items-start gap-5 flex-1 w-full">
          <div className="flex basis-full sm:basis-2/3 min-h-[2rem]">
            <StakeStats />
          </div>
          <div className="hidden sm:flex basis-1/3">
            <StakeFomo />
          </div>
        </div>
      </div>
    </div>
  );
}
