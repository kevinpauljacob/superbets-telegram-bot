import React, { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  connection,
  deposit,
  obfuscatePubKey,
  translator,
  truncateNumber,
  withdraw,
} from "@/context/transactions";
import Loader from "./Loader";
import { useGlobalContext } from "../GlobalContext";
import { IoCloseOutline } from "react-icons/io5";
import Image from "next/image";
import { timestampParser } from "@/utils/timestampParser";
import { useRouter } from "next/router";
import { AdaptiveModal, AdaptiveModalContent } from "../AdaptiveModal";
import { SPL_TOKENS, spl_token } from "@/context/config";
import { Connection, ParsedAccountData, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { errorCustom } from "../toasts/ToastGroup";
import { FaRegCopy } from "react-icons/fa6";
import { copyToClipboard } from "@/pages/affiliate-program";

export default function BalanceModal() {
  const methods = useForm();

  const router = useRouter();

  const { c: campaignId } = router.query;

  const {
    showWalletModal,
    setShowWalletModal,
    walletBalance,
    language,
    userTokens,
    setUserTokens,
    getBalance,
    coinData,
    session,
  } = useGlobalContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<spl_token>(SPL_TOKENS[0]);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(0);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [actionType, setActionType] = useState<
    "Deposit" | "History" | "Withdraw"
  >("Deposit");
  const historyHeaders = ["Time", "Amount", "Type", "Status"];
  const mobileHistoryHeaders = ["Amount", "Status"];
  const [checked, setChecked] = useState(false);
  const [depositWallet, setDepositWallet] = useState<string>("");

  const onSubmit = async (data: any) => {
    if (!loading) {
      setLoading(true);
      // console.log("Form Data:", data);
      let response: { success: boolean; message: string };

      try {
        if (actionType === "Deposit") {
          let token = userTokens.find(
            (x) => x.mintAddress && x.mintAddress === selectedToken.tokenMint,
          );
          let balance = null;
          if (token) balance = token?.balance;

          if (!balance || balance < amount) {
            setLoading(false);
            errorCustom(translator("Insufficient balance", language));
            return;
          }

          response = await deposit(amount, selectedToken.tokenMint, campaignId);
        } else response = await withdraw(amount, selectedToken.tokenMint);

        if (response && response.success) {
          getBalance();
          setShowWalletModal(false);
        } else {
          //   errorCustom(response.message);
        }
        handleGetHistory();
        setLoading(false);
      } catch (e) {
        setLoading(false);
        console.error(e);
      }
    }
  };

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setAmount(Math.abs(parseFloat(e.target.value)));
  };

  const handleWalletChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setDepositWallet(e.target.value);
  };

  const handleGetHistory = async () => {
    console.log("Getting History");
    try {
      const res = await fetch(
        `/api/games/wallet/getDeposits?wallet=${session?.user?.wallet}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      let { success, data, message } = await res.json();
      setHistoryData(data);
      // console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleGetHistory();
  }, []);

  interface TokenAccount {
    mintAddress: string;
    balance: number;
  }

  async function getTokenAccounts(
    walletPublicKey: PublicKey,
    connection: Connection,
  ) {
    const filters = [
      {
        dataSize: 165, // size of SPL Token account
      },
      {
        memcmp: {
          offset: 32, // offset of the owner in the Token account layout
          bytes: walletPublicKey.toBase58(), // wallet public key as a base58 encoded string
        },
      },
    ];

    const accounts = await connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID, // Token program ID
      { filters: filters },
    );

    const results: TokenAccount[] = accounts.map((account) => {
      const info = account.account.data as ParsedAccountData; // Assume proper typing
      const mintAddress = info.parsed.info.mint;
      const balance = info.parsed.info.tokenAmount.uiAmount || 0;

      return { mintAddress, balance };
    });

    return results;
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (session?.user?.wallet && showWalletModal && actionType === "Deposit") {
      const fetchAndUpddateToken = () => {
        handleGetHistory()
      };
      fetchAndUpddateToken();
      intervalId = setInterval(fetchAndUpddateToken, 10000);

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [session?.user?.wallet, showWalletModal]);

  return (
    <AdaptiveModal
      open={showWalletModal}
      onOpenChange={() => setShowWalletModal(false)}
    >
      <AdaptiveModalContent className="bg-[#121418] sm:overflow-y-auto min-h-[50dvh] max-h-[80dvh] w-full pb-6">
        <div className="flex flex-1 px-6 sm:p-0 justify-center overflow-y-auto nobar">
          <div className="flex flex-col w-full">
            {/* header and logo  */}
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

            {/* option buttons  */}
            <div className="w-full flex mb-8 mt-2 gap-2">
              <button
                className={`w-full border-2 rounded-md py-2 text-white font-semibold text-xs sm:text-sm transition hover:duration-75 ease-in-out ${
                  actionType === "Deposit"
                    ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
                    : "border-[#d9d9d90d] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] text-opacity-50 hover:text-opacity-90"
                }`}
                onClick={() => setActionType("Deposit")}
              >
                {translator("Deposit", language)}
              </button>
              <button
                className={`w-full border-2 rounded-md py-2 text-white font-semibold text-xs sm:text-sm transition-all hover:duration-75 ease-in-out ${
                  actionType === "Withdraw"
                    ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
                    : "border-[#d9d9d90d] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] text-opacity-50 hover:text-opacity-90"
                }`}
                onClick={() => setActionType("Withdraw")}
              >
                {translator("Withdraw", language)}
              </button>
              <button
                className={`w-full border-2 rounded-md py-2 text-white font-semibold text-xs sm:text-sm transition hover:duration-75 ease-in-out flex items-center justify-center gap-1 ${
                  actionType === "History"
                    ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
                    : "border-[#d9d9d90d] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] text-opacity-50 hover:text-opacity-90"
                }`}
                onClick={() => setActionType("History")}
              >
                {translator("History", language)}
                {historyData.length > 0 && (
                  <div className="flex items-center justify-center bg-[#EFA411] bg-opacity-10 text-[#EFA411] text-[0.625rem] font-sans font-semibold w-5 min-h-5 rounded-full">
                    {
                      historyData.filter(
                        (history) =>
                          !history?.type &&
                          history?.status &&
                          history?.status == "review",
                      ).length
                    }
                  </div>
                )}
              </button>
            </div>

            <FormProvider {...methods}>
              <form
                className="flex w-full flex-col gap-6"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                {/* warning  */}
                {actionType !== "History" && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-[#DCA815]" />
                    <span className={`text-xs text-[#DCA815]`}>
                      We only support SOL and USDT transactions on the solana
                      network!
                    </span>
                  </div>
                )}

                {actionType === "Withdraw" && (
                  <>
                    {/* coin selector  */}
                    <div className="relative mb-0 flex w-full flex-col rounded-md">
                      <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90 ">
                        {translator("Coin", language)}
                      </label>

                      <span
                        className="w-full rounded-md h-11 flex items-center bg-[#202329] px-4 py-2 text-[#94A3B8] text-base font-chakra gap-2 cursor-pointer"
                        onClick={() => setIsSelectModalOpen(!isSelectModalOpen)}
                      >
                        <selectedToken.icon className="w-6 h-6" />
                        <span>{selectedToken?.tokenName}</span>
                        <div className="grow" />
                        <img
                          src="/assets/chevron.svg"
                          alt=""
                          className={`w-4 h-4 transform ${
                            isSelectModalOpen ? "rotate-180" : ""
                          }`}
                        />
                      </span>

                      {isSelectModalOpen && (
                        <div className="absolute z-[100] top-[calc(100%+10px)] left-0 w-full bg-[#202329] rounded-[5px] border-2 border-white border-opacity-10">
                          {SPL_TOKENS.filter(
                            (t) => t.tokenMint !== "SUPER",
                          ).map((token, index) => (
                            <div
                              key={index}
                              className="w-full h-11 flex flex-row items-center border-y  border-white border-opacity-10  bg-[#202329] px-4 py-2 text-[#94A3B8] text-base font-chakra gap-2 cursor-pointer hover:bg-[#292C32]"
                              onClick={() => {
                                setSelectedToken(token);
                                setIsSelectModalOpen(false);
                              }}
                            >
                              <token.icon className="" />
                              <span>{token.tokenName}</span>
                              <div className="grow" />
                              <span className="text-gray-400">
                                {/* {actionType === "Deposit" &&
                                  truncateNumber(
                                    userTokens.find(
                                      (t) =>
                                        t?.mintAddress &&
                                        t?.mintAddress === token?.tokenMint,
                                    )?.balance ?? 0,
                                  )} */}
                                {actionType === "Withdraw" &&
                                  truncateNumber(
                                    coinData
                                      ? coinData.find(
                                          (coin) =>
                                            coin?.tokenMint &&
                                            coin?.tokenMint ===
                                              token?.tokenMint,
                                        )?.amount ?? 0
                                      : 0,
                                  )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* wallet input box  */}
                    <div className="mb-0 flex w-full flex-col">
                      <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                        {translator("Deposit Wallet", language)}
                      </label>

                      <div
                        className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] pl-4 pr-2.5`}
                      >
                        <input
                          id={"amount-input"}
                          {...methods.register("deposit-wallet", {
                            required: "Wallet is required",
                          })}
                          type={"text"}
                          lang="en"
                          step={"any"}
                          autoComplete="off"
                          onChange={handleWalletChange}
                          placeholder={""}
                          value={depositWallet}
                          className={`flex w-full min-w-0 bg-transparent text-sm text-[#94A3B8] placeholder-[#94A3B8]  placeholder-opacity-40 outline-none`}
                        />
                      </div>

                      <span
                        className={`${
                          methods.formState.errors["deposit-wallet"]
                            ? "opacity-100"
                            : "opacity-0"
                        } mt-1.5 flex items-center gap-1 text-xs text-[#D92828]`}
                      >
                        {methods.formState.errors["deposit-wallet"]
                          ? methods.formState.errors[
                              "deposit-wallet"
                            ]!.message!.toString()
                          : "NONE"}
                      </span>
                    </div>
                    {/* amount input box */}
                    <div className="-mt-6 mb-0 flex w-full flex-col">
                      <div className="mb-1 flex w-full items-center justify-between">
                        <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                          {translator(actionType, language)}{" "}
                          {translator("Amount", language)}
                        </label>
                        <span className="font-changa font-medium text-sm text-[#94A3B8] text-opacity-90">
                          {truncateNumber(
                            coinData
                              ? coinData.find(
                                  (coin) =>
                                    coin?.tokenMint &&
                                    coin?.tokenMint ===
                                      selectedToken?.tokenMint,
                                )?.amount ?? 0
                              : 0,
                          )}{" "}
                          ${selectedToken?.tokenName}
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
                          onChange={handleAmountChange}
                          placeholder={"00.00"}
                          value={amount}
                          className={`flex w-full min-w-0 bg-transparent text-sm text-[#94A3B8] placeholder-[#94A3B8]  placeholder-opacity-40 outline-none`}
                        />
                        <span
                          className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] mr-2 py-1.5 px-4"
                          onClick={() => {
                            let bal = 0;
                            if (coinData) {
                              let token = coinData.find(
                                (coin) =>
                                  coin?.tokenMint &&
                                  coin?.tokenMint === selectedToken?.tokenMint,
                              );
                              if (token) bal = token?.amount;
                            }

                            if (!amount || amount === 0) setAmount(bal / 2);
                            else setAmount(amount / 2);
                          }}
                        >
                          {translator("Half", language)}
                        </span>
                        <span
                          className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-1.5 px-4"
                          onClick={() => {
                            let bal = 0;
                            if (coinData) {
                              let token = coinData.find(
                                (coin) =>
                                  coin?.tokenMint &&
                                  coin?.tokenMint === selectedToken?.tokenMint,
                              );
                              if (token) bal = token?.amount;
                            }

                            setAmount(bal);
                          }}
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
                          ? methods.formState.errors[
                              "amount"
                            ]!.message!.toString()
                          : "NONE"}
                      </span>
                    </div>
                    {/* button  */}
                    <button
                      type="submit"
                      className="rounded-[5px] -mt-1 mb-4 disabled:opacity-50 border border-[#F200F21A] bg-[#5F4DFF] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] transition-all py-2.5 font-changa text-base font-medium text-[#F0F0F0] text-opacity-90"
                      // disabled={actionType === "Deposit" && !checked}
                    >
                      {loading ? <Loader /> : translator(actionType, language)}
                    </button>
                  </>
                )}

                {/* {actionType === "Deposit" && (
                  <div className="mb-0 flex w-full flex-col">
                    <div className="mb-1 flex w-full items-center justify-between">
                      <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                        {translator(actionType, language)}{" "}
                        {translator("Amount", language)}
                      </label>
                      <span className="font-changa font-medium text-sm text-[#94A3B8] text-opacity-90">
                        {truncateNumber(
                          userTokens.find(
                            (token) =>
                              token?.mintAddress &&
                              token?.mintAddress === selectedToken?.tokenMint,
                          )?.balance ?? 0,
                          3,
                        )}{" "}
                        ${selectedToken?.tokenName}
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
                        onClick={() => {
                          let token = userTokens.find(
                            (t) => t?.mintAddress === selectedToken?.tokenMint,
                          );
                          setAmount(token?.balance ?? 0);
                        }}
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
                        ? methods.formState.errors[
                            "amount"
                          ]!.message!.toString()
                        : "NONE"}
                    </span>
                  </div>
                )} */}
                {/* wallet box  */}
                {actionType === "Deposit" && (
                  <>
                    <div className="mb-0 flex w-full flex-col">
                      <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                        {translator("Your Wallet", language)}
                      </label>

                      <div className="w-full rounded-md h-11 flex items-center justify-between bg-[#202329] px-4 py-2 text-[#94A3B8] text-sm font-chakra">
                        <span className="text-[#94A3B8] text-sm font-chakra">
                          {checked
                            ? session?.user?.wallet ?? ""
                            : "Please accept the terms."}
                        </span>
                        <FaRegCopy
                          onClick={() => copyToClipboard(session?.user?.wallet)}
                          className="w-5 h-5 text-[#555555] cursor-pointer"
                        />
                      </div>
                    </div>

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
                              <svg
                                className="text-black h-3 w-3"
                                viewBox="0 0 24 24"
                              >
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
                        className="text-[10px] xs:text-[11px] sm2:text-[12px] text-[#94A3B8] font-chakra font-bold w-[397px] h-[47px]   text-justify"
                        onClick={() => setChecked(!checked)}
                      >
                        {translator(
                          "I agree with the Privacy Policy and with the Terms of Use, Gambling is not forbidden by my local authorities and I am at least 18 years old.",
                          language,
                        )}
                      </label>
                    </div>
                  </>
                )}

                {actionType === "History" && (
                  <table className="flex w-full flex-col items-center">
                    <tr className="mb-2 flex w-full flex-row items-center gap-2 py-1 pr-[10px] text-sm font-light font-changa bg-table-secondary">
                      {historyHeaders.map((header, index) => (
                        <th
                          key={index}
                          className={`hidden sm:block w-full text-center font-changa text-[10px] font-light text-[#F0F0F0] text-opacity-75`}
                        >
                          {translator(header, language)}
                        </th>
                      ))}
                      {mobileHistoryHeaders.map((header, index) => (
                        <th
                          key={index}
                          className={`sm:hidden w-full text-center font-changa text-[10px] font-light text-[#F0F0F0] text-opacity-75`}
                        >
                          {translator(header, language)}
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
                              {truncateNumber(data.amount, 4)} {data.tokenName}
                            </td>
                            <td className="hidden sm:block w-full text-center font-changa text-xs font-light text-[#F0F0F0] text-opacity-75">
                              {data.type
                                ? translator("Deposit", language)
                                : translator("Withdraw", language)}
                            </td>
                            <td
                              className={`w-full text-center font-changa text-xs font-light ${
                                data.status === "completed"
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {data.status === "completed"
                                ? translator("Completed", language)
                                : translator("Pending", language)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <span className="flex items-center justify-center w-full text-center font-changa text-[#F0F0F080]">
                          {translator("No Data.", language)}
                        </span>
                      )}
                    </div>
                  </table>
                )}
              </form>
            </FormProvider>
          </div>
        </div>
      </AdaptiveModalContent>
    </AdaptiveModal>
  );
}
