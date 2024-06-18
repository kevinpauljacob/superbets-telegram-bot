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
  Common,
} from "matter-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
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
import {
  getRandomFromFallMap,
  multiplierColorMap,
} from "@/components/games/Plinko/constants";
import { GameType } from "@/utils/provably-fair";
import { riskToChance } from "@/components/games/Plinko/RiskToChance";

export type LinesType = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

export type RisksType = "low" | "medium" | "high";

function getMultiplier(value: number, line: number, index: number) {
  //todo: dynamic img and sound generation
  const color = multiplierColorMap[`${line}`][index];
  const sound = value <= 1 ? "loss" : "win";
  return {
    value: value,
    label: `block-${value}-${color.slice(1)}-${sound}-${index}`,
    sound: "/sounds/multiplier_regular.wav",
    img: `/assets/multipliers/multiplier1.png`,
  };
}

function getMultiplierByLinesQnt(value: LinesType, risk: RisksType) {
  return riskToChance[risk][value].map((multiplier, index) =>
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
              : 8) /
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
    enableSounds,
    updatePNL,
  } = useGlobalContext();

  const muteRef = useRef<boolean>(false);
  muteRef.current = !enableSounds;

  const [betAmt, setBetAmt] = useState<number | undefined>();
  const [userInput, setUserInput] = useState<number | undefined>();
  const [risk, setRisk] = useState<RisksType>("low");
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
  Engine.update(engine, 100);
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

  const pinCategory = 0b001;
  const ballCategory = 0b010;

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

    let isRunning = true;
    let lastUpdate = performance.now();
    const fixedDelta = 1000 / 60;

    const runnerFunc = () => {
      const now = performance.now();
      while (lastUpdate < now) {
        Engine.update(engine, fixedDelta);
        lastUpdate += fixedDelta;
      }
      if (isRunning) {
        requestAnimationFrame(runnerFunc);
      }
    };

    requestAnimationFrame(runnerFunc);
    Render.run(render);

    return () => {
      isRunning = false;
      World.clear(engine.world, true);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, [lines, width, risk]);

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
        collisionFilter: {
          category: pinCategory,
          mask: ballCategory,
        },
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
      soundAlert("/sounds/ball.wav", muteRef.current);

      const minBallX =
        worldWidth / 2 - pinsConfig.pinSize * 3 + pinsConfig.pinGap;
      const maxBallX =
        worldWidth / 2 -
        pinsConfig.pinSize * 3 -
        pinsConfig.pinGap +
        pinsConfig.pinGap / 2;

      const ballX = pos! * (maxBallX - minBallX) + minBallX;
      // console.log(">>>>>>", pos);
      let isNeg = "";
      if (pos < 0) {
        pos = pos * -1;
        isNeg = "-yes";
      }
      const ballColor = colors.purple;
      const ball = Bodies.circle(ballX, 0, ballConfig.ballSize, {
        restitution: 1.25,
        friction: 0.6,
        label: `ball-${ballValue}-${pos}${isNeg}`,
        id: new Date().getTime(),
        frictionAir: 0.05,
        collisionFilter: {
          // group: -1,
          category: ballCategory,
          mask: pinCategory,
        },
        render: {
          fillStyle: ballColor,
          // visible: false
        },
        isStatic: false,
      });
      Composite.add(engine.world, ball);
    },
    [lines, width, risk],
  );

  const floor = Bodies.rectangle(
    0,
    lines * pinsConfig.pinGap + 150,
    worldWidth * 10,
    60 / (lines / 8),
    {
      label: "block-floor-plinko",
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
        isSensor: true,
        // collisionFilter: {
        //   mask: 0,
        // },
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

    if (multiplier.label.includes("floor")) return;

    const multiplierElement = document.getElementById(multiplier.label);

    // console.log(multiplier.label, multiplierElement);

    if (multiplierElement) {
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

    soundAlert(`/sounds/multiplier_${multiplierSound}.wav`, muteRef.current);
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
      const { bodyA, bodyB } = pair;
      if (bodyB.label.includes("ball") && bodyA.label.includes("block")) {
        await onCollideWithMultiplier(bodyB, bodyA);
      }
    }
  }

  Events.on(engine, "collisionActive", onBodyCollision);

  useEffect(() => {
    // console.log(result);
    if (result && result?.result && betAmt) {
      if (result?.success !== true) {
        throw new Error(result?.message);
      }

      const win = result?.result === "Won";

      updatePNL(GameType.plinko, win, betAmt, result?.strikeMultiplier ?? 0);

      if (win) {
        successCustom(result?.message);
        soundAlert("/sounds/win.wav", muteRef.current);
      } else errorCustom(result?.message);
      const newBetResult = { result: result?.strikeMultiplier, win };

      setBetResults((prevResults) => {
        const newResults = [...prevResults, newBetResult];
        if (newResults.length > 6) {
          newResults.shift();
        }
        return newResults;
      });

      setRefresh(true);
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
          risk,
        }),
      });

      const { success, message, result, strikeMultiplier, strikeNumber } =
        await response.json();

      if (!success) throw new Error(message);
      setResult({ success, message, result, strikeMultiplier, strikeNumber });

      // we only have mapping for low risk multipliers. Since the positions wld be sa,e we need to find the mapped multiplier for other risks
      let multiplierRiskIndex = riskToChance[risk][
        lines
      ].findIndex((multiplier) => multiplier === strikeMultiplier);
      let mappedMultiplier = riskToChance["low"][lines][multiplierRiskIndex];

      addBall(1, getRandomFromFallMap(worldWidth, lines, mappedMultiplier));

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
    // addBall(1, betAmt!);
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
                !wallet ||
                !session?.user ||
                loading ||
                (betSetting === "auto" && startAuto) ||
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
                  currentMultiplier={multipliers.reduce((max, item) => {
                    return Math.max(max, item.value);
                  }, 0)}
                  leastMultiplier={multipliers.reduce((max, item) => {
                    return Math.min(max, item.value);
                  }, 0)}
                  game="plinko"
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
                        onClick={() => setRisk("low")}
                        type="button"
                        className={`text-center w-full rounded-[5px] border-[2px] disabled:cursor-not-allowed disabled:opacity-50 bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                          risk === "low"
                            ? "border-[#7839C5]"
                            : "border-transparent hover:border-[#7839C580]"
                        }`}
                        disabled={disableInput}
                      >
                        {translator("low", language)}
                      </button>
                      <button
                        onClick={() => setRisk("medium")}
                        type="button"
                        className={`text-center w-full rounded-[5px] border-[2px] disabled:cursor-not-allowed disabled:opacity-50 bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                          risk === "medium"
                            ? "border-[#7839C5]"
                            : "border-transparent hover:border-[#7839C580]"
                        }`}
                        disabled={disableInput}
                      >
                        {translator("medium", language)}
                      </button>
                    </div>
                    <button
                      onClick={() => setRisk("high")}
                      type="button"
                      className={`text-center lg:w-[33.33%] w-full rounded-[5px] border-[2px] disabled:cursor-not-allowed disabled:opacity-50 bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                        risk === "high"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      }`}
                      disabled={disableInput}
                    >
                      {translator("high", language)}
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
                      !wallet ||
                      !session?.user ||
                      loading ||
                      (betSetting === "auto" && startAuto) ||
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
            <div id="plinko" className="" />
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
                    fontSize: `${
                      (width! > 640 ? (width! > 1440 ? 1 : 0.75) : 0.5) /
                      (lines / 8)
                    }rem`,
                  }}
                  className="flex items-center justify-center font-semibold"
                >
                  {multipliers[index].value}
                </div>
              ))}
            </div>
          </div>
          <div id="plinko-base" className="" />
        </>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />{" "}
      </GameTable>
    </GameLayout>
  );
}
