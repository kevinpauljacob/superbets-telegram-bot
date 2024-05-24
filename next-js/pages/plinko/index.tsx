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
import { warningCustom } from "@/components/toasts/ToastGroup";
import { translator } from "@/context/transactions";
import { useSession } from "next-auth/react";
import BetButton from "@/components/games/BetButton";
import Loader from "@/components/games/Loader";
import ConfigureAutoButton from "@/components/ConfigureAutoButton";
import BetAmount from "@/components/games/BetAmountInput";
import AutoCount from "@/components/AutoCount";

export type LinesType = 8;

export type RisksType = "Low" | "Medium" | "High";

type MultiplierValues = 5.6 | 2.1 | 1.1 | 1 | 0.5;

const multiplierSounds = {
  5.6: "/sounds/multiplier-good.wav",
  2.1: "/sounds/multiplier-regular.wav",
  1.1: "/sounds/multiplier-regular.wav",
  1: "/sounds/multiplier-regular.wav",
  0.5: "/sounds/multiplier-low.wav",
} as const;

const multipliers = {
  5.6: {
    label: "block-5.6",
    sound: "/sounds/multiplier-good.wav",
    img: "/assets/multipliers/multiplier5_6.png",
  },
  2.1: {
    label: "block-2.1",
    sound: "/sounds/multiplier-regular.wav",
    img: "/assets/multipliers/multiplier2_1.png",
  },
  1.1: {
    label: "block-1.1",
    sound: "/sounds/multiplier-good.wav",
    img: "/assets/multipliers/multiplier1_1.png",
  },
  1: {
    label: "block-1",
    sound: "/sounds/multiplier-regular.wav",
    img: "/assets/multipliers/multiplier1.png",
  },
  0.5: {
    label: "block-0.5",
    sound: "/sounds/multiplier-low.wav",
    img: "/assets/multipliers/multiplier0_5.png",
  },
} as const;

type MultipliersType = keyof typeof multipliers;

function getMultiplier(value: MultipliersType) {
  return multipliers[value];
}

const multiplyBlocks8Lines = [
  getMultiplier(5.6),
  getMultiplier(2.1),
  getMultiplier(1.1),
  getMultiplier(1),
  getMultiplier(0.5),
  getMultiplier(1),
  getMultiplier(1.1),
  getMultiplier(2.1),
  getMultiplier(5.6),
];

const multiplyBlocksByLinesQnt = {
  8: multiplyBlocks8Lines,
};

function getMultiplierByLinesQnt(value: LinesType) {
  return multiplyBlocksByLinesQnt[value];
}

function getMultiplierSound(value: MultiplierValues): string {
  return multiplierSounds[value];
}

const pins = {
  startPins: 3,
  pinSize: 8,
  pinGap: 51,
};

const ball = {
  ballSize: 10,
};

const engine = {
  engineGravity: 1.4,
};

const colors = {
  background: "#0C0F16",
  purple: "#C52BFF",
} as const;

const configPlinko = {
  pins,
  ball,
  engine,
  colors,
};

const Timer = dynamic(() => import("../../components/games/Timer"), {
  ssr: false,
});
const Progress = dynamic(() => import("../../components/games/Progressbar"), {
  ssr: false,
});

export default function Plinko() {
  const { data: session, status } = useSession();
  const { width, height } = useWindowSize();
  const world = {
    width: width! < 400 ? 400 : 800,
    height: width! < 400 ? 400 : 600,
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
  } = useGlobalContext();

  const [user, setUser] = useState<any>(null);
  const [betAmt, setBetAmt] = useState<number | undefined>();
  const [userInput, setUserInput] = useState<number | undefined>();
  const [risk, setRisk] = useState<"low" | "medium" | "high">("low");
  const [segments, setSegments] = useState<number>(10);
  const [betCount, setBetCount] = useState(0);
  const [deposit, setDeposit] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);

  const [betSetting, setBetSetting] = useState<"manual" | "auto">("manual");

  const engine = Engine.create();
  const [lines, setLines] = useState<LinesType>(8);
  const [risks, setRisks] = useState<RisksType>("Low");
  const [lastMultipliers, setLastMultipliers] = useState<number[]>([]);
  const [gamesRunning, setGamesRunning] = useState(0);
  const [inGameBallsCount, setInGameBallsCount] = useState(gamesRunning);
  const incrementInGameBallsCount = () => {
    setInGameBallsCount(inGameBallsCount + 1);
  };
  const decrementInGameBallsCount = () => {
    setInGameBallsCount(inGameBallsCount - 1);
  };
  const { colors, ball: ballConfig, engine: engineConfig } = configPlinko;

  const pinsConfig = {
    startPins: 3,
    pinSize: width! < 400 ? 2 : 8,
    pinGap: width! < 400 ? 20 : 51,
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
  }, [lines]);

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

      const pinY =
        worldWidth / lines + l * pinsConfig.pinGap + pinsConfig.pinGap - 60;

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
    (ballValue: number) => {
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

      const pos = parseFloat(Math.random().toFixed(9));
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
    [lines],
  );

  const floor = Bodies.rectangle(0, worldWidth + 10, worldWidth * 10, 400, {
    label: "block-1",
    render: {
      visible: false,
    },
    isStatic: true,
  });

  const multipliers = getMultiplierByLinesQnt(lines);

  const multipliersBodies: Body[] = [];

  let lastMultiplierX: number =
    worldWidth / 2 - (pinsConfig.pinGap / 2) * lines - pinsConfig.pinGap;

  multipliers.forEach((multiplier) => {
    const blockSize = 60; // height and width
    const multiplierBody = Bodies.rectangle(
      lastMultiplierX + 51,
      worldWidth / lines + lines * pinsConfig.pinGap + pinsConfig.pinGap - 68,
      blockSize,
      blockSize,
      {
        label: multiplier.label,
        isStatic: true,
        render: {
          sprite: {
            xScale: 0.8,
            yScale: 0.8,
            texture: multiplier.img,
          },
        },
      },
    );
    lastMultiplierX = multiplierBody.position.x;
    multipliersBodies.push(multiplierBody);
  });

  Composite.add(engine.world, [...pins, ...multipliersBodies, floor]);

  function bet(betValue: number) {
    addBall(betValue);
  }

  async function onCollideWithMultiplier(ball: Body, multiplier: Body) {
    ball.collisionFilter.group = 2;
    World.remove(engine.world, ball);
    removeInGameBall();
    const ballValue = ball.label.split("-")[1];
    const multiplierValue = +multiplier.label.split("-")[1] as MultiplierValues;

    const multiplierSong = new Audio(getMultiplierSound(multiplierValue));
    multiplierSong.currentTime = 0;
    multiplierSong.volume = 0.2;
    multiplierSong.play();
    setLastMultipliers((prev) => [multiplierValue, prev[0], prev[1], prev[2]]);

    if (+ballValue <= 0) return;
  }
  async function onBodyCollision(event: IEventCollision<Engine>) {
    const pairs = event.pairs;
    for (const pair of pairs) {
      const { bodyA, bodyB } = pair;
      if (bodyB.label.includes("ball") && bodyA.label.includes("block"))
        await onCollideWithMultiplier(bodyB, bodyA);
    }
  }

  Events.on(engine, "collisionActive", onBodyCollision);

  useEffect(() => {
    if (refresh && wallet?.publicKey) {
      getBalance();
      getWalletBalance();
      setRefresh(false);
    }
  }, [wallet?.publicKey, refresh]);

  // const bet = async () => {
  //   try {
  //     console.log("Placing Flip");
  //     let response = await placeFlip(wallet, betAmt, "heads");
  //     if (response.success) {
  //       setTimeout(() => {
  //         response?.data?.result == "Won"
  //           ? toast.success(response?.message)
  //           : toast.error(response?.message);
  //         setResult(response?.data?.result ?? "Lost");
  //         setRefresh(true);
  //         // setLoading(false);
  //         setFlipping(false);
  //       }, 4000);
  //     } else {
  //       setDeposit(false);
  //       setLoading(false);
  //       setFlipping(false);
  //       setResult(null);
  //       response?.message && toast.error(response?.message);
  //     }
  //   } catch (e) {
  //     toast.error("Could not make Flip.");
  //     setDeposit(false);
  //     setFlipping(false);
  //     setLoading(false);
  //     setResult(null);
  //   }
  // };

  const onSubmit = async (data: any) => {
    bet(1.0);
    console.log(data);
    if (!wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    if (betAmt === 0) {
      toast.error("Set Amount.");
      return;
    }
  };

  useEffect(() => {
    if (deposit) {
      // console.log("deposit", deposit);
      setLoading(true);
      !result && setFlipping(true);
    }
  }, [deposit]);

  // useEffect(() => {
  //   console.log("Bet type: ", betType);
  //   console.log("Others: ", loading, flipping, deposit);
  // }, [betType]);
  // useEffect(() => {
  //   console.log("load Bet type: ", betType);
  //   console.log("load Others: ", loading, flipping, deposit);
  // }, [loading]);
  // useEffect(() => {
  //   console.log("flip Bet type: ", betType);
  //   console.log("flip Others: ", loading, flipping, deposit);
  // }, [flipping]);
  // useEffect(() => {
  //   console.log("depo Bet type: ", betType);
  //   console.log("depo Others: ", loading, flipping, deposit);
  // }, [deposit]);

  const segmentFill =
    segments === 10
      ? 0
      : segments === 20
      ? 25
      : segments === 30
      ? 50
      : segments === 40
      ? 75
      : segments === 50
      ? 100
      : null;

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

  const disableInput = useMemo(() => {
    return betSetting === "auto" && startAuto ? true : false || loading;
  }, [betSetting, startAuto, loading]);

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
                (coinData && coinData[0].amount < minGameAmount) ||
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
                        onClick={() => setRisk("low")}
                        type="button"
                        className={`text-center w-full rounded-[5px] border-[2px] disabled:cursor-not-allowed disabled:opacity-50 bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                          risk === "low"
                            ? "border-[#7839C5]"
                            : "border-transparent hover:border-[#7839C580]"
                        }`}
                        disabled={disableInput}
                      >
                        {translator("Low", language)}
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
                        {translator("Medium", language)}
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
                      {translator("High", language)}
                    </button>
                  </div>
                </div>

                {/* rows  */}
                <div className="mb-6 w-full">
                  <div className="flex justify-between text-xs mb-2 font-medium font-changa text-[#F0F0F0] text-opacity-90">
                    <p className="">{translator("Segments", language)}</p>
                    <p className="text-[#94A3B8] text-sm">{segments}</p>
                  </div>
                  <div className="relative h-[5px] rounded-full bg-[#2A2E38] w-full mt-5">
                    <input
                      type="range"
                      min={10}
                      max={50}
                      step={10}
                      disabled={loading || startAuto || disableInput}
                      value={segments}
                      onChange={(e) => setSegments(parseInt(e.target.value))}
                      className="defaultSlider absolute top-[-8px] w-full bg-transparent appearance-none z-20 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div
                      className="absolute rounded-l-full h-[5px] bg-[#9945ff] z-10"
                      style={{ width: `${segmentFill}%` }}
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
                      (coinData && coinData[0].amount < minGameAmount) ||
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
          <div id="plinko" />
        </>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />{" "}
      </GameTable>
    </GameLayout>
  );
}
