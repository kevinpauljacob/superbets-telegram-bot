import Image from "next/image";
import solanalogo from "../public/assets/Solana_logo_1.svg";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import BalanceModal from "./BalanceModal";
import { useSession } from "next-auth/react";
import Loader from "./Loader";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { connection } from "../../context/gameTransactions";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

function Balance() {
  const { data: session, status } = useSession();
  const wallet = useWallet();

  const [loading, setLoading] = useState(false);

  const walletModal = useWalletModal();

  const [visible, setVisible] = useState(false);
  const [actionType, setActionType] = useState("Deposit");
  const [token, setToken] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  const [coinData, setCoinData] = useState<any[] | null>([
    {
      wallet: "",
      type: true,
      amount: 0,
      tokenMint: "SOL",
    },
  ]);

  const getWalletBalance = async () => {
    if (wallet && wallet.publicKey)
      try {
        setWalletBalance(
          (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL
        );
      } catch (e) {
        toast.error("Unable to fetch balance.");
        console.error(e);
      }
  };

  const getBalance = async () => {
    setLoading(true);
    try {
      fetch(`/api/user/getUser?wallet=${wallet.publicKey?.toBase58()}`)
        .then((res) => res.json())
        .then((balance) => {
          if (balance.success) {
            balance?.data &&
            balance?.data.deposit &&
            balance?.data.deposit.length > 0
              ? setCoinData(balance.data.deposit)
              : setCoinData([
                  {
                    wallet: "rverdgrehb@iubuyidciuiu",
                    type: true,
                    amount: 0,
                    tokenMint: "SOL",
                  },
                ]);
          } else {
            toast.error("Could not fetch balance.");
            setCoinData(null);
          }
          setLoading(false);
        });
    } catch (e) {
      toast.error("Could not fetch balance.");
      setLoading(false);
      setCoinData(null);
      console.error(e);
    }
  };

  useEffect(() => {
    if (session?.user && !visible) {
      getBalance();
      getWalletBalance();
    }
  }, [session?.user, visible]);

  return (
    <>
      <div className="relative flex w-[100vw] flex-col flex-wrap items-center justify-start overflow-y-auto">
        <div className="flex w-[90%] flex-col items-center pb-4 md:w-[70%]">
          <div className="mb-[3rem] rounded-md py-6 text-center font-changa">
            <h2 className="text-shadow-pink mb-2 text-2xl text-[#F0F0F0] text-opacity-75">
              My Balance
            </h2>
            <p className="max-w-[30rem] text-[#F0F0F0] text-opacity-50">
              {session?.user
                ? "Please deposit funds into the fomobet wallet by clicking the deposit button next to the respective token to start playing"
                : "Please connect your wallet to view balances."}
            </p>
          </div>

          {session?.user ? (
            loading ? (
              <Loader />
            ) : coinData ? (
              <div className="flex w-full flex-col">
                <div className="mb-5 mt-5 hidden w-full items-center gap-2 px-14 font-changa text-[#f0f0f0] text-opacity-50 md:flex">
                  <span className="flex w-[16%]">Coin</span>
                  <span className="flex flex-1">Wallet Balance</span>
                  <span className="flex basis-[30%]">Actions</span>
                </div>

                {coinData?.map((coin, index) => (
                  <div
                    className="mb-3 flex w-full flex-col items-center justify-between gap-5 rounded-md bg-[#450549] px-5 py-5 md:flex-row md:gap-2 md:px-14 md:py-2"
                    key={index}
                  >
                    <div className="flex w-full items-start justify-between md:w-[70%] md:items-center md:justify-start">
                      <div className="flex w-[50%] flex-col items-start gap-2 md:w-[25%]">
                        <span className="mb-1 flex font-changa text-[#f0f0f0] text-opacity-50 md:hidden">
                          Coin
                        </span>
                        <div className="flex w-full items-center">
                          <Image src={solanalogo} width={30} alt="" />
                          <span className="ml-2 text-sm text-[#f0f0f0] text-opacity-75">
                            ${coin.tokenMint}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col items-start">
                        <span className="mb-2 flex font-changa text-[#f0f0f0] text-opacity-50 md:hidden">
                          Coin
                        </span>
                        <span className="flex flex-1 text-sm text-[#f0f0f0] text-opacity-75">
                          {coin.amount.toFixed(4)} ${coin.tokenMint}
                        </span>
                      </div>
                    </div>
                    <div className="flex w-full flex-col items-center gap-4 text-sm font-semibold text-white text-opacity-90 md:w-[30%] md:flex-row">
                      <button
                        onClick={() => {
                          setToken(coin.tokenMint);
                          setActionType("Withdraw");
                          // console.log("click");
                          setVisible(true);
                        }}
                        className="w-full rounded-[5px] border border-[#F200F21A] bg-[#F200F2] px-5 py-1.5 shadow-[0_5px_10px_rgba(0,0,0,0.3)] md:w-fit md:py-0.5"
                      >
                        Withdraw
                      </button>
                      <button
                        onClick={() => {
                          setToken(coin.tokenMint);
                          setActionType("Deposit");
                          // console.log("click");
                          setVisible(true);
                        }}
                        className="w-full rounded-[5px] border-2 border-[#F200F266] bg-transparent px-5 py-1.5 shadow-[0_5px_10px_rgba(0,0,0,0.3)] md:w-fit md:py-0.5"
                      >
                        Deposit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="max-w-[30rem] text-[#F0F0F0] text-opacity-50">
                Could not fetch balance!
              </span>
            )
          ) : (
            <button
              onClick={() => walletModal.setVisible(true)}
              className="transform rounded-[5px] bg-[#8A078A] px-8 py-2 text-xs text-white transition duration-200 hover:bg-[#A509A5]"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      {coinData && visible && (
        <BalanceModal
          visible={visible}
          setVisible={setVisible}
          actionType={actionType}
          token={token}
          balance={actionType == "Deposit" ? walletBalance : coinData[0].amount}
        />
      )}
    </>
  );
}

export default Balance;