import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { placeFlip } from "../../context/gameTransactions";
import HistoryTable from "../../components/games/CoinFlip/HistoryTable";
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
  } = useGlobalContext();

  const [betAmt, setBetAmt] = useState(0);
  const [userInput, setUserInput] = useState(0);
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
    console.log(
      "betting",
      autoWinChange,
      autoLossChange,
      autoWinChangeReset,
      autoLossChangeReset,
      autoStopProfit,
      autoStopLoss,
      startAuto,
      autoBetCount,
      autoBetProfit,
      betAmt,
    );
    try {
      console.log("Placing Flip");
      let response = await placeFlip(
        wallet,
        betAmt,
        betType === "Heads" ? "heads" : "tails",
      );
      if (response.success) {
        response?.data?.result == "Won"
          ? toast.success(response?.message)
          : toast.error(response?.message);

        const win = response?.data?.result === "Won";
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
                ? userInput
                : betAmt + (autoWinChange * betAmt) / 100.0,
            );
          } else if (useAutoConfig && autoLossChange && !win) {
            setAutoBetProfit(autoBetProfit - betAmt);
            setBetAmt(
              autoLossChangeReset
                ? userInput
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
    setBetAmt(userInput);
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
      setLoading(true);
      setFlipping(true);
      bet();
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
          <BetSetting betSetting={betSetting} setBetSetting={setBetSetting} />

          <div className="w-full flex flex-col">
            <FormProvider {...methods}>
              <form
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                <div className="w-full flex md:hidden mb-5">
                  <BetButton
                    disabled={
                      !betType ||
                      loading ||
                      (coinData && coinData[0].amount < 0.0001)
                        ? true
                        : false
                    }
                    onClickFunction={onSubmit}
                  >
                    {loading ? <Loader /> : "BET"}
                  </BetButton>
                </div>

                {/* amt input  */}
                <BetAmount betAmt={betAmt} setBetAmt={setBetAmt} />

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
                          value={autoBetCount}
                          className={`flex w-full min-w-0 bg-transparent text-base text-[#94A3B8] placeholder-[#94A3B8] font-chakra ${
                            autoBetCount === "inf"
                              ? "placeholder-opacity-100"
                              : "placeholder-opacity-40"
                          } placeholder-opacity-40 outline-none`}
                        />
                        <span
                          className={`text-2xl font-medium text-white text-opacity-50 ${
                            autoBetCount === "inf"
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
                      className="mb-[1.4rem] rounded-md w-full h-11 flex items-center justify-center opacity-75 cursor-pointer text-white text-opacity-90 border-2 border-white bg-white bg-opacity-0 hover:bg-opacity-5"
                    >
                      Configure Auto
                    </div>
                  </div>
                )}

                {/* balance alert  */}
                {(!coinData || (coinData && coinData[0].amount < 0.0001)) && (
                  <div className="mb-5 w-full rounded-lg bg-[#0C0F16] px-3 pb-2 pt-4 text-white md:px-6">
                    <div className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
                      Please deposit funds to start playing. View{" "}
                      <u
                        onClick={() => {
                          setShowWalletModal(true);
                        }}
                        className="cursor-pointer"
                      >
                        WALLET
                      </u>
                    </div>
                  </div>
                )}

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
                      } w-full flex items-center justify-center gap-1 rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white font-semibold`}
                    >
                      <Image
                        src={"/assets/coin.png"}
                        width={23}
                        height={23}
                        alt=""
                        className={``}
                      />
                      <span className="mt-0.5">Heads</span>
                    </div>
                    <div
                      onClick={() => {
                        setBetType("Tails");
                      }}
                      className={`${
                        betType === "Tails"
                          ? "border-[#7839C5] text-opacity-100"
                          : "border-transparent hover:border-[#7839C580] text-opacity-80"
                      } w-full flex items-center justify-center gap-1 rounded-lg text-center cursor-pointer border-2 bg-[#202329] py-2.5 font-changa text-xl text-white font-semibold`}
                    >
                      <Image
                        src={"/assets/tails.png"}
                        width={23}
                        height={23}
                        alt=""
                        className={``}
                      />
                      <span className="mt-0.5">Tails</span>
                    </div>
                  </div>
                  <div className="w-full hidden md:flex mt-2">
                    <BetButton
                      disabled={
                        !betType ||
                        loading ||
                        (coinData && coinData[0].amount < 0.0001)
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
          <div className={`w-full flex items-center justify-between`}>
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
            className={`w-[11rem] h-[11rem] relative mb-10 ${
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
                  : result === "Won"
                  ? betType === "Tails"
                    ? "z-[100]"
                    : "z-[10]"
                  : betType === "Tails"
                  ? "z-[10]"
                  : "z-[100]"
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
                  : result === "Won"
                  ? betType === "Heads"
                    ? "z-[100]"
                    : "z-[1]"
                  : betType === "Heads"
                  ? "z-[1]"
                  : "z-[100]"
              }`}
            />
          </div>
          <GameFooterInfo multiplier={2.0} amount={betAmt} chance={50} />
        </>
      </GameDisplay>
      <GameTable>
        <HistoryTable refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
