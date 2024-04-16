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

export default function Dice2() {
  const wallet = useWallet();
  const methods = useForm();
  const { coinData, getBalance, getWalletBalance, setShowAutoModal } =
    useGlobalContext();
  const [betAmt, setBetAmt] = useState(0);
  const [betCount, setBetCount] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [rollType, setRollType] = useState<"over" | "under">("over");
  const [strikeNumber, setStrikeNumber] = useState<number>(0);
  const [result, setResult] = useState<boolean>(false);
  const [choice, setChoice] = useState<number>(50);
  const [multiplier, setMultiplier] = useState(0);
  const [chance, setChance] = useState(0);
  const [betResults, setBetResults] = useState<
    { result: number; isWin: boolean }[]
  >([]);

  const handleBetAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const amount = parseFloat(event.target.value);
    setBetAmt(amount);
  };

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBetCount(parseFloat(e.target.value));
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

        const isWin = result === "Won";
        const newBetResult = { result: strikeNumber, isWin };

        setBetResults((prevResults) => {
          const newResults = [...prevResults, newBetResult];
          if (newResults.length > 5) {
            newResults.shift();
          }
          return newResults;
        });

        setStrikeNumber(strikeNumber);
        setResult(isWin);
        setRefresh(true);
      } catch (error) {
        console.error("Error occurred while betting:", error);
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

  return (
    <GameLayout title="FOMO - Dice 2">
      <GameOptions>
        <>
          <BetSetting betSetting={betType} setBetSetting={setBetType} />
          <div className="w-full flex flex-col">
            <FormProvider {...methods}>
              <form
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(handleBet)}
              >
                {/* amt input  */}
                <div className="mb-0 flex w-full flex-col">
                  <div className="mb-1 flex w-full items-center justify-between text-sm font-changa text-opacity-90">
                    <label className="text-white/90 font-medium font-changa">
                      Bet Amount
                    </label>
                    <span className="text-[#94A3B8] text-opacity-90 font-changa font-medium text-sm">
                      {coinData ? coinData[0]?.amount.toFixed(4) : 0} $SOL
                    </span>
                  </div>

                  <div
                    className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
                  >
                    <input
                      id={"amount-input"}
                      {...methods.register("amount", {
                        required: "Amount is required",
                      })}
                      type={"number"}
                      step={"any"}
                      autoComplete="off"
                      onChange={handleBetAmountChange}
                      placeholder={"Amount"}
                      value={betAmt}
                      className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8]  font-chakra placeholder-opacity-40 outline-none`}
                    />
                    <span
                      className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-1.5 px-4"
                      onClick={() =>
                        setBetAmt(coinData ? coinData[0]?.amount : 0)
                      }
                    >
                      MAX
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
                      ? methods.formState.errors["amount"]!.message!.toString()
                      : "NONE"}
                  </span>
                </div>
                {betType === "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <div className="mb-0 flex w-full flex-col">
                      <div className="mb-1 flex w-full items-center justify-between text-sm font-changa text-opacity-90">
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
                          placeholder={"00"}
                          value={betCount}
                          className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8]  font-chakra placeholder-opacity-40 outline-none`}
                        />
                        <span
                          className="text-2xl font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-0.5 px-3"
                          onClick={() =>
                            setBetCount(coinData ? coinData[0]?.amount : 0)
                          }
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
                      className="mb-[1.4rem] rounded-md w-full h-11 flex items-center justify-center opacity-75 cursor-pointer text-white text-opacity-90 border-2 border-white bg-white bg-opacity-0 hover:bg-opacity-5"
                    >
                      Configure Auto
                    </div>
                  </div>
                )}
                <div className="hidden md:flex w-full flex-col mt-2">
                  <button
                    type="submit"
                    disabled={
                      !wallet ||
                      isRolling ||
                      (coinData && coinData[0].amount < 0.0001)
                        ? true
                        : false
                    }
                    onClick={handleBet}
                    className={`disabled:cursor-default disabled:opacity-70 hover:opacity-90 w-full h-[3.75rem] rounded-lg transition-all bg-[#7839C5] disabled:bg-[#4b2876] hover:bg-[#9361d1] focus:bg-[#602E9E] flex items-center justify-center font-changa font-semibold text-[1.75rem] text-white`}
                  >
                    {isRolling ? <Loader /> : "BET"}
                  </button>
                </div>
              </form>
            </FormProvider>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <div className="w-full flex justify-between items-center mb-7 sm:mb-0">
          <div>
            {isRolling ? (
              <div className="font-chakra text-xs sm:text-sm font-medium text-white text-opacity-75">
                Betting ...
              </div>
            ) : null}
          </div>
          <div className="flex">
            {betResults.map((result, index) => (
              <div
                key={index}
                className={`${
                  result.isWin
                    ? "border-[#72F238] text-[#72F238]"
                    : "border-[#282E3D] text-white"
                } font-chakra text-xs sm:text-sm font-semibold border bg-[#282E3D] text-opacity-75 rounded-md transition-all duration-300 px-2 sm:px-4 py-1.5 ml-1 sm:ml-2`}
              >
                {result.result}
              </div>
            ))}
          </div>
        </div>
        <div className="w-full my-16 md:my-20">
          <DraggableBar
            choice={choice}
            setChoice={setChoice}
            strikeNumber={strikeNumber}
            result={result}
            rollType={rollType}
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
                  className="bg-[#202329] text-xs text-white font-chakra rounded-md px-2 md:px-5 py-3"
                  value={multiplier}
                  type="number"
                  maxLength={1}
                  step={1}
                  min={1.0}
                  max={9900.0}
                  onChange={(e) => handleMultiplierInput(e)}
                />
              </div>

              <div
                className="flex flex-col w-full"
                onClick={() =>
                  setRollType(rollType === "over" ? "under" : "over")
                }
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
                    className="bg-[#202329] text-xs text-white font-chakra rounded-md px-2 md:px-5 py-3"
                    value={chance.toPrecision(4)}
                    type="number"
                    maxLength={1}
                    step={1}
                    min={0}
                    max={98.0}
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
