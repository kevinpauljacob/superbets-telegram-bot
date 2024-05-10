import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import BetSetting from "@/components/BetSetting";
import { useGlobalContext } from "@/components/GlobalContext";
import {
  GameDisplay,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import { FormProvider, useForm } from "react-hook-form";
import { BsInfinity } from "react-icons/bs";
import Loader from "@/components/games/Loader";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import showInfoToast from "@/components/games/toasts/toasts";
import ResultsSlider from "@/components/ResultsSlider";
import Arc from "@/components/games/Wheel/Arc";
import { riskToChance } from "@/components/games/Wheel/Segments";
import Bets from "../../components/games/Bets";
import { soundAlert } from "@/utils/soundUtils";
import ConfigureAutoButton from "@/components/ConfigureAutoButton";
import AutoCount from "@/components/AutoCount";
import ProfitBox from "@/components/ProfitBox";

export default function Wheel() {
  const wallet = useWallet();
  const methods = useForm();
  const wheelRef = useRef<HTMLDivElement>(null);
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
    houseEdge,
    maxBetAmt,
  } = useGlobalContext();
  const [betAmt, setBetAmt] = useState(0);
  const [userInput, setUserInput] = useState<number | undefined>(0);
  const [isRolling, setIsRolling] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [betType, setBetType] = useState<"manual" | "auto">("manual");
  const [strikeNumber, setStrikeNumber] = useState<number>(0);
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>();
  const [strikeMultiplierColor, setStrikeMultiplierColor] =
    useState<string>("#ffffff00");
  const [resultAngle, setResultAngle] = useState<number>(0);
  const [risk, setRisk] = useState<"low" | "medium" | "high">("low");
  const [segments, setSegments] = useState<number>(10);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [betResults, setBetResults] = useState<
    { result: number; win: boolean }[]
  >([]);
  const [hoveredMultiplier, setHoveredMultiplier] = useState<number | null>(
    null,
  );

  const multipliers = riskToChance[risk];
  console.log("multipliers", multipliers);
  const maxMultiplier = multipliers.reduce((max, item) => {
    return Math.max(max, item.multiplier);
  }, 0);

  console.log("Maximum Multiplier:", maxMultiplier);

  const sortedMultipliers = multipliers
    .slice()
    .sort((a, b) => a.multiplier - b.multiplier);

  const uniqueSegments = sortedMultipliers.filter(
    (segment, index, self) =>
      index === 0 || self[index - 1].multiplier !== segment.multiplier,
  );
  const minMultiplier = uniqueSegments[1].multiplier;
  console.log("Minimum Multiplier:", minMultiplier);
  console.log("uniqueSegments", uniqueSegments);
  const segmentFill =
    segments === 10
      ? 0
      : segments === 20
      ? 25
      : segments === 30
      ? 50
      : segments === 40
      ? 75
      : segments === 50
      ? 100
      : null;

  useEffect(() => {
    if (!wheelRef.current) return;
    const rotationAngle = 360 / segments;
    setRotationAngle(rotationAngle);
  }, [segments]);

  const getCurrentRotation = () => {
    if (wheelRef.current) {
      let transforms = wheelRef.current?.style.getPropertyValue("transform");
      if (transforms.includes("rotate")) {
        const match = transforms.match(/rotate\((-?\d+(?:\.\d+)?deg)\)/);
        if (match) return parseFloat(match[1].slice(0, -3));
      }
    }

    return 0;
  };

  const spinWheel = (strikeNumber: number) => {
    const resultAngle = ((strikeNumber - 1) * 360) / 100;
    const currentTheta = getCurrentRotation();
    const delta =
      currentTheta +
      (currentTheta % 360 === 0 ? 0 : 360 - (currentTheta % 360));
    setResultAngle(resultAngle);
    console.log("resultAngle", resultAngle, currentTheta, delta);
    if (wheelRef.current) {
      wheelRef.current.style.transition =
        "transform 3s cubic-bezier(0.4, 0, 0.2, 1)";
      wheelRef.current.style.transform = `rotate(${
        delta + 360 + 360 - resultAngle
      }deg)`;
    }
  };

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setAutoBetCount(parseFloat(e.target.value));
  };

  const handleBetAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const amount = parseFloat(event.target.value); // Convert input value to float
    setBetAmt(amount); // Update betAmt state
  };

  const handleBet = async () => {
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
      setStrikeNumber(0);
      try {
        const response = await fetch(`/api/games/wheel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet: wallet.publicKey,
            amount: betAmt,
            tokenMint: "SOL",
            segments: segments,
            risk: risk,
          }),
        });

        const { success, message, result, strikeNumber, strikeMultiplier } =
          await response.json();

        spinWheel(strikeNumber);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        if (success != true) {
          toast.error(message);
          throw new Error(message);
        }
        setIsRolling(false);
        //set strikeMultiplier color
        const riskObjects = riskToChance[risk];
        const riskObject = riskObjects.find(
          (obj) => obj.multiplier === strikeMultiplier,
        );
        setStrikeMultiplierColor(riskObject ? riskObject.color : "#ffffff");
        if (result == "Won") {
          toast.success(message, { duration: 2000 });
          soundAlert("/sounds/win.wav");
        } else toast.error(message, { duration: 2000 });

        const win = result === "Won";
        const newBetResult = { result: strikeMultiplier, win };

        setBetResults((prevResults) => {
          const newResults = [...prevResults, newBetResult];
          if (newResults.length > 5) {
            newResults.shift();
          }
          return newResults;
        });

        if (success) {
          setStrikeNumber(strikeNumber);
          setStrikeMultiplier(strikeMultiplier);
          console.log("strikeNumber", strikeNumber);
          setRefresh(true);
        }

        // auto options
        if (betType === "auto") {
          if (useAutoConfig && autoWinChange && win) {
            setBetAmt(
              autoWinChangeReset
                ? userInput!
                : betAmt + (autoWinChange * betAmt) / 100.0,
            );
          } else if (useAutoConfig && autoLossChange && !win) {
            setAutoBetProfit(autoBetProfit - betAmt);
            setBetAmt(
              autoLossChangeReset
                ? userInput!
                : betAmt + (autoLossChange * betAmt) / 100.0,
            );
          }
          // update profit / loss
          setAutoBetProfit(
            autoBetProfit +
              (win ? strikeMultiplier * (1 - houseEdge) - 1 : -1) * betAmt,
          );
          // update count
          if (typeof autoBetCount === "number")
            setAutoBetCount(autoBetCount > 0 ? autoBetCount - 1 : 0);
          else setAutoBetCount(autoBetCount + 1);
        }
      } catch (error) {
        setIsRolling(false);
        setAutoBetCount(0);
        setStartAuto(false);
        console.error("Error occurred while betting:", error);
      }
    }
  };

  useEffect(() => {
    if (refresh && wallet?.publicKey) {
      getBalance();
      getWalletBalance();
      setRefresh(false);
    }
  }, [wallet?.publicKey, refresh]);

  useEffect(() => {
    setBetAmt(userInput ?? 0);
  }, [userInput]);

  useEffect(() => {
    console.log("Auto: ", startAuto, autoBetCount);
    if (
      betType === "auto" &&
      startAuto &&
      ((typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0))
    ) {
      if (
        useAutoConfig &&
        autoStopProfit &&
        autoBetProfit > 0 &&
        autoBetProfit >= autoStopProfit
      ) {
        showInfoToast("Profit limit reached.");
        return;
      }
      if (
        useAutoConfig &&
        autoStopLoss &&
        autoBetProfit < 0 &&
        autoBetProfit <= -autoStopLoss
      ) {
        showInfoToast("Loss limit reached.");
        return;
      }
      setTimeout(() => {
        handleBet();
      }, 200);
    } else {
      setStartAuto(false);
      setAutoBetProfit(0);
    }
  }, [startAuto, autoBetCount]);

  const onSubmit = async (data: any) => {
    if (
      betType === "auto" &&
      ((typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0))
    ) {
      if (betAmt === 0) {
        toast.error("Set Amount.");
        return;
      }
      console.log("Auto betting. config: ", useAutoConfig);
      setStartAuto(true);
    } else if (wallet.connected) handleBet();
  };

  const disableInput = useMemo(() => {
    return betType === "auto" && startAuto ? true : false||isRolling;
  }, [betType, startAuto,isRolling]);

  return (
    <GameLayout title="FOMO - Wheel">
      <GameOptions>
        <>
          <div className="relative w-full flex lg:hidden mb-[1.4rem]">
            {startAuto && (
              <div
                onClick={() => {
                  setAutoBetCount(0);
                  setStartAuto(false);
                }}
                className="cursor-pointer rounded-lg absolute w-full h-full z-20 bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
              >
                STOP
              </div>
            )}
            <BetButton
              disabled={
                !wallet ||
                isRolling ||
                (typeof autoBetCount === "number" && autoBetCount <= 0) ||
                (typeof autoBetCount === "string" &&
                  !autoBetCount.includes("inf")) ||
                (coinData && coinData[0].amount < 0.0001) ||
                (betAmt !== undefined &&
                  maxBetAmt !== undefined &&
                  betAmt > maxBetAmt)
                  ? true
                  : false
              }
              onClickFunction={onSubmit}
            >
              {isRolling ? <Loader /> : "BET"}
            </BetButton>
          </div>
          <div className="w-full flex lg:hidden">
            <ConfigureAutoButton />
          </div>
          <div className="w-full hidden lg:flex">
            <BetSetting
              betSetting={betType}
              setBetSetting={setBetType}
              disabled={disableInput}
            />
          </div>
          <div className="w-full flex flex-col no-scrollbar overflow-y-auto">
            <FormProvider {...methods}>
              <form
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                {/* amt input  */}
                <BetAmount
                  betAmt={userInput}
                  setBetAmt={setUserInput}
                  currentMultiplier={maxMultiplier}
                  leastMultiplier={minMultiplier}
                  game="wheel"
                  disabled={disableInput}
                />
                <div className="mb-4">
                  <ProfitBox multiplier={maxMultiplier} amount={userInput!} />
                </div>
                <div className="mb-6 w-full">
                  <div className="flex justify-between text-xs mb-2">
                    <p className="font-medium font-changa text-[#F0F0F0] text-opacity-90">
                      Risk
                    </p>
                  </div>
                  <div className="flex lg:flex-row flex-col gap-2.5 w-full items-center justify-evenly rounded-[8px] text-white font-chakra text-sm font-semibold bg-[#0C0F16] p-4">
                    <div className="flex lg:w-[66.66%] w-full gap-2.5">
                      <button
                        onClick={() => setRisk("low")}
                        type="button"
                        className={`text-center w-full rounded-[5px] border-[2px] disabled:cursor-not-allowed disabled:opacity-50 bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                          risk === "low"
                            ? "border-[#7839C5]"
                            : "border-transparent hover:border-[#7839C580]"
                        }`}
                        disabled={disableInput}
                      >
                        Low
                      </button>
                      <button
                        onClick={() => setRisk("medium")}
                        type="button"
                        className={`text-center w-full rounded-[5px] border-[2px] disabled:cursor-not-allowed disabled:opacity-50 bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                          risk === "medium"
                            ? "border-[#7839C5]"
                            : "border-transparent hover:border-[#7839C580]"
                        }`}
                        disabled={disableInput}
                      >
                        Medium
                      </button>
                    </div>
                    <button
                      onClick={() => setRisk("high")}
                      type="button"
                      className={`text-center lg:w-[33.33%] w-full rounded-[5px] border-[2px] disabled:cursor-not-allowed disabled:opacity-50 bg-[#202329] py-2 text-xs font-chakra text-white text-opacity-90 transition duration-200 ${
                        risk === "high"
                          ? "border-[#7839C5]"
                          : "border-transparent hover:border-[#7839C580]"
                      }`}
                      disabled={disableInput}
                    >
                      High
                    </button>
                  </div>
                </div>

                <div className="mb-6 w-full">
                  <div className="flex justify-between text-xs mb-2 font-medium font-changa text-[#F0F0F0] text-opacity-90">
                    <p className="">Segments</p>
                    <p className="text-[#94A3B8] text-sm">{segments}</p>
                  </div>
                  <div className="relative h-[5px] rounded-full bg-[#2A2E38] w-full mt-5">
                    <input
                      type="range"
                      min={10}
                      max={50}
                      step={10}
                      disabled={isRolling || startAuto || disableInput}
                      value={segments}
                      onChange={(e) => setSegments(parseInt(e.target.value))}
                      className="defaultSlider absolute top-[-8px] w-full bg-transparent appearance-none z-20 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div
                      className="absolute rounded-l-full h-[5px] bg-[#9945ff] z-10"
                      style={{ width: `${segmentFill}%` }}
                    ></div>
                  </div>
                </div>
                {betType === "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <AutoCount
                      loading={isRolling || startAuto}
                      onChange={handleCountChange}
                    />
                    <div className="w-full hidden lg:flex">
                      <ConfigureAutoButton />
                    </div>
                  </div>
                )}

                <div className="relative w-full hidden lg:flex mt-2">
                  {startAuto && (
                    <div
                      onClick={() => {
                        setAutoBetCount(0);
                        setStartAuto(false);
                      }}
                      className="rounded-lg absolute w-full h-full z-20 bg-[#442c62] hover:bg-[#7653A2] focus:bg-[#53307E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white"
                    >
                      STOP
                    </div>
                  )}
                  <BetButton
                    disabled={
                      !wallet ||
                      isRolling ||
                      (coinData && coinData[0].amount < 0.0001) ||
                      (betAmt !== undefined &&
                        maxBetAmt !== undefined &&
                        betAmt > maxBetAmt)
                        ? true
                        : false
                    }
                    onClickFunction={onSubmit}
                  >
                    {isRolling ? <Loader /> : "BET"}
                  </BetButton>
                </div>
              </form>
            </FormProvider>
            <div className="w-full flex lg:hidden">
              <BetSetting betSetting={betType} setBetSetting={setBetType} />
            </div>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <div className="w-full flex justify-between items-center h-4">
          <div>
            {isRolling ? (
              <div className="font-chakra text-sm font-medium text-white text-opacity-75">
                Betting...
              </div>
            ) : null}
          </div>
        </div>
        <div className="hidden sm:block absolute right-3 lg:right-6">
          <ResultsSlider results={betResults} align={"vertical"} />
        </div>
        <div className="flex justify-center items-center w-full my-5">
          <div className="relative w-[20rem] h-[20rem] md:w-[25rem] md:h-[25rem] flex justify-center">
            <Image
              src="/assets/wheelPointer.svg"
              alt="Pointer"
              width={35}
              height={35}
              id="pointer"
              className={`${
                isRolling
                  ? "-rotate-[20deg] delay-[500ms] duration-500"
                  : "rotate-0 duration-200"
              } absolute z-50 -top-3 transition-all ease-[cubic-bezier(0.4,0,0.2,1)]`}
            />
            <div
              ref={wheelRef}
              className={`${
                isRolling ? "" : ""
              } relative w-[20rem] h-[20rem] md:w-[25rem] md:h-[25rem] rounded-full overflow-hidden`}
            >
              {typeof window !== "undefined" && (
                <svg viewBox="0 0 300 300">
                  {rotationAngle &&
                    Array.from({ length: segments }).map((_, index) => (
                      <Arc
                        key={index}
                        index={index}
                        rotationAngle={rotationAngle}
                        risk={risk}
                        segments={segments}
                      />
                    ))}
                </svg>
              )}
            </div>
            <div className="absolute z-10 w-[93%] h-[93%] rounded-full border-[0.7rem] border-black/20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute z-20 w-[77%] h-[77%] rounded-full bg-[#828998] bg-opacity-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            <div
              className={`absolute z-20 w-[71%] h-[71%] rounded-full bg-[#0C0F16] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl flex items-center justify-center font-semibold font-chakra text-opacity-80`}
              style={{ color: strikeMultiplierColor }}
            >
              {strikeMultiplier}x
            </div>
          </div>
        </div>
        <div className="relative flex w-full justify-between px-0 xl:px-4 mb-0 px:mb-6 gap-4">
          {coinData && coinData[0].amount > 0.0001 && (
            <>
              {uniqueSegments.map((segment, index) => {
                const backgroundColor = segment.color; // Store segment.color in a separate variable
                return (
                  <div
                    key={index}
                    className="relative w-full"
                    onMouseEnter={() =>
                      setHoveredMultiplier(segment.multiplier)
                    }
                    onMouseLeave={() => setHoveredMultiplier(null)}
                  >
                    <div
                      className="w-full border-t-[6px] text-center font-chakra font-semibold text-xs text-white rounded-md transition-all duration-300 ease-in-out px-1.5 md:px-5 py-2.5"
                      style={{
                        backgroundColor:
                          strikeMultiplier === segment.multiplier
                            ? `${backgroundColor}50`
                            : "#202329",
                        borderColor: segment.color,
                      }}
                    >
                      {segment.multiplier}x
                    </div>

                    {hoveredMultiplier === segment.multiplier && (
                      <div className="absolute top-[-120px] left-0 z-50 flex gap-4 text-white bg-[#202329] border border-white/10 rounded-lg w-full p-4 fadeInUp duration-100 min-w-[250px]">
                        <div className="w-1/2">
                          <div className="flex justify-between text-[13px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                            <span className="">Profit</span>
                            <span>
                              {/* {coinData ? coinData[0]?.amount.toFixed(4) : 0} $SOL */}
                              SOL
                            </span>
                          </div>
                          <div className="border border-white/10 rounded-lg p-3 mt-2">
                            {coinData
                              ? (
                                  coinData[0]?.amount * segment.multiplier
                                ).toFixed(4)
                              : 0}
                          </div>
                        </div>
                        <div className="w-1/2">
                          <div className="text-[13px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                            Chance
                          </div>
                          <div className="border border-white/10 rounded-lg p-3 mt-2">
                            {segment.chance}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
          {!coinData ||
            (coinData[0].amount < 0.0001 && (
              <div className="w-full rounded-lg bg-[#d9d9d90d] bg-opacity-10 flex items-center px-3 py-3 text-white md:px-6">
                <div className="w-full text-center font-changa font-medium text-sm md:text-base text-[#F0F0F0] text-opacity-75">
                  Please deposit funds to start playing. View{" "}
                  <Link href="/balance">
                    <u>WALLET</u>
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
