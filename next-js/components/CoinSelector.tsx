import { useState, useEffect } from "react";
import { useGlobalContext } from "./GlobalContext";
import Image from "next/image";
import { SPL_TOKENS } from "@/context/config";
import { translator } from "@/context/transactions";
import SOL from "@/public/assets/coins/SOL";
import { useSession } from "next-auth/react";
import StatsSoundToggle from "./games/StatsSoundToggle";
import { errorCustom } from "./toasts/ToastGroup";

export default function CoinSelector() {
  const {
    setShowWalletModal,
    setShowConnectModal,
    setLiveBets,
    language,
    setSelectedCoin,
    selectedCoin,
    coinData,
    startAuto,
    session,
    myData,
    status,
  } = useGlobalContext();
  const [showSelectCoinModal, setShowSelectCoinModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
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

  useEffect(() => {
    if (myData?.isWeb2User === false) {
      const usdcCoin = SPL_TOKENS.find((coin) => coin.tokenName === "USDC");
      if (usdcCoin) {
        setSelectedCoin({
          amount:
            coinData?.find((c) => c.tokenMint === usdcCoin.tokenMint)?.amount ||
            0,
          tokenMint: usdcCoin.tokenMint,
          tokenName: usdcCoin.tokenName,
          icon: usdcCoin.icon,
        });
      }
    }
  }, [myData?.isWeb2User]);

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
            <selectedCoin.icon className="w-4 h-4 -mt-[1px]" />
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
      <div
        onClick={() => {
          session?.user?.wallet
            ? setShowWalletModal(true)
            : setShowConnectModal(true);
        }}
        className="flex items-center h-[2.3rem] md:h-[2.4rem] px-5 md:px-4 py-0 md:py-2 gap-1 md:gap-1.5 bg-[#5F4DFF] disabled:bg-[#555555] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] transition-all cursor-pointer rounded-[5px]"
      >
        <Image src={"/assets/wallet.png"} alt="" width={17} height={17} />
        <span className="text-xs md:text-sm leading-3 mt-0.5 text-white text-opacity-90">
          {translator("Wallet", language)}
        </span>
      </div>
      {!startAuto && showSelectCoinModal && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-[#202329] w-full min-w-fit rounded-[5px] border-2 border-white border-opacity-10">
          {SPL_TOKENS.map((coin, index) => (
            <div
              key={index}
              className={`flex items-center justify-between h-10 px-4 gap-1.5 text-[#F0F0F0] ${
                selectedCoin.tokenName === coin.tokenName
                  ? "bg-[#2A2E38] text-opacity-100"
                  : "bg-[#2A2E381A] text-opacity-75"
              } hover:text-opacity-100  hover:bg-[#2A2E38] border-b border-white border-opacity-10 transition-all cursor-pointer`}
              onClick={() => {
                if (
                  !(myData?.isWeb2User === false && coin.tokenName === "SUPER")
                ) {
                  setSelectedCoin({
                    amount:
                      coinData?.find((c) => c.tokenMint === coin.tokenMint)
                        ?.amount || 0,
                    tokenMint: coin.tokenMint,
                    tokenName: coin.tokenName,
                    icon: coin.icon,
                  });
                  setShowSelectCoinModal(false);
                }
              }}
            >
              <div className="flex items-center gap-1.5">
                <coin.icon className="w-4 h-4" />

                <span
                  className={`${!myData?.isWeb2User && coin.tokenName === "SUPER" ? "text-[#F0F0F0] text-opacity-25" : ""} text-sm font-chakra font-semibold leading-3 mt-0.5`}
                >
                  {coin.tokenName}
                </span>
              </div>
              <span className="relative text-sm font-chakra font-semibold leading-3 mt-0.5">
                {!myData?.isWeb2User && coin.tokenName === "SUPER" ? (
                  <>
                    <span
                      className="text-white text-opacity-35 underline cursor-pointer"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      Why?
                    </span>
                    {showTooltip && (
                      <>
                        <div className="absolute right-0 -top-[70px] mt-2 p-2 bg-[#D9D9D9] text-[#1A1A1A] text-xs rounded shadow-lg z-10 w-60">
                          Users who have deposited/withdrawn crypto from wallet
                          are not eligible!
                        </div>
                        <div className="absolute z-10 right-5 -top-[24px] bg-[#D9D9D9] rotate-45 p-2"></div>
                      </>
                    )}
                  </>
                ) : (
                  coinData
                    ?.find((c) => c.tokenMint === coin.tokenMint)
                    ?.amount?.toLocaleString("en-US", {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    }) ?? "0.0000"
                )}
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
      <div className="hidden md:flex">
        <StatsSoundToggle />
      </div>
    </div>
  );
}
