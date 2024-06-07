import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { obfuscatePubKey } from "@/context/transactions";
import { errorCustom } from "../toasts/ToastGroup";
import FOMOHead from "../HeadElement";

function Leaderboard() {
  const wallet = useWallet();

  const [isWeekly, setIsWeekly] = useState<boolean>(false);
  const [maxPages, setMaxPages] = useState<number>(0);

  const [page, setPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [myData, setMyData] = useState<any>();

  const transactionsPerPage = 10;

  useEffect(() => {
    if (isWeekly)
      fetch(`/api/user/getWeeklyUsers`)
        .then((res) => res.json())
        .then((history) => {
          if (history.success) {
            let users = history.data
              .map((data: any) => {
                return {
                  ...data,
                  address: obfuscatePubKey(data.wallet),
                  won: data.won.toFixed(4),
                  lost: data.lost.toFixed(4),
                  total: data.total.toFixed(4),
                  sns: data.sns == "undefined.sol" ? "" : data.sns,
                };
              })
              .map((data: any, index: number) => {
                return { data, rank: index + 1 };
              });

            setMaxPages(Math.ceil(users.length / transactionsPerPage));

            setData(users);

            // console.log("sss");
          } else {
            setData([]);
            errorCustom("Could not fetch history.");
          }
        });
    else
      fetch(`/api/user/getAllUsers`)
        .then((res) => res.json())
        .then((history) => {
          if (history.success) {
            let users = history.data
              .map((data: any) => {
                return {
                  ...data,
                  address: obfuscatePubKey(data.wallet),
                  won: data.won.toFixed(4),
                  lost: data.lost.toFixed(4),
                  total: data.total.toFixed(4),
                  sns: data.sns == "undefined.sol" ? "" : data.sns,
                };
              })
              .map((data: any, index: number) => {
                return { data, rank: index + 1 };
              });

            setMaxPages(Math.ceil(users.length / transactionsPerPage));

            setData(users);
          } else {
            setData([]);
            errorCustom("Could not fetch history.");
          }
        });
  }, [isWeekly]);

  useEffect(() => {
    if (!wallet.publicKey) return;

    let userInfo = data.find(
      (info: any) =>
        info.data.address ==
        obfuscatePubKey(wallet.publicKey ? wallet.publicKey.toBase58() : ""),
    );

    setMyData(userInfo);
  }, [wallet.publicKey, data]);

  const headers = [
    "Rank",
    "Address",
    "No. of bets",
    "No. of flips",
    "No. of rolls",
    "PnL",
    "Total Volume",
  ];

  return (
    <>
      <FOMOHead title={"Leaderboard | FOMO.wtf - 0% House Edge, Pure Wins"} />
      <div className="relative mb-20 mt-10 flex h-full w-full flex-col flex-wrap items-center justify-center pl-2 pr-2">
        <h2 className="text-shadow-pink mb-10 flex w-[95%] max-w-[65rem] justify-between rounded-[5px] bg-[#0f0f0f] p-8 py-4 text-center text-2xl text-[#F0F0F0] text-opacity-75">
          {isWeekly ? <>Weekly Leaderboard</> : <>All Time Leaderboard</>}
          <button
            type="button"
            onClick={() => setIsWeekly(!isWeekly)}
            className={`relative flex h-6 w-14 items-center p-1 transition delay-200 duration-500 ${
              isWeekly ? "bg-white" : "bg-black"
            } rounded-full`}
          >
            <div
              className={`transition-width flex h-5 justify-end rounded-full bg-transparent duration-500  ${
                isWeekly ? "w-full" : "w-5"
              }`}
            >
              <div
                className={` h-5 w-5 rounded-full transition duration-500  ${
                  isWeekly ? " bg-[#474747]" : "bg-[#838383]"
                }`}
              ></div>
            </div>
          </button>
        </h2>

        <div className="w-[95%] max-w-[65rem] overflow-x-auto rounded-[5px] bg-[#C20FC533] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          {/* table  */}
          <div className="scrollbar mt-10 w-full min-w-[50rem] overflow-x-auto px-5 pb-8">
            <div className="flex w-full flex-col items-center">
              {/* header  */}
              {data.length > 0 && (
                <div className="mb-[1.4rem] flex w-full flex-row items-center gap-2">
                  {headers.map((header, index) => (
                    <span
                      key={index}
                      className="w-full text-center font-changa text-[#F0F0F080]"
                    >
                      {header}
                    </span>
                  ))}
                </div>
              )}

              {myData && (
                <div className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] border-2 border-[#8A078A] bg-[#450549] py-3">
                  <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                    {myData.rank}
                  </span>
                  <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                    {myData.data.sns
                      ? myData.data.sns
                      : obfuscatePubKey(myData.data.wallet)}
                  </span>
                  <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                    {myData.data.bets}
                  </span>
                  <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                    {myData.data.flips}
                  </span>
                  <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                    {myData.data.rolls}
                  </span>
                  <span
                    className={`w-full text-center font-changa text-sm ${
                      myData.data.won - myData.data.lost > 0
                        ? "text-[#03A66D]"
                        : "text-[#CF304A]"
                    } text-opacity-75`}
                  >
                    {Math.abs(myData.data.won - myData.data.lost).toFixed(3)}
                  </span>
                  <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                    {myData.data.total}
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
                    (info) =>
                      info.data.address !=
                      obfuscatePubKey(
                        wallet.publicKey ? wallet.publicKey.toBase58() : "",
                      ),
                  )
                  .map((data, index) => (
                    <div
                      key={index}
                      className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#450549] py-3"
                    >
                      <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                        {data.rank}
                      </span>
                      <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                        {data.data.sns ? data.data.sns : data.data.address}
                      </span>
                      <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                        {data.data.bets}
                      </span>
                      <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                        {data.data.flips}
                      </span>
                      <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                        {data.data.rolls}
                      </span>
                      <span
                        className={`w-full text-center font-changa text-sm ${
                          data.data.won - data.data.lost > 0
                            ? "text-[#03A66D]"
                            : "text-[#CF304A]"
                        } text-opacity-75`}
                      >
                        {Math.abs(data.data.won - data.data.lost).toFixed(3)}
                      </span>
                      <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                        {data.data.total}
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
            .slice(0, 3)
            .map((i, index) => (
              <span
                key={index}
                onClick={() => {
                  setPage(i);
                }}
                className={`${
                  page === i ? "text-opacity-75" : "text-opacity-50"
                } text-[#F0F0F0] transition-all`}
              >
                {i}
              </span>
            ))}
          <span className="text-[#F0F0F0]">. . .</span>

          {[...Array(maxPages)]
            .map((_, i) => ++i)
            .slice(maxPages - 3, maxPages)
            .map((i, index) => (
              <span
                key={index}
                onClick={() => {
                  setPage(i);
                }}
                className={`${
                  page === i ? "text-opacity-75" : "text-opacity-50"
                } text-[#F0F0F0] transition-all`}
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
    </>
  );
}

export default Leaderboard;
