import React, { useEffect, useRef, useState } from "react";
import { GameType, generateGameResult } from "@/utils/provably-fair";
import Image from "next/image";
import DraggableBar from "@/components/games/Dice2/DraggableBar";
import { riskToChance } from "./Wheel/Segments";
import Arc from "./Wheel/Arc";
import { useGlobalContext } from "../GlobalContext";
import { translator } from "@/context/transactions";
import { multiplierColorMap } from "./Plinko/constants";

interface VerificationState {
  clientSeed: string;
  serverSeed: string;
  nonce: string;
  risk?: string;
  segments?: number;
  parameter?: number;
}

interface Props {
  verificationState: VerificationState;
  setVerificationState: React.Dispatch<React.SetStateAction<VerificationState>>;
  selectedGameType: GameType;
}

export default function ProvablyFairModal({
  verificationState,
  setVerificationState,
  selectedGameType,
}: Props) {
  const [strikeNumbers, setStrikeNumbers] = useState<number[]>([]);
  const [rouletteNumer, setRouletteNumber] = useState<number | null>(null);
  const [strikeNumber, setStrikeNumber] = useState<number>(0);
  const [wonDiceFace, setWonDiceFace] = useState<number>(1);
  const [multiplier, setMultiplier] = useState<string>("1.00");
  const [wonCoinFace, setWonCoinface] = useState<"heads" | "tails">("heads");
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>();
  const [rotationAngle, setRotationAngle] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [hoveredMultiplier, setHoveredMultiplier] = useState<number | null>(
    null,
  );
  const { language } = useGlobalContext();
  const [color, setColor] = useState("#ffffff");
  type RiskToChance = Record<string, Record<number, Array<number>>>;

  const riskToChancePlinko: RiskToChance = {
    low: {
      8: [6.9, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 6.9],
      9: [8.2, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 8.2],
      10: [14, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 14],
      11: [18.6, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 18.6],
      12: [30.9, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 30.9],
      13: [49.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 49.1],
      14: [89, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 89],
      15: [178.7, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 178.7],
      16: [
        344.1, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9,
        344.1,
      ],
    },
    medium: {
      8: [14.4, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 14.4],
      9: [20.2, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 20.2],
      10: [27.6, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 27.6],
      11: [34, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 34],
      12: [53.7, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 53.7],
      13: [84.2, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 84.2],
      14: [140.4, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 140.4],
      15: [
        252.1, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 252.1,
      ],
      16: [
        441.5, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 441.5,
      ],
    },
    high: {
      8: [30.2, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 30.2],
      9: [45.4, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 45.4],
      10: [80.8, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 80.8],
      11: [128.6, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 128.6],
      12: [188.1, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 188.1],
      13: [297.4, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 297.4],
      14: [
        503.7, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 503.7,
      ],
      15: [
        779.5, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 779.5,
      ],
      16: [
        1335.4, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130,
        1335.4,
      ],
    },
  };
  const rows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ];

  type PredefinedBetType =
    | "1-12"
    | "13-24"
    | "25-36"
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
    "1-12": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "13-24": [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    "25-36": [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    "1-18": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    "19-36": [
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

  useEffect(() => {
    if (selectedGameType === GameType.plinko) {
      const strikeNumber = generateGameResult(
        verificationState.serverSeed,
        verificationState.clientSeed,
        parseInt(verificationState.nonce),
        GameType.plinko,
        verificationState.parameter,
      );

      const rows = verificationState.parameter || 8;
      const risk = verificationState.risk || "low";
      const multipliers = riskToChancePlinko[risk]?.[rows];
      let finalMultiplier = 1;

      if (multipliers) {
        let totalChance = 0;
        for (let i = 1, chance = 1; i <= rows; i++) {
          chance = (chance * (rows - i + 1)) / i;
          totalChance += chance;
          if (strikeNumber <= totalChance) {
            finalMultiplier = multipliers[i - 1];
            break;
          }
        }
      }

      setStrikeMultiplier(finalMultiplier);

      const color = getColorForMultiplier(
        riskToChancePlinko,
        multiplierColorMap,
        risk,
        rows,
        finalMultiplier,
      );
      setColor(color || "#ffffff");
    }
  }, [verificationState, selectedGameType]);

  function getColorForMultiplier(
    riskToChancePlinko: RiskToChance,
    multiplierColorMap: { [key: number]: string[] },
    risk: keyof RiskToChance,
    line: number,
    multiplier: number,
  ): string | undefined {
    const multipliers = riskToChancePlinko[risk]?.[line];
    if (!multipliers) return undefined;

    const multiplierIndex = multipliers.indexOf(multiplier);
    return multiplierIndex !== -1
      ? multiplierColorMap[line]?.[multiplierIndex]
      : undefined;
  }

  useEffect(() => {
    const result = generateGameResult(
      verificationState.serverSeed,
      verificationState.clientSeed,
      parseInt(verificationState.nonce),
      selectedGameType,
      verificationState.parameter,
    );
    if (Array.isArray(result)) {
      setStrikeNumbers(result);
    } else {
      setStrikeNumbers([result]);
    }
  }, [verificationState, selectedGameType]);

  useEffect(() => {
    if (selectedGameType === GameType.dice) {
      setWonDiceFace(
        generateGameResult(
          verificationState.serverSeed,
          verificationState.clientSeed,
          parseInt(verificationState.nonce),
          selectedGameType,
        ),
      );
    }
  }, [verificationState, selectedGameType]);

  useEffect(() => {
    setStrikeNumber(
      generateGameResult(
        verificationState.serverSeed,
        verificationState.clientSeed,
        parseInt(verificationState.nonce),
        GameType.dice2,
      ),
    );
  }, [verificationState, selectedGameType]);

  useEffect(() => {
    if (selectedGameType === GameType.roulette1) {
      setRouletteNumber(
        generateGameResult(
          verificationState.serverSeed,
          verificationState.clientSeed,
          parseInt(verificationState.nonce),
          selectedGameType,
        ),
      );
    }
  }, [verificationState, selectedGameType]);
  useEffect(() => {
    setMultiplier(
      (
        100 /
        generateGameResult(
          verificationState.serverSeed,
          verificationState.clientSeed,
          parseInt(verificationState.nonce),
          GameType.limbo,
        )
      ).toFixed(2),
    );
  }, [verificationState, selectedGameType]);

  useEffect(() => {
    setWonCoinface(
      generateGameResult(
        verificationState.serverSeed,
        verificationState.clientSeed,
        parseInt(verificationState.nonce),
        GameType.coin,
      ) === 1
        ? "heads"
        : "tails",
    );
  }, [verificationState, selectedGameType]);

  useEffect(() => {
    if (selectedGameType === GameType.wheel) {
      const resultAngle = ((strikeNumber - 1) * 360) / 100;
      const rotationAngle = 360 / (verificationState.segments || 10);
      setRotationAngle(rotationAngle);
      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${360 - resultAngle}deg)`;
      }

      const item = riskToChance[verificationState.risk || "low"];
      let strikeMultiplier = 0;

      for (let i = 0, isFound = false; i < 100 && !isFound; ) {
        for (let j = 0; j < item.length; j++) {
          i += (item[j].chance * 10) / (verificationState.segments || 10);
          if (i >= strikeNumber) {
            strikeMultiplier = item[j].multiplier;
            setStrikeMultiplier(strikeMultiplier);
            isFound = true;
            break;
          }
        }
      }
    }
  }, [verificationState, selectedGameType, strikeNumber]);

  const renderKeno = () => (
    <div className="p-4">
      <div className="grid grid-cols-8 gap-2 text-white lg2:text-xl md:text-lg sm:text-base text-sm font-chakra w-full">
        {Array.from({ length: 40 }, (_, index) => index + 1).map((number) => (
          <div
            key={number}
            className={`flex items-center justify-center cursor-pointer ${
              strikeNumbers.includes(number)
                ? "bg-black border-2 border-fomo-green"
                : "bg-[#202329]"
            } rounded-md text-center transition-all duration-300 ease-in-out 
            lg2:w-[45px] lg2:h-[45px] md:w-[42px] md:h-[42px] sm:w-[40px] sm:h-[40px]
             sm2:w-[38px] sm2:h-[38px] w-[30px] h-[30px]`}
          >
            {strikeNumbers.includes(number) ? (
              <div className="flex justify-center items-center bg-[#FFD100] text-black rounded-full lg2:w-[32px] lg2:h-[32px] md:w-[32px] md:h-[32px] sm:w-[28px] sm:h-[28px] w-[25px] h-[25px]">
                {number}
              </div>
            ) : (
              <div>{number}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
  const renderMines = () => {
    return (
      <div className="flex justify-center items-center w-full p-2">
        <div className="grid grid-cols-5 gap-1 sm:gap-2 text-white text-sm md:text-xl font-chakra">
          {Array.from({ length: 25 }, (_, index) => index + 1).map((index) => (
            <button
              key={index}
              className={` bg-[#202329] flex items-center justify-center cursor-pointer rounded-md text-center transition-all duration-300 ease-in-out 
             lg2:w-[45px] lg2:h-[45px] md:w-[42px] md:h-[42px] sm:w-[40px] sm:h-[40px]
             sm2:w-[38px] sm2:h-[38px] w-[30px] h-[30px]`}
            >
              {strikeNumbers[index - 1] === 0 ? (
                <div className="w-full h-full flex items-center justify-center p-1.5 sm:p-3">
                  <Image
                    src="/assets/gem.svg"
                    alt="Gem"
                    layout="responsive"
                    height={100}
                    width={100}
                  />
                </div>
              ) : strikeNumbers[index - 1] === 1 ? (
                <div className="w-full h-full flex items-center justify-center p-1.5 sm:p-3">
                  <Image
                    src="/assets/mine.svg"
                    alt="Mine"
                    layout="responsive"
                    height={100}
                    width={100}
                  />
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  };
  const renderDice = () => (
    <div className="lg2:px-8 md:px-6 px-4 pt-10 pb-4">
      <div className="relative w-full mb-8 xl:mb-6">
        <div>
          <Image
            src="/assets/progressBar.png"
            alt="progress bar"
            width={900}
            height={100}
          />
        </div>
        <div className="flex justify-around gap-2">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((face) => (
            <div key={face} className="flex flex-col items-center">
              {wonDiceFace === face && (
                <Image
                  src="/assets/pointer-green.png"
                  alt="pointer green"
                  width={13}
                  height={13}
                  className="absolute -top-[20px]"
                />
              )}
              <Image
                src="/assets/progressTip.png"
                alt="progress bar"
                width={13}
                height={13}
                className="absolute top-[2px]"
              />
              <Image
                src={
                  wonDiceFace === face
                    ? `/assets/winDiceFace${face}.png`
                    : `/assets/diceFace${face}.png`
                }
                width={50}
                height={50}
                alt=""
                className={`inline-block mt-6 ${
                  wonDiceFace === face ? "selected-face" : ""
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDice2 = () => (
    <div className="px-8 pt-20 pb-8">
      <div className="w-full">
        <DraggableBar
          choice={strikeNumber}
          setChoice={setStrikeNumber}
          strikeNumber={strikeNumber}
          result={false}
          rollType={"over"}
          draggable={false}
        />
      </div>
    </div>
  );

  const renderLimbo = () => (
    <div className="flex justify-center items-center gap-4 md:px-8 py-4 md:text-6xl font-changa">
      {multiplier}x
    </div>
  );

  const renderCoinFlip = () => (
    <div className="flex justify-center items-center gap-4 md:px-4 sm:px-3 px-2 py-4">
      <div
        className={`bg-[#202329] py-4 px-3 rounded-md flex gap-2 items-center justify-center w-full ${
          wonCoinFace === "heads"
            ? "border-2 border-[#7839C5]"
            : "border-[rgb(192,201,210)]"
        }`}
      >
        <div className="w-5 h-5 bg-[#FFC20E] rounded-full"></div>
        <div className="font-changa text-xl font-semibold">Heads</div>
      </div>
      <div
        className={`bg-[#202329] py-4 px-3 rounded-md flex gap-2 items-center justify-center w-full  ${
          wonCoinFace === "tails"
            ? "border-2 border-[#7839C5]"
            : "border-[rgb(192,201,210)]"
        }`}
      >
        <div className="w-5 h-5 bg-[rgb(192,201,210)] border border-white rounded-full"></div>
        <div className="font-changa text-xl font-semibold">Tails</div>
      </div>
    </div>
  );
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setVerificationState((prevState) => ({
      ...prevState,
      [name]: name === "segments" ? parseInt(value, 10) : value,
    }));
  };
  const renderRoulette1 = () => {
    return (
      <div className="font-chakra font-semibold text-base rotate-90 top-0 mb-7 mx-2">
        <div className="flex flex-col w-full text-[12px] items-start gap-1 ">
          <div className="w-full flex items-start gap-1">
            <div
              className={`h-[125px] w-[27.3px] sm:w-[30.6px] sm:h-[207px] flex flex-col justify-center text-center cursor-pointer bg-[#149200] rounded-[5px]
              text-white relative  ${rouletteNumer === 0 ? "border-[#3DD179]" : ""}
              mb-1`}
            >
              <p className="-rotate-90">0</p>
            </div>
            <div className="grid grid-cols-12 grid-rows-3 gap-1">
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
                          className={`h-[40px] w-[27.3px] sm:w-[35px] sm:h-[67px] flex items-center justify-center relative text-center ${
                            predefinedBets.red.includes(number)
                              ? "bg-[#F1323E]  "
                              : "bg-[#2A2E38]  "
                          }${
                            rouletteNumer === number
                              ? "border-[#3DD179] border-2"
                              : ""
                          } text-white rounded-[5px]  `}
                        >
                          <p className="-rotate-90">{number}</p>
                        </button>
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            <div className="flex flex-col justify-between items-center gap-[5px] mt-0">
              {rows.map((_, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="h-[40px] w-[27px] sm:w-[30px] sm:h-[67px] flex items-center justify-center text-center bg-transparent border-2 border-[#26272B] text-white cursor-pointer relative rounded-[5px] "
                >
                  <p className="-rotate-90">2:1</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex w-full flex-col gap-[3px]">
            <div className="flex w-full justify-center gap-1">
              <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-[5px] w-[120px] h-[40px] sm:w-[128px] sm:h-[67px]  ">
                1 to 12
              </button>
              <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-[5px] w-[120px] h-[40px] sm:w-[128px] sm:h-[67px]  ">
                13 to 24
              </button>
              <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-[5px] w-[120px] h-[40px] sm:w-[128px] sm:h-[67px]  ">
                25 to 36
              </button>
            </div>
            <div className="flex w-full justify-center gap-1">
              <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  ">
                1 to 18
              </button>
              <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  ">
                Even
              </button>
              <button className="relative flex items-center justify-center bg-[#F1323E] cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  "></button>
              <button className="relative flex items-center justify-center bg-[#2A2E38] cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  "></button>
              <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  ">
                Odd
              </button>
              <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  ">
                19 to 36
              </button>
            </div>
          </div>
          <div className=" sm:w-12 bg-transparent hidden sm:block" />
        </div>
      </div>
    );
  };

  const renderRiskAndSegments = () => (
    <>
      <div>
        <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
          {translator("Risk", language)}
        </label>
        <div className="flex items-center">
          <select
            name="risk"
            value={verificationState.risk}
            onChange={handleChange}
            className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative appearance-none"
          >
            <option value={"low"}>{translator("Low", language)}</option>
            <option value={"medium"}>{translator("Medium", language)}</option>
            <option value={"high"}>{translator("High", language)}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
          {translator("Segments", language)}
        </label>
        <div className="flex items-center">
          <select
            name="segments"
            value={verificationState.segments}
            onChange={handleChange}
            className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative appearance-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={40}>40</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </>
  );
  const renderMinesCount = () => {
    return (
      <div className="my-4">
        <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
          {translator("Mines", language)}
        </label>
        <select
          name="parameter"
          value={verificationState.parameter}
          onChange={handleChange}
          className="bg-[#202329] text-white font-chakra capitalize text-xs font-medium mt-1 rounded-md p-3 w-full relative no-scrollbar"
        >
          {Array.from({ length: 24 }, (_, index) => (
            <option
              key={index + 1}
              value={index + 1}
              selected={index + 1 === 3}
            >
              {index + 1}
            </option>
          ))}
        </select>
      </div>
    );
  };
  const renderWheel = () => {
    const multipliers = riskToChance[verificationState.risk || "low"];
    const sortedMultipliers = multipliers
      .slice()
      .sort((a, b) => a.multiplier - b.multiplier);
    const uniqueSegments = sortedMultipliers.filter(
      (segment, index, self) =>
        index === 0 || self[index - 1].multiplier !== segment.multiplier,
    );

    return (
      <div className="px-8 py-5 ">
        <div className="flex justify-center items-center w-full flex-wrap">
          <div className="relative  w-[200px] h-[200px] flex justify-center">
            <Image
              src="/assets/wheelPointer.svg"
              alt="Pointer"
              width={25}
              height={25}
              id="pointer"
              className="absolute z-50 -top-2 transition-all duration-100"
            />
            <div
              ref={wheelRef}
              className="relative w-[200px] h-[200px] rounded-full overflow-hidden "
            >
              {typeof window !== "undefined" && (
                <svg viewBox="0 0 300 300">
                  {rotationAngle &&
                    Array.from({
                      length: verificationState.segments || 10,
                    }).map((_, index) => (
                      <Arc
                        key={index}
                        index={index}
                        rotationAngle={rotationAngle}
                        risk={verificationState.risk || "low"}
                        segments={verificationState.segments || 10}
                      />
                    ))}
                </svg>
              )}
            </div>
            <div className="absolute z-10 w-[79.75%] h-[79.75%] rounded-full bg-black/10 left-[10%] top-[10%] " />
            <div className="absolute z-20 w-[66.5%] h-[66.5%] rounded-full bg-[#171A1F] left-[16.75%] top-[16.75%] " />
            <div className="absolute z-20 w-[62.5%] h-[62.5%] rounded-full bg-[#0C0F16] left-[18.75%] top-[18.75%] text-white flex items-center justify-center text-2xl font-semibold font-changa text-opacity-80 ">
              {strikeMultiplier}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap  justify-center ">
          {uniqueSegments.map((segment, index) => (
            <div
              key={index}
              className="relative w-[40px] "
              onMouseEnter={() => setHoveredMultiplier(segment.multiplier)}
              onMouseLeave={() => setHoveredMultiplier(null)}
            >
              <div
                className={`w-full border-t-[6px] text-center font-chakra font-semibold bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2.5 flex justify-center items-center`}
                style={{ borderColor: segment.color }}
              >
                {segment.multiplier}x
              </div>
              {hoveredMultiplier === segment.multiplier && (
                <div className="absolute top-[-80px] left-0 z-50 flex gap-2 text-white bg-[#202329] border border-white/10 rounded-lg w-full p-2 fadeInUp duration-100 min-w-[200px]">
                  <div className="w-1/2">
                    <div className="flex justify-between text-[10px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                      <span className="">{translator("Profit", language)}</span>
                      <span>0.00 SOL</span>
                    </div>
                    <div className="border border-white/10 rounded-lg text-[10px] p-2 mt-2">
                      0.00
                    </div>
                  </div>
                  <div className="w-1/2">
                    <div className="text-[10px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                      {translator("Chance", language)}
                    </div>
                    <div className="border border-white/10 rounded-lg text-[10px] p-2 mt-2">
                      {segment.chance}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  const renderPlinko = () => {
    return (
      <div className="mt-6 pt-7  rounded-md flex flex-col items-center ">
        <div
          className="relative w-1/4 h-10 flex items-center justify-center font-semibold"
          style={{
            background: "#202329",
            borderTop: "0.2rem solid",
            borderColor: color,
            color: color,
            fontSize: "18px",
            borderRadius: "0.32rem",
          }}
        >
          {strikeMultiplier}
        </div>
        <div className="flex gap-4 pt-2 mb-8">
          <div className="w-full">
            <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
              {translator("Risk", language)}
            </label>
            <select
              name="risk"
              value={verificationState.risk}
              onChange={handleChange}
              className="bg-[#202329] text-white capitalize font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative"
            >
              <option value={"low"}>{translator("Low", language)}</option>
              <option value={"medium"}>{translator("Medium", language)}</option>
              <option value={"high"}>{translator("High", language)}</option>
            </select>
          </div>
          <div className="w-full">
            <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
              {translator("Rows", language)}
            </label>
            <select
              name="parameter"
              value={verificationState.parameter}
              onChange={handleChange}
              className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative"
            >
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={11}>11</option>
              <option value={12}>12</option>
              <option value={14}>14</option>
              <option value={15}>15</option>
              <option value={15}>15</option>
              <option value={16}>16</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderGameVisuals = () => {
    switch (selectedGameType) {
      case GameType.keno:
        return renderKeno();
      case GameType.dice:
        return renderDice();
      case GameType.dice2:
        return renderDice2();
      case GameType.limbo:
        return renderLimbo();
      case GameType.coin:
        return renderCoinFlip();
      case GameType.roulette1:
        return renderRoulette1();
      case GameType.wheel:
        return (
          <>
            {renderWheel()}
            {renderRiskAndSegments()}
          </>
        );
      case GameType.mines:
        return (
          <>
            {renderMines()}
            {renderMinesCount()}
          </>
        );
      case GameType.plinko:
        return <>{renderPlinko()}</>;

      default:
        return <div>Unsupported game type</div>;
    }
  };

  return renderGameVisuals();
}
