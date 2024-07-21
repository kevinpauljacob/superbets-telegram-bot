import { useState } from "react";
import { useGlobalContext } from "./GlobalContext";
import Image from "next/image";
import { SPL_TOKENS } from "@/context/config";
import { translator } from "@/context/transactions";
import SOL from "@/public/assets/coins/SOL";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { handleSignIn } from "./ConnectWallet";

export default function CoinSelector() {
  const { data: session, status } = useSession();
  const wallet = useWallet();
  const walletModal = useWalletModal();

  const {
    setShowWalletModal,
    setLiveBets,
    language,
    setSelectedCoin,
    selectedCoin,
    coinData,
    startAuto,
  } = useGlobalContext();
  const [showSelectCoinModal, setShowSelectCoinModal] = useState(false);
  const [fiat, setFiat] = useState(false);

  function formatAmount(amount: number) {
    const integerPartLength = Math.floor(amount).toString().length;
    let minimumFractionDigits = 0;
    let maximumFractionDigits = 0;

    if (integerPartLength < 5) {
      minimumFractionDigits = 5 - integerPartLength;
      maximumFractionDigits = 5 - integerPartLength;
    }

    return amount.toLocaleString("en-US", {
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: maximumFractionDigits,
    });
  }

  return (
    <div className="relative flex items-center gap-2">
      <div
        className={`flex flex-col min-w-[8rem] h-10 ${
          startAuto ? "opacity-50" : ""
        }`}
      >
        <div
          className="flex flex-row justify-left items-center px-4 py-[2px] h-10 gap-2 border-2 border-white border-opacity-5 transition-all hover:bg-[#26282C]/50 hover:transition-all rounded-[5px] cursor-pointer"
          onClick={() => {
            !startAuto && setShowSelectCoinModal(!showSelectCoinModal);
          }}
        >
          {selectedCoin.icon && (
            <selectedCoin.icon className="w-6 h-6 -mt-[1px]" />
          )}
          <span className="font-chakra font-medium text-base text-[#94A3B8]">
            {formatAmount(selectedCoin.amount ?? 0)}
          </span>
          <div className="grow" />
          <Image
            src={"/assets/chevron.svg"}
            alt=""
            width={12}
            height={12}
            className={showSelectCoinModal ? "transform rotate-180" : ""}
          />
        </div>
      </div>

      {!startAuto && showSelectCoinModal && (
        <div className="absolute top-full mt-3 bg-[#202329] w-full rounded-[5px] border-2 border-white border-opacity-10">
          {SPL_TOKENS.map((coin, index) => (
            <div
              key={index}
              className={`flex items-center justify-between h-10 px-4 gap-1.5 text-[#F0F0F0] ${
                selectedCoin.tokenName === coin.tokenName
                  ? "bg-[#2A2E38] text-opacity-100"
                  : "bg-[#2A2E381A] text-opacity-75"
              } hover:text-opacity-100  hover:bg-[#2A2E38] border-b border-white border-opacity-10 transition-all cursor-pointer`}
              onClick={() => {
                setSelectedCoin({
                  amount:
                    coinData?.find((c) => c.tokenMint === coin.tokenMint)
                      ?.amount || 0,
                  tokenMint: coin.tokenMint,
                  tokenName: coin.tokenName,
                  icon: coin.icon,
                });
                setShowSelectCoinModal(false);
              }}
            >
              <div className="flex items-center gap-1.5">
                <coin.icon className="" />
                <span className="text-sm font-chakra font-semibold leading-3 mt-0.5">
                  {coin.tokenName}
                </span>
              </div>
              <span className="text-sm font-chakra font-semibold leading-3 mt-0.5">
                {(
                  coinData?.find((c) => c.tokenMint === coin.tokenMint)
                    ?.amount ?? 0
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4,
                })}
              </span>
            </div>
          ))}
          {/* <div className="w-full h-[3.5rem] flex items-center justify-between bg-[#0E0F14] bg-opacity-30 px-5">
            <span className="text-sm font-chakra font-medium leading-3 text-[#F0F0F0] text-opacity-75">
              Display in Fiat
            </span>
            <button
              type="button"
              onClick={() => setFiat(!fiat)}
              className={`w-11 p-1 flex items-center relative transition duration-500 delay-100 ${
                fiat ? "bg-[#5F4DFF]" : "bg-[#121418]"
              } rounded-full`}
            >
              <div
                className={`h-4 rounded-full flex justify-end bg-transparent transition-width duration-200  ${
                  fiat ? "w-full" : "w-4"
                }`}
              >
                <div
                  className={` h-4 w-4 rounded-full transition duration-200  ${
                    fiat ? " bg-[#474747]" : "bg-[#D9D9D9]"
                  }`}
                ></div>
              </div>
            </button>
          </div> */}
        </div>
      )}

      <div
        onClick={() => {
          wallet.connected && status === "authenticated"
            ? setShowWalletModal(true)
            : handleSignIn(wallet, walletModal);
        }}
        className="flex items-center h-[2.3rem] md:h-10 px-5 md:px-4 py-0 md:py-2 gap-1 md:gap-1.5 bg-[#5F4DFF] hover:bg-[#9361d1] focus:bg-[#602E9E] transition-all cursor-pointer rounded-[5px]"
      >
        <Image src={"/assets/wallet.png"} alt="" width={17} height={17} />
        <span className="text-xs md:text-sm leading-3 mt-0.5 text-white text-opacity-90">
          {translator("Wallet", language)}
        </span>
      </div>
    </div>
  );
}
