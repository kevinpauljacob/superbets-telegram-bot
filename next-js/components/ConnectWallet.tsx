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
          className="bg-[#192634] hover:bg-[#121D28] transition-all w-full sm:w-fit flex rounded-md px-5 py-2"
        >
          <span className="connect-wallet text-white font-semibold rounded-md text-sm">
            {translator("Connect Wallet", language)}
          </span>
        </button>
      )}

      {session?.user && (
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
