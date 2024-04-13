import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import { ROLL_TAX } from "../../context/config";
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
import { WalletContextState } from "@solana/wallet-adapter-react";

export default function Dice2() {
  const wallet = useWallet();
  const { coinData, getBalance, getWalletBalance } = useGlobalContext();
  const [betAmt, setBetAmt] = useState(0);
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

          <div className="mb-6 w-full">
            <div className="flex justify-between text-sm mb-2">
              <p className="font-medium font-changa text-[#F0F0F0] text-opacity-90">
                Bet Amount
              </p>
              <p className="font-medium font-changa text-[#94A3B8] text-opacity-90">
                Available : {coinData ? coinData[0]?.amount.toFixed(4) : 0} $SOL
              </p>
            </div>
            <div
              className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
            >
              <input
                type={"number"}
                step={"any"}
                autoComplete="off"
                onChange={handleBetAmountChange}
                placeholder={"Amount"}
                value={betAmt}
                className={`flex w-full min-w-0 bg-transparent text-base font-chakra text-white placeholder-white  placeholder-opacity-40 outline-none`}
              />
              <span
                className="bg-[#D9D9D9] bg-opacity-5 py-1 px-1.5 rounded text-xs font-semibold text-[#F0F0F0] text-opacity-50"
                onClick={() => setBetAmt(coinData ? coinData[0]?.amount : 0)}
              >
                MAX
              </span>
            </div>
          </div>
          {betType === "auto" && (
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-2">
                <p className="font-medium font-changa text-[#F0F0F0] text-opacity-90">
                  Number of Bets
                </p>
              </div>
              <div className="flex justify-between">
                <div className="relative w-[48%]">
                  <input
                    className="z-0 w-full bg-[#202329] rounded-md p-2.5"
                    type="text"
                    placeholder="0.0"
                  />
                  <button className="z-10 absolute top-2.5 right-2.5 px-3  rounded-sm text-xs bg-[#d9d9d90d]">
                    <Image
                      src="/assets/infiniteLogo.png"
                      alt="Infinite Bet"
                      width={25}
                      height={25}
                    />
                  </button>
                </div>

                <button className="border-2 border-white/90 text-white/80 font-semibold rounded-md w-[48%]">
                  Configure Auto
                </button>
              </div>
            </div>
          )}
          <div className="w-full">
            <button
              onClick={() => {
                if (!isRolling) handleBet();
              }}
              className={`${
                !wallet ? "cursor-not-allowed opacity-70" : "hover:opacity-90"
              } flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-[#F6F6F61A] bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] py-2.5 font-changa shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]`}
            >
              {isRolling ? (
                <div>
                  <span className="font-changa text-[1.75rem] font-semibold text-white text-opacity-80">
                    BETTING...
                  </span>
                </div>
              ) : (
                <div>
                  <span className="center font-changa text-[1.75rem] font-semibold text-white text-opacity-80">
                    BET
                  </span>
                </div>
              )}
            </button>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <div className="w-full flex justify-between items-center mb-7 sm:mb-0">
          <div>
            {isRolling ? (
              <div className="font-chakra text-sm font-medium text-white text-opacity-75">
                Betting ...
              </div>
            ) : null}
          </div>
          <div className="flex">
            {betResults.map((result, index) => (
              <div
                key={index}
                className={`${
                  result.isWin ? "border-[#72F238]" : "border-[#282E3D]"
                } font-chakra text-sm font-semibold border bg-[#282E3D] text-white text-opacity-75 rounded-md px-4 py-1.5 ml-2`}
              >
                {result.result}
              </div>
            ))}
          </div>
        </div>
        <div className="w-full">
          <DraggableBar
            choice={choice}
            setChoice={setChoice}
            strikeNumber={strikeNumber}
            result={result}
            rollType={rollType}
          />
        </div>
        <div className="flex px-0 xl:px-4 mb-0 px:mb-6 gap-4 flex-row w-full justify-between">
          {coinData && coinData[0].amount > 0.0001 && (
            <>
              <div className="flex flex-col w-full">
                <span className="text-[#F0F0F0] font-chakra font-semibold text-xs mb-1">
                  Multiplier
                </span>
                <input
                  className="bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-3"
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
                  <span className="text-[#F0F0F0] text-xs font-chakra font-semibold mb-1">
                    Roll Over
                  </span>
                ) : (
                  <span className="text-[#F0F0F0] text-xs font-chakra font-semibold mb-1">
                    Roll Under
                  </span>
                )}
                <span className="flex justify-between items-center bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-3">
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
                    className="bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-3"
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
