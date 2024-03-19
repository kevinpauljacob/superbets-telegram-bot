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

  const cardDetails = [
    { src: "image1.jpg", name: "Product 1", points: "100" },
    { src: "image2.jpg", name: "Product 2", points: "200" },
    { src: "image3.jpg", name: "Product 3", points: "300" },
    { src: "image4.jpg", name: "Product 4", points: "400" },
    { src: "image5.jpg", name: "Product 5", points: "500" },
    { src: "image6.jpg", name: "Product 6", points: "600" },
  ];

  return (
    <div className="text-white w-full flex flex-col items-start justify-center p-5 sm:p-5 bg-black pb-10 overflow-hidden min-h-screen">
      <div className="mb-7 w-full">
        <StoreBanner />
      </div>
      <div className="grid 2xl:grid-cols-5 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5 mx-auto">
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
  );
}
