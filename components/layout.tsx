import React, { ReactNode, useState } from "react";
import { Header } from "./Header";
import InfoBar from "./Infobar";
import Sidebar from "./Sidebar";
import SubHeader from "./SubHeader";

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
        <section className="w-full">
          <SubHeader />
          <main>
            {mobileSidebar ? <Sidebar /> : <section>{children}</section>}
          </main>
        </section>
      </section>
    </>
  );
}
