import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Header } from "./Header";
import InfoBar from "./Infobar";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import SubHeader from "./SubHeader";
import { useGlobalContext } from "./GlobalContext";
import BalanceModal from "./games/BalanceModal";
import { signOut, useSession } from "next-auth/react";
import MobileNavbar from "./MobileNavbar";
import VerifyFlipModal from "./games/CoinFlip/VerifyFlipModal";
import VerifyDiceModal from "./games/Dice/VerifyDiceModal";
import VerifyDice2Modal from "./games/Dice2/VerifyDice2Modal";
import VerifyLimboModal from "./games/Limbo/VerifyLimboModal";
import VerifyWheelModal from "./games/Wheel/VerifyWheelModal";
import VerifyKenoModal from "./games/Keno/VerifyKenoModal";
import { Flip } from "./games/CoinFlip/VerifyFlipModal";
import { Dice2 } from "./games/Dice2/VerifyDice2Modal";
import { Dice } from "./games/Dice/VerifyDiceModal";
import { Limbo } from "./games/Limbo/VerifyLimboModal";
import { Wheel } from "./games/Wheel/VerifyWheelModal";
import { Keno } from "./games/Keno/VerifyKenoModal";
import { GameType } from "@/utils/provably-fair";
import ConfigureAutoModal from "./games/ConfigureAutoModal";
import RollDiceProvablyFairModal from "./games/Dice/DiceProvablyFairModal";
import Dice2ProvablyFairModal from "./games/Dice2/Dice2ProvablyFairModal";
import CoinFlipProvablyFairModal from "./games/CoinFlip/CoinFlipProvablyFairModal";
import LimboProvablyFairModal from "./games/Limbo/LimboProvablyFairModal";
import WheelProvablyFairModal from "./games/Wheel/WheelProvablyFairModal";
import KenoProvablyFairModal from "./games/Keno/KenoProvablyFairModal";
import Footer from "./Footer";
import { useWallet } from "@solana/wallet-adapter-react";
import { soundAlert } from "@/utils/soundUtils";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const wallet = useWallet();
  const game = router.pathname.split("/")[1];
  const { data: session } = useSession();

  const {
    showWalletModal,
    getBalance,
    getWalletBalance,
    isVerifyModalOpen,
    closeVerifyModal,
    verifyModalData,
    sidebar,
    mobileSidebar,
    setSidebar,
    setMobileSidebar,
    setAutoBetCount,
    setStartAuto,
    openPFModal,
    setOpenPFModal,
    getProvablyFairData,
    setCurrentGame,
    setUseAutoConfig,
    autoConfigState,
    setAutoWinChange,
    setAutoLossChange,
    setAutoStopProfit,
    setAutoStopLoss,
    setAutoWinChangeReset,
    setAutoLossChangeReset,
  } = useGlobalContext();

  const [modalData, setModalData] = useState({
    activeGameSeed: {
      wallet: "",
      clientSeed: "",
      serverSeed: "",
      serverSeedHash: "",
      nonce: 0,
      status: "",
    },
    nextGameSeed: {
      wallet: "",
      clientSeed: "",
      serverSeed: "",
      serverSeedHash: "",
      nonce: 0,
      status: "",
    },
  });

  const resetScroll= () => {
    const scrollElement = document.querySelector("#top-scroll-element");
    if (scrollElement) {
      scrollElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToTop = () => {
    const scrollElement = document.querySelector("#scroll-element");
    if (scrollElement) {
      scrollElement.scrollIntoView({ behavior: "smooth", block: "start" });
      resetScroll();
    }
  };

  

  useEffect(() => {
    //sound pre-loader
    soundAlert("/sounds/betbutton.wav", true);
    soundAlert("/sounds/diceshake.wav", true);
    soundAlert("/sounds/slider.wav", true);
    soundAlert("/sounds/win.wav", true);
  }, []);

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey && session?.user) {
        const pfData = await getProvablyFairData();
        if (pfData) setModalData(pfData);
      }
    })();

    if (wallet?.publicKey && session?.user)
      localStorage.setItem("connectedAccountKey", wallet.publicKey.toBase58());
  }, [wallet.publicKey, session?.user]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const storedKey = localStorage.getItem("connectedAccountKey");

  //     if ("solana" in window) {
  //       const provider = window.solana;

  //       //@ts-ignore
  //       if (provider?.publicKey) {
  //         //@ts-ignore
  //         // console.log("checking", provider?.publicKey.toBase58());
  //         //@ts-ignore
  //         if (storedKey && storedKey !== provider.publicKey.toBase58()) {
  //           (async () => {
  //             // console.log("Account changed");
  //             localStorage.removeItem("connectedAccountKey");
  //             await wallet.disconnect();
  //             await signOut();
  //           })();
  //         }
  //       }
  //     }
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, []);

  const toggleSidebar = () => {
    setSidebar(!sidebar);
    setMobileSidebar(!sidebar);
  };

  const openPfModal = () => {
    setOpenPFModal(true);
  };

  const closePfModal = () => {
    setOpenPFModal(false);
  };

  useEffect(() => {
    scrollToTop();
    setAutoBetCount(1);
    setStartAuto(false);
    const configOptions = autoConfigState.get(game);
    // console.log("Auto options", configOptions);
    if (configOptions) {
      setAutoWinChange(configOptions.autoWinChange);
      setAutoLossChange(configOptions.autoLossChange);
      setAutoWinChangeReset(configOptions.autoWinChangeReset);
      setAutoLossChangeReset(configOptions.autoLossChangeReset);
      setAutoStopProfit(configOptions.autoStopProfit);
      setAutoStopLoss(configOptions.autoStopLoss);
      setUseAutoConfig(configOptions.useAutoConfig);
    } else {
      setAutoWinChange(null);
      setAutoLossChange(null);
      setAutoWinChangeReset(true);
      setAutoLossChangeReset(true);
      setAutoStopProfit(null);
      setAutoStopLoss(null);
      setUseAutoConfig(false);
    }
  }, [router.pathname]);

  useEffect(() => {
    if (session?.user && !showWalletModal) {
      getBalance();
      getWalletBalance();
    }
    setCurrentGame(game);
  }, [session?.user, showWalletModal, game]);

  return (
    <>
      <div id="top-scroll-element" className="w-full min-h-[1px] bg-transparent" />
      <InfoBar />
      <Header sidebar={sidebar} toggleSidebar={toggleSidebar} />
      <section className="relative flex flex-1 max-h-[calc(100%-6.25rem)]">
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <section className="w-full relative overflow-hidden">
          <MobileSidebar />
          <section className="relative w-full h-full pt-[4.4rem]">
            <SubHeader />
            <main
              className={`marker:w-full h-full max-h-[calc(100%-1rem)] pt-6`}
            >
              <section className="w-full h-full overflow-y-auto no-scrollbar">
                <div
                  id="scroll-element"
                  className="w-full min-h-[1px] bg-transparent"
                />
                {children}
                <div className="w-full">
                  <Footer />
                </div>
              </section>
            </main>
          </section>
        </section>
      </section>
      <div className="w-full fixed bottom-0 flex md:hidden z-[1000]">
        <MobileNavbar sidebar={mobileSidebar} toggleSidebar={toggleSidebar} />
      </div>
      {showWalletModal && <BalanceModal />}

      {/* verify modals  */}
      {verifyModalData.game === GameType.coin ? (
        <VerifyFlipModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ flip: (verifyModalData as Flip)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.dice ? (
        <VerifyDiceModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Dice)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.dice2 ? (
        <VerifyDice2Modal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Dice2)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.limbo ? (
        <VerifyLimboModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ flip: (verifyModalData as Limbo)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.wheel ? (
        <VerifyWheelModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Wheel)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.keno ? (
        <VerifyKenoModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Keno)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : null}

      {/* pf modals  */}
      {game === GameType.coin ? (
        <CoinFlipProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.dice ? (
        <RollDiceProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.dice2 ? (
        <Dice2ProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.limbo ? (
        <LimboProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.wheel ? (
        <WheelProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.keno ? (
        <KenoProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : null}

      <ConfigureAutoModal />
    </>
  );
}
