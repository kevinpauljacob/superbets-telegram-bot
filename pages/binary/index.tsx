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
import GameFooterInfo from "@/components/games/GameFooterInfo";

const Timer = dynamic(() => import("../../components/games/Timer"), {
  ssr: false,
});
const Progress = dynamic(() => import("../../components/games/Progressbar"), {
  ssr: false,
});

export default function Binary() {
  const wallet = useWallet();
  const methods = useForm();

  const {
    walletBalance,
    setWalletBalance,
    getWalletBalance,
    getBalance,
    coinData,
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
  const [resultAmt, setResultAmt] = useState();

  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betTime, setBetTime] = useState();
  const [betEndPrice, setBetEndPrice] = useState<number>();

  const bet = async (betType: string) => {
    // toast.success("Bet Placed");
    // setRefresh(true);
    // setStrikePrice(50);
    // setLoading(false);
    // setTimeout(() => {
    //   setBetEnd(true);
    //   setBetInterval(0);
    // }, betInterval * 60000 + 400);

    setLoading(true);
    setRefresh(false);
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
      placeBet(
        wallet,
        betAmt,
        "SOL",
        betType === "up" ? true : false,
        betInterval,
      ).then((res) => {
        if (res.success) {
          // toast.success(res?.message ?? "Got result");
          setRefresh(true);
          setStrikePrice(res?.data?.strikePrice);
          setBetTime(res?.data?.betTime);
          setTimeout(
            async () => {
              setBetInterval(3);
              setBetEnd(true);

              await new Promise((r) => setTimeout(r, 2000));

              let betEndPrice = await fetch(
                `https://hermes.pyth.network/api/get_price_feed?id=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d&publish_time=${Math.floor(
                  (new Date(res?.data?.betTime).getTime() +
                    betInterval * 60000) /
                    1000,
                )}`,
              )
                .then((res) => res.json())
                .then(
                  (data) => data.price.price * Math.pow(10, data.price.expo),
                );
              setBetEndPrice(betEndPrice);
            },
            betInterval * 60000 + 400,
          );
        } else {
          setCheckResult(false);
          setBetEnd(false);
          res?.message && toast.error(res?.message);
        }
        setLoading(false);
      });
    } catch (e) {
      toast.error("Could not place bet.");
      setBetType(null);
      setCheckResult(false);
      setBetEnd(false);
      setLoading(false);
    }
  };

  const getResult = async () => {
    // setTimeout(() => {
    //   toast.success("Got Result");
    //   setLoading(false);
    //   setRefresh(true);
    //   setResult("You Won");
    // }, 5000);
    setRefresh(false);
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
            setBetType(bet.betType ? "up" : "down");
            setBetAmt(bet.betAmount);
            setBetInterval(bet.timeFrame / 60);
            setStrikePrice(bet.strikePrice);
            setBetTime(bet.betTime);
            if (new Date(bet.betEndTime!).getTime() < Date.now()) {
              await new Promise((r) => setTimeout(r, 2000));

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
    console.log("imdogefather");
    getWalletBalance();
    getBalance();
    getActiveBet();
  }, [wallet.publicKey, strikePrice]);

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
    }, 2000);

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
    console.log(data);

    if (!wallet.publicKey) toast.error("Wallet not connected");
    else {
      if (betType && betAmt !== 0 && betInterval !== 0) {
        // setBetType("up");
        await bet(betType);
      } else toast.error("Choose amount, interval and type.");
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-start px-5">
      <Head>
        <title>Fomobet</title>
      </Head>
      <div className="mt-5 w-full items-stretch bg-[#121418] rounded-2xl flex flex-row">
        {/* bet box  */}
        <div className="flex w-[35%] flex-col items-center rounded-[1.15rem] px-3 py-5 md:p-7">
          {/* <span className="mb-1 mr-4 font-changa text-xs font-medium text-[#F0F0F0] text-opacity-75">
            sol balance: {user && user.deposit[0].amount.toFixed(4)}
          </span>

          <span className="font-changa text-xl font-medium text-[#F0F0F0] text-opacity-75">
            Live Price<span className="blink_me mb-[0.15rem] ml-2"></span>
          </span>

          <div className="group relative inline-block w-[11rem]">
            <span className="text-shadow-pink  w-20 cursor-pointer font-lilita text-[2.5rem] text-[#FFFFFF] text-opacity-90">
              {livePrice ? "$" + livePrice.toFixed(4) : "_ _ _ _ _ "}
            </span>
            <div className="absolute left-[4rem] top-[3.5rem] hidden w-max rounded-[3px] bg-[#171717] p-2 text-xs font-light tracking-wider text-white group-hover:inline-block">
              sol price powered by{" "}
              <u>
                <a
                  target="_blank"
                  className="hover:text-v2-primary h-6 w-6 px-1 py-1.5 text-white/50"
                  href="https://pyth.network/price-feeds/crypto-sol-usd?cluster=pythnet"
                  rel="noopener noreferrer"
                >
                  PYTH
                </a>
              </u>
            </div>

            {strikePrice != 0 && (
              <div
                className={`absolute bottom-3.5 left-full ml-4 font-changa tracking-wider ${
                  (!betEndPrice && livePrice > strikePrice) ||
                  (betEndPrice && betEndPrice! > strikePrice)
                    ? "bg-[#0F8B62]"
                    : "bg-[#CF304A]"
                } w-max rounded-[5px] px-2 py-1 text-xs text-white text-opacity-90`}
              >
                {betEndPrice && betEndPrice != 0
                  ? betEndPrice > strikePrice
                    ? " + " + Math.abs(betEndPrice - strikePrice).toFixed(4)
                    : " - " + Math.abs(betEndPrice - strikePrice).toFixed(4)
                  : livePrice > strikePrice
                  ? " + " + Math.abs(livePrice - strikePrice).toFixed(4)
                  : " - " + Math.abs(livePrice - strikePrice).toFixed(4)}
              </div>
            )}
          </div>
          <a
            target="_blank"
            className="hover:text-v2-primary mt-2 text-xs text-white/50"
            href="https://www.tradingview.com/chart/?symbol=PYTH%3ASOLUSD"
            rel="noopener noreferrer"
          >
            <span className="flex">
              CHART
              <svg
                width="10px"
                height="10px"
                viewBox="0 0 512 512"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                className="ml-1"
              >
                <title>open-external</title>
                <g
                  id="Page-1"
                  stroke="none"
                  strokeWidth="1"
                  fill="none"
                  fillRule="evenodd"
                >
                  <g
                    id="icon"
                    fill="#FFFFFF"
                    transform="translate(85.333333, 64.000000)"
                  >
                    <path
                      d="M128,63.999444 L128,106.666444 L42.6666667,106.666667 L42.6666667,320 L256,320 L256,234.666444 L298.666,234.666444 L298.666667,362.666667 L4.26325641e-14,362.666667 L4.26325641e-14,64 L128,63.999444 Z M362.666667,1.42108547e-14 L362.666667,170.666667 L320,170.666667 L320,72.835 L143.084945,249.751611 L112.915055,219.581722 L289.83,42.666 L192,42.6666667 L192,1.42108547e-14 L362.666667,1.42108547e-14 Z"
                      id="Combined-Shape"
                    ></path>
                  </g>
                </g>
              </svg>
            </span>
          </a> */}

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
                    Available : {coinData ? coinData[0]?.amount : 0}
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
                    ? methods.formState.errors["amount"]!.message!.toString()
                    : "NONE"}
                </span>
              </div>

              {/* select interval  */}
              <div className="mb-4 flex w-full flex-col rounded-lg bg-transparent bg-opacity-10 pb-4">
                <span className="-full mb-3 text-left font-changa font-medium text-[#F0F0F0] text-opacity-75">
                  Select Interval
                </span>
                <div className="flex flex-col items-center gap-2.5 md:flex-row bg-[#0C0F16] p-4 rounded-lg">
                  <button
                    onClick={() => {
                      !betType && setBetInterval(3);
                    }}
                    className={`${
                      betInterval === 3
                        ? "border-[#7839C5]"
                        : "border-transparent hover:border-[#7839C580]"
                    } w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs text-white text-opacity-90 transition duration-200`}
                  >
                    3 Min
                  </button>
                  <button
                    onClick={() => {
                      !betType && setBetInterval(4);
                    }}
                    className={`${
                      betInterval === 4
                        ? "border-[#7839C5]"
                        : "border-transparent hover:border-[#7839C580]"
                    } w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs text-white text-opacity-90 transition duration-200`}
                  >
                    4 Min
                  </button>
                  <button
                    onClick={() => {
                      !betType && setBetInterval(5);
                    }}
                    className={`${
                      betInterval === 5
                        ? "border-[#7839C5]"
                        : "border-transparent hover:border-[#7839C580]"
                    } w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs text-white text-opacity-90 transition duration-200`}
                  >
                    5 Min
                  </button>
                </div>
              </div>

              {(!user || (coinData && coinData[0].amount < 0.1)) &&
                strikePrice == 0 && (
                  <div className="mb-5 w-full rounded-lg bg-[#0C0F16] px-3 pb-2 pt-4 text-white md:px-6">
                    <div className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
                      Please deposit funds to start playing. View{" "}
                      <Link href="/balance">
                        <u>WALLET</u>
                      </Link>
                    </div>
                  </div>
                )}

              {strikePrice != 0 ? (
                <div className="mb-0 flex w-full flex-col items-center rounded-lg bg-[#C20FC5] px-6 py-4">
                  {checkResult ? (
                    loading && !result ? (
                      <div className="flex w-full flex-col items-center">
                        <span
                          className={`mb-4 font-changa text-xl text-[#FFFFFF] text-opacity-90`}
                        >
                          Calculating.....
                        </span>
                        <span
                          className={`mb-1 w-[90%] max-w-[22rem] text-center font-changa text-sm text-[#F0F0F0] text-opacity-50`}
                        >
                          This round’s closing transaction has been submitted to
                          the blockchain, and is awaiting confirmation.
                        </span>
                      </div>
                    ) : (
                      <div className="flex w-full flex-col items-center">
                        {/* time and type  */}
                        <div className="flex w-full items-start justify-between">
                          <div className="flex flex-col items-start gap-1">
                            <Timer minutes={betInterval} betTime={betTime!} />
                            <span
                              className={`font-lilita ${
                                betType === "up"
                                  ? "text-[#0F8B62]"
                                  : "text-[#CF304A]"
                              } text-sm`}
                            >
                              {betType === "up" ? "BET UP" : "BET DOWN"}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-changa text-sm text-[#FFFFFF] text-opacity-75">
                              Price Amount
                            </span>
                            <span className="font-changa text-sm font-semibold text-[#FFFFFF] text-opacity-90">
                              {resultAmt} $SOL
                            </span>
                          </div>
                        </div>

                        {/* result  */}
                        <span
                          className={`-mt-10 mb-2.5 font-changa text-[2.2rem] text-[#FFFFFF] text-opacity-90`}
                        >
                          You {result}!
                        </span>

                        {/* bet Again */}
                        <button
                          onClick={() => {
                            setBetType(null);
                            setCheckResult(false);
                            setLoading(false);
                            setResult(null);
                            setBetEnd(false);
                            setBetInterval(3);
                            setStrikePrice(0);
                            setBetAmt(0.1);
                            setBetEndPrice(0);
                          }}
                          className="w-full rounded-[5px] border border-[#F200F21A] bg-[#F200F2] px-5 py-2 font-changa font-semibold text-white text-opacity-90 shadow-[0_5px_10px_rgba(0,0,0,0.3)]"
                        >
                          Bet Again
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex w-full flex-col items-center">
                      {/* time and type  */}
                      <div className="flex w-full items-start justify-between">
                        <div className="flex flex-col items-start gap-1">
                          <Timer minutes={betInterval} betTime={betTime!} />
                          <span
                            className={`font-lilita ${
                              betType === "up"
                                ? "text-[#0F8B62]"
                                : "text-[#CF304A]"
                            } text-sm`}
                          >
                            {betType === "up" ? "BET UP" : "BET DOWN"}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-changa text-sm text-[#FFFFFF] text-opacity-75">
                            Price Amount
                          </span>
                          <span className="font-changa text-sm font-semibold text-[#FFFFFF] text-opacity-90">
                            {betAmt} $SOL
                          </span>
                        </div>
                      </div>

                      {/* price  */}
                      <div
                        className={`flex ${
                          betEnd ? "flex-row" : "-mt-3 flex-col"
                        } mb-3 items-center`}
                      >
                        <span
                          className={`font-changa ${
                            betEnd ? "text-sm" : "text-xl"
                          } font-medium text-[#F0F0F0] text-opacity-75`}
                        >
                          Strike Price
                        </span>
                        <span
                          className={`font-changa ${
                            betEnd ? "ml-1 text-sm" : "text-[2rem]"
                          } text-[#FFFFFF] text-opacity-90`}
                        >
                          ${strikePrice.toFixed(4)}
                        </span>
                      </div>

                      {/* timer bar / check result */}
                      {betEnd ? (
                        <button
                          onClick={async () => {
                            await getResult();
                          }}
                          className="w-full rounded-[5px] border border-[#F200F21A] bg-[#F200F2] px-5 py-2 font-changa font-semibold text-white text-opacity-90 shadow-[0_5px_10px_rgba(0,0,0,0.3)]"
                        >
                          Check Result
                        </button>
                      ) : (
                        <Progress minutes={betInterval} betTime={betTime!} />
                      )}
                    </div>
                  )}
                </div>
              ) : loading && !checkResult ? (
                <div className="flex gap-2">
                  <span className="min-w-[11rem] font-changa text-xl font-medium text-[#F0F0F0] text-opacity-75">
                    Betting in Progress
                  </span>
                  <Loader />
                </div>
              ) : (
                <div className="flex w-full flex-col">
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
                      } w-full rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-lilita text-xl text-white shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]`}
                    >
                      BET UP
                    </div>
                    <div
                      onClick={() => {
                        setBetType("down");
                      }}
                      className={`${
                        betType === "down"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      } w-full rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-lilita text-xl text-white shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)] `}
                    >
                      BET DOWN
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      !user || (coinData && coinData[0].amount < 0.1)
                        ? true
                        : false
                    }
                    onClick={onSubmit}
                    className={`${
                      !user || (coinData && coinData[0].amount < 0.1)
                        ? "cursor-not-allowed opacity-70"
                        : "hover:opacity-90"
                    } w-full rounded-lg bg-[#7839C5] py-2.5 font-lilita text-xl text-white`}
                  >
                    BET
                  </button>
                </div>
              )}
            </form>
          </FormProvider>

          {/* select amount  */}
          {/* <div className="mb-5 flex w-full flex-col rounded-lg bg-[#C20FC5] bg-opacity-10 px-3 pb-4 pt-2 md:px-6">
            <span className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
              Select Amount
            </span>
            <div className="flex flex-col items-center gap-2.5 md:flex-row">
              <button
                onClick={() => {
                  !betType && setBetAmt(0.1);
                }}
                className={`${
                  betAmt === 0.1
                    ? "bg-[#F200F2]"
                    : "bg-transparent hover:bg-[#6C0671]"
                } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
              >
                0.1 $SOL
              </button>
              <button
                onClick={() => {
                  !betType && setBetAmt(2);
                }}
                className={`${
                  betAmt === 2
                    ? "bg-[#F200F2]"
                    : "bg-transparent hover:bg-[#6C0671]"
                } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
              >
                2 $SOL
              </button>
              <button
                onClick={() => {
                  !betType && setBetAmt(5);
                }}
                className={`${
                  betAmt === 5
                    ? "bg-[#F200F2]"
                    : "bg-transparent hover:bg-[#6C0671]"
                } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
              >
                5 $SOL
              </button>
            </div>
          </div> */}
        </div>

        <div className="bg-white bg-opacity-10 w-[1px]" />

        <div className="flex flex-1 flex-col items-center justify-between m-5 bg-[#0C0F16] rounded-lg p-4">
          {/* time and amt */}
          <div className="flex w-full items-start justify-between">
            <div className="flex flex-col items-start gap-1">
              <Timer minutes={betInterval} betTime={betTime!} />
            </div>
            <div className="flex flex-col items-end">
              <span className="font-changa text-sm text-[#FFFFFF] text-opacity-90">
                {strikePrice} $SOL
              </span>
              <span
                className={`font-changa ${
                  betType === "up" ? "text-[#0F8B62]" : "text-[#CF304A]"
                } text-base`}
              >
                {betType === "up" ? "BET UP" : "BET DOWN"}
              </span>
            </div>
          </div>

          {/* central loader  */}
          <div className="flex flex-col items-center">
            <span className="font-change text-sm text-white text-opacity-755 mb-5">
              $SOL
            </span>
            <span className="font-change text-2xl text-white text-opacity-90 mb-2">
              {livePrice}
            </span>
           {strikePrice && <span className={`text-sm ${livePrice-strikePrice > 0 ? "text-[#72F238]" : "text-[#CF304A]"} text-opacity-90 font-changa`}>{Math.abs(livePrice - strikePrice)}</span>}
          </div>

          <GameFooterInfo multiplier={1.33} amount={4} chance={40} />
          
        </div>
      </div>

      <Bets refresh={refresh} />
    </div>
  );
}
