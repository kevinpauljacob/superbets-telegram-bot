import { useContext, useState } from "react";
import { useGlobalContext } from "./GlobalContext";
import {
  connection,
  formatNumber,
  stakeFOMO,
  translator,
  unstakeFOMO,
} from "@/context/transactions";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import Spinner from "./Spinner";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useSession } from "next-auth/react";

export default function StakeFomo() {
  const { data: session, status } = useSession();
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
    setGlobalInfo,
    getUserDetails,
    getGlobalInfo,
  } = useGlobalContext();

  const handleRequest = async () => {
    setLoading(true);
    let response: { success: boolean; message: string };
    try {
      if (stake) {
        if (amount > solBal) {
          toast.error(translator("Insufficient FOMO", language));
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
          toast.error(translator("Insufficient FOMO", language));
          setLoading(false);
          return;
        }
        response = await unstakeFOMO(
          wallet,
          amount,
          "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw",
        );
      }
      // console.log(response);
      if (response && response.success) {
        if (stake) setSolBal(solBal - amount);
        else setSolBal(solBal + amount);
      }
      getUserDetails();
      getGlobalInfo();
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
        value={amount}
        onChange={(e) => {
          parseFloat(e.target.value) >= 0 &&
            setAmount(parseFloat(e.target.value));
        }}
      />

      <span className="text-[#B1B1B1] text-sm">
        {translator("Available", language)}{" "}
        <span
          onClick={() => {
            stake ? setAmount(solBal) : setAmount(userData?.stakedAmount ?? 0);
          }}
          className="text-sm font-bold cursor-pointer text-[#B1B1B1] hover:text-opacity-100 text-opacity-50 transition-all"
        >
          {formatNumber(stake ? solBal : userData?.stakedAmount ?? 0)} FOMO
        </span>
      </span>

      <button
        onClick={() => {
          handleRequest();
        }}
        disabled={loading || !session?.user}
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
