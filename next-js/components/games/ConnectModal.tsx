import { useWallet } from "@solana/wallet-adapter-react";
import React, { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  connection,
  deposit,
  obfuscatePubKey,
  translator,
  truncateNumber,
  withdraw,
} from "@/context/transactions";
import Loader from "./Loader";
import { useGlobalContext } from "../GlobalContext";
import { IoCloseOutline } from "react-icons/io5";
import Image from "next/image";
import { timestampParser } from "@/utils/timestampParser";
import { useRouter } from "next/router";
import { AdaptiveModal, AdaptiveModalContent } from "../AdaptiveModal";
import { SPL_TOKENS, spl_token } from "@/context/config";
import { Connection, ParsedAccountData, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { errorCustom } from "../toasts/ToastGroup";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { handleGoogle, handleSignIn } from "../ConnectWallet";

export default function ConnectModal() {
  const methods = useForm();
  const wallet = useWallet();
  const walletModal = useWalletModal();

  const router = useRouter();

  const { c: campaignId } = router.query;

  const {
    showConnectModal,
    setShowConnectModal,
    walletBalance,
    language,
    userTokens,
    setUserTokens,
    getBalance,
    coinData,
  } = useGlobalContext();

  const [loading, setLoading] = useState<boolean>(false);

  return (
    <AdaptiveModal
      open={showConnectModal}
      onOpenChange={() => setShowConnectModal(false)}
    >
      <AdaptiveModalContent className="bg-[#121418] sm:overflow-y-auto min-h-[50dvh] max-h-[80dvh] w-full pb-6">
        <div className="flex flex-1 px-6 sm:p-0 justify-center overflow-y-auto nobar">
          <div className="flex flex-col w-full">
            {/* header and logo  */}
            <div className="flex justify-center sm:justify-start items-center w-full mb-7 gap-2 mt-2">
              {/* <Image
                src={"/assets/wallet_color.png"}
                alt=""
                width={24}
                height={24}
              /> */}
              <span className=" text-[1.5rem] leading-5 mt-1 font-changa font-black text-[#e7e7e7]">
                {translator("Connect", language)}
              </span>
            </div>

            <button
              className={`w-full border-2 rounded-md py-2 text-white font-semibold text-xs sm:text-sm transition hover:duration-75 ease-in-out border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90`}
              onClick={handleGoogle}
            >
              {translator("Google", language)}
            </button>

            <span className="text-lg font-medium text-staking-secondary">
              OR
            </span>

            <button
              className={`w-full border-2 rounded-md py-2 text-white font-semibold text-xs sm:text-sm transition hover:duration-75 ease-in-out border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90`}
              onClick={() => {
                setShowConnectModal(false);
                handleSignIn(wallet, walletModal);
              }}
            >
              {translator("Wallet", language)}
            </button>
          </div>
        </div>
      </AdaptiveModalContent>
    </AdaptiveModal>
  );
}
