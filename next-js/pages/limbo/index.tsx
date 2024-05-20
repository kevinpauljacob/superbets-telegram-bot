import { useEffect, useMemo, useRef, useState } from "react";
import Bets from "../../components/games/Bets";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import HistoryTable from "@/components/games/Limbo/VerifyLimboModal";
import { FormProvider, useForm } from "react-hook-form";
import { useGlobalContext } from "@/components/GlobalContext";
import BetSetting from "@/components/BetSetting";
import {
  GameDisplay,
  GameFooterInfo,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import Spinner from "@/components/Spinner";
import { MultiplierHistory } from "@/components/games/Limbo/MultiplierHistory";
import { limboBet } from "@/context/gameTransactions";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import Loader from "../../components/games/Loader";
import { BsInfinity } from "react-icons/bs";
import ResultsSlider from "@/components/ResultsSlider";
import BalanceAlert from "@/components/games/BalanceAlert";
import showInfoToast from "@/components/games/toasts/toasts";
import Link from "next/link";
import { soundAlert } from "@/utils/soundUtils";
import ConfigureAutoButton from "@/components/ConfigureAutoButton";
import AutoCount from "@/components/AutoCount";
import MultiplierInput from "@/components/games/MultiplierInput";
import {
  errorCustom,
  successCustom,
  warningCustom,
} from "@/components/toasts/ToastGroup";
import { translator, formatNumber } from "@/context/transactions";
import { minGameAmount } from "@/context/gameTransactions";
import { useSession } from "next-auth/react";

function useInterval(callback: Function, delay: number | null) {
  const savedCallback = useRef<Function | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default function Limbo() {
  const wallet = useWallet();
  const methods = useForm();
  const { data: session, status } = useSession();

  const {
    coinData,
    getBalance,
    getWalletBalance,
    setShowWalletModal,
    setShowAutoModal,
    autoWinChange,
    autoLossChange,
    autoWinChangeReset,
    autoLossChangeReset,
    autoStopProfit,
    autoStopLoss,
    startAuto,
    setStartAuto,
    autoBetCount,
    setAutoBetCount,
    autoBetProfit,
    setAutoBetProfit,
    useAutoConfig,
    setUseAutoConfig,
    houseEdge,
    maxBetAmt,
    language,
  } = useGlobalContext();

  const multiplierLimits = [1.02, 50];

  const [userInput, setUserInput] = useState<number | undefined>();
  const [betAmt, setBetAmt] = useState<number | undefined>();

  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultAmount, setResultAmount] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betSetting, setBetSetting] = useState<"manual" | "auto">("manual");

  const [multiplier, setMultiplier] = useState(0.0);
  const [displayMultiplier, setDisplayMultiplier] = useState(0.0);
  const [targetMultiplier, setTargetMultiplier] = useState(multiplierLimits[0]);
  const [inputMultiplier, setInputMultiplier] = useState(multiplierLimits[0]);
  const [lastMultipliers, setLastMultipliers] = useState<
    { result: number; win: boolean }[]
  >([]);
  const duration = 2000;

  useEffect(() => {
    const startMultiplier = displayMultiplier;
    let increment = (targetMultiplier - displayMultiplier) / (duration / 10);

    const timer = setInterval(() => {
      if (displayMultiplier == targetMultiplier) clearInterval(timer);
      else {
        const currentMultiplier = startMultiplier + increment;

        if (
          (displayMultiplier < targetMultiplier &&
            currentMultiplier >= targetMultiplier) ||
          (displayMultiplier > targetMultiplier &&
            currentMultiplier <= targetMultiplier)
        ) {
          setDisplayMultiplier(targetMultiplier);
          clearInterval(timer);

          const win = result === "Won";
          if (win) {
            soundAlert("/sounds/win.wav");
            successCustom(`Won ${resultAmount.toFixed(4)} SOL!`);
          } else result && errorCustom("Better luck next time!");
          const newBetResult = { result: targetMultiplier, win };
          setLastMultipliers((prevResults) => {
            const newResults = [...prevResults, newBetResult];
            if (newResults.length > 6) {
              newResults.shift();
            }
            return newResults;
          });

          // auto options
          if (betSetting === "auto" && betAmt !== undefined) {
            if (useAutoConfig && win) {
              setBetAmt(
                autoWinChangeReset
                  ? userInput!
                  : betAmt + ((autoWinChange ?? 0) * betAmt) / 100.0,
              );
            } else if (useAutoConfig && !win) {
              setBetAmt(
                autoLossChangeReset
                  ? userInput!
                  : betAmt + ((autoLossChange ?? 0) * betAmt) / 100.0,
              );
            }
            // update profit / loss
            setAutoBetProfit(
              autoBetProfit +
                (win ? multiplier * (1 - houseEdge) - 1 : -1) * betAmt,
            );
            // update count
            if (typeof autoBetCount === "number") {
              setAutoBetCount(autoBetCount > 0 ? autoBetCount - 1 : 0);
              autoBetCount === 1 &&
                warningCustom("Auto bet stopped", "top-right");
            } else
              setAutoBetCount(
                autoBetCount.length > 12
                  ? autoBetCount.slice(0, 5)
                  : autoBetCount + 1,
              );
          }
        } else {
          setDisplayMultiplier(currentMultiplier);
          increment *= 1.5;
        }
      }
    }, 50);

    return () => clearInterval(timer);
  }, [targetMultiplier]);

  const bet = async () => {
    try {
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
      }
      if (!betAmt || betAmt === 0) {
        throw new Error("Set Amount.");
      }
      if (coinData && coinData[0].amount < betAmt) {
        throw new Error("Insufficient balance for bet !");
      }
      if (inputMultiplier < multiplierLimits[0]) {
        throw new Error("Multiplier should be at least 1.02");
      }
      if (inputMultiplier > multiplierLimits[1]) {
        throw new Error("Multiplier cannot be greater than 50");
      }
      setLoading(true);
      setDisplayMultiplier(multiplierLimits[0]);
      setTargetMultiplier(multiplierLimits[0]);

      // console.log("Placing Flip");
      // function to place bet
      const response = await limboBet(
        wallet,
        betAmt!,
        parseFloat((100 / inputMultiplier).toFixed(8)),
      );

      if (!response.success) throw new Error(response.message);

      const winningMultiplier = parseFloat(
        formatNumber(100 / response.strikeNumber, 2),
      );

      setFlipping(false);
      setLoading(false);
      setTargetMultiplier(winningMultiplier);
      setResult(response.result);
      setResultAmount(
        response?.result === "Won"
          ? response?.amountWon ?? 0
          : response?.AmountLost ?? 0,
      );
      setRefresh(true);
      //auto options are in the useEffect to modify displayMultiplier
    } catch (e: any) {
      errorCustom(e?.message ?? "Could not make Bet.");
      setFlipping(false);
      setLoading(false);
      setResult(null);
      setAutoBetCount(0);
      setStartAuto(false);
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
    setBetAmt(userInput);
  }, [userInput]);

  useEffect(() => {
    // console.log("Auto: ", startAuto, autoBetCount, autoBetProfit);
    if (
      betSetting === "auto" &&
      startAuto &&
      ((typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0))
    ) {
      let potentialLoss = 0;
      if (betAmt !== undefined) {
        potentialLoss =
          autoBetProfit +
          -1 *
            (autoWinChangeReset || autoLossChangeReset
              ? betAmt
              : autoBetCount === "inf"
              ? Math.max(0, betAmt)
              : betAmt *
                (autoLossChange !== null ? autoLossChange / 100.0 : 0));

        // console.log("Current bet amount:", betAmt);
        // console.log("Auto loss change:", autoLossChange);
        // console.log("Auto profit change:", autoWinChange);
        // console.log("Potential loss:", potentialLoss);
      }
      if (
        useAutoConfig &&
        autoStopProfit &&
        autoBetProfit > 0 &&
        autoBetProfit >= autoStopProfit
      ) {
        warningCustom("Profit limit reached.", "top-right");
        setAutoBetCount(0);
        setStartAuto(false);
        return;
      }
      if (
        useAutoConfig &&
        autoStopLoss &&
        autoBetProfit < 0 &&
        potentialLoss <= -autoStopLoss
      ) {
        warningCustom("Loss limit reached.", "top-right");
        setAutoBetCount(0);
        setStartAuto(false);
        return;
      }
      setTimeout(() => {
        setResult(null);
        bet();
      }, 500);
    } else {
      setStartAuto(false);
      setAutoBetProfit(0);
      setUserInput(betAmt);
    }
  }, [startAuto, autoBetCount]);

  const onSubmit = async (data: any) => {
    setMultiplier(inputMultiplier);
    if (betSetting === "auto") {
      if (betAmt === 0) {
        errorCustom("Set Amount.");
        return;
      }
      if (typeof autoBetCount === "number" && autoBetCount <= 0) {
        errorCustom("Set Bet Count.");
        return;
      }
      if (
        (typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0)
      ) {
        // console.log("Auto betting. config: ", useAutoConfig);
        setStartAuto(true);
      }
    } else if (wallet.connected) {
      setResult(null);
      bet();
    }
  };

  const disableInput = useMemo(() => {
    return betSetting === "auto" && startAuto ? true : false || loading;
  }, [betSetting, startAuto, loading]);

  return (
    <GameLayout title="Limbo">
      <GameOptions>
        <>
          <div className="relative w-full flex lg:hidden mb-[1.4rem]">
            {startAuto && (
              <div
                onClick={() => {
                  soundAlert("/sounds/betbutton.wav");
                  warningCustom("Auto bet stopped", "top-right");
                  setAutoBetCount(0);
                  setStartAuto(false);
                }}
                className="cursor-pointer rounded-lg absolute w-full h-full z-20 bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
              >
                {translator("STOP", language)}
              </div>
            )}
            <BetButton
              disabled={
                loading ||
                !session?.user ||
                (coinData && coinData[0].amount < minGameAmount) ||
                (betAmt !== undefined &&
                  maxBetAmt !== undefined &&
                  betAmt > maxBetAmt)
                  ? true
                  : false
              }
              onClickFunction={onSubmit}
            >
              {loading ? <Loader /> : "BET"}
            </BetButton>
          </div>
          {betSetting === "auto" && (
            <div className="w-full flex lg:hidden">
              <ConfigureAutoButton disabled={disableInput} />
            </div>
          )}
          <div className="w-full hidden lg:flex">
            <BetSetting
              betSetting={betSetting}
              setBetSetting={setBetSetting}
              disabled={disableInput}
            />
          </div>

          <div className="w-full flex flex-col">
            <FormProvider {...methods}>
              <form
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                {/* amt input  */}
                <BetAmount
                  betAmt={betAmt}
                  setBetAmt={setUserInput}
                  currentMultiplier={inputMultiplier}
                  leastMultiplier={1.02}
                  game="limbo"
                  disabled={disableInput}
                />
                <div className="mb-[1.4rem] text-xs font-changa text-opacity-90">
                  <MultiplierInput
                    inputMultiplier={inputMultiplier}
                    setInputMultiplier={setInputMultiplier}
                    disabled={startAuto || loading || disableInput}
                    minVal={1.02}
                    maxVal={50}
                    step={1}
                    maxLength={2}
                  />
                </div>

                {betSetting == "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <AutoCount loading={flipping || startAuto} />
                    <div className="w-full hidden lg:flex">
                      <ConfigureAutoButton disabled={disableInput} />
                    </div>
                  </div>
                )}

                <div className="relative w-full hidden lg:flex mt-1">
                  {startAuto && (
                    <div
                      onClick={() => {
                        soundAlert("/sounds/betbutton.wav");
                        warningCustom("Auto bet stopped", "top-right");
                        setAutoBetCount(0);
                        setStartAuto(false);
                      }}
                      className="cursor-pointer rounded-lg absolute w-full h-full z-20 bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
                    >
                      {translator("STOP", language)}
                    </div>
                  )}
                  <BetButton
                    disabled={
                      loading ||
                      !session?.user ||
                      (coinData && coinData[0].amount < minGameAmount) ||
                      (betAmt !== undefined &&
                        maxBetAmt !== undefined &&
                        betAmt > maxBetAmt)
                        ? true
                        : false
                    }
                    onClickFunction={onSubmit}
                  >
                    {loading ? <Loader /> : "BET"}
                  </BetButton>
                </div>
              </form>
              {/* choosing bet options  */}
            </FormProvider>
            <div className="w-full flex lg:hidden">
              <BetSetting
                betSetting={betSetting}
                setBetSetting={setBetSetting}
              />
            </div>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <div className="w-full flex justify-between items-center h-[2.125rem]">
          <div>
            {loading ? (
              <div className="font-chakra text-xs sm:text-sm font-medium text-white text-opacity-75">
                {translator("Betting", language)}...
              </div>
            ) : null}
          </div>
          <ResultsSlider results={lastMultipliers} align={"horizontal"} />
        </div>

        <div className="grid place-items-center">
          <div className="bg-black border-2 border-white border-opacity-20 px-8 py-6 sm:px-10 lg:px-[4.5rem] lg:py-10 my-10 md:my-10 lg:my-0 place-content-center text-center rounded-[10px]">
            <span
              className={`${
                result
                  ? displayMultiplier === targetMultiplier
                    ? displayMultiplier >= multiplier
                      ? "text-fomo-green"
                      : "text-fomo-red"
                    : "text-white"
                  : "text-white"
              } font-chakra inline-block transition-transform duration-1000 ease-out text-[5rem] font-black`}
            >
              {formatNumber(displayMultiplier, 2)}x
            </span>
          </div>
        </div>

        <div className="flex px-0 xl:px-4 mb-0 md:mb-[1.4rem] gap-4 flex-row w-full justify-between font-changa font-semibold">
          {coinData && coinData[0].amount > minGameAmount && (
            <>
              <MultiplierInput
                inputMultiplier={inputMultiplier}
                setInputMultiplier={setInputMultiplier}
                disabled={startAuto || loading || disableInput}
                minVal={1.02}
                maxVal={50}
                step={1}
                maxLength={2}
              />

              <div className="flex flex-col w-full">
                <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
                  {translator("Profit", language)}
                </span>
                <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
                  {betAmt && inputMultiplier
                    ? formatNumber(
                        Math.max(
                          0,
                          betAmt * (inputMultiplier * (1 - houseEdge) - 1),
                        ),
                        4,
                      )
                    : 0.0}{" "}
                  $SOL
                </span>
              </div>

              <div className="flex flex-col w-full">
                <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
                  {translator("Chance", language)}
                </span>
                <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
                  {formatNumber(
                    inputMultiplier > 0 ? 100 / inputMultiplier : 0.0,
                    2,
                  )}
                  %
                </span>
              </div>
            </>
          )}

          {!coinData ||
            (coinData[0].amount < minGameAmount && (
              <div className="w-full rounded-lg bg-[#d9d9d90d] bg-opacity-10 flex items-center px-3 py-3 text-white md:px-6">
                <div className="w-full text-center font-changa font-medium text-sm md:text-base text-[#F0F0F0] text-opacity-75">
                  {translator(
                    "Please deposit funds to start playing. View",
                    language,
                  )}{" "}
                  <Link href="/balance">
                    <u>{translator("WALLET", language)}</u>
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
