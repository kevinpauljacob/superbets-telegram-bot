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

export const handleSignIn = async (
  wallet: WalletContextState,
  walletModal: WalletModalContextState,
) => {
  try {
    if (!wallet.connected) {
      walletModal.setVisible(true);
    }
    console.log("going sign in");
    if (!wallet.publicKey || !wallet.signTransaction) return;

    let nonce = await getCsrfToken();

    // Create tx
    const tx = buildAuthTx(nonce!);
    tx.feePayer = wallet.publicKey; // not sure if needed but set this properly
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; // same as line above

    // Encode and send tx to signer, decode and sign
    let signedTx = await wallet.signTransaction(tx);
    console.log("calling sign in");
    // Encode, send back, decode and verify signedTx signature
    await signIn("credentials", {
      redirect: false,
      nonce,
      txn: signedTx.serialize().toString("base64"),
    });
  } catch (error) {
    wallet.disconnect();
    console.log(error);
  }
};

export const handleGoogle = async () => {
  signIn("google", { redirect: false });
  return;
};

export default function ConnectWallet() {
  const { data: session, status } = useSession();

  const wallet = useWallet();
  const walletModal = useWalletModal();

  const { language, setLanguage, setShowConnectModal } = useGlobalContext();

  useEffect(() => {
    if (wallet.connected && status == "unauthenticated") {
      handleSignIn(wallet, walletModal);
    }
  }, [wallet.connected]);

  useEffect(() => {
    console.log(status);
    if (status === "unauthenticated") wallet.disconnect();
  }, [status]);

  return (
    <>
      {(!session || !wallet.publicKey) && (
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

      {session?.user && wallet.publicKey && (
        <>
          <button
            className="w-full sm:w-fit flex text-white bg-[#192634] hover:bg-[#121D28] transition-all font-medium rounded-md text-sm px-5 py-2.5"
            onClick={async (e) => {
              try {
                e.preventDefault();
                await wallet.disconnect();
                await signOut();
              } catch (e) {
                console.log(e);
              }
            }}
          >
            {wallet.publicKey
              ? obfuscatePubKey(wallet.publicKey.toBase58())
              : translator("Signing Out ...", language)}
          </button>
        </>
      )}
    </>
  );
}
