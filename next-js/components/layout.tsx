import React, { ReactNode, useEffect, useState } from "react";
import { Header } from "./Header";
import InfoBar from "./Infobar";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import SubHeader from "./SubHeader";
import GameHeader from "./GameHeader";
import { useGlobalContext } from "./GlobalContext";
import BalanceModal from "./games/BalanceModal";
import { useSession } from "next-auth/react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session, status } = useSession();

  const [sidebar, setSidebar] = useState(true);
  const {
    coinData,
    showWalletModal,
    setShowWalletModal,
    walletBalance,
    getBalance,
    getWalletBalance,
  } = useGlobalContext();

  const toggleSidebar = () => {
    setSidebar(!sidebar);
  };

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
      <section className="relative flex flex-1">
        <Sidebar sidebar={sidebar} />
        <section className="w-full relative overflow-hidden">
          <MobileSidebar mobileSidebar={sidebar} />
          <section className="w-full h-full">
            <SubHeader />
            <div className="w-full hidden md:flex">
              <GameHeader />
            </div>
            <main className="w-full h-full">
              <section className="w-full h-full">{children}</section>
              {coinData && showWalletModal && <BalanceModal />}
            </main>
          </section>
        </section>
      </section>
    </>
  );
}
