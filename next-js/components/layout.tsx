import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Header } from "./Header";
import InfoBar from "./Infobar";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import SubHeader from "./SubHeader";
import GameHeader from "./GameHeader";
import { useGlobalContext } from "./GlobalContext";
import BalanceModal from "./games/BalanceModal";
import { useSession } from "next-auth/react";
import MobileNavbar from "./MobileNavbar";
import VerifyFlipModal from "./games/CoinFlip/VerifyFlipModal";
import VerifyDiceModal from "./games/Dice/VerifyDiceModal";
import VerifyDice2Modal from "./games/Dice2/VerifyDice2Modal";
import VerifyLimboModal from "./games/Limbo/VerifyLimboModal";
import VerifyWheelModal from "./games/Wheel/VerifyWheelModal";
import VerifyKenoModal from "./games/Keno/VerifyKenoModal";
import { Flip } from "./games/CoinFlip/HistoryTable";
import { Dice2 } from "./games/Dice2/HistoryTable";
import { Dice } from "./games/Dice/HistoryTable";
import { Limbo } from "./games/Limbo/HistoryTable";
import { Wheel } from "./games/Wheel/HistoryTable";
import { Keno } from "./games/Keno/HistoryTable";
import { GameType } from "@/utils/provably-fair";
import ConfigureAutoModal from "./games/ConfigureAutoModal";
import RollDiceProvablyFairModal from "./games/Dice/DiceProvablyFairModal";
import Dice2ProvablyFairModal from "./games/Dice2/Dice2ProvablyFairModal";
import CoinFlipProvablyFairModal from "./games/CoinFlip/CoinFlipProvablyFairModal";
import LimboProvablyFairModal from "./games/Limbo/LimboProvablyFairModal";
import WheelProvablyFairModal from "./games/Wheel/WheelProvablyFairModal";
import KenoProvablyFairModal from "./games/Keno/KenoProvablyFairModal";
import { useWallet } from "@solana/wallet-adapter-react";
import { soundAlert } from "@/utils/soundUtils";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const wallet = useWallet();
  const game = router.pathname.split("/")[1];
  const { data: session, status } = useSession();

  const {
    coinData,
    showWalletModal,
    setShowWalletModal,
    walletBalance,
    getBalance,
    getWalletBalance,
    isVerifyModalOpen,
    setIsVerifyModalOpen,
    openVerifyModal,
    closeVerifyModal,
    verifyModalData,
    sidebar,
    setSidebar,
    setStartAuto,
    openPFModal,
    setOpenPFModal,
    getProvablyFairData,
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

  // function resetHeight() {
  //   if (typeof window !== "undefined") {
  //     console.log("resetting height");
  //     const container = document.getElementById("main-parent");
  //     if (container) container.style.height = window.innerHeight + "px";
  //   }
  // }

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     window.addEventListener("resize", () => {
  //       console.log("resizing", window.innerHeight);
  //       resetHeight();
  //     });
  //   }

  //   return () => {
  //     if (typeof window !== "undefined") {
  //       window.removeEventListener("resize", () => {});
  //     }
  //   };
  // }, []);

  // resetHeight();

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
  }, [wallet.publicKey, session?.user]);

  const toggleSidebar = () => {
    setSidebar(!sidebar);
  };

  const openPfModal = () => {
    setOpenPFModal(true);
  };

  const closePfModal = () => {
    setOpenPFModal(false);
  };

  useEffect(() => {
    setStartAuto(false);
  }, [router.pathname]);

  useEffect(() => {
    if (session?.user && !showWalletModal) {
      getBalance();
      getWalletBalance();
    }
  }, [session?.user, showWalletModal]);

  return (
    <>
      <InfoBar />
      <Header sidebar={sidebar} toggleSidebar={toggleSidebar} />
      <section className="relative flex flex-1 max-h-[calc(100%-6.25rem)]">
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <section className="w-full relative overflow-hidden">
          <MobileSidebar mobileSidebar={sidebar} setSidebar={setSidebar} />
          <section className="w-full h-full">
            <SubHeader />
            <main className="marker:w-full h-full md:pt-[4.5%] lg:pt-0 max-h-[calc(100%-1rem)] lg:max-h-[calc(100%-5.5rem)]">
              <section className="w-full h-full overflow-y-auto no-scrollbar">
                {children}
              </section>
            </main>
          </section>
        </section>
      </section>
      <div className="w-full fixed bottom-0 flex md:hidden z-[1000]">
        <MobileNavbar sidebar={sidebar} toggleSidebar={toggleSidebar} />
      </div>
      {showWalletModal && <BalanceModal />}

      {/* verify modals  */}
      {game === GameType.coin ? (
        <VerifyFlipModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ flip: (verifyModalData as Flip)! }}
        />
      ) : game === GameType.dice ? (
        <VerifyDiceModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Dice)! }}
        />
      ) : game === GameType.dice2 ? (
        <VerifyDice2Modal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Dice2)! }}
        />
      ) : game === GameType.limbo ? (
        <VerifyLimboModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ flip: (verifyModalData as Limbo)! }}
        />
      ) : game === GameType.wheel ? (
        <VerifyWheelModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Wheel)! }}
        />
      ) : game === GameType.keno ? (
        <VerifyKenoModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Keno)! }}
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
