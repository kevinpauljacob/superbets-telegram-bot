import { useWallet } from "@solana/wallet-adapter-react";
import { obfuscatePubKey } from "@/context/transactions";
import { ReactNode, useEffect, useState } from "react";
import BetRow from "@/components/games/BetRow";
import { useGlobalContext } from "@/components/GlobalContext";
import Loader from "@/components/games/Loader";
import { errorCustom } from "@/components/toasts/ToastGroup";
import { translator } from "@/context/transactions";
import { useRouter } from "next/router";
import Image from "next/image";
import { TButton, TablePagination } from "@/components/table/Table";
import { truncateNumber } from "@/context/gameTransactions";

interface PaginationProps {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  bets: any[];
  maxPages: number;
}

interface TableButtonProps {
  all: boolean;
  setAll: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AffiliateProgram() {
  const wallet = useWallet();
  const router = useRouter();
  const { language } = useGlobalContext();
  const transactionsPerPage = 10;
  const [referred, setReferred] = useState(true);
  const [campaigns, setCampaigns] = useState(false);
  const [earnings, setEarnings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);

  const referredHeaders = [
    "Wallet",
    "Level",
    "Wagered",
    "Commission %",
    "Earned",
  ];
  const earningsHeaders = ["Cryptocurreny", "Previously Claimed", "Claimable"];
  const smallScreenHeaders = ["Game", "Payout"];

  return (
    <div className="px-5 lg2:px-[4rem] md:px-[3rem] pt-5">
      <h1 className="font-chakra font-bold text-[1.75rem] text-white mb-3.5">
        AFFILIATE PROGRAM
      </h1>
      <div className="flex w-full md:w-max items-center gap-2 justify-center md:justify-end border-2 p-1.5 rounded-lg border-white border-opacity-[5%]">
        <TButton
          active={referred}
          onClick={() => {
            if (wallet.publicKey) {
              setReferred(true);
              setCampaigns(false);
              setEarnings(false);
            } else {
              errorCustom("Wallet not connected");
            }
          }}
          label={translator("Reffered", language)}
        />
        <TButton
          active={campaigns}
          onClick={() => {
            setReferred(false);
            setCampaigns(true);
            setEarnings(false);
          }}
          label={translator("Campaigns", language)}
        />
        <TButton
          active={earnings}
          onClick={() => {
            setReferred(false);
            setCampaigns(false);
            setEarnings(true);
          }}
          label={translator("Earnings", language)}
        />
      </div>
      {referred && (
        <div className="mt-7 mb-[3.25rem]">
          <div className="hidden md:flex flex-col justify-between gap-[12px] md:w-[45%] lg:w-[40%] h-[232px]">
            <div className="flex items-center gap-[12px] bg-staking-bg rounded-[5px] p-4 h-[50%]">
              <div className="flex justify-center items-center bg-[#202329] rounded-lg w-[73px] h-[68px]">
                <Image
                  src="/assets/referral.svg"
                  alt="boost logo"
                  height={60}
                  width={60}
                />
              </div>
              <div>
                <p className="text-white font-semibold text-base text-opacity-75">
                  Multi-Level Referral
                </p>
                <p className="text-[#94A3B8] font-semibold text-[11px] text-opacity-50 max-w-[290px]">
                  You can stake your $FOMO to obtain higher multiplier for your
                  points!
                </p>
              </div>
            </div>
            <div className="flex gap-[12px] w-full h-[50%]">
              <div className="flex flex-col justify-between gap-[12px] bg-staking-bg rounded-[5px] p-4 w-full h-full">
                <p className="text-xs font-medium text-opacity-50 text-white">
                  Total Referrals
                </p>
                <p className="font-chakra text-2xl font-semibold text-[#94A3B8] text-right">
                  $0.00
                </p>
              </div>
              <div className="flex flex-col justify-between gap-[12px] bg-staking-bg rounded-[5px] p-4 w-full h-full">
                <p className="text-xs font-medium text-opacity-50 text-white">
                  Referral Earnings
                </p>
                <p className="font-chakra text-2xl font-semibold text-[#94A3B8] text-right">
                  $0.00
                </p>
              </div>
            </div>
          </div>
          <div></div>
        </div>
      )}
      {earnings && (
        <div className="flex gap-[1.85rem] w-full mt-7 mb-[3.25rem]">
          <div className="flex items-start gap-[12px] bg-staking-bg rounded-[5px] p-4 h-[50%] w-full">
            <div className="flex justify-center items-center bg-[#202329] rounded-lg w-[73px] h-[68px]">
              <Image
                src="/assets/wallet.svg"
                alt="boost logo"
                height={44}
                width={41}
              />
            </div>
            <div>
              <p className="text-white font-medium text-base text-opacity-50">
                Total Claimed
              </p>
              <p className="text-[#94A3B8] font-semibold text-2xl">$0.00</p>
            </div>
          </div>
          <div className="flex items-center justify-between bg-staking-bg rounded-[5px] p-4 h-[50%] w-full">
            <div className="flex items-start gap-[12px]">
              <div className="flex justify-center items-center bg-[#202329] rounded-lg w-[73px] h-[68px]">
                <Image
                  src="/assets/envelope.svg"
                  alt="boost logo"
                  height={48}
                  width={48}
                />
              </div>
              <div>
                <p className="text-white font-medium text-base text-opacity-50">
                  Total Claimable
                </p>
                <p className="text-[#94A3B8] font-semibold text-2xl">$0.00</p>
              </div>
            </div>
            <div className="mr-4">
              <button className="text-white font-semibold font-chakra bg-[#7839C5] rounded-[5px] py-2 px-11">
                CLAIM
              </button>
            </div>
          </div>
        </div>
      )}
      {!campaigns && (
        <>
          <div className="mb-[1.125rem] hidden md:flex w-full flex-row items-center gap-2 bg-[#121418] py-1 rounded-[5px]">
            {referred
              ? referredHeaders.map((header, index) => (
                  <span
                    key={index}
                    className="w-full text-center font-changa text-[#F0F0F080]"
                  >
                    {translator(header, language)}
                  </span>
                ))
              : earnings
                ? earningsHeaders.map((header, index) => (
                    <span
                      key={index}
                      className="w-full text-center font-changa text-[#F0F0F080]"
                    >
                      {translator(header, language)}
                    </span>
                  ))
                : null}
          </div>
          <div className="mb-[1.4rem] flex md:hidden w-full flex-row items-center bg-[#121418] rounded-md py-1 gap-2">
            {smallScreenHeaders.map((header, index) => (
              <span
                key={index}
                className="w-full text-center font-changa text-[#F0F0F080]"
              >
                {header}
              </span>
            ))}
          </div>
        </>
      )}
      {/* <div
        className={`flex w-full flex-col
        ${loading ? " h-[50rem]" : ""}`}
      >
        {loading ? (
          <div className="h-20">
            <Loader />
          </div>
        ) : (
          <>
            <div className="scrollbar w-full mt-[1.125rem] pb-8">
              <div className="flex w-full md:min-w-[50rem] flex-col items-center">
                <div className="relative flex flex-col items-center w-full max-h-[36rem] overflow-hidden">
                  {tableData?.length ? (
                    <>
                      {tableData
                        .slice(
                          page * transactionsPerPage - transactionsPerPage,
                          page * transactionsPerPage,
                        )
                        .map((data, index) => (
                          <div
                            key={index}
                            className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] hover:bg-[#1f2024] py-3"
                          >
                            {referred && (
                              <div className="w-full flex items-center justify-between cursor-pointer">
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  {obfuscatePubKey(data.wallet)}
                                </span>
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  ${truncateNumber(data.wagered ?? 0)}
                                </span>
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  {data.commission ?? 0}%
                                </span>
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  ${truncateNumber(data.earned ?? 0)}
                                </span>
                              </div>
                            )}
                            {earnings && (
                              <div className="w-full flex items-center justify-between cursor-pointer">
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  ${data.cryptocurreny)}
                                </span>
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  ${truncateNumber(data.claimed ?? 0)}
                                </span>
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  ${truncateNumber(data.claimable ?? 0)}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                    </>
                  ) : (
                    <span className="font-changa text-[#F0F0F080]">
                      {translator("No have not referred anyone.", language)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <TablePagination
              page={page}
              setPage={setPage}
              maxPages={maxPages}
              bets={bets}
            />
          </>
        )}
      </div> */}
    </div>
  );
}
