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
import { BetActions } from "@/components/games/Plinko/BetActions";
import { MultiplierHistory } from "@/components/games/Plinko/MultiplierHistory";

export type LinesType = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

export type RisksType = "Low" | "Medium" | "High";

type MultiplierValues =
  // | 5.6
  // | 2.1
  // | 1.1
  // | 1
  // | 0.5
  // | 2
  // | 1.6
  // | 0.7
  // | 8.9
  // | 3
  // | 1.4
  // | 8.4
  // | 1.9
  // | 1.3
  // | 10
  // | 8.1
  // | 4
  // | 1.2
  // | 0.9
  // | 7.1
  // | 15
  // | 8
  // | 1.5
  // | 16
  // | 9


  | 110
  | 88
  | 41
  | 33
  | 25
  | 18
  | 15
  | 10
  | 5.6
  | 5
  | 3
  | 2.1
  | 2
  | 1.6
  | 1.5
  | 1.1
  | 1
  | 0.7
  | 0.5
  | 0.3;

const multiplierSounds = {
  110: "/sounds/multiplier-best.wav",
  88: "/sounds/multiplier-best.wav",
  41: "/sounds/multiplier-best.wav",
  33: "/sounds/multiplier-best.wav",
  25: "/sounds/multiplier-best.wav",
  18: "/sounds/multiplier-good.wav",
  15: "/sounds/multiplier-good.wav",
  10: "/sounds/multiplier-good.wav",
  5.6: "/sounds/multiplier-good.wav",
  5: "/sounds/multiplier-good.wav",
  3: "/sounds/multiplier-regular.wav",
  2.1: "/sounds/multiplier-regular.wav",
  2: "/sounds/multiplier-regular.wav",
  1.6: "/sounds/multiplier-regular.wav",
  1.5: "/sounds/multiplier-regular.wav",
  1.1: "/sounds/multiplier-regular.wav",
  1: "/sounds/multiplier-regular.wav",
  0.7: "/sounds/multiplier-low.wav",
  0.5: "/sounds/multiplier-low.wav",
  0.3: "/sounds/multiplier-low.wav",
} as const;

const multipliers = {
  110: {
    label: "block-110",
    sound: "/sounds/multiplier-best.wav",
    img: "/assets/multipliers/multiplier110.png",
  },
  88: {
    label: "block-88",
    sound: "/sounds/multiplier-best.wav",
    img: "/assets/multipliers/multiplier110.png",
  },
  41: {
    label: "block-41",
    sound: "/sounds/multiplier-best.wav",
    img: "/assets/multipliers/multiplier110.png",
  },
  33: {
    label: "block-33",
    sound: "/sounds/multiplier-best.wav",
    img: "/assets/multipliers/multiplier110.png",
  },
  25: {
    label: "block-25",
    sound: "/sounds/multiplier-best.wav",
    img: "/assets/multipliers/multiplier110.png",
  },
  18: {
    label: "block-18",
    sound: "/sounds/multiplier-good.wav",
    img: "/assets/multipliers/multiplier110.png",
  },
  15: {
    label: "block-15",
    sound: "/sounds/multiplier-good.wav",
    img: "/assets/multipliers/multiplier110.png",
  },
  10: {
    label: "block-10",
    sound: "/sounds/multiplier-good.wav",
    img: "/assets/multipliers/multiplier110.png",
  },
  5.6: {
    label: "block-5.6",
    sound: "/sounds/multiplier-good.wav",
    img: "/assets/multipliers/multiplier5_6.png",
  },
  5: {
    label: "block-5",
    sound: "/sounds/multiplier-good.wav",
    img: "/assets/multipliers/multiplier110.png",
  },
  3: {
    label: "block-3",
    sound: "/sounds/multiplier-regular.wav",
    img: "/assets/multipliers/multiplier110.png",
  },
  2.1: {
    label: "block-2.1",
    sound: "/sounds/multiplier-regular.wav",
    img: "/assets/multipliers/multiplier2_1.png",
  },
  2: {
    label: "block-2.0",
    sound: "/sounds/multiplier-regular.wav",
    img: "/assets/multipliers/multiplier2_0.png",
  },
  1.6: {
    label: "block-1.6",
    sound: "/sounds/multiplier-regular.wav",
    img: "/assets/multipliers/multiplier1_6.png",
  },
  1.5: {
    label: "block-1.5",
    sound: "/sounds/multiplier-regular.wav",
    img: "/assets/multipliers/multiplier110.png",
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
  0.7: {
    label: "block-0.7",
    sound: "/sounds/multiplier-low.wav",
    img: "/assets/multipliers/multiplier0_7.png",
  },
  0.5: {
    label: "block-0.5",
    sound: "/sounds/multiplier-low.wav",
    img: "/assets/multipliers/multiplier0_5.png",
  },
  0.3: {
    label: "block-0.3",
    sound: "/sounds/multiplier-low.wav",
    img: "/assets/multipliers/multiplier110.png",
  },
} as const;

type MultipliersType = keyof typeof multipliers;

function getMultiplier(value: MultipliersType) {
  return multipliers[value];
}

const multiplyBlocks16Lines = [
  getMultiplier(110),
  getMultiplier(41),
  getMultiplier(10),
  getMultiplier(5),
  getMultiplier(3),
  getMultiplier(1.5),
  getMultiplier(1),
  getMultiplier(0.5),
  getMultiplier(0.3),
  getMultiplier(0.5),
  getMultiplier(1),
  getMultiplier(1.5),
  getMultiplier(3),
  getMultiplier(5),
  getMultiplier(10),
  getMultiplier(41),
  getMultiplier(110),
];

const multiplyBlocks15Lines = [
  getMultiplier(88),
  getMultiplier(18),
  getMultiplier(10),
  getMultiplier(5),
  getMultiplier(3),
  getMultiplier(1.5),
  getMultiplier(0.5),
  getMultiplier(0.3),
  getMultiplier(0.3),
  getMultiplier(0.5),
  getMultiplier(1.5),
  getMultiplier(3),
  getMultiplier(5),
  getMultiplier(10),
  getMultiplier(18),
  getMultiplier(88),
];
const multiplyBlocks14Lines = [
  getMultiplier(41),
  getMultiplier(15),
  getMultiplier(5),
  getMultiplier(3),
  getMultiplier(1.5),
  getMultiplier(1),
  getMultiplier(0.5),
  getMultiplier(0.3),
  getMultiplier(0.5),
  getMultiplier(1),
  getMultiplier(1.5),
  getMultiplier(3),
  getMultiplier(5),
  getMultiplier(15),
  getMultiplier(41),
];
const multiplyBlocks13Lines = [
  getMultiplier(41),
  getMultiplier(15),
  getMultiplier(5),
  getMultiplier(3),
  getMultiplier(1.5),
  getMultiplier(0.5),
  getMultiplier(0.3),
  getMultiplier(0.3),
  getMultiplier(0.5),
  getMultiplier(1.5),
  getMultiplier(3),
  getMultiplier(5),
  getMultiplier(15),
  getMultiplier(41),
];
const multiplyBlocks12Lines = [
  getMultiplier(33),
  getMultiplier(10),
  getMultiplier(3),
  getMultiplier(2.1),
  getMultiplier(1.5),
  getMultiplier(0.5),
  getMultiplier(0.3),
  getMultiplier(0.5),
  getMultiplier(1.5),
  getMultiplier(2.1),
  getMultiplier(3),
  getMultiplier(10),
  getMultiplier(33),
];
const multiplyBlocks11Lines = [
  getMultiplier(25),
  getMultiplier(5),
  getMultiplier(3),
  getMultiplier(2.1),
  getMultiplier(0.5),
  getMultiplier(0.3),
  getMultiplier(0.3),
  getMultiplier(0.5),
  getMultiplier(2.1),
  getMultiplier(3),
  getMultiplier(5),
  getMultiplier(25),
];
const multiplyBlocks10Lines = [
  getMultiplier(25),
  getMultiplier(5),
  getMultiplier(2.1),
  getMultiplier(1.5),
  getMultiplier(0.5),
  getMultiplier(0.3),
  getMultiplier(0.5),
  getMultiplier(1.5),
  getMultiplier(2.1),
  getMultiplier(5),
  getMultiplier(25),
];
const multiplyBlocks9Lines = [
  getMultiplier(5.6),
  getMultiplier(2),
  getMultiplier(1.6),
  getMultiplier(1),
  getMultiplier(0.7),
  getMultiplier(0.7),
  getMultiplier(1),
  getMultiplier(1.6),
  getMultiplier(2),
  getMultiplier(5.6),
];
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
  9: multiplyBlocks9Lines,
  10: multiplyBlocks10Lines,
  11: multiplyBlocks11Lines,
  12: multiplyBlocks12Lines,
  13: multiplyBlocks13Lines,
  14: multiplyBlocks14Lines,
  15: multiplyBlocks15Lines,
  16: multiplyBlocks16Lines,
};

function getMultiplierByLinesQnt(value: LinesType) {
  return multiplyBlocksByLinesQnt[value];
}

function getMultiplierSound(value: MultiplierValues): string {
  return multiplierSounds[value];
}

const pins = {
  startPins: 3,
  pinSize: 4,
  pinGap: 30,
};

const ball = {
  ballSize: 6.6,
};

const engine = {
  engineGravity: 1.0,
};

const world = {
  width: 700,
  height: 700,
};

const colors = {
  background: "#0C0F16",
  text: "#F2F7FF",
  purple: "#C52BFF",
} as const;

const configPlinko = {
  pins,
  ball,
  engine,
  world,
  colors,
};

export default function Game() {
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
  const {
    pins: pinsConfig,
    colors,
    ball: ballConfig,
    engine: engineConfig,
    world: worldConfig,
  } = configPlinko;

  const worldWidth: number = worldConfig.width;

  const worldHeight: number = worldConfig.height;

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
        worldWidth / lines + l * pinsConfig.pinGap + pinsConfig.pinGap;

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

  const mapResult = {
    8: [
      {
        ballX: 0.16590374243472583,
        multiplierPos: 7,
      },
      {
        ballX: 0.9772313554704222,
        multiplierPos: 4,
      },
      {
        ballX: 0.2505345309774092,
        multiplierPos: 8,
      },
      {
        ballX: 0.046201097545334635,
        multiplierPos: 3,
      },
      {
        ballX: 0.10552013738392407,
        multiplierPos: 6,
      },
      {
        ballX: 0.3510302462209056,
        multiplierPos: 5,
      },
      {
        ballX: 0.6288483517562156,
        multiplierPos: 2,
      },
      {
        ballX: 0.985731122857775,
        multiplierPos: 0,
      },
      {
        ballX: 0.8571553266455665,
        multiplierPos: 1,
      },
    ],
  };

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

      // const pos = Math.random()
      const pos = mapResult[8].find((item) => item.multiplierPos === 0)?.ballX; // fall position
      const ballX = pos! * (maxBallX - minBallX) + minBallX;
      console.log(">>>>>>", pos);
      const ballColor = ballValue <= 0 ? colors.text : colors.purple;
      const ball = Bodies.circle(ballX, 20, ballConfig.ballSize, {
        restitution: 1,
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

  const leftWall = Bodies.rectangle(
    worldWidth / 3 - pinsConfig.pinSize * pinsConfig.pinGap - pinsConfig.pinGap,
    worldWidth / 2 - pinsConfig.pinSize + 50,
    worldWidth * 2,
    10,
    {
      angle: 90,
      render: {
        visible: false,
      },
      isStatic: true,
    },
  );
  const rightWall = Bodies.rectangle(
    worldWidth -
      pinsConfig.pinSize * pinsConfig.pinGap -
      pinsConfig.pinGap -
      pinsConfig.pinGap / 2,
    worldWidth / 2 - pinsConfig.pinSize - 50,
    worldWidth * 2,
    10,
    {
      angle: -90,
      render: {
        visible: false,
      },
      isStatic: true,
    },
  );
  const floor = Bodies.rectangle(0, worldWidth + 10, worldWidth * 10, 40, {
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
    const blockSize = 20; // height and width
    const multiplierBody = Bodies.rectangle(
      lastMultiplierX + 30,
      worldWidth / lines + lines * pinsConfig.pinGap + pinsConfig.pinGap,
      blockSize,
      blockSize,
      {
        label: multiplier.label,
        isStatic: true,
        render: {
          sprite: {
            xScale: 0.5,
            yScale: 0.5,
            texture: multiplier.img,
          },
        },
      },
    );
    lastMultiplierX = multiplierBody.position.x;
    multipliersBodies.push(multiplierBody);
  });

  Composite.add(engine.world, [
    ...pins,
    ...multipliersBodies,
    leftWall,
    rightWall,
    floor,
  ]);

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

  return (
    <div className="grid grid-cols-3 w-full">
      <BetActions
        onChangeLines={setLines}
        onChangeRisk={setRisks}
        onRunBet={bet}
      />
      <MultiplierHistory multiplierHistory={lastMultipliers} />
      <div className="w-full grid place-items-center col-span-2 bg-[#121418]">
        <div id="plinko" className="py-4" />
      </div>
    </div>
  );
}
