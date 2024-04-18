import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { rollDice } from "../../context/gameTransactions";
import HistoryTable from "../../components/games/Dice/HistoryTable";
import { toast } from "react-hot-toast";
import { ROLL_TAX } from "../../context/config";
import BetSetting from "@/components/BetSetting";
import { useGlobalContext } from "@/components/GlobalContext";
import {
  GameDisplay,
  GameFooterInfo,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import { FormProvider, useForm } from "react-hook-form";
import { BsInfinity } from "react-icons/bs";
import Loader from "@/components/games/Loader";
import WinPointer from "@/public/assets/WinPointer";
import DicePointer from "@/public/assets/DicePointer";
import Dice1 from "@/public/assets/Dice1";
import Dice2 from "@/public/assets/Dice2";
import Dice3 from "@/public/assets/Dice3";
import Dice4 from "@/public/assets/Dice4";
import Dice5 from "@/public/assets/Dice5";
import Dice6 from "@/public/assets/Dice6";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";

export default function Dice() {
  const wallet = useWallet();
  const methods = useForm();

  const { coinData, getBalance, getWalletBalance, setShowAutoModal, sidebar } =
    useGlobalContext();
  const [user, setUser] = useState<any>(null);
  const [betAmt, setBetAmt] = useState(0);
  const [betCount, setBetCount] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [winningPays, setWinningPays] = useState(6);
  const [winningAmount, setWinningAmount] = useState(0.6);
  const [winningProbability, setWinningProbability] = useState(0.0);
  const [refresh, setRefresh] = useState(true);
  const [selectedFace, setSelectedFace] = useState<number[]>([]);
  const [selectedFaces, setSelectedFaces] = useState<{
    [key: number]: boolean;
  }>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  });
  const [strikeFace, setStrikeFace] = useState<number>(0);
  const [rollType, setRollType] = useState<"manual" | "auto">("manual");
  const [betResults, setBetResults] = useState<
    { face: number; isWin: boolean }[]
  >([]);
  const [showPointer, setShowPointer] = useState<boolean>(false);

  const handleDiceClick = (newFace: number) => {
    setStrikeFace(0);
    setShowPointer(false);
    if (selectedFace.length >= 5 && !selectedFace.includes(newFace)) {
      toast.error("You can only select up to 5 faces");
      return;
    }

    setSelectedFaces((prevState) => ({
      ...prevState,
      [newFace]: !prevState[newFace],
    }));

    if (1 <= newFace && newFace <= 6) {
      if (!selectedFace.includes(newFace)) {
        setSelectedFace([...selectedFace, newFace]);
        const newLength = selectedFace.length + 1;
        setWinningPays(6 / newLength);
        setWinningAmount((betAmt * 6) / newLength);
        setWinningProbability((newLength * 100) / 6);
      } else {
        setSelectedFace(selectedFace.filter((face) => face !== newFace));
        const newLength = selectedFace.length - 1;
        if (newLength === 0) {
          setWinningPays(6);
          setWinningAmount(betAmt * 6);
          setWinningProbability(0);
        } else {
          setWinningPays(6 / newLength);
          setWinningAmount((betAmt * 6) / newLength);
          setWinningProbability((newLength * 100) / 6);
        }
      }
    }
  };

  const handleBetAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const amount = parseFloat(event.target.value);
    setBetAmt(amount);
  };

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBetCount(parseFloat(e.target.value));
  };

  const diceRoll = async () => {
    if (wallet.connected) {
      if (!wallet.publicKey) {
        toast.error("Wallet not connected");
        return;
      }
      if (coinData && coinData[0].amount < betAmt) {
        toast.error("Insufficient balance for bet !");
        return;
      }
      if (betAmt === 0) {
        toast.error("Set Amount.");
        return;
      }
      setIsRolling(true);
      try {
        const res = await rollDice(wallet, betAmt, selectedFace);
        if (res.success) {
          const { strikeNumber, result } = res.data;
          const isWin = result === "Won";
          const newBetResults = [
            ...(betResults.length <= 4 ? betResults : betResults.slice(-4)),
            { face: strikeNumber, isWin },
          ];
          setBetResults(newBetResults);
          setShowPointer(true);
          setStrikeFace(strikeNumber);
          setRefresh(true);
        }
      } catch (e) {
        setIsRolling(false);
        console.error("Error occurred while rolling the dice:", e);
      }
      setIsRolling(false);
    }
  };

  useEffect(() => {
    if (refresh && wallet?.publicKey) {
      getBalance();
      getWalletBalance();
      setRefresh(false);
    }
  }, [wallet?.publicKey, refresh]);

  const topWinPointerRef = useRef<HTMLDivElement | null>(null);
  const ghostWinPointerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setPointerPosition = () => {
    const topWinPointerElement = topWinPointerRef.current;
    const ghostWinPointerElement = ghostWinPointerRefs.current[strikeFace - 1];

    if (topWinPointerElement && ghostWinPointerElement) {
      topWinPointerElement.style.left = `${ghostWinPointerElement.offsetLeft}px`;
    } else if (topWinPointerElement) topWinPointerElement.style.left = "0px";
  };

  useEffect(() => {
    setPointerPosition();
  }, [strikeFace, sidebar]);

  useEffect(() => {
    console.log("from fhvdfnvhdf");
    setPointerPosition();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", setPointerPosition);

      return () => {
        window.removeEventListener("resize", setPointerPosition);
      };
    }
  }, [setPointerPosition]);

  const handleBlink = () => {
    console.log("blink");
    const diceElements = Array.from({ length: 6 }, (_, i) =>
      document.querySelector(`.dice-face-icon-${i + 1}`),
    );
    diceElements.forEach((element) => element?.classList.add("blink_dice"));
    setTimeout(() => {
      diceElements.forEach(
        (element) => element?.classList.remove("blink_dice"),
      );
    }, 2000);
  };

  useEffect(() => {
    setTimeout(() => {
      handleBlink();
    }, 3000);
  }, []);

  return (
    <GameLayout title="FOMO - Dice">
      <GameOptions>
        <>
          <div className="w-full relative flex md:hidden mb-5">
            {selectedFace.length === 0 && (
              <div
                onClick={handleBlink}
                className="absolute w-full h-full opacity-0 z-20"
              />
            )}
            <BetButton
              disabled={
                !wallet ||
                selectedFace.length == 0 ||
                isRolling ||
                (coinData && coinData[0].amount < 0.0001)
                  ? true
                  : false
              }
              onClickFunction={diceRoll}
            >
              {isRolling ? <Loader /> : "BET"}
            </BetButton>
          </div>
          <BetSetting betSetting={rollType} setBetSetting={setRollType} />
          <div className="w-full flex flex-col">
            <FormProvider {...methods}>
              <form
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(diceRoll)}
              >
                {/* amt input  */}
                <BetAmount betAmt={betAmt} setBetAmt={setBetAmt} />
                {rollType === "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <div className="mb-0 flex w-full flex-col">
                      <div className="mb-1 flex w-full items-center justify-between text-sm font-changa text-opacity-90">
                        <label className="text-white/90 font-medium font-changa">
                          Number of Bets
                        </label>
                      </div>

                      <div
                        className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
                      >
                        <input
                          id={"count-input"}
                          {...methods.register("betCount", {
                            required: "Bet count is required",
                          })}
                          type={"number"}
                          step={"any"}
                          autoComplete="off"
                          onChange={handleCountChange}
                          placeholder={"00"}
                          value={betCount}
                          className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8]  font-chakra placeholder-opacity-40 outline-none`}
                        />
                        <span
                          className="text-2xl font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-0.5 px-3"
                          onClick={() =>
                            setBetCount(coinData ? coinData[0]?.amount : 0)
                          }
                        >
                          <BsInfinity />
                        </span>
                      </div>

                      <span
                        className={`${
                          methods.formState.errors["amount"]
                            ? "opacity-100"
                            : "opacity-0"
                        } mt-1.5 flex items-center gap-1 text-xs text-[#D92828]`}
                      >
                        {methods.formState.errors["amount"]
                          ? methods.formState.errors[
                              "amount"
                            ]!.message!.toString()
                          : "NONE"}
                      </span>
                    </div>
                    <div
                      onClick={() => {
                        setShowAutoModal(true);
                      }}
                      className="mb-[1.4rem] rounded-md w-full h-11 flex items-center justify-center opacity-75 cursor-pointer text-white text-opacity-90 border-2 border-white bg-white bg-opacity-0 hover:bg-opacity-5"
                    >
                      Configure Auto
                    </div>
                  </div>
                )}
                <div className="w-full relative hidden md:flex mt-2">
                  {selectedFace.length === 0 && (
                    <div
                      onClick={handleBlink}
                      className="absolute w-full h-full opacity-0 z-20"
                    />
                  )}
                  <BetButton
                    disabled={
                      !wallet ||
                      selectedFace.length == 0 ||
                      isRolling ||
                      (coinData && coinData[0].amount < 0.0001)
                        ? true
                        : false
                    }
                    onClickFunction={diceRoll}
                  >
                    {isRolling ? <Loader /> : "BET"}
                  </BetButton>
                </div>
              </form>
            </FormProvider>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <>
          <div className="w-full flex justify-between items-center">
            <div>
              {isRolling ? (
                <div className="font-chakra text-sm font-medium text-white text-opacity-75">
                  Rolling the dice...
                </div>
              ) : (
                <div className="font-chakra text-sm font-medium text-white text-opacity-75">
                  {selectedFace.length === 0
                    ? "Choose Upto 5 Faces"
                    : `${selectedFace.length
                        .toString()
                        .padStart(2, "0")}/05 faces`}
                </div>
              )}
            </div>
            <div>
              {betResults.map((result, index) => (
                <Image
                  key={index}
                  src={`/assets/${
                    result.isWin ? "winDiceFace" : "lossDiceFace"
                  }${result.face}.png`}
                  width={15}
                  height={15}
                  alt={`Dice face ${result.face}`}
                  className={`mr-2 inline-block w-[15px] h-[15px] sm:w-[20px] sm:h-[20px] md:w-[30px] md:h-[30px] ${
                    selectedFace.includes(result.face) ? "selected-face" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative w-full my-16 md:my-20">
            {/* win pointer  */}
            <div
              className={`${
                showPointer ? "opacity-100" : "opacity-0"
              } transition-all duration-300 h-4 bg-transparent flex w-full`}
            >
              <div
                ref={topWinPointerRef}
                className="absolute -top-[1rem] z-[10] transition-all ease-in-out duration-300"
              >
                <WinPointer
                  className={`relative ${
                    selectedFace.includes(strikeFace)
                      ? "text-fomo-green"
                      : "text-fomo-red"
                  }`}
                />
              </div>
            </div>

            {/* ghost pointers  */}
            <div className="w-full flex items-center justify-around absolute -top-[1rem] opacity-0">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div
                  key={num}
                  id={`ghost-win-pointer-${num}`}
                  ref={(el) =>
                    (ghostWinPointerRefs.current[num - 1] = el || null)
                  }
                >
                  <WinPointer className="relative text-[#282E3D]" />
                </div>
              ))}
            </div>

            <div className="w-full bg-[#282E3D] rounded-full h-1 md:h-2 flex items-end justify-around">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <DicePointer
                  key={num}
                  className="relative w-2 h-2 md:w-3 md:h-3 top-1.5 text-[#282E3D]"
                />
              ))}
            </div>
            <div className="w-full flex items-end justify-around  mt-3 md:mt-4">
              <DiceFace
                selectedFace={selectedFace}
                selectedFaces={selectedFaces}
                diceNumber={1}
                Icon={Dice1}
                strikeFace={strikeFace}
                handleClick={handleDiceClick}
              />
              <DiceFace
                selectedFace={selectedFace}
                selectedFaces={selectedFaces}
                diceNumber={2}
                Icon={Dice2}
                strikeFace={strikeFace}
                handleClick={handleDiceClick}
              />
              <DiceFace
                selectedFace={selectedFace}
                selectedFaces={selectedFaces}
                diceNumber={3}
                Icon={Dice3}
                strikeFace={strikeFace}
                handleClick={handleDiceClick}
              />
              <DiceFace
                selectedFace={selectedFace}
                selectedFaces={selectedFaces}
                diceNumber={4}
                Icon={Dice4}
                strikeFace={strikeFace}
                handleClick={handleDiceClick}
              />
              <DiceFace
                selectedFace={selectedFace}
                selectedFaces={selectedFaces}
                diceNumber={5}
                Icon={Dice5}
                strikeFace={strikeFace}
                handleClick={handleDiceClick}
              />
              <DiceFace
                selectedFace={selectedFace}
                selectedFaces={selectedFaces}
                diceNumber={6}
                Icon={Dice6}
                strikeFace={strikeFace}
                handleClick={handleDiceClick}
              />
            </div>
          </div>

          <GameFooterInfo
            multiplier={winningPays}
            amount={winningAmount * (1 - ROLL_TAX)}
            chance={winningProbability}
          />
        </>
      </GameDisplay>
      <GameTable>
        <HistoryTable refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}

function DiceFace({
  selectedFaces,
  selectedFace,
  strikeFace,
  diceNumber,
  handleClick,
  Icon,
}: {
  selectedFaces: {
    [key: number]: boolean;
  };
  selectedFace: number[];
  strikeFace: number;
  diceNumber: number;
  handleClick: (number: number) => void;
  Icon: any;
}) {
  return (
    <div onClick={() => handleClick(diceNumber)}>
      <Icon
        className={`${
          selectedFaces[diceNumber]
            ? selectedFace.includes(diceNumber)
              ? strikeFace === diceNumber
                ? "text-fomo-green" // Use winning dice face image if strikeFace is 1
                : "text-[#94A3B8]" // Use selected dice face image if face 1 is selected but not strikeFace
              : "text-[#202329] hover:text-[#47484A] hover:duration-75" // Use regular dice face image if face 1 is not selected
            : strikeFace === diceNumber
            ? "text-fomo-red" // Use losing dice face image if strikeFace is 1 and face 1 is not selected
            : "text-[#202329] hover:text-[#47484A] hover:duration-75" // Use regular dice face image if face 1 is not selected and strikeFace is not 1
        } cursor-pointer w-10 h-10 md:w-12 md:h-12 transition-all duration-300 ease-in-out dice-face-icon-${diceNumber}`}
      />
    </div>
  );
}
