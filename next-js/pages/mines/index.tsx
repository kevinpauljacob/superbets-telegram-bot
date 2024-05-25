import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import BetSetting from "@/components/BetSetting";
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
import { translator, formatNumber } from "@/context/transactions";
import { minGameAmount, truncateNumber } from "@/context/gameTransactions";
import { useSession } from "next-auth/react";
import user from "@/models/staking/user";

export default function Mines() {
  const wallet = useWallet();
  const methods = useForm();
  const { data: session, status } = useSession();
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
    kenoRisk,
    setKenoRisk,
    houseEdge,
    maxBetAmt,
    language,
  } = useGlobalContext();
  const [betAmt, setBetAmt] = useState<number | undefined>();
  const [userInput, setUserInput] = useState<number | undefined>();
  const [isRolling, setIsRolling] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [strikeNumbers, setStrikeNumbers] = useState<number[]>([]);
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>();
  const [minesCount, setMinesCount] = useState<number>(3);
  const [gameId, setGameId] = useState<number>();
  const [betActive, setBetActive] = useState(false);
  const [autoPick, setAutoPick] = useState<boolean>(false);
  const [dropDown, setDropDown] = useState<boolean>(false);

  const defaultUserBets = Array.from({ length: 25 }, (_, index) => ({
    result: "",
    pick: false,
  }));
  const [userBets, setUserBets] = useState(defaultUserBets);

  const options = [];
  for (let i = 1; i <= 24; i++) {
    options.push({ key: i, value: i, label: `${i}` });
  }

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setAutoBetCount(parseFloat(e.target.value));
  };

  const handleMinesCountChange = (value: number) => {
    setMinesCount(value);
    setDropDown(false);
  };

  const handleDropDown = () => {
    setDropDown(!dropDown);
  };

  const handleConclude = async () => {
    try {
      const response = await fetch(`/api/games/mines/conclude`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          gameId: gameId,
        }),
      });

      const { success, message, result, amountWon } = await response.json();

      if (success != true) {
        errorCustom(message);
        throw new Error(message);
      }

      const win = result === "Won";
      if (win) {
        successCustom(message);
        soundAlert("/sounds/win.wav");
      } else errorCustom(message);

      if (success) {
        setRefresh(true);
        setBetActive(false);
      }
    } catch (error) {
      console.error("Error occurred while betting:", error);
    }
  };

  const handlePick = async (number: number) => {
    try {
      const response = await fetch(`/api/games/mines/pick`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          gameId: gameId,
          userBet: number - 1,
        }),
      });

      const { success, message, result } = await response.json();

      if (success != true) {
        throw new Error(message);
      }

      const updatedUserBets = [...userBets];
      updatedUserBets[number - 1] = {
        result: result === "Pending" ? "Pending" : "Lost",
        pick: true,
      };
      setUserBets(updatedUserBets);

      if (result === "Lost") {
        setBetActive(false);
        errorCustom(message);
        setIsRolling(false);
      }

      const win: boolean = result === "Pending";
      if (win) soundAlert("/sounds/win.wav");

      if (success) {
        setRefresh(true);
      }
    } catch (error) {
      console.error("Error occurred while betting:", error);
    }
  };

  const handleBet = async () => {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }
      if (!betAmt || betAmt === 0) {
        throw new Error("Set Amount.");
      }
      if (coinData && coinData[0].amount < betAmt) {
        throw new Error("Insufficient balance for bet !");
      }

      setIsRolling(true);
      setUserBets(defaultUserBets);
      const response = await fetch(`/api/games/mines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          amount: betAmt,
          tokenMint: "SOL",
          minesCount: minesCount,
        }),
      });

      const { success, message, gameId } = await response.json();

      if (success != true) {
        throw new Error(message);
      }

      if (success) {
        setGameId(gameId);
        setBetActive(true);
        setRefresh(true);
        successCustom(message);
        // for (const number of strikeNumbers) {
        //   await new Promise((resolve) => setTimeout(resolve, 200));

        //   if (chosenNumbers.includes(number)) {
        //     soundAlert("/sounds/win3.wav");
        //   } else {
        //     soundAlert("/sounds/betbutton.wav");
        //   }
        //   setStrikeNumbers((prevNumbers) => [...prevNumbers, number]);
        // }
      }

      // const win = result === "Won";
      // if (win) soundAlert("/sounds/win.wav");

      // auto options
      // if (betType === "auto") {
      //   if (useAutoConfig && win) {
      //     setBetAmt(
      //       autoWinChangeReset
      //         ? userInput!
      //         : betAmt + ((autoWinChange ?? 0) * betAmt) / 100.0,
      //     );
      //   } else if (useAutoConfig && !win) {
      //     setBetAmt(
      //       autoLossChangeReset
      //         ? userInput!
      //         : betAmt + ((autoLossChange ?? 0) * betAmt) / 100.0,
      //     );
      //   }
      // update profit / loss
      // setAutoBetProfit(
      //   autoBetProfit +
      //     (win ? strikeMultiplier * (1 - houseEdge) - 1 : -1) * betAmt,
      // );
      // update count
      //   if (typeof autoBetCount === "number") {
      //     autoBetCount === 1 && warningCustom("Auto bet stopped", "top-left");
      //   } else
      //     setAutoBetCount(
      //       autoBetCount.length > 12
      //         ? autoBetCount.slice(0, 5)
      //         : autoBetCount + 1,
      //     );
      // }
    } catch (error: any) {
      errorCustom(error?.message ?? "Could not make the Bet.");
      setIsRolling(false);
      setAutoBetCount(0);
      setStartAuto(false);
      console.error("Error occurred while betting:", error);
    } finally {
      setIsRolling(false);
    }
  };

  const disableInput = useMemo(() => {
    return betType === "auto" && startAuto ? true : false || isRolling;
  }, [betType, startAuto, isRolling]);

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
        warningCustom("Profit limit reached.", "top-left");
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
        warningCustom("Loss limit reached.", "top-left");
        setAutoBetCount(0);
        setStartAuto(false);
        return;
      }
      setTimeout(() => {
        handleBet();
      }, 500);
    } else {
      setStartAuto(false);
      setAutoBetProfit(0);
      setUserInput(betAmt);
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
        // console.log("Auto betting. config: ", useAutoConfig);
        setStartAuto(true);
      }
    }
  };

  const Autopick = () => {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            // handleAutoPick();
          }}
          disabled={disableInput}
          className={`${
            autoPick === true
              ? "border-[#7839C5] text-opacity-100"
              : "border-transparent hover:border-[#7839C580] text-opacity-80"
          } w-full flex items-center justify-center disabled:opacity-50 gap-1 rounded-lg text-center cursor-pointer border-2 bg-[#202329] h-[3.75rem] lg:h-11 font-chakra text-base tracking-wider text-white font-semibold`}
        >
          {translator("AUTOPICK", language)}
        </button>
        <button
          type="button"
          onClick={() => {
            // handleClear();
          }}
          disabled={disableInput}
          className={`${
            autoPick === false
              ? "border-transparent hover:border-[#7839C580] text-opacity-80"
              : "border-transparent hover:border-[#7839C580] text-opacity-80"
          } w-full flex items-center justify-center disabled:opacity-50 gap-1 rounded-lg text-center cursor-pointer border-2 bg-[#202329] h-[3.75rem] lg:h-11 font-chakra text-base tracking-wider text-white font-semibold`}
        >
          {translator("CLEAR", language)}
        </button>
      </>
    );
  };

  return (
    <GameLayout title="Mines">
      <GameOptions>
        <>
          <div className="relative w-full flex lg:hidden mb-[1.4rem]">
            {startAuto && (
              <div
                onClick={() => {
                  soundAlert("/sounds/betbutton.wav");
                  warningCustom("Auto bet stopped", "top-left");
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
                !wallet ||
                !session?.user ||
                isRolling ||
                (coinData && coinData[0].amount < minGameAmount) ||
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
          <div className="w-full flex flex-col nobar">
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
                  currentMultiplier={10}
                  leastMultiplier={10}
                  game="mines"
                  disabled={disableInput}
                />
                {!betActive && (
                  <div className="mb-6 flex flex-col w-full">
                    <div className="mb-1 w-full text-xs font-changa text-opacity-90">
                      <label className="text-white/90">Mines</label>
                    </div>
                    <div
                      className={`${
                        dropDown ? "" : ""
                      } relative flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
                      onClick={handleDropDown}
                    >
                      <div className="bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra placeholder-opacity-40 outline-none w-full">
                        {minesCount}
                      </div>
                      {dropDown && (
                        <div className="absolute top-14 z-50 max-h-[300px] overflow-y-scroll modalscrollbar left-0 bg-[#202329] border border-[#2A2E38] rounded-[8px] w-full">
                          {options.map((option) => (
                            <div
                              key={option.key}
                              className={`${
                                minesCount === option.value
                                  ? "text-white bg-white/20 hover:bg-white/20"
                                  : "hover:bg-white/10"
                              } border-b border-r text-[#94A3B8] font-chakra border-[#2A2E38] py-1.5 px-3`}
                              onClick={() =>
                                handleMinesCountChange(option.value)
                              }
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {betActive && (
                  <>
                    <div className="flex gap-2 w-full mb-8">
                      <div className="w-1/2">
                        <label className="text-xs text-white/90 font-changa mb-1">
                          Mines
                        </label>
                        <div className="bg-[#202329] text-[#94A3B8] font-chakra rounded-[8px] flex items-center h-11 px-4">
                          {minesCount}
                        </div>
                      </div>
                      <div className="w-1/2">
                        <label className="text-xs text-white/90 font-changa mb-1">
                          Gems
                        </label>
                        <div className="bg-[#202329] text-[#94A3B8] font-chakra rounded-[8px] flex items-center h-11 px-4">
                          {25 - minesCount}
                        </div>
                      </div>
                    </div>
                    <div className="border border-[#FFFFFF0D] rounded-[5px] font-changa text-white text-xs font-medium p-5 mb-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p>Current Profit</p>
                          <p>0.00 SOL</p>
                        </div>
                        <div className="flex justify-between items-center text-fomo-green">
                          <p>0.000</p>
                          <p>0.00x</p>
                        </div>
                      </div>
                      <div className="flex items-center w-full">
                        <div className="h-[1px] bg-[#FFFFFF0D] w-full"></div>
                        <Image
                          src="/assets/arrowInCircle.svg"
                          alt="arrowInCircle"
                          width={24}
                          height={24}
                        />
                        <div className="h-[1px] bg-[#FFFFFF0D] w-full"></div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p>Profit on next tile</p>
                          <p>0.00 SOL</p>
                        </div>
                        <div className="flex justify-between items-center text-fomo-green">
                          <p>0.000</p>
                          <p>0.00x</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
                        soundAlert("/sounds/betbutton.wav");
                        warningCustom("Auto bet stopped", "top-left");
                        setAutoBetCount(0);
                        setStartAuto(false);
                      }}
                      className="rounded-lg absolute w-full h-full z-20 bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
                    >
                      {translator("STOP", language)}
                    </div>
                  )}
                  <BetButton
                    disabled={
                      !wallet ||
                      !session?.user ||
                      isRolling ||
                      (coinData && coinData[0].amount < minGameAmount) ||
                      (betActive && !userBets.some((bet) => bet.pick)) ||
                      (betAmt !== undefined &&
                        maxBetAmt !== undefined &&
                        betAmt > maxBetAmt)
                        ? true
                        : false
                    }
                    onClickFunction={
                      !betActive
                        ? betType === "auto"
                          ? onSubmit
                          : handleBet
                        : handleConclude
                    }
                  >
                    {isRolling ? <Loader /> : betActive ? "CASHOUT" : "BET"}
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
                {translator("Betting", language)}...
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex justify-center items-center w-full mb-[1.4rem] sm:my-5">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 text-white text-sm md:text-xl font-chakra">
            {Array.from({ length: 25 }, (_, index) => index + 1).map(
              (index) => (
                <button
                  key={index}
                  className={`border-2 ${
                    userBets[index - 1].result === "Pending"
                      ? "border-[#FCB10F]"
                      : userBets[index - 1].result === "Lost"
                      ? "border-[#F1323E]"
                      : "border-[#202329] hover:border-white/30"
                  }  bg-[#202329] flex items-center justify-center cursor-pointer rounded-md text-center transition-all duration-300 ease-in-out w-[45px] h-[45px] sm:w-[55px] sm:h-[55px] md:w-[80px] md:h-[80px] xl:w-[95px] xl:h-[95px]`}
                  disabled={userBets[index - 1].pick}
                  onClick={() => betActive && handlePick(index)}
                >
                  {userBets[index - 1].result === "Pending" &&
                  userBets[index - 1].pick === true ? (
                    <div className="bg-[#FCB10F33] w-full h-full flex items-center justify-center p-1.5 sm:p-3">
                      <Image
                        src="/assets/gem.svg"
                        alt="Gem"
                        layout="responsive"
                        height={100}
                        width={100}
                      />
                    </div>
                  ) : userBets[index - 1].result === "Lost" &&
                    userBets[index - 1].pick === true ? (
                    <div className="bg-[#F1323E33] w-full h-full flex items-center justify-center p-1.5 sm:p-3">
                      <Image
                        src="/assets/mine.svg"
                        alt="Gem"
                        layout="responsive"
                        height={100}
                        width={100}
                      />
                    </div>
                  ) : null}
                </button>
              ),
            )}
          </div>
        </div>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
