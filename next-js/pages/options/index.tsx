import Bets from "../../components/games/Bets";
import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import Loader from "../../components/games/Loader";
import { placeBet } from "../../context/gameTransactions";
import { checkResult as checkResultAPI } from "../../context/gameTransactions";
import Head from "next/head";
import Link from "next/link";
import { useGlobalContext } from "@/components/GlobalContext";
import { FormProvider, useForm } from "react-hook-form";
import GameHeader from "@/components/GameHeader";
import {
  GameDisplay,
  GameLayout,
  GameOptions,
  GameFooterInfo,
  GameTable,
} from "@/components/GameLayout";

const Timer = dynamic(() => import("../../components/games/Timer"), {
  ssr: false,
});
const Progress = dynamic(() => import("../../components/games/Progressbar"), {
  ssr: false,
});

export default function Options() {
  const wallet = useWallet();
  const methods = useForm();

  const {
    walletBalance,
    setWalletBalance,
    getWalletBalance,
    getBalance,
    coinData,
    setShowWalletModal,
  } = useGlobalContext();

  const [livePrice, setLivePrice] = useState(0);
  const [user, setUser] = useState<any>();
  const [strikePrice, setStrikePrice] = useState(0);
  const [betInterval, setBetInterval] = useState(3);
  const [betAmt, setBetAmt] = useState(0.1);
  const [betType, setBetType] = useState<string | null>(null);

  const [betEnd, setBetEnd] = useState(false);
  const [checkResult, setCheckResult] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultAmt, setResultAmt] = useState<number>();

  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betTime, setBetTime] = useState();
  const [betEndPrice, setBetEndPrice] = useState<number>();

  const [timeLeft, setTimeLeft] = useState(
    betTime
      ? new Date(betTime).getTime() + betInterval * 60000 - Date.now()
      : 0,
  );

  const getResult = async () => {
    setLoading(true);
    setCheckResult(true);
    try {
      // console.log("Checking Result");
      checkResultAPI(wallet).then((res) => {
        if (res.success) {
          res?.data?.result == "Won"
            ? toast.success(res?.message)
            : toast.error(res?.message);
          setResult(res?.data?.result);
          setResultAmt(
            res?.data?.result == "Won"
              ? res?.data?.amountWon
              : res?.data?.amountLost,
          );
          setRefresh(true);
        } else {
          setResult(null);
          setCheckResult(false);
          res?.message && toast.error(res?.message);
        }
        setLoading(false);
      });
    } catch (e) {
      toast.error("Could not fetch result.");
      setResult(null);
      setCheckResult(false);
      setLoading(false);
    }
  };

  const bet = async (betType: string) => {
    setLoading(true);
    setCheckResult(false);
    try {
      // console.log("Placing bet");

      if (betAmt > coinData![0].amount) {
        toast.error("Insufficient balance to place bet");
        setBetType(null);
        setCheckResult(false);
        setBetEnd(false);
        setLoading(false);
        return;
      }
      let res = await placeBet(
        wallet,
        betAmt,
        "SOL",
        betType === "up" ? "betUp" : "betDown",
        betInterval,
      );
      if (res.success) {
        toast.success(res?.message ?? "Bet placed");
        setRefresh(true);
        setStrikePrice(res?.data?.strikePrice);
        setBetTime(res?.data?.betTime);
        setTimeLeft(
          new Date(res?.data?.betTime).getTime() +
            betInterval * 60000 -
            Date.now(),
        );
        setTimeout(async () => {
          // console.log("ending the bet")
          // setBetInterval(3);
          setBetEnd(true);
          setCheckResult(true);

          // await new Promise((r) => setTimeout(r, 2000));

          let betEndPrice = await fetch(
            `https://hermes.pyth.network/api/get_price_feed?id=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d&publish_time=${Math.floor(
              (new Date(res?.data?.betTime).getTime() + betInterval * 60000) /
                1000,
            )}`,
          )
            .then((res) => res.json())
            .then((data) => data.price.price * Math.pow(10, data.price.expo));
          setBetEndPrice(betEndPrice);
          getResult();
        }, betInterval * 60000);
      } else {
        setCheckResult(false);
        setBetEnd(false);
        setLoading(false);
        res?.message && toast.error(res?.message);
      }
    } catch (e) {
      toast.error("Could not place bet.");
      setBetType(null);
      setCheckResult(false);
      setBetEnd(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(betEnd, checkResult, loading);
  }, [betEnd, checkResult, loading]);

  const getActiveBet = async () => {
    if (!wallet || !wallet.publicKey) return;
    setLoading(true);
    try {
      fetch(
        `/api/games/options/getActiveBet?wallet=${wallet.publicKey?.toBase58()}`,
      )
        .then((res) => res.json())
        .then(async (bets) => {
          let bet = bets.data;
          if (bets.success && bet && bet.result === "Pending") {
            setBetType(bet?.betType === "betUp" ? "up" : "down");
            setBetAmt(bet?.amount);
            setBetInterval(bet?.timeFrame / 60);
            setStrikePrice(bet?.strikePrice);
            setBetTime(bet?.betTime);
            setTimeLeft(
              new Date(bet?.betTime).getTime() +
                betInterval * 60000 -
                Date.now(),
            );
            if (new Date(bet.betEndTime!).getTime() < Date.now()) {
              // await new Promise((r) => setTimeout(r, 2000));

              setBetEnd(true);
              setCheckResult(true);

              let betEndPrice = await fetch(
                `https://hermes.pyth.network/api/get_price_feed?id=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d&publish_time=${Math.floor(
                  new Date(bet.betEndTime).getTime() / 1000,
                )}`,
              )
                .then((res) => res.json())
                .then(
                  (data) => data.price.price * Math.pow(10, data.price.expo),
                );
              setBetEndPrice(betEndPrice);
              getResult();
            }
            setBetEnd(new Date(bet.betEndTime!).getTime() < Date.now());
          }
          setLoading(false);
        });
    } catch (e) {
      setLoading(false);
      console.error(e);
    }
  };

  useEffect(() => {
    if (refresh && wallet?.publicKey) {
      getBalance();
      getWalletBalance();
      setRefresh(false);
    }
  }, [wallet?.publicKey, refresh]);

  useEffect(() => {
    getActiveBet();
  }, [wallet.publicKey]);

  useEffect(() => {
    let intervalId = setInterval(async () => {
      try {
        let data = await fetch(
          "https://hermes.pyth.network/api/latest_price_feeds?ids%5B%5D=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
        ).then((res) => res.json());
        let price = data[0].price.price * Math.pow(10, data[0].price.expo);
        setLivePrice(price);
      } catch (e) {
        toast.error("Could not fetch live price.");
        setLivePrice(0);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // useEffect(() => {
  //   if (wallet.publicKey) {
  //     fetch(`/api/games/user/getUser?wallet=${wallet.publicKey?.toBase58()}`)
  //       .then((res) => res.json())
  //       .then((user) => {
  //         // console.log(user.data);
  //         setUser(user.data);
  //       });
  //   }
  // }, [wallet.publicKey, strikePrice]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBetAmt(parseFloat(e.target.value));
  };

  const onSubmit = async (data: any) => {
    console.log(betAmt, betType, betInterval);

    if (result) {
      setBetType(null);
      setCheckResult(false);
      setLoading(false);
      setResult(null);
      setBetEnd(false);
      setBetInterval(3);
      setStrikePrice(0);
      setBetAmt(0.1);
      setBetEndPrice(0);
      return;
    } else {
      if (!wallet.publicKey) toast.error("Wallet not connected");
      else {
        if (betType && betAmt !== 0 && betInterval !== 0) {
          // setBetType("up");
          await bet(betType);
        } else toast.error("Choose amount, interval and type.");
      }
    }
  };

  // for circle loader

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = timeLeft - 1000;
      setTimeLeft((prev) => prev - 1000);

      // console.log(remaining);
      if (remaining <= 0 && (betEnd || (!betEnd && betTime !== undefined))) {
        setTimeLeft(0);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [betTime]);

  return (
    <GameLayout title="FOMO - Binary Options">
      <GameOptions>
        <FormProvider {...methods}>
          <form
            className="flex w-full flex-col gap-0"
            autoComplete="off"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            {/* mobile button  */}
            <div className="flex md:hidden w-full flex-col mb-5">
              <button
                type="submit"
                disabled={
                  !coinData ||
                  (coinData && coinData[0].amount < 0.0001) ||
                  loading ||
                  (strikePrice > 0 && !result)
                    ? true
                    : false
                }
                onClick={onSubmit}
                className={`${
                  !coinData || (coinData && coinData[0].amount < 0.0001)
                    ? "cursor-not-allowed opacity-70"
                    : "hover:opacity-90"
                } w-full rounded-lg transition-all bg-[#7839C5] disabled:bg-[#4b2876] hover:bg-[#9361d1] focus:bg-[#602E9E] py-2.5 font-changa font-semibold text-[1.75rem] text-white`}
              >
                {loading || (strikePrice > 0 && !result) ? (
                  <Loader />
                ) : result ? (
                  "BET AGAIN"
                ) : (
                  "BET"
                )}
              </button>
            </div>

            <div className="mb-0 flex w-full flex-col">
              <div className="mb-1 flex w-full items-center justify-between text-sm font-changa text-opacity-90">
                <label className="text-white/90 font-medium font-changa">
                  Bet Amount
                </label>
                <span className="text-[#94A3B8] text-opacity-90 font-changa font-medium text-sm">
                  {coinData ? coinData[0]?.amount.toFixed(4) : 0} $SOL
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
                  value={betAmt}
                  className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8]  font-chakra placeholder-opacity-40 outline-none`}
                />
                <span
                  className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-1.5 px-4"
                  onClick={() =>
                    setBetAmt(coinData ? coinData[0]?.amount / 4 : 0)
                  }
                >
                  1/4
                </span>
                <span
                  className="text-xs mx-2 font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-1.5 px-4"
                  onClick={() =>
                    setBetAmt(coinData ? coinData[0]?.amount / 2 : 0)
                  }
                >
                  Half
                </span>
                <span
                  className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-1.5 px-4"
                  onClick={() => setBetAmt(coinData ? coinData[0]?.amount : 0)}
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

            {/* select interval  */}
            <div className="mb-4 flex w-full flex-col rounded-lg bg-transparent bg-opacity-10">
              <span className="mb-1 text-sm text-white/90 font-medium font-changa">
                Select Interval
              </span>
              <div className="flex flex-row items-center gap-2.5 md:flex-row bg-[#0C0F16] p-2 md:p-4 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    !loading && setBetInterval(3);
                  }}
                  className={`${
                    betInterval === 3
                      ? "border-[#7839C5]"
                      : "border-transparent hover:border-[#7839C580]"
                  } w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200`}
                >
                  3 Min
                </button>
                <button
                  type="button"
                  onClick={() => {
                    !loading && setBetInterval(4);
                  }}
                  className={`${
                    betInterval === 4
                      ? "border-[#7839C5]"
                      : "border-transparent hover:border-[#7839C580]"
                  } w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200`}
                >
                  4 Min
                </button>
                <button
                  type="button"
                  onClick={() => {
                    !loading && setBetInterval(5);
                  }}
                  className={`${
                    betInterval === 5
                      ? "border-[#7839C5]"
                      : "border-transparent hover:border-[#7839C580]"
                  } w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200`}
                >
                  5 Min
                </button>
              </div>
            </div>

            {(!coinData || (coinData && coinData[0].amount < 0.0001)) &&
              strikePrice == 0 && (
                <div className="mb-5 w-full rounded-lg bg-[#0C0F16] p-2 text-white md:px-6">
                  <div className="-full text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
                    Please deposit funds to start playing. View{" "}
                    <u
                      onClick={() => {
                        setShowWalletModal(true);
                      }}
                    >
                      WALLET
                    </u>
                  </div>
                </div>
              )}

            <div className="flex w-full flex-row mb-4 gap-3">
              {/* buttons  */}
              <div
                onClick={() => {
                  setBetType("up");
                }}
                className={`${
                  betType === "up"
                    ? "border-[#7839C5]"
                    : "border-transparent hover:border-[#7839C580]"
                } w-full rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]`}
              >
                UP
              </div>
              <div
                onClick={() => {
                  setBetType("down");
                }}
                className={`${
                  betType === "down"
                    ? "border-[#7839C5]"
                    : "border-transparent hover:border-[#7839C580]"
                } w-full rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)] `}
              >
                DOWN
              </div>
            </div>

            {/* lap  button  */}
            <div className="hidden md:flex w-full flex-col mt-2">
              <button
                type="submit"
                disabled={
                  !betType ||
                  !coinData ||
                  (coinData && coinData[0].amount < 0.0001) ||
                  loading ||
                  (strikePrice > 0 && !result)
                    ? true
                    : false
                }
                onClick={onSubmit}
                className={`${
                  !betType ||
                  !coinData ||
                  (coinData && coinData[0].amount < 0.0001)
                    ? "cursor-not-allowed opacity-70"
                    : "hover:opacity-90"
                } w-full h-[3.75rem] rounded-lg transition-all bg-[#7839C5] disabled:bg-[#4b2876] hover:bg-[#9361d1] focus:bg-[#602E9E] flex items-center justify-center font-changa font-semibold text-[1.75rem] text-white`}
              >
                {loading || (strikePrice > 0 && !result) ? (
                  <Loader />
                ) : result ? (
                  "BET AGAIN"
                ) : (
                  "BET"
                )}
              </button>
            </div>
          </form>
        </FormProvider>
      </GameOptions>
      <GameDisplay>
        <>
          {/* time and amt */}
          <div className={`flex w-full items-start justify-between h-11`}>
            <div
              className={`flex flex-col items-start text-xs md:text-sm font-chakra font-medium text-[#f0f0f0] test-opacity-75`}
            >
              <Timer minutes={betInterval} betTime={betTime!} />
              {strikePrice === 0
                ? loading && !checkResult
                  ? "Placing bet..."
                  : ""
                : checkResult
                ? loading && !result
                  ? "Checking result..."
                  : ""
                : (timeLeft * 50) / (betInterval * 60000) <= 0
                ? "Checking result..."
                : ""}
            </div>
            <div className="flex flex-col items-end">
              <span className="font-chakra font-medium text-xs md:text-sm text-[#F0F0F0] text-opacity-75">
                ${strikePrice.toFixed(3)}
              </span>
              <span
                className={`font-chakra ${
                  betType === "up" ? "text-[#72F238]" : "text-[#CF304A]"
                } text-xs md:text-base font-bold`}
              >
                {betType ? (betType === "up" ? "BET UP" : "BET DOWN") : ""}
              </span>
            </div>
          </div>

          {/* central loader  */}
          <div className="flex flex-1 flex-col justify-center items-center relative py-4 mb-6 md:mb-6">
            <div className="flex flex-col items-center absolute w-[14rem] h-[14rem] justify-start pt-14">
              <span className="font-chakra text-sm text-[#94A3B8] text-opacity-75 mb-5">
                $SOL
              </span>
              <span className="font-chakra text-2xl text-white font-semibold text-opacity-90 mb-2">
                ${livePrice.toFixed(3)}
              </span>
              {strikePrice && !result ? (
                <span
                  className={`text-sm ${
                    livePrice - strikePrice > 0
                      ? "text-[#72F238]"
                      : "text-[#CF304A]"
                  } text-opacity-90 font-chakra`}
                >
                  {livePrice - strikePrice > 0 ? "+" : "-"}
                  {Math.abs(livePrice - strikePrice).toFixed(4)}
                </span>
              ) : (
                <span
                  className={`flex text-sm font-chakra font-medium ${
                    result
                      ? result === "Won"
                        ? "text-[#72F238]"
                        : "text-[#CF304A]"
                      : "text-[#f0f0f0] test-opacity-75"
                  }`}
                >
                  {result ? (result === "Won" ? "You Won!" : "You Lost!") : ""}
                </span>
              )}
            </div>
            <div className="w-[14rem] h-[14rem] relative transform -rotate-90">
              {[...Array(50)].map((item, index) => (
                <div
                  key={index}
                  className={`w-[6.5rem] h-2 flex justify-end absolute top-[50%] left-[50%] origin-[0_0px] bg-transparent`}
                  style={{ rotate: `${(360 / 50) * index}deg` }}
                >
                  <div
                    className={`w-[9px] h-[6px] ${
                      strikePrice === 0
                        ? loading && !checkResult
                          ? "blink_1_50 bg-white"
                          : "blink_3 bg-[#282E3D]"
                        : checkResult
                        ? loading && !result
                          ? "blink_1_50 bg-white"
                          : result === "Won"
                          ? "bg-[#72F238] bg-opacity-20 blink_3"
                          : "bg-[#CF304A] bg-opacity-20 blink_3"
                        : betEnd
                        ? "blink_1_50 bg-white"
                        : index >= (timeLeft * 50) / (betInterval * 60000)
                        ? (timeLeft * 50) / (betInterval * 60000) <= 0
                          ? "blink_1_50 bg-white"
                          : "bg-[#282E3D]"
                        : timeLeft / (betInterval * 60000) < 0.25
                        ? `bg-[#CF304A] blink_1 ${
                            index >= (timeLeft * 50) / (betInterval * 60000) - 1
                              ? "blink_1"
                              : ""
                          }`
                        : `bg-[#D9D9D9] ${
                            index >= (timeLeft * 50) / (betInterval * 60000) - 1
                              ? "blink_1"
                              : ""
                          }`
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
          <GameFooterInfo multiplier={2.0} amount={betAmt ?? 0} />
        </>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
