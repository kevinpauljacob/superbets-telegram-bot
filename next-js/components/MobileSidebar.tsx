import { useState } from "react";
import { OpenSidebar } from "./Sidebar";
import { useGlobalContext } from "./GlobalContext";
import { useRouter } from "next/router";

export default function Sidebar() {
  const { mobileSidebar, setMobileSidebar } = useGlobalContext();
  const [showPlayTokens, setShowPlayTokens] = useState(false);

  return (
    <div
      className={`${
        mobileSidebar ? "top-[6.3rem]" : "fadeOutDown top-[100dvh]"
      } fixed transition-all duration-500 ease-in-out z-[1000] md:hidden bg-[#121418] no-scrollbar overflow-y-auto text-white flex flex-col justify-between w-full h-[calc(100dvh-10rem)]`}
    >
      {mobileSidebar && (
        <OpenSidebar
          sidebar={mobileSidebar}
          showPlayTokens={showPlayTokens}
          setShowPlayTokens={setShowPlayTokens}
        />
      )}
    </div>
  );
}
