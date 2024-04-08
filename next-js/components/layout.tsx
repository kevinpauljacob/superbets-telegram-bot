import React, { ReactNode, useState } from "react";
import { Header } from "./Header";
import InfoBar from "./Infobar";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import SubHeader from "./SubHeader";
import GameHeader from "./GameHeader";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileSidebar(!mobileSidebar);
  };

  return (
    <>
      <InfoBar />
      <Header sidebar={mobileSidebar} toggleSidebar={toggleMobileSidebar} />
      <section className="flex">
        <Sidebar />
        <section className="w-full relative overflow-hidden">
          {mobileSidebar && <MobileSidebar />}
          <section>
            <SubHeader />
            <div className="w-full hidden md:flex">
              <GameHeader />
            </div>
            <main>
              <section className="flex flex-1">{children}</section>
            </main>
          </section>
        </section>
      </section>
    </>
  );
}