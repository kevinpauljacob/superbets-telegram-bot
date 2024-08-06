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
              <div className="mb-[0.5rem] flex w-full flex-row items-center gap-2 text-sm font-light font-changa px-5 sm:px-20">
                <span className="w-[10%] text-left text-[#F0F0F080]">
                  {translator(headers[0], language)}
                </span>
                <span className="w-[70%] text-left pl-5 sm:pl-20 text-[#F0F0F080]">
                  {translator(headers[1], language)}
                </span>
                <span className="w-[20%] text-right text-[#F0F0F080]">
                  {translator(headers[2], language)}
                </span>
              </div>
            )}

            {myData && (
              <div className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] border-2 border-[#5F4DFF] border-opacity-50 bg-[#121418] py-3 px-5 sm:px-20">
                <span className="relative w-[10%] text-center  font-changa text-sm font-light text-[#F0F0F0] text-opacity-75">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 30 30"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative"
                  >
                    <path
                      d="M29.4218 13.1772L28.1959 11.5463C27.8187 10.9707 27.5358 10.2991 27.6301 9.62757V9.53163L27.7244 7.61291C27.7244 6.2698 26.8757 5.02263 25.5555 4.63888L23.8581 4.1592C23.198 3.96733 22.5379 3.48765 22.1607 2.91203L21.2177 1.37705C20.4633 0.225817 18.9544 -0.3498 17.5399 0.225818L16.0311 0.801435C15.6539 0.897371 15.2767 0.993307 14.9938 0.993307C14.7109 0.993307 14.2394 0.897371 13.9565 0.801435L12.4477 0.225818C11.1275 -0.253864 9.61867 0.225817 8.76997 1.37705L7.82696 2.91203C7.44976 3.48765 6.88395 3.96733 6.12955 4.1592L4.43213 4.63888C3.11192 5.02263 2.26322 6.2698 2.26322 7.61291L2.35752 9.62757C2.35752 10.1073 2.26322 10.491 2.16892 10.8747C2.07462 11.0666 1.98032 11.2585 1.79171 11.5463L0.565804 13.1772C-0.188601 14.2325 -0.188601 15.7675 0.565804 16.8228L1.79171 18.4537C1.98032 18.6456 2.07462 18.8374 2.16892 19.1253C2.35752 19.509 2.45182 19.9887 2.35752 20.3724L2.26322 22.3871C2.26322 23.7302 3.11192 24.9774 4.43213 25.3611L5.75234 25.7449L6.12955 25.8408C6.78965 26.0327 7.44976 26.5123 7.82696 27.088L8.76997 28.6229C9.52437 29.7742 11.0332 30.3498 12.4477 29.7742L13.9565 29.1986C14.5223 29.0067 15.0881 28.9108 15.6539 29.1026C15.8425 29.1026 15.9368 29.1986 16.1254 29.1986L17.6342 29.7742C18.9544 30.2539 20.4633 29.7742 21.312 28.6229L22.255 27.088C22.6322 26.5123 23.198 26.0327 23.9524 25.8408L25.6498 25.3611C26.97 24.9774 27.8187 23.7302 27.8187 22.3871L27.7244 20.3724C27.7244 19.7009 27.913 19.0293 28.2902 18.4537L29.5161 16.8228C30.1762 15.7675 30.1762 14.2325 29.4218 13.1772Z"
                      fill="#19202D"
                    />
                  </svg>

                  <p className="absolute top-[4px] left-[11.5px]">
                    {myData?.rank}
                  </p>
                </span>
                <span className="w-[70%] flex items-center text-left font-changa text-sm font-light text-[#F0F0F0] text-opacity-75 pl-5 sm:pl-20">
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
                <span className="flex gap-2 items-center justify-end w-[20%] text-right font-chakra text-sm font-bold text-[#FFFFFF]">
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
                    (data?.email && data?.email !== session?.user?.email) ||
                    (data?.wallet && data?.wallet !== session?.user?.wallet),
                )
                .map((data: any, index: number) => (
                  <div
                    key={index}
                    className={`mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] px-5 sm:px-20 ${
                      index % 2 === 0 ? "bg-opacity-50" : ""
                    } bg-[#121418]  py-3`}
                  >
                    <span className="relative w-[10%] text-center font-changa text-sm font-light text-[#F0F0F0] text-opacity-75">
                      <svg
                        width="30"
                        height="30"
                        viewBox="0 0 30 30"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="relative"
                      >
                        <path
                          d="M29.4218 13.1772L28.1959 11.5463C27.8187 10.9707 27.5358 10.2991 27.6301 9.62757V9.53163L27.7244 7.61291C27.7244 6.2698 26.8757 5.02263 25.5555 4.63888L23.8581 4.1592C23.198 3.96733 22.5379 3.48765 22.1607 2.91203L21.2177 1.37705C20.4633 0.225817 18.9544 -0.3498 17.5399 0.225818L16.0311 0.801435C15.6539 0.897371 15.2767 0.993307 14.9938 0.993307C14.7109 0.993307 14.2394 0.897371 13.9565 0.801435L12.4477 0.225818C11.1275 -0.253864 9.61867 0.225817 8.76997 1.37705L7.82696 2.91203C7.44976 3.48765 6.88395 3.96733 6.12955 4.1592L4.43213 4.63888C3.11192 5.02263 2.26322 6.2698 2.26322 7.61291L2.35752 9.62757C2.35752 10.1073 2.26322 10.491 2.16892 10.8747C2.07462 11.0666 1.98032 11.2585 1.79171 11.5463L0.565804 13.1772C-0.188601 14.2325 -0.188601 15.7675 0.565804 16.8228L1.79171 18.4537C1.98032 18.6456 2.07462 18.8374 2.16892 19.1253C2.35752 19.509 2.45182 19.9887 2.35752 20.3724L2.26322 22.3871C2.26322 23.7302 3.11192 24.9774 4.43213 25.3611L5.75234 25.7449L6.12955 25.8408C6.78965 26.0327 7.44976 26.5123 7.82696 27.088L8.76997 28.6229C9.52437 29.7742 11.0332 30.3498 12.4477 29.7742L13.9565 29.1986C14.5223 29.0067 15.0881 28.9108 15.6539 29.1026C15.8425 29.1026 15.9368 29.1986 16.1254 29.1986L17.6342 29.7742C18.9544 30.2539 20.4633 29.7742 21.312 28.6229L22.255 27.088C22.6322 26.5123 23.198 26.0327 23.9524 25.8408L25.6498 25.3611C26.97 24.9774 27.8187 23.7302 27.8187 22.3871L27.7244 20.3724C27.7244 19.7009 27.913 19.0293 28.2902 18.4537L29.5161 16.8228C30.1762 15.7675 30.1762 14.2325 29.4218 13.1772Z"
                          fill="#19202D"
                        />
                      </svg>

                      <p className="absolute top-[4px] left-[11.5px]">
                        {data?.rank}
                      </p>
                    </span>
                    <span className="w-[70%] flex items-center gap-2 text-left font-changa text-sm font-light text-[#FFFFFF] text-opacity-[0.78] pl-5 sm:pl-20">
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
                    <span className="flex gap-2 items-center justify-end w-[20%] text-right font-chakra text-sm font-bold text-[#ffffff]">
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
