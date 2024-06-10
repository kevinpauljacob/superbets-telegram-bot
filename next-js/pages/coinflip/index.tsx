import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { FormProvider, useForm } from "react-hook-form";
import { useGlobalContext } from "@/components/GlobalContext";
import BetSetting from "@/components/BetSetting";
import {
  GameDisplay,
  GameFooterInfo,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import Loader from "@/components/games/Loader";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import Bets from "../../components/games/Bets";
import { soundAlert } from "@/utils/soundUtils";
import ConfigureAutoButton from "@/components/ConfigureAutoButton";
import AutoCount from "@/components/AutoCount";
import {
  errorCustom,
  successCustom,
  warningCustom,
} from "@/components/toasts/ToastGroup";
import { placeFlip, translator } from "@/context/transactions";
import { minGameAmount } from "@/context/gameTransactions";
import { useSession } from "next-auth/react";
import { GameType } from "@/utils/provably-fair";

const Timer = dynamic(() => import("../../components/games/Timer"), {
  ssr: false,
});
const Progress = dynamic(() => import("../../components/games/Progressbar"), {
  ssr: false,
});

export default function Flip() {
  const wallet = useWallet();
  const methods = useForm();
  const { data: session, status } = useSession();

  const {
    getBalance,
    getWalletBalance,
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
    selectedCoin,
    coinData,
    houseEdge,
    maxBetAmt,
    language,
    liveStats,
    setLiveStats,
    enableSounds,
  } = useGlobalContext();

  const [betAmt, setBetAmt] = useState<number | undefined>();
  const [userInput, setUserInput] = useState<number | undefined>();
  const [betType, setBetType] = useState<string | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);

  const [betSetting, setBetSetting] = useState<"manual" | "auto">("manual");
  const [betResults, setBetResults] = useState<
    { result: number; win: boolean }[]
  >([]);

  const bet = async () => {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error(translator("Wallet not connected", language));
      }
      if (!betAmt || betAmt === 0) {
        throw new Error(translator("Set Amount.", language));
      }
      if (selectedCoin && selectedCoin.amount < betAmt) {
        throw new Error(translator("Insufficient balance for bet !", language));
      }

      // console.log("Placing Flip");
      let response = await placeFlip(
        wallet,
        betAmt,
        selectedCoin.tokenMint,
        betType === "Heads" ? "heads" : "tails",
      );
      if (response.success !== true) {
        throw new Error(
          response?.message
            ? response?.message
            : translator("Could not make Flip.", language),
        );
      }
      setTimeout(
        () => {
          if (response.success) {
            response?.data?.result == "Won"
              ? successCustom(translator(response?.message, language))
              : errorCustom(translator(response?.message, language));

            const win = response?.data?.result === "Won";
            if (win) soundAlert("/sounds/win.wav", !enableSounds);
            const newBetResult = { result: response?.data?.strikeNumber, win };

            setBetResults((prevResults) => {
              const newResults = [...prevResults, newBetResult];
              if (newResults.length > 6) {
                newResults.shift();
              }
              return newResults;
            });

            setResult(response?.data?.result ?? "Lost");
            setRefresh(true);
            setLoading(false);
            setFlipping(false);

            setLiveStats([
              ...liveStats,
              {
                game: GameType.coin,
                amount: betAmt,
                result: win ? "Won" : "Lost",
                pnl: win ? betAmt * newBetResult.result - betAmt : -betAmt,
                totalPNL:
                  liveStats.length > 0
                    ? liveStats[liveStats.length - 1].totalPNL +
                      (win ? betAmt * newBetResult.result - betAmt : -betAmt)
                    : win
                      ? betAmt * newBetResult.result - betAmt
                      : -betAmt,
              },
            ]);

            // auto options
            if (betSetting === "auto") {
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
                autoBetProfit + (win ? 2 * (1 - houseEdge) - 1 : -1) * betAmt,
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
              response?.message
                ? response?.message
                : translator("Could not make Flip.", language),
            );
          }
        },
        betSetting === "auto" ? 500 : 3000,
      );
    } catch (e: any) {
      errorCustom(e?.message ?? translator("Could not make Flip.", language));
      setBetType(null);
      setFlipping(false);
      setLoading(false);
      setResult(null);
      setStartAuto(false);
      setAutoBetCount(0);
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
    setBetAmt(userInput);
  }, [userInput]);

  useEffect(() => {
    // console.log(
    //   "Auto: ",
    //   startAuto,
    //   autoBetCount,
    //   autoStopProfit,
    //   autoStopLoss,
    //   autoBetProfit,
    //   betAmt,
    // );
    if (
      betSetting === "auto" &&
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
      setTimeout(() => {
        setLoading(true);
        setFlipping(true);
        bet();
      }, 500);
    } else {
      setStartAuto(false);
      setAutoBetProfit(0);
      setUserInput(betAmt);
    }
  }, [startAuto, autoBetCount]);

  const onSubmit = async (data: any) => {
    if (!wallet.publicKey) {
      errorCustom(translator("Wallet not connected", language));
      return;
    }
    if (!betAmt || betAmt === 0) {
      errorCustom(translator("Set Amount.", language));
      return;
    }
    if (betType) {
      if (betSetting === "auto") {
        if (betAmt === 0) {
          errorCustom(translator("Set Amount.", language));
          return;
        }
        if (typeof autoBetCount === "number" && autoBetCount <= 0) {
          errorCustom("Set Bet Count.");
          return;
        }
        if (
          (typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
          (typeof autoBetCount === "number" && autoBetCount > 0)
        ) {
          // console.log("Auto betting. config: ", useAutoConfig);
          setStartAuto(true);
        }
      } else {
        setLoading(true);
        setFlipping(true);
        bet();
      }
    }
  };

  const disableInput = useMemo(() => {
    return betSetting === "auto" && startAuto ? true : false || loading;
  }, [betSetting, startAuto, loading]);

  return (
    <GameLayout title="Coin Flip">
      <GameOptions>
        <>
          <div className="relative w-full flex lg:hidden mb-[1.4rem]">
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
              disabled={
                !betType ||
                loading ||
                !session?.user ||
                (betAmt !== undefined &&
                  maxBetAmt !== undefined &&
                  betAmt > maxBetAmt)
                  ? true
                  : false
              }
              onClickFunction={onSubmit}
            >
              {loading ? <Loader /> : "BET"}
            </BetButton>
          </div>
          {betSetting === "auto" && (
            <div className="w-full flex lg:hidden">
              <ConfigureAutoButton disabled={disableInput} />
            </div>
          )}
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
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                {/* amt input  */}
                <BetAmount
                  betAmt={betAmt}
                  setBetAmt={setUserInput}
                  currentMultiplier={2.0}
                  leastMultiplier={2.0}
                  game="coinflip"
                  disabled={disableInput}
                />

                {betSetting === "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <AutoCount loading={flipping || startAuto} />
                    <div className="w-full hidden lg:flex">
                      <ConfigureAutoButton disabled={disableInput} />
                    </div>
                  </div>
                )}

                {/* choosing bet options  */}
                <div className="flex w-full flex-row gap-3 mb-[1.4rem]">
                  {/* buttons  */}
                  <button
                    onClick={() => {
                      setBetType("Heads");
                    }}
                    type="button"
                    disabled={disableInput}
                    className={`${
                      betType === "Heads"
                        ? "border-[#7839C5] text-opacity-100"
                        : "border-transparent hover:border-[#7839C580] text-opacity-80"
                    } w-full flex items-center disabled:opacity-50 disabled:cursor-not-allowed justify-center gap-2 rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white font-semibold`}
                  >
                    <Image
                      src={"/assets/coin.png"}
                      width={23}
                      height={23}
                      alt=""
                      className={``}
                    />
                    <span className="mt-0.5 font-chakra text-xl font-semibold">
                      {translator("Heads", language)}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setBetType("Tails");
                    }}
                    type="button"
                    disabled={disableInput}
                    className={`${
                      betType === "Tails"
                        ? "border-[#7839C5] text-opacity-100"
                        : "border-transparent hover:border-[#7839C580] text-opacity-80"
                    } w-full flex items-center disabled:opacity-50 disabled:cursor-not-allowed justify-center gap-2 rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white font-semibold`}
                  >
                    <Image
                      src={"/assets/tails.png"}
                      width={23}
                      height={23}
                      alt=""
                      className={``}
                    />
                    <span className="mt-0.5 font-chakra text-xl font-semibold">
                      {translator("Tails", language)}
                    </span>
                  </button>
                </div>
                <div className="relative w-full hidden lg:flex mb-[1.4rem]">
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
                    disabled={
                      !betType ||
                      loading ||
                      !session?.user ||
                      (betAmt !== undefined &&
                        maxBetAmt !== undefined &&
                        betAmt > maxBetAmt)
                        ? true
                        : false
                    }
                    // onClickFunction={onSubmit}
                  >
                    {loading ? <Loader /> : "BET"}
                  </BetButton>
                </div>
              </form>
            </FormProvider>
            <div className="w-full flex lg:hidden">
              <BetSetting
                betSetting={betSetting}
                setBetSetting={setBetSetting}
              />
            </div>
          </div>
        </>
      </GameOptions>
      <GameDisplay>
        <>
          <div className={`w-full flex items-center justify-between h-8`}>
            <span className="text-xs md:text-sm font-chakra font-medium text-[#f0f0f0] text-opacity-75">
              {flipping
                ? "Flipping..."
                : result
                  ? result === "Won"
                    ? translator("You Won!", language)
                    : translator("You Lost!", language)
                  : ""}
            </span>
            <div className="flex items-center gap-2">
              {betResults.map((result, index) => (
                <div
                  key={index}
                  className={`bg-[#282E3D] p-0.5 flex items-center justify-center border-2 rounded-full ${
                    result.win ? "border-fomo-green" : "border-fomo-red"
                  }`}
                >
                  {result.result === 1 && (
                    <Image
                      src={"/assets/coin.png"}
                      width={23}
                      height={23}
                      alt=""
                      className={``}
                    />
                  )}
                  {result.result === 2 && (
                    <Image
                      src={"/assets/tails.png"}
                      width={23}
                      height={23}
                      alt=""
                      className={``}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            className={`w-[11rem] h-[11rem] my-4 relative ${
              betType && loading ? "rotate" : ""
            }`}
          >
            <Image
              src={"/assets/tails.png"}
              layout="fill"
              objectFit="contain"
              objectPosition="center"
              alt=""
              className={`absolute ${
                betType && loading
                  ? "translateZ1"
                  : result
                    ? result === "Won"
                      ? betType === "Tails"
                        ? "z-[100]"
                        : "z-[10]"
                      : betType === "Tails"
                        ? "z-[10]"
                        : "z-[100]"
                    : betType === "Tails"
                      ? "z-[100]"
                      : "z-[10]"
              }`}
            />
            <Image
              src={"/assets/coin.png"}
              layout="fill"
              objectFit="contain"
              objectPosition="center"
              alt=""
              className={`absolute ${
                betType && loading
                  ? "z-[10]"
                  : result
                    ? result === "Won"
                      ? betType === "Heads"
                        ? "z-[100]"
                        : "z-[1]"
                      : betType === "Heads"
                        ? "z-[1]"
                        : "z-[100]"
                    : betType === "Heads"
                      ? "z-[100]"
                      : "z-[10]"
              }`}
            />
          </div>

          <GameFooterInfo
            multiplier={2.0}
            amount={betAmt ? betAmt : 0.0}
            chance={50}
          />
        </>
      </GameDisplay>
      <GameTable>
        <Bets refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
