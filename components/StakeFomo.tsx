import { useContext, useState } from "react";
import { useGlobalContext } from "./GlobalContext";
import {
  connection,
  stakeFOMO,
  translator,
  unstakeFOMO,
} from "@/context/transactions";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import Spinner from "./Spinner";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export default function StakeFomo() {
  const wallet = useWallet();
  const {
    stake,
    setStake,
    amount,
    setAmount,
    solBal,
    userData,
    loading,
    setLoading,
    language,
    setUserData,
    setSolBal,
  } = useGlobalContext();

  const getWalletBalance = async () => {
    if (wallet && wallet.publicKey)
      try {
        let address = new PublicKey(
          "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw",
        );
        const ata = getAssociatedTokenAddressSync(address, wallet.publicKey);
        const res = await connection.getTokenAccountBalance(ata);
        console.log("balance : ", res.value.uiAmount);

        setSolBal(res.value.uiAmount ?? 0);
      } catch (e) {
        toast.error("Unable to fetch balance.");
        console.error(e);
      }
  };

  const getUserDetails = async () => {
    if (wallet && wallet.publicKey)
      try {
        const res = await fetch("/api/getInfo", {
          method: "POST",
          body: JSON.stringify({
            option: 1,
            wallet: wallet.publicKey,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        const { success, message, user } = await res.json();
        console.log("User: ", user);
        if (success) setUserData(user);
        else toast.error(message);
        if (stake) setSolBal(solBal - amount);
        else setSolBal(solBal + amount);
        getWalletBalance();
      } catch (e) {
        toast.error("Unable to fetch balance.");
        console.error(e);
      }
  };

  const handleRequest = async () => {
    setLoading(true);
    let response: { success: boolean; message: string };
    try {
      if (stake) {
        if (amount > solBal) {
          toast.error(translator("Insufficient $FOMO", language));
          setLoading(false);
          return;
        }
        response = await stakeFOMO(
          wallet,
          amount,
          "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw",
        );
      } else {
        if (amount > (userData?.stakedAmount ?? 0)) {
          toast.error(translator("Insufficient $FOMO", language));
          setLoading(false);
          return;
        }
        response = await unstakeFOMO(
          wallet,
          amount,
          "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw",
        );
      }
      console.log(response);
      await getUserDetails();
      // if (response && response.success) toast.success(response.message);
      // else toast.error(response.message);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.error(e);
      toast.error("Something went wrong, please try again");
    }
  };

  return (
    <div className="w-full p-4 flex flex-col items-start gap-2 bg-[#19161C] bg-opacity-50 rounded-xl">
      <span className="text-white text-opacity-90 font-semibold text-xl">
        {translator("Stake", language)} FOMO
      </span>
      <div className="flex w-full items-center border-b border-white border-opacity-10">
        <button
          className={`${
            stake
              ? "text-[#9945FF] border-[#9945FF]"
              : "text-[#ffffff80] border-transparent hover:text-[#ffffffb5]"
          } p-4 border-b-2 text-base font-medium transition-all`}
          onClick={() => {
            setStake(true);
          }}
        >
          {translator("Stake", language)}
        </button>
        <button
          className={`${
            !stake
              ? "text-[#9945FF] border-[#9945FF]"
              : "text-[#ffffff80] border-transparent hover:text-[#ffffffb5]"
          } p-4 border-b-2 text-base font-medium transition-all`}
          onClick={() => {
            setStake(false);
          }}
        >
          {translator("Unstake", language)}
        </button>
      </div>

      <span className="text-white text-opacity-90 text-sm mt-4">
        {stake
          ? translator("Deposit FOMO", language)
          : translator("Withdraw FOMO", language)}
      </span>

      <input
        className="bg-[#1A1A1A] w-full outline-none py-1 px-2 rounded-[5px] text-[#94A3B8]"
        min={0}
        onChange={(e) => {
          parseFloat(e.target.value) >= 0 &&
            setAmount(parseFloat(e.target.value));
        }}
      />

      <span className="text-[#B1B1B1] text-sm">
        {translator("Available", language)}{" "}
        {stake ? solBal.toFixed(3) : userData?.stakedAmount ?? 0} $FOMO
      </span>

      <button
        onClick={() => {
          handleRequest();
        }}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1 p-1.5 mt-4 bg-[#9945FF] hover:bg-opacity-50 disabled:bg-opacity-20 transition-all text-white text-xl font-semibold rounded-[5px]"
      >
        {loading && <Spinner />}
        {stake
          ? translator("Stake", language)
          : translator("Unstake", language)}
      </button>
    </div>
  );
}
