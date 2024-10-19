import React, { useState, useEffect } from "react";
import { useGlobalContext } from "./GlobalContext";
import Image from "next/image";
import { RiMenuLine } from "react-icons/ri";
import { MdOutlineLanguage } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa6";
import ConnectWallet from "./ConnectWallet";
import { useRouter } from "next/router";
import Staking from "/public/assets/Stake1.svg";
import Leaderboard from "/public/assets/Leaderboard1.svg";
import Store from "/public/assets/store1.svg";
import HoverToolTip from "./ToolTipHover";
import Thunder from "../public/assets/thunder.svg";
import Trophy from "../public/assets/trophy.svg";
import CoinSelector from "./CoinSelector";

export function Header({
  sidebar,
  toggleSidebar,
}: {
  sidebar: boolean;
  toggleSidebar: () => void;
}) {
  const router = useRouter();
  const {
    language,
    setLanguage,
    mobileSidebar,
    setMobileSidebar,
    setShowConnectModal,
  } = useGlobalContext();
  const [langSelect, setLangSelect] = useState(false);

  return (
    <div
      className={`${
        sidebar ? "" : ""
      } z-[100] sticky top-0 w-full flex flex-col`}
    >
      <div
        className={`${
          sidebar ? "" : ""
        } w-full bg-[#121418] flex flex-col items-center py-4 px-4 border-b border-[#1E2220]`}
      >
        <div className="w-full relative flex flex-row items-center justify-between">
          {/* right */}
          <div className="flex flex-row items-center cursor-pointer gap-2 z-10">
            <div
              onClick={() => {
                if (mobileSidebar === true) setMobileSidebar(false);
                else router.push("/");
              }}
              className="flex sm:hidden relative"
            >
              <Image
                src={"/logo/superbets.svg"}
                width={150}
                height={30}
                alt={"SUPERBETS"}
                className=""
              />
            </div>
            <RiMenuLine
              onClick={() => toggleSidebar()}
              className={`hidden sm:flex text-white w-7 h-7 hover:text-[#8033D7] transition-all duration-75 ${
                sidebar ? "text-[#8033d7]" : "text-white"
              }`}
            />
            <div
              onClick={() => {
                router.push("/");
              }}
              className="hidden sm:flex items-center font-medium text-[1.6rem] text-white"
            >
              <Image
                src={"/logo/superbets.svg"}
                width={150}
                height={30}
                alt={"SUPERBETS"}
                className=""
              />
            </div>
          </div>
          {/* <div className="w-full justify-center absolute hidden md:flex">
            <CoinSelector />
          </div> */}
          {/* left  */}
          <div className="flex ml-2 lg:mr-2 sm:items-center items-end sm:flex-row z-10">
            <div className="flex gap-8 mr-6 items-end">
              {/* Language selector */}
              {/* <button
                onClick={() => {
                  setLangSelect(!langSelect);
                }}
                className="relative hidden md:flex items-center hover:bg-[#0000009f] transition-all p-1.5 rounded-md"
              >
                {" "}
                <MdOutlineLanguage className="w-5 h-5 mr-3 text-white text-opacity-50 z-[150]" />
                <span className="text-white text-sm mr-5 text-start text-opacity-50 z-[150]">
                  {language === "en"
                    ? "English"
                    : language === "ru"
                    ? "Русский"
                    : language === "ko"
                    ? "한국인"
                    : language === "ch"
                    ? "中国人"
                    : ""}
                </span>
                <FaChevronDown className="w-3 h-3 text-white z-[150]" />
                {langSelect && (
                  <div className="w-full transition-all absolute top-full mt-2 rounded px-1 py-2 gap-0.5 z-[150] flex flex-col bg-black">
                    <span
                      onClick={() => {
                        setLanguage("en");
                        setLangSelect(false);
                      }}
                      className="text-white text-sm py-1 text-opacity-50 hover:bg-[#ffffff21] transition-all rounded"
                    >
                      English
                    </span>
                    <span
                      onClick={() => {
                        setLanguage("ru");
                        setLangSelect(false);
                      }}
                      className="text-white text-sm py-1 text-opacity-50 hover:bg-[#ffffff21] transition-all rounded"
                    >
                      Русский
                    </span>
                    <span
                      onClick={() => {
                        setLanguage("ko");
                        setLangSelect(false);
                      }}
                      className="text-white text-sm py-1 text-opacity-50 hover:bg-[#ffffff21] transition-all rounded"
                    >
                      한국인
                    </span>
                    <span
                      onClick={() => {
                        setLanguage("ch");
                        setLangSelect(false);
                      }}
                      className="text-white text-sm py-1 text-opacity-50 hover:bg-[#ffffff21] transition-all rounded"
                    >
                      中国人
                    </span>
                  </div>
                )}
              </button> */}
              {/* <div className="flex sm:gap-8 flex-col sm:flex-row items-end sm:items-center">
              <span className="whitespace-nowrap flex items-center mt-0.5 sm:mt-0 gap-1 text-[#F0F0F0] text-opacity-75 font-medium text-sm sm:text-base">
                <Key className="text-white text-opacity-50" />
                {gameInfo?.totalTickets?.toNumber() ?? 0}
              </span>
              <span className="whitespace-nowrap flex items-center gap-1 text-[#00E372] text-opacity-75 text-shadow-black font-medium text-sm sm:text-base">
                <GiLockedChest />
                {(
                  (vaultInfo?.sidepotProbability?.toNumber() ?? 0) / 100
                ).toFixed(2)}
                % ({((vaultInfo?.sidepotAmount ?? 0) / 1e9).toFixed(4)} SOL)
              </span>
            </div> */}
            </div>

            {/* store & leaderboard */}
            <div className="flex items-center gap-4">
              <HoverToolTip text="Store">
                <button
                  onClick={() => {
                    router.push("store");
                  }}
                  className={`hidden xl:flex items-center text-white text-opacity-50 hover:text-opacity-90 focus:text-opacity-90 rounded-full ${
                    router.pathname.includes("store")
                      ? "bg-[#5F4DFF] text-opacity-75"
                      : ""
                  } bg-white/5 hover:bg-[#555555] focus:bg-[#5F4DFF] transition-all font-medium text-sm p-3 rounded-[0.625rem] gap-1`}
                >
                  <Image
                    src={Thunder}
                    alt="Store"
                    className="w-4 h-4"
                    width={20}
                    height={20}
                  />
                  <span className="text-sm font-medium tracking-wider font-sans">
                    Challenges
                  </span>
                </button>
              </HoverToolTip>
              <HoverToolTip text="Leaderboard">
                <button
                  onClick={() => {
                    router.push("leaderboard");
                  }}
                  className={`hidden xl:flex items-center text-white text-opacity-50 hover:text-opacity-90 focus:text-opacity-90 rounded-full ${
                    router.pathname.includes("leaderboard")
                      ? "bg-[#5F4DFF] text-opacity-75"
                      : ""
                  } bg-white/5 hover:bg-[#555555] focus:bg-[#5F4DFF] transition-all font-medium text-sm p-3 rounded-[0.625rem] gap-2.5`}
                >
                  <Image
                    src={Trophy}
                    alt="Leaderboard"
                    className="w-4 h-4"
                    width={20}
                    height={20}
                  />
                  <span className="text-sm font-medium tracking-wider font-sans">
                    Leaderboard
                  </span>
                </button>
              </HoverToolTip>
              {/* <HoverToolTip text="Staking">
                <button
                  onClick={() => {
                    router.push("stake");
                  }}
                  className={`hidden sm:flex items-center text-white text-opacity-50 hover:text-opacity-90 focus:text-opacity-90 rounded-full border-2 border-[rgba(255,255,255,0.05)] ${
                    router.pathname.includes("stake") ? "bg-[#5F4DFF]" : ""
                  } hover:bg-[#555555] focus:bg-[#5F4DFF] transition-all font-medium text-sm p-2`}
                >
                  <Image src={Staking} alt="Staking" width={20} height={20} />
                </button>
              </HoverToolTip> */}
              <ConnectWallet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
