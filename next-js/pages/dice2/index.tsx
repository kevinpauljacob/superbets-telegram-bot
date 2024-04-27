import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import BetSetting from "@/components/BetSetting";
import DraggableBar from "@/components/games/Dice2/DraggableBar";
import { useGlobalContext } from "@/components/GlobalContext";
import {
  GameDisplay,
  GameFooterInfo,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import HistoryTable from "@/components/games/Dice2/HistoryTable";
import { FormProvider, useForm } from "react-hook-form";
import { BsInfinity } from "react-icons/bs";
import Loader from "@/components/games/Loader";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import ResultsSlider from "@/components/ResultsSlider";
import showInfoToast from "@/components/games/toasts/toasts";

export default function Dice2() {
  const wallet = useWallet();
  const methods = useForm();
  const {
    coinData,
    getBalance,
    getWalletBalance,
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
  const [betAmt, setBetAmt] = useState(0);
  const [userInput, setUserInput] = useState<number | undefined>();
  const [isRolling, setIsRolling] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [rollType, setRollType] = useState<"over" | "under">("over");
  const [strikeNumber, setStrikeNumber] = useState<number>(0);
  const [result, setResult] = useState<boolean>(false);
  const [choice, setChoice] = useState<number>(50);
  const [multiplier, setMultiplier] = useState(0.0);
  const [chance, setChance] = useState(0.0);
  const [betResults, setBetResults] = useState<
    { result: number; win: boolean }[]
  >([]);

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setAutoBetCount(parseFloat(e.target.value));
  };

  const adjustPrecision = (value: string, maxDecimalPlaces: number) => {
    const floatValue = parseFloat(value);
    if (!isNaN(floatValue)) {
      return floatValue.toFixed(
        Math.min(maxDecimalPlaces, (value.split(".")[1] || "").length),
      );
    }
    return value;
  };

  const handleMultiplierInput = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let inputValue = event.target.value.trim();
    inputValue = adjustPrecision(inputValue, 4);

    const floatValue = parseFloat(inputValue);
    if (!isNaN(floatValue) && floatValue >= 0.1 && floatValue <= 98.0) {
      event.target.value = inputValue;
      setMultiplier(floatValue);

      const calculatedChoice =
        rollType === "over" ? 100 - 98 / floatValue : 98 / floatValue;

      const roundedChoice = parseFloat(calculatedChoice.toFixed(2));
      setChoice(roundedChoice);

      const calculatedChance =
        rollType === "over" ? 100 - roundedChoice : roundedChoice;
      setChance(calculatedChance);
    }
  };

  const handleChanceInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = event.target.value.trim();
    inputValue = adjustPrecision(inputValue, 4);

    const floatValue = parseFloat(inputValue);
    const minValue = 2.0;
    const maxValue = 9900.0;

    if (
      !isNaN(floatValue) &&
      floatValue >= minValue &&
      floatValue <= maxValue
    ) {
      event.target.value = inputValue;

      setChance(floatValue);

      const calculatedMultiplier =
        rollType === "over" ? 98 / (100 - floatValue) : 98 / floatValue;
      const roundedMultiplier = parseFloat(calculatedMultiplier.toFixed(4));
      setMultiplier(roundedMultiplier);

      const calculatedChoice =
        rollType === "over" ? 100 - floatValue : floatValue;
      setChoice(calculatedChoice);
    }
  };

  const handleBet = async () => {
    console.log(
      "betting",
      autoWinChange,
      autoLossChange,
      autoWinChangeReset,
      autoLossChangeReset,
      autoStopProfit,
      autoStopLoss,
      startAuto,
      autoBetCount,
      autoBetProfit,
      betAmt,
    );
    if (wallet.connected) {
      if (!wallet.publicKey) {
        toast.error("Wallet not connected");
        return;
      }
      if (coinData && coinData[0].amount < betAmt) {
        toast.error("Insufficient balance for bet !");
        return;
      }
      if (betAmt === 0) {
        toast.error("Set Amount.");
        return;
      }
      setIsRolling(true);
      try {
        const response = await fetch(`/api/games/dice2`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet: wallet.publicKey,
            amount: betAmt,
            tokenMint: "SOL",
            chance: chance,
            direction: rollType === "over" ? "over" : "under",
          }),
        });

        const { success, message, result, strikeNumber } =
          await response.json();

        if (success !== true) {
          toast.error(message);
          throw new Error(message);
        }

        if (result === "Won") toast.success(message, { duration: 2000 });
        else toast.error(message, { duration: 2000 });

        const win = result === "Won";
        const newBetResult = { result: strikeNumber, win };

        setBetResults((prevResults) => {
          const newResults = [...prevResults, newBetResult];
          if (newResults.length > 6) {
            newResults.shift();
          }
          return newResults;
        });

        setStrikeNumber(strikeNumber);
        setResult(win);
        setRefresh(true);

        // auto options
        if (betType === "auto") {
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
      } catch (error) {
        console.error("Error occurred while betting:", error);
        setAutoBetCount(0);
        setStartAuto(false);
      } finally {
        setIsRolling(false);
      }
    }
  };

  useEffect(() => {
    const calculateMultiplier = () => {
      if (rollType === "over") {
        const calculatedMultiplier = (98 / (100 - choice)).toPrecision(4);
        setMultiplier(parseFloat(calculatedMultiplier));
      } else if (rollType === "under") {
        const calculatedMultiplier = (98 / choice).toPrecision(4);
        setMultiplier(parseFloat(calculatedMultiplier));
      }
    };

    const calculateChance = () => {
      if (rollType === "over") {
        const calculatedChance = (100 - choice).toPrecision(4);
        setChance(parseFloat(calculatedChance));
      } else if (rollType === "under") {
        const calculatedChance = choice.toPrecision(4);
        setChance(parseFloat(calculatedChance));
      }
    };

    calculateMultiplier();
    calculateChance();
  }, [choice, rollType]);

  useEffect(() => {
    if (refresh && wallet?.publicKey) {
      getBalance();
      getWalletBalance();
      setRefresh(false);
    }
  }, [wallet?.publicKey, refresh]);

  useEffect(() => {
    setBetAmt(userInput ?? 0);
  }, [userInput]);

  useEffect(() => {
    console.log("Auto: ", startAuto, autoBetCount);
    if (
      betType === "auto" &&
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
      handleBet();
    } else {
      setStartAuto(false);
      setAutoBetProfit(0);
    }
  }, [startAuto, autoBetCount]);

  const onSubmit = async (data: any) => {
    if (
      betType === "auto" &&
      ((typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0))
    ) {
      if (betAmt === 0) {
        toast.error("Set Amount.");
        return;
      }
      console.log("Auto betting. config: ", useAutoConfig);
      setStartAuto(true);
    } else if (wallet.connected) handleBet();
  };

  return (
    <GameLayout title="FOMO - Dice 2">
      <GameOptions>
        <>
          <div className="relative w-full flex md:hidden mb-5">
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
                !wallet ||
                isRolling ||
                (coinData && coinData[0].amount < 0.0001)
                  ? true
                  : false
              }
              onClickFunction={onSubmit}
            >
              {isRolling ? <Loader /> : "BET"}
            </BetButton>
          </div>
          <BetSetting betSetting={betType} setBetSetting={setBetType} />
          <div className="w-full flex flex-col">
            <FormProvider {...methods}>
              <form
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                {/* amt input  */}
                <BetAmount betAmt={userInput} setBetAmt={setUserInput} />
                {betType === "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <div className="mb-0 flex w-full flex-col">
                      <div className="mb-1 flex w-full items-center justify-between text-xs font-changa text-opacity-90">
                        <label className="text-white/90 font-medium font-changa">
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
                          disabled={startAuto || isRolling}
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
                )}

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
                      !wallet ||
                      isRolling ||
                      (coinData && coinData[0].amount < 0.0001)
                        ? true
                        : false
                    }
                    onClickFunction={onSubmit}
                  >
                    {isRolling ? <Loader /> : "BET"}
                  </BetButton>
                </div>
              </form>
            </FormProvider>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <div className="w-full flex justify-between items-center h-[2.125rem] mb-7 sm:mb-0">
          <div>
            {isRolling ? (
              <div className="font-chakra text-xs sm:text-sm font-medium text-white text-opacity-75">
                Betting ...
              </div>
            ) : null}
          </div>
          <ResultsSlider results={betResults} align={"horizontal"} />
        </div>
        <div className="w-full my-16 md:my-20">
          <DraggableBar
            choice={choice}
            setChoice={setChoice}
            strikeNumber={strikeNumber}
            result={result}
            rollType={rollType}
            draggable={startAuto || isRolling ? false : true}
          />
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
                  value={multiplier}
                  type="number"
                  maxLength={1}
                  step={1}
                  min={1.0}
                  max={9900.0}
                  disabled={startAuto || isRolling}
                  onChange={(e) => handleMultiplierInput(e)}
                />
              </div>

              <div
                className="flex flex-col w-full"
                onClick={() => {
                  if (!startAuto && !isRolling)
                    setRollType(rollType === "over" ? "under" : "over");
                }}
              >
                {rollType === "over" ? (
                  <span className="text-[#F0F0F0] text-xs font-changa font-semibold mb-1">
                    Roll Over
                  </span>
                ) : (
                  <span className="text-[#F0F0F0] text-xs font-chakra font-semibold mb-1">
                    Roll Under
                  </span>
                )}
                <span className="flex justify-between items-center bg-[#202329] text-xs font-chakra text-white rounded-md px-2 md:px-5 py-3">
                  {choice.toFixed(0)}.00
                  <Image
                    src="/assets/sync.svg"
                    alt="roll type"
                    width={15}
                    height={15}
                  />
                </span>
              </div>

              {choice && (
                <div className="flex flex-col w-full">
                  <span className="text-[#F0F0F0] font-chakra font-semibold text-xs mb-1">
                    Chance
                  </span>
                  <input
                    className={`bg-[#202329] w-full min-w-0 font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3 placeholder-[#94A3B8] placeholder-opacity-40 outline-none`}
                    value={chance}
                    type="number"
                    maxLength={1}
                    step={1}
                    min={0}
                    max={98.0}
                    disabled={startAuto || isRolling}
                    onChange={(e) => handleChanceInput(e)}
                  />
                </div>
              )}
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
