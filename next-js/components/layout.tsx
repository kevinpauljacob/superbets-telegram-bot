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

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
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
  } = useGlobalContext();

  const toggleSidebar = () => {
    setSidebar(!sidebar);
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
      <section className="relative flex flex-1 max-h-[calc(100vh-6.25rem)]">
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <section className="w-full relative overflow-hidden">
          <MobileSidebar mobileSidebar={sidebar} />
          <section className="w-full h-full">
            <SubHeader />
            <div className="w-full hidden md:flex">
              <GameHeader />
            </div>
            <main className="w-full h-full md:px-[2.5%] md:pt-[4.5%] lg:pt-0 max-h-[calc(100vh-16.6rem)] lg:max-h-[calc(100vh-11rem)]">
              <section className="w-full h-full overflow-y-auto no-scrollbar">
                {children}
              </section>
            </main>
          </section>
        </section>
      </section>
      <div className="w-full fixed bottom-0 flex md:hidden">
        <MobileNavbar sidebar={sidebar} toggleSidebar={toggleSidebar} />
      </div>
      {showWalletModal && <BalanceModal />}

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
      <ConfigureAutoModal />
    </>
  );
}
