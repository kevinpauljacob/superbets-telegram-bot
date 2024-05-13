import { useContext, useState } from "react";
import { useGlobalContext } from "./GlobalContext";
import {
  connection,
  fomoToken,
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
import { errorCustom } from "./toasts/ToastGroup";

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

  const getWalletBalance = async () => {
    if (wallet && wallet.publicKey)
      try {
        let address = new PublicKey(fomoToken);
        const ata = getAssociatedTokenAddressSync(address, wallet.publicKey);
        const res = await connection.getTokenAccountBalance(ata, "recent");
        // console.log("balance : ", res.value.uiAmount ?? 0);

        res.value.uiAmount ? setSolBal(res.value.uiAmount) : setSolBal(0);
      } catch (e) {
        errorCustom("Unable to fetch balance.");
        console.error(e);
      }
  };

  const handleRequest = async () => {
    setLoading(true);
    let response: { success: boolean; message: string };
    try {
      if (stake) {
        if (amount > solBal) {
          errorCustom(translator("Insufficient FOMO", language));
          setLoading(false);
          return;
        }
        response = await stakeFOMO(wallet, amount, fomoToken);
      } else {
        if (amount > (userData?.stakedAmount ?? 0)) {
          errorCustom(translator("Insufficient FOMO", language));
          setLoading(false);
          return;
        }
        response = await unstakeFOMO(wallet, amount, fomoToken);
      }
      // console.log(response);
      if (response && response.success) await getWalletBalance();

      getUserDetails();
      getGlobalInfo();
      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.error(e);
      errorCustom("Something went wrong, please try again");
    }
  };

  const handleHalfStake = () => {
    if (solBal > 0) {
      setAmount(solBal / 2);
    }
  };

  const handleDoubleStake = () => {
    if (solBal > 0) {
      setAmount(solBal * 2);
    }
  };

  const handleSetMaxStake = () => {
    stake ? setAmount(solBal) : setAmount(userData?.stakedAmount ?? 0);
  };

  return (
    <div className="w-full p-4 flex flex-col items-start gap-2 bg-staking-bg rounded-xl">
      <span className="text-white text-opacity-90 font-semibold text-xl">
        {translator("Stake", language)} FOMO
      </span>
      <div className="flex w-full items-center border-b border-white border-opacity-10">
        <button
          className={`${
            stake
              ? "text-white border-[#9945FF]"
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
              ? "text-white border-[#9945FF]"
              : "text-[#ffffff80] border-transparent hover:text-[#ffffffb5]"
          } p-4 border-b-2 text-base font-medium transition-all`}
          onClick={() => {
            setStake(false);
          }}
        >
          {translator("Unstake", language)}
        </button>
      </div>

      <p className="text-white text-opacity-90 text-sm mt-4 font-changa flex justify-between w-full">
        {stake
          ? translator("Deposit FOMO", language)
          : translator("Withdraw FOMO", language)}
        <span
          onClick={() => {
            stake ? setAmount(solBal) : setAmount(userData?.stakedAmount ?? 0);
          }}
          className="text-sm cursor-pointer font-medium font-changa text-[#94A3B8] text-opacity-90 transition-all"
        >
          {formatNumber(stake ? solBal : userData?.stakedAmount ?? 0)} $FOMO
        </span>
      </p>

      <div
        className={`relative group flex mt-1 h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
      >
        <input
          id={"stake-amount-input"}
          type={"number"}
          step={"any"}
          autoComplete="off"
          onChange={(e) => {
            parseFloat(e.target.value) >= 0 &&
              setAmount(parseFloat(e.target.value));
          }}
          placeholder={"0.0"}
          value={amount}
          lang="en"
          className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra placeholder-opacity-40 outline-none disabled:cursor-default disabled:opacity-50`}
        />
        <button
          type="button"
          className="text-xs font-medium text-white text-opacity-50 disabled:cursor-default disabled:opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={() => {
            handleHalfStake();
          }}
        >
          1/2
        </button>
        <button
          type="button"
          className="text-xs mx-2 font-medium text-white text-opacity-50 disabled:cursor-default disabled:opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={() => {
            handleDoubleStake();
          }}
        >
          2x
        </button>
        <button
          type="button"
          className="text-xs font-medium text-white text-opacity-50 disabled:cursor-default disabled:opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all hover:duration-75 rounded-[5px] py-1.5 px-4"
          onClick={() => {
            handleSetMaxStake();
          }}
        >
          Max
        </button>
      </div>

      <button
        onClick={() => {
          handleRequest();
        }}
        disabled={loading || !session?.user}
        className="w-full flex items-center justify-center gap-1 p-1.5 mt-4 bg-[#9945FF] hover:bg-opacity-50 disabled:bg-opacity-20 transition-all text-white text-xl font-semibold rounded-[5px]"
      >
        {loading && <Spinner />}
        {stake
          ? translator("STAKE", language)
          : translator("UNSTAKE", language)}
      </button>
    </div>
  );
}
