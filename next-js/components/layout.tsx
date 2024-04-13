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
import MobileNavbar from "./MobileNavbar";

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
      <section className="relative flex flex-1 max-h-[calc(100vh-6.25rem)]">
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <section className="w-full relative overflow-hidden">
          <MobileSidebar mobileSidebar={sidebar} />
          <section className="w-full h-full">
            <SubHeader />
            <div className="w-full hidden md:flex">
              <GameHeader />
            </div>
            <main className="w-full h-full max-h-[calc(100vh-20rem)] md:max-h-[calc(100vh-11rem)]">
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
    </>
  );
}
