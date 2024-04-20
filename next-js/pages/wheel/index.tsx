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
import ResultsSlider from "@/components/ResultsSlider";
import Arc from "@/components/games/Wheel/Arc";
import { riskToChance } from "@/components/games/Wheel/Segments";

export default function Wheel() {
  const wallet = useWallet();
  const wheelRef = useRef<HTMLDivElement>(null);
  const { coinData, getBalance, getWalletBalance } = useGlobalContext();
  const [betAmt, setBetAmt] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [strikeNumber, setStrikeNumber] = useState<number>(0);
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
    calculateMultiplier(resultAngle);
  };

  const calculateMultiplier = (resultAngle: number) => {
    const ranges = Array.from({ length: segments }).map((range, index) => {
      return {
        range: {
          start: index * rotationAngle,
          end: (index + 1) * rotationAngle,
        },
      };
    });
    console.log("segments", segments);
    const multiplierPosition = ranges.findIndex((range) => {
      return resultAngle >= range.range.start && resultAngle <= range.range.end;
    });

    console.log("multiplierPosition", multiplierPosition);
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

        const { success, message, result, strikeNumber } =
          await response.json();

        spinWheel(strikeNumber);
        if (success != true) {
          toast.error(message);
          throw new Error(message);
        }

        if (result == "Won") toast.success(message, { duration: 2000 });
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

        if (success) {
          setStrikeNumber(strikeNumber);
          console.log("strikeNumber", strikeNumber);
          setRefresh(true);
        }
      } catch (error) {
        setIsRolling(false);
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

  return (
    <GameLayout title="FOMO - Wheel">
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

          <div className="mb-6 w-full">
            <div className="flex justify-between text-sm mb-2">
              <p className="font-medium font-changa text-[#F0F0F0] text-opacity-90">
                Risk
              </p>
            </div>
            <div className="group flex w-full items-center rounded-[8px] text-white font-chakra text-sm font-semibold bg-[#0C0F16] p-4">
              <button
                onClick={() => setRisk("low")}
                className={`bg-[#202329] border-2 rounded-md w-1/3 py-3 transition-all ${
                  risk === "low" ? "border-[#7839C5]" : "border-transparent"
                }`}
              >
                Low
              </button>
              <button
                onClick={() => setRisk("medium")}
                className={`bg-[#202329] border-2 rounded-md mx-3 w-1/3 py-3 transition-all ${
                  risk === "medium" ? "border-[#7839C5]" : "border-transparent"
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setRisk("high")}
                className={`bg-[#202329] border-2 rounded-md w-1/3 py-3 transition-all ${
                  risk === "high" ? "border-[#7839C5]" : "border-transparent"
                }`}
              >
                High
              </button>
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

          <div className="w-full">
            <button
              disabled={isRolling}
              onClick={() => {
                handleBet();
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
                Betting...
              </div>
            ) : null}
          </div>
          <ResultsSlider results={betResults} />
        </div>
        <div className="w-full my-5">
          <div className="relative flex justify-center w-full h-full">
            <Image
              src="/assets/wheelPointer.svg"
              alt="Pointer"
              width={40}
              height={40}
              id="pointer"
              className={`${
                isRolling ? "-rotate-[20deg]" : "rotate-0"
              } absolute z-50 -top-5 transition-all duration-100`}
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
              <div className="absolute z-10 w-[88.75%] h-[88.75%] rounded-full bg-black/10 left-[5.625%] top-[5.625%]" />
              <div className="absolute z-20 w-[77.5%] h-[77.5%] rounded-full bg-[#171A1F] left-[11.25%] top-[11.25%]" />
              <div className="absolute z-20 w-[72.5%] h-[72.5%] rounded-full bg-[#0C0F16] left-[13.75%] top-[13.75%]" />
            </div>
          </div>
        </div>
        <div className="relative flex w-full justify-between px-0 xl:px-4 mb-0 px:mb-6 gap-4">
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
                      <span>0.00 ETH</span>
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
