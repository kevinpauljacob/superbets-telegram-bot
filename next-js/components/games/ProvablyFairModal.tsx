import React, { useEffect, useState } from 'react';
import { GameType, generateGameResult } from "@/utils/provably-fair";
import Image from "next/image";
import { Keno } from './Keno/VerifyKenoModal';
import DraggableBar from "@/components/games/Dice2/DraggableBar";


interface VerificationState {
  clientSeed: string;
  serverSeed: string;
  nonce: string;
}

interface Props {
 
  verificationState: VerificationState;
  selectedGameType: GameType;
}

export default function ProvablyFairModal({
 
  verificationState,
  selectedGameType 
}: Props) {

  const [strikeNumbers, setStrikeNumbers] = useState<number[]>([]);
  const [strikeNumber, setStrikeNumber] = useState<number>(50.0);
  const [wonDiceFace, setWonDiceFace] = useState<number>(1);
  const [multiplier, setMultiplier] = useState<string>("1.00");
  const [wonCoinFace, setWonCoinface] = useState<"heads" | "tails">("heads");

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
  }, [verificationState,selectedGameType])
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
  }, [verificationState,selectedGameType]);

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
  }, [verificationState,selectedGameType]);


  const renderKeno = () => (
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
const renderCoinFlip = ()=>(
    <div className="flex justify-center items-center gap-4 md:px-4 sm:px-3 px-2 py-4">
    <div
      className={`bg-[#202329] py-4 px-3 rounded-md flex gap-2 items-center justify-center w-full ${
        wonCoinFace === "heads"
          ? "border-2 border-[#7839C5]"
          : "border-[rgb(192,201,210)]"
      }`}
    >
      <div className="w-5 h-5 bg-[#FFC20E] rounded-full"></div>
      <div className="font-changa text-xl font-semibold">
        Heads
      </div>
    </div>
    <div
      className={`bg-[#202329] py-4 px-3 rounded-md flex gap-2 items-center justify-center w-full  ${
        wonCoinFace === "tails"
          ? "border-2 border-[#7839C5]"
          : "border-[rgb(192,201,210)]"
      }`}
    >
      <div className="w-5 h-5 bg-[rgb(192,201,210)] border border-white rounded-full"></div>
      <div className="font-changa text-xl font-semibold">
        Tails
      </div>
    </div>
  </div>
);
const renderGameVisuals = () => {
    switch (selectedGameType) {
      case GameType.keno:
        return renderKeno();
        break;
      case GameType.dice:
        return renderDice();
        break;

      case GameType.dice2:
        return renderDice2();
        break;

      case GameType.limbo:
        return renderLimbo();
        break;

        case GameType.coin:
        return renderCoinFlip();
        break;

     
     
      default:
        return <div>Unsupported game type</div>;
    }
  };

  return renderGameVisuals();
}
