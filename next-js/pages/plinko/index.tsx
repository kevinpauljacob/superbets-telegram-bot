import {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  IEventCollision,
  Render,
  Runner,
  World,
} from "matter-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { minGameAmount, placeFlip } from "../../context/gameTransactions";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { FormProvider, useForm } from "react-hook-form";
import { useGlobalContext } from "@/components/GlobalContext";
import BetSetting from "@/components/BetSetting";
import GameHeader from "@/components/GameHeader";
import {
  GameDisplay,
  GameFooterInfo,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import { MultiplierHistory } from "@/components/games/Plinko/MultiplierHistory";
import useWindowSize from "@/hooks/useWindowSize";
import Bets from "@/components/games/Bets";
import { soundAlert } from "@/utils/soundUtils";
import {
  errorCustom,
  successCustom,
  warningCustom,
} from "@/components/toasts/ToastGroup";
import { translator } from "@/context/transactions";
import { useSession } from "next-auth/react";
import BetButton from "@/components/games/BetButton";
import Loader from "@/components/games/Loader";
import ConfigureAutoButton from "@/components/ConfigureAutoButton";
import BetAmount from "@/components/games/BetAmountInput";
import AutoCount from "@/components/AutoCount";

type RiskToChance = Record<string, Record<number, Array<number>>>;

export type LinesType = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

export type RisksType = "Low" | "Medium" | "High";

const riskToChance: RiskToChance = {
  low: {
    8: [6.9, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 6.9],
    9: [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
    10: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
    11: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    13: [8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1],
    14: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
    15: [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    9: [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
    10: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
    11: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    13: [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 43],
    14: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
    15: [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    9: [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43],
    10: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76],
    11: [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120],
    12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    13: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260],
    14: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420],
    15: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 620],
    16: [
      1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000,
    ],
  },
};

export const multiplierColorMap: {
  [key: number]: string[];
} = {
  8: [
    "#FF003F",
    "#FF302F",
    "#FF6020",
    "#FF9010",
    "#FFC000",
    "#FF9010",
    "#FF6020",
    "#FF302F",
    "#FF003F",
  ],
  9: [
    "#FF003F",
    "#FF2B31",
    "#FF5523",
    "#FF8015",
    "#FFAB07",
    "#FFAB07",
    "#FF8015",
    "#FF5523",
    "#FF2B31",
    "#FF003F",
  ],
  10: [
    "#FF003F",
    "#FF2632",
    "#FF4D26",
    "#FF7319",
    "#FF9A0D",
    "#FFC000",
    "#FF9A0D",
    "#FF7319",
    "#FF4D26",
    "#FF2632",
    "#FF2632",
  ],
  11: [
    "#FF003F",
    "#FF2334",
    "#FF4628",
    "#FF691D",
    "#FF8C11",
    "#FFAF06",
    "#FFAF06",
    "#FF8C11",
    "#FF691D",
    "#FF4628",
    "#FF2334",
    "#FF003F",
  ],
  12: [
    "#FF003F",
    "#FF2034",
    "#FF6020",
    "#FF6020",
    "#FF8015",
    "#FFA00B",
    "#FFC000",
    "#FFA00B",
    "#FF8015",
    "#FF6020",
    "#FF6020",
    "#FF2034",
    "#FF003F",
  ],
  13: [
    "#FF003F",
    "#FF1E35",
    "#FF3B2C",
    "#FF5922",
    "#FF7618",
    "#FF940F",
    "#FFB105",
    "#FFB105",
    "#FF940F",
    "#FF7618",
    "#FF5922",
    "#FF3B2C",
    "#FF1E35",
    "#FF003F",
  ],
  14: [
    "#FF003F",
    "#FF1B36",
    "#FF372D",
    "#FF5224",
    "#FF6E1B",
    "#FF8912",
    "#FFA509",
    "#FFC000",
    "#FFA509",
    "#FF8912",
    "#FF6E1B",
    "#FF5224",
    "#FF372D",
    "#FF1B36",
    "#FF003F",
  ],
  15: [
    "#FF003F",
    "#FF1A37",
    "#FF332E",
    "#FF4D26",
    "#FF661D",
    "#FF8015",
    "#FF9A0D",
    "#FFB304",
    "#FFB304",
    "#FF9A0D",
    "#FF8015",
    "#FF661D",
    "#FF4D26",
    "#FF332E",
    "#FF1A37",
    "#FF003F",
  ],
  16: [
    "#FF003F",
    "#FF1837",
    "#FF302F",
    "#FF4827",
    "#FF6020",
    "#FF7818",
    "#FF9010",
    "#FFA808",
    "#FFC000",
    "#FFA808",
    "#FF9010",
    "#FF7818",
    "#FF6020",
    "#FF4827",
    "#FF302F",
    "#FF1837",
    "#FF003F",
  ],
};

function getRandomFromFallMap(input: number): number {
  type FallMapType = {
    [key: number]: number[][];
  };
  const fallMap: FallMapType = {
    0.5: [
      [0.15, 0.135, 0.167, 0.184],
      [0.25, 0.585],
    ],
    1: [
      [0.1, 0.115, 0.12, 0.173],
      [0.24, 0.512, 0.58],
    ],
    1.1: [
      [0.17, 0.125, 0.14, 0.155],
      [0.154, 0.185],
    ],
    2.1: [
      [0.16, 0.128, 0.177, 0.18],
      [0.515, 0.612],
    ],
    5.6: [[0.126], [0.126]],
  };

  if (!fallMap.hasOwnProperty(input)) {
    return 0;
  }

  const valueArray = fallMap[input];
  const randomChildArray =
    valueArray[Math.floor(Math.random() * valueArray.length)];
  const randomNumber =
    randomChildArray[Math.floor(Math.random() * randomChildArray.length)];

  return randomNumber;
}

function getMultiplier(value: number, line: number, index: number) {
  //todo: dynamic img and sound generation
  const color = multiplierColorMap[`${line}`][index];
  const sound = "regular";
  return {
    value: value,
    label: `block-${value}-${color.slice(1)}-${sound}-${index}`,
    sound: "/sounds/multiplier_regular.wav",
    img: `/assets/multipliers/multiplier1.png`,
  };
}

function getMultiplierByLinesQnt(value: LinesType, risk: RisksType) {
  return riskToChance[risk.toLowerCase()][value].map((multiplier, index) =>
    getMultiplier(multiplier, value, index),
  );
}

export default function Plinko() {
  const { data: session, status } = useSession();
  const { width, height } = useWindowSize();
  const [lines, setLines] = useState<LinesType>(8);

  const world = {
    width:
      width! >= 1440
        ? 750
        : width! >= 1024
        ? 500
        : width! >= 700
        ? 620
        : width! >= 600
        ? 500
        : 340,
    height:
      width! >= 1440
        ? 640
        : width! >= 1024
        ? 450
        : width! >= 700
        ? 570
        : width! >= 600
        ? 450
        : 330,
  };

  const ball = {
    ballSize:
      (width! >= 1440
        ? 15
        : width! >= 1024
        ? 11
        : width! >= 700
        ? 13
        : width! >= 600
        ? 11
        : 6) /
      (lines / 8),
  };

  const configPlinko = {
    ball,
    engine: {
      engineGravity: 1.4,
    },
    colors: {
      background: "#0C0F16",
      purple: "#C52BFF",
    },
  };

  const wallet = useWallet();
  const methods = useForm();

  const {
    coinData,
    getBalance,
    getWalletBalance,
    setShowWalletModal,
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
    houseEdge,
    maxBetAmt,
    language,
    selectedCoin,
  } = useGlobalContext();

  const [betAmt, setBetAmt] = useState<number | undefined>();
  const [userInput, setUserInput] = useState<number | undefined>();
  const [risk, setRisk] = useState<RisksType>("Low");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    result: string;
    strikeMultiplier: number;
    strikeNumber: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betSetting, setBetSetting] = useState<"manual" | "auto">("manual");
  const [betResults, setBetResults] = useState<
    { result: number; win: boolean }[]
  >([]);
  const [lastMultipliers, setLastMultipliers] = useState<MultiplierHistory[]>(
    [],
  );
  const [inGameBallsCount, setInGameBallsCount] = useState<number>(0);
  const incrementInGameBallsCount = () => {
    setInGameBallsCount(inGameBallsCount + 1);
  };
  const decrementInGameBallsCount = () => {
    setInGameBallsCount(inGameBallsCount - 1);
  };
  const engine = Engine.create();
  const { colors, ball: ballConfig, engine: engineConfig } = configPlinko;
  const pinsConfig = {
    startPins: 3,
    pinSize:
      (width! >= 1440
        ? 9
        : width! >= 1024
        ? 6
        : width! >= 700
        ? 8
        : width! >= 600
        ? 6
        : 6) /
      (lines / 8),
    pinGap:
      (width! >= 1440
        ? 75
        : width! >= 1024
        ? 50
        : width! >= 700
        ? 65
        : width! >= 600
        ? 50
        : 35) /
      (lines / 8),
  };

  const worldWidth: number = world.width;

  const worldHeight: number = world.height;

  useEffect(() => {
    engine.gravity.y = engineConfig.engineGravity;
    const element = document.getElementById("plinko");
    const render = Render.create({
      element: element!,
      bounds: {
        max: {
          y: worldHeight,
          x: worldWidth,
        },
        min: {
          y: 0,
          x: 0,
        },
      },
      options: {
        background: colors.background,
        hasBounds: true,
        width: worldWidth,
        height: worldHeight,
        wireframes: false,
      },
      engine,
    });
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);
    return () => {
      World.clear(engine.world, true);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, [lines, width]);

  const pins: Body[] = [];

  for (let l = 0; l < lines; l++) {
    const linePins = pinsConfig.startPins + l;
    const lineWidth = linePins * pinsConfig.pinGap;
    for (let i = 0; i < linePins; i++) {
      const pinX =
        worldWidth / 2 -
        lineWidth / 2 +
        i * pinsConfig.pinGap +
        pinsConfig.pinGap / 2;

      const pinY = l * pinsConfig.pinGap + 20;

      const pin = Bodies.circle(pinX, pinY, pinsConfig.pinSize, {
        label: `pin-${i}`,
        render: {
          fillStyle: "#D9D9D9",
        },
        isStatic: true,
      });
      pins.push(pin);
    }
  }

  function addInGameBall() {
    incrementInGameBallsCount();
  }

  function removeInGameBall() {
    decrementInGameBallsCount();
  }

  const addBall = useCallback(
    (ballValue: number, pos: number) => {
      addInGameBall();
      const ballSound = new Audio("/sounds/ball.wav");
      ballSound.volume = 0.2;
      ballSound.currentTime = 0;
      ballSound.play();

      const minBallX =
        worldWidth / 2 - pinsConfig.pinSize * 3 + pinsConfig.pinGap;
      const maxBallX =
        worldWidth / 2 -
        pinsConfig.pinSize * 3 -
        pinsConfig.pinGap +
        pinsConfig.pinGap / 2;

      // const pos = parseFloat(Math.random().toFixed(9));
      // const pos = mapResult[8][8];
      const ballX = pos! * (maxBallX - minBallX) + minBallX;
      console.log(">>>>>>", pos);
      const ballColor = colors.purple;
      const ball = Bodies.circle(ballX, 20, ballConfig.ballSize, {
        restitution: 1.25,
        friction: 0.6,
        label: `ball-${ballValue}`,
        id: new Date().getTime(),
        frictionAir: 0.05,
        collisionFilter: {
          group: -1,
        },
        render: {
          fillStyle: ballColor,
        },
        isStatic: false,
      });
      Composite.add(engine.world, ball);
    },
    [lines, width],
  );

  const floor = Bodies.rectangle(
    0,
    lines * pinsConfig.pinGap + 150,
    worldWidth * 10,
    60 / (lines / 8),
    {
      label: "block-1",
      render: {
        visible: false,
      },
      isStatic: true,
    },
  );

  const multipliers = getMultiplierByLinesQnt(lines, risk);

  const multipliersBodies: Body[] = [];

  let lastMultiplierX: number =
    worldWidth / 2 - (pinsConfig.pinGap / 2) * lines - pinsConfig.pinGap;

  let scaleX =
    width! >= 1440
      ? 1.25
      : width! >= 1024
      ? 0.8
      : width! >= 700
      ? 1.1
      : width! >= 600
      ? 0.8
      : 0.6;

  multipliers.forEach((multiplier) => {
    const blockSize = 60 / (lines / 8); // height and width
    const multiplierBody = Bodies.rectangle(
      lastMultiplierX +
        (width! >= 1440
          ? 75
          : width! >= 1024
          ? 50
          : width! >= 700
          ? 65
          : width! >= 600
          ? 50
          : 35) /
          (lines / 8),
      lines * pinsConfig.pinGap + 15,
      blockSize,
      blockSize,
      {
        label: multiplier.label,
        isStatic: true,
        restitution: 0,
        render: {
          visible: false,
          sprite: {
            xScale: scaleX / (lines / 8),
            yScale: scaleX / (lines / 8),
            texture: multiplier.img,
          },
        },
      },
    );
    lastMultiplierX = multiplierBody.position.x;
    multipliersBodies.push(multiplierBody);
  });

  Composite.add(engine.world, [...pins, ...multipliersBodies, floor]);

  async function onCollideWithMultiplier(ball: Body, multiplier: Body) {
    ball.collisionFilter.group = 2;
    World.remove(engine.world, ball);
    removeInGameBall();

    const multiplierElement = document.getElementById(multiplier.label);

    if (multiplierElement) {
      const originalTop = multiplierElement.offsetTop;
      const dropDistance = 20;

      const animationKeyframes = [
        { transform: "translateY(0)" },
        { transform: `translateY(${dropDistance}px)` },
        { transform: "translateY(0)" },
      ];

      const animationTiming = {
        duration: 500,
        easing: "ease-in-out",
      };

      const animationPromise = multiplierElement.animate(
        animationKeyframes,
        animationTiming,
      ).finished;

      await animationPromise;
    }

    const ballValue = ball.label.split("-")[1];

    const multiplierValues = multiplier.label.split("-");
    const multiplierValue = +multiplierValues[1];
    const multiplierColor = multiplierValues[2] ?? "#ffffff";
    const multiplierSound = multiplierValues[3] ?? "regular";

    const multiplierSong = new Audio(
      `/sounds/multiplier_${multiplierSound}.wav`,
    );
    multiplierSong.currentTime = 0;
    multiplierSong.volume = 0.2;
    multiplierSong.play();
    setLastMultipliers((prev) => [
      { color: `#${multiplierColor}`, value: multiplierValue },
      prev[0],
      prev[1],
      prev[2],
    ]);

    if (+ballValue <= 0) return;
  }
  async function onBodyCollision(event: IEventCollision<Engine>) {
    const pairs = event.pairs;
    for (const pair of pairs) {
      console.log("colliding", pair);
      const { bodyA, bodyB } = pair;
      if (bodyB.label.includes("ball") && bodyA.label.includes("block"))
        await onCollideWithMultiplier(bodyB, bodyA);
    }
  }
  Events.on(engine, "collisionActive", onBodyCollision);

  useEffect(() => {
    console.log(result);
    if (result && result?.result && betAmt) {
      if (result?.success !== true) {
        throw new Error(result?.message);
      }

      const win = result?.result === "Won";
      if (win) {
        successCustom(result?.message);
        soundAlert("/sounds/win.wav");
      } else errorCustom(result?.message);
      const newBetResult = { result: result?.strikeMultiplier, win };

      setBetResults((prevResults) => {
        const newResults = [...prevResults, newBetResult];
        if (newResults.length > 6) {
          newResults.shift();
        }
        return newResults;
      });

      // setStrikeNumber(strikeNumber);
      // setResult(win);
      setRefresh(true);

      // auto options
    }
  }, [lastMultipliers]);

  const handleBet = async () => {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }
      if (!betAmt || betAmt === 0) {
        throw new Error("Set Amount.");
      }
      if (selectedCoin && selectedCoin.amount < betAmt) {
        throw new Error("Insufficient balance for bet !");
      }
      setLoading(true);
      const response = await fetch(`/api/games/plinko`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          amount: betAmt,
          tokenMint: "SOL",
          rows: lines,
          risk: risk.toLowerCase(),
        }),
      });

      const { success, message, result, strikeMultiplier, strikeNumber } =
        await response.json();

      if (!success) throw new Error(message);
      // console.log(success, message, result, strikeMultiplier, strikeNumber);
      setResult({ success, message, result, strikeMultiplier, strikeNumber });
      addBall(1, getRandomFromFallMap(strikeMultiplier));
      const win = result === "Won";
      if (betSetting === "auto") {
        if (useAutoConfig && win) {
          setBetAmt(
            autoWinChangeReset
              ? userInput!
              : betAmt + ((autoWinChange ?? 0) * betAmt) / 100.0,
          );
        } else if (useAutoConfig && !win) {
          setBetAmt(
            autoLossChangeReset
              ? userInput!
              : betAmt + ((autoLossChange ?? 0) * betAmt) / 100.0,
          );
        }
        // update profit / loss
        setAutoBetProfit(
          autoBetProfit +
            (win ? result?.strikeMultiplier * (1 - houseEdge) - 1 : -1) *
              betAmt,
        );
        // update count
        if (typeof autoBetCount === "number") {
          setAutoBetCount(autoBetCount > 0 ? autoBetCount - 1 : 0);
          autoBetCount === 1 && warningCustom("Auto bet stopped", "top-right");
        } else
          setAutoBetCount(
            autoBetCount.length > 12
              ? autoBetCount.slice(0, 5)
              : autoBetCount + 1,
          );
      }
    } catch (error: any) {
      errorCustom(error?.message ?? "Could not make the bet.");
      console.error("Error occurred while betting:", error);
      setAutoBetCount(0);
      setStartAuto(false);
      setLoading(false);
    } finally {
      setLoading(false);
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
    // console.log("Auto: ", startAuto, autoBetCount);
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
        potentialLoss <= -autoStopLoss
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
      handleBet();
    } else {
      setStartAuto(false);
      setAutoBetProfit(0);
      setUserInput(betAmt);
    }
  }, [startAuto, autoBetCount]);

  const onSubmit = async (data: any) => {
    if (betSetting === "auto") {
      if (betAmt === 0) {
        errorCustom(translator("Set Amount.", language));
        return;
      }
      if (typeof autoBetCount === "number" && autoBetCount <= 0) {
        errorCustom(translator("Set Bet Count.", language));
        return;
      }
      if (
        (typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0)
      ) {
        // console.log("Auto betting. config: ", useAutoConfig);
        setStartAuto(true);
      }
    } else if (wallet.connected) handleBet();
    // addBall(1, 0.5);
  };

  const disableInput = useMemo(() => {
    return (
      (betSetting === "auto" && startAuto) || loading || inGameBallsCount > 0
    );
  }, [betSetting, startAuto, loading, inGameBallsCount]);

  return (
    <GameLayout title="FOMO - Plinko">
      <GameOptions>
        <>
          <div className="relative w-full flex lg:hidden mb-[1.4rem]">
            {startAuto && (
              <div
                onClick={() => {
                  soundAlert("/sounds/betbutton.wav");
                  warningCustom("Auto bet stopped", "top-right");
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
                loading ||
                disableInput ||
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
            <div className="w-full flex lg:hidden">
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
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                {/* amt input  */}
                <BetAmount
                  betAmt={betAmt}
                  setBetAmt={setUserInput}
                  currentMultiplier={5.6}
                  leastMultiplier={0}
                  game="wheel"
                  disabled={disableInput}
                />

                {/* risk  */}
                <div className="mb-6 w-full">
                  <div className="flex justify-between text-xs mb-2">
                    <p className="font-medium font-changa text-[#F0F0F0] text-opacity-90">
                      {translator("Risk", language)}
                    </p>
                  </div>
                  <div className="flex lg:flex-row flex-col gap-2.5 w-full items-center justify-evenly rounded-[8px] text-white font-chakra text-sm font-semibold bg-[#0C0F16] p-4">
                    <div className="flex lg:w-[66.66%] w-full gap-2.5">
                      <button
                        onClick={() => setRisk("Low")}
                        type="button"
                        className={`text-center w-full rounded-[5px] border-[2px] disabled:cursor-not-allowed disabled:opacity-50 bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                          risk === "Low"
                            ? "border-[#7839C5]"
                            : "border-transparent hover:border-[#7839C580]"
                        }`}
                        disabled={disableInput}
                      >
                        {translator("Low", language)}
                      </button>
                      <button
                        onClick={() => setRisk("Medium")}
                        type="button"
                        className={`text-center w-full rounded-[5px] border-[2px] disabled:cursor-not-allowed disabled:opacity-50 bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                          risk === "Medium"
                            ? "border-[#7839C5]"
                            : "border-transparent hover:border-[#7839C580]"
                        }`}
                        disabled={disableInput}
                      >
                        {translator("Medium", language)}
                      </button>
                    </div>
                    <button
                      onClick={() => setRisk("High")}
                      type="button"
                      className={`text-center lg:w-[33.33%] w-full rounded-[5px] border-[2px] disabled:cursor-not-allowed disabled:opacity-50 bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                        risk === "High"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      }`}
                      disabled={disableInput}
                    >
                      {translator("High", language)}
                    </button>
                  </div>
                </div>

                {/* rows  */}
                <div className="mb-6 w-full">
                  <div className="flex justify-between text-xs mb-2 font-medium font-changa text-[#F0F0F0] text-opacity-90">
                    <p className="">{translator("Rows", language)}</p>
                    <p className="text-[#94A3B8] text-sm">{lines}</p>
                  </div>
                  <div className="relative h-[5px] rounded-full bg-[#2A2E38] w-full mt-5">
                    <input
                      type="range"
                      min={8}
                      max={16}
                      step={1}
                      disabled={loading || startAuto || disableInput}
                      value={lines}
                      onChange={(e) =>
                        setLines(parseInt(e.target.value) as LinesType)
                      }
                      className="defaultSlider absolute top-[-8px] w-full bg-transparent appearance-none z-20 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div
                      className="absolute rounded-l-full h-[5px] bg-[#9945ff] z-10"
                      style={{ width: `${((lines - 8) * 100) / 8}%` }}
                    ></div>
                  </div>
                </div>

                {betSetting === "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <AutoCount loading={loading || startAuto} />
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
                        warningCustom("Auto bet stopped", "top-right");
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
                      loading ||
                      disableInput ||
                      (betAmt !== undefined &&
                        maxBetAmt !== undefined &&
                        betAmt > maxBetAmt)
                        ? true
                        : false
                    }
                  >
                    {loading ? <Loader /> : "BET"}
                  </BetButton>
                </div>
              </form>
            </FormProvider>
            <div className="w-full flex lg:hidden">
              <BetSetting
                betSetting={betSetting}
                setBetSetting={setBetSetting}
              />
            </div>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <>
          <div className="w-full flex justify-between items-center h-4">
            {loading ? (
              <div className="font-chakra text-sm font-medium text-white text-opacity-75">
                {translator("Betting", language)}...
              </div>
            ) : null}
          </div>
          <MultiplierHistory multiplierHistory={lastMultipliers} />
          <div className="relative">
            <div id="plinko" className="border border-red-700" />
            <div
              style={{
                position: "absolute",
                width: world.width,
                height: world.height,
                top: 0,
                left: 0,
                zIndex: 100,
              }}
            >
              {multipliersBodies.map((multiplierBody, index) => (
                <div
                  key={multiplierBody.label}
                  id={multiplierBody.label}
                  style={{
                    position: "absolute",
                    left: `${
                      multiplierBody.position.x -
                      (multiplierBody?.render?.sprite?.xScale ?? 1) * 27
                    }px`,
                    top: `${
                      multiplierBody.position.y -
                      (multiplierBody?.render?.sprite?.yScale ?? 1) * 27
                    }px`,
                    width: `${
                      (multiplierBody?.render?.sprite?.xScale ?? 1) * 55
                    }px`,
                    height: `${
                      (multiplierBody?.render?.sprite?.yScale ?? 1) *
                      55 *
                      (lines / 16)
                    }px`,
                    background: "#202329",
                    borderTop: "0.2rem solid",
                    borderColor: multiplierColorMap[`${lines}`][index],
                    color: multiplierColorMap[`${lines}`][index],
                    borderRadius: "0.32rem",
                  }}
                  className="flex items-center justify-center font-semibold text-xs"
                >
                  {multipliers[index].value}
                </div>
              ))}
            </div>
          </div>
          <div id="plinko-base" className="bg-red-200" />
        </>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />{" "}
      </GameTable>
    </GameLayout>
  );
}
