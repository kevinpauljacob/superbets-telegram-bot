import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import BetSetting from "@/components/BetSetting";
import { useGlobalContext } from "@/components/GlobalContext";
import {
  GameDisplay,
  GameFooterInfo,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import HistoryTable from "@/components/games/Wheel/HistoryTable";
import { WalletContextState } from "@solana/wallet-adapter-react";
import Arc from "@/components/games/Wheel/Arc";

export default function Wheel() {
  const wallet = useWallet();
  const wheelRef = useRef<HTMLDivElement>(null);
  const { coinData, getBalance, getWalletBalance } = useGlobalContext();
  const [betAmt, setBetAmt] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [strikeFace, setStrikeFace] = useState<number>(0);
  const [risk, setRisk] = useState<"low" | "medium" | "high">("low");

  const [segments, setSegments] = useState<number>(10);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [numSegments, setNumSegments] = useState(0);
  const [rotationAngle, setRotationAngle] = useState(0);

  useEffect(() => {
    if (!wheelRef.current) return;

    const width = wheelRef.current.offsetWidth;
    const radius = width / 2;
    const numSegments = segments;

    const circumference = 2 * Math.PI * radius;
    const arcLength = circumference / numSegments;

    const segmentWidth = 2 * radius * Math.sin(arcLength / (2 * radius));
    const rotationAngle = (360 * arcLength) / circumference;

    setSegmentWidth(segmentWidth);
    setNumSegments(numSegments);
    setRotationAngle(rotationAngle);
  }, [segments]);

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

        if (success != true) {
          toast.error(message);
          throw new Error(message);
        }

        if (result == "Won") toast.success(message, { duration: 2000 });
        else toast.error(message, { duration: 2000 });

        if (success) {
          setStrikeFace(strikeNumber);
          console.log("strikeNumber", strikeNumber);
          setRefresh(true);
        }
      } catch (error) {
        setIsRolling(false);
        console.error("Error occurred while betting:", error);
      }
      setIsRolling(false);
    }
  };

  useEffect(() => {
    console.log("strikeface", strikeFace);
    console.log("segments", segments);
  }, [strikeFace, segments]);

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
            <div className="flex justify-between text-sm mb-2">
              <p className="font-medium font-changa text-[#F0F0F0] text-opacity-90">
                Segments
              </p>
            </div>
            <div className="w-full rounded-[8px] text-white font-chakra text-sm font-semibold bg-[#0C0F16] p-4">
              <div className="mb-2">{segments}</div>
              <input
                type="range"
                min={10}
                max={50}
                step={10}
                value={segments}
                onChange={(e) => setSegments(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

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
        </div>
        <div className="w-full">
          <div className="relative flex justify-center w-full h-full">
            <Image
              src="/assets/wheelPointer.svg"
              alt="Pointer"
              width={40}
              height={40}
              className="absolute z-50 -top-5 "
            />
            <div
              ref={wheelRef}
              className="relative w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] rounded-full overflow-hidden"
            >
              <svg viewBox="0 0 300 300">
                {typeof window !== "undefined" &&
                  rotationAngle &&
                  Array.from({ length: numSegments }).map((_, index) => (
                    <Arc
                      key={index}
                      index={index}
                      rotationAngle={rotationAngle}
                      risk={risk}
                      segments={segments}
                    />
                  ))}
              </svg>
              <div className="absolute z-10 w-[88.75%] h-[88.75%] rounded-full bg-black/10 left-[5.625%] top-[5.625%]" />
              <div className="absolute z-20 w-[77.5%] h-[77.5%] rounded-full bg-[#171A1F] left-[11.25%] top-[11.25%]" />
              <div className="absolute z-20 w-[72.5%] h-[72.5%] rounded-full bg-[#0C0F16] left-[13.75%] top-[13.75%]" />
            </div>
          </div>
        </div>
        <div className="flex px-0 xl:px-4 mb-0 px:mb-6 gap-4 flex-row w-full justify-between">
          {coinData && coinData[0].amount > 0.0001 && (
            <>
              <div className="w-full border-t-[3px] border-[#343843] text-center font-chakra font-semibold bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2.5">
                0.0x
              </div>
              <div className="w-full border-t-[3px] border-[#BEC6D1] text-center font-chakra font-semibold bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2.5">
                2.6x
              </div>
              <div className="w-full border-t-[3px] border-[#8042FF] text-center font-chakra font-semibold bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2.5">
                5x
              </div>
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
