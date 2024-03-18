import Image from "next/image";
import BannerLeft from "/public/assets/storeBannerLeft.svg";
import BannerRight from "/public/assets/storeBannerRight.svg";

export default function StoreBanner() {
  return (
    <div className="flex w-full">
      <Image
        className="w-full"
        src={BannerLeft}
        width="100"
        height="100"
        alt="Store Banner"
      />
      <Image
        className="w-max h-[87%]"
        src={BannerRight}
        width="100"
        height="100"
        alt="Store Banner"
      />
    </div>
  );
}

{
  /* <div className="absolute top-0 left-0 z-10 px-16 py-8 w-[50%]">
        <div className="rounded-full bg-[#9945FF] w-min px-10 py-1.5">
          Store
        </div>
        <h2 className="text-5xl md:text-3xl sm:text-xl my-4">
          A Store to <span className="text-[#9945FF]">FOMO</span> About
        </h2>
        <p className="text-xl md:text-lg text-gray-400">
          Sake your FOMO tokens to receive multipliers for your points which
          gets you amazing rewards from our store
        </p>
      </div> */
}
