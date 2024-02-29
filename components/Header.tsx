import React, { useState } from "react";
import { IoMdMenu } from "react-icons/io";
import { IoMdDocument } from "react-icons/io";
import Sidebar from "./Sidebar";
import { useGlobalContext } from "./GlobalContext";
import Spinner from "./Spinner";
import Image from "next/legacy/image";
import Key from "@/public/assets/Key";
import { GiLockedChest, GiChest } from "react-icons/gi";
import { MdOutlineLanguage } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa6";
import ConnectWallet from "./ConnectWallet";
import { useRouter } from "next/router";

export function Header() {
  const router = useRouter();
  const { language, setLanguage } = useGlobalContext();

  const [open, setOpen] = useState(false);

  const [langSelect, setLangSelect] = useState(false);

  return (
    <div className="w-full bg-[#19161C] flex flex-col items-center py-4 lg:py-4 px-5 sm:px-10 2xl:px-[8%]">
      <Sidebar open={open} setOpen={setOpen} />
      <div className="w-full flex flex-row items-center justify-between">
        {/* right */}
        <div className="flex flex-row items-center">
          <div className="relative flex">
            <Image
              src={"/assets/logowhite.svg"}
              width={60}
              height={50}
              alt={"FOMO"}
              className=""
            />
          </div>
          <span className="hidden sm:flex items-center font-medium text-2xl text-white">
            {/* <Image
              src={"/assets/FOMO.png"}
              width={73}
              height={25}
              alt={"FOMO"}
            /> */}
            FOMO
          </span>
        </div>

        {/* left  */}
        <div className="flex ml-2 mr-2 sm:items-center items-end sm:flex-row">
          <div className="flex gap-8 mr-6 items-end">
            {/* Language selector */}
            <button className="relative hidden md:flex items-center">
              <MdOutlineLanguage className="w-5 h-5 mr-3 text-white text-opacity-50" />
              <span className="text-white text-sm mr-5 text-start text-opacity-50">
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
              <FaChevronDown
                onClick={() => {
                  setLangSelect(!langSelect);
                }}
                className="w-3 h-3 text-white"
              />
              {langSelect && (
                <div className="w-full transition-all absolute top-full mt-2 rounded px-1 py-2 gap-0.5 z-50 flex flex-col bg-black">
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
            </button>
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
            <button className="hidden sm:flex text-white text-opacity-50 bg-white bg-opacity-5 font-medium rounded-md text-sm px-5 py-3">
              Store
            </button>
            <button className="hidden sm:flex text-white text-opacity-50 bg-white bg-opacity-5 font-medium rounded-md text-sm px-5 py-3">
              Leaderboard
            </button>
            <button
              onClick={() => {
                router.push("stake");
              }}
              className="hidden sm:flex text-white bg-[#9945FF] font-medium rounded-md text-sm px-5 py-3"
            >
              Staking
            </button>
            <ConnectWallet />
          </div>

          <IoMdMenu
            className="flex cursor-pointer sm:hidden w-10 h-10 text-white"
            as="button"
            onClick={() => {
              setOpen(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}
