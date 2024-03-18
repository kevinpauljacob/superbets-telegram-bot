import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import Head from "next/head";
import { User, obfuscatePubKey, pointTiers } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import Image from "next/legacy/image";

function Leaderboard() {
  const wallet = useWallet();

  const { language, getUserDetails, pointTier } = useGlobalContext();

  const [maxPages, setMaxPages] = useState<number>(0);

  const [page, setPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [myData, setMyData] = useState<any>();

  const transactionsPerPage = 10;

  const getLeaderBoard = async () => {
    try {
      const res = await fetch("/api/getInfo", {
        method: "POST",
        body: JSON.stringify({
          option: 2,
          wallet: wallet.publicKey,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      let { success, message, users } = await res.json();

      if (success && Array.isArray(users)) {
        users = users.map((user, index) => {
          return { ...user, rank: index + 1 };
        });

        setMaxPages(Math.ceil(users.length / transactionsPerPage));

        setData(users);

        if (wallet.publicKey) {
          let userInfo = users.find(
            (info: any) => info.wallet == wallet.publicKey?.toBase58(),
          );

          setMyData(userInfo);
        }
      } else {
        setData([]);
        toast.error("Could not fetch leaderboard.");
      }
    } catch (e) {
      setData([]);
      toast.error("Could not fetch leaderboard.");
      console.error(e);
    }
  };

  useEffect(() => {
    getLeaderBoard();
    if (wallet.publicKey) getUserDetails();
  }, [wallet.publicKey]);

  const headers = ["Rank", "Wallet", "Points"];

  return (
    <div className="relative mb-10 mt-5 flex h-full w-full flex-col flex-wrap items-center justify-center pl-2 pr-2">
      <div className="w-[95%] overflow-x-auto">
        {/* table  */}
        <div className="scrollbar mt-10 w-full min-w-[10rem] overflow-x-auto px-5 pb-8">
          <div className="flex w-full flex-col items-center">
            {/* header  */}
            {data.length > 0 && (
              <div className="mb-5 flex w-full flex-row items-center gap-2 pr-10">
                <span className="w-[10%] text-right font-medium text-[#F0F0F080]">
                  {headers[0]}
                </span>
                <span className="w-[70%] text-left font-medium text-[#F0F0F080] pl-[18%]">
                  {headers[1]}
                </span>
                <span className="w-[15%] text-right font-medium text-[#F0F0F080]">
                  {headers[2]}
                </span>
              </div>
            )}

            {myData && (
              <div className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] border-2 border-[#9945ff] border-opacity-50 bg-[#9945FF] bg-opacity-[0.075] py-3 pr-10">
                <span className="w-[10%] text-right font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {myData.rank}
                </span>
                <span className="w-[70%] flex items-center gap-2 text-left font-changa text-sm text-[#F0F0F0] text-opacity-75 pl-[15%]">
                  <div className="relative w-8 h-8">
                    <Image
                      src={pointTier.image}
                      layout="fill"
                      objectFit="contain"
                      objectPosition="center"
                    />
                  </div>
                  {obfuscatePubKey(myData.wallet ?? "")}
                </span>
                <span className="w-[15%] text-right font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {myData.points.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>
            )}

            {data.length > 0 ? (
              data
                .slice(
                  page * transactionsPerPage - transactionsPerPage,
                  page * transactionsPerPage,
                )
                .filter((data) => data.wallet !== wallet.publicKey?.toBase58())
                .map((data, index) => (
                  <div
                    key={index}
                    className={`mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] ${
                      index % 2 === 0
                        ? myData
                          ? "bg-transparent"
                          : "bg-[#9945FF] bg-opacity-[0.075]"
                        : myData
                        ? "bg-[#9945FF] bg-opacity-[0.075]"
                        : "bg-transparent"
                    } py-3 pr-10`}
                  >
                    <span className="w-[10%] text-right font-changa text-sm text-[#F0F0F0] text-opacity-75">
                      {data.rank}
                    </span>
                    <span className="w-[70%] flex items-center gap-2 text-left font-changa text-sm text-[#F0F0F0] text-opacity-75 pl-[15%]">
                      <div className="relative w-8 h-8">
                        <Image
                          src={`/assets/badges/T-${Object.entries(
                            pointTiers,
                          ).reduce((acc: number, [key, value]) => {
                            return data?.points >= value.limit
                              ? parseInt(key)
                              : acc;
                          }, 0)}.png`}
                          layout="fill"
                          objectFit="contain"
                          objectPosition="center"
                        />
                      </div>
                      {obfuscatePubKey(data.wallet ?? "")}
                    </span>
                    <span className="w-[15%] text-right font-changa text-sm text-[#F0F0F0] text-opacity-75">
                      {parseInt(data?.points ?? 0)}
                    </span>
                  </div>
                ))
            ) : (
              <span className="w-full text-center font-changa text-[#F0F0F080]">
                No data.
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