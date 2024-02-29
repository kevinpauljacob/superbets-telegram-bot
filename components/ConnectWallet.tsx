import { useWallet } from "@solana/wallet-adapter-react";
import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import { SigninMessage } from "./../utils/signinMessage";
import bs58 from "bs58";
import { useEffect } from "react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { obfuscatePubKey, translator } from "@/context/transactions";
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

      const csrf = await getCsrfToken();
      if (!wallet.publicKey || !csrf || !wallet.signMessage) return;

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: wallet.publicKey?.toBase58(),
        statement: `Sign message to authenticate with FOMOBET : `,
        nonce: csrf,
      });

      const data = new TextEncoder().encode(message.prepare());
      const signature = await wallet.signMessage(data);
      const serializedSignature = bs58.encode(signature);

      signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature: serializedSignature,
      });
    } catch (error) {
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
