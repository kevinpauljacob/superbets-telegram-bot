import React, { useState, useEffect, useRef } from "react";
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
import HistoryTable from "@/components/games/Wheel/HistoryTable";
import { FormProvider, useForm } from "react-hook-form";
import { BsInfinity } from "react-icons/bs";
import Loader from "@/components/games/Loader";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import showInfoToast from "@/components/games/toasts/toasts";
import ResultsSlider from "@/components/ResultsSlider";
import Arc from "@/components/games/Wheel/Arc";
import { riskToChance } from "@/components/games/Wheel/Segments";

export default function Wheel() {
  const wallet = useWallet();
  const methods = useForm();
  const wheelRef = useRef<HTMLDivElement>(null);
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
  const [userInput, setUserInput] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [strikeNumber, setStrikeNumber] = useState<number>(0);
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>();
  const [risk, setRisk] = useState<"low" | "medium" | "high">("low");
  const [segments, setSegments] = useState<number>(10);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [betResults, setBetResults] = useState<
    { result: number; win: boolean }[]
  >([]);
  const [hoveredMultiplier, setHoveredMultiplier] = useState<number | null>(
    null,
  );

  const multipliers = riskToChance[risk];
  const sortedMultipliers = multipliers
    .slice()
    .sort((a, b) => a.multiplier - b.multiplier);

  const uniqueSegments = sortedMultipliers.filter(
    (segment, index, self) =>
      index === 0 || self[index - 1].multiplier !== segment.multiplier,
  );

  useEffect(() => {
    if (!wheelRef.current) return;
    const rotationAngle = 360 / segments;
    setRotationAngle(rotationAngle);
  }, [segments]);

  const spinWheel = (strikeNumber: number) => {
    const resultAngle = ((strikeNumber - 1) * 360) / 99;
    console.log("resultAngle", resultAngle);
    if (wheelRef.current) {
      wheelRef.current.style.transition = "transform 1s ease-in-out";
      wheelRef.current.style.transform = `rotate(${360 - resultAngle}deg)`;
    }
  };

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setAutoBetCount(parseFloat(e.target.value));
  };

  const handleBetAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const amount = parseFloat(event.target.value); // Convert input value to float
    setBetAmt(amount); // Update betAmt state
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
      setStrikeNumber(0);
      try {
        const response = await fetch(`/api/games/wheel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet: wallet.publicKey,
            amount: betAmt,
            tokenMint: "SOL",
            segments: segments,
            risk: risk,
          }),
        });

        const { success, message, result, strikeNumber, strikeMultiplier } =
          await response.json();

        spinWheel(strikeNumber);
        if (success != true) {
          toast.error(message);
          throw new Error(message);
        }

        if (result == "Won") toast.success(message, { duration: 2000 });
        else toast.error(message, { duration: 2000 });

        const win = result === "Won";
        const newBetResult = { result: strikeMultiplier, win };

        setBetResults((prevResults) => {
          const newResults = [...prevResults, newBetResult];
          if (newResults.length > 6) {
            newResults.shift();
          }
          return newResults;
        });

        if (success) {
          setStrikeNumber(strikeNumber);
          setStrikeMultiplier(strikeMultiplier);
          console.log("strikeNumber", strikeNumber);
          setRefresh(true);
        }

        // auto options
        if (betType === "auto") {
          if (useAutoConfig && autoWinChange && win) {
            setBetAmt(
              autoWinChangeReset
                ? userInput
                : betAmt + (autoWinChange * betAmt) / 100.0,
            );
          } else if (useAutoConfig && autoLossChange && !win) {
            setAutoBetProfit(autoBetProfit - betAmt);
            setBetAmt(
              autoLossChangeReset
                ? userInput
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
    setBetAmt(userInput);
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
      console.log("Auto betting. config: ", useAutoConfig);
      setStartAuto(true);
    } else if (wallet.connected) handleBet();
  };

  return (
    <GameLayout title="FOMO - Wheel">
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
                <div className="mb-6 w-full">
                  <div className="flex justify-between text-sm mb-2">
                    <p className="font-medium font-changa text-[#F0F0F0] text-opacity-90">
                      Risk
                    </p>
                  </div>
                  <div className="group flex w-full items-center rounded-[8px] text-white font-chakra text-sm font-semibold bg-[#0C0F16] p-4">
                    <div
                      onClick={() => setRisk("low")}
                      className={`text-center bg-[#202329] border-2 rounded-md w-1/3 py-3 transition-all ${
                        risk === "low"
                          ? "border-[#7839C5]"
                          : "border-transparent"
                      }`}
                    >
                      Low
                    </div>
                    <div
                      onClick={() => setRisk("medium")}
                      className={`text-center bg-[#202329] border-2 rounded-md mx-3 w-1/3 py-3 transition-all ${
                        risk === "medium"
                          ? "border-[#7839C5]"
                          : "border-transparent"
                      }`}
                    >
                      Medium
                    </div>
                    <div
                      onClick={() => setRisk("high")}
                      className={`text-center bg-[#202329] border-2 rounded-md w-1/3 py-3 transition-all ${
                        risk === "high"
                          ? "border-[#7839C5]"
                          : "border-transparent"
                      }`}
                    >
                      High
                    </div>
                  </div>
                </div>

                <div className="mb-6 w-full">
                  <div className="flex justify-between text-sm mb-2 font-medium font-changa text-[#F0F0F0] text-opacity-90">
                    <p className="">Segments</p>
                    <p className="text-[#94A3B8]">{segments}</p>
                  </div>
                  <div className="w-full">
                    <input
                      type="range"
                      min={10}
                      max={50}
                      step={10}
                      value={segments}
                      onChange={(e) => setSegments(parseInt(e.target.value))}
                      className="defaultSlider w-full bg-[#2A2E38] appearance-none h-[5px] rounded-full"
                    />
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
                            autoBetCount === "inf"
                              ? "placeholder-opacity-100"
                              : "placeholder-opacity-40"
                          } placeholder-opacity-40 outline-none`}
                        />
                        <span
                          className={`text-2xl font-medium text-white text-opacity-50 ${
                            autoBetCount === "inf"
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
        <div className="w-full flex justify-between items-center mb-7 sm:mb-2">
          <div>
            {isRolling ? (
              <div className="font-chakra text-sm font-medium text-white text-opacity-75">
                Betting...
              </div>
            ) : null}
          </div>
          <ResultsSlider results={betResults} />
        </div>
        <div className="flex justify-center items-center w-full my-5">
          <div className="relative  w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] flex justify-center">
            <Image
              src="/assets/wheelPointer.svg"
              alt="Pointer"
              width={35}
              height={35}
              id="pointer"
              className={`${
                isRolling ? "-rotate-[20deg]" : "rotate-0"
              } absolute z-50 -top-3 transition-all duration-100`}
            />
            <div
              ref={wheelRef}
              className={`${
                isRolling ? "animate-spin" : "animate-none"
              } relative w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] rounded-full overflow-hidden`}
            >
              {typeof window !== "undefined" && (
                <svg viewBox="0 0 300 300">
                  {rotationAngle &&
                    Array.from({ length: segments }).map((_, index) => (
                      <Arc
                        key={index}
                        index={index}
                        rotationAngle={rotationAngle}
                        risk={risk}
                        segments={segments}
                      />
                    ))}
                </svg>
              )}
            </div>
            <div className="absolute z-10 w-[79.75%] h-[79.75%] rounded-full bg-black/10 left-[10%] top-[10%]" />
            <div className="absolute z-20 w-[66.5%] h-[66.5%] rounded-full bg-[#171A1F] left-[16.75%] top-[16.75%]" />
            <div className="absolute z-20 w-[62.5%] h-[62.5%] rounded-full bg-[#0C0F16] left-[18.75%] top-[18.75%] text-white flex items-center justify-center text-2xl font-semibold font-changa text-opacity-80 ">
              {strikeMultiplier}
            </div>
          </div>
        </div>
        <div className="relative flex w-full justify-between px-0 xl:px-4 mb-0 px:mb-6 gap-4">
          {coinData && coinData[0].amount > 0.0001 && (
            <>
              {uniqueSegments.map((segment, index) => (
                <div
                  key={index}
                  className="relative w-full"
                  onMouseEnter={() => setHoveredMultiplier(segment.multiplier)}
                  onMouseLeave={() => setHoveredMultiplier(null)}
                >
                  <div
                    className={`w-full border-t-[6px] text-center font-chakra font-semibold bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2.5`}
                    style={{ borderColor: segment.color }}
                  >
                    {segment.multiplier}x
                  </div>
                  {hoveredMultiplier === segment.multiplier && (
                    <div className="absolute top-[-120px] left-0 z-50 flex gap-4 text-white bg-[#202329] border border-white/10 rounded-lg w-full p-4 fadeInUp duration-100 min-w-[250px]">
                      <div className="w-1/2">
                        <div className="flex justify-between text-[13px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                          <span className="">Profit</span>
                          <span>0.00 SOL</span>
                        </div>
                        <div className="border border-white/10 rounded-lg p-3 mt-2">
                          0.00
                        </div>
                      </div>
                      <div className="w-1/2">
                        <div className="text-[13px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                          Chance
                        </div>
                        <div className="border border-white/10 rounded-lg p-3 mt-2">
                          {segment.chance}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
