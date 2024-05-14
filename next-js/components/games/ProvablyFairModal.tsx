import React, { useEffect, useRef, useState } from 'react';
import { GameType, generateGameResult } from "@/utils/provably-fair";
import Image from "next/image";
import DraggableBar from "@/components/games/Dice2/DraggableBar";
import { riskToChance } from './Wheel/Segments';
import Arc from './Wheel/Arc';
import { useGlobalContext } from '../GlobalContext';
import { translator } from '@/context/transactions';
interface VerificationState {
  clientSeed: string;
  serverSeed: string;
  nonce: string;
  risk?: string;
  segments?: number;
}

interface Props {
  verificationState: VerificationState;
  setVerificationState: React.Dispatch<React.SetStateAction<VerificationState>>;
  selectedGameType: GameType;
}

export default function ProvablyFairModal({
  verificationState,
  setVerificationState,

  selectedGameType 
}: Props) {
  const [strikeNumbers, setStrikeNumbers] = useState<number[]>([]);
  const [strikeNumber, setStrikeNumber] = useState<number>(50.0);
  const [wonDiceFace, setWonDiceFace] = useState<number>(1);
  const [multiplier, setMultiplier] = useState<string>("1.00");
  const [wonCoinFace, setWonCoinface] = useState<"heads" | "tails">("heads");
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>();
  const [rotationAngle, setRotationAngle] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [hoveredMultiplier, setHoveredMultiplier] = useState<number | null>(null);
  const {language} = useGlobalContext()
  useEffect(() => {
    const result = generateGameResult(
      verificationState.serverSeed,
      verificationState.clientSeed,
      parseInt(verificationState.nonce),
      selectedGameType,
    );
    if (Array.isArray(result)) {
      setStrikeNumbers(result);
    } else {
      setStrikeNumbers([result]);
    }
  }, [verificationState, selectedGameType]);

  useEffect(() => {
    if (selectedGameType === GameType.dice) {
      setWonDiceFace(generateGameResult(
        verificationState.serverSeed,
        verificationState.clientSeed,
        parseInt(verificationState.nonce),
        selectedGameType,
      ));
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
    <div className='p-4'>
    <div className="grid grid-cols-8 gap-2 text-white text-xl font-chakra w-full">
      {Array.from({ length: 40 }, (_, index) => index + 1).map((number) => (
        <div key={number} className={`flex items-center justify-center cursor-pointer ${strikeNumbers.includes(number) ? "bg-black border-2 border-fomo-green" : "bg-[#202329]"} rounded-md text-center transition-all duration-300 ease-in-out w-[45px] h-[45px]`}>
          {strikeNumbers.includes(number) ? (
            <div className="flex justify-center items-center bg-[#FFD100] text-black rounded-full w-[32px] h-[32px]">
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

  const renderDice = () => (
    <div className="px-8 pt-10 pb-4">
      <div className="relative w-full mb-8 xl:mb-6">
        <div>
          <Image
            src="/assets/progressBar.png"
            alt="progress bar"
            width={900}
            height={100}
          />
        </div>
        <div className="flex justify-around md:gap-2">
          {Array.from({ length: 6 }, (_, i) => i + 1).map(
            (face) => (
              <div
                key={face}
                className="flex flex-col items-center"
              >
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
            ),
          )}
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    setVerificationState((prevState) => ({
      ...prevState,
      [name]: name === 'segments' ? parseInt(value, 10) : value,
    }));
  };
  const renderRiskAndSegments = () => (
    
    <>
      <div >
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
  

  const renderWheel = () => {
    const multipliers = riskToChance[verificationState.risk || "low"];
    const sortedMultipliers = multipliers.slice().sort((a, b) => a.multiplier - b.multiplier);
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
              <div ref={wheelRef} className="relative w-[200px] h-[200px] rounded-full overflow-hidden">
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
              <div className="absolute z-10 w-[79.75%] h-[79.75%] rounded-full bg-black/10 left-[10%] top-[10%]" />
              <div className="absolute z-20 w-[66.5%] h-[66.5%] rounded-full bg-[#171A1F] left-[16.75%] top-[16.75%]" />
              <div className="absolute z-20 w-[62.5%] h-[62.5%] rounded-full bg-[#0C0F16] left-[18.75%] top-[18.75%] text-white flex items-center justify-center text-2xl font-semibold font-changa text-opacity-80 ">
                {strikeMultiplier}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {uniqueSegments.map((segment, index) => (
              <div
                key={index}
                className="relative w-full"
                onMouseEnter={() =>
                  setHoveredMultiplier(segment.multiplier)
                }
                onMouseLeave={() => setHoveredMultiplier(null)}
              >
                <div
                  className={`w-full border-t-[6px] text-center font-chakra font-semibold bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2.5`}
                  style={{ borderColor: segment.color }}
                >
                  {segment.multiplier}x
                </div>
                {hoveredMultiplier === segment.multiplier && (
                  <div className="absolute top-[-80px] left-0 z-50 flex gap-2 text-white bg-[#202329] border border-white/10 rounded-lg w-full p-2 fadeInUp duration-100 min-w-[200px]">
                    <div className="w-1/2">
                      <div className="flex justify-between text-[10px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                        <span className="">
                          {translator("Profit", language)}
                        </span>
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
      case GameType.wheel:
        return (
          <>
            {renderWheel()}
            {renderRiskAndSegments()}
          </>
        );
      default:
        return <div>Unsupported game type</div>;
    }
  }

  return renderGameVisuals();
}
