import "@/styles/globals.css";
import Layout from "@/components/layout";
import type { AppProps } from "next/app";
import toast, { useToasterStore } from "react-hot-toast";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { GlobalProvider } from "@/components/GlobalContext";
import "@solana/wallet-adapter-react-ui/styles.css";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import LiveStats from "@/components/games/LiveStats";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const Toaster = dynamic(() => import("../components/toasts/RenderToasts"), {
  ssr: false,
});

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const endpoint = process.env.NEXT_PUBLIC_RPC!;
  const router = useRouter();

  const { toasts } = useToasterStore();

  const TOAST_LIMIT = 3;

  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  const content = <Component {...pageProps} />;

  const wrappedContent =
    router.pathname === "/api-doc" ? (
      content
    ) : (
      <div
        id="main-parent"
        className={`w-[100dvw] h-[100dvh] flex flex-1 flex-col bg-[#0F0F0F] overflow-hidden nobar unselectable`}
      >
        <LiveStats />
        <Layout>{content}</Layout>
      </div>
    );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SessionProvider session={pageProps.session} refetchInterval={0}>
        <GlobalProvider>{wrappedContent}</GlobalProvider>
        <Toaster />
      </SessionProvider>
    </ConnectionProvider>
  );
}
