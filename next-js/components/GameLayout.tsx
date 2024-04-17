import Head from "next/head";
import React, { ReactNode } from "react";
import GameHeader from "./GameHeader";
import { Table } from "./table/Table";
import { minGameAmount } from "@/context/gameTransactions";
import { useGlobalContext } from "./GlobalContext";
import Link from "next/link";

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
  multiplier?: number;
  amount: number;
  chance?: number;
}

export const GameFooterInfo: React.FC<GameFooterProps> = ({
  multiplier,
  amount,
  chance,
}) => {
  const { coinData, setShowWalletModal } = useGlobalContext();
  return (
    <div className="flex px-0 xl:px-4 mb-0 md:mb-5 gap-4 flex-row w-full justify-between">
      {coinData && coinData[0].amount > 0.0001 && (
        <>
          {multiplier && (
            <div className="flex flex-col w-full">
              <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
                Multiplier
              </span>
              <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
                {multiplier.toFixed(2)}x
              </span>
            </div>
          )}

          <div className="flex flex-col w-full">
            <span className="text-[#F0F0F0] font-changa font-sembiold text-xs mb-1">
              Winning
            </span>
            <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
              {amount.toFixed(3)} $SOL
            </span>
          </div>

          {chance !== undefined && (
            <div className="flex flex-col w-full">
              <span className="text-[#F0F0F0] font-changa font-semibold text-xs mb-1">
                Chance
              </span>
              <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-2 md:px-5 py-3">
                {chance.toFixed(2)}%
              </span>
            </div>
          )}
        </>
      )}

      {!coinData ||
        (coinData[0].amount < 0.0001 && (
          <div className="w-full rounded-lg bg-[#d9d9d90d] bg-opacity-10 flex items-center px-3 py-3 text-white md:px-6">
            <div className="w-full text-center font-changa font-medium text-sm md:text-base text-[#F0F0F0] text-opacity-75">
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
        ))}
    </div>
  );
};

const GameLayout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="flex flex-1 h-full w-full flex-col items-center justify-start px-3 lg:px-6">
      <Head>
        <title>{title}</title>
      </Head>
      <div className="fadeInUp mt-0 lg:mt-6 w-full min-h-fit lg:min-h-[calc(100vh-17.5rem)] items-stretch bg-[#121418] rounded-2xl flex flex-col-reverse lg:flex-row">
        <div className="fadeInUp flex w-full min-h-fit lg:w-[35%] flex-col items-center rounded-[1.15rem] px-3 py-5 lg:p-9 2xl:p-14">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === GameOptions) {
              return child;
            }
          })}
        </div>
        <div className="bg-white bg-opacity-10 h-[1px] lg:h-full w-full lg:w-[1px]" />
        <div className="fadeInUp flex flex-1 flex-col items-center justify-between gap-0 m-3 lg:m-9 bg-[#0C0F16] rounded-lg p-3 lg:px-10 lg:pt-6 lg:pb-10">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === GameDisplay) {
              return child;
            }
          })}
        </div>
      </div>
      <div className="fadeInUp w-full flex lg:hidden mt-4 rounded-[5px] overflow-hidden">
        <GameHeader />
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
