import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import BetSetting from "@/components/BetSetting";
import { useGlobalContext } from "@/components/GlobalContext";
import {
  GameDisplay,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import { FormProvider, useForm } from "react-hook-form";
import Loader from "@/components/games/Loader";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import { riskToChance } from "@/components/games/Keno/RiskToChance";
import Bets from "../../components/games/Bets";
import { soundAlert } from "@/utils/soundUtils";
import ConfigureAutoButton from "@/components/ConfigureAutoButton";
import AutoCount from "@/components/AutoCount";
import {
  errorCustom,
  successCustom,
  warningCustom,
} from "@/components/toasts/ToastGroup";
import {
  formatNumber,
  translator,
  truncateNumber,
} from "@/context/transactions";
import { useSession } from "next-auth/react";
import user from "@/models/staking/user";
import Decimal from "decimal.js";
import next from "next";
import { GameType } from "@/utils/provably-fair";
Decimal.set({ precision: 9 });

export default function Mines() {
  const wallet = useWallet();
  const methods = useForm();
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
    selectedCoin,
    enableSounds,
    updatePNL,
    minGameAmount,
    session,
    status,
  } = useGlobalContext();
  const [betAmt, setBetAmt] = useState<number | undefined>();
  const [userInput, setUserInput] = useState<number | undefined>();
  const [isRolling, setIsRolling] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>(1);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(0);
  const [nextMultiplier, setNextMultiplier] = useState<number>(0);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [numBets, setNumBets] = useState<number>(0);
  const [currentProfit, setCurrentProfit] = useState<number>(0);
  const [nextProfit, setNextProfit] = useState<number>(0);
  const [currentProfitInUSD, setCurrentProfitInUSD] = useState<number>(0);
  const [nextProfitInUSD, setNextProfitInUSD] = useState<number>(0);
  const [amountWon, setAmountWon] = useState<number>(0);
  const [gameId, setGameId] = useState<number>();
  const [betActive, setBetActive] = useState(false);
  const [dropDown, setDropDown] = useState<boolean>(false);
  const [cashoutModal, setCashoutModal] = useState({
    show: false,
    amountWon: 0,
    strikeMultiplier: 0,
    pointsGained: 0,
  });
  const [pendingRequests, setPendingRequests] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [gameStatus, setGameStatus] = useState<"Not Started" | "Completed">(
    "Not Started",
  );

  const defaultUserBets = Array.from({ length: 25 }, (_, index) => ({
    result: "",
    pick: false,
  }));
  const [userBets, setUserBets] = useState(defaultUserBets);
  const [userBetsForAuto, setUserBetsForAuto] = useState<number[]>([]);

  const options = [];
  for (let i = 1; i <= 24; i++) {
    options.push({ key: i, value: i, label: `${i}` });
  }

  const handleMinesCountChange = (value: number) => {
    setMinesCount(value);
    setDropDown(false);
  };

  const handleDropDown = () => {
    setDropDown(!dropDown);
  };

  useEffect(() => {
    if (numBets === 0) {
      setCurrentMultiplier(0);
      setNextMultiplier(0);
      setAmountWon(0);
      return;
    }
  }, [numBets, currentMultiplier, amountWon]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          `https://price.jup.ag/v6/price?ids=${selectedCoin.tokenName}`,
        );
        const data = await response.json();
        const coinPrice = data?.data[selectedCoin.tokenName]?.price ?? 0;
        setCurrentProfitInUSD(currentProfit * coinPrice);
        setNextProfitInUSD(nextProfit * coinPrice);
      } catch (error: any) {
        throw new Error(error.message);
      }
    };

    fetchPrice();
  }, [currentProfit, nextProfit, pendingRequests, betActive]);

  const handleConclude = async () => {
    try {
      const response = await fetch(`/api/games/mines/conclude`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          email: session?.user?.email,
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
        errorCustom(translator(message, language));
        throw new Error(translator(message, language));
      }

      const win = result === "Won";
      if (win) {
        successCustom(
          translator(message, language) +
            ` ${formatNumber(amountWon)}  ${selectedCoin.tokenName}`,
        );
        soundAlert("/sounds/win.wav", !enableSounds);
      } else errorCustom(translator(message, language));

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
        updatePNL(GameType.mines, win, betAmt!, strikeMultiplier);
        setGameStatus("Completed");
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
        setProcessing(false);
        setPendingRequests([]);
      }
    } catch (error) {
      console.error("Error occurred while betting:", error);
    } finally {
      setBetActive(false);
    }
  };

  const handleAutoPick = async (number: number) => {
    const updatedUserBets = userBets;
    const currentPickState = updatedUserBets[number - 1].pick;

    // Toggle the pick state
    updatedUserBets[number - 1] = {
      ...updatedUserBets[number - 1],
      pick: !currentPickState,
    };
    setUserBets(updatedUserBets);

    // Update userBetsForAuto based on the new pick state
    setUserBetsForAuto((prevUserBetsForAuto) => {
      if (!currentPickState) {
        // If the tile was not picked before, add it to userBetsForAuto
        return [...prevUserBetsForAuto, number - 1];
      } else {
        // If the tile was already picked, remove it from userBetsForAuto
        return prevUserBetsForAuto.filter(
          (betIndex) => betIndex !== number - 1,
        );
      }
    });
  };

  const handlePick = async (number: number) => {
    soundAlert("/sounds/betbutton.wav", !enableSounds);
    setIsRolling(true);
    // setSelectTile(false);
    setNumBets(numBets + 1);
    try {
      const response = await fetch(`/api/games/mines/pick`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          email: session?.user?.email,
          gameId: gameId,
          userBet: number - 1,
        }),
      });

      const {
        success,
        message,
        result,
        strikeNumbers,
        strikeMultiplier,
        amountWon,
      } = await response.json();

      if (success != true) {
        throw new Error(translator(message, language));
      }

      const updatedUserBets = userBets;
      updatedUserBets[number - 1] = {
        result: result === "Pending" ? "Pending" : "Lost",
        pick: true,
      };
      setUserBets(updatedUserBets);

      setCurrentMultiplier(strikeMultiplier);
      setCurrentProfit(amountWon);

      setNextMultiplier(
        Decimal.div(25 - (numBets + 1), 25 - (numBets + 1) - minesCount)
          .mul(strikeMultiplier)
          .toNumber(),
      );

      if (betAmt) {
        setNextProfit(
          Decimal.mul(
            betAmt,
            Decimal.div(25 - (numBets + 1), 25 - (numBets + 1) - minesCount)
              .mul(strikeMultiplier)
              .toNumber(),
          )
            .mul(Decimal.sub(1, houseEdge))
            .toNumber(),
        );
      }

      if (result === "Lost") {
        const updatedUserBetsWithResult = userBets.map((bet, index) => ({
          ...bet,
          result: strikeNumbers[index] === 1 ? "Lost" : "Pending",
        }));
        updatedUserBetsWithResult[number - 1] = {
          result: result === "Pending" ? "Pending" : "Lost",
          pick: true,
        };
        setGameStatus("Completed");
        setUserBets(updatedUserBetsWithResult);
        setNumBets(0);
        setCurrentMultiplier(0);
        setNextMultiplier(0);
        setStrikeMultiplier(1);
        setCurrentProfit(0);
        setNextProfit(0);
        setAmountWon(0);
        setBetActive(false);
        errorCustom(translator(message, language));
        setIsRolling(false);
        setProcessing(false);
        setPendingRequests([]);
      }

      const win: boolean = result === "Pending";
      const lose: boolean = result === "Lost";
      if (win) {
        soundAlert("/sounds/win.wav", !enableSounds);
        // setSelectTile(true);
      }
      if (lose) {
        soundAlert("/sounds/bomb.wav", !enableSounds);
        updatePNL(GameType.mines, false, betAmt!, 1);
      }

      if (success) {
        setRefresh(true);
        setIsRolling(false);
      }
    } catch (error: any) {
      if (
        error.message != "Max payout of 25 exceeded! Cashout to continue..."
      ) {
        setNumBets(0);
        setCurrentMultiplier(0);
        setNextMultiplier(0);
        setStrikeMultiplier(1);
        setCurrentProfit(0);
        setNextProfit(0);
        setAmountWon(0);
        setBetActive(false);
        setIsRolling(false);
        setProcessing(false);
        setPendingRequests([]);
      } else {
        setRefresh(true);
        setIsRolling(false);
      }
      errorCustom(translator(error.message, language));
      console.error("Error occurred while betting:", error);
    }
  };

  const processPendingRequests = async () => {
    if (processing || pendingRequests.length === 0) return;

    setProcessing(true);

    for (let i = 0; i < pendingRequests.length; i++) {
      const currentRequest = pendingRequests[i];

      // console.log(`Processing request: ${currentRequest}`);
      const alreadyPicked = userBets[currentRequest - 1]?.pick;
      if (alreadyPicked) {
        // console.warn(`Number ${currentRequest} has already been picked.`);
      } else {
        await handlePick(currentRequest);
      }

      setPendingRequests((prev) =>
        prev.filter((req) => req !== currentRequest),
      );

      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    setProcessing(false);
  };

  useEffect(() => {
    if (!processing && pendingRequests.length > 0) {
      // console.log("Triggering processPendingRequests");
      processPendingRequests();
    }
    // console.log(`Updated pending requests: ${pendingRequests}`);
  }, [pendingRequests, processing]);

  const handleAutoBet = async () => {
    try {
      if (!session?.user?.isWeb2User && selectedCoin.tokenMint === "WEB2") {
        throw new Error(
          translator("You cannot bet with this token!", language),
        );
      }
      if (session?.user?.wallet && (!wallet.connected || !wallet.publicKey)) {
        throw new Error(translator("Wallet not connected", language));
      }
      if (!betAmt || betAmt === 0) {
        throw new Error(translator("Set Amount.", language));
      }
      if (selectedCoin && selectedCoin.amount < betAmt) {
        throw new Error(translator("Insufficient balance for bet !", language));
      }
      if (userBetsForAuto.length === 0) {
        throw new Error(
          translator("Select at least one tile to bet on.", language),
        );
      }

      setIsRolling(true);
      setBetActive(true);
      setCashoutModal({
        show: false,
        amountWon: 0,
        strikeMultiplier: 0,
        pointsGained: 0,
      });
      // setUserBets(defaultUserBets);
      const response = await fetch(`/api/games/mines/auto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          email: session?.user?.email,
          amount: betAmt,
          tokenMint: selectedCoin.tokenMint,
          minesCount: minesCount,
          userBets: userBetsForAuto,
        }),
      });

      const {
        success,
        result,
        amountWon,
        strikeNumbers,
        strikeMultiplier,
        pointsGained,
        message,
      } = await response.json();

      if (success != true) {
        throw new Error(translator(message, language));
      }

      if (success) {
        const updatedUserBetsWithResult = userBets.map((bet, index) => ({
          ...bet,
          result: strikeNumbers[index] === 1 ? "Lost" : "Won",
        }));

        setGameId(gameId);
        setBetActive(true);
        setUserBets(updatedUserBetsWithResult);
        setRefresh(true);
      }

      const win = result === "Won";
      if (win) {
        soundAlert("/sounds/win.wav", !enableSounds);
        successCustom(
          translator(message, language) +
            ` ${formatNumber(amountWon)} ${selectedCoin.tokenName}`,
        );
        setCashoutModal({
          show: true,
          amountWon: amountWon,
          strikeMultiplier: strikeMultiplier,
          pointsGained: pointsGained,
        });
      }

      const lose = result === "Lost";
      if (lose) {
        soundAlert("/sounds/bomb.wav", !enableSounds);
        errorCustom(translator(message, language));
      }

      // auto options
      if (betType === "auto") {
        if (useAutoConfig && win) {
          setBetAmt(
            autoWinChangeReset
              ? userInput!
              : betAmt + ((autoWinChange ?? 0) * betAmt) / 100.0,
          );
        } else if (useAutoConfig && !win) {
          setBetAmt(
            autoLossChangeReset
              ? userInput!
              : betAmt + ((autoLossChange ?? 0) * betAmt) / 100.0,
          );
        }
        // update profit / loss
        setAutoBetProfit(
          autoBetProfit +
            (win
              ? strikeMultiplier * (1 - houseEdge) - 1
              : strikeMultiplier - 1) *
              betAmt,
        );
        // update count
        if (typeof autoBetCount === "number") {
          setAutoBetCount(autoBetCount > 0 ? autoBetCount - 1 : 0);
          autoBetCount === 1 &&
            warningCustom(translator("Auto bet stopped", language), "top-left");
        } else
          setAutoBetCount(
            autoBetCount.length > 12
              ? autoBetCount.slice(0, 5)
              : autoBetCount + 1,
          );
      }
    } catch (error: any) {
      errorCustom(
        translator(error?.message ?? "Could not make the Bet.", language),
      );
      setIsRolling(false);
      setStartAuto(false);
      console.error("Error occurred while betting:", error);
    } finally {
      setIsRolling(false);
      setBetActive(false);
    }
  };

  const handleBet = async () => {
    setGameStatus("Not Started");
    // setSelectTile(true);
    try {
      if (!session?.user?.isWeb2User && selectedCoin.tokenMint === "WEB2") {
        throw new Error(
          translator("You cannot bet with this token!", language),
        );
      }
      if (session?.user?.wallet && (!wallet.connected || !wallet.publicKey)) {
        throw new Error(translator("Wallet not connected", language));
      }
      if (!betAmt || betAmt === 0) {
        throw new Error(translator("Set Amount.", language));
      }
      if (selectedCoin && selectedCoin.amount < betAmt) {
        throw new Error(translator("Insufficient balance for bet !", language));
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
          email: session?.user?.email,
          amount: betAmt,
          tokenMint: selectedCoin.tokenMint,
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
        throw new Error(translator(message, language));
      }

      if (success) {
        setGameId(gameId);
        setBetActive(true);
        setRefresh(true);
        successCustom(translator(message, language));
      }
    } catch (error: any) {
      errorCustom(
        translator(error?.message ?? "Could not make the Bet.", language),
      );
      setIsRolling(false);
      setAutoBetCount(0);
      setStartAuto(false);
      console.error("Error occurred while betting:", error);
    } finally {
      setIsRolling(false);
    }
  };

  const handlePendingGame = async () => {
    const updatedUserBets = userBets;
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error(translator("Wallet not connected", language));
      }
      setUserBets(defaultUserBets);
      const response = await fetch(`/api/games/mines/pendingGame`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          email: session?.user?.email,
        }),
      });

      const { success, message, pendingGame, result } = await response.json();

      if (success === false) {
        throw new Error(translator(message, language));
      }

      if (success) {
        if (result === true) {
          const {
            userBets,
            amount,
            amountWon,
            _id: gameId,
            minesCount,
            strikeMultiplier,
            tokenMint,
          } = pendingGame;

          setCurrentMultiplier(strikeMultiplier);
          setCurrentProfit(amountWon);

          setNextMultiplier(
            Decimal.div(25 - userBets.length, 25 - userBets.length - minesCount)
              .mul(strikeMultiplier)
              .toNumber(),
          );

          setNextProfit(
            Decimal.mul(
              amount,
              Decimal.div(
                25 - (userBets.length + 1),
                25 - (userBets.length + 1) - minesCount,
              )
                .mul(strikeMultiplier)
                .toNumber(),
            )
              .mul(Decimal.sub(1, houseEdge))
              .toNumber(),
          );

          const pendingGameUserBets = userBets;
          pendingGameUserBets.forEach((index: number) => {
            if (index >= 0 && index < updatedUserBets.length) {
              updatedUserBets[index] = {
                ...updatedUserBets[index],
                result: "Pending",
                pick: true,
              };
            }
          });

          setMinesCount(minesCount);
          setNumBets(userBets.length);
          setStrikeMultiplier(strikeMultiplier);
          setUserBets(updatedUserBets);
          setBetAmt(amount);
          setGameId(gameId);
          setBetActive(true);
          successCustom(translator(message ?? "Pending game found!", language));
        }

        setRefresh(true);
      }
    } catch (error: any) {
      errorCustom(
        translator(error?.message ?? "Could not fetch pending game.", language),
      );
      setAutoBetCount(0);
      setStartAuto(false);
      console.error("Error occurred while fetching pending game:", error);
    }
  };

  useEffect(() => {
    if (wallet.connected && wallet?.publicKey && status === "authenticated")
      handlePendingGame();
  }, [wallet.connected, wallet.publicKey, status]);

  const disableInput = useMemo(() => {
    return betType === "auto" && startAuto
      ? true
      : false || isRolling || betActive;
  }, [betType, startAuto, isRolling, betActive]);

  useEffect(() => {
    if (refresh && wallet?.publicKey) {
      getBalance();
      getWalletBalance();
      setRefresh(false);
    }
  }, [wallet?.publicKey, refresh]);

  useEffect(() => {
    setBetAmt(userInput);
  }, [userInput]);

  useEffect(() => {
    setUserBets(defaultUserBets);
    setUserBetsForAuto([]);
    setCashoutModal({
      show: false,
      amountWon: 0,
      strikeMultiplier: 0,
      pointsGained: 0,
    });
  }, [betType]);

  useEffect(() => {
    if (
      betType === "auto" &&
      startAuto &&
      ((typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0))
    ) {
      let potentialLoss = 0;
      if (betAmt !== undefined) {
        potentialLoss =
          autoBetProfit +
          -1 *
            (autoWinChangeReset || autoLossChangeReset
              ? betAmt
              : autoBetCount === "inf"
                ? Math.max(0, betAmt)
                : betAmt *
                  (autoLossChange !== null ? autoLossChange / 100.0 : 0));
      }
      if (
        useAutoConfig &&
        autoStopProfit &&
        autoBetProfit > 0 &&
        autoBetProfit >= autoStopProfit
      ) {
        warningCustom(
          translator("Profit limit reached.", language),
          "top-left",
        );
        setAutoBetCount(0);
        setStartAuto(false);
        setTimeout(() => {
          setUserBets(defaultUserBets);
          setUserBetsForAuto([]);
          setCashoutModal({
            show: false,
            amountWon: 0,
            strikeMultiplier: 0,
            pointsGained: 0,
          });
        }, 2000);
        return;
      }
      if (
        useAutoConfig &&
        autoStopLoss &&
        autoBetProfit < 0 &&
        potentialLoss <= -autoStopLoss
      ) {
        warningCustom(translator("Loss limit reached.", language), "top-left");
        setAutoBetCount(0);
        setStartAuto(false);
        setTimeout(() => {
          setUserBets(defaultUserBets);
          setUserBetsForAuto([]);
          setCashoutModal({
            show: false,
            amountWon: 0,
            strikeMultiplier: 0,
            pointsGained: 0,
          });
        }, 2000);
        return;
      }
      setTimeout(() => {
        handleAutoBet();
      }, 1000);
    } else {
      setStartAuto(false);
      if (startAuto === false && userBets.some((bet) => bet.result !== "")) {
        setTimeout(() => {
          setUserBets(defaultUserBets);
          setUserBetsForAuto([]);
          setCashoutModal({
            show: false,
            amountWon: 0,
            strikeMultiplier: 0,
            pointsGained: 0,
          });
        }, 2000);
      }
      setAutoBetProfit(0);
      setUserInput(betAmt);
    }
  }, [startAuto, autoBetCount]);

  const onSubmit = async (data: any) => {
    if (betType === "auto") {
      // if (betAmt === 0) {
      //   errorCustom(translator("Set Amount.", language));
      //   return;
      // }
      if (typeof autoBetCount === "number" && autoBetCount <= 0) {
        errorCustom(translator("Set Bet Count.", language));
        return;
      }
      if (
        (typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0)
      ) {
        setStartAuto(true);
      }
    }
  };

  return (
    <GameLayout title="Mines">
      <GameOptions>
        <>
          <div className="relative w-full flex lg:hidden mb-[1.4rem]">
            {startAuto && (
              <div
                onClick={() => {
                  setUserBets(defaultUserBets);
                  setUserBetsForAuto([]);
                  soundAlert("/sounds/betbutton.wav", !enableSounds);
                  warningCustom(
                    translator("Auto bet stopped", language),
                    "top-left",
                  );
                  setAutoBetCount(0);
                  setStartAuto(false);
                  setCashoutModal({
                    show: false,
                    amountWon: 0,
                    strikeMultiplier: 0,
                    pointsGained: 0,
                  });
                }}
                className="hover:duration-75 hover:opacity-90 w-full h-[3.75rem] rounded-lg transition-all bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
              >
                {translator("STOP", language)}
              </div>
            )}
            {!betActive && !startAuto && (
              <BetButton
                disabled={
                  !wallet ||
                  !session?.user ||
                  isRolling ||
                  (coinData && coinData[0].amount < minGameAmount) ||
                  (betType === "auto" && !userBets.some((bet) => bet.pick)) ||
                  autoBetCount === 0 ||
                  Number.isNaN(autoBetCount) ||
                  (betAmt !== undefined &&
                    maxBetAmt !== undefined &&
                    betAmt > maxBetAmt)
                    ? true
                    : false
                }
                onClickFunction={betType === "auto" ? onSubmit : handleBet}
              >
                {isRolling ? <Loader /> : "BET"}
              </BetButton>
            )}
            {betActive && betType === "manual" && (
              <button
                onClick={() => {
                  handleConclude();
                }}
                disabled={
                  betActive &&
                  betType === "manual" &&
                  !userBets.some((bet) => bet.pick)
                }
                className="disabled:cursor-default disabled:opacity-70 hover:duration-75 hover:opacity-90 w-full h-[3.75rem] rounded-lg transition-all bg-[#5F4DFF] disabled:bg-[#555555] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] flex items-center justify-center font-chakra font-semibold text-xl tracking-wider text-white"
              >
                {isRolling ? <Loader /> : translator("CASHOUT", language)}
              </button>
            )}
          </div>
          {betType === "auto" && (
            <div className="w-full flex lg:hidden">
              <ConfigureAutoButton disabled={disableInput} />
            </div>
          )}
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
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                {/* amt input  */}
                <BetAmount
                  betAmt={betAmt}
                  setBetAmt={setUserInput}
                  currentMultiplier={25}
                  leastMultiplier={1.04}
                  game="mines"
                  disabled={disableInput}
                />
                {!betActive && betType !== "auto" && (
                  <div className="mb-6 flex flex-col w-full">
                    <div className="mb-1 w-full text-xs font-changa text-opacity-90">
                      <label className="text-white/90">
                        {translator("Mines", language)}
                      </label>
                    </div>
                    <div
                      className={`${
                        dropDown ? "" : ""
                      } relative flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
                      onClick={handleDropDown}
                    >
                      <div className="flex justify-between items-center bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra placeholder-opacity-40 outline-none w-full">
                        {minesCount}
                        <Image
                          src="/assets/downArrow.png"
                          alt="arrowDown"
                          width={14}
                          height={14}
                          className={`${
                            dropDown
                              ? "transform transition-all rotate-180"
                              : "transition-all"
                          }`}
                        />
                      </div>
                      {dropDown && (
                        <div className="absolute -top-[200px] lg:top-14 z-[150] max-h-[195px] lg:max-h-[335px] xl:max-h-[380px] overflow-y-scroll modalscrollbar left-0 bg-[#202329] border-2 border-[#2A2E38] rounded-[8px] w-full">
                          {options.map((option) => (
                            <div
                              key={option.key}
                              className={`${
                                minesCount === option.value
                                  ? "text-white bg-white/20 hover:bg-white/20"
                                  : "hover:bg-white/10"
                              } border-b border-r text-[#94A3B8] font-chakra border-[#2A2E38] py-1.5 px-3`}
                              onClick={() =>
                                handleMinesCountChange(option.value)
                              }
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {betActive && betType === "manual" ? (
                  <>
                    <div className="flex gap-2 w-full mb-8">
                      <div className="w-1/2">
                        <label className="text-xs text-white/90 font-changa mb-1">
                          {translator("Mines", language)}
                        </label>
                        <div className="bg-[#202329] text-[#94A3B8] font-chakra rounded-[8px] flex items-center h-11 px-4">
                          {minesCount}
                        </div>
                      </div>
                      <div className="w-1/2">
                        <label className="text-xs text-white/90 font-changa mb-1">
                          {translator("Gems", language)}
                        </label>
                        <div className="bg-[#202329] text-[#94A3B8] font-chakra rounded-[8px] flex items-center h-11 px-4">
                          {25 - minesCount}
                        </div>
                      </div>
                    </div>
                    <div className="border border-[#FFFFFF0D] rounded-[5px] font-changa text-white text-sm font-medium p-5 mb-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p>{translator("Current Profit", language)}</p>
                          <p>
                            {truncateNumber(currentProfit, 7)}{" "}
                            {selectedCoin.tokenName}
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-fomo-green">
                          <p className="text-[#94A3B8]">
                            {truncateNumber(currentProfitInUSD, 5)} USD
                          </p>
                          <p>{truncateNumber(currentMultiplier, 2)}x</p>
                        </div>
                      </div>
                      <div className="flex items-center w-full">
                        <div className="h-[1px] bg-[#FFFFFF0D] w-full"></div>
                        <Image
                          src="/assets/arrowInCircle.svg"
                          alt="arrowInCircle"
                          width={24}
                          height={24}
                        />
                        <div className="h-[1px] bg-[#FFFFFF0D] w-full"></div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p>{translator("Profit on next tile", language)}</p>
                          <p>
                            {truncateNumber(nextProfit, 7)}{" "}
                            {selectedCoin.tokenName}
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-fomo-green">
                          <p className="text-[#94A3B8]">
                            {truncateNumber(nextProfitInUSD, 5)} USD
                          </p>
                          <p>{truncateNumber(nextMultiplier, 2)}x</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : betType === "auto" ? (
                  <>
                    <div className="flex gap-2 w-full mb-8">
                      <div className="w-1/2">
                        <label className="text-xs text-white/90 font-changa mb-1">
                          {translator("Mines", language)}
                        </label>
                        <div
                          className={`${
                            dropDown ? "" : ""
                          } relative flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
                          onClick={!startAuto ? handleDropDown : undefined}
                        >
                          <div className="flex justify-between items-center bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra placeholder-opacity-40 outline-none w-full">
                            {minesCount}
                            <Image
                              src="/assets/downArrow.png"
                              alt="arrowDown"
                              width={14}
                              height={14}
                              className={`${
                                dropDown
                                  ? "transform transition-all rotate-180"
                                  : "transition-all"
                              }`}
                            />
                          </div>
                          {!startAuto && dropDown && (
                            <div className="absolute -top-[200px] lg:top-14 z-[150] max-h-[195px] lg:max-h-[335px] xl:max-h-[380px] overflow-y-scroll modalscrollbar left-0 bg-[#202329] border-2 border-[#2A2E38] rounded-[8px] w-full">
                              {options.map((option) => (
                                <div
                                  key={option.key}
                                  className={`${
                                    minesCount === option.value
                                      ? "text-white bg-white/20 hover:bg-white/20"
                                      : "hover:bg-white/10"
                                  } border-b border-r text-[#94A3B8] font-chakra border-[#2A2E38] py-1.5 px-3`}
                                  onClick={() =>
                                    handleMinesCountChange(option.value)
                                  }
                                >
                                  {option.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-1/2">
                        <label className="text-xs text-white/90 font-changa mb-1">
                          {translator("Gems", language)}
                        </label>
                        <div className="bg-[#202329] text-[#94A3B8] font-chakra rounded-[8px] flex items-center h-11 px-4">
                          {25 - minesCount}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
                {betType === "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <AutoCount loading={isRolling || startAuto} />
                    <div className="w-full hidden lg:flex">
                      <ConfigureAutoButton disabled={disableInput} />
                    </div>
                  </div>
                )}

                <div className="relative w-full hidden lg:flex mt-2">
                  {startAuto && (
                    <div
                      onClick={() => {
                        setUserBets(defaultUserBets);
                        setUserBetsForAuto([]);
                        soundAlert("/sounds/betbutton.wav", !enableSounds);
                        warningCustom(
                          translator("Auto bet stopped", language),
                          "top-left",
                        );
                        setAutoBetCount(0);
                        setStartAuto(false);
                        setCashoutModal({
                          show: false,
                          amountWon: 0,
                          strikeMultiplier: 0,
                          pointsGained: 0,
                        });
                      }}
                      className="hover:duration-75 hover:opacity-90 w-full h-[3.75rem] rounded-lg transition-all bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
                    >
                      {translator("STOP", language)}
                    </div>
                  )}
                  {!betActive && !startAuto && (
                    <BetButton
                      disabled={
                        !wallet ||
                        !session?.user ||
                        isRolling ||
                        (coinData && coinData[0].amount < minGameAmount) ||
                        (betType === "auto" &&
                          !userBets.some((bet) => bet.pick)) ||
                        autoBetCount === 0 ||
                        Number.isNaN(autoBetCount) ||
                        (betAmt !== undefined &&
                          maxBetAmt !== undefined &&
                          betAmt > maxBetAmt)
                          ? true
                          : false
                      }
                      onClickFunction={
                        betType === "auto" ? onSubmit : handleBet
                      }
                    >
                      {isRolling ? <Loader /> : "BET"}
                    </BetButton>
                  )}
                  {betActive && betType === "manual" && (
                    <button
                      onClick={() => {
                        handleConclude();
                      }}
                      disabled={
                        betActive &&
                        betType === "manual" &&
                        !userBets.some((bet) => bet.pick)
                      }
                      className="disabled:cursor-default disabled:opacity-70 hover:duration-75 hover:opacity-90 w-full h-[3.75rem] rounded-lg transition-all bg-[#5F4DFF] disabled:bg-[#555555] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] flex items-center justify-center font-chakra font-semibold text-xl tracking-wider text-white"
                    >
                      {isRolling ? <Loader /> : translator("CASHOUT", language)}
                    </button>
                  )}
                </div>
              </form>
            </FormProvider>
            <div className="w-full flex lg:hidden">
              <BetSetting
                betSetting={betType}
                setBetSetting={setBetType}
                disabled={disableInput}
              />
            </div>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <div className="w-full flex justify-between items-center h-[2.125rem]">
          <div>
            {isRolling ? (
              <div className="font-chakra text-xs sm:text-sm font-medium text-white text-opacity-75">
                {translator("Betting", language)}...
              </div>
            ) : null}
          </div>
        </div>
        <div
          className="flex justify-center items-center w-full"
          onClick={() => {
            setCashoutModal({
              show: false,
              amountWon: 0,
              strikeMultiplier: 0,
              pointsGained: 0,
            });
          }}
        >
          <div className="relative grid grid-cols-5 gap-1.5 sm:gap-2 text-white text-sm md:text-xl font-chakra">
            {cashoutModal.show && (
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/10">
                <div className="flex flex-col items-center justify-center bg-[#121418] rounded-[5px] border-2 border-fomo-green w-[200px] h-max p-2.5">
                  <p className="text-3xl text-fomo-green font-bold font-chakra mb-2">
                    x{truncateNumber(cashoutModal.strikeMultiplier, 2)}
                  </p>
                  <div className="flex items-center justify-between bg-[#202329] rounded-[3px] text-sm font-bold font-chakra text-white w-full p-2.5">
                    <div className="flex gap-2 items-center">
                      <selectedCoin.icon className="w-5 h-5" />
                      <p>{truncateNumber(cashoutModal.amountWon, 6)}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Image
                        src="/assets/gem.svg"
                        alt="Gem"
                        width={20}
                        height={20}
                      />
                      <p>{truncateNumber(cashoutModal.pointsGained, 2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {Array.from({ length: 25 }, (_, index) => index + 1).map(
              (index) => (
                <button
                  key={index}
                  className={`border-2 ${
                    betType === "manual"
                      ? userBets[index - 1].result === "Pending" &&
                        userBets[index - 1].pick === true
                        ? "border-[#FCB10F] bg-[#FCB10F33]"
                        : userBets[index - 1].result === "Lost" &&
                            userBets[index - 1].pick === true
                          ? "border-[#FCB10F] bg-[#FCB10F33]"
                          : userBets[index - 1].result === "Lost" &&
                              userBets[index - 1].pick === true
                            ? "border-[#F1323E] bg-[#F1323E33]"
                            : gameStatus === "Completed"
                              ? "bg-transparent border-white/10"
                              : "bg-[#202329] border-[#202329] hover:border-white/30"
                      : betType === "auto"
                        ? userBets[index - 1].result === "" &&
                          userBets[index - 1].pick === true
                          ? "border-[#FCB10F] bg-[#FCB10F33]"
                          : userBets[index - 1].result === "Won" &&
                              userBets[index - 1].pick === true
                            ? "border-[#FCB10F] bg-[#FCB10F33]"
                            : userBets[index - 1].result === "Lost" &&
                                userBets[index - 1].pick === true
                              ? "border-[#F1323E] bg-[#F1323E33]"
                              : "bg-[#202329] border-[#202329] hover:border-white/30"
                        : null
                  } ${
                    pendingRequests.includes(index) ? "blink_tile" : ""
                  } flex items-center active:scale-90 justify-center cursor-pointer rounded-md text-center transition duration-150 ease-in-out w-[50px] h-[50px] sm:w-[55px] sm:h-[55px] md:w-[80px] md:h-[80px] xl:w-[90px] xl:h-[90px]`}
                  disabled={betType === "manual" && userBets[index - 1].pick}
                  onClick={() =>
                    betType === "auto"
                      ? !startAuto && handleAutoPick(index)
                      : betActive && betType === "manual"
                        ? setPendingRequests((prevRequests) => [
                            ...prevRequests,
                            index,
                          ])
                        : null
                  }
                >
                  {betType === "manual" &&
                    (userBets[index - 1].result === "Pending" ? (
                      <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
                        <Image
                          src="/assets/gem.svg"
                          alt="Gem"
                          layout="responsive"
                          height={100}
                          width={100}
                        />
                      </div>
                    ) : userBets[index - 1].result === "Lost" ? (
                      <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
                        <Image
                          src="/assets/mine.svg"
                          alt="Mine"
                          layout="responsive"
                          height={100}
                          width={100}
                        />
                      </div>
                    ) : null)}
                  {betType === "auto" &&
                    (userBets[index - 1].result === "Won" ? (
                      <div className="w-full h-full flex items-center justify-center p-1.5 sm:p-3">
                        <Image
                          src="/assets/gem.svg"
                          alt="Gem"
                          layout="responsive"
                          height={100}
                          width={100}
                        />
                      </div>
                    ) : userBets[index - 1].result === "Lost" ? (
                      <div className="w-full h-full flex items-center justify-center p-1.5 sm:p-3">
                        <Image
                          src="/assets/mine.svg"
                          alt="Mine"
                          layout="responsive"
                          height={100}
                          width={100}
                        />
                      </div>
                    ) : null)}
                </button>
              ),
            )}
          </div>
        </div>
        <div id="mines-footer" className="w-full min-h-[2.125rem]" />
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
