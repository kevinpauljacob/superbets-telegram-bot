import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { rollDice } from "../../context/gameTransactions";
import RollDiceTable from "../../components/games/RollDiceTable";
import { toast } from "react-hot-toast";
import { ROLL_TAX } from "../../context/config";

export default function Dice() {
  const wallet = useWallet();

  const [user, setUser] = useState<any>(null);
  const [betAmt, setBetAmt] = useState(0.1);
  const [selectedFace, setSelectedFace] = useState<number[]>([1]);
  const [isRolling, setIsRolling] = useState(false);
  const [winningPays, setWinningPays] = useState(6);
  const [winningAmount, setWinningAmount] = useState(0.6);
  const [winningProbability, setWinningProbability] = useState(16.67);
  const [refresh, setRefresh] = useState(false);

  const handleDiceClick = (newFace: number) => {
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
    <div className="flex h-full w-[100vw] flex-col items-center justify-start">
      <div className="flex w-[90%] max-w-[35rem] flex-col items-center rounded-[1.15rem] border-2 border-[#C20FC580] bg-[#C20FC533] px-3 py-5 md:p-7">
        <span className="mb-1 mr-0 font-changa text-xs font-medium text-[#F0F0F0] text-opacity-75">
          sol balance: {user && user.deposit[0].amount.toFixed(4)}
        </span>
        <div className="mb-2 mt-2 flex items-end gap-2">
          <Image src={"/assets/dice.png"} width={50} height={50} alt="" />
          <span className="text-shadow-pink font-lilita text-[2.5rem] font-medium leading-10 text-white text-opacity-90">
            DICE TO WIN
          </span>
        </div>
        <span className="mb-4 mt-4 font-changa text-xl font-medium text-[#FFFFFF] text-opacity-75">
          Roll a dice
        </span>
        <div className="mb-4 flex w-full flex-col rounded-lg bg-[#C20FC5] bg-opacity-10 px-3 pb-4 pt-2 md:px-6">
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
        </div>
        <div className="mb-4 flex w-full flex-col rounded-lg bg-[#C20FC5] bg-opacity-10 px-3 pb-4 pt-2 md:px-6">
          <span className="mb-3 w-full text-center font-changa text-[#F0F0F0] text-opacity-75">
            Choose upto 5 faces
          </span>
          <span className="mb-3 w-full text-center font-changa text-[#F0F0F0] text-opacity-75">
            <span className="mb-3 w-full text-center font-changa text-[#F0F0F0] text-opacity-75">
              <Image
                src={"/assets/diceFace1.png"}
                width={50}
                height={50}
                alt=""
                className={`mr-2 inline-block ${
                  selectedFace.includes(1) ? "selected-face" : ""
                }`}
                onClick={() => handleDiceClick(1)}
              />
              <Image
                src={"/assets/diceFace2.png"}
                width={50}
                height={50}
                alt=""
                className={`mr-2 inline-block ${
                  selectedFace.includes(2) ? "selected-face" : ""
                }`}
                onClick={() => handleDiceClick(2)}
              />
              <Image
                src={"/assets/diceFace3.png"}
                width={50}
                height={50}
                alt=""
                className={`mr-2 inline-block ${
                  selectedFace.includes(3) ? "selected-face" : ""
                }`}
                onClick={() => handleDiceClick(3)}
              />
              <Image
                src={"/assets/diceFace4.png"}
                width={50}
                height={50}
                alt=""
                className={`mr-2 inline-block ${
                  selectedFace.includes(4) ? "selected-face" : ""
                }`}
                onClick={() => handleDiceClick(4)}
              />
              <Image
                src={"/assets/diceFace5.png"}
                width={50}
                height={50}
                alt=""
                className={`mr-2 inline-block ${
                  selectedFace.includes(5) ? "selected-face" : ""
                }`}
                onClick={() => handleDiceClick(5)}
              />
              <Image
                src={"/assets/diceFace6.png"}
                width={50}
                height={50}
                alt=""
                className={`mr-2 inline-block ${
                  selectedFace.includes(6) ? "selected-face" : ""
                }`}
                onClick={() => handleDiceClick(6)}
              />
            </span>
          </span>
        </div>

        <div className="mb-4 flex w-full flex-col rounded-lg bg-[#C20FC5] bg-opacity-10 px-3 pb-4 pt-4 font-changa md:px-6">
          <div className="flex justify-between">
            <span className="text-[#F0F0F0] text-opacity-75">Winning Pays</span>
            <span className="text-[#F0F0F0] text-opacity-75">
              {winningPays}x
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#F0F0F0] text-opacity-75">Tax</span>
            <span className="text-[#F0F0F0] text-opacity-75">
              {ROLL_TAX * 100}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#F0F0F0] text-opacity-75">
              Winning Amount
            </span>
            <span className="text-[#F0F0F0] text-opacity-75">
              {(winningAmount * (1 - ROLL_TAX)).toFixed(2)} $SOL
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#F0F0F0] text-opacity-75">
              Winning Probability
            </span>
            <span className="text-[#F0F0F0] text-opacity-75">
              {winningProbability.toFixed(2)}%
            </span>
          </div>
        </div>

        {!user ||
          (user.deposit[0].amount < 0.1 && (
            <div className="mb-5 w-full rounded-lg bg-[#C20FC5] bg-opacity-10 px-3 pb-2 pt-4 text-white md:px-6">
              <div className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
                Please deposit funds to start playing. View{" "}
                <a href="/balance">
                  <u>WALLET</u>
                </a>
              </div>
            </div>
          ))}
        <div className="mb-0 flex w-full flex-col items-center rounded-lg bg-[#C20FC5] bg-opacity-10 px-4 pb-2 pt-2">
          <button
            disabled={!wallet || selectedFace.length == 0}
            onClick={() => {
              if (!isRolling) diceRoll();
            }}
            className={`${
              !user || !wallet || selectedFace.length == 0
                ? "cursor-not-allowed opacity-70"
                : "hover:opacity-90"
            } flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-[#F6F6F61A] bg-[#F200F2] py-2.5 font-changa shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]`}
          >
            {isRolling ? (
              <div>
                <Image
                  src={"/assets/rolling_dice.gif"}
                  width={50}
                  height={50}
                  alt=""
                  className="ml-7 mt-1"
                />
                <span className="font-changa text-[1.75rem] font-semibold text-white text-opacity-80">
                  ROLLING...
                </span>
              </div>
            ) : (
              <div>
                <Image
                  src={"/assets/rolldice.png"}
                  width={50}
                  height={50}
                  alt=""
                  className="center ml-8 mt-1"
                />
                <span className="center font-changa text-[1.75rem] font-semibold text-white text-opacity-80">
                  ROLL DICE
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
      <RollDiceTable refresh={refresh} />
    </div>
  );
}
