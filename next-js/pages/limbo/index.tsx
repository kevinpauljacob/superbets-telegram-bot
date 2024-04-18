import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import HistoryTable from "@/components/games/Limbo/HistoryTable";
import Image from "next/image";
import { FormProvider, useForm } from "react-hook-form";
import { useGlobalContext } from "@/components/GlobalContext";
import BetSetting from "@/components/BetSetting";
import {
  GameDisplay,
  GameLayout,
  GameOptions,
  GameTable,
} from "@/components/GameLayout";
import { MultiplierChanceDisplay } from "@/components/games/Limbo/MultiplierChanceDisplay";
import Spinner from "@/components/Spinner";
import { MultiplierHistory } from "@/components/games/Limbo/MultiplierHistory";
import { limboBet } from "@/context/gameTransactions";
import BetAmount from "@/components/games/BetAmountInput";

export default function Limbo() {
  const wallet = useWallet();
  const methods = useForm();

  const { coinData, getBalance, getWalletBalance, setShowWalletModal } =
    useGlobalContext();

  const [user, setUser] = useState<any>(null);
  const [betAmt, setBetAmt] = useState(0.2);
  const [betCount, setBetCount] = useState(0);

  const [deposit, setDeposit] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);

  const [betSetting, setBetSetting] = useState<"manual" | "auto">("manual");

  const [multiplier, setMultiplier] = useState(1.01);
  const [lastMultipliers, setLastMultipliers] = useState<number[]>([]);
  const [targetMultiplier, setTargetMultiplier] = useState(1.01);
  const duration = 200;

  const [inputMultiplier, setInputMultiplier] = useState(2.0);

  useEffect(() => {
    const increment = (targetMultiplier - multiplier) / (duration / 16);
    const timer = setInterval(() => {
      setMultiplier((prevNumber) => {
        let nextNumber = prevNumber + increment;
        // nextNumber = parseFloat(nextNumber.toFixed(2));

        if (increment > 0)
          return nextNumber >= targetMultiplier ? targetMultiplier : nextNumber;
        else
          return nextNumber <= targetMultiplier ? targetMultiplier : nextNumber;
      });
    }, 16);

    return () => clearInterval(timer);
  }, [targetMultiplier, multiplier]);

  const bet = async () => {
    setMultiplier(1.01);
    setTargetMultiplier(1.01);
    try {
      console.log("Placing Flip");
      // function to place bet
      const response = await limboBet(
        wallet,
        betAmt,
        parseFloat((100 / inputMultiplier).toFixed(8)),
      );
      if (!response.success) throw response.message;

      const winningMultiplier = parseFloat(
        (100 / response.strikeNumber).toFixed(2),
      );
      setLastMultipliers((prev) => {
        const newValues = [winningMultiplier, ...prev];
        return newValues.slice(0, 4);
      });

      setDeposit(false);
      setFlipping(false);
      setLoading(false);
      setTargetMultiplier(winningMultiplier);
      setResult(response.result);
      setRefresh(true);
    } catch (e) {
      toast.error("Could not make Flip.");
      setDeposit(false);
      setFlipping(false);
      setLoading(false);
      setResult(null);
    }
  };

  const onSubmit = async () => {
    if (!wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    if (betAmt === 0) {
      toast.error("Set Amount.");
      return;
    }
    if (inputMultiplier < 1.01) {
      toast.error("Input multiplier should be atleast 1.01");
      return;
    }

    setLoading(true);
    setDeposit(false);
    setTimeout(() => {
      bet();
    }, 300);
  };

  const onSubmitAutoBet = async (numOfBets: number) => {
    if (!wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    if (betAmt === 0) {
      toast.error("Set Amount.");
      return;
    }
    if (inputMultiplier < 1.01) {
      toast.error("Input multiplier should be atleast 1.01");
      return;
    }
    setLoading(true);
    setDeposit(false);
    try {
      for (let i = 0; i < numOfBets; i++) {
        console.log("i", i);
        await onSubmit();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (err: any) {
      console.log(err);
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (deposit) {
      // console.log("deposit", deposit);
      setLoading(true);
      !result && setFlipping(true);
    }
  }, [deposit]);

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
  // useEffect(() => {
  //   console.log("depo Bet type: ", betType);
  //   console.log("depo Others: ", loading, flipping, deposit);
  // }, [deposit]);

  useEffect(() => {
    if (refresh && wallet?.publicKey) {
      getBalance();
      getWalletBalance();
      setRefresh(false);
    }
  }, [wallet?.publicKey, refresh]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBetAmt(parseFloat(e.target.value));
  };

  const handleCountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBetCount(parseFloat(e.target.value));
  };

  return (
    <GameLayout title="FOMO - Limbo">
      <GameOptions>
        <>
          <BetSetting betSetting={betSetting} setBetSetting={setBetSetting} />

          {betSetting == "manual" ? (
            <div className="w-full flex flex-col">
              <FormProvider {...methods}>
                <form
                  className="flex w-full flex-col gap-0"
                  autoComplete="off"
                  onSubmit={methods.handleSubmit(onSubmit)}
                >
                  {/* amt input  */}
                  <BetAmount betAmt={betAmt} setBetAmt={setBetAmt} />

                  {/* balance alert  */}
                  {(!coinData || (coinData && coinData[0].amount < 0.0001)) && (
                    <div className="mb-5 w-full rounded-lg bg-[#0C0F16] px-3 pb-2 pt-4 text-white md:px-6">
                      <div className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
                        Please deposit funds to start playing. View{" "}
                        <u
                          onClick={() => {
                            setShowWalletModal(true);
                          }}
                        >
                          WALLET
                        </u>
                      </div>
                    </div>
                  )}
                </form>
                {/* choosing bet options  */}
                <div className="flex flex-col w-full gap-4">
                  {loading ? (
                    <div className="mb-0 flex w-full flex-col items-center rounded-lg bg-[#202329] px-4 pb-4 pt-2">
                      {deposit ? (
                        flipping ? (
                          // while getting flip result
                          <div className="flex w-full flex-col items-center justify-center">
                            <Spinner color="white" />
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              Deposit Confirmed
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              ...
                            </span>
                          </div>
                        ) : (
                          // after getting flip result
                          <div className="flex w-full flex-col items-center justify-center">
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              {result && result === "Won"
                                ? "yay..."
                                : "ooops..."}
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              {result && result === "Won"
                                ? "You Won!"
                                : "You Lost!"}
                            </span>
                            <button
                              onClick={() => {
                                setMultiplier(1.0);
                                setLoading(false);
                                setResult(null);
                                setDeposit(false);
                                setFlipping(false);
                                setBetAmt(0);
                              }}
                              className="mt-2 w-full rounded-[5px] bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] px-5 py-2 font-changa font-semibold text-white text-opacity-90 shadow-[0_5px_10px_rgba(0,0,0,0.3)]"
                            >
                              Bet Again
                            </button>
                          </div>
                        )
                      ) : (
                        loading && (
                          // when making bet request
                          <div className="flex w-full flex-col items-center justify-center">
                            <Spinner color="white" />
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              preparing for flip
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              Confirming deposit...
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={
                        coinData && coinData[0].amount < 0.0001 ? true : false
                      }
                      onClick={onSubmit}
                      className={`${
                        coinData && coinData[0].amount < 0.0001
                          ? "cursor-not-allowed opacity-70"
                          : "hover:opacity-90"
                      } w-full rounded-lg bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] py-2.5 font-changa text-xl text-white`}
                    >
                      BET
                    </button>
                  )}
                </div>
              </FormProvider>
            </div>
          ) : (
            <div className="w-full flex flex-col">
              <FormProvider {...methods}>
                <form
                  className="flex w-full flex-col gap-0"
                  autoComplete="off"
                  onSubmit={methods.handleSubmit(onSubmit)}
                >
                  <div className="mb-0 flex w-full flex-col">
                    <div className="mb-1 flex w-full items-center justify-between">
                      <label className="text-xs text-[#F0F0F0] text-opacity-75">
                        Bet amount
                      </label>
                      <span className="text-sm text-[#F0F0F0] text-opacity-75">
                        Available :{" "}
                        {coinData ? coinData[0]?.amount.toFixed(4) : 0}
                      </span>
                    </div>

                    <div
                      className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
                    >
                      <input
                        id={"amount-input"}
                        {...methods.register("amount", {
                          required: "Amount is required",
                        })}
                        type={"number"}
                        step={"any"}
                        autoComplete="off"
                        onChange={handleChange}
                        placeholder={"Amount"}
                        value={betAmt}
                        className={`flex w-full min-w-0 bg-transparent text-sm text-white placeholder-white  placeholder-opacity-40 outline-none`}
                      />
                      <span
                        className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-1.5 px-4"
                        onClick={() =>
                          setBetAmt(coinData ? coinData[0]?.amount : 0)
                        }
                      >
                        MAX
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
                  <div className="w-full flex flex-row items-end gap-3">
                    <div className="mb-0 flex w-full flex-col">
                      <div className="mb-1 flex w-full items-center justify-between">
                        <label className="text-xs text-[#F0F0F0] text-opacity-75">
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
                          className={`flex w-full min-w-0 bg-transparent text-sm text-white placeholder-white  placeholder-opacity-40 outline-none`}
                        />
                        <span
                          className="text-xs font-medium text-white text-opacity-50 bg-[#292C32] hover:bg-[#47484A] focus:bg-[#47484A] transition-all rounded-[5px] py-1.5 px-4"
                          onClick={() =>
                            setBetCount(coinData ? coinData[0]?.amount : 0)
                          }
                        >
                          MAX
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
                    <div className="mb-[1.4rem] rounded-md w-full h-11 flex items-center justify-center opacity-75 cursor-pointer text-white text-opacity-90 border-2 border-white bg-white bg-opacity-0 hover:bg-opacity-5">
                      Configure Auto
                    </div>
                  </div>
                </form>
                {/* choosing bet options  */}
                <div className="flex flex-col w-full gap-4">
                  {loading ? (
                    <div className="mb-0 flex w-full flex-col items-center rounded-lg bg-[#C20FC5] bg-opacity-10 px-4 pb-4 pt-2">
                      {deposit ? (
                        flipping ? (
                          // while getting flip result
                          <div className="flex w-full flex-col items-center justify-center">
                            <Spinner color="white" />
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              Deposit Confirmed
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              Flipping the coin...
                            </span>
                          </div>
                        ) : (
                          // after getting flip result
                          <div className="flex w-full flex-col items-center justify-center">
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              {result && result === "Won"
                                ? "yay..."
                                : "ooops..."}
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              {result && result === "Won"
                                ? "You Won!"
                                : "You Lost!"}
                            </span>
                            <button
                              onClick={() => {
                                setLoading(false);
                                setResult(null);
                                setDeposit(false);
                                setFlipping(false);
                                setBetAmt(0);
                              }}
                              className="mt-2 w-full rounded-[5px] border border-[#F200F21A] bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] px-5 py-2 font-changa font-semibold text-white text-opacity-90 shadow-[0_5px_10px_rgba(0,0,0,0.3)]"
                            >
                              Bet Again
                            </button>
                          </div>
                        )
                      ) : (
                        loading && (
                          // when making bet request
                          <div className="flex w-full flex-col items-center justify-center">
                            <Spinner color="white" />
                            <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                              preparing for flip
                            </span>
                            <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                              Confirming deposit...
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={
                        coinData && coinData[0].amount < 0.0001 ? true : false
                      }
                      onClick={() => onSubmitAutoBet(betCount)}
                      className={`${
                        coinData && coinData[0].amount < 0.0001
                          ? "cursor-not-allowed opacity-70"
                          : "hover:opacity-90"
                      } w-full rounded-lg bg-[#7839C5] hover:bg-[#9361d1] focus:bg-[#602E9E] py-2.5 font-lilita text-xl text-white`}
                    >
                      BET
                    </button>
                  )}
                </div>
              </FormProvider>
            </div>
          )}
        </>
      </GameOptions>
      <GameDisplay>
        <div className="flex flex-col justify-end h-full w-full gap-6 md:gap-0">
          <div className="grid w-full h-full">
            <div className="grid place-items-center">
              <div className="bg-[#1E2024] py-4 px-4 md:px-0 md:py-10 md:mt-0 md:w-1/4 md:h-1/4 place-content-center text-center rounded-md">
                <span
                  className={`${
                    result
                      ? multiplier === 1.01
                        ? "text-white"
                        : multiplier >= inputMultiplier
                        ? "text-[#72F238]"
                        : "text-[#F1323E]"
                      : "text-white"
                  } font-changa inline-block transition-transform duration-200 ease-out text-4xl md:text-6xl`}
                >
                  {multiplier.toFixed(2)}x
                </span>
              </div>
            </div>
          </div>
          <MultiplierChanceDisplay
            multiplier={inputMultiplier}
            setMultiplier={setInputMultiplier}
          />
          <MultiplierHistory
            multiplierHistory={lastMultipliers}
            inputMultiplier={inputMultiplier}
          />
        </div>
      </GameDisplay>
      <GameTable>
        <HistoryTable refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
