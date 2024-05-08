import { useWallet } from "@solana/wallet-adapter-react";
import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { obfuscatePubKey } from "@/context/transactions";
import { deposit, withdraw } from "../../context/gameTransactions";
import Loader from "./Loader";
import { useGlobalContext } from "../GlobalContext";
import { IoClose, IoCloseOutline } from "react-icons/io5";
import Image from "next/image";

export default function ConfigureAutoModal() {
  const methods = useForm();
  const wallet = useWallet();

  const {
    showAutoModal,
    setShowAutoModal,
    autoWinChange,
    setAutoWinChange,
    autoLossChange,
    setAutoLossChange,
    autoStopProfit,
    setAutoStopProfit,
    autoStopLoss,
    setAutoStopLoss,
    autoWinChangeReset,
    setAutoWinChangeReset,
    autoLossChangeReset,
    setAutoLossChangeReset,
    useAutoConfig,
    setUseAutoConfig,
    startAuto,
    setStartAuto,
    walletBalance,
    coinData,
  } = useGlobalContext();

  const handleClose = () => {
    //@ts-ignore
    document.addEventListener("click", function (event) {
      //@ts-ignore
      var targetId = event.target.id;
      if (targetId && targetId === "modal-bg") setShowAutoModal(false);
    });
  };

  const onSubmit = async (data: any) => {
    if (
      parseFloat(data.autoWinChange) > 0 ||
      parseFloat(data.autoLossChange) > 0 ||
      parseFloat(data.autoStopProfit) > 0 ||
      parseFloat(data.autoStopLoss) > 0
    ) {
      setUseAutoConfig(true);
      setShowAutoModal(false);
      console.log(
        "Setting auto",
        data.autoWinChange,
        data.autoLossChange,
        autoWinChangeReset,
        autoLossChangeReset,
        data.autoStopProfit,
        data.autoStopLoss,
      );
    }
  };

  return showAutoModal ? (
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
          <span className=" text-[1.5rem] tracking-wide leading-5 mt-1 font-chakra font-bold text-[#e7e7e7]">
            Configure Auto
          </span>
        </div>

        <IoCloseOutline
          onClick={() => {
            setShowAutoModal(false);
          }}
          className="w-9 h-9 cursor-pointer text-[#fcfcfc] absolute top-0 right-0 mt-3 mr-5 hover:bg-[#26282c] transition-all p-1.5 rounded-full"
        />

        <FormProvider {...methods}>
          <form
            className="flex w-full flex-col gap-0"
            autoComplete="off"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            {/* on win change  */}
            <div className="mb-0 flex w-full flex-col">
              <div className="mb-1 flex w-full items-center justify-between text-sm font-changa text-opacity-90">
                <label className="text-white/90 font-medium font-changa">
                  On Win
                </label>
              </div>

              <div
                className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-2`}
              >
                <span
                  className={`${
                    autoWinChangeReset
                      ? "bg-[#7839C5] text-opacity-90"
                      : "bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] text-opacity-50"
                  } text-xs font-chakra font-medium text-white transition-all rounded-[5px] py-1.5 px-4`}
                  onClick={() => {
                    setAutoWinChangeReset(true);
                    setAutoWinChange(null);
                  }}
                >
                  Reset
                </span>
                <span
                  className={`${
                    !autoWinChangeReset
                      ? "bg-[#7839C5] text-opacity-90"
                      : "bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] text-opacity-50"
                  } mx-2 whitespace-nowrap text-xs font-chakra font-medium text-white text-opacity-50 transition-all rounded-[5px] py-1.5 px-4`}
                  onClick={() => setAutoWinChangeReset(false)}
                >
                  Increase by
                </span>
                <input
                  id={"autoWinChange"}
                  {...methods.register("autoWinChange")}
                  type={"number"}
                  step={"any"}
                  autoComplete="off"
                  disabled={autoWinChangeReset}
                  onChange={(e) => {
                    setAutoWinChange(parseFloat(e.target.value));
                  }}
                  placeholder={"00.00"}
                  value={autoWinChange ?? undefined}
                  className={`flex w-full min-w-0 bg-transparent text-right text-base disabled:text-opacity-40 text-[#94A3B8] placeholder-[#94A3B8] font-chakra placeholder-opacity-40 outline-none`}
                />
                <span className="text-[#94A3B8] text-base font-chakra ml-3">
                  %
                </span>
              </div>

              <span
                className={`${
                  methods.formState.errors["autoWinChange"]
                    ? "opacity-100"
                    : "opacity-0"
                } mb-1 pt-1 flex items-center gap-1 text-xs font-chakra text-fomo-red`}
              >
                {methods.formState.errors["autoWinChange"]
                  ? methods.formState.errors[
                      "autoWinChange"
                    ]!.message!.toString()
                  : "NONE"}
              </span>
            </div>

            {/* on loss change  */}
            <div className="mb-0 flex w-full flex-col">
              <div className="mb-1 flex w-full items-center justify-between text-sm font-changa text-opacity-90">
                <label className="text-white/90 font-medium font-changa">
                  On Loss
                </label>
              </div>

              <div
                className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-2`}
              >
                <span
                  className={`${
                    autoLossChangeReset
                      ? "bg-[#7839C5] text-opacity-90"
                      : "bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] text-opacity-50"
                  } text-xs font-chakra font-medium text-white transition-all rounded-[5px] py-1.5 px-4`}
                  onClick={() => {
                    setAutoLossChangeReset(true);
                    setAutoLossChange(null);
                  }}
                >
                  Reset
                </span>
                <span
                  className={`${
                    !autoLossChangeReset
                      ? "bg-[#7839C5] text-opacity-90"
                      : "bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] text-opacity-50"
                  } mx-2 whitespace-nowrap text-xs font-chakra font-medium text-white text-opacity-50 transition-all rounded-[5px] py-1.5 px-4`}
                  onClick={() => setAutoLossChangeReset(false)}
                >
                  Increase by
                </span>
                <input
                  id={"autoLossChange"}
                  {...methods.register("autoLossChange")}
                  type={"number"}
                  step={"any"}
                  autoComplete="off"
                  disabled={autoLossChangeReset}
                  onChange={(e) => {
                    setAutoLossChange(parseFloat(e.target.value));
                  }}
                  placeholder={"00.00"}
                  value={autoLossChange ?? undefined}
                  className={`flex w-full min-w-0 bg-transparent text-right text-base disabled:text-opacity-40 text-[#94A3B8] placeholder-[#94A3B8] font-chakra placeholder-opacity-40 outline-none`}
                />
                <span className="text-[#94A3B8] text-base font-chakra ml-3">
                  %
                </span>
              </div>

              <span
                className={`${
                  methods.formState.errors["autoLossChange"]
                    ? "opacity-100"
                    : "opacity-0"
                } mb-1 pt-1 flex items-center gap-1 text-xs font-chakra  text-fomo-red`}
              >
                {methods.formState.errors["autoLossChange"]
                  ? methods.formState.errors[
                      "autoLossChange"
                    ]!.message!.toString()
                  : "NONE"}
              </span>
            </div>

            {/* stop profit  */}
            <div className="mb-0 flex w-full flex-col">
              <div className="mb-1 flex w-full items-center justify-between text-sm font-changa text-opacity-90">
                <label className="text-white/90 font-medium font-changa">
                  Stop On Profit
                </label>
                {/* <span className="text-[#94A3B8] text-opacity-90 font-changa font-medium text-sm">
                  {coinData ? coinData[0]?.amount.toFixed(4) : 0} $SOL
                </span> */}
              </div>

              <div
                className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-2`}
              >
                <Image
                  src={"/assets/sol.png"}
                  width={16}
                  height={14}
                  alt=""
                  className={``}
                />
                <input
                  id={"autoStopProfit"}
                  {...methods.register("autoStopProfit", {
                    min: {
                      value: 0,
                      message: "Value must be greater than or equal to 0",
                    },
                  })}
                  type={"number"}
                  step={"any"}
                  autoComplete="off"
                  onChange={(e) => {
                    setAutoStopProfit(parseFloat(e.target.value));
                  }}
                  placeholder={"00.00"}
                  value={autoStopProfit ?? undefined}
                  className={`ml-2 flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8]  font-chakra placeholder-opacity-40 outline-none`}
                />
              </div>

              <span
                className={`${
                  methods.formState.errors["autoStopProfit"]
                    ? "opacity-100"
                    : "opacity-0"
                } mb-1 pt-1 flex items-center gap-1 text-xs font-chakra  text-fomo-red`}
              >
                {methods.formState.errors["autoStopProfit"]
                  ? methods.formState.errors[
                      "autoStopProfit"
                    ]!.message!.toString()
                  : "NONE"}
              </span>
            </div>

            {/* stop loss  */}
            <div className="mb-0 flex w-full flex-col">
              <div className="mb-1 flex w-full items-center justify-between text-sm font-changa text-opacity-90">
                <label className="text-white/90 font-medium font-changa">
                  Stop On Loss
                </label>
                {/* <span className="text-[#94A3B8] text-opacity-90 font-changa font-medium text-sm">
                  {coinData ? coinData[0]?.amount.toFixed(4) : 0} $SOL
                </span> */}
              </div>

              <div
                className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-2`}
              >
                <Image
                  src={"/assets/sol.png"}
                  width={16}
                  height={14}
                  alt=""
                  className={``}
                />
                <input
                  id={"autoStopLoss"}
                  {...methods.register("autoStopLoss", {
                    min: {
                      value: 0,
                      message: "Value must be greater than or equal to 0",
                    },
                  })}
                  type={"number"}
                  step={"any"}
                  autoComplete="off"
                  onChange={(e) => {
                    setAutoStopLoss(parseFloat(e.target.value));
                  }}
                  placeholder={"00.00"}
                  value={autoStopLoss ?? undefined}
                  className={`ml-2 flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8]  font-chakra placeholder-opacity-40 outline-none`}
                />
              </div>

              <span
                className={`${
                  methods.formState.errors["autoStopLoss"]
                    ? "opacity-100"
                    : "opacity-0"
                } mb-1 pt-1 flex items-center gap-1 text-xs font-chakra text-fomo-red`}
              >
                {methods.formState.errors["autoStopLoss"]
                  ? methods.formState.errors[
                      "autoStopLoss"
                    ]!.message!.toString()
                  : "NONE"}
              </span>
            </div>

            {/* apply button  */}
            <div className="hidden md:flex w-full flex-col mt-2">
              <button
                type="submit"
                disabled={
                  !autoLossChange &&
                  !autoWinChange &&
                  !autoStopLoss &&
                  !autoStopProfit
                }
                onClick={onSubmit}
                className={`disabled:cursor-default opacity-70 hover:opacity-90 w-full h-[3.75rem] rounded-lg transition-all bg-[#7839C5] disabled:bg-[#4b2876] hover:bg-[#9361d1] focus:bg-[#602E9E] flex items-center justify-center font-chakra font-semibold text-xl text-white`}
              >
                APPLY
              </button>
            </div>
            <span
              onClick={() => {
                setAutoLossChange(null);
                setAutoWinChange(null);
                setAutoLossChangeReset(true);
                setAutoWinChangeReset(true);
                setAutoStopLoss(null);
                setAutoStopProfit(null);
                setUseAutoConfig(false);
              }}
              className="text-[#94A3B8] hover:text-white/70 transition-all hover:duration-75 w-full text-center cursor-pointer text-base font-semibold font-chakra mt-8 underline underline-offset-2"
            >
              Reset All
            </span>
          </form>
        </FormProvider>
      </div>
    </div>
  ) : (
    <></>
  );
}
