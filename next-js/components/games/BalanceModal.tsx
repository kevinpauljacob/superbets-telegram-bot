import { useWallet } from "@solana/wallet-adapter-react";
import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { obfuscatePubKey } from "@/context/transactions";
import { deposit, withdraw } from "../../context/gameTransactions";
import Loader from "./Loader";
import { useGlobalContext } from "../GlobalContext";
import { IoClose } from "react-icons/io5";
import Image from "next/image";

export default function BalanceModal() {
  const methods = useForm();
  const wallet = useWallet();

  const token = "SOL";

  const { showWalletModal, setShowWalletModal, walletBalance, coinData } =
    useGlobalContext();

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [actionType, setActionType] = useState("Deposit");

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
          //   toast.error(response.message);
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

  return (
    <div
      onClick={() => {
        handleClose();
      }}
      id="modal-bg"
      className="absolute z-[150] left-0 top-0 flex h-full w-full items-start pt-[11rem] justify-center bg-black bg-opacity-50 backdrop-blur transition-all"
    >
      <div
        id="modal-box"
        className="relative flex w-[95%] max-w-[32rem] flex-col rounded-md bg-[#121418] p-11"
      >
        <div
          className="flex items-center w-full mb-7 gap-2"
        >
          <Image src={"/assets/wallet_color.png"} alt="" width={24} height={24} />
          <span className=" text-[1.5rem] leading-5 mt-1 font-changa font-black text-[#e7e7e7]">
            Wallet
          </span>
        </div>

        <IoClose
          onClick={() => {
            setShowWalletModal(false);
          }}
          className="w-6 h-6 cursor-pointer text-white absolute top-0 right-0 m-3"
        />

        <div className="w-full flex mb-8">
          <button
            className={`w-full border-2 rounded-md py-1 mr-1 text-white transition duration-300 ease-in-out ${
              actionType === "Deposit"
                ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
                : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
            }`}
            onClick={() => setActionType("Deposit")}
          >
            Deposit
          </button>
          <button
            className={`w-full border-2 rounded-md py-1 ml-1 text-white transition-all duration-300 ease-in-out ${
              actionType === "Withdraw"
                ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
                : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
            }`}
            onClick={() => setActionType("Withdraw")}
          >
            Withdraw
          </button>
        </div>

        <FormProvider {...methods}>
          <form
            className="flex w-full flex-col gap-5"
            autoComplete="off"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <div className="mb-0 flex w-full flex-col">
              <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                Coin
              </label>

              <span className="w-full rounded-md h-11 flex items-center bg-[#202329] px-4 py-2 text-[#94A3B8] text-base font-chakra">
                {token}
              </span>
            </div>

            <div className="mb-0 flex w-full flex-col">
              <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                Current Wallet
              </label>

              <span className="w-full rounded-md h-11 flex items-center bg-[#202329] px-4 py-2 text-[#94A3B8] text-sm font-chakra">
                {obfuscatePubKey(wallet.publicKey?.toBase58() ?? "")}
              </span>
            </div>

            {actionType == "Withdraw" ? (
              <div className="mb-0 flex w-full flex-col">
                <div className="mb-1 flex w-full items-center justify-between">
                  <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                    {actionType} amount
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
                    className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#555555] focus:bg-[#555555] transition-all rounded-[5px] mr-2 py-1.5 px-4"
                    onClick={() =>
                      setAmount(coinData ? coinData[0]?.amount / 2 : 0)
                    }
                  >
                    Half
                  </span>
                  <span
                    className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#555555] focus:bg-[#555555] transition-all rounded-[5px] py-1.5 px-4"
                    onClick={() =>
                      setAmount(coinData ? coinData[0]?.amount : 0)
                    }
                  >
                    MAX
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
              <div className="mb-0 flex w-full flex-col">
                <div className="mb-1 flex w-full items-center justify-between">
                  <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                    {actionType} amount
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
                    className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#555555] focus:bg-[#555555] transition-all rounded-[5px] py-1.5 px-4"
                    onClick={() => setAmount((walletBalance ?? 0) - 0.01)}
                  >
                    Max
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
            )}

            <button
              type="submit"
              className="rounded-[5px] -mt-3 border border-[#F200F21A] bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] transition-all py-2 font-changa text-base font-medium text-[#F0F0F0] text-opacity-90"
            >
              {loading ? <Loader /> : actionType}
            </button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
