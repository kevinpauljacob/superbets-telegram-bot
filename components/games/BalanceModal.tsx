import { useWallet } from "@solana/wallet-adapter-react";
import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { obfuscatePubKey } from "@/context/transactions";
import { deposit, withdraw } from "../../context/gameTransactions";
import Loader from "./Loader";
interface ModalProps {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  actionType: string;
  token: string;
  balance: number;
}

export default function BalanceModal({
  visible,
  setVisible,
  actionType,
  token,
  balance,
}: ModalProps) {
  const methods = useForm();
  const wallet = useWallet();

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);

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
          setVisible(false);
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAmount(parseFloat(e.target.value));
  };

  const handleClose = () => {
    //@ts-ignore
    document.addEventListener("click", function (event) {
      //@ts-ignore
      var targetId = event.target.id;
      if (targetId && targetId === "modal-bg") setVisible(false);
    });
  };

  return (
    <div
      onClick={() => {
        handleClose();
      }}
      id="modal-bg"
      className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 backdrop-blur transition-all"
    >
      <div
        id="modal-box"
        className="flex w-[95%] max-w-[25rem] flex-col rounded-2xl border-2 border-[#7839C580] bg-[#7839C533] p-5"
      >
        <span className="mb-4 font-changa font-medium text-[#F0F0F0] text-opacity-75">
          {actionType}
        </span>

        <FormProvider {...methods}>
          <form
            className="flex w-full flex-col gap-3"
            autoComplete="off"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <div className="mb-0 flex w-full flex-col">
              <label className="mb-1 text-xs text-[#F0F0F0] text-opacity-75">
                Coin
              </label>

              <span className="w-full rounded-lg bg-[#7839C5] bg-opacity-10 px-4 py-2 text-[#F0F0F0] text-opacity-75">
                {token}
              </span>
            </div>

            <div className="mb-0 flex w-full flex-col">
              <label className="mb-1 text-xs text-[#F0F0F0] text-opacity-75">
                Your current connected wallet
              </label>

              <span className="w-full rounded-lg bg-[#7839C5] bg-opacity-10 px-4 py-2 text-[#F0F0F0] text-opacity-75">
                {obfuscatePubKey(wallet.publicKey?.toBase58() ?? "")}
              </span>
            </div>

            {actionType == "Withdraw" ? (
              <div className="mb-0 flex w-full flex-col">
                <div className="mb-1 flex w-full items-center justify-between">
                  <label className="text-xs text-[#F0F0F0] text-opacity-75">
                    Enter {actionType.toLocaleLowerCase()} amount
                  </label>
                  <span className="text-sm text-[#F0F0F0] text-opacity-75">
                    Available : {balance.toFixed(4)}
                  </span>
                </div>

                <div
                  className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] border-2 border-[#7839C5] px-4`}
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
                    className={`flex w-full min-w-0 bg-transparent text-sm text-white placeholder-white  placeholder-opacity-40 outline-none`}
                  />
                  <span
                    className="text-sm text-[#F0F0F0] text-opacity-75"
                    onClick={() => setAmount(balance)}
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
                  <label className="text-xs text-[#F0F0F0] text-opacity-75">
                    Enter {actionType.toLocaleLowerCase()} amount
                  </label>
                  <span className="text-sm text-[#F0F0F0] text-opacity-75">
                    Available : {balance.toFixed(4)}
                  </span>
                </div>

                <div
                  className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] border-2 border-[#7839C5] px-4`}
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
                    className={`flex w-full min-w-0 bg-transparent text-sm text-white placeholder-white  placeholder-opacity-40 outline-none`}
                  />
                  <span
                    className="text-sm text-[#F0F0F0] text-opacity-75"
                    onClick={() => setAmount(balance - 0.01)}
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
            )}

            <button
              type="submit"
              className="rounded-[8px] border border-[#F200F21A] bg-[#7839C5] hover:bg-[#884ece] transition-all py-2 font-changa text-base font-medium text-[#F0F0F0] text-opacity-90"
            >
              {loading ? <Loader /> : actionType}
            </button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
