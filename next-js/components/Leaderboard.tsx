import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { obfuscatePubKey, translator } from "@/context/transactions";
import { pointTiers } from "@/context/config";
import { useGlobalContext } from "./GlobalContext";
import Image from "next/legacy/image";
import { errorCustom } from "./toasts/ToastGroup";

function Leaderboard({ data, page, setPage, maxPages, myData }: any) {
  const wallet = useWallet();

  const { getUserDetails, language, session } = useGlobalContext();
  const transactionsPerPage = 10;
  const headers = ["Rank", "Player", "Coins"];

  return (
    <div className="relative mt-8 mb-10 flex h-full w-full flex-col flex-wrap items-center justify-center">
      <div className="w-full overflow-x-auto">
        {/* table  */}
        <div className="scrollbar w-full min-w-[10rem] overflow-x-auto pb-8">
          <div className="flex w-full flex-col items-center">
            {/* header  */}
            {data.length > 0 && (
              <div className="mb-[0.5rem] flex w-full flex-row items-center gap-2 pr-10  text-sm font-light font-changa">
                <span className="w-[10%] text-center ml-10 text-[#F0F0F080]">
                  {translator(headers[0], language)}
                </span>
                <span className="w-[70%] text-left text-[#F0F0F080] pl-[16.5%]">
                  {translator(headers[1], language)}
                </span>
                <span className="w-[15%] text-right text-[#F0F0F080]">
                  {translator(headers[2], language)}
                </span>
              </div>
            )}

            {myData && (
              <div className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] border-2 border-[#5F4DFF] border-opacity-50 bg-[#121418] py-3 pr-10">
                <span className="w-[10%] text-center ml-10 font-changa text-sm font-light text-[#F0F0F0] text-opacity-75">
                  {myData?.rank}
                </span>
                <span className="w-[70%] flex items-center gap-2 text-left font-changa text-sm font-light text-[#F0F0F0] text-opacity-75 pl-[16.5%]">
                  {/* <div className="relative w-8 h-8">
                    <Image
                      src={pointTier?.image}
                      alt={pointTier?.label}
                      layout="fill"
                      objectFit="contain"
                      objectPosition="center"
                    />
                  </div> */}
                  {/* {obfuscatePubKey(myData.wallet ?? "")} */}
                  {myData?.name ?? obfuscatePubKey(myData.wallet)}
                </span>
                <span className="flex gap-2 items-center justify-end w-[15%] text-right font-chakra text-sm font-bold text-[#FFFFFF]">
                  {/* {myData.points.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 0,
                  })} */}
                  <Image src="/assets/coin.svg" width={13} height={13} />
                  {parseInt(myData?.deposit?.amount ?? 0)}
                </span>
              </div>
            )}

            {data.length > 0 ? (
              data
                .slice(
                  page * transactionsPerPage - transactionsPerPage,
                  page * transactionsPerPage,
                )
                .filter(
                  (data: any) =>
                    data?.email !== session?.user?.email ||
                    data?.wallet !== session?.user?.wallet,
                )
                .map((data: any, index: number) => (
                  <div
                    key={index}
                    className={`mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] ${index % 2 === 0 ? "bg-opacity-50" : ""} bg-[#121418]  py-3 pr-10`}
                  >
                    <span className="w-[10%] text-center ml-10 font-changa text-sm font-light text-[#F0F0F0] text-opacity-75">
                      {data?.rank}
                    </span>
                    <span className="w-[70%] flex items-center gap-2 text-left font-changa text-sm font-light text-[#FFFFFF] text-opacity-[0.78] pl-[16.5%]">
                      {/* <div className="relative w-8 h-8">
                        <Image
                          src={`/assets/badges/T-${Object.entries(
                            pointTiers,
                          ).reduce((acc: number, [key, value]) => {
                            return data?.points >= value?.limit
                              ? parseInt(key)
                              : acc;
                          }, 0)}.png`}
                          alt="Tier"
                          layout="fill"
                          objectFit="contain"
                          objectPosition="center"
                        />
                      </div> */}
                      {/* {obfuscatePubKey(data.wallet ?? "")} */}
                      {data?.name ?? obfuscatePubKey(data?.wallet)}
                    </span>
                    <span className="flex gap-2 items-center justify-end w-[15%] text-right font-chakra text-sm font-bold text-[#ffffff]">
                      <Image src="/assets/coin.svg" width={13} height={13} />
                      {parseInt(data?.deposit?.amount ?? 0)}
                    </span>
                  </div>
                ))
            ) : (
              <span className="w-full text-center font-changa text-[#F0F0F080]">
                {translator("No data.", language)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* pagination  */}
      <div className="mb-8 mt-4 flex w-full items-center justify-center gap-6 font-changa">
        <span
          onClick={() => {
            if (page > 1) setPage(page - 1);
          }}
          className="cursor-pointer text-[#F0F0F0]"
        >
          &lt;
        </span>
        {[...Array(maxPages)]
          .map((_, i) => ++i)
          .slice(0, 2)
          .map((i, index) => (
            <span
              key={index}
              onClick={() => {
                setPage(i);
              }}
              className={`${
                page === i ? "text-opacity-75" : "text-opacity-50"
              } text-[#F0F0F0] transition-all cursor-pointer hover:text-opacity-75`}
            >
              {i}
            </span>
          ))}
        {maxPages > 2 && (
          <span className="text-[#F0F0F0] cursor-default">. . .</span>
        )}

        {maxPages > 2 &&
          [...Array(maxPages)]
            .map((_, i) => ++i)
            .slice(maxPages - 2, maxPages)
            .map((i, index) => (
              <span
                key={index}
                onClick={() => {
                  setPage(i);
                }}
                className={`${
                  page === i ? "text-opacity-75" : "text-opacity-50"
                } text-[#F0F0F0] transition-all cursor-pointer hover:text-opacity-75`}
              >
                {i}
              </span>
            ))}
        <span
          onClick={() => {
            if (page != maxPages) setPage(page + 1);
          }}
          className="cursor-pointer text-[#F0F0F0]"
        >
          &gt;
        </span>
      </div>
    </div>
  );
}

export default Leaderboard;
