import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { placeFlip } from "../../context/gameTransactions";
import HistoryTable from "../../components/games/CoinFlip/HistoryTable";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { FormProvider, useForm } from "react-hook-form";
import { useGlobalContext } from "@/components/GlobalContext";
import BetSetting from "@/components/BetSetting";
import GameHeader from "@/components/GameHeader";
import {
  GameDisplay,
  GameFooterInfo,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";

const Timer = dynamic(() => import("../../components/games/Timer"), {
  ssr: false,
});
const Progress = dynamic(() => import("../../components/games/Progressbar"), {
  ssr: false,
});

export default function Flip() {
  const wallet = useWallet();
  const methods = useForm();

  const { coinData, getBalance, getWalletBalance } = useGlobalContext();

  const [user, setUser] = useState<any>(null);
  const [betAmt, setBetAmt] = useState(0.2);
  const [betCount, setBetCount] = useState(0);
  const [betType, setBetType] = useState<string | null>(null);

  const [deposit, setDeposit] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);

  const [betSetting, setBetSetting] = useState<"manual" | "auto">("manual");

  const bet = async () => {
    try {
      console.log("Placing Flip");
      let response = await placeFlip(
        wallet,
        betAmt,
        betType === "Heads" ? "heads" : "tails",
      );
      if (response.success) {
        setTimeout(() => {
          response?.data?.result == "Won"
            ? toast.success(response?.message)
            : toast.error(response?.message);
          setResult(response?.data?.result ?? "Lost");
          setRefresh(true);
          // setLoading(false);
          setFlipping(false);
        }, 4000);
      } else {
        setBetType(null);
        setDeposit(false);
        setLoading(false);
        setFlipping(false);
        setResult(null);
        response?.message && toast.error(response?.message);
      }
    } catch (e) {
      toast.error("Could not make Flip.");
      setBetType(null);
      setDeposit(false);
      setFlipping(false);
      setLoading(false);
      setResult(null);
    }
  };

  const onSubmit = async (data: any) => {
    console.log(data);
    if (!wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    if (betAmt === 0) {
      toast.error("Set Amount.");
      return;
    }
    if (betType) {
      setLoading(true);
      setDeposit(false);
      setTimeout(() => {
        setLoading(false);
        setDeposit(true);
        bet();
      }, 2000);
    }
  };

  useEffect(() => {
    if (deposit) {
      // console.log("deposit", deposit);
      setLoading(true);
      !result && setFlipping(true);
    }
  }, [deposit]);

  // useEffect(() => {
  //   console.log("Bet type: ", betType);
  //   console.log("Others: ", loading, flipping, deposit);
  // }, [betType]);
  // useEffect(() => {
  //   console.log("load Bet type: ", betType);
  //   console.log("load Others: ", loading, flipping, deposit);
  // }, [loading]);
  // useEffect(() => {
  //   console.log("flip Bet type: ", betType);
  //   console.log("flip Others: ", loading, flipping, deposit);
  // }, [flipping]);
  // useEffect(() => {
  //   console.log("depo Bet type: ", betType);
  //   console.log("depo Others: ", loading, flipping, deposit);
  // }, [deposit]);

  useEffect(() => {
    if (refresh && wallet?.publicKey) {
      getBalance();
      getWalletBalance();
      setRefresh(false);
    }
  }, [wallet?.publicKey, refresh]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBetAmt(parseFloat(e.target.value));
  };

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBetCount(parseFloat(e.target.value));
  };

  return (
    <GameLayout title="FOMO - Coin Flip">
      <GameOptions>
        <>
          <BetSetting betSetting={betSetting} setBetSetting={setBetSetting} />

          {betSetting == "manual" ? (
            <div className="w-full flex flex-col">
              <FormProvider {...methods}>
                <form
                  className="flex w-full flex-col gap-0"
                  autoComplete="off"
                  onSubmit={methods.handleSubmit(onSubmit)}
                >
                  {/* amt input  */}
                  <div className="mb-0 flex w-full flex-col">
                    <div className="mb-1 flex w-full items-center justify-between text-sm font-changa font-medium">
                      <label className="text-[#F0F0F0] text-opacity-90">
                        Bet amount
                      </label>
                      <span className="text-[#94A3B8] text-opacity-90">
                        Available :{" "}
                        {coinData ? coinData[0]?.amount.toFixed(4) : 0}
                      </span>
                    </div>

                    <div
                      className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
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
                        value={betAmt}
                        className={`flex w-full min-w-0 bg-transparent text-base text-white font-chakra placeholder-white  placeholder-opacity-40 outline-none`}
                      />
                      <span
                        className="bg-[#D9D9D9] bg-opacity-5 py-1 px-1.5 rounded text-xs font-semibold text-[#F0F0F0] text-opacity-50"
                        onClick={() =>
                          setBetAmt(coinData ? coinData[0]?.amount : 0)
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
                        ? methods.formState.errors[
                            "amount"
                          ]!.message!.toString()
                        : "NONE"}
                    </span>
                  </div>

                  {/* balance alert  */}
                  {(!coinData || (coinData && coinData[0].amount < 0.0001)) && (
                    <div className="mb-5 w-full rounded-lg bg-[#0C0F16] px-3 pb-2 pt-4 text-white md:px-6">
                      <div className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
                        Please deposit funds to start playing. View{" "}
                        <Link href="/balance">
                          <u>WALLET</u>
                        </Link>
                      </div>
                    </div>
                  )}
                </form>
                {/* choosing bet options  */}
                <div className="flex flex-col w-full gap-4">
                  <div className="flex w-full flex-row mb-4 gap-3">
                    {/* buttons  */}
                    <div
                      onClick={() => {
                        setBetType("Heads");
                      }}
                      className={`${
                        betType === "Heads"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      } w-full rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]`}
                    >
                      Heads
                    </div>
                    <div
                      onClick={() => {
                        setBetType("Tails");
                      }}
                      className={`${
                        betType === "Tails"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      } w-full rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)] `}
                    >
                      Tails
                    </div>
                  </div>

                  {betType && loading ? (
                    <div className="mb-0 flex w-full flex-col items-center rounded-lg bg-[#202329] px-4 pb-4 pt-2">
                      {deposit ? (
                        flipping ? (
                          // while getting flip result
                          <div className="flex w-full flex-col items-center justify-center">
                            <Image
                              src={"/assets/coin.png"}
                              width={50}
                              height={50}
                              alt=""
                              className="rotate mb-2"
                            />
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              Deposit Confirmed
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              Flipping the coin...
                            </span>
                          </div>
                        ) : (
                          // after getting flip result
                          <div className="flex w-full flex-col items-center justify-center">
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              {result && result === "Won"
                                ? "yay..."
                                : "ooops..."}
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              {result && result === "Won"
                                ? "You Won!"
                                : "You Lost!"}
                            </span>
                            <button
                              onClick={() => {
                                setBetType(null);
                                setLoading(false);
                                setResult(null);
                                setDeposit(false);
                                setFlipping(false);
                                setBetAmt(0);
                              }}
                              className="mt-2 w-full rounded-[5px] bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] px-5 py-2 font-changa font-semibold text-white text-opacity-90 shadow-[0_5px_10px_rgba(0,0,0,0.3)]"
                            >
                              Bet Again
                            </button>
                          </div>
                        )
                      ) : (
                        loading && (
                          // when making bet request
                          <div className="flex w-full flex-col items-center justify-center">
                            <Image
                              src={"/assets/coin.png"}
                              width={50}
                              height={50}
                              alt=""
                              className="rotate mb-2"
                            />
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              preparing for flip
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              Confirming deposit...
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={
                        !betType || (coinData && coinData[0].amount < 0.0001)
                          ? true
                          : false
                      }
                      onClick={onSubmit}
                      className={`${
                        !betType || (coinData && coinData[0].amount < 0.0001)
                          ? "cursor-not-allowed opacity-70"
                          : "hover:opacity-90"
                      } w-full rounded-lg bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] py-2.5 font-changa text-xl text-white`}
                    >
                      BET
                    </button>
                  )}
                </div>
              </FormProvider>
            </div>
          ) : (
            <div className="w-full flex flex-col">
              <FormProvider {...methods}>
                <form
                  className="flex w-full flex-col gap-0"
                  autoComplete="off"
                  onSubmit={methods.handleSubmit(onSubmit)}
                >
                  <div className="mb-0 flex w-full flex-col">
                    <div className="mb-1 flex w-full items-center justify-between">
                      <label className="text-xs text-[#F0F0F0] text-opacity-75">
                        Bet amount
                      </label>
                      <span className="text-sm text-[#F0F0F0] text-opacity-75">
                        Available :{" "}
                        {coinData ? coinData[0]?.amount.toFixed(4) : 0}
                      </span>
                    </div>

                    <div
                      className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
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
                        value={betAmt}
                        className={`flex w-full min-w-0 bg-transparent text-sm text-white placeholder-white  placeholder-opacity-40 outline-none`}
                      />
                      <span
                        className="bg-[#D9D9D9] bg-opacity-5 py-1 px-1.5 rounded text-sm text-[#F0F0F0] text-opacity-75"
                        onClick={() =>
                          setBetAmt(coinData ? coinData[0]?.amount : 0)
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
                        ? methods.formState.errors[
                            "amount"
                          ]!.message!.toString()
                        : "NONE"}
                    </span>
                  </div>
                  <div className="w-full flex flex-row items-end gap-3">
                    <div className="mb-0 flex w-full flex-col">
                      <div className="mb-1 flex w-full items-center justify-between">
                        <label className="text-xs text-[#F0F0F0] text-opacity-75">
                          Number of Bets
                        </label>
                        {/* <span className="text-sm text-[#F0F0F0] text-opacity-75">
                Available : {coinData ? coinData[0]?.amount.toFixed(4) : 0}
              </span> */}
                      </div>

                      <div
                        className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
                      >
                        <input
                          id={"count-input"}
                          {...methods.register("betCount", {
                            required: "Bet count is required",
                          })}
                          type={"number"}
                          step={"any"}
                          autoComplete="off"
                          onChange={handleCountChange}
                          placeholder={"00"}
                          value={betCount}
                          className={`flex w-full min-w-0 bg-transparent text-sm text-white placeholder-white  placeholder-opacity-40 outline-none`}
                        />
                        <span
                          className="bg-[#D9D9D9] bg-opacity-5 py-1 px-1.5 rounded text-sm text-[#F0F0F0] text-opacity-75"
                          onClick={() =>
                            setBetCount(coinData ? coinData[0]?.amount : 0)
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
                          ? methods.formState.errors[
                              "amount"
                            ]!.message!.toString()
                          : "NONE"}
                      </span>
                    </div>
                    <div className="mb-[1.4rem] rounded-md w-full h-11 flex items-center justify-center opacity-75 cursor-pointer text-white text-opacity-90 border-2 border-white bg-white bg-opacity-0 hover:bg-opacity-5">
                      Configure Auto
                    </div>
                  </div>
                </form>
                {/* choosing bet options  */}
                <div className="flex flex-col w-full gap-4">
                  <div className="flex w-full flex-row mb-4 gap-3">
                    {/* buttons  */}
                    <div
                      onClick={() => {
                        setBetType("Heads");
                      }}
                      className={`${
                        betType === "Heads"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      } w-full rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]`}
                    >
                      Heads
                    </div>
                    <div
                      onClick={() => {
                        setBetType("Tails");
                      }}
                      className={`${
                        betType === "Tails"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      } w-full rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)] `}
                    >
                      Tails
                    </div>
                  </div>

                  {betType && loading ? (
                    <div className="mb-0 flex w-full flex-col items-center rounded-lg bg-[#C20FC5] bg-opacity-10 px-4 pb-4 pt-2">
                      {deposit ? (
                        flipping ? (
                          // while getting flip result
                          <div className="flex w-full flex-col items-center justify-center">
                            <Image
                              src={"/assets/coin.png"}
                              width={50}
                              height={50}
                              alt=""
                              className="rotate mb-2"
                            />
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              Deposit Confirmed
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              Flipping the coin...
                            </span>
                          </div>
                        ) : (
                          // after getting flip result
                          <div className="flex w-full flex-col items-center justify-center">
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              {result && result === "Won"
                                ? "yay..."
                                : "ooops..."}
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              {result && result === "Won"
                                ? "You Won!"
                                : "You Lost!"}
                            </span>
                            <button
                              onClick={() => {
                                setBetType(null);
                                setLoading(false);
                                setResult(null);
                                setDeposit(false);
                                setFlipping(false);
                                setBetAmt(0);
                              }}
                              className="mt-2 w-full rounded-[5px] border border-[#F200F21A] bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] px-5 py-2 font-changa font-semibold text-white text-opacity-90 shadow-[0_5px_10px_rgba(0,0,0,0.3)]"
                            >
                              Bet Again
                            </button>
                          </div>
                        )
                      ) : (
                        loading && (
                          // when making bet request
                          <div className="flex w-full flex-col items-center justify-center">
                            <Image
                              src={"/assets/coin.png"}
                              width={50}
                              height={50}
                              alt=""
                              className="rotate mb-2"
                            />
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              preparing for flip
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              Confirming deposit...
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={
                        !betType || (coinData && coinData[0].amount < 0.0001)
                          ? true
                          : false
                      }
                      onClick={onSubmit}
                      className={`${
                        !betType || (coinData && coinData[0].amount < 0.0001)
                          ? "cursor-not-allowed opacity-70"
                          : "hover:opacity-90"
                      } w-full rounded-lg bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] py-2.5 font-lilita text-xl text-white`}
                    >
                      BET
                    </button>
                  )}
                </div>
              </FormProvider>
            </div>
          )}
        </>
      </GameOptions>
      <GameDisplay>
        <>
          <div
            className={`${
              betType && loading ? "opacity-100" : "opacity-0"
            } w-full flex items-center justify-between`}
          >
            <span className="font-changa text-sm text-[#f0f0f0] text-opacity-75">
              {deposit
                ? flipping
                  ? "Flipping..."
                  : result && result === "Won"
                  ? "You Won!"
                  : "You Lost!"
                : "Loading"}
            </span>
            <div className="flex gap-3">
              <span
                className={`px-4 py-1 ${
                  deposit
                    ? flipping
                      ? "border-transparent text-white"
                      : result && result === "Won"
                      ? "border-[#72F238] text-[#72F238]"
                      : "border-[#D92828] text-[#D92828]"
                    : "border-transparent text-white"
                } text-xs border-2 bg-[#282E3D] rounded`}
              >
                {betAmt}
              </span>
              <span className="text-xs px-4 py-1 bg-[#282E3D] text-white rounded">
                1.0x
              </span>
            </div>
          </div>

          <div className="w-20 h-20 md:w-40 md:h-40 relative mb-10">
            <Image
              src={"/assets/coin.png"}
              layout="fill"
              objectFit="contain"
              objectPosition="center"
              alt=""
              className={`${betType && loading && !result ? "rotate" : ""}`}
            />
          </div>
          <GameFooterInfo multiplier={1.0} amount={betAmt} chance={50} />
        </>
      </GameDisplay>
      <GameTable>
        <HistoryTable refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
