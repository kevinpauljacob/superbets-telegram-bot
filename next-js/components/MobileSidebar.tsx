import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useWallet } from "@solana/wallet-adapter-react";
import { obfuscatePubKey } from "@/context/transactions";

export default function Sidebar({ mobileSidebar }: { mobileSidebar: boolean }) {
  const wallet = useWallet();
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
      className={`${mobileSidebar ? "fadeIn fixed" : "fadeOutDown hidden"} top-[12rem] z-20 md:hidden bg-[#121418] no-scrollbar overflow-y-auto text-white flex flex-col justify-between px-4 sm:px-8 py-3.5 w-full h-[calc(100vh-195px)]`}
    >
      <div>
        <div className="fadeInUp flex flex-col rounded-md py-3.5 px-3 sm:px-6">
          <div className="flex items-center w-full mb-2">
            <Image src={"/assets/userImg2.png"} alt="" width={60} height={60} />
            <div className="ml-1">
              <p className="text-white/75 text-md">
                {obfuscatePubKey(wallet?.publicKey?.toBase58() ?? "")}
              </p>
              <p className="text-white/50 text-sm">BRONZE</p>
            </div>
          </div>
          <Link
            href=""
            className="text-center text-[#9945FF] border border-[#9945FF] rounded-md py-1.5 w-full"
          >
            View Dashboard
          </Link>
        </div>
        <div>
          <div className="mt-4 fadeInUp">
            <div
              className={`flex items-center justify-between rounded-md p-1 ${
                showExitTokens ? "bg-[#161519]" : ""
              }`}
            >
              <p className="flex items-center">
                <Image
                  src={"/assets/dollar.png"}
                  alt=""
                  width={22}
                  height={22}
                />
                <span className="text-md font-semibold text-white/75 ml-2">
                  FOMO: Exit
                </span>
              </p>
              <button
                className="bg-[#1D1A21] rounded-md p-3"
                onClick={() => setShowExitTokens(!showExitTokens)}
              >
                <Image
                  src={
                    showExitTokens
                      ? "/assets/upArrow.png"
                      : "/assets/downArrow.png"
                  }
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
                  <li key={index} className="flex items-center p-2">
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
          <div className="mt-4 fadeInUp">
            <div
              className={`flex items-center justify-between rounded-md p-1 ${
                showPlayTokens ? "bg-[#161519]" : ""
              }`}
            >
              <p className="flex items-center">
                <Image src={"/assets/play.png"} alt="" width={22} height={22} />
                <span className="text-md font-semibold text-white/75 ml-2">
                  FOMO: Play
                </span>
              </p>
              <button
                className="bg-[#1D1A21] rounded-md p-3"
                onClick={() => setShowPlayTokens(!showPlayTokens)}
              >
                <Image
                  src={
                    showPlayTokens
                      ? "/assets/upArrow.png"
                      : "/assets/downArrow.png"
                  }
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
                  <li key={index} className="flex items-center p-2">
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
        <div className="fadeInUp flex flex-col">
          <Link
            href="/"
            className="bg-[#181A1D] hover:bg-[#47484a] focus:bg-[#47484a] rounded-md text-center font-bold text-white/50 py-2 mb-1.5"
          >
            DCA
          </Link>
          <Link
            href="/"
            className="bg-[#181A1D] hover:bg-[#47484a] focus:bg-[#47484a] rounded-md text-center font-bold text-white/50 py-2 mb-1.5"
          >
            Roadmap
          </Link>
          <Link
            href="/"
            className="bg-[#181A1D] hover:bg-[#47484a] focus:bg-[#47484a] rounded-md text-center font-bold text-white/50 py-2 mb-1.5"
          >
            Buy $FOMO
          </Link>
        </div>
        <div className="mt-9">
          <div className="flex justify-center">
            <Image
              src={"/assets/search.png"}
              alt=""
              width={14}
              height={14}
              className="mx-1.5"
            />
            <Image
              src={"/assets/twitter.png"}
              alt=""
              width={18}
              height={14}
              className="mx-1.5"
            />
            <Image
              src={"/assets/telegram.png"}
              alt=""
              width={18}
              height={15}
              className="mx-1.5"
            />
          </div>
          <div className="flex items-center justify-center my-3">
            <Image src={"/assets/ottersec.png"} alt="" width={17} height={17} />
            <p className="text-sm font-light text-white/50">
              Audited by OtterSec
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
