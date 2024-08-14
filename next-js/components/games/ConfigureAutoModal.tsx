import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useGlobalContext } from "../GlobalContext";
import { IoCloseOutline } from "react-icons/io5";
import { translator } from "@/context/transactions";
import Image from "next/image";
import { warningCustom } from "../toasts/ToastGroup";
import { useRouter } from "next/router";
import { AdaptiveModal, AdaptiveModalContent } from "../AdaptiveModal";

export default function ConfigureAutoModal() {
  const methods = useForm();
  const router = useRouter();
  const game = router.pathname.split("/")[1];

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
    language,
    autoConfigState,
    setAutoConfigState,
    selectedCoin,
  } = useGlobalContext();

  const updateAutoConfigState = () => {
    setAutoConfigState((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(game, {
        autoWinChange: autoWinChange,
        autoLossChange: autoLossChange,
        autoWinChangeReset: autoWinChangeReset,
        autoLossChangeReset: autoLossChangeReset,
        autoStopProfit: autoStopProfit,
        autoStopLoss: autoStopLoss,
        useAutoConfig: true,
      });
      return newMap;
    });
  };

  const removeAutoConfig = () => {
    setAutoConfigState((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.delete(game);
      return newMap;
    });
  };

  const onSubmit = async (data: any) => {
    if (
      parseFloat(data.autoWinChange) ||
      parseFloat(data.autoLossChange) ||
      parseFloat(data.autoStopProfit) > 0 ||
      parseFloat(data.autoStopLoss) > 0
    ) {
      setUseAutoConfig(true);
      setShowAutoModal(false);
      updateAutoConfigState();
      // console.log(
      //   "Setting auto",
      //   autoWinChange,
      //   autoLossChange,
      //   autoWinChangeReset,
      //   autoLossChangeReset,
      //   autoStopProfit,
      //   autoStopLoss,
      // );
    }
  };

  useEffect(() => {
    // console.log(
    //   "Setting auto",
    //   autoWinChange,
    //   autoLossChange,
    //   autoWinChangeReset,
    //   autoLossChangeReset,
    //   autoStopProfit,
    //   autoStopLoss,
    //   showAutoModal,
    // );
    if (showAutoModal) {
      const configOptions = autoConfigState.get(game);
      // console.log(configOptions);
      methods.setValue("autoWinChange", configOptions?.autoWinChange ?? NaN);
      methods.setValue("autoLossChange", configOptions?.autoLossChange ?? NaN);
      methods.setValue("autoStopProfit", configOptions?.autoStopProfit ?? NaN);
      methods.setValue("autoStopLoss", configOptions?.autoStopLoss ?? NaN);
    }
  }, [showAutoModal]);

  return showAutoModal ? (
    <AdaptiveModal
      open={showAutoModal}
      onOpenChange={() => setShowAutoModal(false)}
    >
      <AdaptiveModalContent className="bg-[#121418] sm:overflow-y-auto min-h-[50dvh] max-h-[80dvh] w-full pb-6">
        <div className="flex flex-1 px-8 sm:p-0 justify-center overflow-y-auto">
          <div className="flex flex-col w-full">
            <div className="flex justify-center sm:justify-start items-center w-full mb-7 gap-2 mt-2">
              <span className=" text-[1.5rem] tracking-wide leading-5 mt-1 font-chakra font-bold text-[#e7e7e7]">
                {translator("Configure Auto", language)}
              </span>
            </div>

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
                      {translator("On Win", language)}
                    </label>
                  </div>

                  <div
                    className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-2`}
                  >
                    <span
                      className={`${
                        autoWinChangeReset
                          ? "bg-[#5F4DFF] text-opacity-90"
                          : "bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] text-opacity-50"
                      } text-xs font-chakra font-medium text-white transition-all rounded-[5px] py-1.5 px-4`}
                      onClick={() => {
                        setAutoWinChangeReset(true);
                        // setAutoWinChange(null);
                      }}
                    >
                      {translator("Reset", language)}
                    </span>
                    <span
                      className={`${
                        !autoWinChangeReset
                          ? "bg-[#5F4DFF] text-opacity-90"
                          : "bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] text-opacity-50"
                      } mx-2 whitespace-nowrap text-xs font-chakra font-medium text-white text-opacity-50 transition-all rounded-[5px] py-1.5 px-4`}
                      onClick={() => setAutoWinChangeReset(false)}
                    >
                      {translator("Increase by", language)}
                    </span>
                    <input
                      id={"autoWinChange"}
                      {...methods.register("autoWinChange")}
                      type={"number"}
                      step={"any"}
                      autoComplete="off"
                      disabled={autoWinChangeReset}
                      onChange={(e) => {
                        // console.log(e.target.value, parseFloat(e.target.value));
                        setAutoWinChange(parseFloat(e.target.value));
                      }}
                      placeholder={"00.00"}
                      value={autoWinChange ?? NaN}
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
                      {translator("On Loss", language)}
                    </label>
                  </div>

                  <div
                    className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-2`}
                  >
                    <span
                      className={`${
                        autoLossChangeReset
                          ? "bg-[#5F4DFF] text-opacity-90"
                          : "bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] text-opacity-50"
                      } text-xs font-chakra font-medium text-white transition-all rounded-[5px] py-1.5 px-4`}
                      onClick={() => {
                        setAutoLossChangeReset(true);
                        // setAutoLossChange(null);
                      }}
                    >
                      {translator("Reset", language)}
                    </span>
                    <span
                      className={`${
                        !autoLossChangeReset
                          ? "bg-[#5F4DFF] text-opacity-90"
                          : "bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] text-opacity-50"
                      } mx-2 whitespace-nowrap text-xs font-chakra font-medium text-white text-opacity-50 transition-all rounded-[5px] py-1.5 px-4`}
                      onClick={() => setAutoLossChangeReset(false)}
                    >
                      {translator("Increase by", language)}
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
                      value={autoLossChange ?? NaN}
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
                      {translator("Stop On Profit", language)}
                    </label>
                    {/* <span className="text-[#94A3B8] text-opacity-90 font-changa font-medium text-sm">
                  {coinData ? coinData[0]?.amount.toFixed(4) : 0} ${selectedCoin.tokenName}
                </span> */}
                  </div>

                  <div
                    className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-2`}
                  >
                    <selectedCoin.icon className="w-6 h-6 text-[#94A3B8]" />
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
                        const amount = parseFloat(e.target.value);
                        // console.log(amount, !amount);
                        setAutoStopProfit(parseFloat(e.target.value));
                        if (!amount || (amount && amount >= 0)) {
                          methods.clearErrors("autoStopProfit");
                        }
                      }}
                      placeholder={"00.00"}
                      value={autoStopProfit ?? NaN}
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
                      {translator("Stop On Loss", language)}
                    </label>
                    {/* <span className="text-[#94A3B8] text-opacity-90 font-changa font-medium text-sm">
                  {coinData ? coinData[0]?.amount.toFixed(4) : 0} ${selectedCoin.tokenName}
                </span> */}
                  </div>

                  <div
                    className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-2`}
                  >
                    <selectedCoin.icon className="w-6 h-6 text-[#94A3B8]" />
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
                        const amount = parseFloat(e.target.value);
                        setAutoStopLoss(parseFloat(e.target.value));
                        if (!amount || (amount && amount >= 0)) {
                          methods.clearErrors("autoStopLoss");
                        }
                      }}
                      placeholder={"00.00"}
                      value={autoStopLoss ?? NaN}
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
                <div className="block md:flex w-full flex-col mt-2">
                  <button
                    type="submit"
                    disabled={
                      !autoLossChange &&
                      !autoWinChange &&
                      !autoStopLoss &&
                      !autoStopProfit
                    }
                    onClick={onSubmit}
                    className={`disabled:cursor-default disabled:opacity-70 hover:duration-75 hover:opacity-90 w-full h-[3.75rem] rounded-lg transition-all bg-[#5F4DFF] disabled:bg-[#555555] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] flex items-center justify-center font-chakra font-semibold text-xl tracking-wider text-white`}
                  >
                    {translator("APPLY", language)}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAutoLossChange(null);
                    setAutoWinChange(null);
                    setAutoLossChangeReset(true);
                    setAutoWinChangeReset(true);
                    setAutoStopLoss(null);
                    setAutoStopProfit(null);
                    setUseAutoConfig(false);
                    methods.setValue("autoWinChange", NaN);
                    methods.setValue("autoLossChange", NaN);
                    methods.setValue("autoStopProfit", NaN);
                    methods.setValue("autoStopLoss", NaN);
                    methods.clearErrors("autoWinChange");
                    methods.clearErrors("autoLossChange");
                    methods.clearErrors("autoStopProfit");
                    methods.clearErrors("autoStopLoss");
                    removeAutoConfig();
                    warningCustom("All values reset.", "top-left");
                  }}
                  className="text-[#94A3B8] hover:text-white/70 transition-all hover:duration-75 w-full text-center cursor-pointer text-base font-semibold font-chakra mt-8 underline underline-offset-2"
                >
                  {translator("Reset All", language)}
                </button>
              </form>
            </FormProvider>
          </div>
        </div>
      </AdaptiveModalContent>
    </AdaptiveModal>
  ) : (
    <></>
  );
}
