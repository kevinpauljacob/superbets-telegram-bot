import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import HistoryTable from "@/components/games/Limbo/HistoryTable";
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
  } = useGlobalContext();

  const multiplierLimits = [1.02, 50];

  const [userInput, setUserInput] = useState<number | undefined>();
  const [betAmt, setBetAmt] = useState(0.2);

  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
          if (win) soundAlert("/sounds/win.wav");
          const newBetResult = { result: targetMultiplier, win };
          setLastMultipliers((prevResults) => {
            const newResults = [...prevResults, newBetResult];
            if (newResults.length > 6) {
              newResults.shift();
            }
            return newResults;
          });

          // auto options
          if (betSetting === "auto") {
            if (useAutoConfig && autoWinChange && win) {
              setBetAmt(
                autoWinChangeReset
                  ? userInput!
                  : betAmt + (autoWinChange * betAmt) / 100.0,
              );
            } else if (useAutoConfig && autoLossChange && !win) {
              setAutoBetProfit(autoBetProfit - betAmt);
              setBetAmt(
                autoLossChangeReset
                  ? userInput!
                  : betAmt + (autoLossChange * betAmt) / 100.0,
              );
            }
            // update profit / loss
            setAutoBetProfit(
              autoBetProfit + (win ? multiplier - 1 : -1) * betAmt,
            );
            // update count
            if (typeof autoBetCount === "number")
              setAutoBetCount(autoBetCount - 1);
            else setAutoBetCount(autoBetCount + 1);
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
    if (!wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    if (betAmt === 0) {
      toast.error("Set Amount.");
      return;
    }
    if (inputMultiplier < multiplierLimits[0]) {
      toast.error("Multiplier should be at least 1.02");
      return;
    }
    if (inputMultiplier > multiplierLimits[1]) {
      toast.error("Multiplier cannot be greater than 50");
      return;
    }
    setLoading(true);
    setDisplayMultiplier(multiplierLimits[0]);
    setTargetMultiplier(multiplierLimits[0]);
    try {
      console.log("Placing Flip");
      // function to place bet
      const response = await limboBet(
        wallet,
        betAmt,
        parseFloat((100 / inputMultiplier).toFixed(8)),
      );

      if (!response.success) throw response.message;

      const winningMultiplier = parseFloat(
        (100 / response.strikeNumber).toFixed(2),
      );

      setFlipping(false);
      setLoading(false);
      setTargetMultiplier(winningMultiplier);
      setResult(response.result);
      setRefresh(true);
      //auto options are in the useEffect to modify displayMultiplier
    } catch (e) {
      toast.error("Could not make Bet.");
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

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setAutoBetCount(parseFloat(e.target.value));
  };

  useEffect(() => {
    setBetAmt(userInput ?? 0);
  }, [userInput]);

  useEffect(() => {
    console.log("Auto: ", startAuto, autoBetCount);
    if (
      betSetting === "auto" &&
      startAuto &&
      ((typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0))
    ) {
      if (useAutoConfig && autoStopProfit && autoBetProfit <= autoStopProfit) {
        showInfoToast("Profit limit reached.");
        return;
      }
      if (useAutoConfig && autoStopLoss && autoBetProfit >= -1 * autoStopLoss) {
        showInfoToast("Loss limit reached.");
        return;
      }
      setTimeout(() => {
        setResult(null);
        bet();
      }, 500);
    } else {
      setStartAuto(false);
      setAutoBetProfit(0);
    }
  }, [startAuto, autoBetCount]);

  const onSubmit = async (data: any) => {
    setMultiplier(inputMultiplier);
    if (
      betSetting === "auto" &&
      ((typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0))
    ) {
      if (betAmt === 0) {
        toast.error("Set Amount.");
        return;
      }
      console.log("Auto betting. config: ", useAutoConfig);
      setStartAuto(true);
    } else if (wallet.connected) {
      setResult(null);
      bet();
    }
  };

  return (
    <GameLayout title="FOMO - Limbo">
      <GameOptions>
        <>
          <div className="flex md:hidden flex-col w-full gap-4 mb-5">
            {startAuto && (
              <div
                onClick={() => {
                  setAutoBetCount(0);
                  setStartAuto(false);
                }}
                className="cursor-pointer rounded-lg absolute w-full h-full z-20 bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
              >
                STOP
              </div>
            )}
            <BetButton
              disabled={
                loading || (coinData && coinData[0].amount < 0.0001)
                  ? true
                  : false
              }
              onClickFunction={onSubmit}
            >
              {loading ? <Loader /> : "BET"}
            </BetButton>
          </div>
          <BetSetting betSetting={betSetting} setBetSetting={setBetSetting} />

          <div className="w-full flex flex-col">
            <FormProvider {...methods}>
              <form
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                {/* amt input  */}
                <BetAmount betAmt={userInput} setBetAmt={setUserInput} />

                {betSetting == "manual" ? (
                  <></>
                ) : (
                  <>
                    <div className="w-full flex flex-row items-end gap-3">
                      <div className="mb-0 flex w-full flex-col">
                        <div className="mb-1 flex w-full items-center justify-between text-xs font-changa text-opacity-90">
                          <label className="text-white/90 font-changa">
                            Number of Bets
                          </label>
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
                            placeholder={
                              autoBetCount.toString().includes("inf")
                                ? "Infinity"
                                : "00"
                            }
                            disabled={startAuto || loading}
                            value={autoBetCount}
                            className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra ${
                              autoBetCount.toString().includes("inf")
                                ? "placeholder-opacity-100"
                                : "placeholder-opacity-40"
                            } placeholder-opacity-40 outline-none`}
                          />
                          <span
                            className={`text-2xl font-medium text-white text-opacity-50 ${
                              autoBetCount.toString().includes("inf")
                                ? "bg-[#47484A]"
                                : "bg-[#292C32]"
                            } hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-0.5 px-3`}
                            onClick={() => setAutoBetCount("inf")}
                          >
                            <BsInfinity />
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
                      <div
                        onClick={() => {
                          setShowAutoModal(true);
                        }}
                        className="relative mb-[1.4rem] rounded-md w-full h-11 flex items-center justify-center opacity-75 cursor-pointer font-sans font-medium text-sm text-white text-opacity-90 border-2 border-white bg-white bg-opacity-0 hover:bg-opacity-5"
                      >
                        Configure Auto
                        <div
                          className={`${
                            useAutoConfig ? "bg-fomo-green" : "bg-fomo-red"
                          } absolute top-0 right-0 m-1.5 bg-fomo-green w-2 h-2 rounded-full`}
                        />
                      </div>
                    </div>
                  </>
                )}
                {/* balance alert  */}
                <BalanceAlert />

                <div className="relative w-full hidden md:flex mt-2">
                  {startAuto && (
                    <div
                      onClick={() => {
                        setAutoBetCount(0);
                        setStartAuto(false);
                      }}
                      className="cursor-pointer rounded-lg absolute w-full h-full z-20 bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
                    >
                      STOP
                    </div>
                  )}
                  <BetButton
                    disabled={
                      loading || (coinData && coinData[0].amount < 0.0001)
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
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <div className="w-full flex justify-between items-center h-[2.125rem]">
          <div>
            {loading ? (
              <div className="font-chakra text-xs sm:text-sm font-medium text-white text-opacity-75">
                Betting ...
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
              {displayMultiplier.toFixed(2)}x
            </span>
          </div>
        </div>

        <div className="flex px-0 xl:px-4 mb-0 md:mb-5 gap-4 flex-row w-full justify-between">
          {coinData && coinData[0].amount > 0.0001 && (
            <>
              <div className="flex flex-col w-full">
                <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
                  Multiplier
                </span>
                <input
                  id={"amount-input"}
                  className={`bg-[#202329] w-full min-w-0 font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3 placeholder-[#94A3B8] placeholder-opacity-40 outline-none`}
                  value={inputMultiplier}
                  type="number"
                  maxLength={1}
                  step={1}
                  min={1.02}
                  max={50}
                  disabled={startAuto || loading}
                  onChange={(e) => {
                    setInputMultiplier(parseFloat(e.target.value));
                  }}
                />
              </div>

              <div className="flex flex-col w-full">
                <span className="text-[#F0F0F0] font-changa font-sembiold text-xs mb-1">
                  Winning
                </span>
                <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
                  {betAmt && inputMultiplier
                    ? (inputMultiplier * betAmt).toFixed(4)
                    : 0.0}{" "}
                  $SOL
                </span>
              </div>

              <div className="flex flex-col w-full">
                <span className="text-[#F0F0F0] font-changa font-sembiold text-xs mb-1">
                  Chance
                </span>
                <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
                  {(inputMultiplier > 0 ? 100 / inputMultiplier : 0.0).toFixed(
                    2,
                  )}
                  x
                </span>
              </div>
            </>
          )}

          {!coinData ||
            (coinData[0].amount < 0.0001 && (
              <div className="w-full rounded-lg bg-[#d9d9d90d] bg-opacity-10 flex items-center px-3 py-3 text-white md:px-6">
                <div className="w-full text-center font-changa font-medium text-sm md:text-base text-[#F0F0F0] text-opacity-75">
                  Please deposit funds to start playing. View{" "}
                  <Link href="/balance">
                    <u>WALLET</u>
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </GameDisplay>
      <GameTable>
        <HistoryTable refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
