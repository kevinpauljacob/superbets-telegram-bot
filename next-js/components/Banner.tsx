import Image from "next/image";
import BannerLeft from "/public/assets/storeBannerLeft.svg";
import BannerRight from "/public/assets/storeBannerRight.svg";

export default function StoreBanner() {
  return (
    <div className="flex w-full rounded-[1rem] overflow-hidden bg-[#090A0C]">
      <Image
        className="w-[80%] sm:w-[50%]"
        src={BannerLeft}
        width="100"
        height="100"
        alt="Store Banner"
      />
      <div className="w-[20%] sm:w-[50%] h-auto relative rounded-[1rem] overflow-hidden bg-[#090A0C]">
        <Image
          className="w-auto h-full object-center sm:object-right object-cover sm:object-contain"
          src={BannerRight}
          layout="fill"
          // objectFit="cover"
          // objectPosition="center"
          alt="Store Banner"
        />
      </div>
    </div>
  );
}