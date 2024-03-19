import React from "react";
import Balance from "../../components/games/Balance";
import Head from "next/head";

function page() {
  return (
    <>
      <Head>
        <title>Wallet</title>
      </Head>
      <Balance />
    </>
  );
}

export default page;
