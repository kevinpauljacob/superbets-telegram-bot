import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { connection, formatNumber, translator } from "@/context/transactions";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useGlobalContext } from "@/components/GlobalContext";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import StoreBanner from "@/components/Banner";
import StoreCard from "@/components/StoreCard";
import { errorCustom } from "@/components/toasts/ToastGroup";
import FOMOHead from "@/components/HeadElement";

export default function Store() {
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

  const cardDetails = [
    { src: "image1.jpg", name: "Product 1", points: "500,000" },
    { src: "image2.jpg", name: "Product 2", points: "750,000" },
    { src: "image3.jpg", name: "Product 3", points: "1,000,000" },
  ];

  return (
    <>
      <FOMOHead title={"Store | FOMO.wtf - 0% House Edge, Pure Wins"} />
      <div className="text-white w-full flex flex-col items-start justify-start px-5 lg:px-16 pb-10 overflow-hidden min-h-screen">
        <span className="font-bold text-white text-opacity-90 font-chakra text-[1.75rem] mb-6">
          FOMO STORE
        </span>
        <div className="grid 2xl:grid-cols-5 xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-3 grid-cols-2 gap-4 xl:gap-4 w-full sm:w-[85%]">
          {cardDetails.map((card, index) => (
            <StoreCard
              key={index}
              src={card.src}
              name={card.name}
              points={card.points}
            />
          ))}
        </div>
      </div>
    </>
  );
}
