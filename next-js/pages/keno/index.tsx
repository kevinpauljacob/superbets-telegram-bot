import React, { useState, useEffect } from "react";
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
import HistoryTable from "@/components/games/Keno/HistoryTable";
import { FormProvider, useForm } from "react-hook-form";
import { BsInfinity } from "react-icons/bs";
import Loader from "@/components/games/Loader";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import showInfoToast from "@/components/games/toasts/toasts";
import ResultsSlider from "@/components/ResultsSlider";
import { riskToChance } from "@/components/games/Keno/RiskToChance";

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

  const multipliers = riskToChance[risk][chosenNumbers.length];
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
        toast.error("10 numbers can be selected at max");
      }
    }
  };

  const handleAutoPick = () => {
    setAutoPick(true);
    setStrikeNumbers([]);
    setChosenNumbers([]);
    const min = 1;
    const max = 40;
    const count = 10;

    const uniqueNumbers: Set<number> = new Set();
    while (uniqueNumbers.size < count) {
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      uniqueNumbers.add(randomNumber);
    }

    const randomNumbers: number[] = Array.from(uniqueNumbers);
    setChosenNumbers(randomNumbers);
    console.log("chosenNumbers", randomNumbers);
  };

  const handleClear = () => {
    setChosenNumbers([]);
    setAutoPick((prevAutoPick) => !prevAutoPick);
  };

  const handleBet = async () => {
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
          toast.error(message);
          throw new Error(message);
        }

        if (result == "Won") toast.success(message, { duration: 2000 });
        else toast.error(message, { duration: 2000 });

        const win = result === "Won";

        if (success) {
          setStrikeNumbers(strikeNumbers);
          setStrikeMultiplier(strikeMultiplier);
          console.log("strikeNumbers", strikeNumbers);
          setRefresh(true);
        }

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
            autoBetProfit + (win ? strikeMultiplier - 1 : -1) * betAmt,
          );
          // update count
          if (typeof autoBetCount === "number")
            setAutoBetCount(autoBetCount - 1);
          else setAutoBetCount(autoBetCount + 1);
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
    <GameLayout title="FOMO - Keno">
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
          <div className="w-full flex flex-col no-scrollbar overflow-y-auto">
            <FormProvider {...methods}>
              <form
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                {/* amt input  */}
                <BetAmount betAmt={userInput} setBetAmt={setUserInput} />
                <div className="mb-6 w-full">
                  <div className="flex justify-between text-xs mb-2">
                    <p className="font-medium font-changa text-[#F0F0F0] text-opacity-90">
                      Risk
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full items-center rounded-[8px] text-white font-chakra text-sm font-semibold bg-[#0C0F16] p-4">
                    <div
                      onClick={() => setRisk("classic")}
                      className={`text-center w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                        risk === "classic"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      }`}
                    >
                      Classic
                    </div>
                    <div
                      onClick={() => setRisk("low")}
                      className={`text-center w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                        risk === "low"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      }`}
                    >
                      Low
                    </div>
                    <div
                      onClick={() => setRisk("medium")}
                      className={`text-center w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                        risk === "medium"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      }`}
                    >
                      Medium
                    </div>
                    <div
                      onClick={() => setRisk("high")}
                      className={`text-center w-full rounded-[5px] border-[2px] bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                        risk === "high"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      }`}
                    >
                      High
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-row gap-3 mb-5">
                  <div
                    onClick={() => {
                      handleAutoPick();
                    }}
                    className={`${
                      autoPick === true
                        ? "border-[#7839C5] text-opacity-100"
                        : "border-transparent hover:border-[#7839C580] text-opacity-80"
                    } w-full flex items-center justify-center gap-1 rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-chakra text-xl text-white font-semibold`}
                  >
                    AUTOPICK
                  </div>
                  <div
                    onClick={() => {
                      handleClear();
                    }}
                    className={`${
                      autoPick === false
                        ? "border-transparent hover:border-[#7839C580] text-opacity-80"
                        : "border-transparent hover:border-[#7839C580] text-opacity-80"
                    } w-full flex items-center justify-center gap-1 rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-chakra text-xl text-white font-semibold`}
                  >
                    CLEAR
                  </div>
                </div>

                {betType === "manual" ? (
                  <></>
                ) : (
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
                      className={`relative mb-[1.4rem] rounded-md w-full h-11 flex items-center justify-center opacity-75 cursor-pointer text-white text-opacity-90 border-2 border-white bg-white bg-opacity-0 hover:bg-opacity-5`}
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
                      className="rounded-lg absolute w-full h-full z-20 bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
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
        <div className="w-full flex justify-between items-center">
          <div className="hidden sm:absolute top-10 left-12">
            {isRolling ? (
              <div className="font-chakra text-sm font-medium text-white text-opacity-75">
                Betting...
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex justify-center items-center w-full mb-5 sm:my-5">
          <div className="grid grid-cols-8 gap-2 text-white text-sm md:text-xl font-chakra">
            {Array.from({ length: 40 }, (_, index) => index + 1).map(
              (number) => (
                <div
                  key={number}
                  onClick={() => handleChosenNumber(number)}
                  className={`flex items-center justify-center cursor-pointer ${
                    !isRolling &&
                    strikeNumbers.length === 0 &&
                    chosenNumbers.includes(number)
                      ? "bg-[#7839C5]"
                      : strikeNumbers.includes(number) &&
                        chosenNumbers.includes(number)
                      ? "bg-black border-2 border-fomo-green"
                      : chosenNumbers.includes(number)
                      ? "bg-black border-2 border-fomo-red text-fomo-red"
                      : "bg-[#202329]"
                  } rounded-md text-center transition-all duration-300 ease-in-out w-[35px] h-[35px] sm:w-[55px] sm:h-[55px] md:w-[60px] md:h-[60px] xl:w-[65px] xl:h-[65px]`}
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
                  <div className="flex justify-between gap-[3px] sm:gap-3.5 text-white bg-[#202329] rounded-[5px] w-full mt-3">
                    {multipliers.map((multiplier, index) => (
                      <div
                        key={index}
                        className={`${
                          !isRolling &&
                          strikeNumbers.length > 0 &&
                          commonNumbers.length === index
                            ? "bg-white/20"
                            : ""
                        } flex justify-center items-center rounded-[5px] font-chakra text-[8px] sm:text-xs font-semibold transition-all duration-300 ease-in-out py-1 sm:py-3 w-full`}
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
        <HistoryTable refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
