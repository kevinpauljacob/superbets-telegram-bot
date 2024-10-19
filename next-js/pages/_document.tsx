import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";
import { Telegram } from "@twa-dev/types";
declare global {
  interface Window {
    Telegram: Telegram;
  }
}
export default function Document() {
  return (
    <Html lang="en">
      <link rel="shortcut icon" href="/assets/logowhite.svg" />
      <Head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
