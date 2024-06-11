import React, { ReactNode } from "react";
import GameHeader from "./GameHeader";
import { useGlobalContext } from "./GlobalContext";
import { maxPayouts, translator, truncateNumber } from "@/context/transactions";
import { optionsEdge } from "@/context/config";
import Link from "next/link";
import FomoPlay from "./FomoPlay";
import FOMOHead from "./HeadElement";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { handleSignIn } from "./ConnectWallet";
import { GameTokens, GameType } from "@/utils/provably-fair";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const GameOptions: React.FC<LayoutProps> = ({ children }) => {
  return children;
};

const GameDisplay: React.FC<LayoutProps> = ({ children }) => {
  return children;
};

const GameTable: React.FC<LayoutProps> = ({ children }) => {
  return children;
};

interface GameFooterProps {
  multiplier: number;
  amount: number;
  chance?: number;
}

export const GameFooterInfo: React.FC<GameFooterProps> = ({
  multiplier,
  amount,
  chance,
}) => {
  const { data: session, status } = useSession();
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const {
    coinData,
    setShowWalletModal,
    currentGame,
    houseEdge,
    language,
    selectedCoin,
    minGameAmount,
  } = useGlobalContext();

  return (
    <div className="flex px-0 xl:px-4 mb-0 md:mb-[1.4rem] gap-4 flex-row w-full justify-between">
      {selectedCoin && selectedCoin.amount > minGameAmount && (
        <>
          {multiplier !== undefined ? (
            <div className="flex flex-col w-full">
              <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
                {translator("Multiplier", language)}
              </span>
              <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
                {truncateNumber(multiplier ?? 0, 2)}x
              </span>
            </div>
          ) : (
            <></>
          )}

          <div className="flex flex-col w-full">
            <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
              {translator("Profit", language)}
            </span>
            <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
              {truncateNumber(
                amount *
                  (multiplier *
                    (1 -
                      (currentGame == "options" ? optionsEdge : 0) +
                      houseEdge) -
                    1),
                4,
              )}{" "}
              ${selectedCoin.tokenName}
            </span>
          </div>

          {chance !== undefined && (
            <div className="flex flex-col w-full">
              <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
                {translator("Chance", language)}
              </span>
              <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
                {truncateNumber(chance, 2)}%
              </span>
            </div>
          )}
        </>
      )}

      {!selectedCoin ||
        (selectedCoin.amount < minGameAmount && (
          <div className="w-full rounded-lg bg-[#d9d9d90d] bg-opacity-10 flex items-center px-3 py-3 text-white md:px-6">
            <div className="w-full text-center font-changa font-medium text-sm md:text-base text-[#F0F0F0] text-opacity-75">
              {translator(
                "Please deposit funds to start playing. View",
                language,
              )}{" "}
              <u
                onClick={() => {
                  wallet.connected && status === "authenticated"
                    ? setShowWalletModal(true)
                    : handleSignIn(wallet, walletModal);
                }}
                className="cursor-pointer"
              >
                {translator("WALLET", language)}
              </u>
            </div>
          </div>
        ))}
    </div>
  );
};

const GameLayout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="flex flex-1 h-fit w-full flex-col items-center justify-start px-3 lg:px-6">
      <FOMOHead
        title={`${
          title ? title + " | " : ""
        }FOMO.wtf - 0% House Edge, Pure Wins`}
      />

      <div className="fadeInUp w-full min-h-fit lg:min-h-[calc(100vh-13.7rem)] items-stretch bg-[#121418] rounded-2xl flex flex-col-reverse lg:flex-row">
        <div className="fadeInUp flex w-full min-h-fit lg:w-[35%] flex-col items-center rounded-[1.15rem] px-3 py-5 lg:p-9 2xl:p-14">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === GameOptions) {
              return child;
            }
          })}
        </div>
        <div className="bg-white bg-opacity-10 h-[1px] lg:h-auto w-full lg:w-[1px]" />
        <div className="fadeInUp flex flex-1 flex-col items-center justify-between gap-0 m-3 lg:m-9 bg-[#0E0F14] rounded-lg p-3 lg:px-10 lg:pt-6 lg:pb-10">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === GameDisplay) {
              return child;
            }
          })}
        </div>
      </div>
      <div className="fadeInUp w-full flex flex-col min-h-[4rem] mt-4 rounded-[5px] overflow-hidden">
        <GameHeader />
      </div>
      <div className="fadeInUp w-full flex flex-col min-h-[4rem] mt-8 rounded-[5px] overflow-hidden">
        <FomoPlay />
      </div>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === GameTable) {
          return child;
        }
      })}
    </div>
  );
};

export { GameOptions, GameDisplay, GameLayout, GameTable };
