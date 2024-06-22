import React, { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import BetSetting from "@/components/BetSetting";
import {
  GameDisplay,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import { useGlobalContext } from "@/components/GlobalContext";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import Loader from "@/components/games/Loader";
import { errorCustom, successCustom } from "@/components/toasts/ToastGroup";
import Bets from "@/components/games/Bets";
import { Refresh } from "iconsax-react";
import { translator } from "@/context/transactions";
import { SPL_TOKENS } from "@/context/config"; // Adjust the import path accordingly
import { soundAlert } from "@/utils/soundUtils";
import ConfigureAutoButton from "@/components/ConfigureAutoButton";
import AutoCount from "@/components/AutoCount";

interface Token {
  id: number;
  value: string;
  image: string;
  tokenName: string; // New property to link to SPL_TOKENS
}

const tokens: Token[] = [
  { id: 1, value: "1", image: "/assets/token-1.svg", tokenName: "SOL" },
  { id: 2, value: "10", image: "/assets/token-10.svg", tokenName: "SOL" },
  { id: 3, value: "100", image: "/assets/token-100.svg", tokenName: "SOL" },
  { id: 4, value: "1000", image: "/assets/token-1k.svg", tokenName: "SOL" },
  { id: 5, value: "10000", image: "/assets/token-10k.svg", tokenName: "SOL" },
  { id: 6, value: "100000", image: "/assets/token-100k.svg", tokenName: "SOL" },
  { id: 7, value: "1000000", image: "/assets/token-1M.svg", tokenName: "SOL" },
  {
    id: 8,
    value: "10000000",
    image: "/assets/token-10M.svg",
    tokenName: "SOL",
  },
  {
    id: 9,
    value: "100000000",
    image: "/assets/token-100M.svg",
    tokenName: "SOL",
  },
  {
    id: 10,
    value: "1000000000",
    image: "/assets/token-1B.svg",
    tokenName: "SOL",
  },
  {
    id: 11,
    value: "10000000000",
    image: "/assets/token-10B.svg",
    tokenName: "SOL",
  },
];

const rows = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

type PredefinedBetType =
  | "1st-12"
  | "2nd-12"
  | "3rd-12"
  | "1-18"
  | "19-36"
  | "even"
  | "odd"
  | "red"
  | "black"
  | "1st-column"
  | "2nd-column"
  | "3rd-column";
const predefinedBets: Record<PredefinedBetType, number[]> = {
  "1st-12": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  "2nd-12": [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  "3rd-12": [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  "1-18": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  "19-36": [
    19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
  ],
  even: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
  odd: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
  red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 28, 30, 32, 34, 36],
  black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 29, 31, 33, 35],
  "1st-column": [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  "2nd-column": [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  "3rd-column": [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
};

export default function Roulette1() {
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

    enableSounds,

    houseEdge,
    maxBetAmt,
    language,
  } = useGlobalContext();
  console.log("MAX", maxBetAmt);

  type TransformedBets = Record<string, Record<string, number>>;
  type WagerType =
    | "red"
    | "black"
    | "green"
    | "odd"
    | "even"
    | "low"
    | "high"
    | "1st-12"
    | "2nd-12"
    | "3rd-12"
    | "1st-column"
    | "2nd-column"
    | "3rd-column"
    | "straight";

  const [betAmt, setBetAmt] = useState<number | undefined>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(0);
  const [transformedBets, setTransformedBets] = useState<TransformedBets>({
    straight: {},
  });

  const [betAmount, setBetAmount] = useState<string>("0");
  const [selectedToken, setSelectedToken] = useState<Token | null>(tokens[0]);
  const [bets, setBets] = useState<{ areaId: string; token: Token }[]>([]);
  const [betActive, setBetActive] = useState(false);
  const [betSetting, setBetSetting] = useState<"manual" | "auto">("auto");
  const [isRolling, setIsRolling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedBets, setSelectedBets] = useState<Bet[]>([]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredSplit, setHoveredSplit] = useState<number[] | null>(null);
  const [hoveredCorner, setHoveredCorner] = useState<number[] | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number[] | null>(null);
  const [resultNumbers, setResultNumbers] = useState<number[]>([]);
  const [refresh, setRefresh] = useState(true);
  const [centerNumber, setCenterNumber] = useState<number | null>(null);
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>();
  const [spinComplete, setSpinComplete] = useState(true);
  const [num, setNum] = useState(0);
  const ball = useRef<HTMLDivElement>(null);
  const ballContainer = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState(false);
  const overlayBall = useRef<HTMLDivElement>(null);
  const overlayBallContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (num !== 0) {
      spin();
    }
  }, [num]);

  const spin = () => {
    setOverlay(true);
    setSpinComplete(false);
    const order = [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
      24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
    ];

    if (!ball || !ball.current || !ballContainer || !ballContainer.current || !overlayBall || !overlayBall.current || !overlayBallContainer || !overlayBallContainer.current)
      return;
    const ballElement = ball.current;
    const ballContainerElement = ballContainer.current;
    const overlayBallElement = overlayBall.current;
    const overlayBallContainerElement = overlayBallContainer.current;

    let endingDegree = order.indexOf(num) * 9.73;

    ballContainerElement.style.transition = "all linear 4s";
    ballContainerElement.style.rotate = 360 * 3 + endingDegree + "deg";

    setTimeout(() => {
      overlayBallContainerElement.style.transition = "all linear 4s";
      overlayBallContainerElement.style.rotate = 360 * 3 + endingDegree + "deg";

      overlayBallElement.classList.add("overlayHole");
    }, 1000)

    ballElement.classList.add("hole");

    setTimeout(() => {
      setSpinComplete(true);

      setTimeout(() => {
        setOverlay(false);
        overlayBallElement.classList.remove("overlayHole");
        overlayBallContainerElement.style.rotate = "0deg";
      }, 2000);
    }, 4000);
  };

  console.log(selectedBets);
  const getSolEquivalent = (token: Token): number => {
    const splToken = SPL_TOKENS.find((t) => t.tokenName === token.tokenName);
    if (!splToken) return 0;
    const tokenValue = parseFloat(token.value);
    return parseFloat(((10 / 10 ** splToken.decimal) * tokenValue).toFixed(9));
  };

  const calculateTotalBetAmount = (
    currentBetAmt: number,
    newBetValue: number,
  ): number => {
    return currentBetAmt + newBetValue;
  };
  const bet = async () => {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error(translator("Wallet not Connected", language));
      }
      if (!betAmt || betAmt === 0) {
        throw new Error(translator("Set Amount", language));
      }
      if (!transformedBets) {
        throw new Error(translator("Place at least one Chip", language));
      }
      setLoading(true);
      setNum(0);
      reset();
      const response = await fetch(`/api/games/roulette1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          tokenMint: "SOL",
          wager: transformedBets,
        }),
      });

      const { success, message, result, strikeNumber, strikeMultiplier } =
        await response.json();

      console.log({
        Success: success,
        Result: result,
        Message: message,
        StrikeNumber: strikeNumber,
        strikeMultiplier: strikeMultiplier,
      });
      if (success !== true) {
        throw new Error(message);
      }

      if (success) {
        setNum(parseInt(strikeNumber));
        setStrikeMultiplier(strikeMultiplier);

        setRefresh(true);
      }

      setLoading(false);

      const win = result === "Won";

      setSpinComplete(false);
      const spinCompleteInterval = setInterval(() => {
        if (spinComplete) {
          clearInterval(spinCompleteInterval);
          if (win) {
            soundAlert("/sounds/win.wav", !enableSounds);
            successCustom(message);
          } else {
            soundAlert("/sounds/lose.wav", !enableSounds);
            errorCustom(message);
            setBetAmt(0);
            clearBets();
          }
          setResultNumbers((prevNumbers) => [...prevNumbers, strikeNumber]);
          setCenterNumber(strikeNumber);
          setLoading(false);
        }
      }, 100);
    } catch (e: any) {
      errorCustom(e?.message ?? translator("Could not make bet.", language));
      setLoading(false);
      setStartAuto(false);
      setAutoBetCount(0);
    }
  };

  const onSubmit = async (data: any) => {
    if (betSetting === "auto") {
      // Auto bet logic
    }
    if (!wallet.publicKey) {
      errorCustom(translator("Wallet not connected", language));
      return;
    }
    if (!betAmt || betAmt === 0) {
      errorCustom(translator("Set Amount.", language));
      return;
    }
    setLoading(true);
    const transformedBets = transformBetsToSingleNumbers(selectedBets);
    console.log(transformedBets);
    setTransformedBets(transformedBets);
    bet();
  };

  const handlePlaceBet = (areaId: string, token: Token | null) => {
    if (!token) {
      errorCustom("Please select a token before placing a bet.");
      return;
    }

    const tokenValue = parseInt(token.value);
    const solEquivalent = getSolEquivalent(token);

    if (calculateTotalBetAmount(betAmt || 0, solEquivalent) > maxBetAmt!) {
      errorCustom("Bet amount exceeds the maximum allowed bet.");
      return;
    }

    setSelectedBets((prev) => {
      const betsForArea = prev.filter((bet) => bet.areaId === areaId);
      if (betsForArea.length < 3) {
        setBetAmt((prevBetAmt) => (prevBetAmt || 0) + solEquivalent);
        return [...prev, { areaId, token }];
      } else {
        return prev;
      }
    });
  };

  const handlePlaceSplitBet = (
    number1: number,
    number2: number,
    token: Token | null,
  ) => {
    console.log(number1, number2);
    if (token) {
      const areaId = `split-${number1}-${number2}`;
      handlePlaceBet(areaId, token);
    }
  };
  const handlePlaceCornerBet = (
    number1: number,
    number2: number,
    number3: number,
    number4: number,
    token: Token | null,
  ) => {
    if (token) {
      const areaId = `corner-${number1}-${number2}-${number3}-${number4}`;
      handlePlaceBet(areaId, token);
    }
  };

  const handlePlaceColumnBet = (colIndex: number, token: Token | null) => {
    if (token) {
      const columnNumbers = rows.map((row) => row[colIndex]);
      const areaId = `column-${columnNumbers.join("-")}`;
      handlePlaceBet(areaId, token);
    } else {
      errorCustom("Please select a token before placing a bet.");
    }
  };
  const handlePlaceCornerBetWithTwoColumns = (
    number: number,
    adjacentNumbers: number[],
    token: Token | null,
  ) => {
    if (token) {
      const areaId = `corner2column-${number}-${adjacentNumbers.join("-")}`;
      handlePlaceBet(areaId, token);
    }
  };

  const renderRegularToken = (areaId: string) => {
    const betsForArea = selectedBets.filter((bet) => bet.areaId === areaId);
    if (betsForArea.length > 0) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 w-7 sm:w-12 -rotate-90 sm:rotate-0 -left-1 bottom-[3px] ">
          {betsForArea.slice(0, 3).map((bet, index) => (
            <Image
              key={index}
              width={35}
              height={35}
              src={bet.token.image}
              alt={`token-${index}`}
              className="absolute drop-shadow-3xl"
              style={{ bottom: `${index * 3}px` }}
            />
          ))}
        </div>
      );
    }
    return null;
  };

  const renderLeftSplitToken = (
    number: number,
    rowIndex: number,
    colIndex: number,
  ) => {
    if (number === 1 || number === 2 || number === 3) {
      const areaId = `split-${number}-0`;
      const betsForArea = selectedBets.filter((bet) => bet.areaId === areaId);

      if (betsForArea.length > 0) {
        return (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10
           w-7 sm:w-12 -rotate-90 sm:rotate-0 bottom-8 sm:bottom-1 sm:left-1"
          >
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={35}
                height={35}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute drop-shadow-3xl"
                style={{ left: "-16px", bottom: `${index * 3}px` }}
              />
            ))}
          </div>
        );
      }
    } else if (colIndex > 0) {
      const leftNumber = rows[rowIndex][colIndex - 1];
      const areaId = `split-${number}-${leftNumber}`;
      const betsForArea = selectedBets.filter((bet) => bet.areaId === areaId);

      if (betsForArea.length > 0) {
        return (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 
          w-7 sm:w-12 -rotate-90 sm:rotate-0 bottom-8 sm:bottom-1 sm:left-1"
          >
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={35}
                height={35}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute drop-shadow-3xl"
                style={{ left: "-16px", bottom: `${index * 3}px` }}
              />
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const renderTopSplitToken = (
    number: number,
    rowIndex: number,
    colIndex: number,
  ) => {
    if (rowIndex > 0) {
      const topNumber = rows[rowIndex - 1][colIndex];
      const areaId = `split-${number}-${topNumber}`;

      const betsForArea = selectedBets.filter((bet) => bet.areaId === areaId);
      if (betsForArea.length > 0) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 w-7 sm:w-12 sm:top-5 sm:rotate-0 -rotate-90 left-2 top-2   sm:left-0">
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={35}
                height={35}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute drop-shadow-3xl"
                style={{ bottom: `${index * 3}px` }}
              />
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const renderCornerToken = (
    number: number,
    rowIndex: number,
    colIndex: number,
  ) => {
    if (
      rowIndex > 0 &&
      rows[rowIndex] &&
      rows[rowIndex - 1] &&
      colIndex < rows[rowIndex].length - 1
    ) {
      const rightNumber = rows[rowIndex][colIndex - 1];
      const topNumber = rows[rowIndex - 1][colIndex];
      const topRightNumber = rows[rowIndex - 1][colIndex - 1];
      const areaId = `corner-${number}-${rightNumber}-${topNumber}-${topRightNumber}`;

      const betsForArea = selectedBets.filter((bet) => bet.areaId === areaId);

      if (betsForArea.length > 0) {
        return (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 
          sm:w-12 w-7 h-full sm:rotate-0 -rotate-90 -left-2 -top-3 sm:-top-0 sm:-left-1"
          >
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={35}
                height={35}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute drop-shadow-3xl"
                style={{
                  left: "20%",
                  transform: "translateX(-50%)",
                  bottom: `${index * 3}px`,
                }}
              />
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const handlePlaceCornerBetWithThreeNumbers = (
    number: number,
    adjacentNumbers: number[],
    token: Token | null,
  ) => {
    if (token) {
      const areaId = `corner-${number}-${adjacentNumbers.join("-")}`;
      handlePlaceBet(areaId, token);
    }
  };

  const renderCornerTokenWithThreeNumbers = (
    number: number,
    rowIndex: number,
    colIndex: number,
  ) => {
    if (rowIndex > 0) {
      const topNumber = rows[rowIndex - 1][colIndex];
      const areaId = `corner-${number}-0-${topNumber}`;
      const betsForArea = selectedBets.filter((bet) => bet.areaId === areaId);

      if (betsForArea.length > 0) {
        return (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 
          sm:w-12 w-7 h-full sm:rotate-0 -rotate-90 -left-2 -top-3 sm:-top-0 sm:-left-1 "
          >
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={35}
                height={35}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute drop-shadow-3xl"
                style={{
                  left: "20%",
                  transform: "translateX(-50%)",
                  bottom: `${index * 3}px`,
                }}
              />
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const renderTopColumnToken = (colIndex: number) => {
    const columnNumbers = rows.map((row) => row[colIndex]);
    const areaId = `column-${columnNumbers.join("-")}`;
    const betsForArea = selectedBets.filter((bet) => bet.areaId === areaId);
    if (betsForArea.length > 0) {
      return (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center space-y-1 w-7 
        sm:w-12 z-10 sm:-bottom-3 -bottom-1 -rotate-90 sm:rotate-0 left-1 sm:left-0"
        >
          {betsForArea.slice(0, 3).map((bet, index) => (
            <Image
              key={index}
              width={35}
              height={35}
              src={bet.token.image}
              alt={`token-${index}`}
              className="absolute drop-shadow-3xl"
              style={{ bottom: `${index * 3}px` }}
            />
          ))}
        </div>
      );
    }
    return null;
  };

  const disableInput = useMemo(() => {
    return betSetting === "auto" && startAuto
      ? true
      : false || isRolling || betActive;
  }, [betSetting, startAuto, isRolling, betActive]);
  const clearBets = () => {
    setSelectedBets([]);
    setBetAmt(0);
    setCenterNumber(null);
  };

  const undoLastBet = () => {
    setSelectedBets((prev) => {
      const lastBet = prev[prev.length - 1];
      if (lastBet) {
        const tokenValue = parseInt(lastBet.token.value);
        const solEquivalent = getSolEquivalent(lastBet.token);

        setBetAmt((prevBetAmt) => {
          if (prevBetAmt !== undefined) {
            return prevBetAmt - solEquivalent;
          }
          return prevBetAmt;
        });
      }
      return prev.slice(0, -1);
    });
  };

  type Bet = {
    areaId: string;
    token: Token;
  };

  const isPredefinedBetType = (value: string): value is PredefinedBetType => {
    return value in predefinedBets;
  };
  const transformBetsToSingleNumbers = (
    bets: Bet[],
  ): Record<string, Record<string, number>> => {
    const singleNumberBets: Record<string, number> = {};
    const predefinedBetTotals: Record<string, number> = {};

    const addToSingleNumberBet = (number: string, value: number) => {
      if (singleNumberBets[number]) {
        singleNumberBets[number] += value;
      } else {
        singleNumberBets[number] = value;
      }
    };

    bets.forEach((bet) => {
      const solEquivalent = getSolEquivalent(bet.token);

      if (bet.areaId.startsWith("split-")) {
        const [, num1, num2] = bet.areaId.split("-");
        const halfValue = solEquivalent / 2;
        addToSingleNumberBet(num1, halfValue);
        addToSingleNumberBet(num2, halfValue);
      } else if (bet.areaId.startsWith("corner-")) {
        const [_, num1, num2, num3, num4] = bet.areaId.split("-");
        const cornerValue = solEquivalent / 4;
        addToSingleNumberBet(num1, cornerValue);
        addToSingleNumberBet(num2, cornerValue);
        addToSingleNumberBet(num3, cornerValue);
        addToSingleNumberBet(num4, cornerValue);
      } else if (bet.areaId.startsWith("corner3-")) {
        const [_, num1, num2, num3] = bet.areaId.split("-");
        const cornerValue = solEquivalent / 3;
        addToSingleNumberBet(num1, cornerValue);
        addToSingleNumberBet(num2, cornerValue);
        addToSingleNumberBet(num3, cornerValue);
      } else if (bet.areaId.startsWith("corner2column-")) {
        const nums = bet.areaId.split("-").slice(1);
        const numValues =
          nums.length === 6 ? solEquivalent / 6 : solEquivalent / 4;
        nums.forEach((num) => addToSingleNumberBet(num, numValues));
      } else if (bet.areaId.startsWith("column-")) {
        const nums = bet.areaId.split("-").slice(1);
        const columnValue = solEquivalent / nums.length;
        nums.forEach((num) => addToSingleNumberBet(num, columnValue));
      } else if (isPredefinedBetType(bet.areaId)) {
        if (predefinedBetTotals[bet.areaId]) {
          predefinedBetTotals[bet.areaId] += solEquivalent;
        } else {
          predefinedBetTotals[bet.areaId] = solEquivalent;
        }
      } else if (bet.areaId.startsWith("num-")) {
        const [, num] = bet.areaId.split("-");
        addToSingleNumberBet(num, solEquivalent);
      }
    });

    // Format predefined bet totals
    Object.keys(predefinedBetTotals).forEach((key) => {
      predefinedBetTotals[key] = parseFloat(
        predefinedBetTotals[key].toFixed(9),
      );
    });

    // Format single number bets
    Object.keys(singleNumberBets).forEach((key) => {
      singleNumberBets[key] = parseFloat(singleNumberBets[key].toFixed(9));
    });

    return {
      straight: singleNumberBets,
      ...predefinedBetTotals,
    };
  };

  const reset = () => {
    if (!ball || !ball.current || !ballContainer || !ballContainer.current || !overlayBall || !overlayBall.current || !overlayBallContainer || !overlayBallContainer.current)
      return;
    const ballElement = ball.current;
    const ballContainerElement = ballContainer.current;
    const overlayBallElement = overlayBall.current;
    const overlayBallContainerElement = overlayBallContainer.current;

    ballContainerElement.style.transition = "none";
    ballElement.classList.remove("hole");
    ballContainerElement.style.rotate = "0deg";

    overlayBallContainerElement.style.transition = "none";
    overlayBallElement.classList.remove("overlayHole");
    overlayBallContainerElement.style.rotate = "0deg";
  };

  const rowToColumnLabel = (rowIndex: number): WagerType => {
    switch (rowIndex) {
      case 0:
        return "1st-column";
      case 1:
        return "2nd-column";
      case 2:
        return "3rd-column";
      default:
        throw new Error("Invalid row index");
    }
  };
  const ResultDisplay = ({ numbers }: { numbers: number[] }) => {
    return (
      <div className="flex flex-col top-6 left-6 space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 absolute  sm:top-8  sm:left-3/4  font-chakra">
        {numbers.slice(-3).map((num, index) => (
          <div
            key={index}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${predefinedBets.red.includes(num) ? "bg-[#F1323E]" : "bg-[#2A2E38]"
              } text-white`}
          >
            {num}
          </div>
        ))}
      </div>
    );
  };
  const handleNewResult = (resultNumber: number) => {
    setResultNumbers((prevNumbers) => [...prevNumbers, resultNumber]);
  };
  return (
    <GameLayout title="Roulette">
      <GameOptions>
        <>
          <div className="relative w-full flex lg:hidden mb-[1.4rem]">
            <BetButton disabled={!wallet || !session?.user || isRolling}>
              {isRolling ? <Loader /> : betActive ? "CASHOUT" : "BET"}
            </BetButton>
          </div>
          {betSetting === "auto" && (
            <div className="w-full flex  lg:hidden">
              <ConfigureAutoButton disabled={disableInput} />
            </div>
          )}

          <div className="w-full hidden lg:flex">
            <BetSetting
              betSetting={betSetting}
              setBetSetting={setBetSetting}
              disabled={disableInput}
            />
          </div>
          <div className="w-full flex flex-col nobar">
            <FormProvider {...methods}>
              <form
                className="w-full flex flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                <div className="mb-4">
                  <h3 className="text-white/90 font-changa">Chip Value</h3>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {tokens.map((chip) => (
                      <div
                        key={chip.id}
                        className={`border rounded cursor-pointer bg-[#1e2024] flex justify-center items-center py-1 px-[-2px] ${selectedToken === chip ? "border-white" : "border-gray-600"}`}
                        onClick={() => setSelectedToken(chip)}
                      >
                        <img src={chip.image} alt={chip.value} />
                      </div>
                    ))}
                  </div>
                </div>
                <BetAmount
                  betAmt={betAmt}
                  setBetAmt={setBetAmt}
                  currentMultiplier={1}
                  leastMultiplier={1}
                  game="roulette1"
                  disabled={disableInput}
                />
                {betSetting === "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <AutoCount loading={isRolling || startAuto} />
                    <div className="w-full hidden lg:flex">
                      <ConfigureAutoButton disabled={disableInput} />
                    </div>
                  </div>
                )}
                <BetButton
                  disabled={
                    !selectedToken ||
                      loading ||
                      !session?.user ||
                      (betAmt !== undefined &&
                        maxBetAmt !== undefined &&
                        betAmt > maxBetAmt)
                      ? true
                      : false
                  }
                  onClickFunction={onSubmit}
                >
                  {loading ? <Loader /> : "BET"}
                </BetButton>
              </form>
            </FormProvider>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <div className={`fadeInUp absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${overlay ? "" : "hidden fadeOutDown"}`}>
          <div
            className={`hidden roulette relative w-full h-full sm:flex flex-col items-center justify-center rounded-full`}
          >
            <img className="absolute w-96 h-96" src="/bg.svg " />
            <img className="wheel absolute w-96 h-96" src="/wheel.svg" />
            {centerNumber ? (
              <div className="text-4xl font-chakra font-semibold text-white absolute">
                {centerNumber!}
              </div>
            ) : (
              <img className="needle absolute" src="/needle.svg" />
            )}

            <div
              ref={overlayBallContainer}
              className="ball_container absolute w-96 h-[22px] px-[50px] flex items-center"
            >
              <div
                ref={overlayBall}
                className="ball w-[13px] h-[13px] bg-white rounded-full"
              />
            </div>
          </div>
        </div>
        <div className=" my-4 flex sm:flex-col items-center ">
          <ResultDisplay numbers={resultNumbers} />

          <div
            className={`hidden roulette relative min-w-72 min-h-72 sm:flex flex-col items-center justify-center `}
          >
            <img className="absolute w-[90%] h-[90%]" src="/bg.svg " />
            <img className="wheel absolute" src="/wheel.svg" />
            {centerNumber ? (
              <div className="text-4xl font-chakra font-semibold text-white absolute">
                {centerNumber!}
              </div>
            ) : (
              <img className="needle absolute" src="/needle.svg" />
            )}

            <div
              ref={ballContainer}
              className="ball_container absolute w-full h-[10%] px-[10%] flex items-center"
            >
              <div
                ref={ball}
                className="ball w-[4%] h-[30%] bg-white rounded-full"
              />
            </div>
          </div>

          <div className=" rounded-lg flex flex-col items-center font-chakra font-semibold text-base rotate-90 sm:rotate-0 right-4 sm:right-0 relative">
            <div className="flex justify-between w-full  text-white mb-1">
              <div
                className="hidden sm:flex items-center cursor-pointer hover:opacity-90"
                onClick={undoLastBet}
              >
                <Image
                  src="/assets/Undo.png"
                  width={20}
                  height={20}
                  alt="undo"
                />
                <p className="font-sans text-[16px]">Undo</p>
              </div>
              <div
                className="hidden sm:flex items-center cursor-pointer hover:opacity-90"
                onClick={clearBets}
              >
                <Image
                  src="/assets/clear.png"
                  width={20}
                  height={20}
                  alt="clear"
                />
                <p className="font-sans text-[16px]">Clear</p>
              </div>
            </div>
            <div className="flex flex-col    h-[415px] sm:h-[256px] w-full  text-[12px] sm:text-[16px]  itmes-start  gap-1 sm:gap-0 ">
              {/* table ui flex-row-reverse w-[211px]  text-[12px] rotate-90 gap-2*/}
              <div className="w-full flex items-start gap-1   ">
                {/* flex-col */}
                <div
                  className={` h-[125px] w-[27.3px]  sm:h-[153px] sm:w-12    flex flex-col justify-center text-center cursor-pointer bg-[#149200] rounded-[5px]
               text-white relative border-4 border-transparent  hover:bg-[#55BA78]
                hover:border-[2px] hover:border-slate-300 mb-1 ${hoveredCorner && hoveredCorner.includes(0)
                      ? "overlay border-[2px] border-white"
                      : ""
                    }
                ${hoveredSplit && hoveredSplit.includes(0)
                      ? "overlay border-[2px] border-white"
                      : ""
                    }`}
                  onClick={() => handlePlaceBet("num-0", selectedToken)}
                >
                  {/* h-[27.3px] w-[125px] */}
                  <p className="-rotate-90 sm:rotate-0">0</p>
                  {renderRegularToken("num-0")}
                </div>
                <div className="grid grid-cols-12 grid-rows-3 gap-[4px] sm:gap-1 sm:w-full sm:mb-[7px] ">
                  {/* grid-cols-3 grid-rows-12 */}
                  {rows.map((row, rowIndex) => (
                    <>
                      {row.map((number, colIndex) => {
                        return (
                          <div
                            key={colIndex}
                            className="relative flex justify-center items-center"
                          >
                            <button
                              data-testid={`roulette-tile-${number}`}
                              className={` h-[40px] w-[27px] sm:w-[48px] sm:h-[48px] flex items-center justify-center  relative text-center  ${predefinedBets.red.includes(
                                number,
                              ) /* h-[27px] w-[40px] */
                                ? "bg-[#F1323E] hover:border hover:border-slate-200 hover:bg-[#FF5C67]"
                                : "bg-[#2A2E38] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                                } text-white rounded-[5px] border-4 border-transparent ${hoveredButton &&
                                  predefinedBets[
                                    hoveredButton as PredefinedBetType
                                  ]?.includes(number)
                                  ? "overlay border-[2px] border-white "
                                  : ""
                                } ${hoveredRow !== null &&
                                  rows[hoveredRow]?.includes(number)
                                  ? "overlay border-[2px] border-white"
                                  : ""
                                } ${hoveredSplit && hoveredSplit.includes(number)
                                  ? "overlay border-[2px] border-white"
                                  : ""
                                } ${hoveredCorner && hoveredCorner.includes(number)
                                  ? "overlay border-[2px] border-white"
                                  : ""
                                } ${hoveredColumn && hoveredColumn.includes(number)
                                  ? "overlay border-[2px] border-white"
                                  : ""
                                }`}
                              onClick={() =>
                                selectedToken &&
                                handlePlaceBet(`num-${number}`, selectedToken)
                              }
                            >
                              <p className="-rotate-90 sm:rotate-0 ">
                                {number}
                              </p>

                              {renderRegularToken(`num-${number}`)}
                            </button>

                            {rowIndex === 0 ? (
                              <button
                                data-testid={`roulette-tile-${number}-top`}
                                className="absolute w-full h-3 bg-transparent -top-2"
                                onClick={() =>
                                  colIndex < rows[0].length &&
                                  handlePlaceColumnBet(colIndex, selectedToken)
                                }
                                onMouseEnter={() =>
                                  setHoveredColumn(
                                    rows.map((row) => row[colIndex]),
                                  )
                                }
                                onMouseLeave={() => setHoveredColumn(null)}
                              >
                                {renderTopColumnToken(colIndex)}
                              </button>
                            ) : (
                              <button
                                data-testid={`roulette-tile-${number}-top`}
                                className="absolute w-full h-3 bg-transparent -top-2"
                                onClick={() =>
                                  rowIndex > 0 &&
                                  handlePlaceSplitBet(
                                    number,
                                    rows[rowIndex - 1][colIndex],
                                    selectedToken,
                                  )
                                }
                                onMouseEnter={() =>
                                  rowIndex > 0 &&
                                  setHoveredSplit([
                                    number,
                                    rows[rowIndex - 1][colIndex],
                                  ])
                                }
                                onMouseLeave={() => setHoveredSplit(null)}
                              >
                                {rowIndex > 0 &&
                                  renderTopSplitToken(
                                    number,
                                    rowIndex,
                                    colIndex,
                                  )}
                              </button>
                            )}

                            {
                              <button
                                data-testid={`roulette-tile-${number}-left`}
                                className="absolute w-[12px] px-[6px] py-[1px] h-[42px] sm:w-3 sm:h-full bg-transparent -left-[7px] sm:-left-2 sm:px-2 top-0"
                                onClick={() => {
                                  if (
                                    number === 1 ||
                                    number === 2 ||
                                    number === 3
                                  ) {
                                    handlePlaceSplitBet(
                                      number,
                                      0,
                                      selectedToken,
                                    );
                                  } else {
                                    handlePlaceSplitBet(
                                      number,
                                      rows[rowIndex][colIndex - 1],
                                      selectedToken,
                                    );
                                  }
                                }}
                                onMouseEnter={() => {
                                  if (
                                    number === 1 ||
                                    number === 2 ||
                                    number === 3
                                  ) {
                                    setHoveredSplit([number, 0]);
                                  } else {
                                    setHoveredSplit([
                                      number,
                                      rows[rowIndex][colIndex - 1],
                                    ]);
                                  }
                                }}
                                onMouseLeave={() => setHoveredSplit(null)}
                              >
                                {renderLeftSplitToken(
                                  number,
                                  rowIndex,
                                  colIndex,
                                )}
                              </button>
                            }
                            <button
                              data-testid={`roulette-tile-${number}-corner`}
                              className="absolute w-[15px] h-[24px] sm:w-6 sm:h-6 bg-transparent -left-2 -top-2"
                              onClick={() => {
                                if (rowIndex > 0) {
                                  if (number === 2) {
                                    handlePlaceCornerBetWithThreeNumbers(
                                      number,
                                      [0, rows[rowIndex - 1][colIndex]],
                                      selectedToken,
                                    );
                                  } else if (number === 1) {
                                    handlePlaceCornerBetWithThreeNumbers(
                                      number,
                                      [0, rows[rowIndex - 1][colIndex]],
                                      selectedToken,
                                    );
                                  } else {
                                    handlePlaceCornerBet(
                                      number,
                                      rows[rowIndex][colIndex - 1],
                                      rows[rowIndex - 1][colIndex],
                                      rows[rowIndex - 1][colIndex - 1],
                                      selectedToken,
                                    );
                                  }
                                }
                              }}
                              onMouseEnter={() => {
                                if (rowIndex > 0) {
                                  if (number === 2) {
                                    setHoveredCorner([
                                      number,
                                      0,
                                      rows[rowIndex - 1][colIndex],
                                    ]);
                                  } else if (number === 1) {
                                    setHoveredCorner([
                                      number,
                                      0,
                                      rows[rowIndex - 1][colIndex],
                                    ]);
                                  } else {
                                    setHoveredCorner([
                                      number,
                                      rows[rowIndex][colIndex - 1],
                                      rows[rowIndex - 1][colIndex],
                                      rows[rowIndex - 1][colIndex - 1],
                                    ]);
                                  }
                                }
                              }}
                              onMouseLeave={() => setHoveredCorner(null)}
                            >
                              {rowIndex > 0 &&
                                renderCornerToken(number, rowIndex, colIndex)}
                              {renderCornerTokenWithThreeNumbers(
                                number,
                                rowIndex,
                                colIndex,
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
                <div className="flex flex-col justify-between items-center gap-[5px] sm:gap-1 mt-0">
                  {rows.map((_, rowIndex) => (
                    <div
                      key={`row-${rowIndex}`}
                      className="h-[40px] w-[27px] sm:w-[48px] sm:h-[48px] flex items-center justify-center text-center bg-transparent border-2 border-[#26272B] text-white cursor-pointer relative rounded-[5px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredRow(rowIndex)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() =>
                        handlePlaceBet(
                          rowToColumnLabel(rowIndex),
                          selectedToken,
                        )
                      }
                    >
                      <p className="-rotate-90 sm:rotate-0">2:1</p>
                      {renderRegularToken(rowToColumnLabel(rowIndex))}
                    </div>
                  ))}
                </div>
              </div>
              {/* options */}
              <div className="flex  w-[430px] sm:w-full justify-between">
                {/* w-[430px] rotate-90*/}
                <div className="h-[27px] w-[27.3px]  sm:h-[153px] sm:w-12   bg-transparent" />
                {/*h-[27.3px] w-[123px]  */}
                <div className="flex flex-col w-full gap-1">
                  <div className="flex w-full justify-center gap-1">
                    <button
                      className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B]
                    text-white cursor-pointer rounded-[5px] w-[120px] h-[40px] sm:w-[213.19px] sm:h-12 hover:border
                     hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("1st-12")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => handlePlaceBet("1st-12", selectedToken)}
                    >
                      {/* w-[117px] h-[40px] */}1 to 12
                      {renderRegularToken("1st-12")}
                    </button>
                    <button
                      className="relative col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B]
                   text-white cursor-pointer rounded-[5px]  w-[120px] h-[40px] sm:w-[213.19px] sm:h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("2nd-12")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => handlePlaceBet("2nd-12", selectedToken)}
                    >
                      {/* w-[117px] h-[40px] */}
                      13 to 24
                      {renderRegularToken("2nd-12")}
                    </button>
                    <button
                      className="relative col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B]
                   text-white cursor-pointer rounded-[5px]   w-[120px] h-[40px] sm:w-[213.19px] sm:h-12 hover:border hover:border-slate-200
                    hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("3rd-12")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => handlePlaceBet("3rd-12", selectedToken)}
                    >
                      {/*  w-[117px] h-[40px]*/}
                      25 to 36
                      {renderRegularToken("3rd-12")}
                    </button>
                  </div>
                  <div className="flex w-full justify-center gap-1">
                    <button
                      className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md
                   sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("1-18")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => handlePlaceBet("1-18", selectedToken)}
                    >
                      {/* w-[57px] h-[40px] */}1 to 18
                      {renderRegularToken("1-18")}
                    </button>
                    <button
                      className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md 
                  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("even")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => handlePlaceBet("even", selectedToken)}
                    >
                      {/*  w-[57px] h-[40px]*/}
                      Even
                      {renderRegularToken("even")}
                    </button>
                    <button
                      className="relative  flex items-center justify-center bg-[#F1323E] cursor-pointer rounded-md  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border
                   hover:border-slate-200 hover:bg-[#FF5C67]"
                      onMouseEnter={() => setHoveredButton("red")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => handlePlaceBet("red", selectedToken)}
                    >
                      {/*w-[57px] h-[40px]  */}
                      {renderRegularToken("red")}
                    </button>
                    <button
                      className="relative  flex items-center justify-center bg-[#2A2E38] cursor-pointer rounded-md  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("black")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => handlePlaceBet("black", selectedToken)}
                    >
                      {/* w-[57px] h-[40px] */}
                      {renderRegularToken("black")}
                    </button>
                    <button
                      className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer
                   rounded-md  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("odd")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => handlePlaceBet("odd", selectedToken)}
                    >
                      {/*  w-[57px] h-[40px]*/}
                      Odd
                      {renderRegularToken("odd")}
                    </button>
                    <button
                      className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md 
                  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("19-36")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => handlePlaceBet("19-36", selectedToken)}
                    >
                      {/* w-[57px] h-[40px] */}
                      19 to 36
                      {renderRegularToken("19-36")}
                    </button>
                  </div>
                </div>
                <div className="sm:h-[153px] sm:w-12  bg-transparent hidden sm:block" />
                <div className="flex flex-col   w-[27.3px] h-[123px] text-white  sm:hidden gap-1">
                  <div
                    className="flex items-center justify-center cursor-pointer hover:opacity-90  w-[27px] h-[40px] rounded-md bg-[#2A2E38]"
                    onClick={undoLastBet}
                  >
                    <Image
                      src="/assets/Undo.png"
                      width={20}
                      height={20}
                      alt="undo"
                    />
                  </div>
                  <div
                    className="flex items-center justify-center cursor-pointer hover:opacity-90 w-[27px] h-[40px]  rounded-md bg-[#2A2E38]"
                    onClick={clearBets}
                  >
                    <Image
                      src="/assets/clear.png"
                      width={18}
                      height={18}
                      alt="clear"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/*  <input
            type="number"
            value={num}
            onChange={(e) => setNum(parseInt(e.target.value))}
            className=" mt-8 px-4 py-2 bg-white text-black rounded-md"
          />
          <button
            onClick={() => reset()}
            className=" mt-4 px-4 py-2 bg-white text-black rounded-md"
          >
            Reset
          </button>
          <button
            onClick={() => spin()}
            className=" mt-4 px-4 py-2 bg-white text-black rounded-md"
          >
            Spin
          </button> */}
        </div>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
