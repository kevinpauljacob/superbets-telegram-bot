import BetSetting from "@/components/BetSetting";
import { GameLayout, GameOptions } from "@/components/GameLayout";
import { useGlobalContext } from "@/components/GlobalContext";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import Loader from "@/components/games/Loader";
import { errorCustom } from "@/components/toasts/ToastGroup";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "iconsax-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

export default function Roulette(){
const wallet = useWallet();
const methods = useForm();
const {data:session, status} = useSession();

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

const [betActive, setBetActive] = useState(false);
const [betType, setBetType] = useState<"manual" | "auto">("manual");
const [isRolling, setIsRolling] = useState(false);

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
               <BetAmount
               betAmt={betAmt}
               setBetAmt={setBetAmt}
               currentMultiplier={36}
               leastMultiplier={1.1}
               game="roulette"
               disabled={disableInput}/>
               
             </form>
           </FormProvider>
         </div>
       </>
    </GameOptions>
   </GameLayout>
  )
}