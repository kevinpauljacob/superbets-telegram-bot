import Bets from "../../components/games/Bets";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Loader from "../../components/games/Loader";
import {
  checkResult as checkResultAPI,
  formatNumber,
  placeBet,
  translator,
  truncateNumber,
} from "../../context/transactions";
import { useGlobalContext } from "@/components/GlobalContext";
import { FormProvider, useForm } from "react-hook-form";
import {
  GameDisplay,
  GameLayout,
  GameOptions,
  GameFooterInfo,
  GameTable,
} from "@/components/GameLayout";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import { soundAlert } from "@/utils/soundUtils";
import { errorCustom, successCustom } from "@/components/toasts/ToastGroup";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { GameType } from "@/utils/provably-fair";

const Timer = dynamic(() => import("../../components/games/Timer"), {
  ssr: false,
});
const Progress = dynamic(() => import("../../components/games/Progressbar"), {
  ssr: false,
});

export default function Options() {
  const methods = useForm();
  const router = useRouter();

  const checkBetRef = useRef<NodeJS.Timeout | null>(null);

  const {
    getBalance,
    coinData,
    setShowWalletModal,
    maxBetAmt,
    language,
    selectedCoin,
    enableSounds,
    updatePNL,
    session,
    status,
  } = useGlobalContext();

  const [livePrice, setLivePrice] = useState(0);
  const [user, setUser] = useState<any>();
  const [strikePrice, setStrikePrice] = useState(0);
  const [betInterval, setBetInterval] = useState(3);
  const [betAmt, setBetAmt] = useState<number | undefined>();
  const [betType, setBetType] = useState<string | null>(null);

  const [betEnd, setBetEnd] = useState(false);
  const [checkResult, setCheckResult] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultAmt, setResultAmt] = useState<number>();

  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betTime, setBetTime] = useState();
  const [betResults, setBetResults] = useState<
    { result: number; win: boolean }[]
  >([]);

  const [timeLeft, setTimeLeft] = useState(
    betTime
      ? new Date(betTime).getTime() + betInterval * 60000 - Date.now()
      : 0,
  );

  const handleBeforeUnload = () => {
    if (checkBetRef.current) {
      // console.log("clearing", checkBetRef);
      clearTimeout(checkBetRef.current);
    }
  };

  useEffect(() => {
    router.events.on("routeChangeStart", handleBeforeUnload);

    return () => {
      router.events.off("routeChangeStart", handleBeforeUnload);
      if (checkBetRef.current) {
        clearTimeout(checkBetRef.current);
      }
    };
  }, [router.events]);

  const getResult = async () => {
    setLoading(true);
    setCheckResult(true);
    try {
      let res = await checkResultAPI(session);
      if (res.success) {
        if (res?.data?.result == "Won") {
          successCustom(
            translator(res?.message, language) +
              ` ${formatNumber(res?.data?.amountWon)} ${
                selectedCoin.tokenName
              }`,
          );
          soundAlert("/sounds/win.wav", !enableSounds);
        } else errorCustom(translator(res?.message, language));
        if (!result) {
          // console.log("updating");
          setResult(res?.data?.result);
          setResultAmt(
            res?.data?.result == "Won"
              ? res?.data?.amountWon
              : res?.data?.amountLost,
          );
        }

        let win = res?.data?.result == "Won";

        updatePNL(GameType.options, win, betAmt!, 2);

        setRefresh(true);
        setLoading(false);
        setBetResults((prevResults) => {
          const newResults = [
            ...prevResults,
            {
              result: res?.data?.amountWon,
              win: res?.data?.result === "Won",
            },
          ];
          if (newResults.length > 6) {
            newResults.shift();
          }
          return newResults;
        });
      } else {
        throw Error(
          translator(res?.message ?? "Could not fetch result", language),
        );
      }
    } catch (e: any) {
      errorCustom(translator(e?.message ?? "Could not fetch result", language));
      setResult(null);
      setCheckResult(false);
      setLoading(false);
    }
  };

  const bet = async (betType: string) => {
    setLoading(true);
    setCheckResult(false);
    try {
      if (betAmt === undefined) {
        errorCustom(translator("Invalid amount", language));
        return;
      }

      if (betAmt > selectedCoin!.amount) {
        errorCustom(translator("Insufficient balance for bet!", language));
        setBetType(null);
        setCheckResult(false);
        setBetEnd(false);
        setLoading(false);
        return;
      }
      let res = await placeBet(
        session,
        betAmt,
        selectedCoin.tokenMint,
        betType === "up" ? "betUp" : "betDown",
        betInterval,
      );
      if (res.success) {
        // successCustom(res?.message ?? "Bet placed");
        setRefresh(true);
        getActiveBet();
        // setStrikePrice(res?.data?.strikePrice);
        // setBetTime(res?.data?.betTime);
        // setTimeLeft(
        //   new Date(res?.data?.betTime).getTime() +
        //     betInterval * 60000 -
        //     Date.now(),
        // );
        // checkBet = setTimeout(async () => {
        //   console.log("getting old result");
        //   setBetEnd(true);
        //   setCheckResult(true);
        //   getResult();
        // }, betInterval * 60000);
      } else {
        setCheckResult(false);
        setBetEnd(false);
        setLoading(false);
        res?.message && errorCustom(translator(res?.message, language));
      }
    } catch (e) {
      errorCustom(translator("Could not place bet.", language));
      setBetType(null);
      setCheckResult(false);
      setBetEnd(false);
      setLoading(false);
    }
    return () => {
      if (checkBetRef.current) {
        clearTimeout(checkBetRef.current);
      }
    };
  };

  const getActiveBet = async () => {
    if (!session?.user?.email || loading) {
      return;
    }

    setLoading(true);

    try {
      const walletParam = session?.user?.wallet || null;
      const emailParam = session?.user?.email || null;
      const response = await fetch(
        `/api/games/options/getActiveBet?wallet=${walletParam}&email=${emailParam}`,
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const bets = await response.json();
      let bet = bets?.data[0];

      if (bets.success && bet && bet.result === "Pending") {
        setBetType(bet?.betType === "betUp" ? "up" : "down");
        setBetAmt(bet?.amount);
        setBetInterval(bet?.timeFrame / 60);
        setStrikePrice(bet?.strikePrice);
        setBetTime(bet?.betTime);

        const remainingTime =
          new Date(bet?.betTime).getTime() + bet?.timeFrame * 1000 - Date.now();
        setTimeLeft(remainingTime);

        setBetEnd(new Date(bet.betEndTime!).getTime() < Date.now());

        if (!checkBetRef.current) {
          checkBetRef.current = setTimeout(async () => {
            setBetEnd(true);
            setCheckResult(true);
            if (!checkResult) await getResult();
          }, remainingTime);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }

    return () => {
      if (checkBetRef.current) {
        clearTimeout(checkBetRef.current);
      }
    };
  };

  useEffect(() => {
    if (refresh && session?.user) {
      getBalance();
      setRefresh(false);
    }
  }, [session?.user, refresh]);

  useEffect(() => {
    if (status === "authenticated") {
      if (checkBetRef.current) {
        clearTimeout(checkBetRef.current);
      }
      getActiveBet();
    }
  }, [session?.user]);

  useEffect(() => {
    let intervalId = setInterval(async () => {
      try {
        let data = await fetch(
          "https://hermes.pyth.network/api/latest_price_feeds?ids%5B%5D=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
        ).then((res) => res.json());
        let price = data[0].price.price * Math.pow(10, data[0].price.expo);
        setLivePrice(price);
      } catch (e) {
        // errorCustom("Could not fetch live price.");
        setLivePrice(0);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const onSubmit = async (data: any) => {
    if (result) {
      setBetType(null);
      setCheckResult(false);
      setLoading(false);
      setResult(null);
      setBetEnd(false);
      setBetTime(undefined);
      setBetInterval(3);
      setStrikePrice(0);
      // setBetAmt(0.1);
      if (checkBetRef.current) {
        clearTimeout(checkBetRef.current);
      }
      return;
    } else {
      // if (wallet.publicKey || session?.user?.email) {
      // errorCustom(translator("User not connected", language));
      // } else {
      if (
        betType &&
        betAmt !== undefined &&
        betAmt !== 0 &&
        betInterval !== 0 &&
        !loading
      ) {
        // setBetType("up");
        await bet(betType);
      } else
        errorCustom(translator("Choose amount, interval and type.", language));
      // }
    }
  };

  // for circle loader

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = timeLeft - 1000;
      setTimeLeft((prev) => prev - 1000);

      if (remaining <= 0 && (betEnd || (!betEnd && betTime !== undefined))) {
        setTimeLeft(0);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [betTime]);

  return (
    <GameLayout title="Binary Options">
      <GameOptions>
        <FormProvider {...methods}>
          <form
            className="flex w-full flex-col gap-0"
            autoComplete="off"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            {/* mobile button  */}
            <div className="w-full flex lg:hidden mb-[1.4rem]">
              <BetButton
                betAmt={betAmt}
                disabled={
                  !betType || loading || (strikePrice > 0 && !result)
                    ? true
                    : false
                }
                onClickFunction={onSubmit}
              >
                {loading || (strikePrice > 0 && !result) ? (
                  <Loader />
                ) : result ? (
                  "BET AGAIN"
                ) : (
                  "BET"
                )}
              </BetButton>
            </div>

            <BetAmount
              betAmt={betAmt}
              setBetAmt={setBetAmt}
              currentMultiplier={2.0}
              leastMultiplier={2.0}
              game="options"
              disabled={loading || (strikePrice > 0 && !result)}
            />

            {/* select interval  */}
            <div className="mb-[1.4rem] flex w-full flex-col rounded-lg bg-transparent bg-opacity-10">
              <span className="mb-1 text-xs text-white/90  font-changa">
                {translator("Select Interval", language)}
              </span>
              <div className="flex lg:flex-row flex-col items-center gap-2.5 bg-[#0C0F16] p-2 md:p-4 rounded-lg">
                <div className="flex lg:w-[66.66%] w-full gap-2.5">
                  <button
                    type="button"
                    disabled={loading || (strikePrice > 0 && !result)}
                    onClick={() => {
                      !loading && setBetInterval(3);
                    }}
                    className={`${
                      betInterval === 3
                        ? "border-[#5F4DFF]"
                        : "border-transparent hover:border-[#7839C580]"
                    } disabled:pointer-events-none disabled:opacity-50 w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200`}
                  >
                    3 {translator("Min", language)}
                  </button>
                  <button
                    type="button"
                    disabled={loading || (strikePrice > 0 && !result)}
                    onClick={() => {
                      !loading && setBetInterval(4);
                    }}
                    className={`${
                      betInterval === 4
                        ? "border-[#5F4DFF]"
                        : "border-transparent hover:border-[#7839C580]"
                    } disabled:pointer-events-none disabled:opacity-50 w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200`}
                  >
                    4 {translator("Min", language)}
                  </button>
                </div>
                <button
                  type="button"
                  disabled={loading || (strikePrice > 0 && !result)}
                  onClick={() => {
                    !loading && setBetInterval(5);
                  }}
                  className={`${
                    betInterval === 5
                      ? "border-[#5F4DFF]"
                      : "border-transparent hover:border-[#7839C580]"
                  } lg:w-[33.33%] disabled:pointer-events-none disabled:opacity-50 w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200`}
                >
                  5 {translator("Min", language)}
                </button>
              </div>
            </div>

            <div className="flex w-full flex-row lg:mb-[1.4rem] gap-3">
              {/* buttons  */}
              <button
                type="button"
                disabled={loading || (strikePrice > 0 && !result)}
                onClick={() => {
                  setBetType("up");
                }}
                className={`${
                  betType === "up"
                    ? "border-[#5F4DFF]"
                    : "border-transparent hover:border-[#7839C580]"
                } w-full rounded-lg disabled:pointer-events-none disabled:opacity-50 text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]`}
              >
                {translator("UP", language)}
              </button>
              <button
                type="button"
                disabled={loading || (strikePrice > 0 && !result)}
                onClick={() => {
                  setBetType("down");
                }}
                className={`${
                  betType === "down"
                    ? "border-[#5F4DFF]"
                    : "border-transparent hover:border-[#7839C580]"
                } w-full rounded-lg disabled:pointer-events-none disabled:opacity-50 text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)] `}
              >
                {translator("DOWN", language)}
              </button>
            </div>

            {/* lap  button  */}
            <div className="w-full hidden lg:flex">
              <BetButton
                betAmt={betAmt}
                disabled={
                  !betType || loading || (strikePrice > 0 && !result)
                    ? true
                    : false
                }
                // onClickFunction={onSubmit}
              >
                {loading || (strikePrice > 0 && !result) ? (
                  <Loader />
                ) : result ? (
                  "BET AGAIN"
                ) : (
                  "BET"
                )}
              </BetButton>
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
                  ? translator("Placing bet", language) + "..."
                  : ""
                : checkResult
                ? loading || !result
                  ? translator("Checking result", language) + "..."
                  : ""
                : (timeLeft * 50) / (betInterval * 60000) <= 0
                ? translator("Checking result", language) + "..."
                : ""}
            </div>
            <div className="flex flex-col items-end">
              <span className="font-chakra font-medium text-xs md:text-sm text-[#F0F0F0] text-opacity-75">
                ${truncateNumber(strikePrice, 3)}
              </span>
              <span
                className={`font-chakra ${
                  betType === "up" ? "text-[#72F238]" : "text-[#CF304A]"
                } text-xs md:text-base font-bold`}
              >
                {betType
                  ? betType === "up"
                    ? translator("BET UP", language)
                    : translator("BET DOWN", language)
                  : ""}
              </span>
            </div>
          </div>

          {/* central loader  */}
          <div className="flex flex-1 flex-col justify-center items-center relative py-4 mb-6 md:mb-6">
            <div className="flex flex-col items-center absolute w-[14rem] h-[14rem] justify-start pt-14">
              <span className="font-chakra text-sm text-[#94A3B8] text-opacity-75 mb-[1.4rem]">
                ${selectedCoin.tokenName}
              </span>
              <span className="font-chakra text-2xl text-white font-semibold text-opacity-90 mb-2">
                ${truncateNumber(livePrice, 3)}
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
                  {truncateNumber(Math.abs(livePrice - strikePrice), 4)}
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
                  {result
                    ? result === "Won"
                      ? translator("You Won!", language)
                      : translator("You Lost!", language)
                    : ""}
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
                        ? loading || !result
                          ? "blink_1_50 bg-white"
                          : result === "Won"
                          ? "bg-[#72F238] bg-opacity-40 blink_3"
                          : "bg-[#CF304A] bg-opacity-40 blink_3"
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
          <GameFooterInfo multiplier={2.0} amount={betAmt ? betAmt : 0.0} />
        </>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
