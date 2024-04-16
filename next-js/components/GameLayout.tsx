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
    <div className="flex px-0 mb-0 md:mb-5 gap-4 flex-row w-full justify-between">
      {coinData && coinData[0].amount > 0.0001 && (
        <>
          {multiplier && (
            <div className="flex flex-col w-full">
              <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
                Multiplier
              </span>
              <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-1.5 md:px-5 py-2">
                {multiplier.toFixed(2)}x
              </span>
            </div>
          )}

          <div className="flex flex-col w-full">
            <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
              Winning
            </span>
            <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-1.5 md:px-5 py-2">
              {amount.toFixed(3)} $SOL
            </span>
          </div>

          {chance !== undefined && (
            <div className="flex flex-col w-full">
              <span className="text-[#F0F0F0] font-changa text-opacity-75 text-xs mb-1">
                Chance
              </span>
              <span className="bg-[#202329] font-chakra text-xs text-white rounded-md px-1.5 md:px-5 py-2">
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
    <div className="flex flex-1 h-full w-full flex-col items-center justify-start px-3 md:px-6">
      <Head>
        <title>{title}</title>
      </Head>
      <div className="fadeInUp mt-0 md:mt-6 w-full min-h-fit md:min-h-[calc(100vh-17.5rem)] items-stretch bg-[#121418] rounded-2xl flex flex-col-reverse md:flex-row">
        <div className="fadeInUp flex w-full min-h-fit md:w-[35%] flex-col items-center rounded-[1.15rem] px-3 py-5 md:p-9 2xl:p-14">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === GameOptions) {
              return child;
            }
          })}
        </div>
        <div className="bg-white bg-opacity-10 h-[1px] md:h-full w-full md:w-[1px]" />
        <div className="fadeInUp flex flex-1 flex-col items-center justify-between gap-0 m-3 md:m-9 bg-[#0C0F16] rounded-lg p-3 md:px-10 md:pt-6 md:pb-10">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === GameDisplay) {
              return child;
            }
          })}
        </div>
      </div>
      <div className="fadeInUp w-full flex md:hidden mt-4 rounded-[5px] overflow-hidden">
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
