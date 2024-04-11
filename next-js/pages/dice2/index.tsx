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
  const [winningPays, setWinningPays] = useState(0);
  const [winningAmount, setWinningAmount] = useState(0);
  const [winningProbability, setWinningProbability] = useState(0);
  const [refresh, setRefresh] = useState(true);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [rollType, setRollType] = useState<"over" | "under">("over");
  const [strikeNumber, setStrikeNumber] = useState<number>(0);
  const [result, setResult] = useState<boolean>(false);
  const [chance, setChance] = useState<number>(50);
  const [betResults, setBetResults] = useState<
    { result: number; isWin: boolean }[]
  >([
    // { result: 33.2, isWin: true },
    // { result: 16.4, isWin: false },
    // { result: 45.6, isWin: true },
    // { result: 72.3, isWin: true },
    // { result: 64.1, isWin: false },
  ]);

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
      await new Promise((r) => setTimeout(r, 5000));
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
          setIsRolling(false);
          throw new Error(message);
        }

        if (result === "Won") toast.success(message, { duration: 2000 });
        else toast.error(message, { duration: 2000 });
        const isWin = result === "Won";
        const newBetResults = [...betResults, { result: strikeNumber, isWin }];
        setBetResults(newBetResults);
        setStrikeNumber(strikeNumber);
        setResult(isWin);
        setRefresh(true);
      } catch (error) {
        setIsRolling(false);
        console.error("Error occurred while rolling the dice:", error);
      }
      setIsRolling(false);
    }
  };

  useEffect(() => {
    // Calculate winningPays based on chance
    const calculateWinningPays = () => {
      const minMultiplier = 1.0102;
      const maxMultiplier = 49.5;

      // Calculate the choice range
      const minChoice = 2;
      const maxChoice = 98;

      // Calculate the multiplier for the given choice
      let multiplier =
        minMultiplier +
        ((maxMultiplier - minMultiplier) / (maxChoice - minChoice)) *
          (chance - minChoice);

      // Round the multiplier to 4 decimal places
      multiplier = Math.round(multiplier * 10000) / 10000;
      setWinningPays(multiplier);
      console.log("winningPays", multiplier);
    };

    const calculateWinningAmount = () => {
      setWinningAmount(chance);
    };

    const calculateWinningProbability = () => {
      const winningProbability = 100 - chance;
      setWinningProbability(winningProbability);
    };

    calculateWinningPays();
    calculateWinningAmount();
    calculateWinningProbability();
  }, [chance]);

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
                    ROLLING...
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
                Rolling the dice...
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
            chance={chance}
            setChance={setChance}
            strikeNumber={strikeNumber}
            result={result}
            rollType={rollType}
          />
        </div>
        <div className="flex px-0 xl:px-4 mb-0 px:mb-6 gap-4 flex-row w-full justify-between">
          {coinData && coinData[0].amount > 0.0001 && (
            <>
              <div className="flex flex-col w-full">
                <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
                  Multiplier
                </span>
                <span className="bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2">
                  {winningPays.toFixed(1)}x
                </span>
              </div>

              <div
                className="flex flex-col w-full"
                onClick={() =>
                  setRollType(rollType === "over" ? "under" : "over")
                }
              >
                {rollType === "over" ? (
                  <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
                    Roll Over
                  </span>
                ) : (
                  <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
                    Roll Under
                  </span>
                )}
                <span className="flex justify-between items-center bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2">
                  {winningAmount.toFixed(2)}
                  <Image
                    src="/assets/sync.svg"
                    alt="roll type"
                    width={15}
                    height={15}
                  />
                </span>
              </div>

              {chance && (
                <div className="flex flex-col w-full">
                  <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
                    Chance
                  </span>
                  <span className="bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2">
                    {winningProbability.toFixed(2)}%
                  </span>
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
