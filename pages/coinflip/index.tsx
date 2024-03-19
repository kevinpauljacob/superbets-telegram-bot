import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { placeFlip } from "../../context/gameTransactions";
import FlipBets from "../../components/games/FlipBets";
import Image from "next/image";

const Timer = dynamic(() => import("../../components/games/Timer"), { ssr: false });
const Progress = dynamic(() => import("../../components/games/Progressbar"), {
  ssr: false,
});

export default function Flip() {
  const wallet = useWallet();

  const [user, setUser] = useState<any>(null);
  const [betAmt, setBetAmt] = useState(0.2);
  const [betType, setBetType] = useState<string | null>(null);

  const [deposit, setDeposit] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);

  const bet = async () => {
    setTimeout(() => {
      setLoading(false);
      setDeposit(true);
    }, 2000);
    try {
      console.log("Placing Flip");
      placeFlip(wallet, betAmt, betType === "Heads" ? true : false).then(
        (res) => {
          if (res.success) {
            setTimeout(() => {
              res?.data?.result == "Won"
                ? toast.success(res?.message)
                : toast.error(res?.message);

              setResult(res?.data?.result ?? "Lost");
              setRefresh(true);
              setLoading(false);
              setFlipping(false);
            }, 4000);
          } else {
            setBetType(null);
            setDeposit(false);
            setFlipping(false);
            setResult(null);
            res?.message && toast.error(res?.message);
          }
          setLoading(false);
        }
      );
    } catch (e) {
      toast.error("Could not make Flip.");
      setBetType(null);
      setDeposit(false);
      setLoading(false);
      setResult(null);
    }
  };

  useEffect(() => {
    if (betType) {
      setLoading(true);
      setRefresh(false);
      setDeposit(false);
      bet();
    }
  }, [betType]);

  useEffect(() => {
    if (deposit) {
      // console.log("deposit", deposit);
      setLoading(true);
      !result && setFlipping(true);
    }
  }, [deposit]);

  useEffect(() => {
    if (!wallet?.publicKey) return;

    fetch(`/api/user/getUser?wallet=${wallet.publicKey.toBase58()}`)
      .then((res) => res.json())
      .then((res) => {
        // console.log(res);
        if (res.success) {
          // console.log(res.data);
          setUser(res.data);
        }
      });
  }, [wallet?.publicKey, refresh]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-start">
      {/* bet box  */}
      <div className="flex w-[90%] max-w-[35rem] flex-col items-center rounded-[1.15rem] border-2 border-[#C20FC580] bg-[#C20FC533] px-3 py-5 md:p-7">
        <span className="mb-1 font-changa text-xs font-medium text-[#F0F0F0] text-opacity-75">
          sol balance: {user && user.deposit[0].amount.toFixed(4)}
        </span>
        <div className="mb-2 mt-2 flex items-end gap-2">
          <Image src={"/assets/coins.png"} width={50} height={50} alt="" />
          <span className="text-shadow-pink font-lilita text-[2.5rem] font-medium leading-10 text-white text-opacity-90">
            FLIP
          </span>
        </div>
        <span className="mb-4 mt-4 font-changa text-xl font-medium text-[#FFFFFF] text-opacity-75">
          Flip Tokens for Double or Nothing!
        </span>

        {/* <span className="mb-2 mt-8 flex w-full justify-end font-changa text-xs font-medium text-[#F200F2] text-opacity-75">
          SOL Available:{" "}
          {(
            user?.deposit.find((d: any) => d.tokenMint === "SOL")?.amount ?? 0
          ).toFixed(3)}
        </span> */}

        {/* select interval  */}
        <div className="mb-4 flex w-full flex-col rounded-lg bg-[#C20FC5] bg-opacity-10 px-3 pb-4 pt-2 md:px-6">
          <span className="mb-3 w-full text-center font-changa text-[#F0F0F0] text-opacity-75">
            Select Amount
          </span>
          <div className="mb-3 flex flex-col items-center gap-2.5 md:flex-row">
            <button
              onClick={() => {
                !betType && setBetAmt(0.2);
              }}
              className={`${
                betAmt === 0.2
                  ? "bg-[#F200F2]"
                  : "bg-transparent hover:bg-[#6C0671]"
              } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
            >
              0.2 $SOL
            </button>
            <button
              onClick={() => {
                !betType && setBetAmt(1);
              }}
              className={`${
                betAmt === 1
                  ? "bg-[#F200F2]"
                  : "bg-transparent hover:bg-[#6C0671]"
              } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
            >
              1 $SOL
            </button>
            <button
              onClick={() => {
                !betType && setBetAmt(2);
              }}
              className={`${
                betAmt === 2
                  ? "bg-[#F200F2]"
                  : "bg-transparent hover:bg-[#6C0671]"
              } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
            >
              2 $SOL
            </button>
          </div>
          {/* <div className="flex flex-col items-center gap-2.5 md:flex-row">
            <button
              onClick={() => {
                !betType && setBetAmt(4);
              }}
              className={`${
                betAmt === 4
                  ? "bg-[#F200F2]"
                  : "bg-transparent hover:bg-[#6C0671]"
              } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
            >
              4 $SOL
            </button>
            <button
              onClick={() => {
                !betType && setBetAmt(5);
              }}
              className={`${
                betAmt === 5
                  ? "bg-[#F200F2]"
                  : "bg-transparent hover:bg-[#6C0671]"
              } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
            >
              5 $SOL
            </button>
            <button
              onClick={() => {
                !betType && setBetAmt(6);
              }}
              className={`${
                betAmt === 6
                  ? "bg-[#F200F2]"
                  : "bg-transparent hover:bg-[#6C0671]"
              } w-full rounded-[5px] border-[2px] border-[#F200F280] py-2 text-xs text-white text-opacity-90 transition duration-200`}
            >
              6 $SOL
            </button>
          </div> */}
        </div>

        {(!user || user.deposit[0].amount < 0.2) && (
          <div className="mb-5 w-full rounded-lg bg-[#C20FC5] bg-opacity-10 px-3 pb-2 pt-4 text-white md:px-6">
            <div className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
              Please deposit funds to start playing. View{" "}
              <a href="/balance">
                <u>WALLET</u>
              </a>
            </div>
          </div>
        )}

        {betType ? (
          <div className="mb-0 flex w-full flex-col items-center rounded-lg bg-[#C20FC5] bg-opacity-10 px-4 pb-4 pt-2">
            {deposit ? (
              flipping ? (
                <div className="flex w-full flex-col items-center justify-center">
                  <div className="flex w-full flex-col items-end gap-1">
                    <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                      {betType}
                    </span>
                    <span className="font-changa text-xs font-semibold text-[#F200F2] text-opacity-75">
                      {betAmt} $SOL
                    </span>
                  </div>

                  <Image
                    src={"/assets/coin.png"}
                    width={50}
                    height={50}
                    alt=""
                    className="rotate -mt-8 mb-2"
                  />
                  <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                    Deposit Confirmed
                  </span>
                  <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                    Flipping the coin...
                  </span>
                </div>
              ) : (
                <div className="flex w-full flex-col items-center justify-center">
                  <div className="flex w-full flex-col items-end gap-1">
                    <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                      {betType}
                    </span>
                    <span className="font-changa text-xs font-semibold text-[#F200F2] text-opacity-75">
                      {betAmt} $SOL
                    </span>
                  </div>
                  <span className="-mt-8 font-changa text-xs text-[#FFFFFF] text-opacity-75">
                    {result && result === "Won" ? "yay..." : "ooops..."}
                  </span>
                  <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                    {result && result === "Won" ? "You Won!" : "You Lost!"}
                  </span>
                  <button
                    onClick={() => {
                      setBetType(null);
                      setLoading(false);
                      setResult(null);
                      setDeposit(false);
                      setFlipping(false);
                      setBetAmt(0);
                    }}
                    className="mt-2 w-full rounded-[5px] border border-[#F200F21A] bg-[#F200F2] px-5 py-2 font-changa font-semibold text-white text-opacity-90 shadow-[0_5px_10px_rgba(0,0,0,0.3)]"
                  >
                    Bet Again
                  </button>
                </div>
              )
            ) : (
              <div className="flex w-full flex-col items-center justify-center">
                <div className="flex w-full flex-col items-end gap-1">
                  <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                    {betType}
                  </span>
                  <span className="font-changa text-xs font-semibold text-[#F200F2] text-opacity-75">
                    {betAmt} $SOL
                  </span>
                </div>

                <Image
                  src={"/assets/coin.png"}
                  width={50}
                  height={50}
                  alt=""
                  className="rotate -mt-8 mb-2"
                />
                <span className="font-changa text-xs text-[#FFFFFF] text-opacity-75">
                  preparing for flip
                </span>
                <span className="font-changa text-xl text-[#FFFFFF] text-opacity-90">
                  Confirming deposit...
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="items center flex w-full gap-4">
            {/* buttons  */}
            <button
              disabled={!user || user.deposit[0].amount < 0.1 ? true : false}
              onClick={() => {
                if (!wallet.publicKey) toast.error("Wallet not connected");
                else {
                  if (betAmt !== 0) setBetType("Heads");
                  else toast.error("Choose amount.");
                }
              }}
              className={`${
                !user || user.deposit[0].amount < 0.1
                  ? "cursor-not-allowed opacity-70"
                  : "hover:opacity-90"
              } flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-[#F6F6F61A] bg-[#F200F2] py-2.5 shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]`}
            >
              <Image
                src={"/assets/headCoin.png"}
                width={35}
                height={35}
                alt=""
                className="mt-2"
              />
              <span className="font-changa text-[1.75rem] font-semibold text-white text-opacity-80">
                FLIP HEADS
              </span>
            </button>
            <button
              disabled={!user || user.deposit[0].amount < 0.1 ? true : false}
              onClick={() => {
                if (!wallet.publicKey) toast.error("Wallet not connected");
                else {
                  if (betAmt !== 0) setBetType("Tails");
                  else toast.error("Choose amount.");
                }
              }}
              className={`${
                !user || user.deposit[0].amount < 0.1
                  ? "cursor-not-allowed opacity-70"
                  : "hover:opacity-90"
              } flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-[#F6F6F61A] bg-[#F200F2] py-2.5 shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]`}
            >
              <Image
                src={"/assets/tailCoin.png"}
                width={35}
                height={35}
                alt=""
                className="mt-2"
              />
              <span className="font-changa text-[1.75rem] font-semibold text-white text-opacity-80">
                FLIP TAILS
              </span>
            </button>
          </div>
        )}
      </div>

      <FlipBets refresh={refresh} />
    </div>
  );
}
