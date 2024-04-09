import GameHeader from "@/components/GameHeader";
import Head from "next/head";

export default function TestLayout() {
  return (
    <div className="flex flex-1 h-full w-full flex-col items-center justify-start px-6">
      <Head>
        <title>FOMO - Binary Options</title>
      </Head>
      <div className="mt-6 w-full h-[calc(100vh-235px)] items-stretch bg-[#121418] rounded-2xl flex flex-col-reverse md:flex-row">
        <div className="flex w-full md:w-[35%] flex-col items-center rounded-[1.15rem] px-3 py-5 md:p-7"></div>
        <div className="bg-white bg-opacity-10 w-[1px]" />
        <div className="flex flex-1 flex-col items-center justify-between gap-2 m-8 bg-[#0C0F16] rounded-lg p-4"></div>
      </div>
      <div className="w-full flex md:hidden mt-4 rounded-[5px] overflow-hidden">
        <GameHeader />
      </div>
    </div>
  );
}
