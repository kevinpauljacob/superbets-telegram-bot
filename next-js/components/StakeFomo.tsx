import { useContext, useEffect, useState } from "react";
import { useGlobalContext } from "./GlobalContext";
import {
  connection,
  fomoToken,
  stakeFOMO,
  translator,
  unstakeFOMO,
} from "@/context/transactions";
import { truncateNumber } from "@/context/gameTransactions";
import { useWallet } from "@solana/wallet-adapter-react";
import Spinner from "./Spinner";
import { Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";

import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";


import { useSession } from "next-auth/react";
import { errorCustom } from "./toasts/ToastGroup";
import { getFOMOBalance } from "@/pages/stake";

const MinAmount = 0.01;
interface TokenAccount {
  mint: string;
  balance: number;
}
export default function StakeFomo() {
  const { data: session } = useSession();
  const wallet = useWallet();
  const {
    stake,
    setStake,
    stakeAmount,
    setStakeAmount,
    fomoBalance,
    userData,
    loading,
    setLoading,
    language,
  
    setUserData,
    setFomoBalance,
    setGlobalInfo,
    getUserDetails,
    getGlobalInfo,
  
  } = useGlobalContext();

  const MinAmount = 0.01;// can change this value to the minimum ammount to stake

  
 
  const handleRequest = async () => {
    setLoading(true);
    let response: { success: boolean; message: string };
    try {
      if (stake) {
        if (stakeAmount > fomoBalance) {
          errorCustom(translator("Insufficient FOMO", language));
          setLoading(false);
          return;
        }
        response = await stakeFOMO(wallet, stakeAmount, fomoToken);
      } else {
        if (stakeAmount > (userData?.stakedAmount ?? 0)) {
          errorCustom(translator("Insufficient FOMO", language));
          setLoading(false);
          return;
        }
        response = await unstakeFOMO(wallet, stakeAmount, fomoToken);
      }
      // console.log(response);
      if (response && response.success) await getFOMOBalance(wallet, setFomoBalance);

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
    if (stake) {
      // Deposit
      if (stakeAmount == 0 && fomoBalance > MinAmount)
        setStakeAmount(MinAmount);
      else {
        let amt = stakeAmount / 2;
        if (amt < MinAmount) amt = MinAmount;
        if (amt > fomoBalance) amt = fomoBalance;
        setStakeAmount(amt);
      }
    } else {
      // Withdraw
      if (userData && stakeAmount == 0 && userData?.stakedAmount > MinAmount)
        setStakeAmount(MinAmount);
      else {
        let amt = stakeAmount / 2;
        if (amt < MinAmount) amt = MinAmount;
        if (userData && amt > userData?.stakedAmount)
          amt = userData?.stakedAmount;
        setStakeAmount(amt);
      }
    }
  }
  };

  const handleDoubleStake = () => {
    if (stake) {
      // Deposit
      if (stakeAmount == 0 && fomoBalance > MinAmount)
        setStakeAmount(MinAmount);
      else {
        let amt = stakeAmount * 2;
        if (amt < MinAmount) amt = MinAmount;
        if (amt > fomoBalance) amt = fomoBalance;
        setStakeAmount(amt);
      }
    } else {
      // Withdraw
      if (userData && stakeAmount == 0 && userData?.stakedAmount > MinAmount)
        setStakeAmount(MinAmount);
      else {
        let amt = stakeAmount * 2;
        if (amt < MinAmount) amt = MinAmount;
        if (userData && amt > userData?.stakedAmount)
          amt = userData?.stakedAmount;
        setStakeAmount(amt);
      }
    }
  };

  const handleSetMaxStake = () => {
    stake
      ? setStakeAmount(fomoBalance)
      : setStakeAmount(userData?.stakedAmount ?? 0);
  };

  useEffect(() => {
    setStakeAmount(0);
  }, [stake]);

  return (
    <div className="w-full p-6 py-6 flex flex-col items-start gap-1 bg-staking-bg rounded-xl">
      <span className="text-white text-opacity-90 font-semibold text-xl">
        {translator("Stake", language)} FOMO
      </span>
      <div className="flex w-full items-center border-b border-white border-opacity-10 mt-5">
        <button
          className={`${
            stake
              ? "text-white border-[#9945FF]"
              : "text-[#ffffff80] border-transparent hover:text-[#ffffffb5]"
          } p-2  border-b-2 text-base font-medium transition-all w-full sm:w-max`}
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
          } p-2 border-b-2 text-base font-medium transition-all w-full sm:w-max`}
          onClick={() => {
            setStake(false);
          }}
        >
          {translator("Unstake", language)}
        </button>
      </div>

      <p className="text-white text-opacity-90 text-xs mt-4 font-changa flex justify-between w-full">
        {stake
          ? translator("Deposit", language)
          : translator("Withdraw", language)}
        <span
          onClick={() => {
            stake
              ? setStakeAmount(fomoBalance)
              : setStakeAmount(userData?.stakedAmount ?? 0);
          }}
          className="text-sm cursor-pointer font-medium font-changa text-[#94A3B8] text-opacity-90 transition-all"
        >
          {truncateNumber(stake ? fomoBalance : userData?.stakedAmount ?? 0, 4)}{" "}
          $FOMO
        </span>
      </p>

      <div
        className={`relative group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
      >
        <input
          id={"stake-amount-input"}
          type={"number"}
          step={"any"}
          autoComplete="off"
          onChange={(e) => {
            parseFloat(e.target.value) >= 0 &&
              setStakeAmount(parseFloat(e.target.value));
          }}
          placeholder={"0.0"}
          value={stakeAmount}
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
        className="w-full flex py-3 items-center justify-center gap-1 p-1.5 mt-4 bg-[#9945FF] hover:bg-opacity-50 disabled:bg-opacity-20 transition-all text-white text-md tracking-wider font-semibold rounded-[5px]"
      >
        {loading && <Spinner />}
        {stake
          ? translator("STAKE", language)
          : translator("UNSTAKE", language)}
      </button>
    </div>
  );
}