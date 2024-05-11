import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import BetSetting from "@/components/BetSetting";
import { useGlobalContext } from "@/components/GlobalContext";
import {
  GameDisplay,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import { FormProvider, useForm } from "react-hook-form";
import { BsInfinity } from "react-icons/bs";
import Loader from "@/components/games/Loader";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import showInfoToast from "@/components/games/toasts/toasts";
import { riskToChance } from "@/components/games/Keno/RiskToChance";
import Bets from "../../components/games/Bets";
import { soundAlert } from "@/utils/soundUtils";
import ConfigureAutoButton from "@/components/ConfigureAutoButton";
import AutoCount from "@/components/AutoCount";
import {
  errorCustom,
  successCustom,
  warningCustom,
} from "@/components/toasts/ToastGroup";

export default function Keno() {
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
    houseEdge,
    maxBetAmt,
  } = useGlobalContext();
  const [betAmt, setBetAmt] = useState(0);
  const [userInput, setUserInput] = useState<number | undefined>();
  const [isRolling, setIsRolling] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [strikeNumbers, setStrikeNumbers] = useState<number[]>([]);
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>();
  const [chosenNumbers, setChosenNumbers] = useState<number[]>([]);
  const [risk, setRisk] = useState<"classic" | "low" | "medium" | "high">(
    "classic",
  );
  const [autoPick, setAutoPick] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const multipliers = riskToChance[risk][chosenNumbers.length];
  let maxMultiplier = 0;
  let leastMultiplier = 0;
  if (multipliers && multipliers.length > 0) {
    maxMultiplier = multipliers[multipliers.length - 1];
    leastMultiplier = multipliers[1];
  }
  const commonNumbers = strikeNumbers.filter((num) =>
    chosenNumbers.includes(num),
  );

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setAutoBetCount(parseFloat(e.target.value));
  };

  const handleChosenNumber = (number: number) => {
    setStrikeNumbers([]);
    const numberIndex = chosenNumbers.indexOf(number);

    if (numberIndex !== -1) {
      setChosenNumbers((prevNumbers) =>
        prevNumbers.filter((_, index) => index !== numberIndex),
      );
    } else {
      if (chosenNumbers.length < 10) {
        setChosenNumbers((prevNumbers) => [...prevNumbers, number]);
      } else {
        errorCustom("10 numbers can be selected at max");
      }
    }
  };

  const handleAutoPick = async () => {
    setAutoPick(true);
    setStrikeNumbers([]);
    const min = 1;
    const max = 40;

    let count = 10 - chosenNumbers.length;
    let randomNumbers: Array<number> = chosenNumbers.slice();

    if (chosenNumbers.length === 10) {
      count = 10;
      setChosenNumbers([]);
      randomNumbers = [];
    }

    const getRandomNumber = (max: number, min: number) => {
      let randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      return randomNumber;
    };

    for (let randomCount = 0; randomCount < count; ) {
      let randomNumber = getRandomNumber(max, min);
      if (randomNumbers.includes(randomNumber)) continue;

      await new Promise((resolve) => setTimeout(resolve, 100));

      setChosenNumbers((prevNumbers) => [...prevNumbers, randomNumber]);
      soundAlert("/sounds/betbutton.wav");
      randomNumbers.push(randomNumber);
      ++randomCount;
    }
  };

  const handleClear = () => {
    if (chosenNumbers.length !== 0) {
      setChosenNumbers([]);
      setAutoPick(false);
    }
  };

  const calculateChance = (index: number) => {
    const n = 40;
    const m = 10;
    const k = chosenNumbers.length;
    const x = index;

    function factorial(n: number) {
      if (n === 0 || n === 1) {
        return 1;
      }
      for (let i = n - 1; i >= 1; i--) {
        n *= i;
      }
      return n;
    }

    const binomialCoefficient = (n: number, k: number) => {
      if (k > n || k < 0) {
        return 0;
      }
      const numerator = factorial(n);
      const denominator = factorial(k) * factorial(n - k);
      return Math.round(numerator / denominator);
    };

    const numerator =
      binomialCoefficient(k, x) * binomialCoefficient(n - k, m - x);
    const denominator = binomialCoefficient(n, m);
    const probability = numerator / denominator;

    return probability * 100;
  };

  const handleBet = async () => {
    if (wallet.connected) {
      if (!wallet.publicKey) {
        errorCustom("Wallet not connected");
        return;
      }
      if (coinData && coinData[0].amount < betAmt) {
        errorCustom("Insufficient balance for bet !");
        return;
      }
      if (betAmt === 0) {
        errorCustom("Set Amount.");
        return;
      }
      setIsRolling(true);
      setStrikeNumbers([]);
      try {
        const response = await fetch(`/api/games/keno`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet: wallet.publicKey,
            amount: betAmt,
            tokenMint: "SOL",
            chosenNumbers: chosenNumbers,
            risk: risk,
          }),
        });

        const { success, message, result, strikeNumbers, strikeMultiplier } =
          await response.json();

        if (success != true) {
          errorCustom(message);
          throw new Error(message);
        }

        if (success) {
          setStrikeMultiplier(strikeMultiplier);
          console.log("strikeNumbers", strikeNumbers);
          setRefresh(true);
          for (const number of strikeNumbers) {
            await new Promise((resolve) => setTimeout(resolve, 200));

            if (chosenNumbers.includes(number)) {
              soundAlert("/sounds/win3.wav");
            } else {
              soundAlert("/sounds/betbutton.wav");
            }
            setStrikeNumbers((prevNumbers) => [...prevNumbers, number]);
          }
        }
        if (result == "Won") successCustom(message);
        else errorCustom(message);

        const win = result === "Won";
        if (win) soundAlert("/sounds/win.wav");

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
            autoBetProfit +
              (win ? strikeMultiplier * (1 - houseEdge) - 1 : -1) * betAmt,
          );
          // update count
          if (typeof autoBetCount === "number")
            setAutoBetCount(autoBetCount > 0 ? autoBetCount - 1 : 0);
          else
            setAutoBetCount(
              autoBetCount.length > 12
                ? autoBetCount.slice(0, 5)
                : autoBetCount + 1,
            );
        }
      } catch (error) {
        setIsRolling(false);
        setAutoBetCount(0);
        setStartAuto(false);
        console.error("Error occurred while betting:", error);
      } finally {
        setIsRolling(false);
      }
    }
  };

  const disableInput = useMemo(() => {
    return betType === "auto" && startAuto ? true : false||isRolling;
  }, [betType, startAuto,isRolling]);

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
      if (
        useAutoConfig &&
        autoStopProfit &&
        autoBetProfit > 0 &&
        autoBetProfit >= autoStopProfit
      ) {
        showInfoToast("Profit limit reached.");
        return;
      }
      if (
        useAutoConfig &&
        autoStopLoss &&
        autoBetProfit < 0 &&
        autoBetProfit <= -autoStopLoss
      ) {
        showInfoToast("Loss limit reached.");
        return;
      }
      setTimeout(() => {
        handleBet();
      }, 500);
    } else {
      setStartAuto(false);
      setAutoBetProfit(0);
    }
  }, [startAuto, autoBetCount]);

  const onSubmit = async (data: any) => {
    if (betType === "auto") {
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
        console.log("Auto betting. config: ", useAutoConfig);
        setStartAuto(true);
      }
    } else if (wallet.connected) handleBet();
  };

  const Autopick = () => {
    return (
      <>
        <button
          onClick={() => {
            handleAutoPick();
          }}
          disabled={disableInput}
          className={`${
            autoPick === true
              ? "border-[#7839C5] text-opacity-100"
              : "border-transparent hover:border-[#7839C580] text-opacity-80"
          } w-full flex items-center justify-center disabled:opacity-50 gap-1 rounded-lg text-center cursor-pointer border-2 bg-[#202329] h-[3.75rem] lg:h-11 font-chakra text-base tracking-wider text-white font-semibold`}
        >
          AUTOPICK
        </button>
        <button
          onClick={() => {
            handleClear();
          }}
          disabled={disableInput}
          className={`${
            autoPick === false
              ? "border-transparent hover:border-[#7839C580] text-opacity-80"
              : "border-transparent hover:border-[#7839C580] text-opacity-80"
          } w-full flex items-center justify-center disabled:opacity-50 gap-1 rounded-lg text-center cursor-pointer border-2 bg-[#202329] h-[3.75rem] lg:h-11 font-chakra text-base tracking-wider text-white font-semibold`}
        >
          CLEAR
        </button>
      </>
    );
  };

  return (
    <GameLayout title="FOMO - Keno">
      <GameOptions>
        <>
          <div className="relative w-full flex lg:hidden mb-[1.4rem]">
            {startAuto && (
              <div
                onClick={() => {
                  soundAlert("/sounds/betbutton.wav");
                  warningCustom("Auto bet stopped");
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
                (typeof autoBetCount === "number" && autoBetCount <= 0) ||
                (typeof autoBetCount === "string" &&
                  !autoBetCount.includes("inf")) ||
                (coinData && coinData[0].amount < 0.0001) ||
                (betAmt !== undefined &&
                  maxBetAmt !== undefined &&
                  betAmt > maxBetAmt)
                  ? true
                  : false
              }
              onClickFunction={onSubmit}
            >
              {isRolling ? <Loader /> : "BET"}
            </BetButton>
          </div>
          <div className="flex lg:hidden w-full flex-row gap-3 mb-[1.4rem]">
            <Autopick />
          </div>
          {betType === "auto" && (
            <div className="w-full flex lg:hidden" >
              <ConfigureAutoButton disabled={disableInput}/>
            </div>
          )}
          <div className="w-full hidden lg:flex">
            <BetSetting
              betSetting={betType}
              setBetSetting={setBetType}
              disabled={disableInput}
            />
          </div>
          <div className="w-full flex flex-col no-scrollbar overflow-y-auto">
            <FormProvider {...methods}>
              <form
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                {/* amt input  */}
                <BetAmount
                  betAmt={userInput}
                  setBetAmt={setUserInput}
                  currentMultiplier={
                    maxMultiplier !== undefined ? maxMultiplier : 0
                  }
                  leastMultiplier={leastMultiplier}
                  game="keno"
                  disabled={disableInput}
                />
                <div className="mb-[1.4rem] w-full">
                  <div className="flex justify-between text-xs mb-2">
                    <p className="font-medium font-changa text-[#F0F0F0] text-opacity-90">
                      Risk
                    </p>
                  </div>
                  <div className="grid lg:grid-cols-4 grid-cols-2 gap-3 w-full items-center rounded-[8px] text-white font-chakra text-sm font-semibold bg-[#0C0F16] p-4">
                    <button
                      type="button"
                      onClick={() => setRisk("classic")}
                      className={`text-center w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra disabled:opacity-50 text-white text-opacity-90 transition duration-200 ${
                        risk === "classic"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      }`}
                      disabled={disableInput}
                    >
                      Classic
                    </button>
                    <button
                      type="button"
                      onClick={() => setRisk("low")}
                      className={`text-center w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra disabled:opacity-50 text-white text-opacity-90 transition duration-200 ${
                        risk === "low"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      }`}
                      disabled={disableInput}
                    >
                      Low
                    </button>
                    <button
                      type="button"
                      onClick={() => setRisk("medium")}
                      className={`text-center w-full block m-auto rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra disabled:opacity-50 text-white text-opacity-90 transition duration-200 ${
                        risk === "medium"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      }`}
                      disabled={disableInput}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => setRisk("high")}
                      className={`text-center w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra disabled:opacity-50 text-white text-opacity-90 transition duration-200 ${
                        risk === "high"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      }`}
                      disabled={disableInput}
                    >
                      High
                    </button>
                  </div>
                </div>

                <div className="hidden lg:flex w-full flex-row gap-3 mb-[1.4rem]">
                  <Autopick />
                </div>

                {betType === "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <AutoCount
                      loading={isRolling || startAuto}
                      onChange={handleCountChange}
                    />
                    <div className="w-full hidden lg:flex">
                      <ConfigureAutoButton disabled={disableInput} />
                    </div>
                  </div>
                )}

                <div className="relative w-full hidden lg:flex mt-2">
                  {startAuto && (
                    <div
                      onClick={() => {
                        soundAlert("/sounds/betbutton.wav");
                        warningCustom("Auto bet stopped");
                        setAutoBetCount(0);
                        setStartAuto(false);
                      }}
                      className="rounded-lg absolute w-full h-full z-20 bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
                    >
                      STOP
                    </div>
                  )}
                  <BetButton
                    disabled={
                      !wallet ||
                      isRolling ||
                      (coinData && coinData[0].amount < 0.0001) ||
                      (betAmt !== undefined &&
                        maxBetAmt !== undefined &&
                        betAmt > maxBetAmt)
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
            <div className="w-full flex lg:hidden">
              <BetSetting betSetting={betType} setBetSetting={setBetType} />
            </div>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <div className="w-full flex justify-between items-center">
          <div className="hidden sm:absolute top-10 left-12">
            {isRolling ? (
              <div className="font-chakra text-sm font-medium text-white text-opacity-75">
                Betting...
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex justify-center items-center w-full mb-[1.4rem] sm:my-5">
          <div className="grid grid-cols-8 gap-2 text-white text-sm md:text-xl font-chakra">
            {Array.from({ length: 40 }, (_, index) => index + 1).map(
              (number) => (
                <div
                  key={number}
                  onClick={() => {
                    handleChosenNumber(number);
                    soundAlert("/sounds/betbutton.wav");
                  }}
                  className={`flex items-center justify-center cursor-pointer ${
                    !isRolling &&
                    strikeNumbers.length === 0 &&
                    chosenNumbers.includes(number)
                      ? "bg-[#7839C5] border-transparent"
                      : strikeNumbers.includes(number)
                      ? chosenNumbers.includes(number)
                        ? "bg-black border-fomo-green"
                        : chosenNumbers.length === 0
                        ? "bg-[#202329] border-transparent"
                        : "bg-black border-fomo-red text-fomo-red"
                      : chosenNumbers.includes(number)
                      ? "bg-[#7839C5] border-transparent"
                      : "bg-[#202329] border-transparent"
                  } rounded-md text-center border-2 transition-all duration-300 ease-in-out w-[1.75rem] h-[1.75rem] sm:w-[3.4375rem] sm:h-[3.4375rem] md:w-[3.75rem] md:h-[3.75rem] xl:w-[3.8rem] xl:h-[3.8rem]`}
                >
                  {strikeNumbers.includes(number) &&
                  chosenNumbers.includes(number) ? (
                    <div className="flex justify-center items-center bg-[#FFD100] text-black rounded-full w-[25px] h-[25px] md:w-[38px] md:h-[38px]">
                      {number}
                    </div>
                  ) : (
                    <div>{number}</div>
                  )}
                </div>
              ),
            )}
          </div>
        </div>
        <div className="relative flex w-full justify-between px-0 xl:px-4 mb-0 px:mb-6 gap-4">
          {coinData &&
            coinData[0].amount > 0.0001 &&
            chosenNumbers.length > 0 && (
              <div className="w-full">
                <div className="flex justify-between gap-[3px] sm:gap-3.5 lg:gap-2 2xl:gap-3.5 text-white w-full">
                  {multipliers.map((multiplier, index) => (
                    <div
                      key={index}
                      className="bg-[#202329] text-center font-chakra text-[8px] sm:text-xs font-semibold rounded-[5px] p-1 sm:py-3 sm:px-1 w-full"
                    >
                      {multiplier.toFixed(1)}x
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between gap-[3px] sm:gap-3.5 lg:gap-2 2xl:gap-3.5 text-white bg-[#202329] rounded-[5px] w-full mt-3">
                    {multipliers.map((multiplier, index) => (
                      <div
                        key={index}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className={`${
                          !isRolling &&
                          strikeNumbers.length > 0 &&
                          commonNumbers.length === index
                            ? "bg-white/20"
                            : ""
                        } flex hover:bg-white/20 cursor-pointer justify-center items-center rounded-[5px] font-chakra text-[8px] sm:text-xs font-semibold transition-all duration-300 ease-in-out py-1 sm:py-3 w-full`}
                      >
                        <span className="mr-1">{index}x</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path
                            d="M5 10C7.76142 10 10 7.76142 10 5C10 2.23858 7.76142 0 5 0C2.23858 0 0 2.23858 0 5C0 7.76142 2.23858 10 5 10Z"
                            fill="#FFD100"
                          />
                        </svg>
                        {hoveredIndex === index && (
                          <div className="absolute top-[-120px] left-0 xl:left-4 z-50 flex gap-4 text-white bg-[#0f0f0f] border border-white/10 rounded-[5px] w-full xl:w-[calc(100%-2rem)] p-4 fadeInUp duration-100 min-w-[250px]">
                            <div className="w-1/2">
                              <div className="flex justify-between text-[13px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                                <span className="">Profit</span>
                              </div>
                              <div className="border border-white/10 rounded-[5px] p-3 mt-2">
                                {(betAmt * multiplier).toFixed(4)} SOL
                              </div>
                            </div>
                            <div className="w-1/2">
                              <div className="text-[13px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                                Chance
                              </div>
                              <div className="border border-white/10 rounded-[5px] p-3 mt-2">
                                {calculateChance(index).toFixed(2)} %
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          {!coinData ||
            (coinData[0].amount < 0.0001 ? (
              <div className="w-full rounded-lg bg-[#d9d9d90d] bg-opacity-10 flex items-center px-3 py-3 text-white md:px-6">
                <div className="w-full text-center font-changa font-medium text-sm md:text-base text-[#F0F0F0] text-opacity-75">
                  Please deposit funds to start playing. View{" "}
                  <Link href="/balance">
                    <u>WALLET</u>
                  </Link>
                </div>
              </div>
            ) : coinData && chosenNumbers.length === 0 ? (
              <div className="w-full rounded-lg bg-[#d9d9d90d] bg-opacity-10 flex items-center px-3 py-3 text-white md:px-6">
                <div className="w-full text-center font-changa font-medium text-sm md:text-base text-[#F0F0F0] text-opacity-75">
                  Pick upto 10 numbers
                </div>
              </div>
            ) : null)}
        </div>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
