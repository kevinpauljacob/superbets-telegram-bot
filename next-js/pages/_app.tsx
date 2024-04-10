import "@/styles/globals.css";
import Layout from "@/components/layout";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  SolflareWalletAdapter,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { GlobalProvider } from "@/components/GlobalContext";
import "@solana/wallet-adapter-react-ui/styles.css";
import { SessionProvider } from "next-auth/react";
import InfoBar from "@/components/Infobar";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const endpoint = process.env.NEXT_PUBLIC_RPC!;

  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SessionProvider session={pageProps.session} refetchInterval={0}>
            <GlobalProvider>
              <div
                className={`w-[100vw] h-[100vh] flex flex-1 flex-col bg-black overflow-y-hidden nobar unselectable`}
              >
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </div>
            </GlobalProvider>

            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "#333",
                  color: "#fff",
                },
              }}
            />
          </SessionProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
