import Image from "next/image";
import info from "/public/assets/info.png";
import fire from "/public/assets/fire.svg";
import doubleArrow from "/public/assets/doubleArrow.png";
import { useRouter } from "next/router";

export default function FomoSupply() {
  const FomoSupply = [
    {
      burnt: "40.01",
      circulating: "59.99",
    },
  ];

  const router = useRouter();

  const { burnt, circulating } = FomoSupply[0];

  return (
    <div className="hidden md:block lg:w-[250px] xl:w-[280px] 2xl:w-[330px]">
      <div className="bg-[#1E2220] rounded-lg lg:p-3 xl:p-4 ">
        <div className="flex justify-between items-center w-full">
          <span className="font-semibold text-gray-400 text-sm xl:text-base">
            $FOMO SUPPLY
          </span>
          <Image src={info} alt="" width={13} height={13} />
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-purple-700 rounded-xl lg:px-2 xl:px-2.5 lg:py-2 xl:py-2.5 2xl:py-4 my-1.5 xl:my-2 2xl:my-2.5">
          <div className="flex justify-between items-center rounded-full bg-[#2E2C2F]/20 lg:p-3 xl:p-4">
            <Image src={fire} alt="" width={20} height={17} />
            <Image
              src={doubleArrow}
              alt=""
              width={20}
              height={15}
              className="mx-2"
            />
            <div className="flex w-full">
              <span
                className="bg-[#EA5252] rounded-full mr-1.5 h-[4px]"
                style={{ width: `${burnt}%` }}
              ></span>
              <span
                className="bg-[#72F238] rounded-full mr-1.5 h-[4px]"
                style={{ width: `${circulating}%` }}
              ></span>
            </div>
          </div>
          <div className="rounded-xl bg-[#2E2C2F]/20 p-4 my-2 2xl:my-3">
            <div className="flex items-center text-xs 2xl:text-sm w-full">
              <span className="bg-[#EA5252] rounded-full h-[4px] lg:w-[20px] xl:w-[30px] 2xl:w-[40px]"></span>
              <span className="text-gray-300 font-semibold px-2">
                Burnt FOMO
              </span>
              <span className="text-[#EA5252] font-semibold">{burnt}%</span>
            </div>
            <div className="font-semibold text-sm 2xl:text-base ">
              234,546,654
            </div>
          </div>
          <div className="rounded-xl bg-[#2E2C2F]/20 p-4 my-1.5 2xl:my-2">
            <div className="flex items-center text-xs 2xl:text-sm w-full">
              <span className="bg-[#72F238] rounded-full h-[4px] lg:w-[20px] xl:w-[30px] 2xl:w-[40px]"></span>
              <span className="text-gray-300 font-semibold px-2">
                Circulating FOMO
              </span>
              <span className="text-[#72F238] font-semibold">
                {circulating}%
              </span>
            </div>
            <div className="font-semibold text-sm 2xl:text-base ">
              234,546,654
            </div>
          </div>
        </div>
        <div className="text-xs 2xl:text-sm bg-[#121112]/50 rounded-[10px] px-2.5 2xl:px-5 py-2.5">
          <span className="font-changa font-medium text-white text-opacity-50 mr-1">
            FOMO Supply :
          </span>
          <span className="font-changa font-semibold text-white text-opacity-90">
            1,000,000,000
          </span>
        </div>
      </div>
      <div className="bg-[#1E2220]/75 rounded-lg lg:p-3 xl:p-4 mt-2 xl:mt-3 2xl:mt-4">
        <div className="bg-gradient-to-r from-[#D129FA] to-[#1EE0AF] rounded-lg py-2 xl:py-3 lg:px-2 xl:px-4 mb-2 2xl:mb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <p className="lg:text-xl xl:text-2xl 2xl:text-3xl font-bold font-changa">
                O
              </p>
              <p className="lg:text-md xl:text-lg 2xl:text-xl font-bold mr-1">
                x
              </p>
              <p className="lg:text-md xl:text-lg 2xl:text-xl font-semibold">
                multiplier
              </p>
            </div>
            <Image src={info} alt="" width={13} height={13} />
          </div>
          <div className="lg:text-xs xl:text-sm 2xl:text-base">
            Boost your tier by staking!
          </div>
        </div>
        <div
          onClick={() => {
            router.push("stake");
          }}
          className="bg-[#1E2220] hover:bg-[#262827] transition-all cursor-pointer text-[#883CE3] text-md 2xl:text-lg font-semibold text-center rounded-lg px-2.5 py-2 2xl:p-2.5"
        >
          Stake $FOMO
        </div>
      </div>
    </div>
  );
}
