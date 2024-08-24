import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

import {
  connection,
  obfuscatePubKey,
  translator,
} from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import Loader from "./games/Loader";

export interface SessionUser {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
    isWeb2User: boolean;
    wallet: string;
    reached500: boolean;
  };
}

export const handleGoogle = async () => {
  await signIn("google", { redirect: false });
  return;
};

export default function ConnectWallet() {
  const { language, setShowConnectModal, session, status } = useGlobalContext();

  return (
    <>
      {(!session || !session?.user?.email) && (
        <button
          onClick={() => {
            setShowConnectModal(true);
            // handleSignIn(wallet, walletModal);
          }}
          className="bg-[#192634] hover:bg-[#121D28] transition-all w-full sm:w-fit flex items-center rounded-md h-10 px-5"
        >
          {status === "unauthenticated" ? (
            <span className="connect-wallet text-white font-semibold rounded-md text-sm">
              {translator("Connect", language)}
            </span>
          ) : (
            <Loader className="scale-75" />
          )}
        </button>
      )}

      {session?.user && session?.user?.email && (
        <>
          <button
            className="w-full sm:w-fit flex text-white bg-[#192634] hover:bg-[#121D28] transition-all font-medium rounded-md text-sm px-5 py-2.5"
            onClick={() => {
              setShowConnectModal(true);
            }}
          >
            {session?.user?.email
              ? session?.user?.name
              : translator("Signing Out ...", language)}
          </button>
        </>
      )}
    </>
  );
}
