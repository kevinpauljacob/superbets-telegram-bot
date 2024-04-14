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
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { placeFlip } from "../../context/gameTransactions";
import HistoryTable from "../../components/games/CoinFlip/HistoryTable";
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

export default function Flip() {
  const { width, height } = useWindowSize();
  const world = {
    width: width! < 400 ? 400 : 800,
    height: width! < 400 ? 400 : 600,
  };

  const wallet = useWallet();
  const methods = useForm();

  const { coinData, getBalance, getWalletBalance, setShowWalletModal } =
    useGlobalContext();

  const [user, setUser] = useState<any>(null);
  const [betAmt, setBetAmt] = useState(0.2);
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

  useEffect(() => {
    if (refresh && wallet?.publicKey) {
      getBalance();
      getWalletBalance();
      setRefresh(false);
    }
  }, [wallet?.publicKey, refresh]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBetAmt(parseFloat(e.target.value));
  };

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBetCount(parseFloat(e.target.value));
  };

  return (
    <GameLayout title="FOMO - Plinko">
      <GameOptions>
        <>
          <BetSetting betSetting={betSetting} setBetSetting={setBetSetting} />

          {betSetting == "manual" ? (
            <div className="w-full flex flex-col">
              <FormProvider {...methods}>
                <form
                  className="flex w-full flex-col gap-0"
                  autoComplete="off"
                  onSubmit={methods.handleSubmit(onSubmit)}
                >
                  {/* amt input  */}
                  <div className="mb-0 flex w-full flex-col">
                    <div className="mb-1 flex w-full items-center justify-between text-sm font-changa font-medium">
                      <label className="text-[#F0F0F0] text-opacity-90">
                        Bet amount
                      </label>
                      <span className="text-[#94A3B8] text-opacity-90">
                        Available :{" "}
                        {coinData ? coinData[0]?.amount.toFixed(4) : 0}
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
                        onChange={handleChange}
                        placeholder={"Amount"}
                        value={betAmt}
                        className={`flex w-full min-w-0 bg-transparent text-base text-white font-chakra placeholder-white  placeholder-opacity-40 outline-none`}
                      />
                      <span
                        className="bg-[#D9D9D9] bg-opacity-5 py-1 px-1.5 rounded text-xs font-semibold text-[#F0F0F0] text-opacity-50"
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
                        ? methods.formState.errors[
                            "amount"
                          ]!.message!.toString()
                        : "NONE"}
                    </span>
                  </div>

                  {/* balance alert  */}
                  {(!coinData || (coinData && coinData[0].amount < 0.0001)) && (
                    <div className="mb-5 w-full rounded-lg bg-[#0C0F16] px-3 pb-2 pt-4 text-white md:px-6">
                      <div className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
                        Please deposit funds to start playing. View{" "}
                        <u
                          onClick={() => {
                            setShowWalletModal(true);
                          }}
                        >
                          WALLET
                        </u>
                      </div>
                    </div>
                  )}
                </form>
                {/* choosing bet options  */}
                <div className="flex flex-col w-full gap-4">
                  <button
                    type="submit"
                    disabled={
                      coinData && coinData[0].amount < 0.0001 ? true : false
                    }
                    onClick={onSubmit}
                    className={`${
                      coinData && coinData[0].amount < 0.0001
                        ? "cursor-not-allowed opacity-70"
                        : "hover:opacity-90"
                    } w-full rounded-lg bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] py-2.5 font-changa text-xl text-white`}
                  >
                    BET
                  </button>
                </div>
              </FormProvider>
            </div>
          ) : (
            <div className="w-full flex flex-col">
              <FormProvider {...methods}>
                <form
                  className="flex w-full flex-col gap-0"
                  autoComplete="off"
                  onSubmit={methods.handleSubmit(onSubmit)}
                >
                  <div className="mb-0 flex w-full flex-col">
                    <div className="mb-1 flex w-full items-center justify-between">
                      <label className="text-xs text-[#F0F0F0] text-opacity-75">
                        Bet amount
                      </label>
                      <span className="text-sm text-[#F0F0F0] text-opacity-75">
                        Available :{" "}
                        {coinData ? coinData[0]?.amount.toFixed(4) : 0}
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
                        onChange={handleChange}
                        placeholder={"Amount"}
                        value={betAmt}
                        className={`flex w-full min-w-0 bg-transparent text-sm text-white placeholder-white  placeholder-opacity-40 outline-none`}
                      />
                      <span
                        className="bg-[#D9D9D9] bg-opacity-5 py-1 px-1.5 rounded text-sm text-[#F0F0F0] text-opacity-75"
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
                        ? methods.formState.errors[
                            "amount"
                          ]!.message!.toString()
                        : "NONE"}
                    </span>
                  </div>
                  <div className="w-full flex flex-row items-end gap-3">
                    <div className="mb-0 flex w-full flex-col">
                      <div className="mb-1 flex w-full items-center justify-between">
                        <label className="text-xs text-[#F0F0F0] text-opacity-75">
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
                          className={`flex w-full min-w-0 bg-transparent text-sm text-white placeholder-white  placeholder-opacity-40 outline-none`}
                        />
                        <span
                          className="bg-[#D9D9D9] bg-opacity-5 py-1 px-1.5 rounded text-sm text-[#F0F0F0] text-opacity-75"
                          onClick={() =>
                            setBetCount(coinData ? coinData[0]?.amount : 0)
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
                          ? methods.formState.errors[
                              "amount"
                            ]!.message!.toString()
                          : "NONE"}
                      </span>
                    </div>
                    <div className="mb-[1.4rem] rounded-md w-full h-11 flex items-center justify-center opacity-75 cursor-pointer text-white text-opacity-90 border-2 border-white bg-white bg-opacity-0 hover:bg-opacity-5">
                      Configure Auto
                    </div>
                  </div>
                </form>
                {/* choosing bet options  */}
                <div className="flex flex-col w-full gap-4">
                  {loading ? (
                    <div className="mb-0 flex w-full flex-col items-center rounded-lg bg-[#C20FC5] bg-opacity-10 px-4 pb-4 pt-2">
                      {deposit ? (
                        flipping ? (
                          // while getting flip result
                          <div className="flex w-full flex-col items-center justify-center">
                            <Image
                              src={"/assets/coin.png"}
                              width={50}
                              height={50}
                              alt=""
                              className="rotate mb-2"
                            />
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              Deposit Confirmed
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              Flipping the coin...
                            </span>
                          </div>
                        ) : (
                          // after getting flip result
                          <div className="flex w-full flex-col items-center justify-center">
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              {result && result === "Won"
                                ? "yay..."
                                : "ooops..."}
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              {result && result === "Won"
                                ? "You Won!"
                                : "You Lost!"}
                            </span>
                            <button
                              onClick={() => {
                                setLoading(false);
                                setResult(null);
                                setDeposit(false);
                                setFlipping(false);
                                setBetAmt(0);
                              }}
                              className="mt-2 w-full rounded-[5px] border border-[#F200F21A] bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] px-5 py-2 font-changa font-semibold text-white text-opacity-90 shadow-[0_5px_10px_rgba(0,0,0,0.3)]"
                            >
                              Bet Again
                            </button>
                          </div>
                        )
                      ) : (
                        loading && (
                          // when making bet request
                          <div className="flex w-full flex-col items-center justify-center">
                            <Image
                              src={"/assets/coin.png"}
                              width={50}
                              height={50}
                              alt=""
                              className="rotate mb-2"
                            />
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              preparing for flip
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              Confirming deposit...
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={
                        coinData && coinData[0].amount < 0.0001 ? true : false
                      }
                      onClick={onSubmit}
                      className={`${
                        coinData && coinData[0].amount < 0.0001
                          ? "cursor-not-allowed opacity-70"
                          : "hover:opacity-90"
                      } w-full rounded-lg bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] py-2.5 font-lilita text-xl text-white`}
                    >
                      BET
                    </button>
                  )}
                </div>
              </FormProvider>
            </div>
          )}
        </>
      </GameOptions>
      <GameDisplay>
        <>
          <MultiplierHistory multiplierHistory={lastMultipliers} />
          <div id="plinko" />
        </>
      </GameDisplay>
      <GameTable>
        <HistoryTable refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
