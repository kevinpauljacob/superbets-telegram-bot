import Image from "next/image";
import info from "/public/assets/info.png";
import fire from "/public/assets/fire.svg";
import doubleArrow from "/public/assets/doubleArrow.png";

export default function FomoSupply() {
  const FomoSupply = [
    {
      burnt: "40.01",
      circulating: "59.99",
    },
  ];

  const { burnt, circulating } = FomoSupply[0];

  return (
    <div className="w-[330px]">
      <div className="bg-[#1E2220] rounded-lg p-4 ">
        <div className="flex justify-between items-center w-full">
          <span className="font-semibold text-gray-400">$FOMO SUPPLY</span>
          <Image src={info} alt="" width={13} height={13} />
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-purple-700 rounded-xl px-2.5 py-4 my-2.5">
          <div className="flex justify-between items-center rounded-full bg-[#2E2C2F]/20 p-4">
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
          <div className="rounded-xl bg-[#2E2C2F]/20 p-4 my-3">
            <div className="flex items-center w-full">
              <span className="bg-[#EA5252] rounded-full h-[4px] w-[40px]"></span>
              <span className="text-gray-300 text-sm font-semibold px-2">
                Burnt FOMO
              </span>
              <span className="text-[#EA5252] font-semibold">{burnt}%</span>
            </div>
            <div className="font-semibold">234,546,654</div>
          </div>
          <div className="rounded-xl bg-[#2E2C2F]/20 p-4 my-2.5">
            <div className="flex items-center w-full">
              <span className="bg-[#72F238] rounded-full h-[4px] w-[40px]"></span>
              <span className="text-gray-300 text-sm font-semibold px-2">
                Circulating FOMO
              </span>
              <span className="text-[#72F238] font-semibold">
                {circulating}%
              </span>
            </div>
            <div className="font-semibold">234,546,654</div>
          </div>
        </div>
        <div className="bg-[#121112]/50 rounded-xl p-5"></div>
      </div>
      <div className="bg-[#1E2220] rounded-lg p-4 mt-4">
        <div className="bg-gradient-to-r from-blue-[#D129FA] to-purple-[#1EE0AF]">
          <div></div>
          <div>Boost your tier by staking!</div>
        </div>
        <div className="bg-[#1F2221]/10 text-[#883CE3] font-semibold text-center rounded-xl p-4">
          Stake $FOMO
        </div>
      </div>
    </div>
  );
}
