import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useGlobalContext } from "./GlobalContext";
import Telegram from "@/public/assets/Telegram";
import Twitter from "@/public/assets/Twitter";
import logo from "@/public/assets/logowhite.svg";
import { MdOutlineLanguage } from "react-icons/md";
import { FaChevronUp } from "react-icons/fa6";
import { translator } from "@/context/transactions";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSession } from "next-auth/react";
import { handleSignIn } from "./ConnectWallet";

function Footer() {
  const { data: session, status } = useSession();
  const wallet = useWallet();
  const walletModal = useWalletModal();

  const { language, setLanguage, setShowWalletModal, setShowConnectModal } =
    useGlobalContext();
  const [langSelect, setLangSelect] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-center px-5 lg2:px-[4rem] md:px-[3rem] pt-5">
        <div className="w-full h-full flex lg2:flex-row flex-col lg2:items-center items-start lg2:pt-10 lg2:pb-16 pt-5 pb-5 gap-5">
          <div className="lg2:w-[30%] md:w-[60%] w-[90%]">
            <Image
              src={"/logo/superbets.svg"}
              width={150}
              height={30}
              alt={"SUPERBETS"}
              className="ml-2"
            />
            <p className="flex flex-col text-[#94A3B8] font-medium font-chakra text-sm leading-6 text-opacity-80 md:mx-0 md:mt-2 mb-2">
              <span className="md:mt-2 mx-2">
                {translator(
                  "SUPERBETS casino games are currently in beta and will be undergoing audit shortly.",
                  language,
                )}
                <br />
                <br />
                {translator("Contact", language)} : hi@superbets.com
              </span>
            </p>
          </div>
          <div className="flex items-start justify-start gap-20 lg2:pl-16">
            <div className="mx-2">
              <h3 className="font-semibold font-changa text-white text-base leading-[18px] pb-4 text-opacity-90">
                {translator("Services", language)}
              </h3>
              <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-5 text-sm leading-[14px] font-medium text-opacity-80">
                <Link
                  href="https://dca.fomosolana.com/"
                  target="_blank"
                  className="hover:cursor-pointer hover:underline decoration-1"
                >
                  DCA
                </Link>
                <Link
                  href="docs.fomowtf.com"
                  target="_blank"
                  className="hover:cursor-pointer hover:underline decoration-1"
                >
                  {translator("Docs", language)}
                </Link>
                <span
                  className="hover:cursor-pointer hover:underline decoration-1"
                  onClick={() => {
                    wallet.connected && status === "authenticated"
                      ? setShowWalletModal(true)
                      : setShowConnectModal(true);
                  }}
                >
                  {translator("Wallet", language)}
                </span>
              </div>
            </div>
            <div className="mx-2">
              <h3 className="font-semibold font-changa text-white text-base leading-[18px] pb-4 text-opacity-90">
                {translator("Platform", language)}
              </h3>
              <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-5 text-sm leading-[14px] font-medium text-opacity-80">
                <span
                  className="hover:cursor-pointer hover:underline decoration-1"
                  onClick={() => router.push("/leaderboard")}
                >
                  {translator("Leaderboard", language)}
                </span>
                <span
                  className="hover:cursor-pointer hover:underline decoration-1"
                  onClick={() => router.push("/stake")}
                >
                  {translator("Staking", language)}
                </span>
                <span
                  className="hover:cursor-pointer hover:underline decoration-1"
                  onClick={() => router.push("/store")}
                >
                  {translator("Store", language)}
                </span>
              </div>
            </div>
          </div>
          <div className="lg2:pl-12 lg2:mb-12">
            <div className="mx-2">
              <h3 className="font-semibold font-changa text-white text-base leading-[18px] text-opacity-90">
                {translator("Community", language)}
              </h3>
              <div className="flex flex-row items-start justify-start gap-2 pt-4">
                <Link href="https://x.com/superbetgames" target="_blank">
                  <div className="p-2 border-2 border-[#FFFFFF] rounded-full border-opacity-5 hover:bg-[#121519] hover:cursor-pointer">
                    <Twitter className="w-3 h-3 text-white group-hover:text-[#5F4DFF] group-focus:text-[#5F4DFF] transition-all" />
                  </div>
                </Link>{" "}
                <Link href="https://t.me/superbetgames " target="_blank">
                  <div className="p-2 border-2 border-[#FFFFFF] rounded-full border-opacity-5 hover:bg-[#121519] hover:cursor-pointer">
                    <Telegram className="w-3 h-3 text-white group-hover:text-[#5F4DFF] group-focus:text-[#5F4DFF] transition-all" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-[1px] bg-[#94A3B8] bg-opacity-20 rounded-full mt-5 md:px-2 mx-2" />
        <div className="w-full font-inter flex lg2:flex-row flex-col lg2:items-center lg2:justify-between lg2:pb-10 pb-[150px] pt-5 md:px-2 mx-2">
          <p className="flex text-sm font-normal text-[#FFFFFF] text-opacity-50 font-sans gap-2">
            <span>&copy;2024 superbets.com</span>
            <span>{translator("All rights reserved", language)}</span>
          </p>
          <div className="flex items-center lg2:justify-center gap-5">
            <span className="font-changa text-[#FFFFFF] text-opacity-25 text-4xl font-semibold">
              18+
            </span>
            <button
              onClick={() => {
                setLangSelect(!langSelect);
              }}
              className="relative hidden lg2:flex items-center hover:bg-[#0000009f] transition-all px-5 py-2 rounded-md font-sans"
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
    </>
  );
}

export default Footer;
