import { useContext, useState } from "react";
import { useGlobalContext } from "./GlobalContext";
import { stakeFOMO, unstakeFOMO } from "@/context/transactions";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import Spinner from "./Spinner";

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
  } = useGlobalContext();

  const handleRequest = async () => {
    setLoading(true);
    let response: { success: boolean; message: string };
    try {
      if (stake)
        response = await stakeFOMO(
          wallet,
          amount,
          "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw",
        );
      else
        response = await unstakeFOMO(
          wallet,
          amount,
          "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw",
        );

      if (response && response.success) toast.success(response.message);
      else toast.error(response.message);
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
        Stake FOMO
      </span>
      <div className="flex w-full items-center border-b border-white border-opacity-10">
        <button
          className={`${
            stake
              ? "text-[#9945FF] border-[#9945FF]"
              : "text-[#ffffff80] border-transparent"
          } p-4 border-b-2 text-base font-medium transition-all`}
          onClick={() => {
            setStake(true);
          }}
        >
          Stake
        </button>
        <button
          className={`${
            !stake
              ? "text-[#9945FF] border-[#9945FF]"
              : "text-[#ffffff80] border-transparent"
          } p-4 border-b-2 text-base font-medium transition-all`}
          onClick={() => {
            setStake(false);
          }}
        >
          Unstake
        </button>
      </div>

      <span className="text-white text-opacity-90 text-sm mt-4">
        {stake ? "Deposit FOMO" : "Withdraw FOMO"}
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
        Available {stake ? solBal : userData?.stakedAmount ?? 0} $SOL
      </span>

      <button
        onClick={() => {
          handleRequest();
        }}
        disabled={loading}
        className="w-full p-1.5 mt-4 bg-[#9945FF] text-white text-xl font-semibold rounded-[5px]"
      >
        {loading && <Spinner />}
        {stake ? "Stake" : "Unstake"}
      </button>
    </div>
  );
}
