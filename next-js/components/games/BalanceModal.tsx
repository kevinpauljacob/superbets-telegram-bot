import { useWallet } from "@solana/wallet-adapter-react";
import React, { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  connection,
  obfuscatePubKey,
  translator,
} from "@/context/transactions";
import {
  deposit,
  truncateNumber,
  withdraw,
} from "../../context/gameTransactions";
import Loader from "./Loader";
import { useGlobalContext } from "../GlobalContext";
import { IoCloseOutline } from "react-icons/io5";
import Image from "next/image";
import { timestampParser } from "@/utils/timestampParser";
import { useRouter } from "next/router";
import { SPL_TOKENS, spl_token } from "@/context/config";
import { Connection, ParsedAccountData, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export default function BalanceModal() {
  const methods = useForm();
  const wallet = useWallet();

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

  const onSubmit = async (data: any) => {
    if (!loading) {
      setLoading(true);
      // console.log("Form Data:", data);
      let response: { success: boolean; message: string };

      try {
        if (actionType === "Deposit")
          response = await deposit(
            wallet,
            amount,
            selectedToken.tokenMint,
            campaignId,
          );
        else response = await withdraw(wallet, amount, selectedToken.tokenMint);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setAmount(Math.abs(parseFloat(e.target.value)));
  };

  const modalRef: any = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowWalletModal(false);
      }
    };

    if (showWalletModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showWalletModal]);

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

      console.log(`Token Mint: ${mintAddress}, Balance: ${balance}`);
      return { mintAddress, balance };
    });

    return results;
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (wallet && wallet.publicKey && showWalletModal) {
      const fetchAndUpddateToken = () => {
        getTokenAccounts(wallet.publicKey!, connection)
          .then((tokens) => {
            console.log("gill", tokens);
            setUserTokens([
              {
                mintAddress: "SOL",
                balance: walletBalance,
              },
              ...tokens,
            ]);
          })
          .catch(console.error);
      };
      fetchAndUpddateToken();
      intervalId = setInterval(fetchAndUpddateToken, 5000);

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [wallet, showWalletModal]);

  return (
    <div className="absolute z-[150] left-0 top-0 flex h-full w-full items-center justify-center bg-[#33314680] backdrop-blur-[0px] transition-all">
      <div
        id="modal-box"
        ref={modalRef}
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
            className={`w-full border-2 rounded-md py-2 text-white font-semibold text-xs sm:text-sm transition hover:duration-75 ease-in-out flex items-center justify-center gap-1 ${
              actionType === "History"
                ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
                : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
            }`}
            onClick={() => setActionType("History")}
          >
            {translator("History", language)}
            {historyData.length > 0 && (
              <div className="bg-[#EFA411] bg-opacity-10 text-[#EFA411] text-[0.625rem] font-sans font-semibold w-5 min-h-5 rounded-full">
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
            {actionType !== "History" && (
              <div className="relative mb-0 flex w-full flex-col rounded-md">
                <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90 ">
                  {translator("Coin", language)}
                </label>

                <span
                  className="w-full rounded-md h-11 flex items-center bg-[#202329] px-4 py-2 text-[#94A3B8] text-base font-chakra gap-2 cursor-pointer"
                  onClick={() => setIsSelectModalOpen(!isSelectModalOpen)}
                >
                  <selectedToken.icon className="w-6 h-6" />
                  <span>{selectedToken.tokenName}</span>
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
                  <div className="absolute z-[100] top-[calc(100%+10px)] left-0 w-full bg-[#202329] rounded-md shadow-md">
                    {SPL_TOKENS.map((token, index) => (
                      <div
                        key={index}
                        className="w-full h-11 flex flex-row items-center bg-[#202329] px-4 py-2 text-[#94A3B8] text-base font-chakra gap-2 cursor-pointer hover:bg-[#292C32] rounded-md"
                        onClick={() => {
                          setSelectedToken(token);
                          setIsSelectModalOpen(false);
                        }}
                      >
                        <token.icon className="" />
                        <span>{token.tokenName}</span>
                        <div className="grow" />
                        <span className="text-gray-400">
                          {actionType === "Deposit" &&
                            truncateNumber(
                              userTokens.find(
                                (t) => t.mintAddress === token.tokenMint,
                              )?.balance ?? 0,
                            )}
                          {actionType === "Withdraw" &&
                            truncateNumber(
                              coinData?.find(
                                (coin) => coin.tokenMint === token.tokenMint,
                              )?.amount ?? 0,
                            )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                    {truncateNumber(
                      coinData?.find(
                        (coin) => coin.tokenMint === selectedToken.tokenMint,
                      )?.amount ?? 0,
                    )}{" "}
                    ${selectedToken.tokenName}
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
                    placeholder={"00.00"}
                    value={amount}
                    className={`flex w-full min-w-0 bg-transparent text-sm text-[#94A3B8] placeholder-[#94A3B8]  placeholder-opacity-40 outline-none`}
                  />
                  <span
                    className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] mr-2 py-1.5 px-4"
                    onClick={() => {
                      let bal =
                        coinData?.find(
                          (coin) => coin.tokenMint === selectedToken.tokenMint,
                        )?.amount ?? 0;
                      if (!amount || amount === 0) setAmount(bal / 2);
                      else setAmount(amount / 2);
                    }}
                  >
                    {translator("Half", language)}
                  </span>
                  <span
                    className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-1.5 px-4"
                    onClick={() => {
                      let bal =
                        coinData?.find(
                          (coin) => coin.tokenMint === selectedToken.tokenMint,
                        )?.amount ?? 0;
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
                    {truncateNumber(
                      userTokens.find(
                        (token) =>
                          token.mintAddress === selectedToken.tokenMint,
                      )?.balance ?? 0,
                      3,
                    )}{" "}
                    ${selectedToken.tokenName}
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
                      setAmount(
                        userTokens.find(
                          (t) => t.mintAddress === selectedToken.tokenMint,
                        )!.balance,
                      );
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
      </div>
    </div>
  );
}
