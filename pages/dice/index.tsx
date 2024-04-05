import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { rollDice } from "../../context/gameTransactions";
import RollDiceTable from "../../components/games/RollDiceTable";
import { toast } from "react-hot-toast";
import { ROLL_TAX } from "../../context/config";
import GameFooterInfo from "@/components/games/GameFooterInfo";
import BetSetting from "@/components/BetSetting";
import { useGlobalContext } from "@/components/GlobalContext";
import Head from "next/head";
import GameHeader from "@/components/GameHeader";

export default function Dice() {
  const wallet = useWallet();

  const { coinData, getBalance, getWalletBalance } = useGlobalContext();
  const [user, setUser] = useState<any>(null);
  const [betAmt, setBetAmt] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [winningPays, setWinningPays] = useState(6);
  const [winningAmount, setWinningAmount] = useState(0.6);
  const [winningProbability, setWinningProbability] = useState(16.67);
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
  >([
    // { face: 3, isWin: true },
    // { face: 1, isWin: false },
    // { face: 5, isWin: true },
    // { face: 2, isWin: true },
    // { face: 6, isWin: false },
  ]);

  const handleDiceClick = (newFace: number) => {
    setStrikeFace(0);
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
    const amount = parseFloat(event.target.value); // Convert input value to float
    setBetAmt(amount); // Update betAmt state
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
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await rollDice(wallet, betAmt, selectedFace);
        if (res.success) {
          const { strikeNumber, result } = res.data;
          const isWin = result === "Won";
          const newBetResults = [...betResults, { face: strikeNumber, isWin }];
          setBetResults(newBetResults);
          setStrikeFace(strikeNumber);
          // setSelectedFace([0]);
          // setBetAmt(0.0);
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

  return (
    <div className="flex h-full w-full flex-col items-center justify-start p-3.5 sm:p-10">
      <Head>
        <title>FOMO - Dice</title>
      </Head>
      <div className="flex flex-col-reverse xl:flex-row items-start rounded-md sm:rounded-[1.15rem] bg-[#121418] text-white w-full ">
        <div className="xl:border-r border-white/10 xl:w-[35%] w-full px-3 pb-6 pt-3 sm:p-8 xl:p-14">
          <BetSetting betSetting={rollType} setBetSetting={setRollType} />

          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2">
              <p className="font-semibold">Bet Amount</p>
              <p className="font-semibold text-[#94A3B8]">
                Available : {coinData ? coinData[0]?.amount.toFixed(4) : 0} $SOL
              </p>
            </div>
            <div
              className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] px-4`}
            >
              <input
                type={"number"}
                step={"any"}
                autoComplete="off"
                onChange={handleBetAmountChange}
                placeholder={"Amount"}
                value={betAmt}
                className={`flex w-full min-w-0 bg-transparent text-sm text-white placeholder-white  placeholder-opacity-40 outline-none`}
              />
              <span
                className="bg-[#D9D9D9] bg-opacity-5 py-1 px-1.5 rounded text-sm text-[#F0F0F0] text-opacity-75"
                onClick={() => setBetAmt(coinData ? coinData[0]?.amount : 0)}
              >
                MAX
              </span>
            </div>
          </div>
          {rollType === "auto" && (
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-2">
                <p className="font-semibold">Number of Bets</p>
              </div>
              <div className="flex justify-between">
                <div className="relative w-[48%]">
                  <input
                    className="z-0 w-full bg-[#202329] rounded-md p-2.5"
                    type="text"
                    placeholder="0.0"
                  />
                  <button className="z-10 absolute top-2.5 right-2.5 px-3  rounded-sm text-xs bg-[#d9d9d90d]">
                    <Image
                      src="/assets/infiniteLogo.png"
                      alt="Infinite Bet"
                      width={25}
                      height={25}
                    />
                  </button>
                </div>

                <button className="border-2 border-white/90 text-white/80 font-semibold rounded-md w-[48%]">
                  Configure Auto
                </button>
              </div>
            </div>
          )}
          <div>
            <button
              disabled={!wallet || selectedFace.length == 0}
              onClick={() => {
                if (!isRolling) diceRoll();
              }}
              className={`${
                !wallet || selectedFace.length == 0
                  ? "cursor-not-allowed opacity-70"
                  : "hover:opacity-90"
              } flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-[#F6F6F61A] bg-[#7839C5] py-2.5 font-changa shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]`}
            >
              {isRolling ? (
                <div>
                  <span className="font-changa text-[1.75rem] font-semibold text-white text-opacity-80">
                    ROLLING...
                  </span>
                </div>
              ) : (
                <div>
                  <span className="center font-changa text-[1.75rem] font-semibold text-white text-opacity-80">
                    BET
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
        <div className="xl:border-l border-white/10 xl:w-[65%] h-full px-3 py-3 sm:px-8 sm:pb-8 xl:p-8">
          <div className="bg-[#0C0F16] flex flex-col justify-between h-full sm:h-[450px] rounded-lg p-4 sm:p-12">
            <div className="flex justify-between items-center mb-7 sm:mb-0">
              <div>
                {isRolling ? (
                  <div className="font-changa text-xs font-semibold text-white text-opacity-80">
                    Rolling the dice...
                  </div>
                ) : (
                  <div className="font-changa text-xs font-semibold text-white text-opacity-80">
                    {selectedFace.length === 0
                      ? "Choose up to 5 faces"
                      : `${selectedFace.length
                          .toString()
                          .padStart(2, "0")}/05 faces`}
                  </div>
                )}
              </div>
              <div>
                {betResults.map((result, index) => (
                  <Image
                    key={index} // Make sure to provide a unique key
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
            <div className="relative w-full mb-8 xl:mb-6">
              <div>
                <Image
                  src="/assets/progressBar.png"
                  alt="progress bar"
                  width={900}
                  height={100}
                />
              </div>
              <div className="flex justify-around">
                <div className="flex flex-col items-center mr-2 sm:mr-0">
                  {selectedFaces[1] ? (
                    selectedFace.includes(1) ? (
                      strikeFace === 1 ? (
                        <Image
                          src="/assets/winPointer.png"
                          alt="win pointer"
                          width={20}
                          height={20}
                          className="absolute -top-[30px]"
                        />
                      ) : null
                    ) : null
                  ) : strikeFace === 1 ? (
                    <Image
                      src="/assets/lossPointer.png"
                      alt="loss pointer"
                      width={20}
                      height={20}
                      className="absolute -top-[30px]"
                    />
                  ) : null}
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={8}
                    height={8}
                    className="absolute top-[0px] w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] md:w-[13px] md:h-[13px] sm:top-[2px] md:top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[1]
                        ? selectedFace.includes(1)
                          ? strikeFace === 1
                            ? "/assets/winDiceFace1.png" // Use winning dice face image if strikeFace is 1
                            : "/assets/selectedDiceFace1.png" // Use selected dice face image if face 1 is selected but not strikeFace
                          : "/assets/diceFace1.png" // Use regular dice face image if face 1 is not selected
                        : strikeFace === 1
                        ? "/assets/lossDiceFace1.png" // Use losing dice face image if strikeFace is 1 and face 1 is not selected
                        : "/assets/diceFace1.png" // Use regular dice face image if face 1 is not selected and strikeFace is not 1
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(1) ? "selected-face" : ""
                    }`}
                    onClick={() => handleDiceClick(1)}
                  />
                </div>
                <div className="flex flex-col items-center mr-2 sm:mr-0">
                  {selectedFaces[2] ? (
                    selectedFace.includes(2) ? (
                      strikeFace === 2 ? (
                        <Image
                          src="/assets/winPointer.png"
                          alt="win pointer"
                          width={20}
                          height={20}
                          className="absolute -top-[30px]"
                        />
                      ) : null
                    ) : null
                  ) : strikeFace === 2 ? (
                    <Image
                      src="/assets/lossPointer.png"
                      alt="loss pointer"
                      width={20}
                      height={20}
                      className="absolute -top-[30px]"
                    />
                  ) : null}
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={13}
                    height={13}
                    className="absolute top-[0px] w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] md:w-[13px] md:h-[13px] sm:top-[2px] md:top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[2]
                        ? selectedFace.includes(2)
                          ? strikeFace === 2
                            ? "/assets/winDiceFace2.png" // Use winning dice face image if strikeFace is 1
                            : "/assets/selectedDiceFace2.png" // Use selected dice face image if face 1 is selected but not strikeFace
                          : "/assets/diceFace2.png" // Use regular dice face image if face 1 is not selected
                        : strikeFace === 2
                        ? "/assets/lossDiceFace2.png" // Use losing dice face image if strikeFace is 1 and face 1 is not selected
                        : "/assets/diceFace2.png" // Use regular dice face image if face 1 is not selected and strikeFace is not 1
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(2) ? "selected-face" : ""
                    }`}
                    onClick={() => handleDiceClick(2)}
                  />
                </div>
                <div className="flex flex-col items-center mr-2 sm:mr-0">
                  {selectedFaces[3] ? (
                    selectedFace.includes(3) ? (
                      strikeFace === 3 ? (
                        <Image
                          src="/assets/winPointer.png"
                          alt="win pointer"
                          width={20}
                          height={20}
                          className="absolute -top-[30px]"
                        />
                      ) : null
                    ) : null
                  ) : strikeFace === 3 ? (
                    <Image
                      src="/assets/lossPointer.png"
                      alt="loss pointer"
                      width={20}
                      height={20}
                      className="absolute -top-[30px]"
                    />
                  ) : null}
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={13}
                    height={13}
                    className="absolute top-[0px] w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] md:w-[13px] md:h-[13px] sm:top-[2px] md:top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[3]
                        ? selectedFace.includes(3)
                          ? strikeFace === 3
                            ? "/assets/winDiceFace3.png" // Use winning dice face image if strikeFace is 1
                            : "/assets/selectedDiceFace3.png" // Use selected dice face image if face 1 is selected but not strikeFace
                          : "/assets/diceFace3.png" // Use regular dice face image if face 1 is not selected
                        : strikeFace === 3
                        ? "/assets/lossDiceFace3.png" // Use losing dice face image if strikeFace is 1 and face 1 is not selected
                        : "/assets/diceFace3.png" // Use regular dice face image if face 1 is not selected and strikeFace is not 1
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(3) ? "selected-face" : ""
                    }`}
                    onClick={() => handleDiceClick(3)}
                  />
                </div>
                <div className="flex flex-col items-center mr-2 sm:mr-0">
                  {selectedFaces[4] ? (
                    selectedFace.includes(4) ? (
                      strikeFace === 4 ? (
                        <Image
                          src="/assets/winPointer.png"
                          alt="win pointer"
                          width={20}
                          height={20}
                          className="absolute -top-[30px]"
                        />
                      ) : null
                    ) : null
                  ) : strikeFace === 4 ? (
                    <Image
                      src="/assets/lossPointer.png"
                      alt="loss pointer"
                      width={20}
                      height={20}
                      className="absolute -top-[30px]"
                    />
                  ) : null}
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={13}
                    height={13}
                    className="absolute top-[0px] w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] md:w-[13px] md:h-[13px] sm:top-[2px] md:top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[4]
                        ? selectedFace.includes(4)
                          ? strikeFace === 4
                            ? "/assets/winDiceFace4.png" // Use winning dice face image if strikeFace is 1
                            : "/assets/selectedDiceFace4.png" // Use selected dice face image if face 1 is selected but not strikeFace
                          : "/assets/diceFace4.png" // Use regular dice face image if face 1 is not selected
                        : strikeFace === 4
                        ? "/assets/lossDiceFace4.png" // Use losing dice face image if strikeFace is 1 and face 1 is not selected
                        : "/assets/diceFace4.png" // Use regular dice face image if face 1 is not selected and strikeFace is not 1
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(4) ? "selected-face" : ""
                    }`}
                    onClick={() => handleDiceClick(4)}
                  />
                </div>
                <div className="flex flex-col items-center mr-2 sm:mr-0">
                  {selectedFaces[5] ? (
                    selectedFace.includes(5) ? (
                      strikeFace === 5 ? (
                        <Image
                          src="/assets/winPointer.png"
                          alt="win pointer"
                          width={20}
                          height={20}
                          className="absolute -top-[30px]"
                        />
                      ) : null
                    ) : null
                  ) : strikeFace === 5 ? (
                    <Image
                      src="/assets/lossPointer.png"
                      alt="loss pointer"
                      width={20}
                      height={20}
                      className="absolute -top-[30px]"
                    />
                  ) : null}
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={13}
                    height={13}
                    className="absolute top-[0px] w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] md:w-[13px] md:h-[13px] sm:top-[2px] md:top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[5]
                        ? selectedFace.includes(5)
                          ? strikeFace === 5
                            ? "/assets/winDiceFace5.png" // Use winning dice face image if strikeFace is 1
                            : "/assets/selectedDiceFace5.png" // Use selected dice face image if face 1 is selected but not strikeFace
                          : "/assets/diceFace5.png" // Use regular dice face image if face 1 is not selected
                        : strikeFace === 5
                        ? "/assets/lossDiceFace5.png" // Use losing dice face image if strikeFace is 1 and face 1 is not selected
                        : "/assets/diceFace5.png" // Use regular dice face image if face 1 is not selected and strikeFace is not 1
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(5) ? "selected-face" : ""
                    }`}
                    onClick={() => handleDiceClick(5)}
                  />
                </div>
                <div className="flex flex-col items-center">
                  {selectedFaces[6] ? (
                    selectedFace.includes(6) ? (
                      strikeFace === 6 ? (
                        <Image
                          src="/assets/winPointer.png"
                          alt="win pointer"
                          width={20}
                          height={20}
                          className="absolute -top-[30px]"
                        />
                      ) : null
                    ) : null
                  ) : strikeFace === 6 ? (
                    <Image
                      src="/assets/lossPointer.png"
                      alt="loss pointer"
                      width={20}
                      height={20}
                      className="absolute -top-[30px]"
                    />
                  ) : null}
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={13}
                    height={13}
                    className="absolute top-[0px] w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] md:w-[13px] md:h-[13px] sm:top-[2px] md:top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[6]
                        ? selectedFace.includes(6)
                          ? strikeFace === 6
                            ? "/assets/winDiceFace6.png" // Use winning dice face image if strikeFace is 1
                            : "/assets/selectedDiceFace6.png" // Use selected dice face image if face 1 is selected but not strikeFace
                          : "/assets/diceFace6.png" // Use regular dice face image if face 1 is not selected
                        : strikeFace === 6
                        ? "/assets/lossDiceFace6.png" // Use losing dice face image if strikeFace is 1 and face 1 is not selected
                        : "/assets/diceFace6.png" // Use regular dice face image if face 1 is not selected and strikeFace is not 1
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(6) ? "selected-face" : ""
                    }`}
                    onClick={() => handleDiceClick(6)}
                  />
                </div>
              </div>
            </div>

            <GameFooterInfo
              multiplier={winningPays}
              amount={winningAmount * (1 - ROLL_TAX)}
              chance={winningProbability}
            />
          </div>
        </div>
      </div>
      <div className="w-full flex md:hidden mt-4 rounded-[5px] overflow-hidden">
        <GameHeader />
      </div>
      <RollDiceTable refresh={refresh} />
    </div>
  );
}
