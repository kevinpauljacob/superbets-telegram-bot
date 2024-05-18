import { useWallet } from "@solana/wallet-adapter-react";
import React, { useEffect, useState } from "react";
import { useForm, FormProvider, set } from "react-hook-form";
import { obfuscatePubKey, translator } from "@/context/transactions";
import { deposit, withdraw } from "../../context/gameTransactions";
import Loader from "./Loader";
import { useGlobalContext } from "../GlobalContext";
import { IoClose, IoCloseOutline } from "react-icons/io5";
import Image from "next/image";
import { timestampParser } from "@/utils/timestampParser";
import { formatNumber } from "@/context/transactions";

export default function BalanceModal() {
  const methods = useForm();
  const wallet = useWallet();

  const token = "SOL";

  const {
    showWalletModal,
    setShowWalletModal,
    walletBalance,
    coinData,
    language,
  } = useGlobalContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(0);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [actionType, setActionType] = useState<
    "Deposit" | "History" | "Withdraw"
  >("Deposit");
  const historyHeaders = ["Time", "Amount", "Type", "Status"];
  const mobileHistoryHeaders = ["Amount", "Status"];

  const onSubmit = async (data: any) => {
    if (!loading) {
      setLoading(true);
      // console.log("Form Data:", data);
      let response: { success: boolean; message: string };

      try {
        if (actionType === "Deposit")
          response = await deposit(wallet, amount, token);
        else response = await withdraw(wallet, amount, token);

        if (response && response.success) {
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
    setAmount(parseFloat(e.target.value));
  };

  const handleClose = () => {
    //@ts-ignore
    document.addEventListener("click", function (event) {
      //@ts-ignore
      var targetId = event.target.id;
      if (targetId && targetId === "modal-bg") setShowWalletModal(false);
    });
  };

  const handleGetHistory = async () => {
    console.log("Getting History");
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
      setHistoryData(data);
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (actionType === "History") handleGetHistory();
  }, [actionType]);

  return (
    <div
      onClick={() => {
        handleClose();
      }}
      id="modal-bg"
      className="absolute z-[150] left-0 top-0 flex h-full w-full items-center justify-center bg-[#33314680] backdrop-blur-[0px] transition-all"
    >
      <div
        id="modal-box"
        className="relative flex w-[95%] max-w-[30rem] flex-col rounded-md bg-[#121418] p-7"
      >
        <div className="flex items-center w-full mb-7 gap-2 mt-2">
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

        <IoCloseOutline
          onClick={() => {
            setShowWalletModal(false);
          }}
          className="w-9 h-9 cursor-pointer text-[#fcfcfc] absolute top-0 right-0 mt-3 mr-5 hover:bg-[#26282c] transition-all p-1.5 rounded-full"
        />

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
                    {(coinData ? coinData[0]?.amount : 0).toFixed(3)} $SOL
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
                    {(walletBalance ?? 0).toFixed(3)} $SOL
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
                          {formatNumber(data.amount, 4)} SOL
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
                className="rounded-[5px] -mt-1 mb-4 border border-[#F200F21A] bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] transition-all py-2.5 font-changa text-base font-medium text-[#F0F0F0] text-opacity-90"
              >
                {loading ? <Loader /> : translator(actionType, language)}
              </button>
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
