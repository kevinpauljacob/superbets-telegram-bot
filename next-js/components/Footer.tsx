import Image from "next/image";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useGlobalContext } from "./GlobalContext";
import Telegram from "@/public/assets/Telegram.svg";
import Twitter from "@/public/assets/Twitter.svg";
import logo from "@/public/assets/logowhite.svg";
import { MdOutlineLanguage } from "react-icons/md";
import { FaChevronUp } from "react-icons/fa6";

function Footer() {
  const { language, setLanguage } = useGlobalContext();
  const [langSelect, setLangSelect] = useState(false);
  const router = useRouter();

  return (
    <div className="w-full h-full flex flex-col px-5 md:px-[3.5rem]">
      <div className="w-full h-full flex lg:flex-row flex-col lg:items-center items-start justify-start pt-5 gap-2">
        <div className="w-full lg:w-[45%] flex flex-col items-start">
          <span className="flex items-center font-medium text-[1.6rem] text-white">
            <Image src={logo} width={40} alt={"FOMO"} />
            FOMO
          </span>
          <p className="w-full flex flex-col text-[#94A3B8] font-medium font-chakra text-sm leading-6 text-opacity-80 lg:pt-4 pt-2 md:mx-0">
            <span className="mx-2">
              FOMO wtf casino games are currently in beta and will
              be undergoing audit shortly. FOMO wtf EXIT games
              has gone through audit performed by OtterSec
              in December 2023.
            </span>
          </p>
        </div>
        <div className="lg:w-[55%] w-full flex lg:flex-row flex-col items-start justify-start lg:pt-16 lg:pb-16 lg:px-24 pt-5 mx-2 gap-10 md:gap-8">
          <div className="flex gap-5">
            <div className="">
              <h3 className="font-semibold font-changa text-white text-base leading-[18px] pb-4 text-opacity-90">
                Services
              </h3>
              <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-5 text-sm leading-[14px] font-medium text-opacity-80">
                <span className="hover:cursor-pointer hover:underline decoration-1" onClick={() => router.push('/')}>
                  DCA
                </span>
                <span className="hover:cursor-pointer hover:underline decoration-1" onClick={() => router.push('/')}>
                  Docs
                </span>
                <span className="hover:cursor-pointer hover:underline decoration-1" onClick={() => router.push('/')}>
                  Wallet
                </span>
              </div>
            </div>
            <div className="px-10">
              <h3 className="font-semibold font-changa text-white text-base leading-[18px] pb-4 text-opacity-90">
                Platform
              </h3>
              <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-5 text-sm leading-[14px] font-medium text-opacity-80">
                <span
                  className="hover:cursor-pointer hover:underline decoration-1"
                  onClick={() => router.push("/leaderboard")}
                >
                  Leaderboard
                </span>
                <span
                  className="hover:cursor-pointer hover:underline decoration-1"
                  onClick={() => router.push("/staking")}
                >
                  Staking
                </span>
                <span
                  className="hover:cursor-pointer hover:underline decoration-1"
                  onClick={() => router.push("/store")}
                >
                  Store
                </span>
              </div>
            </div>
          </div>
          <div className="">
            <h3 className="font-semibold font-changa text-white text-base leading-[18px] b-3 text-opacity-90">
              Community
            </h3>
            <div className="flex flex-row items-start justify-start gap-2 pt-4">
              <p className="p-2 border-2 border-[#FFFFFF] rounded-full border-opacity-5 hover:bg-[#121519] hover:cursor-pointer">
                <Image src={Twitter} alt="" width={16} height={16} />
              </p>
              <p className="p-2 border-2 border-[#FFFFFF] rounded-full border-opacity-5 hover:bg-[#121519] hover:cursor-pointer">
                <Image src={Telegram} alt="" width={16} height={16} />
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-[1px] bg-[#94A3B8] bg-opacity-20 rounded-full mt-5 md:px-2 mx-2" />
      <div className="w-full font-inter flex lg:flex-row flex-col lg:items-center lg:justify-between lg:pb-10 pb-[150px] pt-5 md:px-2 mx-2">
        <p className="flex text-sm font-normal text-[#FFFFFF] text-opacity-50 font-sans gap-2">
          <span>@2024 fomowtf.com</span>
          <span>All rights reserved</span>
        </p>
        <div className="flex items-center lg:justify-center gap-5">
          <span className="font-changa text-[#FFFFFF] text-opacity-25 text-4xl font-semibold">
            18+
          </span>
          <button
            onClick={() => {
              setLangSelect(!langSelect);
            }}
            className="relative hidden lg:flex items-center hover:bg-[#0000009f] transition-all px-5 py-2 rounded-md font-sans"
          >
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
            <FaChevronUp className="w-3 h-3 text-white" />
            {langSelect && (
              <div className="w-full transition-all absolute bottom-full right-[1px] rounded px-1 py-2 gap-0.5 z-[100] flex flex-col bg-black">
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
        </div>
      </div>
    </div>
  );
}

export default Footer;
