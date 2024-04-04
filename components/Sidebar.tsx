import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import userImg from "/public/assets/userImg2.png";
import dollar from "/public/assets/dollar.png";
import play from "/public/assets/play.png";
import search from "/public/assets/search.png";
import twitter from "/public/assets/twitter.png";
import telegram from "@/public/assets/telegram.png";
import ottersec from "@/public/assets/ottersec.png";
import upArrow from "@/public/assets/upArrow.png";
import downArrow from "@/public/assets/downArrow.png";
import { useWallet } from "@solana/wallet-adapter-react";
import { obfuscatePubKey } from "@/context/transactions";

export default function Sidebar() {
  const wallet = useWallet()
  const [showExitTokens, setShowExitTokens] = useState(false);
  const [showPlayTokens, setShowPlayTokens] = useState(false);

  const fomoToken = [
    {
      src: "/assets/sol.png",
      token: "SOL",
      active: true,
    },
    {
      src: "/assets/jup.png",
      token: "JUP",
      active: false,
    },
    {
      src: "/assets/usdt.png",
      token: "USDT",
      active: false,
    },
  ];

  return (
    <div
      className={`hidden bg-[#121418] text-white md:flex flex-col justify-between px-3.5 pb-3.5 min-w-[230px] w-[290px] min-h-full`}
    >
      <div>
        <div className="flex flex-col bg-[#202329] rounded-md py-3.5 px-1.5">
          <div className="flex items-center w-full mb-2">
            <Image src={userImg} alt="" width={60} height={60} />
            <div className="ml-1">
              <p className="text-white/75 text-md">{obfuscatePubKey(wallet.publicKey?.toBase58() ?? "")}</p>
              <p className="text-white/50 text-sm">BRONZE</p>
            </div>
          </div>
          <Link
            href=""
            className="text-center hover:bg-[#9945FF] transition duration-300 ease-in-out hover:text-white hover:transition hover:duration-300 hover:ease-in-out text-[#9945FF] border border-[#9945FF] rounded-md py-1.5 w-full"
          >
            View Dashboard
          </Link>
        </div>
        <div>
          <div className="mt-4">
            <div
              className={`flex items-center justify-between rounded-md p-1 ${
                showExitTokens ? "bg-[#161519]" : ""
              }`}
            >
              <p className="flex items-center">
                <Image src={dollar} alt="" width={22} height={22} />
                <span className="text-md font-semibold text-white/75 ml-2">
                  FOMO: Exit
                </span>
              </p>
              <button
                className={`${
                  showExitTokens ? "bg-white/10" : "bg-[#1D1A21]"
                } hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out rounded-md p-3`}
                onClick={() => setShowExitTokens(!showExitTokens)}
              >
                <Image
                  src={showExitTokens ? upArrow : downArrow}
                  alt=""
                  width={10}
                  height={10}
                  className=""
                />
              </button>
            </div>
            {showExitTokens && (
              <ul className="mt-1">
                {fomoToken.map((token, index) => (
                  <li
                    key={index}
                    className={`${
                      token.active ? "bg-white/10" : ""
                    } flex items-center rounded-md p-2`}
                  >
                    <Image src={token.src} alt="" width={18} height={18} />
                    <span
                      className={`ml-3 font-semibold ${
                        token.active ? "text-[#7839C5]" : "text-white/75"
                      }`}
                    >
                      ${token.token}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4">
            <div
              className={`flex items-center justify-between rounded-md p-1 ${
                showPlayTokens ? "bg-[#161519]" : ""
              }`}
            >
              <p className="flex items-center">
                <Image src={play} alt="" width={22} height={22} />
                <span className="text-md font-semibold text-white/75 ml-2">
                  FOMO: Play
                </span>
              </p>
              <button
                className={`${
                  showPlayTokens ? "bg-white/10" : "bg-[#1D1A21]"
                } hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out rounded-md p-3`}
                onClick={() => setShowPlayTokens(!showPlayTokens)}
              >
                <Image
                  src={showPlayTokens ? upArrow : downArrow}
                  alt=""
                  width={10}
                  height={10}
                  className=""
                />
              </button>
            </div>
            {showPlayTokens && (
              <ul className="mt-1">
                {fomoToken.map((token, index) => (
                  <li
                    key={index}
                    className={`${
                      token.active ? "bg-white/10" : ""
                    } flex items-center rounded-md p-2`}
                  >
                    <Image src={token.src} alt="" width={18} height={18} />
                    <span
                      className={`ml-3 font-semibold ${
                        token.active ? "text-[#7839C5]" : "text-white/75"
                      }`}
                    >
                      ${token.token}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div>
        <div className="flex flex-col">
          <Link
            href="/"
            className="hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out bg-[#181A1D] rounded-md text-center font-bold text-white/50 py-2 mb-1.5"
          >
            DCA
          </Link>
          <Link
            href="/"
            className="hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out bg-[#181A1D] rounded-md text-center font-bold text-white/50 py-2 mb-1.5"
          >
            Roadmap
          </Link>
          <Link
            href="/"
            className="hover:bg-white/10 transition duration-300 ease-in-out hover:transition hover:duration-300 hover:ease-in-out bg-[#181A1D] rounded-md text-center font-bold text-white/50 py-2 mb-1.5"
          >
            Buy $FOMO
          </Link>
        </div>
        <div className="mt-9">
          <div className="flex justify-center">
            <Image
              src={search}
              alt=""
              width={14}
              height={14}
              className="mx-1.5"
            />
            <Image
              src={twitter}
              alt=""
              width={18}
              height={14}
              className="mx-1.5"
            />
            <Image
              src={telegram}
              alt=""
              width={18}
              height={15}
              className="mx-1.5"
            />
          </div>
          <div className="flex items-center justify-center my-3">
            <Image src={ottersec} alt="" width={17} height={17} />
            <p className="text-sm font-light text-white/50">
              Audited by OtterSec
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
