import { useWallet } from "@solana/wallet-adapter-react";
import React, { useEffect, useRef, useState } from "react";
import { useForm, FormProvider, set } from "react-hook-form";
import { obfuscatePubKey, translator } from "@/context/transactions";
import {
  deposit,
  truncateNumber,
  withdraw,
} from "../../context/gameTransactions";
import Loader from "./Loader";
import { useGlobalContext } from "../GlobalContext";
import { IoClose, IoCloseOutline } from "react-icons/io5";
import Image from "next/image";
import { timestampParser } from "@/utils/timestampParser";
import { formatNumber } from "@/context/transactions";
import { useRouter } from "next/router";
import Link from "next/link";
import { AdaptiveModal,AdaptiveModalContent} from "../AdaptiveModal";

export default function BalanceModal() {
  const methods = useForm();
  const wallet = useWallet();

  const router = useRouter();

  const { c: campaignId } = router.query;

  const token = "SOL";

  const {
    showWalletModal,
    setShowWalletModal,
    walletBalance,
    coinData,
    language,
    getBalance
  } = useGlobalContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(0);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [actionType, setActionType] = useState<
    "Deposit" | "History" | "Withdraw"
  >("Deposit");
  const historyHeaders = ["Time", "Amount", "Type", "Status"];
  const mobileHistoryHeaders = ["Amount", "Status"];
  const [checked, setChecked] = useState(false);

  const onSubmit = async (data: any) => {
    if (!loading) {
      setLoading(true);
      // console.log("Form Data:", data);
      let response: { success: boolean; message: string };

      try {
        if (actionType === "Deposit")
          response = await deposit(wallet, amount, token, campaignId);
        else response = await withdraw(wallet, amount, token);

        if (response && response.success) {
          getBalance()
          setShowWalletModal(false);
        } else {
          //   errorCustom(response.message);
        }
        setLoading(false);
      } catch (e) {
        setLoading(false);
        console.error(e);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const amount = parseFloat(e.target.value)
    setAmount(parseFloat(e.target.value));
  };

  const handleGetHistory = async () => {
    // console.log("Getting History");
    try {
      const res = await fetch(
        `/api/games/wallet/getDeposits/?wallet=${wallet.publicKey}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      let { success, data, message } = await res.json();
      setHistoryData(data.reverse());
      // console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (actionType === "History") handleGetHistory();
  }, [actionType]);

  return (
    <AdaptiveModal open={showWalletModal} onOpenChange={()=>setShowWalletModal(false)} >
      <AdaptiveModalContent className="bg-[#121418] h-[80%] sm:h-auto flex sm:w-[95%] sm:max-w-[30rem] flex-col rounded-md p-7 overflow-y-scroll nobar">
        <div className="flex justify-center sm:justify-start items-center w-full mb-7 gap-2 mt-2">
          <Image
            src={"/assets/wallet_color.png"}
            alt=""
            width={24}
            height={24}
          />
          <span className=" text-[1.5rem] leading-5 mt-1 font-changa font-black text-[#e7e7e7]">
            {translator("Wallet", language)}
          </span>
        </div>

        <div className="w-full flex mb-8 mt-2 gap-2">
          <button
            className={`w-full border-2 rounded-md py-2 text-white font-semibold text-xs sm:text-sm transition hover:duration-75 ease-in-out ${
              actionType === "Deposit"
                ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
                : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
            }`}
            onClick={() => setActionType("Deposit")}
          >
            {translator("Deposit", language)}
          </button>
          <button
            className={`w-full border-2 rounded-md py-2 text-white font-semibold text-xs sm:text-sm transition-all hover:duration-75 ease-in-out ${
              actionType === "Withdraw"
                ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
                : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
            }`}
            onClick={() => setActionType("Withdraw")}
          >
            {translator("Withdraw", language)}
          </button>
          <button
            className={`w-full border-2 rounded-md py-2 text-white font-semibold text-xs sm:text-sm transition hover:duration-75 ease-in-out ${
              actionType === "History"
                ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
                : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
            }`}
            onClick={() => setActionType("History")}
          >
            {translator("History", language)}
          </button>
        </div>

        <FormProvider {...methods}>
          <form
            className="flex w-full flex-col gap-6"
            autoComplete="off"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            {actionType !== "History" && (
              <div className="mb-0 flex w-full flex-col">
                <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                  {translator("Coin", language)}
                </label>

                <span className="w-full rounded-md h-11 flex items-center bg-[#202329] px-4 py-2 text-[#94A3B8] text-base font-chakra">
                  {token}
                </span>
              </div>
            )}

            {actionType !== "History" && (
              <div className="mb-0 flex w-full flex-col">
                <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                  {translator("Current Wallet", language)}
                </label>

                <span className="w-full rounded-md h-11 flex items-center bg-[#202329] px-4 py-2 text-[#94A3B8] text-sm font-chakra">
                  {obfuscatePubKey(wallet.publicKey?.toBase58() ?? "")}
                </span>
              </div>
            )}

            {actionType == "Withdraw" ? (
              <div className="mb-0 flex w-full flex-col">
                <div className="mb-1 flex w-full items-center justify-between">
                  <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                    {translator(actionType, language)}{" "}
                    {translator("Amount", language)}
                  </label>
                  <span className="font-changa font-medium text-sm text-[#94A3B8] text-opacity-90">
                    {truncateNumber(coinData ? coinData[0]?.amount : 0, 3)} $SOL
                  </span>
                </div>

                <div
                  className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] pl-4 pr-2.5`}
                >
                  <input
                    id={"amount-input"}
                    {...methods.register("amount", {
                      required: "Amount is required",
                    })}
                    type={"number"}
                    lang="en"
                    step={"any"}
                    autoComplete="off"
                    onChange={handleChange}
                    placeholder={"Amount"}
                    value={amount}
                    className={`flex w-full min-w-0 bg-transparent text-sm text-[#94A3B8] placeholder-[#94A3B8]  placeholder-opacity-40 outline-none`}
                  />
                  <span
                    className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] mr-2 py-1.5 px-4"
                    onClick={() =>
                      setAmount(coinData ? coinData[0]?.amount / 2 : 0)
                    }
                  >
                    {translator("Half", language)}
                  </span>
                  <span
                    className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-1.5 px-4"
                    onClick={() =>
                      setAmount(coinData ? coinData[0]?.amount : 0)
                    }
                  >
                    {translator("Max", language)}
                  </span>
                </div>

                <span
                  className={`${
                    methods.formState.errors["amount"]
                      ? "opacity-100"
                      : "opacity-0"
                  } mt-1.5 flex items-center gap-1 text-xs text-[#D92828]`}
                >
                  {methods.formState.errors["amount"]
                    ? methods.formState.errors["amount"]!.message!.toString()
                    : "NONE"}
                </span>
              </div>
            ) : actionType === "Deposit" ? (
              <div className="mb-0 flex w-full flex-col">
                <div className="mb-1 flex w-full items-center justify-between">
                  <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                    {translator(actionType, language)}{" "}
                    {translator("Amount", language)}
                  </label>
                  <span className="font-changa font-medium text-sm text-[#94A3B8] text-opacity-90">
                    {truncateNumber(walletBalance ?? 0, 3)} $SOL
                  </span>
                </div>
                <div
                  className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] pl-4 pr-2.5`}
                >
                  <input
                    id={"amount-input"}
                    {...methods.register("amount", {
                      required: "Amount is required",
                    })}
                    type={"number"}
                    step={"any"}
                    autoComplete="off"
                    onChange={handleChange}
                    placeholder={"Amount"}
                    value={amount}
                    className={`flex w-full min-w-0 bg-transparent text-sm text-[#94A3B8] placeholder-[#94A3B8]  placeholder-opacity-40 outline-none`}
                  />
                  <span
                    className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-1.5 px-4"
                    onClick={() => setAmount((walletBalance ?? 0) - 0.01)}
                  >
                    {translator("Max", language)}
                  </span>
                </div>
                <span
                  className={`${
                    methods.formState.errors["amount"]
                      ? "opacity-100"
                      : "opacity-0"
                  } mt-1.5 flex items-center gap-1 text-xs text-[#D92828]`}
                >
                  {methods.formState.errors["amount"]
                    ? methods.formState.errors["amount"]!.message!.toString()
                    : "NONE"}
                </span>
              </div>
            ) : (
              <table className="flex w-full flex-col items-center">
                <tr className="mb-2 flex w-full flex-row items-center gap-2 py-1 pr-[10px] text-sm font-light font-changa bg-table-secondary">
                  {historyHeaders.map((header, index) => (
                    <th
                      key={index}
                      className={`hidden sm:block w-full text-center font-changa text-[10px] font-light text-[#F0F0F0] text-opacity-75`}
                    >
                      {header}
                    </th>
                  ))}
                  {mobileHistoryHeaders.map((header, index) => (
                    <th
                      key={index}
                      className={`sm:hidden w-full text-center font-changa text-[10px] font-light text-[#F0F0F0] text-opacity-75`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
                <div
                  className={`${
                    historyData.length <= 0
                      ? "flex items-center justify-center"
                      : ""
                  } w-full h-[310px] overflow-y-scroll modalscrollbar`}
                >
                  {historyData.length > 0 ? (
                    historyData.map((data, index) => (
                      <tr
                        key={index}
                        className={`mb-2 flex w-full flex-row items-center gap-2 py-3 text-xs font-light font-changa bg-table-secondary`}
                      >
                        <td className="hidden sm:block w-full text-center font-changa text-xs font-light text-[#F0F0F0] text-opacity-75">
                          {timestampParser(data.createdAt)}
                        </td>
                        <td className="w-full text-center font-changa text-xs font-light text-[#F0F0F0] text-opacity-75">
                          {truncateNumber(data.amount, 4)} SOL
                        </td>
                        <td className="hidden sm:block w-full text-center font-changa text-xs font-light text-[#F0F0F0] text-opacity-75">
                          {data.type ? "Deposit" : "Withdraw"}
                        </td>
                        <td
                          className={`w-full text-center font-changa text-xs font-light ${
                            data.status === "completed"
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {data.status === "completed"
                            ? "Completed"
                            : "Pending"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <span className="flex items-center justify-center w-full text-center font-changa text-[#F0F0F080]">
                      No data.
                    </span>
                  )}
                </div>
              </table>
            )}

            {actionType !== "History" && (
              <button
                type="submit"
                className="rounded-[5px] -mt-1 mb-4 disabled:opacity-50 border border-[#F200F21A] bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] transition-all py-2.5 font-changa text-base font-medium text-[#F0F0F0] text-opacity-90"
                disabled={actionType === "Deposit" && !checked}
              >
                {loading ? <Loader /> : translator(actionType, language)}
              </button>
            )}
            {actionType === "Deposit" && (
              <div className="flex  gap-2">
                <div>
                  <input
                    type="checkbox"
                    id="termsCheckbox"
                    className="opacity-0 absolute h-[18px] w-[18px]"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    style={{ zIndex: -1 }}
                  />
                  <div
                    className="h-[18px] w-[18px] bg-[#202329] rounded-sm "
                    onClick={() => setChecked(!checked)}
                    style={{
                      backgroundColor: checked ? "gray" : "#202329",
                    }}
                  >
                    {checked && (
                      <span className="flex items-center justify-center pt-1">
                        <svg className="text-black h-3 w-3" viewBox="0 0 24 24">
                          <path
                            fill="black"
                            d="M9 19l-7-7 1.41-1.41L9 16.17 20.59 4.59 22 6l-13 13z"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
                <label
                  htmlFor="termsCheckbox"
                  className="text-[12px] text-[#94A3B8] font-chakra font-bold w-[397px] h-[47px]   text-justify"
                  onClick={() => setChecked(!checked)}
                >
                  I agree with the Privacy Policy and with the Terms of Use, Gambling
                  is not forbidden by my local authorities and I am at least 18
                  years old.
                </label>
              </div>
            )}
          </form>
        </FormProvider>
      </AdaptiveModalContent>
    </AdaptiveModal>
  );
}
