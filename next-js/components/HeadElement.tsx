import Head from "next/head";

const FOMOHead = ({ title }: { title: string }) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="title" content={"SUPERBETS.GAMES - 0% House Edge, Pure Wins"} />
      <meta
        name="description"
        content={
          "SUPERBETS games are currently in beta and will be undergoing audit shortly."
        }
      />
      <meta key="og:type" property="og:type" content={"website"} />
      <meta
        key="og:title"
        property="og:title"
        content={"SUPERBETS.GAMES - 0% House Edge, Pure Wins"}
      />
      <meta
        key="og:description"
        property="og:description"
        content={
          "SUPERBETS games are currently in beta and will be undergoing audit shortly."
        }
      />
      <meta key="og:url" property="og:url" content={"https://superbets.games/"} />
      <meta
        key="og:image"
        property="og:image"
        content={"/logo/superbets.png"}
      />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:site" content={"@superbetgames"} />
      <meta
        property="twitter:title"
        content={"SUPERBETS.GAMES - 0% House Edge, Pure Wins"}
      />
      <meta
        property="twitter:description"
        content={
          "SUPERBETS casino games are currently in beta and will be undergoing audit shortly."
        }
      />
      <meta property="twitter:image" content={"/logo/superbets.png"} />
    </Head>
  );
};

export default FOMOHead;
