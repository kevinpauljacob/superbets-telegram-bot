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
const numbersBatch1 = [
  { id: '1', label: '1', color: 'bg-red-600' },
  { id: '2', label: '2', color: 'bg-gray-800' },
  { id: '3', label: '3', color: 'bg-red-600' },
  { id: '6', label: '6', color: 'bg-gray-800' },
  { id: '5', label: '5', color: 'bg-red-600' },
  { id: '4', label: '4', color: 'bg-gray-800' },
  { id: '7', label: '7', color: 'bg-red-600' },
  { id: '8', label: '8', color: 'bg-gray-800' },
  { id: '9', label: '9', color: 'bg-red-600' },
  { id: '12', label: '12', color: 'bg-red-600' },
  { id: '11', label: '11', color: 'bg-black' },
  { id: '10', label: '10', color: 'bg-gray-800' },
];
const numbersBatch2 = [
  { id: '13', label: '13', color: 'bg-black' },
  { id: '14', label: '14', color: 'bg-red-600' },
  { id: '15', label: '15', color: 'bg-black' },
  { id: '16', label: '16', color: 'bg-red-600' },
  { id: '17', label: '17', color: 'bg-black' },
  { id: '18', label: '18', color: 'bg-red-600' },
  { id: '19', label: '19', color: 'bg-red-600' },
  { id: '20', label: '20', color: 'bg-black' },
  { id: '21', label: '21', color: 'bg-red-600' },
  { id: '22', label: '22', color: 'bg-black' },
  { id: '23', label: '23', color: 'bg-red-600' },
  { id: '24', label: '24', color: 'bg-black' },
];

const numbersBatch3 = [
  { id: '25', label: '25', color: 'bg-red-600' },
  { id: '26', label: '26', color: 'bg-black' },
  { id: '27', label: '27', color: 'bg-red-600' },
  { id: '28', label: '28', color: 'bg-black' },
  { id: '29', label: '29', color: 'bg-black' },
  { id: '30', label: '30', color: 'bg-red-600' },
  { id: '31', label: '31', color: 'bg-black' },
  { id: '32', label: '32', color: 'bg-red-600' },
  { id: '33', label: '33', color: 'bg-black' },
  { id: '34', label: '34', color: 'bg-red-600' },
  { id: '35', label: '35', color: 'bg-black' },
  { id: '36', label: '36', color: 'bg-red-600' },
];
const columns = [
  { id: 'col1', label: '2:1', color: 'bg-purple-600' },
  { id: 'col2', label: '2:1', color: 'bg-purple-600' },
  { id: 'col3', label: '2:1', color: 'bg-purple-600' },
];
const handleTokenClick = (token: Token) => {
  setSelectedToken(token);
};

const handleAreaClick = (areaId: string) => {
  if (selectedToken) {
    setBets([...bets, { areaId, token: selectedToken }]);
  }
};

const onSubmit = async (data: any) => {
    if (betType === "auto") {
     
    }
  };
const handleBet = async () => {
/*     try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }
      if (!betAmt || betAmt === 0) {
        throw new Error("Set Amount.");
      }
      if (coinData && coinData[0].amount < betAmt) {
        throw new Error("Insufficient balance for bet !");
      }

      setIsRolling(true);
      setUserBets(defaultUserBets);
      setCashoutModal({
        show: false,
        amountWon: 0,
        strikeMultiplier: 0,
        pointsGained: 0,
      });
      const response = await fetch(`/api/games/mines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          amount: betAmt,
          tokenMint: "SOL",
          minesCount: minesCount,
        }),
      });

      const { success, message, gameId } = await response.json();

      if (success != true) {
        if (gameId) {
          setGameId(gameId);
          setBetActive(true);
          setRefresh(true);
        }
        throw new Error(message);
      }

      if (success) {
        setGameId(gameId);
        setBetActive(true);
        setRefresh(true);
        successCustom(message);
      }
    } catch (error: any) {
      errorCustom(error?.message ?? "Could not make the Bet.");
      setIsRolling(false);
      setAutoBetCount(0);
      setStartAuto(false);
      console.error("Error occurred while betting:", error);
    } finally {
      setIsRolling(false);
    } */
  };
  const handleConclude = async () => {
/*     try {
      const response = await fetch(`/api/games/mines/conclude`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          gameId: gameId,
        }),
      });

      const {
        success,
        message,
        result,
        amountWon,
        strikeMultiplier,
        strikeNumbers,
        pointsGained,
      } = await response.json();

      if (success != true) {
        errorCustom(message);
        throw new Error(message);
      }

      const win = result === "Won";
      if (win) {
        successCustom(message);
        soundAlert("/sounds/win.wav");
      } else errorCustom(message);

      if (success) {
        const updatedUserBetsWithResult = userBets.map((bet, index) => ({
          ...bet,
          result: strikeNumbers[index] === 1 ? "Lost" : "Pending",
        }));
        setCashoutModal({
          show: true,
          amountWon: amountWon,
          strikeMultiplier: strikeMultiplier,
          pointsGained: pointsGained,
        });
        setUserBets(updatedUserBetsWithResult);
        setRefresh(true);
        setBetActive(false);
        setNumBets(0);
        setCurrentMultiplier(0);
        setNextMultiplier(0);
        setStrikeMultiplier(1);
        setCurrentProfit(0);
        setNextProfit(0);
        setAmountWon(0);
      }
    } catch (error) {
      console.error("Error occurred while betting:", error);
    } finally {
      setBetActive(false);
    } */
  };
  const handleChipClick = (value: string) => {
    setSelectedChip(value);
  };

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetAmount(e.target.value);
  };
const disableInput = useMemo(() => {
    return betType === "auto" && startAuto
      ? true
      : false || isRolling || betActive;
  }, [betType, startAuto, isRolling, betActive]);
const renderNumberCell = (id:string,label:string,color:string)=>{
  const placedBets = bets.filter((bet)=> bet.areaId === id);
  return (
    <div
    key={id}
    className={`number-cell ${color} flex flex-col items-center justify-center border border-white`}
    onClick={()=>handleAreaClick(id)}>
  {label}
  <div className="stacked-tokens flex flex-col-reverse">
          {placedBets.map((bet, index) => (
            <img key={index} src={bet.token.image} alt={bet.token.value.toString()} className="w-6 h-6" />
          ))}
        </div>
    </div>
  )
}
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
              onClick={() => handleTokenClick(chip)}
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
    <div className="roulette-table flex flex-col items-center gap-4">
     
    <div className="grid grid-cols-5 gap-2">
        <div className="flex flex-col justify-between">
          {renderNumberCell('0', '0', 'bg-green-600')}
        </div>
        <div className="grid grid-cols-3 grid-rows-4 gap-2">
          {numbersBatch1.map((number) => renderNumberCell(number.id, number.label, number.color))}
        </div>
        <div className="grid grid-cols-3 grid-rows-4 gap-2">
          {numbersBatch2.map((number) => renderNumberCell(number.id, number.label, number.color))}
        </div>
        <div className="grid grid-cols-3 grid-rows-4 gap-2">
          {numbersBatch3.map((number) => renderNumberCell(number.id, number.label, number.color))}
        </div>
        <div className="flex flex-col justify-between">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`column ${column.color} flex items-center justify-center border border-white text-white text-lg font-bold cursor-pointer`}
              onClick={() => handleAreaClick(column.id)}
            >
              {column.label}
              <div className="stacked-tokens flex flex-col-reverse">
                {bets.filter((bet) => bet.areaId === column.id).map((bet, index) => (
                  <img key={index} src={bet.token.image} alt={bet.token.value.toString()} className="w-6 h-6" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </GameDisplay>
   </GameLayout>
  )
}


