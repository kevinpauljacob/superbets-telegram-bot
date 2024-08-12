import { WalletContextState, useWallet } from "@solana/wallet-adapter-react";
import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import { buildAuthTx } from "./../utils/signinMessage";
import { useEffect } from "react";
import {
  WalletModalContextState,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import {
  connection,
  obfuscatePubKey,
  translator,
} from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import Loader from "./games/Loader";

export interface SessionUser {
  user: {
    name: string;
    email: string;
    image: string;
    isWeb2User: boolean;
    wallet: string;
    reached500: boolean;
  };
}

export const handleSignIn = async (
  wallet: WalletContextState,
  walletModal: WalletModalContextState,
) => {
  try {
    if (!wallet.connected) {
      walletModal.setVisible(true);
    }
    if (!wallet.publicKey || !wallet.signTransaction) return;

    let nonce = await getCsrfToken();

    // Create tx
    const tx = buildAuthTx(nonce!);
    tx.feePayer = wallet.publicKey; // not sure if needed but set this properly
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; // same as line above

    // Encode and send tx to signer, decode and sign
    let signedTx = await wallet.signTransaction(tx);
    // Encode, send back, decode and verify signedTx signature
    await signIn("credentials", {
      redirect: false,
      nonce,
      txn: signedTx.serialize().toString("base64"),
    });
  } catch (error) {
    wallet.disconnect();
    throw new Error(error as string);
  }
};

export const handleGoogle = async () => {
  await signIn("google", { redirect: false });
  return;
};

export default function ConnectWallet() {
  const wallet = useWallet();
  const walletModal = useWalletModal();

  const { language, setShowConnectModal, session, status } = useGlobalContext();

  useEffect(() => {
    if (wallet.connected && status == "unauthenticated") {
      handleSignIn(wallet, walletModal);
    }
  }, [wallet.connected]);

  useEffect(() => {
    if (status === "unauthenticated") wallet.disconnect();
  }, [status]);

  return (
    <>
      {(!session || (!session?.user?.email && !wallet.publicKey)) && (
        <button
          onClick={() => {
            setShowConnectModal(true);
            // handleSignIn(wallet, walletModal);
          }}
          className="bg-[#192634] hover:bg-[#121D28] transition-all w-full sm:w-fit flex items-center rounded-md h-10 px-5"
        >
          {wallet.connected && status === "unauthenticated" ? (
            <Loader className="scale-75" />
          ) : (
            <span className="connect-wallet text-white font-semibold rounded-md text-sm">
              {translator("Connect", language)}
            </span>
          )}
        </button>
      )}

      {session?.user && (wallet.publicKey || session?.user?.email) && (
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
