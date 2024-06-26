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
import {
  errorCustom,
  successCustom,
  warningCustom,
} from "@/components/toasts/ToastGroup";
import Bets from "@/components/games/Bets";

import { formatNumber, translator } from "@/context/transactions";
import { SPL_TOKENS } from "@/context/config"; // Adjust the import path accordingly
import { soundAlert } from "@/utils/soundUtils";
import ConfigureAutoButton from "@/components/ConfigureAutoButton";
import AutoCount from "@/components/AutoCount";
import { GameType } from "@/utils/provably-fair";

function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): T {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as T;
}

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
    selectedCoin,
    enableSounds,
    setLiveStats,
    liveStats,
    updatePNL,
    houseEdge,
    maxBetAmt,
    language,
  } = useGlobalContext();

  type Bet = {
    areaId: string;
    token: Token;
  };
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
  type PredefinedBetType =
    | "1st-12"
    | "2nd-12"
    | "3rd-12"
    | "low"
    | "high"
    | "even"
    | "odd"
    | "red"
    | "black"
    | "1st-column"
    | "2nd-column"
    | "3rd-column";
  interface Token {
    id: number;
    value: string;
    image: string;
    tokenName: string; // New property to link to SPL_TOKENS
  }

  const tokens: Token[] = [
    {
      id: 1,
      value: "1",
      image: "/assets/token-1.svg",
      tokenName: selectedCoin.tokenName,
    },
    {
      id: 2,
      value: "10",
      image: "/assets/token-10.svg",
      tokenName: selectedCoin.tokenName,
    },
    {
      id: 3,
      value: "100",
      image: "/assets/token-100.svg",
      tokenName: selectedCoin.tokenName,
    },
    {
      id: 4,
      value: "1000",
      image: "/assets/token-1k.svg",
      tokenName: selectedCoin.tokenName,
    },
    {
      id: 5,
      value: "10000",
      image: "/assets/token-10k.svg",
      tokenName: selectedCoin.tokenName,
    },
    {
      id: 6,
      value: "100000",
      image: "/assets/token-100k.svg",
      tokenName: selectedCoin.tokenName,
    },
    {
      id: 7,
      value: "1000000",
      image: "/assets/token-1M.svg",
      tokenName: selectedCoin.tokenName,
    },
    {
      id: 8,
      value: "10000000",
      image: "/assets/token-10M.svg",
      tokenName: selectedCoin.tokenName,
    },
    {
      id: 9,
      value: "100000000",
      image: "/assets/token-100M.svg",
      tokenName: selectedCoin.tokenName,
    },
    {
      id: 10,
      value: "1000000000",
      image: "/assets/token-1B.svg",
      tokenName: selectedCoin.tokenName,
    },
    {
      id: 11,
      value: "10000000000",
      image: "/assets/token-10B.svg",
      tokenName: selectedCoin.tokenName,
    },
  ];

  const rows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ];

  const predefinedBets: Record<PredefinedBetType, number[]> = {
    "1st-12": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "2nd-12": [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    "3rd-12": [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    low: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    high: [
      19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
    ],
    even: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
    odd: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
    red: [
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 28, 30, 32, 34, 36,
    ],
    black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 29, 31, 33, 35],
    "1st-column": [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    "2nd-column": [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    "3rd-column": [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  };
  const [betAmt, setBetAmt] = useState<number | undefined>(0);

  const [transformedBets, setTransformedBets] = useState<TransformedBets>({
    straight: {},
  });

  const [selectedToken, setSelectedToken] = useState<Token | null>(tokens[0]);
  console.log(selectedToken);
  const [betActive, setBetActive] = useState(false);
  const [betSetting, setBetSetting] = useState<"manual" | "auto">("manual");
  const [userInput, setUserInput] = useState<number | undefined>();

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
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>();
  const [spinComplete, setSpinComplete] = useState(false);
  const [num, setNum] = useState<number | null>(null);
  const ball = useRef<HTMLDivElement>(null);
  const ballContainer = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState(false);
  const overlayBall = useRef<HTMLDivElement>(null);
  const overlayBallContainer = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState(null);
  const [win, setWin] = useState(false);
  const [message, setMessage] = useState("");
  const [betInProgress, setBetInProgress] = useState(false);
  const [rates, setRates] = useState({ USDC: 0, FOMO: 0 });
  const [amountWon, setAmountWon] = useState<number>(0);
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const responseUSDC = await fetch(
          "https://price.jup.ag/v6/price?ids=SOL&vsToken=USDC",
        );
        const dataUSDC = await responseUSDC.json();
        const rateUSDC = dataUSDC.data.SOL.price;

        const responseFOMO = await fetch(
          "https://price.jup.ag/v6/price?ids=SOL&vsToken=FOMO",
        );
        const dataFOMO = await responseFOMO.json();
        const rateFOMO = dataFOMO.data.SOL.price;

        setRates({ USDC: rateUSDC, FOMO: rateFOMO });
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
      }
    };

    fetchRates();
  }, []);
  console.log("Rates of Coins", rates);
  const ballBounceSound = useMemo(() => {
    const audio = new Audio("/sounds/PingPong.wav");
    audio.volume = 0.3;
    return audio;
  }, []);

  const playBounceSound = (volume: number) => {
    ballBounceSound.volume = volume; // Set the volume for this play
    ballBounceSound.currentTime = 0; // Reset sound to start
    ballBounceSound.play();
  };
  const spin = (strikeNumber: number): Promise<void> => {
    return new Promise((resolve) => {
      setOverlay(true);
      setSpinComplete(false);
      const order = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
        5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
      ];

      if (
        !ball ||
        !ball.current ||
        !ballContainer ||
        !ballContainer.current ||
        !overlayBall ||
        !overlayBall.current ||
        !overlayBallContainer ||
        !overlayBallContainer.current
      ) {
        resolve();
        return;
      }

      const ballElement = ball.current;
      const ballContainerElement = ballContainer.current;
      const overlayBallElement = overlayBall.current;
      const overlayBallContainerElement = overlayBallContainer.current;

      let endingDegree = order.indexOf(strikeNumber) * 9.73;

      ballContainerElement.style.transition = "all linear 4s";
      ballContainerElement.style.rotate = 360 * 3 + endingDegree + "deg";

      setTimeout(() => {
        overlayBallContainerElement.style.transition = "all linear 4s";
        overlayBallContainerElement.style.rotate =
          360 * 3 + endingDegree + "deg";

        overlayBallElement.classList.add("overlayHole");

        const bounceVolumes = [1, 0.7, 0.5, 0.35, 0.25, 0.2];
        const bounceTimes = [2800, 3000, 3200, 3400, 3600, 3800];
        bounceTimes.forEach((time, index) => {
          setTimeout(() => playBounceSound(bounceVolumes[index]), time);
        });
      }, 1000);

      ballElement.classList.add("hole");

      setTimeout(() => {
        setOverlay(false);
        overlayBallElement.classList.remove("overlayHole");
        overlayBallContainerElement.style.rotate = "0deg";
        setSpinComplete(true);
        resolve(); // Resolve the promise once the spin is complete
      }, 6000);
    });
  };

  console.log(selectedBets);
  const getSolEquivalent = (token: Token): number => {
    const tokenValue = parseFloat(token.value);
    return parseFloat(((10 / 10 ** 9) * tokenValue).toFixed(9));
  };

  const convertToSelectedToken = (
    solValue: number,
    rates: { USDC: number; FOMO: number },
    selectedToken: string,
  ): number => {
    if (selectedToken === "USDC") {
      return solValue * rates.USDC;
    } else if (selectedToken === "FOMO") {
      return solValue * rates.FOMO;
    } else {
      return solValue;
    }
  };

  const calculateTotalBetAmount = (
    currentBetAmt: number,
    newBetValue: number,
  ): number => {
    return currentBetAmt + newBetValue;
  };

  /*   const initialState = {
    num: 0,
    strikeMultiplier: 1,
    result: null,
    win: false,
    message: "",
    spinComplete: false,
    loading: false,
    refresh: false,
  }; */

  /*   const resetState = () => {
    setNum(initialState.num);
    setStrikeMultiplier(initialState.strikeMultiplier);
    setResult(initialState.result);
    setWin(initialState.win);
    setMessage(initialState.message);
    setSpinComplete(initialState.spinComplete);
    setLoading(initialState.loading);
    setRefresh(initialState.refresh);
  }; */

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
      setBetInProgress(true); // Set bet in progress
      reset();
      const response = await fetch(`/api/games/roulette1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          tokenMint: selectedCoin.tokenMint,
          wager: transformedBets,
        }),
      });

      const {
        success,
        message,
        result,
        strikeNumber,
        strikeMultiplier,
        amountWon,
      } = await response.json();

      if (success !== true) {
        throw new Error(message);
      }

      if (success) {
        await spin(parseInt(strikeNumber)); // Wait for the spin to complete
        setNum(parseInt(strikeNumber));
        setStrikeMultiplier(strikeMultiplier ?? 1);
        setResult(result);
        setMessage(message);
        setAmountWon(amountWon);
        setWin(result === "Won");
        setRefresh(true);

        if (betSetting === "auto") {
          if (useAutoConfig && result === "Won") {
            setBetAmt(
              autoWinChangeReset
                ? userInput!
                : (betAmt ?? 0) +
                    ((autoWinChange ?? 0) * (betAmt ?? 0)) / 100.0,
            );
          } else if (useAutoConfig && result !== "Won") {
            setBetAmt(
              autoLossChangeReset
                ? userInput!
                : (betAmt ?? 0) +
                    ((autoLossChange ?? 0) * (betAmt ?? 0)) / 100.0,
            );
          }
          setAutoBetProfit(
            autoBetProfit +
              (result === "Won"
                ? (strikeMultiplier ?? 1) * (1 - houseEdge) - 1
                : -1) *
                (betAmt ?? 0),
          );

          setTimeout(() => {
            if (typeof autoBetCount === "number") {
              setAutoBetCount(autoBetCount > 0 ? autoBetCount - 1 : 0);
              if (autoBetCount === 1) {
                warningCustom(
                  translator("Auto bet stopped", language),
                  "top-left",
                );
              }
            } else {
              setAutoBetCount(
                autoBetCount.length > 12
                  ? autoBetCount.slice(0, 5)
                  : autoBetCount + 1,
              );
            }
          }, 600);
        }
      }

      setLoading(false);
    } catch (e) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : translator("Could not make bet.", language);
      errorCustom(errorMessage);
      setLoading(false);
      setStartAuto(false);
      setAutoBetCount(0);
    } finally {
      setBetInProgress(false); // Reset bet in progress
    }
  };

  useEffect(() => {
    if (spinComplete && result !== null) {
      if (win) {
        soundAlert("/sounds/win.wav", !enableSounds);
        successCustom(
          translator(`Congratulations! You won`, language) +
            ` ${formatNumber(amountWon)} ${selectedCoin.tokenName}`,
        );
      } else {
        soundAlert("/sounds/lose.wav", !enableSounds);
        errorCustom(translator("Sorry, Better luck next time!", language));
        setBetAmt(0);
        clearBets();
      }

      num !== null && setResultNumbers((prevNumbers) => [...prevNumbers, num]);

      setRefresh(true);
      setLoading(false);
      updatePNL(GameType.roulette1, win, betAmt ?? 0, strikeMultiplier ?? 0);
      setResult(null); // Mark spin complete for the next round
    }
  }, [spinComplete, result, win, message, num, autoBetCount]);

  useEffect(() => {
    if (
      betSetting === "auto" &&
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
      }
      if (
        useAutoConfig &&
        autoStopProfit &&
        autoBetProfit > 0 &&
        autoBetProfit >= autoStopProfit
      ) {
        setTimeout(() => {
          warningCustom(
            translator("Profit limit reached.", language),
            "top-left",
          );
        }, 500);
        setAutoBetCount(0);
        setStartAuto(false);
        return;
      }
      if (
        useAutoConfig &&
        autoStopLoss &&
        autoBetProfit < 0 &&
        potentialLoss < -autoStopLoss
      ) {
        setTimeout(() => {
          warningCustom(
            translator("Loss limit reached.", language),
            "top-left",
          );
        }, 500);
        setAutoBetCount(0);
        setStartAuto(false);
        return;
      }

      setLoading(true);
      setTimeout(() => {
        bet();
      }, 200);
    } else {
      setStartAuto(false);
      setAutoBetProfit(0);
      setUserInput(betAmt);
    }
  }, [startAuto, autoBetCount]);

  const minBetAmounts: Record<string, number> = {
    USDC: 0.000138,
    SOL: 0.000001,
    FOMO: 0.002345,
  };

  const onSubmit = async (data: any) => {
    if (betAmt === undefined) {
      errorCustom(translator("Set Amount.", language));
      return;
    }

    const selectedTokenName = selectedCoin?.tokenName;
    const minBetAmt = minBetAmounts[selectedTokenName];

    if (betAmt < minBetAmt) {
      errorCustom(translator("Bet above minimum amount.", language));
      return;
    }

    if (betSetting === "auto") {
      if (typeof autoBetCount === "number" && autoBetCount <= 0) {
        errorCustom(translator("Set Bet Count.", language));
        return;
      }
      if (
        (typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0)
      ) {
        setStartAuto(true);
      }
    } else if (wallet.connected) {
      bet();
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
    const transformedBets = transformBetsToSingleNumbers(
      selectedBets,
      rates,
      selectedCoin.tokenName,
    );
    console.log("Transformed Bets", transformedBets);

    setTransformedBets(transformedBets);
  }, [selectedBets]);

  const handlePlaceBet = (areaId: string, token: Token | null) => {
    if (!token) {
      errorCustom(
        translator("Please select a token before placing a bet.", language),
      );
      return;
    }

    const solEquivalent = getSolEquivalent(token);
    const tokenEquivalent = convertToSelectedToken(
      solEquivalent,
      rates,
      selectedCoin.tokenName,
    );

    if (calculateTotalBetAmount(betAmt || 0, tokenEquivalent) > maxBetAmt!) {
      errorCustom(
        translator("Bet amount exceeds the maximum allowed bet.", language),
      );
      return;
    }

    setSelectedBets((prev) => {
      const betsForArea = prev.filter((bet) => bet.areaId === areaId);
      if (betsForArea.length < 3) {
        setBetAmt((prevBetAmt) => (prevBetAmt || 0) + tokenEquivalent);
        return [...prev, { areaId, token }];
      } else {
        return prev;
      }
    });
  };

  const isPredefinedBetType = (value: string): value is PredefinedBetType => {
    return value in predefinedBets;
  };

  const transformBetsToSingleNumbers = (
    bets: Bet[],
    rates: { USDC: number; FOMO: number },
    selectedToken: string,
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
      console.log("Sol:", solEquivalent);
      const tokenEquivalent = convertToSelectedToken(
        solEquivalent,
        rates,
        selectedToken,
      );

      if (bet.areaId.startsWith("split-")) {
        const [, num1, num2] = bet.areaId.split("-");
        const halfValue = tokenEquivalent / 2;
        addToSingleNumberBet(num1, halfValue);
        addToSingleNumberBet(num2, halfValue);
      } else if (bet.areaId.startsWith("corner-")) {
        const [_, num1, num2, num3, num4] = bet.areaId.split("-");
        const cornerValue = tokenEquivalent / 4;
        addToSingleNumberBet(num1, cornerValue);
        addToSingleNumberBet(num2, cornerValue);
        addToSingleNumberBet(num3, cornerValue);
        addToSingleNumberBet(num4, cornerValue);
      } else if (bet.areaId.startsWith("corner3-")) {
        const [_, num1, num2, num3] = bet.areaId.split("-");
        const cornerValue = tokenEquivalent / 3;
        addToSingleNumberBet(num1, cornerValue);
        addToSingleNumberBet(num2, cornerValue);
        addToSingleNumberBet(num3, cornerValue);
      } else if (bet.areaId.startsWith("corner2column-")) {
        const nums = bet.areaId.split("-").slice(1);
        const numValues =
          nums.length === 6 ? tokenEquivalent / 6 : tokenEquivalent / 4;
        nums.forEach((num) => addToSingleNumberBet(num, numValues));
      } else if (bet.areaId.startsWith("column-")) {
        const nums = bet.areaId.split("-").slice(1);
        const columnValue = tokenEquivalent / nums.length;
        nums.forEach((num) => addToSingleNumberBet(num, columnValue));
      } else if (isPredefinedBetType(bet.areaId)) {
        if (predefinedBetTotals[bet.areaId]) {
          predefinedBetTotals[bet.areaId] += tokenEquivalent;
        } else {
          predefinedBetTotals[bet.areaId] = tokenEquivalent;
        }
      } else if (bet.areaId.startsWith("num-")) {
        const [, num] = bet.areaId.split("-");
        addToSingleNumberBet(num, tokenEquivalent);
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
    if (
      !ball ||
      !ball.current ||
      !ballContainer ||
      !ballContainer.current ||
      !overlayBall ||
      !overlayBall.current ||
      !overlayBallContainer ||
      !overlayBallContainer.current
    )
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
  const clearBets = () => {
    setSelectedBets([]);
    setBetAmt(0);
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
  const debouncedUndoLastBet = debounce(undoLastBet, 100);
  const handlePlaceSplitBet = (
    number1: number,
    number2: number,
    token: Token | null,
  ) => {
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
  /*   const handlePlaceCornerBetWithTwoColumns = (
    number: number,
    adjacentNumbers: number[],
    token: Token | null,
  ) => {
    if (token) {
      const areaId = `corner2column-${number}-${adjacentNumbers.join("-")}`;
      handlePlaceBet(areaId, token);
    }
  }; */

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
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
              predefinedBets.red.includes(num) ? "bg-[#F1323E]" : "bg-[#2A2E38]"
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
            {startAuto && (
              <div
                onClick={() => {
                  soundAlert("/sounds/betbutton.wav", !enableSounds);
                  warningCustom(
                    translator("Auto bet stopped", language),
                    "top-left",
                  );
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
                        className={`border rounded cursor-pointer bg-[#1e2024] flex justify-center items-center py-1 px-[-2px] ${selectedToken?.value === chip.value ? "border-gray-200" : "border-gray-600"}`}
                        onClick={() => setSelectedToken(chip)}
                      >
                        <img src={chip.image} alt={chip.value} />
                      </div>
                    ))}
                  </div>
                </div>
                <BetAmount
                  betAmt={betAmt}
                  setBetAmt={setUserInput}
                  currentMultiplier={1}
                  leastMultiplier={1}
                  game="roulette"
                  disabled={true}
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
                <div className="relative w-full hidden lg:flex mb-[1.4rem]">
                  {startAuto && (
                    <div
                      onClick={() => {
                        soundAlert("/sounds/betbutton.wav", !enableSounds);
                        warningCustom(
                          translator("Auto bet stopped", language),
                          "top-left",
                        );
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
                      !betSetting ||
                      loading ||
                      !session?.user ||
                      (betAmt !== undefined &&
                        maxBetAmt !== undefined &&
                        betAmt > maxBetAmt)
                        ? true
                        : false
                    }
                    // onClickFunction={onSubmit}
                  >
                    {loading ? <Loader /> : "BET"}
                  </BetButton>
                </div>
              </form>
            </FormProvider>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <div
          className={`fadeInUp absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 ${overlay ? "" : "hidden fadeOutDown"}`}
        >
          <div className="roulette relative w-full h-full flex flex-col items-center justify-center rounded-full">
            <img
              className="absolute w-[30rem] h-[30rem]"
              src="/bg.svg"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
            <img
              className="wheel absolute w-[30rem] h-[30rem]"
              src="/wheel.svg"
              style={{ transform: "translate(-50%, -50%)" }}
            />
            {/*   {centerNumber ? (
              <div className="text-4xl font-chakra font-semibold text-white absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                {centerNumber}
              </div>
            ) : ( */}
            <img
              className="needle absolute w-[10rem] h-[10rem]"
              src="/needle.svg"
              style={{ transform: "translate(-50%, -50%)" }}
            />
            {/*     )}
             */}
            <div
              ref={overlayBallContainer}
              className="ball_container absolute w-[30rem] h-[22px] px-[50px] flex items-center"
              style={{ transform: "translate(-50%, -50%)" }}
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
            className={`hidden roulette relative min-w-[18rem] min-h-[18rem] sm:flex flex-col items-center justify-center ${overlay ? "hidden fadeOutDown" : ""}`}
          >
            <img className="absolute w-[90%] h-[90%]" src="/bg.svg " />
            <img className="wheel absolute" src="/wheel.svg" />
            {/*  {centerNumber ? (
              <div className="text-4xl font-chakra font-semibold text-white absolute">
                {centerNumber!}
              </div>
            ) : ( */}
            <img className="needle absolute" src="/needle.svg" />
            {/*  )} */}

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
                onClick={debouncedUndoLastBet}
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
                hover:border-[2px] hover:border-slate-300 mb-1 ${
                  hoveredCorner && hoveredCorner.includes(0)
                    ? "overlay border-[2px] border-white"
                    : ""
                }
                ${
                  hoveredSplit && hoveredSplit.includes(0)
                    ? "overlay border-[2px] border-white"
                    : ""
                }`}
                  onClick={() => {
                    if (selectedToken) {
                      handlePlaceBet("num-0", selectedToken);
                    }
                    soundAlert("/sounds/rouletteChipPlace.wav", !enableSounds);
                  }}
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
                              className={` h-[40px] w-[27px] sm:w-[48px] sm:h-[48px] flex items-center justify-center  relative text-center  ${
                                predefinedBets.red.includes(
                                  number,
                                ) /* h-[27px] w-[40px] */
                                  ? "bg-[#F1323E] hover:border hover:border-slate-200 hover:bg-[#FF5C67]"
                                  : "bg-[#2A2E38] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                              } text-white rounded-[5px] border-4 border-transparent ${
                                hoveredButton &&
                                predefinedBets[
                                  hoveredButton as PredefinedBetType
                                ]?.includes(number)
                                  ? "overlay border-[2px] border-white "
                                  : ""
                              } ${
                                hoveredRow !== null &&
                                rows[hoveredRow]?.includes(number)
                                  ? "overlay border-[2px] border-white"
                                  : ""
                              } ${
                                hoveredSplit && hoveredSplit.includes(number)
                                  ? "overlay border-[2px] border-white"
                                  : ""
                              } ${
                                hoveredCorner && hoveredCorner.includes(number)
                                  ? "overlay border-[2px] border-white"
                                  : ""
                              } ${
                                hoveredColumn && hoveredColumn.includes(number)
                                  ? "overlay border-[2px] border-white"
                                  : ""
                              }`}
                              onClick={() => {
                                if (selectedToken) {
                                  handlePlaceBet(
                                    `num-${number}`,
                                    selectedToken,
                                  );
                                }
                                soundAlert(
                                  "/sounds/rouletteChipPlace.wav",
                                  !enableSounds,
                                );
                              }}
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
                                onClick={() => {
                                  if (colIndex < rows[0].length) {
                                    handlePlaceColumnBet(
                                      colIndex,
                                      selectedToken,
                                    );
                                  }
                                  soundAlert(
                                    "/sounds/rouletteChipPlace.wav",
                                    !enableSounds,
                                  );
                                }}
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
                                onClick={() => {
                                  if (rowIndex > 0) {
                                    handlePlaceSplitBet(
                                      number,
                                      rows[rowIndex - 1][colIndex],
                                      selectedToken,
                                    );
                                  }
                                  soundAlert(
                                    "/sounds/rouletteChipPlace.wav",
                                    !enableSounds,
                                  );
                                }}
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
                                  soundAlert(
                                    "/sounds/rouletteChipPlace.wav",
                                    !enableSounds,
                                  );
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
                                soundAlert(
                                  "/sounds/rouletteChipPlace.wav",
                                  !enableSounds,
                                );
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
                      onClick={() => {
                        handlePlaceBet(
                          rowToColumnLabel(rowIndex),
                          selectedToken,
                        );
                        soundAlert(
                          "/sounds/rouletteChipPlace.wav",
                          !enableSounds,
                        );
                      }}
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
                      onClick={() => {
                        handlePlaceBet("1st-12", selectedToken);
                        soundAlert(
                          "/sounds/rouletteChipPlace.wav",
                          !enableSounds,
                        );
                      }}
                    >
                      {/* w-[117px] h-[40px] */}1 to 12
                      {renderRegularToken("1st-12")}
                    </button>
                    <button
                      className="relative col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B]
                   text-white cursor-pointer rounded-[5px]  w-[120px] h-[40px] sm:w-[213.19px] sm:h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("2nd-12")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => {
                        handlePlaceBet("2nd-12", selectedToken);
                        soundAlert(
                          "/sounds/rouletteChipPlace.wav",
                          !enableSounds,
                        );
                      }}
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
                      onClick={() => {
                        handlePlaceBet("3rd-12", selectedToken);
                        soundAlert(
                          "/sounds/rouletteChipPlace.wav",
                          !enableSounds,
                        );
                      }}
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
                      onMouseEnter={() => setHoveredButton("low")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => {
                        handlePlaceBet("low", selectedToken);
                        soundAlert(
                          "/sounds/rouletteChipPlace.wav",
                          !enableSounds,
                        );
                      }}
                    >
                      {/* w-[57px] h-[40px] */}1 to 18
                      {renderRegularToken("low")}
                    </button>
                    <button
                      className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md 
                  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("even")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => {
                        handlePlaceBet("even", selectedToken);
                        soundAlert(
                          "/sounds/rouletteChipPlace.wav",
                          !enableSounds,
                        );
                      }}
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
                      onClick={() => {
                        handlePlaceBet("red", selectedToken);
                        soundAlert(
                          "/sounds/rouletteChipPlace.wav",
                          !enableSounds,
                        );
                      }}
                    >
                      {/*w-[57px] h-[40px]  */}
                      {renderRegularToken("red")}
                    </button>
                    <button
                      className="relative  flex items-center justify-center bg-[#2A2E38] cursor-pointer rounded-md  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("black")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => {
                        handlePlaceBet("black", selectedToken);
                        soundAlert(
                          "/sounds/rouletteChipPlace.wav",
                          !enableSounds,
                        );
                      }}
                    >
                      {/* w-[57px] h-[40px] */}
                      {renderRegularToken("black")}
                    </button>
                    <button
                      className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer
                   rounded-md  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("odd")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => {
                        handlePlaceBet("odd", selectedToken);
                        soundAlert(
                          "/sounds/rouletteChipPlace.wav",
                          !enableSounds,
                        );
                      }}
                    >
                      {/*  w-[57px] h-[40px]*/}
                      Odd
                      {renderRegularToken("odd")}
                    </button>
                    <button
                      className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md 
                  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                      onMouseEnter={() => setHoveredButton("high")}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => {
                        handlePlaceBet("high", selectedToken);
                        soundAlert(
                          "/sounds/rouletteChipPlace.wav",
                          !enableSounds,
                        );
                      }}
                    >
                      {/* w-[57px] h-[40px] */}
                      19 to 36
                      {renderRegularToken("high")}
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
