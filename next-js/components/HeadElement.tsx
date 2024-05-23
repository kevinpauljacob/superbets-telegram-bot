import Head from "next/head";

const FOMOHead = ({ title }: { title: string }) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="title" content={"FOMO.wtf - 0% House Edge, Pure Wins"} />
      <meta
        name="description"
        content={
          "FOMO casino games are currently in beta and will be undergoing audit shortly. FOMO wtf EXIT games has gone through audit performed by OtterSec in December 2023."
        }
      />
      <meta key="og:type" property="og:type" content={"website"} />
      <meta
        key="og:title"
        property="og:title"
        content={"FOMO.wtf - 0% House Edge, Pure Wins"}
      />
      <meta
        key="og:description"
        property="og:description"
        content={
          "FOMO casino games are currently in beta and will be undergoing audit shortly. FOMO wtf EXIT games has gone through audit performed by OtterSec in December 2023."
        }
      />
      <meta key="og:url" property="og:url" content={"https://fomowtf.com/"} />
      <meta
        key="og:image"
        property="og:image"
        content={"/assets/logowhite.svg"}
      />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:site" content={"@fomosolana"} />
      <meta
        property="twitter:title"
        content={"FOMO.wtf - 0% House Edge, Pure Wins"}
      />
      <meta
        property="twitter:description"
        content={
          "FOMO casino games are currently in beta and will be undergoing audit shortly. FOMO wtf EXIT games has gone through audit performed by OtterSec in December 2023."
        }
      />
      <meta property="twitter:image" content={"/assets/logowhite.svg"} />
    </Head>
  );
};

export default FOMOHead;
