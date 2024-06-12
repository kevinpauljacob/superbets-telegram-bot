import React, { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import BetSetting from "@/components/BetSetting";
import { GameDisplay, GameLayout, GameOptions } from "@/components/GameLayout";
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
  { id: 4, value: '1K', image: '/assets/token-1k.svg' },
  { id: 5, value: '10K', image: '/assets/token-10k.svg' },
  { id: 6, value: '100K', image: '/assets/token-100k.svg' },
  { id: 7, value: '1M', image: '/assets/token-1M.svg' },
  { id: 8, value: '10M', image: '/assets/token-10M.svg' },
  { id: 9, value: '100M', image: '/assets/token-100M.svg' },
  { id: 10, value: '1B', image: '/assets/token-1B.svg' },
  { id: 11, value: '10B', image: '/assets/token-10B.svg' },
];

const rows = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

const columns =[
  [1,2,3],
  [4,5,6],
  [7,8,9],
  [10,11,12],
  [13,14,15],
  [16,17,18],
  [19,20,21],
  [22,23,24],
  [25,26,27],
  [28,29,30],
  [31,32,33],
  [34,35,36]
]

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
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [isRolling, setIsRolling] = useState(false);
  const [betss, setBetss] = useState<{ areaId: string, token: { image: string } }[]>([]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredSplit, setHoveredSplit] = useState<number[] | null>(null);
  const [hoveredCorner, setHoveredCorner] = useState<number[] | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number[] | null>(null);
  const [refresh, setRefresh] = useState(true);
  console.log(betss);

  const onSubmit = async (data: any) => {
    if (betType === "auto") {
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
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10">
          {betsForArea.slice(0, 3).map((bet, index) => (
            <Image
              key={index}
              width={40}
              height={40}
              src={bet.token.image}
              alt={`token-${index}`}
              className="absolute"
              style={{ bottom: `${index * 3}px` }}
            />
          ))}
        </div>
      );
    }
    return null;
  };

  const renderLeftSplitToken = (number: number, rowIndex: number, colIndex: number) => {
    if (colIndex > 0) {
      const leftNumber = rows[rowIndex][colIndex - 1];
      const areaId = `split-${number}-${leftNumber}`;

      const betsForArea = betss.filter((bet) => bet.areaId === areaId);
      if (betsForArea.length > 0) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 w-12 ">
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={40}
                height={40}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 top-6">
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={40}
                height={40}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute"
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
    if (colIndex < rows[rowIndex].length - 1 && rowIndex > 0) {
      const rightNumber = rows[rowIndex][colIndex - 1];
      const topNumber = rows[rowIndex - 1][colIndex];
      const topRightNumber = rows[rowIndex - 1][colIndex - 1];
      const areaId = `corner-${number}-${rightNumber}-${topNumber}-${topRightNumber}`;

      const betsForArea = betss.filter((bet) => bet.areaId === areaId);
      if (betsForArea.length > 0) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10 w-12 h-full ">
            {betsForArea.slice(0, 3).map((bet, index) => (
              <Image
                key={index}
                width={40}
                height={40}
                src={bet.token.image}
                alt={`token-${index}`}
                className="absolute"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 z-10">
          {betsForArea.slice(0, 3).map((bet, index) => (
            <Image
              key={index}
              width={40}
              height={40}
              src={bet.token.image}
              alt={`token-${index}`}
              className="absolute"
              style={{ bottom: `${index * 3}px` }}
            />
          ))}
        </div>
      );
    }
    return null;
  };

  const disableInput = useMemo(() => {
    return betType === "auto" && startAuto
      ? true
      : false || isRolling || betActive;
  }, [betType, startAuto, isRolling, betActive]);
  const clearBets = () => {
    setBetss([]);
  };

  const undoLastBet = () => {
    setBetss((prev) => prev.slice(0, -1));
  };
  
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
              betSetting={betType}
              setBetSetting={setBetType}
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
                        className={`border rounded cursor-pointer bg-[#1e2024] flex justify-center items-center py-1 px-[-2px] ${selectedChip === chip.value ? 'border-white' : 'border-gray-600'}`
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
                <BetButton
                  disabled={disableInput}
                >
                  {isRolling ? <Loader /> : "BET"}
                </BetButton>
              </form>
            </FormProvider>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
      <div className="p-4 rounded-lg flex flex-col items-center font-chakra font-semibold text-base">
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
          <div className="flex sm:flex-col flex-row-reverse w-[211px]  sm:w-full  sm:text-[16px] text-[12px] itmes-start gap-2 sm:gap-0 rotate-90 sm:rotate-0">
            {/* table ui */}
          <div className="w-full flex items-start sm:gap-1 flex-col sm:flex-row ">
            <div
              className="sm:h-[153px] sm:w-12  h-[27.3px] w-[125px] flex flex-col justify-center text-center cursor-pointer bg-[#149200] rounded-[5px]
               text-white relative border-4 border-transparent  hover:bg-[#55BA78] hover:border-[2px] hover:border-slate-300 mb-1"
              onClick={() => handlePlaceBet('num-0', selectedToken)}
            >
              0
              {renderRegularToken('num-0')}
            </div>
            <div className="grid sm:grid-cols-12 sm:grid-rows-3 grid-cols-3 grid-rows-12 gap-1 w-full  sm:mb-[7px] ">
            {rows.map((row, rowIndex) => (
                    <>
                      {row.map((number, colIndex) => {
                        return (
                          <div key={colIndex} className="relative flex justify-center items-center">
                            <button
                              data-testid={`roulette-tile-${number}`}
                              className={`h-[27px] w-[40px] sm:w-[48px] sm:h-[48px] flex items-center justify-center relative  ${
                                predefinedBets.red.includes(number)
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
                              {number}
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

                            {colIndex > 0 && (
                              <button
                                data-testid={`roulette-tile-${number}-left`}
                                className="absolute w-3 h-full bg-transparent -left-2 px-2 top-0"
                                onClick={() => handlePlaceSplitBet(number, rows[rowIndex][colIndex - 1], selectedToken)}
                                onMouseEnter={() => setHoveredSplit([number, rows[rowIndex][colIndex - 1]])}
                                onMouseLeave={() => setHoveredSplit(null)}
                              >
                                {renderLeftSplitToken(number, rowIndex, colIndex)}
                              </button>
                            )}
                            <button
                              data-testid={`roulette-tile-${number}-corner`}
                              className="absolute w-6 h-6 bg-transparent -left-2 -top-2"
                              onClick={() => 
                                rowIndex > 0 && 
                                handlePlaceCornerBet(
                                  number, 
                                  rows[rowIndex][colIndex - 1], 
                                  rows[rowIndex - 1][colIndex], 
                                  rows[rowIndex - 1][colIndex - 1], 
                                  selectedToken
                                )
                              }
                              onMouseEnter={() => 
                                rowIndex > 0 && 
                                setHoveredCorner([number, rows[rowIndex][colIndex - 1], rows[rowIndex - 1][colIndex], rows[rowIndex - 1][colIndex -1]])
                              }
                              onMouseLeave={() => setHoveredCorner(null)}
                            >
                              {rowIndex > 0 && renderCornerToken(number, rowIndex, colIndex)}
                            </button>
                          </div>
                        );
                      })}
                   </>
                  ))}
            </div>
            <div className="flex flex-row sm:flex-col justify-between gap-[3px] items-center sm:gap-1 mt-1 sm:mt-0">
              {rows.map((_, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="h-[27px] w-[40px] sm:w-[48px] sm:h-[48px]  flex items-center justify-center text-center bg-transparent border-2 border-[#26272B] text-white cursor-pointer relative rounded-[5px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredRow(rowIndex)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => handlePlaceBet(`row-${rowIndex}`, selectedToken)}
                >
                  2:1
                  {renderRegularToken(`row-${rowIndex}`)}
                </div>
              ))}
            </div>
            </div>
            {/* options */}
          <div className="flex w-[430px] sm:w-full justify-between rotate-90 sm:rotate-0">
            <div className="sm:h-[153px] sm:w-12  h-[27.3px] w-[123px] bg-transparent"/>
            <div className="flex flex-col w-full gap-1">
              <div className="flex w-full justify-center gap-1">
              <button
                  className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B]
                    text-white cursor-pointer rounded-[5px] w-[117px] h-[40px] sm:w-[213.19px] sm:h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('1-12')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('1-12', selectedToken)}
                >
                 1 to 12
                  {renderRegularToken('1-12')}
                </button>
                <button
                  className="relative col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B]
                   text-white cursor-pointer rounded-[5px] w-[117px] h-[40px] sm:w-[213.19px] sm:h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('13-24')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('13-24', selectedToken)}
                >
                  13 to 24
                  {renderRegularToken('13-24')}
                </button>
                <button
                  className="relative col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-[5px]  w-[117px] h-[40px] sm:w-[213.19px] sm:h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('25-36')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('25-36', selectedToken)}
                >
              25 to 36
                  {renderRegularToken('25-36')}
                </button>
              

            </div>
              <div className="flex w-full justify-center gap-1">
                <button
                  className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md sm:h-[49.5px] w-[57px] h-[40px] sm:w-[104px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('1-18')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('1-18', selectedToken)}
                >
                  1 to 18
                  {renderRegularToken('1-18')}
                </button>
                <button
                  className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md sm:h-[49.5px] w-[57px] h-[40px] sm:w-[104px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('even')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('even', selectedToken)}
                >
                  Even
                  {renderRegularToken('even')}
                </button>
                <button
                  className="relative  flex items-center justify-center bg-[#F1323E] cursor-pointer rounded-md sm:h-[49.5px] w-[57px] h-[40px] sm:w-[104px] hover:border hover:border-slate-200 hover:bg-[#FF5C67]"
                  onMouseEnter={() => setHoveredButton('red')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('red', selectedToken)}
                >
                  {renderRegularToken('red')}
                </button>
                <button
                  className="relative  flex items-center justify-center bg-[#2A2E38] cursor-pointer rounded-md sm:h-[49.5px] w-[57px] h-[40px] sm:w-[104px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('black')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('black', selectedToken)}
                >
                  {renderRegularToken('black')}
                </button>
                <button
                  className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md sm:h-[49.5px] w-[57px] h-[40px] sm:w-[104px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('odd')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('odd', selectedToken)}
                >
                  Odd
                  {renderRegularToken('odd')}
                </button>
                <button
                  className="relative  flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md sm:h-[49.5px] w-[57px] h-[40px] sm:w-[104px] hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('19-36')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('19-36', selectedToken)}
                >
                  19 to 36
                  {renderRegularToken('19-36')}
                </button>
              </div>

            </div>
              <div className="sm:h-[153px] sm:w-12  h-[27.3px] w-[123px] bg-transparent"/>
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
