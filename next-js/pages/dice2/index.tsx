import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import BetSetting from "@/components/BetSetting";
import DraggableBar from "@/components/games/Dice2/DraggableBar";
import { useGlobalContext } from "@/components/GlobalContext";
import {
  GameDisplay,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import { FormProvider, useForm } from "react-hook-form";
import Loader from "@/components/games/Loader";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import ResultsSlider from "@/components/ResultsSlider";
import { loopSound, soundAlert } from "@/utils/soundUtils";
import Bets from "../../components/games/Bets";
import ConfigureAutoButton from "@/components/ConfigureAutoButton";
import AutoCount from "@/components/AutoCount";
import ProfitBox from "@/components/ProfitBox";
import {
  errorCustom,
  successCustom,
  warningCustom,
} from "@/components/toasts/ToastGroup";
import { formatNumber, translator } from "@/context/transactions";
import { useSession } from "next-auth/react";
import { GameType } from "@/utils/provably-fair";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function Dice2() {
  const walletModal = useWalletModal();
  const methods = useForm();
  const {
    getBalance,
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
    houseEdge,
    maxBetAmt,
    language,
    selectedCoin,
    enableSounds,
    setShowWalletModal,
    setShowConnectModal,
    updatePNL,
    minGameAmount,
    session,
    status,
    betAmtError,
  } = useGlobalContext();
  const [betAmt, setBetAmt] = useState<number | undefined>();
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
        rollType === "over" ? 100 - 100 / floatValue : 100 / floatValue;

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
        rollType === "over" ? 100 / (100 - floatValue) : 100 / floatValue;
      const roundedMultiplier = parseFloat(calculatedMultiplier.toFixed(4));
      setMultiplier(roundedMultiplier);

      const calculatedChoice =
        rollType === "over" ? 100 - floatValue : floatValue;
      setChoice(calculatedChoice);
    }
  };

  const handleBet = async () => {
    // console.log(
    //   "betting",
    //   autoWinChange,
    //   autoLossChange,
    //   autoWinChangeReset,
    //   autoLossChangeReset,
    //   autoStopProfit,
    //   autoStopLoss,
    //   startAuto,
    //   autoBetCount,
    //   autoBetProfit,
    //   betAmt,
    // );
    try {
      if (betAmtError) {
        throw new Error(translator("Invalid amount!!", language));
      }
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
      setIsRolling(true);
      const response = await fetch(`/api/games/dice2`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session?.user?.email,
          amount: betAmt,
          tokenMint: selectedCoin?.tokenMint,
          chance: chance,
          direction: rollType === "over" ? "over" : "under",
        }),
      });

      const { success, message, result, strikeNumber, amountWon } =
        await response.json();

      if (success !== true) {
        throw new Error(message);
      }

      const win = result === "Won";
      if (win) {
        successCustom(
          translator(message, language) +
            ` ${formatNumber(amountWon)} ${selectedCoin?.tokenName}`,
        );
        soundAlert("/sounds/win.wav", !enableSounds);
      } else errorCustom(translator(message, language));
      const newBetResult = { result: strikeNumber, win };

      updatePNL(GameType.dice2, win, betAmt, multiplier);

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
      loopSound("/sounds/diceshake.wav", 0.3, !enableSounds);

      // auto options
      if (betType === "auto") {
        // console.log(
        //   autoWinChange,
        //   autoLossChange,
        //   autoWinChangeReset,
        //   autoLossChangeReset,
        // );
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
            warningCustom(translator("Auto bet stopped", language), "top-left");
        } else
          setAutoBetCount(
            autoBetCount.length > 12
              ? autoBetCount.slice(0, 5)
              : autoBetCount + 1,
          );
      }
    } catch (error: any) {
      errorCustom(
        translator(error?.message ?? "Could not make the Bet.", language),
      );
      console.error("Error occurred while betting:", error);
      setAutoBetCount(0);
      setStartAuto(false);
      setIsRolling(false);
    } finally {
      setIsRolling(false);
    }
  };

  const disableInput = useMemo(() => {
    return betType === "auto" && startAuto ? true : false || isRolling;
  }, [betType, startAuto, isRolling]);

  useEffect(() => {
    const calculateMultiplier = () => {
      if (rollType === "over") {
        const calculatedMultiplier = (100 / (100 - choice)).toPrecision(4);
        setMultiplier(parseFloat(calculatedMultiplier));
      } else if (rollType === "under") {
        const calculatedMultiplier = (100 / choice).toPrecision(4);
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
    if (refresh && session?.user) {
      getBalance();
      setRefresh(false);
    }
  }, [session?.user, refresh]);

  useEffect(() => {
    setBetAmt(userInput);
  }, [userInput]);

  useEffect(() => {
    // console.log("Auto: ", startAuto, autoBetCount);
    if (
      betType === "auto" &&
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
      handleBet();
    } else {
      setStartAuto(false);
      setAutoBetProfit(0);
      setUserInput(betAmt);
    }
  }, [startAuto, autoBetCount]);

  const onSubmit = async (data: any) => {
    if (betType === "auto") {
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
    } else handleBet();
  };

  return (
    <GameLayout title="Dice 2">
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
              betAmt={betAmt}
              disabled={isRolling}
              onClickFunction={onSubmit}
            >
              {isRolling ? <Loader /> : "BET"}
            </BetButton>
          </div>
          {betType === "auto" && (
            <div className="w-full flex lg:hidden">
              <ConfigureAutoButton disabled={disableInput} />
            </div>
          )}
          <div className="w-full hidden lg:flex">
            <BetSetting
              betSetting={betType}
              setBetSetting={setBetType}
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
                  currentMultiplier={multiplier}
                  leastMultiplier={1}
                  game="dice2"
                  disabled={disableInput}
                />
                <div className="mb-4">
                  <ProfitBox amount={betAmt ?? 0} multiplier={multiplier} />
                </div>
                {betType === "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <AutoCount loading={isRolling || startAuto} />
                    <div className="w-full hidden lg:flex">
                      <ConfigureAutoButton disabled={disableInput} />
                    </div>
                  </div>
                )}

                <div className="relative w-full hidden lg:flex mt-2">
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
                    betAmt={betAmt}
                    disabled={isRolling}
                    // onClickFunction={onSubmit}
                  >
                    {isRolling ? <Loader /> : "BET"}
                  </BetButton>
                </div>
              </form>
            </FormProvider>
            <div className="w-full flex lg:hidden">
              <BetSetting betSetting={betType} setBetSetting={setBetType} />
            </div>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <div className="w-full flex justify-between items-center h-[2.125rem] mb-7 sm:mb-0">
          <div>
            {isRolling ? (
              <div className="font-chakra text-xs sm:text-sm font-medium text-white text-opacity-75">
                {translator("Betting", language)}...
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
        <div className="flex px-0 xl:px-4 mb-0 md:mb-[1.4rem] gap-4 flex-row w-full justify-between">
          {selectedCoin &&
            selectedCoin.amount > minGameAmount &&
            session?.user?.wallet && (
              <>
                <div className="flex flex-col w-full">
                  <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
                    {translator("Multiplier", language)}
                  </span>
                  <input
                    id={"multiplier-input"}
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
                      {translator("Roll Over", language)}
                    </span>
                  ) : (
                    <span className="text-[#F0F0F0] text-xs font-chakra font-semibold mb-1">
                      {translator("Roll Under", language)}
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
                    <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
                      {translator("Chance", language)}
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
