import { IoMdCloseCircleOutline, IoMdDocument, IoMdMenu } from "react-icons/io";
import { FaStopwatch, FaKey, FaParachuteBox, FaLink } from "react-icons/fa";
import { useGlobalContext } from "./GlobalContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Spinner from "./Spinner";
import { obfuscatePubKey, translator } from "@/context/transactions";
import { MdOutlineLanguage } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa6";
import { useState } from "react";
import ConnectWallet from "./ConnectWallet";
import { useRouter } from "next/router";

interface Sidebar {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ open, setOpen }: Sidebar) {
  const { language, setLanguage } = useGlobalContext();
  const router = useRouter();
  const wallet = useWallet();
  const walletModal = useWalletModal();

  async function logout() {
    try {
      await wallet.disconnect();
    } catch (e) {
      console.log(e);
    }
  }

  const [langSelect, setLangSelect] = useState(false);

  return (
    <div
      className={`flex sm:hidden flex-col px-8 pt-5 items-end w-[18rem] min-h-full z-50 bg-[#19161C] transition-all absolute top-0 ${
        open ? "right-0" : "-right-[18rem]"
      }`}
    >
      <IoMdMenu
        className="flex cursor-pointer sm:hidden w-10 h-10 text-white"
        as="button"
        onClick={() => {
          setOpen(false);
        }}
      />

      <div className="flex w-full flex-col pt-10 gap-5 items-center">
        {/* store & leaderboard */}
        <button className="w-full flex justify-center text-white text-opacity-50 bg-white bg-opacity-5 font-medium rounded-md text-sm px-5 py-3">
          Store
        </button>
        <button className="w-full flex justify-center text-white text-opacity-50 bg-white bg-opacity-5 font-medium rounded-md text-sm px-5 py-3">
          Leaderboard
        </button>
        <button
          onClick={() => {
            router.push("stake");
          }}
          className="w-full flex justify-center text-white bg-[#9945FF] font-medium rounded-md text-sm px-5 py-3"
        >
          Staking
        </button>
        <ConnectWallet />

        <button className="relative flex mt-5 items-center">
          <MdOutlineLanguage className="w-5 h-5 mr-3 text-white text-opacity-50" />
          <span className="text-white text-sm mr-5 text-start text-opacity-50">
            {language === "en"
              ? "English"
              : language === "ru"
              ? "Русский"
              : language === "ko"
              ? "한국인"
              : "中国人"}
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
      </div>
    </div>
  );
}
