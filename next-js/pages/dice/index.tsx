import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { loopSound, soundAlert } from "@/utils/soundUtils";
import Bets from "../../components/games/Bets";
import AutoCount from "@/components/AutoCount";
import ConfigureAutoButton from "@/components/ConfigureAutoButton";
import {
  errorCustom,
  successCustom,
  warningCustom,
} from "@/components/toasts/ToastGroup";
import { formatNumber, rollDice, translator } from "@/context/transactions";
import { useSession } from "next-auth/react";
import { GameType } from "@/utils/provably-fair";

export default function Dice() {
  const methods = useForm();

  const {
    selectedCoin,
    getBalance,
    setShowAutoModal,
    sidebar,
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
    houseEdge,
    maxBetAmt,
    language,
    updatePNL,
    enableSounds,
    session,
    betAmtError,
  } = useGlobalContext();

  const [userInput, setUserInput] = useState<number | undefined>();
  const [betAmt, setBetAmt] = useState<number | undefined>();

  const [isRolling, setIsRolling] = useState(false);
  const [winningPays, setWinningPays] = useState(0.0);
  const [profit, setProfit] = useState(0.0);
  const [winningProbability, setWinningProbability] = useState(0.0);
  const [refresh, setRefresh] = useState(true);
  const [selectedFace, setSelectedFace] = useState<number[]>([1]);
  const [selectedFaces, setSelectedFaces] = useState<{
    [key: number]: boolean;
  }>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  });
  const [strikeFace, setStrikeFace] = useState<number>(0);
  const [betType, setbetType] = useState<"manual" | "auto">("manual");
  const [betResults, setBetResults] = useState<
    { face: number; win: boolean }[]
  >([]);
  const [showPointer, setShowPointer] = useState<boolean>(false);

  const pointerAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleDiceClick = (newFace: number) => {
    if (!startAuto && !isRolling) {
      setStrikeFace(0);
      setShowPointer(false);
      if (selectedFace.length >= 5 && !selectedFace.includes(newFace)) {
        errorCustom(translator("You can only select up to 5 faces", language));
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
          const multiplier = 6 / newLength;
          setWinningPays(multiplier);
          setProfit((betAmt ?? 0) * (multiplier * (1 - houseEdge) - 1));
          setWinningProbability((newLength * 100) / 6);
        } else {
          setSelectedFace(selectedFace.filter((face) => face !== newFace));
          const newLength = selectedFace.length - 1;
          if (newLength === 0) {
            setWinningPays(0.0);
            setProfit(0.0);
            setWinningProbability(0.0);
          } else {
            const multiplier = 6 / newLength;
            setWinningPays(multiplier);
            setProfit((betAmt ?? 0) * (multiplier * (1 - houseEdge) - 1));
            setWinningProbability((newLength * 100) / 6);
          }
        }
      }
    }
  };

  useEffect(() => {
    const newLength = selectedFace.length;
    if (newLength === 0) {
      setWinningPays(0.0);
      setProfit(0.0);
      setWinningProbability(0.0);
    } else {
      const multiplier = 6 / newLength;
      setWinningPays(multiplier);
      setProfit((betAmt ?? 0) * (multiplier * (1 - houseEdge) - 1));
      setWinningProbability((newLength * 100) / 6);
    }
  }, [betAmt]);

  const diceRoll = async () => {
    // console.log(
    //   "betting",
    //   autoWinChange,
    //   autoLossChange,
    //   autoWinChangeReset,
    //   autoLossChangeReset,
    //   autoStopProfit,
    //   autoStopLoss,
    //   startAuto,
    //   autoBetCount,
    //   autoBetProfit,
    //   betAmt,
    //   maxBetAmt,
    // );
    try {
      if (betAmtError) {
        throw new Error(translator("Invalid amount!!", language));
      }

      if (!session?.user?.isWeb2User && selectedCoin.tokenMint === "SUPER") {
        throw new Error(
          translator("You cannot bet with this token!", language),
        );
      }
      if (!betAmt || betAmt === 0) {
        throw new Error(translator("Set Amount.", language));
      }
      if (selectedCoin && selectedCoin.amount < betAmt) {
        throw new Error(translator("Insufficient balance for bet!", language));
      }
      if (selectedFace.length === 0) {
        throw new Error(translator("Choose at least 1 face.", language));
      }
      setIsRolling(true);
      const res = await rollDice(
        session,
        betAmt,
        selectedCoin.tokenMint,
        selectedFace,
      );

      if (res.success != true) {
        throw new Error(translator(res?.message, language));
      }

      if (res.success) {
        const { strikeNumber, result, amountWon } = res.data;
        const isWin = result === "Won";

        updatePNL(GameType.dice, isWin, betAmt, winningPays);

        if (isWin) {
          soundAlert("/sounds/win.wav", !enableSounds);
          successCustom(
            translator(res?.message, language) +
              ` ${formatNumber(amountWon)} ${selectedCoin?.tokenName}`,
          );
        } else {
          errorCustom(translator(res?.message, language));
        }
        const newBetResults = [
          ...(betResults.length <= 4 ? betResults : betResults.slice(-4)),
          { face: strikeNumber, win: isWin },
        ];
        setBetResults(newBetResults);
        setShowPointer(true);
        setStrikeFace(strikeNumber);
        setRefresh(true);

        loopSound("/sounds/diceshake.wav", 0.3, !enableSounds);

        // auto options
        if (betType === "auto") {
          if (useAutoConfig && isWin) {
            setBetAmt(
              autoWinChangeReset
                ? userInput!
                : betAmt + ((autoWinChange ?? 0) * betAmt) / 100.0,
            );
          } else if (useAutoConfig && !isWin) {
            setBetAmt(
              autoLossChangeReset
                ? userInput!
                : betAmt + ((autoLossChange ?? 0) * betAmt) / 100.0,
            );
          }
          // update profit / loss
          setAutoBetProfit(
            autoBetProfit +
              (isWin ? winningPays * (1 - houseEdge) - 1 : -1) * betAmt,
          );
          // update count
          if (typeof autoBetCount === "number") {
            setAutoBetCount(autoBetCount > 0 ? autoBetCount - 1 : 0);
            autoBetCount === 1 &&
              warningCustom(
                translator("Auto bet stopped", language),
                "top-left",
              );
          } else
            setAutoBetCount(
              autoBetCount.length > 12
                ? autoBetCount.slice(0, 5)
                : autoBetCount + 1,
            );
        }
      } else {
        throw new Error(
          translator(res?.message ?? "Could not make the Bet.", language),
        );
      }
    } catch (e: any) {
      console.log("caught error", isRolling);
      errorCustom(
        translator(e?.message ?? "Could not make the Bet.", language),
      );
      setIsRolling(false);
      setAutoBetCount(0);
      setStartAuto(false);
      console.error("Error occurred while rolling the dice:", e);
    }
    setIsRolling(false);
  };

  useEffect(() => {
    if (refresh && session?.user) {
      getBalance();
      setRefresh(false);
    }
  }, [session?.user, refresh]);

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
    setPointerPosition();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", setPointerPosition);

      return () => {
        window.removeEventListener("resize", setPointerPosition);
      };
    }
  }, [setPointerPosition]);

  const handleBlink = () => {
    // console.log("blink");
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

  useEffect(() => {
    setBetAmt(userInput);
  }, [userInput]);

  useEffect(() => {
    // console.log(
    //   betType,
    //   startAuto,
    //   autoBetCount,
    //   typeof autoBetCount === "string" &&
    //     autoBetCount.toString().includes("inf"),
    // );
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

        // console.log("Current bet amount:", betAmt);
        // console.log("Auto loss change:", autoLossChange);
        // console.log("Auto profit change:", autoWinChange);
        // console.log("Potential loss:", potentialLoss);
      }
      if (
        useAutoConfig &&
        autoStopProfit &&
        autoBetProfit > 0 &&
        autoBetProfit >= autoStopProfit
      ) {
        setTimeout(() => {
          warningCustom(
            translator("Profit limit reached.", language),
            "top-left",
          );
        }, 500);
        setAutoBetCount(0);
        setStartAuto(false);
        return;
      }
      if (
        useAutoConfig &&
        autoStopLoss &&
        autoBetProfit < 0 &&
        potentialLoss < -autoStopLoss
      ) {
        setTimeout(() => {
          warningCustom(
            translator("Loss limit reached.", language),
            "top-left",
          );
        }, 500);
        setAutoBetCount(0);
        setStartAuto(false);
        return;
      }
      diceRoll();
    } else {
      setStartAuto(false);
      setAutoBetProfit(0);
      setUserInput(betAmt);
    }
  }, [startAuto, autoBetCount]);

  const onSubmit = async (data: any) => {
    if (betType === "auto") {
      if (betAmt === 0) {
        errorCustom(translator("Set Amount.", language));
        return;
      }
      if (typeof autoBetCount === "number" && autoBetCount <= 0) {
        errorCustom(translator("Set Bet Count.", language));
        return;
      }
      if (
        (typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0)
      ) {
        // console.log("Auto betting. config: ", useAutoConfig);
        setStartAuto(true);
      }
    } else if (session?.user && selectedFace.length > 0) diceRoll();
  };

  const disableInput = useMemo(() => {
    return betType === "auto" && startAuto ? true : false || isRolling;
  }, [betType, startAuto, isRolling]);

  return (
    <GameLayout title="Dice">
      <GameOptions>
        <>
          <div className="w-full relative flex lg:hidden mb-[1.4rem]">
            {selectedFace.length === 0 && (
              <div
                onClick={handleBlink}
                className="absolute w-full h-full opacity-0 z-20"
              />
            )}
            {startAuto && (
              <div
                onClick={() => {
                  soundAlert("/sounds/betbutton.wav", !enableSounds);
                  warningCustom(
                    translator("Auto bet stopped", language),
                    "top-left",
                  );
                  setAutoBetCount(0);
                  setStartAuto(false);
                }}
                className="cursor-pointer rounded-lg absolute w-full h-full z-20 bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
              >
                {translator("STOP", language)}
              </div>
            )}
            <BetButton
              betAmt={betAmt}
              disabled={selectedFace.length === 0 || isRolling ? true : false}
              onClickFunction={onSubmit}
            >
              {isRolling ? <Loader /> : "BET"}
            </BetButton>
          </div>
          {betType === "auto" && (
            <div className="w-full flex lg:hidden">
              <ConfigureAutoButton disabled={disableInput} />
            </div>
          )}
          <div className="w-full hidden lg:flex">
            <BetSetting
              betSetting={betType}
              setBetSetting={setbetType}
              disabled={disableInput}
            />
          </div>
          <div className="w-full flex flex-col">
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
                  currentMultiplier={winningPays}
                  leastMultiplier={6 / 5}
                  game="dice"
                  disabled={disableInput}
                />
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
                <div className="w-full relative hidden lg:flex">
                  {selectedFace.length === 0 && (
                    <div
                      onClick={handleBlink}
                      className="absolute w-full h-full opacity-0 z-20"
                    />
                  )}
                  {startAuto && (
                    <div
                      onClick={() => {
                        soundAlert("/sounds/betbutton.wav", !enableSounds);
                        warningCustom(
                          translator("Auto bet stopped", language),
                          "top-left",
                        );
                        setAutoBetCount(0);
                        setStartAuto(false);
                      }}
                      className="cursor-pointer rounded-lg absolute w-full h-full z-20 bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
                    >
                      {translator("STOP", language)}
                    </div>
                  )}
                  <BetButton
                    betAmt={betAmt}
                    disabled={
                      selectedFace.length === 0 || isRolling ? true : false
                    }
                    // onClickFunction={onSubmit}
                  >
                    {isRolling ? <Loader /> : "BET"}
                  </BetButton>
                </div>
              </form>
            </FormProvider>
            <div className="w-full flex lg:hidden">
              <BetSetting betSetting={betType} setBetSetting={setbetType} />
            </div>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <>
          <div className="w-full flex justify-between items-center h-7">
            <div>
              {isRolling ? (
                <div className="font-chakra text-sm font-medium text-white text-opacity-75">
                  {translator("Rolling the dice", language)}...
                </div>
              ) : (
                <div className="font-chakra text-sm font-medium text-white text-opacity-75">
                  {selectedFace.length === 0
                    ? translator("Choose Upto 5 Faces", language)
                    : `${selectedFace.length
                        .toString()
                        .padStart(2, "0")}/0${translator("5 Faces", language)}`}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {betResults.map((result, index) => (
                <div
                  key={index}
                  className={`${
                    result.win ? "text-fomo-green" : "text-fomo-red"
                  }`}
                >
                  {result.face === 1 && <Dice1 className="w-7 h-7" />}
                  {result.face === 2 && <Dice2 className="w-7 h-7" />}
                  {result.face === 3 && <Dice3 className="w-7 h-7" />}
                  {result.face === 4 && <Dice4 className="w-7 h-7" />}
                  {result.face === 5 && <Dice5 className="w-7 h-7" />}
                  {result.face === 6 && <Dice6 className="w-7 h-7" />}
                </div>
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
                  //@ts-ignore
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
            amount={betAmt ? betAmt : 0}
            chance={winningProbability}
          />
        </>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />
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
  const { enableSounds } = useGlobalContext();
  return (
    <div
      onClick={() => {
        handleClick(diceNumber);
        soundAlert("/sounds/betbutton.wav", !enableSounds);
      }}
    >
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
