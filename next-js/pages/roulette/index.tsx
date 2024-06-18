import React, { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import BetSetting from "@/components/BetSetting";
import { GameDisplay, GameLayout, GameOptions, GameTable } from "@/components/GameLayout";
import { useGlobalContext } from "@/components/GlobalContext";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import Loader from "@/components/games/Loader";
import { errorCustom } from "@/components/toasts/ToastGroup";
import Bets from "@/components/games/Bets";
import { Refresh } from "iconsax-react";

interface Token {
  id: number;
  value: string;
  image: string;
}

const tokens: Token[] = [
  { id: 1, value: '1', image: '/assets/token-1.svg' },
  { id: 2, value: '10', image: '/assets/token-10.svg' },
  { id: 3, value: '100', image: '/assets/token-100.svg' },
  { id: 4, value: '1000', image: '/assets/token-1k.svg' },
  { id: 5, value: '10000', image: '/assets/token-10k.svg' },
  { id: 6, value: '100000', image: '/assets/token-100k.svg' },
  { id: 7, value: '1000000', image: '/assets/token-1M.svg' },
  { id: 8, value: '10000000', image: '/assets/token-10M.svg' },
  { id: 9, value: '100000000', image: '/assets/token-100M.svg' },
  { id: 10, value: '1000000000', image: '/assets/token-1B.svg' },
  { id: 11, value: '10000000000', image: '/assets/token-10B.svg' },
];

const rows = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];



type PredefinedBetType = "1-12" | "13-24" | "25-36" | "1-18" | "19-36" | "even" | "odd" | "red" | "black";

const predefinedBets: Record<PredefinedBetType, number[]> = {
  "1-12": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  "13-24": [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  "25-36": [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  "1-18": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  "19-36": [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  "even": [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
  "odd": [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
  "red": [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 28, 30, 32, 34, 36],
  "black": [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 29, 31, 33, 35],
};

export default function Roulette() {
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
    kenoRisk,
    setKenoRisk,
    houseEdge,
    maxBetAmt,
    language,
  } = useGlobalContext();

  const [betAmt, setBetAmt] = useState<number | undefined>();
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(0);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>('0');
  const [selectedToken, setSelectedToken] = useState<Token | null>(tokens[0]);
  const [bets, setBets] = useState<{ areaId: string; token: Token }[]>([]);
  const [betActive, setBetActive] = useState(false);
  const [betSetting, setBetSetting] = useState<"manual" | "auto">("manual");
  const [isRolling, setIsRolling] = useState(false);
  const [betss, setBetss] = useState<Bet[]>([]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredSplit, setHoveredSplit] = useState<number[] | null>(null);
  const [hoveredCorner, setHoveredCorner] = useState<number[] | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number[] | null>(null);
  const [refresh, setRefresh] = useState(true);
  console.log(betss);

  const onSubmit = async (data: any) => {
    if (betSetting === "auto") {
      // Auto bet logic
    }
  };

  const handlePlaceBet = (areaId: string, token: Token | null) => {
    if (token) {
      setBetss((prev) => {
        const betsForArea = prev.filter((bet) => bet.areaId === areaId);
        if (betsForArea.length < 3) {
          return [...prev, { areaId, token }];
        } else {
          return prev;
        }
      });
    } else {
      errorCustom("Please select a token before placing a bet.");
    }
  };

  const handlePlaceSplitBet = (number1: number, number2: number, token: Token | null) => {
    console.log(number1, number2);
    if (token) {
      const areaId = `split-${number1}-${number2}`;
      handlePlaceBet(areaId, token);
    }
  };

  const handlePlaceCornerBet = (number1: number, number2: number, number3: number, number4: number, token: Token | null) => {
    if (token) {
      const areaId = `corner-${number1}-${number2}-${number3}-${number4}`;
      handlePlaceBet(areaId, token);
    }
  };

  const handlePlaceColumnBet = (colIndex: number, token: Token | null) => {
    if (token) {
      const columnNumbers = rows.map(row => row[colIndex]);
      const areaId = `column-${columnNumbers.join('-')}`;
      handlePlaceBet(areaId, token);
    } else {
      errorCustom("Please select a token before placing a bet.");
    }
  };

  const renderRegularToken = (areaId: string) => {
    const betsForArea = betss.filter((bet) => bet.areaId === areaId);
    if (betsForArea.length > 0) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 w-7 sm:w-12 -rotate-90 sm:rotate-0 -left-1">
          {betsForArea.slice(0, 3).map((bet, index) => (
            <Image
              key={index}
              width={40}
              height={40}
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

  const renderLeftSplitToken = (number: number, rowIndex: number, colIndex: number) => {
    if (number === 1 || number === 2 || number === 3) {
      const areaId = `split-${number}-0`;
      const betsForArea = betss.filter((bet) => bet.areaId === areaId);
  
      if (betsForArea.length > 0) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10
           w-7 sm:w-12 -rotate-90 sm:rotate-0 bottom-8 sm:bottom-0">
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={40}
                height={40}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute drop-shadow-3xl"
                style={{ left: '-16px', bottom: `${index * 3}px` }}
              />
            ))}
          </div>
        );
      }
    } else if (colIndex > 0) {
      const leftNumber = rows[rowIndex][colIndex - 1];
      const areaId = `split-${number}-${leftNumber}`;
      const betsForArea = betss.filter((bet) => bet.areaId === areaId);
  
      if (betsForArea.length > 0) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 
          w-7 sm:w-12 -rotate-90 sm:rotate-0 bottom-8 sm:bottom-1">
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={40}
                height={40}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute drop-shadow-3xl"
                style={{ left: '-16px', bottom: `${index * 3}px` }}
              />
            ))}
          </div>
        );
      }
    }
    return null;
  };
  
  
  const renderTopSplitToken = (number: number, rowIndex: number, colIndex: number) => {
    if (rowIndex > 0) {
      const topNumber = rows[rowIndex - 1][colIndex];
      const areaId = `split-${number}-${topNumber}`;

      const betsForArea = betss.filter((bet) => bet.areaId === areaId);
      if (betsForArea.length > 0) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 w-7 sm:w-12 sm:top-6 sm:rotate-0 -rotate-90 left-2 top-2   sm:left-0">
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={40}
                height={40}
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

  const renderCornerToken = (number: number, rowIndex: number, colIndex: number) => {
    if (rowIndex > 0 && rows[rowIndex] && rows[rowIndex - 1] && colIndex < rows[rowIndex].length - 1) {
      const rightNumber = rows[rowIndex][colIndex - 1];
      const topNumber = rows[rowIndex - 1][colIndex];
      const topRightNumber = rows[rowIndex - 1][colIndex - 1];
      const areaId = `corner-${number}-${rightNumber}-${topNumber}-${topRightNumber}`;
  
      const betsForArea = betss.filter((bet) => bet.areaId === areaId);
  
      if (betsForArea.length > 0) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 
          sm:w-12 w-7 h-full sm:rotate-0 -rotate-90 -left-2 -top-3 sm:-top-1 sm:-left-1">
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={40}
                height={40}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute drop-shadow-3xl"
                style={{ left: '20%', transform: 'translateX(-50%)', bottom: `${index * 3}px` }}
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
    token: Token | null
  ) => {
    if (token) {
      const areaId = `corner-${number}-${adjacentNumbers.join('-')}`;
      handlePlaceBet(areaId, token);
    }
  };
  
 
  const renderCornerTokenWithThreeNumbers = (number: number, rowIndex: number, colIndex: number) => {
    if (rowIndex > 0) {
      const topNumber = rows[rowIndex - 1][colIndex];
      const areaId = `corner-${number}-0-${topNumber}`;
      const betsForArea = betss.filter((bet) => bet.areaId === areaId);
  
      if (betsForArea.length > 0) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 
          sm:w-12 w-7 h-full sm:rotate-0 -rotate-90 -left-2 -top-3 sm:top-0 sm:left-0">
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={40}
                height={40}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute drop-shadow-3xl"
                style={{ left: '20%', transform: 'translateX(-50%)', bottom: `${index * 3}px` }}
              />
            ))}
          </div>
        );
      }
    }
    return null;
  };
  
  const renderTopColumnToken = (colIndex: number) => {
    const columnNumbers = rows.map(row => row[colIndex]);
    const areaId = `column-${columnNumbers.join('-')}`;
    const betsForArea = betss.filter((bet) => bet.areaId === areaId);
    if (betsForArea.length > 0) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 w-7 
        sm:w-12 z-10 sm:-bottom-2 -bottom-1 -rotate-90 sm:rotate-0 left-1 sm:left-0">
          {betsForArea.slice(0, 3).map((bet, index) => (
            <Image
              key={index}
              width={40}
              height={40}
              src={bet.token.image}
              alt={`token-${index}`}
              className="absolute drop-shadow-3xl"
              style={{ bottom: `${index * 3}px`,  }}
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
    setBetss([]);
  };

  const undoLastBet = () => {
    setBetss((prev) => prev.slice(0, -1));
  };
  type Bet = {
    areaId: string;
    token: Token;
  };
  const handleBet= ()=>{
    const transformedBets = transformBetsToSingleNumbers(betss);
    console.log(transformedBets);
  }
 
  
  const transformBetsToSingleNumbers = (bets: Bet[]): Record<string, Record<string, number>> => {
    const singleNumberBets: Record<string, number> = {};
  
    const addToSingleNumberBet = (number: string, value: number) => {
      if (singleNumberBets[number]) {
        singleNumberBets[number] += value;
      } else {
        singleNumberBets[number] = value;
      }
    };
  
    bets.forEach(bet => {
      const tokenValue = parseInt(bet.token.value);
  
      if (bet.areaId.startsWith('split-')) {
        const [, num1, num2] = bet.areaId.split('-');
        const halfValue = tokenValue / 2;
        addToSingleNumberBet(num1, halfValue);
        addToSingleNumberBet(num2, halfValue);
      } else if (bet.areaId.startsWith('corner-')) {
        const nums = bet.areaId.split('-').slice(1);
        const numValues = nums.length === 4 ? tokenValue / 4 : tokenValue / 3; // Adjust for 3 or 4 numbers
        nums.forEach(num => addToSingleNumberBet(num, numValues));
      } else if (bet.areaId.startsWith('column-')) {
        const nums = bet.areaId.split('-').slice(1);
        const columnValue = tokenValue / nums.length;
        nums.forEach(num => addToSingleNumberBet(num, columnValue));
      } else if (bet.areaId.startsWith('num-')) {
        const [, num] = bet.areaId.split('-');
        addToSingleNumberBet(num, tokenValue);
      }
    });
  
    return {
      straight: Object.keys(singleNumberBets).reduce((acc, number) => {
        acc[number] = singleNumberBets[number];
        return acc;
      }, {} as Record<string, number>)
    };
  };
  

  
  const transformedBets = transformBetsToSingleNumbers(bets);
  console.log(transformedBets);
  
  return (
    <GameLayout title="Roulette">
      <GameOptions>
        <>
          <div className="relative w-full flex lg:hidden mb-[1.4rem]">
            <BetButton
              disabled={!wallet || !session?.user || isRolling}
            >
              {isRolling ? <Loader /> : betActive ? "CASHOUT" : "BET"}
            </BetButton>
          </div>
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
                        className={`border rounded cursor-pointer bg-[#1e2024] flex justify-center items-center py-1 px-[-2px] ${selectedToken === chip ? 'border-white' : 'border-gray-600'}`
                        }
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
                  currentMultiplier={36}
                  leastMultiplier={1.1}
                  game="roulette"
                  disabled={disableInput}
                />
                <button
                  className="hover:duration-75 hover:opacity-90 w-full h-[3.75rem] rounded-lg transition-all bg-[#7839C5] disabled:bg-[#4b2876] hover:bg-[#9361d1] focus:bg-[#602E9E] flex items-center justify-center font-chakra font-semibold text-xl tracking-wider text-white"
                  onClick={handleBet}
                  >
                  
                  {isRolling ? <Loader /> : "BET"}
                </button>
              </form>
            </FormProvider>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
      <div className="sm:p-4 rounded-lg flex flex-col items-center font-chakra font-semibold text-base">
        <div className="flex justify-between w-full  text-white mb-1">
          <div className="hidden sm:flex items-center cursor-pointer hover:opacity-90"
            onClick={undoLastBet}>
              <Image
                src="/assets/Undo.png"
                width={20}
                height={20}
                alt="undo"
              />
              <p className="font-sans text-[16px]">Undo</p>
            </div>
            <div className="hidden sm:flex items-center cursor-pointer hover:opacity-90"
            onClick={clearBets}>
              <Image
                src="/assets/clear.png"
                width={20}
                height={20}
                alt="clear"
              />
              <p className="font-sans text-[16px]">Clear</p>
            </div>
        </div>
          <div className="flex flex-col    h-[415px] w-full  text-[12px] sm:text-[16px]  itmes-start  gap-1 sm:gap-0 rotate-90 sm:rotate-0">
            {/* table ui flex-row-reverse w-[211px]  text-[12px] rotate-90 gap-2*/} 
          <div className="w-full flex items-start gap-1   ">
            {/* flex-col */}
            <div
              className={` h-[125px] w-[27.3px]  sm:h-[153px] sm:w-12    flex flex-col justify-center text-center cursor-pointer bg-[#149200] rounded-[5px]
               text-white relative border-4 border-transparent  hover:bg-[#55BA78]
                hover:border-[2px] hover:border-slate-300 mb-1 ${hoveredCorner && hoveredCorner.includes(0) ? 'overlay border-[2px] border-white'
                : ''}
                ${hoveredSplit && hoveredSplit.includes(0) ? 'overlay border-[2px] border-white'
                : ''}`}
              onClick={() => handlePlaceBet('num-0', selectedToken)}
            >
              {/* h-[27.3px] w-[125px] */}
              <p className="-rotate-90 sm:rotate-0">0</p>
              {renderRegularToken('num-0')}
            </div>
            <div className="grid grid-cols-12 grid-rows-3 gap-[4px] sm:gap-1 sm:w-full sm:mb-[7px] ">
            {/* grid-cols-3 grid-rows-12 */}
            {rows.map((row, rowIndex) => (
                    <>
                      {row.map((number, colIndex) => {
                        return (
                          <div key={colIndex} className="relative flex justify-center items-center">
                            <button
                              data-testid={`roulette-tile-${number}`}
                              className={` h-[40px] w-[27px] sm:w-[48px] sm:h-[48px] flex items-center justify-center  relative text-center  ${
                                predefinedBets.red.includes(number)  /* h-[27px] w-[40px] */
                                  ? 'bg-[#F1323E] hover:border hover:border-slate-200 hover:bg-[#FF5C67]'
                                  : 'bg-[#2A2E38] hover:border hover:border-slate-200 hover:bg-[#4D5361]'
                              } text-white rounded-[5px] border-4 border-transparent ${
                                hoveredButton && predefinedBets[hoveredButton as PredefinedBetType]?.includes(number)
                                  ? 'overlay border-[2px] border-white '
                                  : ''
                              } ${
                                hoveredRow !== null && rows[hoveredRow]?.includes(number)
                                  ? 'overlay border-[2px] border-white'
                                  : ''
                              } ${
                                hoveredSplit && hoveredSplit.includes(number)
                                  ? 'overlay border-[2px] border-white'
                                  : ''
                              } ${
                                hoveredCorner && hoveredCorner.includes(number)
                                  ? 'overlay border-[2px] border-white'
                                  : ''
                              } ${
                                hoveredColumn && hoveredColumn.includes(number)
                                  ? 'overlay border-[2px] border-white'
                                  : ''
                              }`}
                              onClick={() => selectedToken && handlePlaceBet(`num-${number}`, selectedToken)}
                            >
                              <p className="-rotate-90 sm:rotate-0 ">{number}</p>
                              
                              {renderRegularToken(`num-${number}`)}
                            </button>

                            {rowIndex === 0 ? (
                              <button
                                data-testid={`roulette-tile-${number}-top`}
                                className="absolute w-full h-3 bg-transparent -top-2"
                                onClick={() => colIndex < rows[0].length && handlePlaceColumnBet(colIndex, selectedToken)}
                                onMouseEnter={() => setHoveredColumn(rows.map(row => row[colIndex]))}
                                onMouseLeave={() => setHoveredColumn(null)}
                              >
                                {renderTopColumnToken(colIndex)}
                              </button>
                            ) : (
                              <button
                                data-testid={`roulette-tile-${number}-top`}
                                className="absolute w-full h-3 bg-transparent -top-2"
                                onClick={() => rowIndex > 0 && handlePlaceSplitBet(number, rows[rowIndex - 1][colIndex], selectedToken)}
                                onMouseEnter={() => rowIndex > 0 && setHoveredSplit([number, rows[rowIndex - 1][colIndex]])}
                                onMouseLeave={() => setHoveredSplit(null)}
                              >
                                {rowIndex > 0 && renderTopSplitToken(number, rowIndex, colIndex)}
                                
                              </button>
                            )}

                            { (
                             <button
                             data-testid={`roulette-tile-${number}-left`}
                             className="absolute w-[12px] px-[6px] py-[1px] h-[42px] sm:w-3 sm:h-full bg-transparent -left-[7px] sm:-left-2 sm:px-2 top-0"
                             onClick={() => {
                               if (number === 1 || number === 2 || number === 3) {
                                 handlePlaceSplitBet(number, 0, selectedToken);
                               } else {
                                 handlePlaceSplitBet(number, rows[rowIndex][colIndex - 1], selectedToken);
                               }
                             }}
                             onMouseEnter={() => {
                               if (number === 1 || number === 2 || number === 3) {
                                 setHoveredSplit([number, 0]);
                               } else {
                                 setHoveredSplit([number, rows[rowIndex][colIndex - 1]]);
                               }
                             }}
                             onMouseLeave={() => setHoveredSplit(null)}
                           >
                             {renderLeftSplitToken(number, rowIndex, colIndex)}
                           </button>
                           
                            )}
<button
  data-testid={`roulette-tile-${number}-corner`}
  className="absolute w-[15px] h-[24px] sm:w-6 sm:h-6 bg-transparent -left-2 -top-2"
  onClick={() => {
    if (rowIndex > 0) {
      if (number === 2) {
        handlePlaceCornerBetWithThreeNumbers(number, [0, rows[rowIndex - 1][colIndex]], selectedToken);
      } else if (number === 1) {
        handlePlaceCornerBetWithThreeNumbers(number, [0, rows[rowIndex - 1][colIndex]], selectedToken);
      } else {
        handlePlaceCornerBet(number, rows[rowIndex][colIndex - 1], rows[rowIndex - 1][colIndex], rows[rowIndex - 1][colIndex - 1], selectedToken);
      }
    }
  }}
  onMouseEnter={() => {
    if (rowIndex > 0) {
      if (number === 2) {
        setHoveredCorner([number, 0, rows[rowIndex - 1][colIndex]]);
      } else if (number === 1) {
        setHoveredCorner([number,0, rows[rowIndex - 1][colIndex]]);
      } else {
        setHoveredCorner([number, rows[rowIndex][colIndex - 1], rows[rowIndex - 1][colIndex], rows[rowIndex - 1][colIndex - 1]]);
      }
    }
  }}
  onMouseLeave={() => setHoveredCorner(null)}
>
  {rowIndex > 0 && renderCornerToken(number, rowIndex, colIndex)}
  {renderCornerTokenWithThreeNumbers(number,rowIndex,colIndex)}
</button>




                          </div>
                        );
                      })}
                   </>
                  ))}
            </div>
            <div className="flex flex-col justify-between  items-center gap-[5px] sm:gap-1  mt-0 ">
              {/* flex-row  gap-[3px] mt-1*/}
              {rows.map((_, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="h-[40px] w-[27px] sm:w-[48px] sm:h-[48px]  flex items-center justify-center text-center bg-transparent border-2
                   border-[#26272B] text-white cursor-pointer relative rounded-[5px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredRow(rowIndex)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => handlePlaceBet(`row-${rowIndex}`, selectedToken)}
                >
                  {/* h-[27px] w-[40px] */}
                  <p className="-rotate-90 sm:rotate-0">2:1</p>
                  {renderRegularToken(`row-${rowIndex}`)}
                </div>
              ))}
            </div>
            </div>
            {/* options */}
          <div className="flex  w-[430px] sm:w-full justify-between">
            {/* w-[430px] rotate-90*/}
            <div className="h-[27px] w-[27.3px] sm:h-[153px] sm:w-12   bg-transparent"/>
            {/*h-[27.3px] w-[123px]  */}
            <div className="flex flex-col w-full gap-1">
              <div className="flex w-full justify-center gap-1">
              <button
                  className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B]
                    text-white cursor-pointer rounded-[5px] w-[120px] h-[40px] sm:w-[213.19px] sm:h-12 hover:border
                     hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('1-12')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('1-12', selectedToken)}
                >
                  {/* w-[117px] h-[40px] */}
                 1 to 12
                  {renderRegularToken('1-12')}
                </button>
                <button
                  className="relative col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B]
                   text-white cursor-pointer rounded-[5px]  w-[120px] h-[40px] sm:w-[213.19px] sm:h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('13-24')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('13-24', selectedToken)}
                >
                  {/* w-[117px] h-[40px] */}
                  13 to 24
                  {renderRegularToken('13-24')}
                </button>
                <button
                  className="relative col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B]
                   text-white cursor-pointer rounded-[5px]   w-[120px] h-[40px] sm:w-[213.19px] sm:h-12 hover:border hover:border-slate-200
                    hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('25-36')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('25-36', selectedToken)}
                >
                  {/*  w-[117px] h-[40px]*/}
              25 to 36
                  {renderRegularToken('25-36')}
                </button>
              

            </div>
              <div className="flex w-full justify-center gap-1">
                <button
                  className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md
                   sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('1-18')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('1-18', selectedToken)}
                >
                  {/* w-[57px] h-[40px] */}
                  1 to 18
                  {renderRegularToken('1-18')}
                </button>
                <button
                  className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md 
                  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('even')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('even', selectedToken)}
                >
                  {/*  w-[57px] h-[40px]*/}
                  Even
                  {renderRegularToken('even')}
                </button>
                <button
                  className="relative  flex items-center justify-center bg-[#F1323E] cursor-pointer rounded-md  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border
                   hover:border-slate-200 hover:bg-[#FF5C67]"
                  onMouseEnter={() => setHoveredButton('red')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('red', selectedToken)}
                >
                  {/*w-[57px] h-[40px]  */}
                  {renderRegularToken('red')}
                </button>
                <button
                  className="relative  flex items-center justify-center bg-[#2A2E38] cursor-pointer rounded-md  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('black')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('black', selectedToken)}
                >
                   {/* w-[57px] h-[40px] */}
                  {renderRegularToken('black')}
                </button>
                <button
                  className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer
                   rounded-md  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('odd')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('odd', selectedToken)}
                > 
                  {/*  w-[57px] h-[40px]*/}
                  Odd
                  {renderRegularToken('odd')}
                </button>
                <button
                  className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md 
                  sm:h-[49.5px]  sm:w-[104px] w-[57px] h-[40px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('19-36')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('19-36', selectedToken)}
                >
                  {/* w-[57px] h-[40px] */}
                  19 to 36
                  {renderRegularToken('19-36')}
                </button>
              </div>

            </div>
              <div className="sm:h-[153px] sm:w-12  bg-transparent hidden sm:block"/>
              <div className="flex flex-col   w-[27.3px] h-[123px] text-white  sm:hidden gap-1">
          <div className="flex items-center justify-center cursor-pointer hover:opacity-90  w-[27px] h-[40px] rounded-md bg-[#2A2E38]"
            onClick={undoLastBet}>
              <Image
                src="/assets/Undo.png"
                width={20}
                height={20}
                alt="undo"
              />
              
            </div>
            <div className="flex items-center justify-center cursor-pointer hover:opacity-90 w-[27px] h-[40px]  rounded-md bg-[#2A2E38]"
            onClick={clearBets}>
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
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh}/>
      </GameTable>
    </GameLayout>
  );
}
