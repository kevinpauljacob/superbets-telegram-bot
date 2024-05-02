import React, { useState } from "react";
import Image from "next/image";
import { useGlobalContext } from "./GlobalContext";
import Telegram from "@/public/assets/Telegram.svg";
import Twitter from "@/public/assets/Twitter.svg";
import logo from "@/public/assets/logowhite.svg";
import { MdOutlineLanguage } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa6";

function Footer() {
  const { language, setLanguage } = useGlobalContext();
  const [langSelect, setLangSelect] = useState(false);
  return (
    <div className="w-full h-full flex flex-col px-5 md:px-[3.5rem]">
      <div className="w-full h-full flex lg:flex-row flex-col lg:items-center items-start pt-10 gap-2 lg:min-w-[1100px]">
        <div className="w-[1/3] flex items-center lg:pb-24 pb-5">
          <Image src={logo} width={50} height={40} alt={"FOMO"}></Image>
          <span className="items-center font-medium text-[1.6rem] text-white">
            FOMO
          </span>
        </div>
        <div className="w-[2/3] flex lg:flex-row flex-col items-start lg:pt-16 lg:pb-16 lg:mx-24 mx-2 gap-10 md:gap-8">
          <div className="flex">
            <div className="lg:px-10">
              <h3 className="font-semibold font-changa text-white text-base leading-[18px] pb-4 text-opacity-90">
                Services
              </h3>
              <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-5 text-sm leading-[14px] font-medium text-opacity-80">
                <span>DCA</span>
                <span>Roadmap</span>
                <span>Game Responsibily</span>
              </div>
            </div>
            <div className="px-10">
              <h3 className="font-semibold font-changa text-white text-base leading-[18px] pb-4 text-opacity-90">
                Support
              </h3>
              <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-5 text-sm leading-[14px] font-medium text-opacity-80">
                <span>Provably Fair</span>
                <span>Affiliate Program</span>
                <span>Redeem Code</span>
              </div>
            </div>
          </div>
          <div className="lg:px-10">
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
      <div>
        <p className="text-[#94A3B8] font-medium font-chakra text-sm leading-6 pt-10 text-opacity-80 md:px-2 mx-2">
          Shuffle is owned and operated by Natural Nine B.V., Curaçao company
          registration number 160998, with its registered address at
          Korporaalweg 10, Willemstad, Curaçao. Shuffle is authorized and
          regulated by the Government of Curaçao and operates under License No.
          8048/JAZ issued to Antillephone. Shuffle’s payment agent company is
          River Card Limited, Cyprus company registration number HE 431566, with
          its registered address at 50 Spyrou Kyprianou Avenue, Irida Tower 3,
          Floor 6, 6057 Larnaca, Cyprus. Contact us at support@shuffle.com.
        </p>
      </div>
      <div className="w-full h-[1px] bg-[#94A3B8] bg-opacity-20 rounded-full mt-8 md:px-2 mx-2" />
      <div className="w-full flex lg:flex-row flex-col lg:items-center lg:justify-between lg:pb-32 pb-36 pt-5 font-inter md:px-2 mx-2">
        <p className="flex text-sm font-normal text-[#FFFFFF] text-opacity-50 font-sans gap-2">
          <span>@2024 Fomo.com</span>
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
            <FaChevronDown className="w-3 h-3 text-white" />
            {langSelect && (
              <div className="w-full transition-all absolute top-full right-[1px] rounded px-1 py-2 gap-0.5 z-[100] flex flex-col bg-black">
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
