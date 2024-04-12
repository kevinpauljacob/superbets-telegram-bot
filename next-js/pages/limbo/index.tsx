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

  const [multiplier, setMultiplier] = useState(1.0);
  const [lastMultipliers, setLastMultipliers] = useState<number[]>([]);
  const [targetMultiplier, setTargetMultiplier] = useState(1.0);
  const duration = 500;

  useEffect(() => {
    const increment = (targetMultiplier - multiplier) / (duration / 16); // 16ms is about 60fps
    const timer = setInterval(() => {
      setMultiplier((prevNumber) => {
        const nextNumber = prevNumber + increment;
        return nextNumber >= targetMultiplier ? targetMultiplier : nextNumber;
      });
    }, 16);

    return () => clearInterval(timer);
  }, [multiplier, duration, targetMultiplier]);

  const bet = async () => {
    try {
      setMultiplier(1.0);
      console.log("Placing Flip");
      const result = Math.random() * 10;
      setLastMultipliers((prev) => [result, prev[0], prev[1], prev[2]]);

      // function to place bet here

      setDeposit(false);
      setFlipping(false);
      setLoading(false);
      setTargetMultiplier(result);
    } catch (e) {
      toast.error("Could not make Flip.");

      setDeposit(false);
      setFlipping(false);
      setLoading(false);
      setResult(null);
    }
  };

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

    setLoading(true);
    setDeposit(false);
    setTimeout(() => {
      setLoading(false);
      setDeposit(true);
      bet();
    }, 2000);
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
                  <div className="mb-0 flex w-full flex-col">
                    <div className="mb-1 flex w-full items-center justify-between text-sm font-changa font-medium">
                      <label className="text-[#F0F0F0] text-opacity-90">
                        Bet amount
                      </label>
                      <span className="text-[#94A3B8] text-opacity-90">
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
                        className={`flex w-full min-w-0 bg-transparent text-base text-white font-chakra placeholder-white  placeholder-opacity-40 outline-none`}
                      />
                      <span
                        className="bg-[#D9D9D9] bg-opacity-5 py-1 px-1.5 rounded text-xs font-semibold text-[#F0F0F0] text-opacity-50"
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
                            <Image
                              src={"/assets/coin.png"}
                              width={50}
                              height={50}
                              alt=""
                              className="rotate mb-2"
                            />
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
                        className="bg-[#D9D9D9] bg-opacity-5 py-1 px-1.5 rounded text-sm text-[#F0F0F0] text-opacity-75"
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
                          className="bg-[#D9D9D9] bg-opacity-5 py-1 px-1.5 rounded text-sm text-[#F0F0F0] text-opacity-75"
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
                      onClick={onSubmit}
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
        <>
          <div className="grid w-full h-full">
            <div className="grid place-items-center">
              <div className="bg-[#1E2024] md:w-1/4 md:h-1/4 place-content-center text-center rounded-md">
                <span
                  className={`${
                    multiplier >= 2
                      ? "text-[#72F238]"
                      : multiplier > 1
                      ? "text-[#F1323E]"
                      : "text-white"
                  } font-changa inline-block transition-transform duration-200 ease-out md:text-6xl`}
                >
                  {multiplier.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <MultiplierChanceDisplay />
          <MultiplierHistory multiplierHistory={lastMultipliers} />
        </>
      </GameDisplay>
      <GameTable>
        <HistoryTable refresh={refresh} />
      </GameTable>
    </GameLayout>
  );
}
