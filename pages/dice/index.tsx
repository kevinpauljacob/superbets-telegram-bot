import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { rollDice } from "../../context/gameTransactions";
import RollDiceTable from "../../components/games/RollDiceTable";
import { toast } from "react-hot-toast";
import { ROLL_TAX } from "../../context/config";
import GameFooterInfo from "@/components/games/GameFooterInfo";

export default function Dice() {
  const wallet = useWallet();

  const [user, setUser] = useState<any>(null);
  const [betAmt, setBetAmt] = useState(0.1);
  const [selectedFace, setSelectedFace] = useState<number[]>([1]);
  const [isRolling, setIsRolling] = useState(true);
  const [winningPays, setWinningPays] = useState(6);
  const [winningAmount, setWinningAmount] = useState(0.6);
  const [winningProbability, setWinningProbability] = useState(16.67);
  const [refresh, setRefresh] = useState(false);
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
  const [rollType, setRollType] = useState<"manual" | "auto">("manual");

  const handleDiceClick = (newFace: number) => {
    setSelectedFaces((prevState) => ({
      ...prevState,
      [newFace]: !prevState[newFace],
    }));
    if (1 <= newFace && newFace <= 6) {
      if (!selectedFace.includes(newFace)) {
        if (selectedFace.length == 5) {
          toast.error("You can only select upto 5 faces");
          return;
        }
        setSelectedFace([...selectedFace, newFace]);
        setWinningPays(6 / (selectedFace.length + 1));
        setWinningAmount((betAmt * 6) / (selectedFace.length + 1));
        setWinningProbability(((selectedFace.length + 1) * 100) / 6);
      } else {
        setSelectedFace(selectedFace.filter((face) => face !== newFace));
        if (selectedFace.length == 1) {
          setWinningPays(6);
          setWinningAmount(betAmt * 6);
          setWinningProbability((selectedFace.length * 100) / 6);
        } else {
          setWinningPays(6 / (selectedFace.length - 1));
          setWinningAmount((betAmt * 6) / (selectedFace.length - 1));
          setWinningProbability(((selectedFace.length - 1) * 100) / 6);
        }
      }
    }
  };

  const diceRoll = async () => {
    if (wallet.connected) {
      if (user.deposit[0].amount < betAmt) {
        toast.error("Insufficient balance for bet !");
        return;
      }
      setIsRolling(true);
      await new Promise((r) => setTimeout(r, 5000));
      let res;
      try {
        res = await rollDice(wallet, betAmt, selectedFace);
      } catch (e) {
        setIsRolling(false);
        return;
      }

      if (res.success) {
        setSelectedFace([1]);
        setBetAmt(0.1);
        setRefresh(!refresh);
      }
      setIsRolling(false);
    }
  };

  useEffect(() => {
    if (!wallet?.publicKey) return;

    fetch(`/api/user/getUser?wallet=${wallet.publicKey.toBase58()}`)
      .then((res) => res.json())
      .then((res) => {
        // console.log(res);
        if (res.success) {
          //   console.log(res.data);
          setUser(res.data);
        }
      });
  }, [wallet?.publicKey, refresh]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-start p-10">
      <div className="flex flex-col xl:flex-row items-center rounded-[1.15rem] bg-[#121418] text-white w-full">
        <div className="xl:border-r border-white/10 xl:w-[35%] w-full p-6 sm:p-8 xl:p-14">
          <div className="flex mb-8">
            <button
              className={`w-full border-2 rounded-md py-1 mr-1 border-[#d9d9d90d] transition duration-300 ease-in-out ${
                rollType === "manual" ? "bg-[#d9d9d90d]" : ""
              }`}
              onClick={() => setRollType("manual")}
            >
              Manual
            </button>
            <button
              className={`w-full border-2 rounded-md py-1 ml-1 border-[#d9d9d90d] transition duration-300 ease-in-out ${
                rollType === "auto" ? "bg-[#d9d9d90d] " : ""
              }`}
              onClick={() => setRollType("auto")}
            >
              Auto
            </button>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2">
              <p className="font-semibold">Bet Amount</p>
              <p className="font-semibold text-[#94A3B8]">0.00 $SOL</p>
            </div>
            <div className="relative">
              <input
                className="z-0 w-full bg-[#202329] rounded-md p-2.5"
                type="text"
                placeholder="0.0"
              />
              <button className="z-10 absolute top-2.5 right-2.5 px-3 py-1 rounded-sm text-xs bg-[#d9d9d90d]">
                Max
              </button>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-semibold mb-2">Choose upto 5 faces</p>
            <div className="bg-[#0C0F16] rounded-md flex justify-center p-4 mb-4">
              <div className="mr-2">
                <Image
                  src={
                    selectedFaces[1]
                      ? "/assets/selectedDiceFace1.png"
                      : "/assets/diceFace1.png"
                  }
                  width={45}
                  height={45}
                  alt=""
                  className={`${
                    selectedFace.includes(1) ? "selected-face" : ""
                  }`}
                  onClick={() => handleDiceClick(1)}
                />
              </div>
              <div className="mr-2">
                <Image
                  src={
                    selectedFaces[2]
                      ? "/assets/selectedDiceFace2.png"
                      : "/assets/diceFace2.png"
                  }
                  width={45}
                  height={45}
                  alt=""
                  className={`${
                    selectedFace.includes(2) ? "selected-face" : ""
                  }`}
                  onClick={() => handleDiceClick(2)}
                />
              </div>
              <div className="mr-2">
                <Image
                  src={
                    selectedFaces[3]
                      ? "/assets/selectedDiceFace3.png"
                      : "/assets/diceFace3.png"
                  }
                  width={45}
                  height={45}
                  alt=""
                  className={`${
                    selectedFace.includes(3) ? "selected-face" : ""
                  }`}
                  onClick={() => handleDiceClick(3)}
                />
              </div>
              <div className="mr-2">
                <Image
                  src={
                    selectedFaces[4]
                      ? "/assets/selectedDiceFace4.png"
                      : "/assets/diceFace4.png"
                  }
                  width={45}
                  height={45}
                  alt=""
                  className={`${
                    selectedFace.includes(4) ? "selected-face" : ""
                  }`}
                  onClick={() => handleDiceClick(4)}
                />
              </div>
              <div className="mr-2">
                <Image
                  src={
                    selectedFaces[5]
                      ? "/assets/selectedDiceFace5.png"
                      : "/assets/diceFace5.png"
                  }
                  width={45}
                  height={45}
                  alt=""
                  className={`${
                    selectedFace.includes(5) ? "selected-face" : ""
                  }`}
                  onClick={() => handleDiceClick(5)}
                />
              </div>
              <div className="">
                <Image
                  src={
                    selectedFaces[6]
                      ? "/assets/selectedDiceFace6.png"
                      : "/assets/diceFace6.png"
                  }
                  width={45}
                  height={45}
                  alt=""
                  className={`${
                    selectedFace.includes(6) ? "selected-face" : ""
                  }`}
                  onClick={() => handleDiceClick(6)}
                />
              </div>
            </div>
          </div>
          <p className="bg-black mb-5 rounded-md text-center text-xs py-1.5 text-[#F0F0F0]">
            Please deposit funds to start playing. View{" "}
            <span className="underline">WALLET</span>
          </p>
          <div>
            <button
              disabled={!wallet || selectedFace.length == 0}
              onClick={() => {
                if (!isRolling) diceRoll();
              }}
              className={`${
                !user || !wallet || selectedFace.length == 0
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
          {/* <span className="mb-1 mr-0 font-changa text-xs font-medium text-[#F0F0F0] text-opacity-75">
            sol balance: {user && user.deposit[0].amount.toFixed(4)}
          </span> */}
          {/* <div className="mb-2 mt-2 flex items-end gap-2">
            <Image src={"/assets/dice.png"} width={50} height={50} alt="" />
            <span className="text-shadow-pink font-lilita text-[2.5rem] font-medium leading-10 text-white text-opacity-90">
              DICE TO WIN
            </span>
          </div> */}
          {/* <span className="mb-4 mt-4 font-changa text-xl font-medium text-[#FFFFFF] text-opacity-75">
            Roll a dice
          </span> */}
          {/* <div className="mb-4 flex w-full flex-col rounded-lg bg-[#C20FC5] bg-opacity-10 px-3 pb-4 pt-2 md:px-6">
            <span className="mb-3 w-full text-center font-changa text-[#F0F0F0] text-opacity-75">
              Select Amount
            </span>
            <div className="mb-3 flex flex-col items-center gap-2.5 md:flex-row">
              <button
                onClick={() => {
                  setBetAmt(0.001);
                  setWinningAmount((0.1 * 6) / selectedFace.length);
                }}
                className={`${
                  betAmt === 0.1
                    ? "bg-[#F200F2]"
                    : "bg-transparent hover:bg-[#6C0671]"
                } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
              >
                0.1 $SOL
              </button>
              <button
                onClick={() => {
                  setBetAmt(0.25);
                  setWinningAmount((0.25 * 6) / selectedFace.length);
                }}
                className={`${
                  betAmt === 0.25
                    ? "bg-[#F200F2]"
                    : "bg-transparent hover:bg-[#6C0671]"
                } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
              >
                0.25 $SOL
              </button>
              <button
                onClick={() => {
                  setBetAmt(0.5);
                  setWinningAmount((0.5 * 6) / selectedFace.length);
                }}
                className={`${
                  betAmt === 0.5
                    ? "bg-[#F200F2]"
                    : "bg-transparent hover:bg-[#6C0671]"
                } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
              >
                0.5 $SOL
              </button>
            </div>
          </div> */}
        </div>
        <div className="xl:w-[65%] h-full px-6 pb-6 sm:px-8 sm:pb-8 xl:pb-0 xl:px-8">
          <div className="bg-[#0C0F16] flex flex-col justify-between h-full sm:h-[400px] rounded-md p-4 sm:p-12">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div>
                {isRolling ? (
                  <div className="font-changa text-sm font-semibold text-white text-opacity-80">
                    Rolling the dice...
                  </div>
                ) : (
                  ""
                )}
              </div>
              <div className="bg-[#0C0F16] rounded-md flex justify-center p-4 mb-4">
                <Image
                  src={
                    selectedFaces[1]
                      ? "/assets/activeDiceFace1.png"
                      : "/assets/diceFace1.png"
                  }
                  width={30}
                  height={30}
                  alt=""
                  className={`mr-2 inline-block ${
                    selectedFace.includes(1) ? "selected-face" : ""
                  }`}
                />
                <Image
                  src={
                    selectedFaces[2]
                      ? "/assets/activeDiceFace2.png"
                      : "/assets/diceFace2.png"
                  }
                  width={30}
                  height={30}
                  alt=""
                  className={`mr-2 inline-block ${
                    selectedFace.includes(2) ? "selected-face" : ""
                  }`}
                />
                <Image
                  src={
                    selectedFaces[3]
                      ? "/assets/activeDiceFace3.png"
                      : "/assets/diceFace3.png"
                  }
                  width={30}
                  height={30}
                  alt=""
                  className={`mr-2 inline-block ${
                    selectedFace.includes(3) ? "selected-face" : ""
                  }`}
                />
                <Image
                  src={
                    selectedFaces[4]
                      ? "/assets/activeDiceFace4.png"
                      : "/assets/diceFace4.png"
                  }
                  width={30}
                  height={30}
                  alt=""
                  className={`mr-2 inline-block ${
                    selectedFace.includes(4) ? "selected-face" : ""
                  }`}
                />
                <Image
                  src={
                    selectedFaces[5]
                      ? "/assets/activeDiceFace5.png"
                      : "/assets/diceFace5.png"
                  }
                  width={30}
                  height={30}
                  alt=""
                  className={`mr-2 inline-block ${
                    selectedFace.includes(5) ? "selected-face" : ""
                  }`}
                />
                <Image
                  src={
                    selectedFaces[6]
                      ? "/assets/activeDiceFace6.png"
                      : "/assets/diceFace6.png"
                  }
                  width={30}
                  height={30}
                  alt=""
                  className={`mr-2 inline-block ${
                    selectedFace.includes(6) ? "selected-face" : ""
                  }`}
                />
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
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={13}
                    height={13}
                    className="absolute top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[1]
                        ? "/assets/finalDiceFace1.png"
                        : "/assets/diceFace1.png"
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(1) ? "selected-face" : ""
                    }`}
                  />
                </div>
                <div className="flex flex-col items-center mr-2 sm:mr-0">
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={13}
                    height={13}
                    className="absolute top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[2]
                        ? "/assets/finalDiceFace2.png"
                        : "/assets/diceFace2.png"
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(2) ? "selected-face" : ""
                    }`}
                  />
                </div>
                <div className="flex flex-col items-center mr-2 sm:mr-0">
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={13}
                    height={13}
                    className="absolute top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[3]
                        ? "/assets/finalDiceFace3.png"
                        : "/assets/diceFace3.png"
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(3) ? "selected-face" : ""
                    }`}
                  />
                </div>
                <div className="flex flex-col items-center mr-2 sm:mr-0">
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={13}
                    height={13}
                    className="absolute top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[4]
                        ? "/assets/finalDiceFace4.png"
                        : "/assets/diceFace4.png"
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(4) ? "selected-face" : ""
                    }`}
                  />
                </div>
                <div className="flex flex-col items-center mr-2 sm:mr-0">
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={13}
                    height={13}
                    className="absolute top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[5]
                        ? "/assets/finalDiceFace5.png"
                        : "/assets/diceFace5.png"
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(5) ? "selected-face" : ""
                    }`}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <Image
                    src="/assets/progressTip.png"
                    alt="progress bar"
                    width={13}
                    height={13}
                    className="absolute top-[4px]"
                  />
                  <Image
                    src={
                      selectedFaces[6]
                        ? "/assets/finalDiceFace6.png"
                        : "/assets/diceFace6.png"
                    }
                    width={50}
                    height={50}
                    alt=""
                    className={`inline-block mt-6 ${
                      selectedFace.includes(6) ? "selected-face" : ""
                    }`}
                  />
                </div>
              </div>
            </div>
            
            <GameFooterInfo multiplier={winningPays} amount={(winningAmount * (1 - ROLL_TAX))} chance={winningProbability} />
          </div>
        </div>
      </div>
      <RollDiceTable refresh={refresh} />
    </div>
  );
}
