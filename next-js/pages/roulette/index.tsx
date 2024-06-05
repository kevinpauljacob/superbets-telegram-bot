import BetSetting from "@/components/BetSetting";
import { GameDisplay, GameLayout, GameOptions } from "@/components/GameLayout";
import { useGlobalContext } from "@/components/GlobalContext";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import Loader from "@/components/games/Loader";
import { errorCustom } from "@/components/toasts/ToastGroup";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "iconsax-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React, { useMemo, useState,  FC, ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

export default function Roulette(){
const wallet = useWallet();
const methods = useForm();
const {data:session, status} = useSession();

interface BettingArea {
  id: string;
  label: string;
  numbers: number[];
  type: 'single' | 'split' | 'corner' | 'row' | 'column' | 'predefined';
  color?:string;
}
interface Token {
  id: number;
  value: string;
  image: string;
}


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
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [bets, setBets] = useState<{ areaId: string; token: Token }[]>([]);
  const [betActive, setBetActive] = useState(false);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [isRolling, setIsRolling] = useState(false);
  const [betss, setBetss] = useState<{ areaId: string, token: { image: string } }[]>([]);
  const SelectedToken = { image: 'path_to_token_image' };
const tokens:Token[] = [
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
const onSubmit = async (data: any) => {
    if (betType === "auto") {
     
    }
  };

  const handlePlaceBet = (areaId: string, token: { image: string }) => {
    setBetss((prev) => [...prev, { areaId, token }]);
  };

  const renderToken = (areaId: string) => {
    const bet = betss.find((bet) => bet.areaId === areaId);
    if (bet) {
      return (
        <div className="absolute top-0 right-0 bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center">
          <img src={bet.token.image} alt="token" />
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

  return(
    <GameLayout title="Roulette">
    <GameOptions>
       <>
       <div className="relative w-full flex lg:hidden mb-[1.4rem]">
           <BetButton
           disabled={
               !wallet||
               !session?.user||
               isRolling
           } 
          /*  onClickFunction={!betActive ?betType === "auto"? onsubmit : handleBet :handleConclude} */
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
         <div className="w-full felx flex-col nobar">
           <FormProvider {...methods}>
             <form
             className="w-full flex flex-col gap-0 "
             autoComplete="off"
             onSubmit={methods.handleSubmit(onSubmit)}>
      <div className="mb-4">
        <h3 className="text-white/90 font-changa">Chip Value</h3>
        <div className="grid grid-cols-6 gap-2 mt-2">
          {tokens.map((chip:Token) => (
            <div
              key={chip.id}
              className={` border rounded cursor-pointer bg-[#1e2024] flex justify-center items-center py-1  ${
                selectedChip === chip.value ? 'border-white' : 'border-gray-600'
              }`}
            /*   onClick={() => handleTokenClick(chip)} */
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
               disabled={disableInput}/>
            <BetButton
            disabled={disableInput}
            >
              {isRolling ? <Loader/> : "BET"}
              </BetButton>
               
             </form>
           </FormProvider>
         </div>
       </>
    </GameOptions>
    <GameDisplay>
    <div className="p-4 rounded-lg flex flex-col items-center font-chakra font-semibold text-base">
      <div className="flex justify-between w-full px-2 text-white mb-1">
        <div className="flex items-center">
          <Image
          src="/assets/Undo.png"
          width={20}
          height={20}
          alt="undo"/>
          <p className="font-sans text-[16px]">Undo</p>
        </div>
        <div className="flex items-center">
          <Image
          src="/assets/clear.png"
          width={20}
          height={20}
          alt="undo"/>
          <p className="font-sans text-[16px]">Clear</p>
        </div>
      </div>
    <div className="flex items-start w-full align-top">
      <div
        className="h-[160px] w-12 flex flex-col justify-center text-center cursor-pointer bg-[#149200] rounded-lg text-white relative border-4 border-transparent mx-1"
        onClick={() => handlePlaceBet('num-0', SelectedToken)}
      >
        0
        {renderToken('num-0')}
      </div>
      <div className="flex-col">
      <div className="grid grid-cols-14 gap-1 w-full">
        <div className="col-span-13 grid grid-rows-3 gap-1">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-12 gap-1">
              {row.map((number, colIndex) => (
                <div key={colIndex} className="relative">
                  <button
                    data-testid={`roulette-tile-${number}`}
                    className={`w-12 h-12 flex items-center justify-center ${
                      number % 2 === 0 ? 'bg-[#2A2E38]' : 'bg-[#F1323E]'
                    } text-white relative rounded-md border-4 border-transparent`}
                    onClick={() => handlePlaceBet(`num-${number}`, SelectedToken)}
                  >
                    {number}
                    {renderToken(`num-${number}`)}
                  </button>
                  <button
                    data-testid={`roulette-tile-${number}-top`}
                    className="absolute w-full h-1 bg-transparent top-0"
                    onClick={() => handlePlaceBet(`num-${number}-top`, SelectedToken)}
                  />
                  <button
                    data-testid={`roulette-tile-${number}-left`}
                    className="absolute w-1 h-full bg-transparent left-0"
                    onClick={() => handlePlaceBet(`num-${number}-left`, SelectedToken)}
                  />
                  <button
                    data-testid={`roulette-tile-${number}-corner`}
                    className="absolute w-1 h-1 bg-transparent top-0 left-0"
                    onClick={() => handlePlaceBet(`num-${number}-corner`, SelectedToken)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div>
      <div className="mt-1 grid grid-cols-3 gap-2 w-full">
      <button
        className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12"
        onClick={() => handlePlaceBet('1-12', SelectedToken)}
      >
        1 to 12
      </button>
      <button
        className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12"
        onClick={() => handlePlaceBet('13-24', SelectedToken)}
      >
        13 to 24
      </button>
      <button
        className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12"
        onClick={() => handlePlaceBet('25-36', SelectedToken)}
      >
        25 to 36
      </button>
    </div>
    <div className="mt-2 grid grid-cols-6 gap-2 w-full">
      <button
        className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12"
        onClick={() => handlePlaceBet('1-18', SelectedToken)}
      >
        1 to 18
      </button>
      <button
        className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12"
        onClick={() => handlePlaceBet('even', SelectedToken)}
      >
        Even
      </button>
      <button
        className="col-span-1 flex items-center justify-center bg-[#F1323E]  cursor-pointer rounded-md h-12"
        onClick={() => handlePlaceBet('red', SelectedToken)}
     / >
        
    
      <button
        className="col-span-1 flex items-center justify-center bg-[#2A2E38]  cursor-pointer rounded-md h-12"
        onClick={() => handlePlaceBet('black', SelectedToken)}
      />
   
      <button
        className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12"
        onClick={() => handlePlaceBet('odd', SelectedToken)}
      >
        Odd
      </button>
      <button
        className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12"
        onClick={() => handlePlaceBet('19-36', SelectedToken)}
      >
        19 to 36
      </button>
    </div>
    
      </div>
      </div>
      <div className="flex flex-col justify-between align- gap-1 mx-1">
        {rows.map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="w-12 h-12 flex items-center justify-center text-center bg-transparent border-2 border-[#26272B] text-white cursor-pointer relative rounded-md"
            onClick={() => handlePlaceBet(`row-${rowIndex}`, SelectedToken)}
          >
            2:1
            {renderToken(`row-${rowIndex}`)}
          </div>
        ))}
      </div>
    </div>

  
  </div>
    </GameDisplay>
   </GameLayout>
  )
}


