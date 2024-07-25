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
import { Google, Wallet } from "iconsax-react";
import { signOut } from "next-auth/react";

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
    session,
    status,
  } = useGlobalContext();

  const [loading, setLoading] = useState<boolean>(false);

  return (
    <AdaptiveModal
      open={showConnectModal}
      onOpenChange={() => setShowConnectModal(false)}
    >
      <AdaptiveModalContent className="bg-[#121418] sm:overflow-y-auto min-h-[0dvh] max-h-[80dvh] w-full pb-6">
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
              onClick={async (e) => {
                try {
                  if (session?.user?.email) {
                    e.preventDefault();
                    await wallet.disconnect();
                    await signOut();
                  } else handleGoogle();
                } catch (e) {
                  console.log(e);
                }
              }}
              className={`hidden xl:flex items-center justify-center text-white text-opacity-50 hover:text-opacity-90 focus:text-opacity-90 bg-white/5 hover:bg-[#555555] focus:bg-[#5F4DFF] transition-all font-medium text-sm p-3 rounded-[0.625rem] gap-1`}
            >
              {session?.user?.email ? (
                `Connected as ${session?.user?.name}`
              ) : (
                <>
                  <Google />
                  <span className="text-sm font-medium tracking-wider font-sans">
                    {translator("Connect with Google", language)}
                  </span>
                </>
              )}
            </button>

            {!session?.user && (
              <span className="w-full mt-4 text-center text-lg font-semibold text-staking-secondary">
                OR
              </span>
            )}

            <button
              onClick={async (e) => {
                try {
                  if (session?.user?.wallet) {
                    e.preventDefault();
                    await wallet.disconnect();
                    await signOut();
                  } else {
                    setShowConnectModal(false);
                    handleSignIn(wallet, walletModal);
                  }
                } catch (e) {
                  console.log(e);
                }
              }}
              className={`mt-4 hidden xl:flex items-center justify-center text-white text-opacity-50 hover:text-opacity-90 focus:text-opacity-90 bg-white/5 hover:bg-[#555555] focus:bg-[#5F4DFF] transition-all font-medium text-sm p-3 rounded-[0.625rem] gap-1`}
            >
              {session?.user?.wallet ? (
                `Connected with ${obfuscatePubKey(session?.user?.wallet)}`
              ) : (
                <>
                  <Wallet />
                  <span className="text-sm font-medium tracking-wider font-sans">
                    {translator("Connect Wallet", language)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </AdaptiveModalContent>
    </AdaptiveModal>
  );
}
