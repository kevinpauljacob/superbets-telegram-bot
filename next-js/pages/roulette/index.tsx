import React, { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import BetSetting from "@/components/BetSetting";
import { GameDisplay, GameLayout, GameOptions } from "@/components/GameLayout";
import { useGlobalContext } from "@/components/GlobalContext";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import Loader from "@/components/games/Loader";
import { errorCustom } from "@/components/toasts/ToastGroup";
interface Token {
  id: number;
  value: string;
  image: string;
}
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
type PredefinedBetType = "1-12" | "13-24" | "25-36" | "1-18" | "19-36" | "even" | "odd" | "red" | "black";

const predefinedBets: Record<PredefinedBetType, number[]> = {
  "1-12": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  "13-24": [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  "25-36": [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  "1-18": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  "19-36": [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  "even": [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
  "odd": [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
  "red": [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27,28, 30, 32, 34,36],
  "black": [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 29, 31,33, 35],
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
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [bets, setBets] = useState<{ areaId: string; token: Token }[]>([]);
  const [betActive, setBetActive] = useState(false);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [isRolling, setIsRolling] = useState(false);
  const [betss, setBetss] = useState<{ areaId: string, token: { image: string } }[]>([]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const SelectedToken = { image: 'path_to_token_image' };

  const onSubmit = async (data: any) => {
    if (betType === "auto") {
      // Auto bet logic
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
                        className={`border rounded cursor-pointer bg-[#1e2024] flex justify-center items-center py-1 ${selectedChip === chip.value ? 'border-white' : 'border-gray-600'}`
                      }
                    
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
          <div className="flex justify-between w-full px-2 text-white mb-1">
            <div className="flex items-center">
              <Image
                src="/assets/Undo.png"
                width={20}
                height={20}
                alt="undo"
              />
              <p className="font-sans text-[16px]">Undo</p>
            </div>
            <div className="flex items-center">
              <Image
                src="/assets/clear.png"
                width={20}
                height={20}
                alt="clear"
              />
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
  className={`w-[48px] h-[48px] flex items-center justify-center ${ predefinedBets.red.includes(number) ?  'bg-[#F1323E] hover:border hover:border-slate-200 hover:bg-[#FF5C67]':'bg-[#2A2E38] hover:border hover:border-slate-200 hover:bg-[#4D5361]'} text-white relative rounded-md border-4 border-transparent ${
    hoveredButton && predefinedBets[hoveredButton as PredefinedBetType]?.includes(number)
      ? '   overlay border-[2px] border-slate-300 '
      : ''
  } `}
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
                            className="absolute w-3 h-full bg-transparent -left-2 px-2 top-0"
                            onClick={() => handlePlaceBet(`num-${number}-left`, SelectedToken)}
                          />
                          <button
                            data-testid={`roulette-tile-${number}-corner`}
                            className="absolute w-6 h-6 bg-transparent -left-5 -top-5 px-[6px]"
                            onClick={() => handlePlaceBet(`num-${number}-corner`, SelectedToken)}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-1 grid grid-cols-3 gap-2 w-full">
                <button
                  className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('1-12')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('1-12', SelectedToken)}
                >
                  1 to 12
                </button>
                <button
                  className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('13-24')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('13-24', SelectedToken)}
                >
                  13 to 24
                </button>
                <button
                  className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('25-36')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('25-36', SelectedToken)}
                >
                  25 to 36
                </button>
              </div>
              <div className="mt-2 grid grid-cols-6 gap-2 w-full">
                <button
                  className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('1-18')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('1-18', SelectedToken)}
                >
                  1 to 18
                </button>
                <button
                  className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('even')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('even', SelectedToken)}
                >
                  Even
                </button>
                <button
                  className="col-span-1 flex items-center justify-center bg-[#F1323E] cursor-pointer rounded-md h-12 hover:border hover:border-slate-200 hover:bg-[#FF5C67]"
                  onMouseEnter={() => setHoveredButton('red')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('red', SelectedToken)}
                >
                  
                </button>
                <button
                  className="col-span-1 flex items-center justify-center bg-[#2A2E38] cursor-pointer rounded-md h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('black')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('black', SelectedToken)}
                >
                  
                </button>
                <button
                  className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('odd')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('odd', SelectedToken)}
                >
                  Odd
                </button>
                <button
                  className="col-span-1 flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md h-12 hover:border hover:border-slate-200 hover:bg-[#4D5361]"
                  onMouseEnter={() => setHoveredButton('19-36')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handlePlaceBet('19-36', SelectedToken)}
                >
                  19 to 36
                </button>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-1 mx-1">
              {rows.map((_, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="w-12 h-12 flex items-center justify-center text-center bg-transparent border-2 border-[#26272B] text-white cursor-pointer relative rounded-md"
                  onMouseEnter={() => setHoveredButton(`row-${rowIndex + 1}`)}
                  onMouseLeave={() => setHoveredButton(null)}
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
  );
}
