import React, { ReactNode, useState } from "react";
import { Header } from "./Header";
import InfoBar from "./Infobar";
import Navbar from "./Navbar";
import SubHeader from "./SubHeader";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <InfoBar />
      <Header />
      <section className="flex">
        <Navbar />
        <section className="w-full">
          <SubHeader />
          <main>{children}</main>
        </section>
      </section>
    </>
  );
}
