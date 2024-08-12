import { useEffect, useMemo, useRef, useState } from "react";
import Bets from "../../components/games/Bets";
import { FormProvider, useForm } from "react-hook-form";
import { useGlobalContext } from "@/components/GlobalContext";
import BetSetting from "@/components/BetSetting";
import {
  GameDisplay,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import Loader from "../../components/games/Loader";
import ResultsSlider from "@/components/ResultsSlider";
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
import { limboBet, translator, truncateNumber } from "@/context/transactions";
import { useSession } from "next-auth/react";
import { GameType } from "@/utils/provably-fair";

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
  const methods = useForm();

  const {
    getBalance,
    setShowWalletModal,
    setShowConnectModal,
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
    selectedCoin,
    houseEdge,
    maxBetAmt,
    language,
    enableSounds,
    updatePNL,
    minGameAmount,
    session,
    status,
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
            soundAlert("/sounds/win.wav", !enableSounds);
            successCustom(
              translator(`Congratulations! You won`, language) +
                ` ${resultAmount.toFixed(4)} ${selectedCoin.tokenName}`,
            );
          } else
            result &&
              errorCustom(
                translator("Sorry, Better luck next time!", language),
              );
          const newBetResult = { result: targetMultiplier, win };
          setLastMultipliers((prevResults) => {
            const newResults = [...prevResults, newBetResult];
            if (newResults.length > 6) {
              newResults.shift();
            }
            return newResults;
          });

          if (betAmt) {
            updatePNL(
              GameType.limbo,
              newBetResult.win,
              betAmt,
              inputMultiplier,
            );
          }

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
                warningCustom(
                  translator("Auto bet stopped", language),
                  "top-left",
                );
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
      if (!session?.user?.isWeb2User && selectedCoin.tokenMint === "SUPER") {
        throw new Error(
          translator("You cannot bet with this token!", language),
        );
      }
      if (!betAmt || betAmt === 0) {
        throw new Error(translator("Set Amount.", language));
      }
      if (selectedCoin && selectedCoin.amount < betAmt) {
        throw new Error(translator("Insufficient balance for bet !", language));
      }
      if (inputMultiplier < multiplierLimits[0]) {
        throw new Error(
          translator("Multiplier should be at least 1.02", language),
        );
      }
      if (inputMultiplier > multiplierLimits[1]) {
        throw new Error(
          translator("Multiplier cannot be greater than 50", language),
        );
      }
      setLoading(true);
      setDisplayMultiplier(multiplierLimits[0]);
      setTargetMultiplier(multiplierLimits[0]);

      const response = await limboBet(
        session,
        betAmt,
        inputMultiplier,
        selectedCoin.tokenMint,
      );

      if (!response.success)
        throw new Error(translator(response.message, language));

      const winningMultiplier = parseFloat(
        truncateNumber(response.strikeNumber, 2).toString(),
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
      errorCustom(translator(e?.message ?? "Could not make Bet.", language));
      setFlipping(false);
      setLoading(false);
      setResult(null);
      setAutoBetCount(0);
      setStartAuto(false);
    }
  };

  useEffect(() => {
    if (refresh && session?.user) {
      getBalance();
      setRefresh(false);
    }
  }, [session?.user, refresh]);

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
        setTimeout(() => {
          warningCustom(
            translator("Profit limit reached.", language),
            "top-left",
          );
        }, 500);
        setAutoBetCount(0);
        setStartAuto(false);
        return;
      }
      if (
        useAutoConfig &&
        autoStopLoss &&
        autoBetProfit < 0 &&
        potentialLoss < -autoStopLoss
      ) {
        setTimeout(() => {
          warningCustom(
            translator("Loss limit reached.", language),
            "top-left",
          );
        }, 500);
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
        errorCustom(translator("Set Amount.", language));
        return;
      }
      if (typeof autoBetCount === "number" && autoBetCount <= 0) {
        errorCustom(translator("Set Bet Count.", language));
        return;
      }
      if (
        (typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0)
      ) {
        // console.log("Auto betting. config: ", useAutoConfig);
        setStartAuto(true);
      }
    } else {
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
                  soundAlert("/sounds/betbutton.wav", !enableSounds);
                  warningCustom(
                    translator("Auto bet stopped", language),
                    "top-left",
                  );
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
                (startAuto &&
                  (autoBetCount === 0 || Number.isNaN(autoBetCount)))
                  ? // (betAmt !== undefined &&
                    //   maxBetAmt !== undefined &&
                    //   betAmt > maxBetAmt)
                    true
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
                        soundAlert("/sounds/betbutton.wav", !enableSounds);
                        warningCustom(
                          translator("Auto bet stopped", language),
                          "top-left",
                        );
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
                      (startAuto &&
                        (autoBetCount === 0 || Number.isNaN(autoBetCount)))
                        ? // (betAmt !== undefined &&
                          //   maxBetAmt !== undefined &&
                          //   betAmt > maxBetAmt)
                          true
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
              {truncateNumber(displayMultiplier, 2)}x
            </span>
          </div>
        </div>

        <div className="flex px-0 xl:px-4 mb-0 md:mb-[1.4rem] gap-4 flex-row w-full justify-between font-changa font-semibold">
          {selectedCoin &&
            selectedCoin.amount > minGameAmount &&
            session?.user?.wallet && (
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
                      ? truncateNumber(
                          Math.max(
                            0,
                            betAmt * (inputMultiplier * (1 - houseEdge) - 1),
                          ),
                          4,
                        )
                      : 0.0}{" "}
                    ${selectedCoin.tokenName}
                  </span>
                </div>

                <div className="flex flex-col w-full">
                  <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
                    {translator("Chance", language)}
                  </span>
                  <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
                    {truncateNumber(
                      inputMultiplier > 0 ? 100 / inputMultiplier : 0.0,
                      2,
                    )}
                    %
                  </span>
                </div>
              </>
            )}

          {(!selectedCoin ||
            selectedCoin.amount < minGameAmount ||
            !session?.user?.wallet) && (
            <div className="w-full rounded-lg bg-[#d9d9d90d] bg-opacity-10 flex items-center px-3 py-3 text-white md:px-6">
              <div className="w-full text-center font-changa font-medium text-sm md:text-base text-[#F0F0F0] text-opacity-75">
                {translator(
                  "Please deposit funds to start playing. View",
                  language,
                )}{" "}
                <u
                  onClick={() => {
                    status === "authenticated"
                      ? setShowWalletModal(true)
                      : setShowConnectModal(true);
                  }}
                  className="cursor-pointer"
                >
                  {translator("WALLET", language)}
                </u>
              </div>
            </div>
          )}
        </div>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
