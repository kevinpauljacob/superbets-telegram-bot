import { Inter } from "next/font/google";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useGlobalContext } from "@/components/GlobalContext";
import { successCustom, errorCustom } from "@/components/toasts/ToastGroup";
import { useSession } from "next-auth/react";
import StoreBanner from "@/components/Banner";
import FomoPlay from "@/components/FomoPlay";
import FOMOHead from "@/components/HeadElement";
import Bets from "@/components/games/Bets";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const { referralCode } = router.query;

  const {
    session,
    myData,
    getCurrentUserData,
    setLanguage,
    setShowConnectModal,
    coinData,
  } = useGlobalContext();

  useEffect(() => {
    //@ts-ignore
    setLanguage(localStorage.getItem("language") ?? "en");
  }, []);

  /* useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]); 
 */

  useEffect(() => {
    if (referralCode && !session?.user) {
      status !== "authenticated" && setShowConnectModal(true);
    }
    getCurrentUserData();
  }, [referralCode, session?.user]);

  useEffect(() => {
    const applyReferralCode = async () => {
      try {
        const response = await fetch(`/api/referral/apply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account: myData?._id,
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
      myData !== null &&
      status === "authenticated" &&
      referralCode !== undefined &&
      referralCode !== null &&
      referralCode !== ""
    )
      applyReferralCode();
  }, [status, referralCode, myData]);

  return (
    <>
      <FOMOHead title={"Home | SUPERBETS.GAMES - 0% House Edge, Pure Wins"} />
      <div className="flex flex-col lg:flex-row text-white w-full overflow-hidden relative overflow-x-hidden px-4 xl:px-6">
        <div className="flex flex-1 flex-col pt-0 md:pt-0 md:px-[2.5%]">
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
