import { Inter } from "next/font/google";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useGlobalContext } from "@/components/GlobalContext";
import { successCustom, errorCustom } from "@/components/toasts/ToastGroup";
import { useSession } from "next-auth/react";
import StoreBanner from "@/components/Banner";
import FomoPlay from "@/components/FomoPlay";
import FOMOHead from "@/components/HeadElement";
import Bets from "@/components/games/Bets";
import { handleSignIn } from "@/components/ConnectWallet";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const { status } = useSession();
  const router = useRouter();
  const { referralCode } = router.query;

  const { setLanguage, setShowConnectModal } = useGlobalContext();
  useEffect(() => {
    //@ts-ignore
    setLanguage(localStorage.getItem("language") ?? "en");
  }, []);

  /* useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]); 
 */

  useEffect(() => {
    if (referralCode && wallet.connected === false) {
      setShowConnectModal(true)
    }
  }, [referralCode, wallet.connected]);

  useEffect(() => {
    const applyReferralCode = async () => {
      try {
        const response = await fetch(`/api/referral/apply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet: wallet.publicKey,
            referralCode: referralCode,
          }),
        });

        const { success, message } = await response.json();

        if (success) {
          successCustom(message);
        } else {
          errorCustom(message);
        }
      } catch (error: any) {
        throw new Error(error.message);
      }
    };

    if (
      wallet &&
      wallet.connected &&
      status === "authenticated" &&
      referralCode !== undefined &&
      referralCode !== null &&
      referralCode !== ""
    )
      applyReferralCode();
  }, [status, referralCode]);

  return (
    <>
      <FOMOHead title={"Home | FOMO.wtf - 0% House Edge, Pure Wins"} />
      <div className="flex flex-col lg:flex-row text-white w-full overflow-hidden relative overflow-x-hidden px-4 xl:px-6">
        <div className="flex flex-1 flex-col md:px-[2.5%]">
          <div className="">
            <StoreBanner />
          </div>
          <div className="mb-7">
            <FomoPlay />
          </div>
          {/* <div className="mb-7">
            <FomoExit />
          </div> */}
          <div className="mb-5">
            <Bets refresh={true} />
          </div>
        </div>
      </div>
    </>
  );
}
