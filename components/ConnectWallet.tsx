import { useWallet } from "@solana/wallet-adapter-react";
import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import { buildAuthTx } from "./../utils/signinMessage";
import bs58 from "bs58";
import { useEffect } from "react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  connection,
  obfuscatePubKey,
  translator,
} from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";

export default function ConnectWallet() {
  const { data: session, status } = useSession();

  let wallet = useWallet();
  const walletModal = useWalletModal();

  const { language, setLanguage } = useGlobalContext();

  const handleSignIn = async () => {
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
      console.log(error);
    }
  };

  useEffect(() => {
    if (wallet.connected && status == "unauthenticated") {
      handleSignIn();
    }
  }, [wallet.connected]);

  return (
    <>
      {!session && (
        <button
          onClick={handleSignIn}
          className="w-full sm:w-fit flex text-white bg-[#121D28] font-medium rounded-md text-sm px-5 py-3"
        >
          {translator("Connect Wallet", language)}
        </button>
      )}

      {session?.user && (
        <>
          <button
            className="w-full sm:w-fit flex text-white bg-[#121D28] font-medium rounded-md text-sm px-5 py-3"
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
              : "signing out .."}
          </button>
        </>
      )}
    </>
  );
}
