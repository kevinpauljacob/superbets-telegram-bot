import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { placeFlip } from "../../context/gameTransactions";
import HistoryTable from "../../components/games/CoinFlip/VerifyFlipModal";
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
import { BsInfinity } from "react-icons/bs";
import Loader from "@/components/games/Loader";
import BetAmount from "@/components/games/BetAmountInput";
import BetButton from "@/components/games/BetButton";
import ResultsSlider from "@/components/ResultsSlider";
import showInfoToast from "@/components/games/toasts/toasts";
import BalanceAlert from "@/components/games/BalanceAlert";
import Bets from "../../components/games/Bets";
import { soundAlert } from "@/utils/soundUtils";

const Timer = dynamic(() => import("../../components/games/Timer"), {
  ssr: false,
});
const Progress = dynamic(() => import("../../components/games/Progressbar"), {
  ssr: false,
});

export default function Flip() {
  const wallet = useWallet();
  const methods = useForm();

  const {
    coinData,
    getBalance,
    getWalletBalance,
    setShowWalletModal,
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
      console.log("Placing Flip");
      let response = await placeFlip(
        wallet,
        betAmt,
        betType === "Heads" ? "heads" : "tails",
      );
      setTimeout(
        () => {
          if (response.success) {
            response?.data?.result == "Won"
              ? toast.success(response?.message)
              : toast.error(response?.message);

            const win = response?.data?.result === "Won";
            if (win) soundAlert("/sounds/win.wav");
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

            // auto options
            if (betSetting === "auto") {
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
              setAutoBetProfit(autoBetProfit + (win ? 1 : -1) * betAmt);
              // update count
              if (typeof autoBetCount === "number")
                setAutoBetCount(autoBetCount - 1);
              else setAutoBetCount(autoBetCount + 1);
            }
          } else {
            setBetType(null);
            setLoading(false);
            setFlipping(false);
            setResult(null);
            response?.message && toast.error(response?.message);
          }
        },
        betSetting === "auto" ? 500 : 3000,
      );
    } catch (e) {
      toast.error("Could not make Flip.");
      setBetType(null);
      setFlipping(false);
      setLoading(false);
      setResult(null);
    }
  };

  // useEffect(() => {
  //   console.log("Bet type: ", betType);
  //   console.log("Others: ", loading, flipping, deposit);
  // }, [betType]);
  // useEffect(() => {
  //   console.log("load Bet type: ", betType);
  //   console.log("load Others: ", loading, flipping, deposit);
  // }, [loading]);
  // useEffect(() => {
  //   console.log("flip Bet type: ", betType);
  //   console.log("flip Others: ", loading, flipping, deposit);
  // }, [flipping]);

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
      betSetting === "auto" &&
      startAuto &&
      ((typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
        (typeof autoBetCount === "number" && autoBetCount > 0))
    ) {
      if (useAutoConfig && autoStopProfit && autoBetProfit <= autoStopProfit) {
        showInfoToast("Profit limit reached.");
        return;
      }
      if (useAutoConfig && autoStopLoss && autoBetProfit >= -1 * autoStopLoss) {
        showInfoToast("Loss limit reached.");
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
    }
  }, [startAuto, autoBetCount]);

  const onSubmit = async (data: any) => {
    console.log(data);
    if (!wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    if (betAmt === 0) {
      toast.error("Set Amount.");
      return;
    }
    if (betType) {
      if (
        betSetting === "auto" &&
        ((typeof autoBetCount === "string" && autoBetCount.includes("inf")) ||
          (typeof autoBetCount === "number" && autoBetCount > 0))
      ) {
        if (betAmt === 0) {
          toast.error("Set Amount.");
          return;
        }
        console.log("Auto betting. config: ", useAutoConfig);
        setStartAuto(true);
      } else {
        setLoading(true);
        setFlipping(true);
        bet();
      }
    }
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBetAmt(parseFloat(e.target.value));
  };

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setAutoBetCount(parseFloat(e.target.value));
  };

  return (
    <GameLayout title="FOMO - Coin Flip">
      <GameOptions>
        <>
          <div className="relative w-full flex md:hidden mb-5">
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
                !betType ||
                loading ||
                (coinData && coinData[0].amount < 0.0001) ||
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

          <BetSetting betSetting={betSetting} setBetSetting={setBetSetting} />

          <div className="w-full flex flex-col">
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
                  currentMultiplier={2.0}
                  leastMultiplier={2.0}
                  game="coinflip"
                />

                {betSetting === "manual" ? (
                  <></>
                ) : (
                  <div className="w-full flex flex-row items-end gap-3">
                    <div className="mb-0 flex w-full flex-col">
                      <div className="mb-1 flex w-full items-center justify-between text-xs font-changa text-opacity-90">
                        <label className="text-white/90 font-changa">
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
                          placeholder={
                            autoBetCount.toString().includes("inf")
                              ? "Infinity"
                              : "00"
                          }
                          disabled={loading || startAuto}
                          value={autoBetCount}
                          className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra ${
                            autoBetCount.toString().includes("inf")
                              ? "placeholder-opacity-100"
                              : "placeholder-opacity-40"
                          } placeholder-opacity-40 outline-none`}
                        />
                        <span
                          className={`text-2xl font-medium text-white text-opacity-50 ${
                            autoBetCount.toString().includes("inf")
                              ? "bg-[#47484A]"
                              : "bg-[#292C32]"
                          } hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-0.5 px-3`}
                          onClick={() => setAutoBetCount("inf")}
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
                      className="relative mb-[1.4rem] rounded-md w-full h-11 flex items-center justify-center opacity-75 cursor-pointer font-sans font-medium text-sm text-white text-opacity-90 border-2 border-white bg-white bg-opacity-0 hover:bg-opacity-5"
                    >
                      Configure Auto
                      <div
                        className={`${
                          useAutoConfig ? "bg-fomo-green" : "bg-fomo-red"
                        } absolute top-0 right-0 m-1.5 bg-fomo-green w-2 h-2 rounded-full`}
                      />
                    </div>
                  </div>
                )}

                {/* balance alert  */}
                <BalanceAlert />

                {/* choosing bet options  */}
                <div className="flex flex-col w-full gap-4">
                  <div className="flex w-full flex-row gap-3">
                    {/* buttons  */}
                    <div
                      onClick={() => {
                        setBetType("Heads");
                      }}
                      className={`${
                        betType === "Heads"
                          ? "border-[#7839C5] text-opacity-100"
                          : "border-transparent hover:border-[#7839C580] text-opacity-80"
                      } w-full flex items-center justify-center gap-2 rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white font-semibold`}
                    >
                      <Image
                        src={"/assets/coin.png"}
                        width={23}
                        height={23}
                        alt=""
                        className={``}
                      />
                      <span className="mt-0.5 font-chakra text-xl font-semibold">
                        Heads
                      </span>
                    </div>
                    <div
                      onClick={() => {
                        setBetType("Tails");
                      }}
                      className={`${
                        betType === "Tails"
                          ? "border-[#7839C5] text-opacity-100"
                          : "border-transparent hover:border-[#7839C580] text-opacity-80"
                      } w-full flex items-center justify-center gap-2 rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white font-semibold`}
                    >
                      <Image
                        src={"/assets/tails.png"}
                        width={23}
                        height={23}
                        alt=""
                        className={``}
                      />
                      <span className="mt-0.5 font-chakra text-xl font-semibold">
                        Tails
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full hidden md:flex mb-5">
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
                        !betType ||
                        loading ||
                        (coinData && coinData[0].amount < 0.0001) ||
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
                </div>
              </form>
            </FormProvider>
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
                  ? "You Won!"
                  : "You Lost!"
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
        {/* <HistoryTable refresh={refresh} /> */}
        <Bets refresh={refresh} game={"coinflip"} />
      </GameTable>
    </GameLayout>
  );
}
