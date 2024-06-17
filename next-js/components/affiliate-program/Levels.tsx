import { useState } from "react";
import { commissionLevels } from "@/context/config";
import { truncateNumber } from "@/context/transactions";
import User from "@/public/assets/User";
import Image from "next/image";
interface ReferralLevelData {
  signUps: number;
  totalEarnings: number;
}

export default function Levels({
  referralLevelData,
}: {
  referralLevelData: ReferralLevelData[];
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prevSlide) =>
      prevSlide === referralLevelData.length - 1 ? 0 : prevSlide + 1,
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) =>
      prevSlide === 0 ? referralLevelData.length - 1 : prevSlide - 1,
    );
  };

  return (
    <div className="relative flex gap-[14px] overflow-hidden w-full">
      {referralLevelData.map((data, index) => (
        <div
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
          key={index}
          className={`transition-transform duration-300 w-full`}
        >
          <LevelsCard level={index} data={data} />
        </div>
      ))}
      <button
        className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-[#1D1A21]/50 hover:bg-[#333037] focus:bg-[#333037] transition-all text-white font-bold py-3 px-3 rounded focus:outline-none focus:shadow-outline mr-3"
        onClick={prevSlide}
      >
        <Image
          src="/assets/downArrow.png"
          alt="Previous"
          width={10}
          height={10}
          className="rotate-90"
        />
      </button>
      <button
        className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-[#1D1A21]/50 hover:bg-[#333037] focus:bg-[#333037] transition-all text-white font-bold py-3 px-3 rounded focus:outline-none focus:shadow-outline"
        onClick={nextSlide}
      >
        <Image
          src="/assets/downArrow.png"
          alt="Next"
          width={10}
          height={10}
          className="-rotate-90"
        />
      </button>
    </div>
  );
}

function LevelsCard({
  level,
  data,
}: {
  level: number;
  data: ReferralLevelData;
}) {
  const colors = ["4594FF", "E17AFF", "00C278", "4594FF", "00C278"];
  const commission = commissionLevels[level] || 0;
  const commissionText = commission
    ? `${truncateNumber(commission * 100)}% Commission`
    : "<2% Commission";
  return (
    <div className="flex flex-col gap-[30px] bg-staking-bg rounded-[5px] p-4 w-full min-w-[330px]">
      <div className="w-full">
        <div className="flex gap-[6px]">
          <User fill={`#${colors[level]}`} />
          <p
            className="text-[13px] font-semibold rounded-[5px] px-1"
            style={{
              backgroundColor: `rgba(${parseInt(colors[level].slice(0, 2), 16)}, ${parseInt(colors[level].slice(2, 4), 16)}, ${parseInt(colors[level].slice(4, 6), 16)}, 0.1)`,
              color: `#${colors[level]}`,
            }}
          >
            Level {level}
          </p>
          <p className="text-[#94A3B8]/75 text-[13px] font-semibold bg-[#94A3B8]/5 rounded-[5px] px-1">
            {commissionText}
          </p>
        </div>
        <div className="flex items-center gap-[7px] font-chakra text-white/50 font-medium text-xs mt-2">
          <p>Signups</p>
          <svg
            width="4"
            height="4"
            viewBox="0 0 4 4"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity="0.5"
              d="M0.556524 2L1.9999 3.44338L3.44328 2L1.9999 0.556624L0.556524 2ZM2 1.75H1.99998V2.25H2V1.75ZM1.99993 1.75H1.9999V2.25H1.99993V1.75ZM0.556524 2L1.9999 3.44338L3.44328 2L1.9999 0.556624L0.556524 2ZM2 1.75H1.99998V2.25H2V1.75ZM1.99993 1.75H1.9999V2.25H1.99993V1.75Z"
              fill="#94A3B8"
            />
          </svg>
          <p>Earnings</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-[10px] font-chakra font-semibold text-[20px]">
        <p className="text-[#94A3B8]/90">{data.signUps}</p>
        <svg
          width="35"
          height="6"
          viewBox="0 0 35 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            opacity="0.5"
            d="M34.8868 3L32 0.113249L29.1132 3L32 5.88675L34.8868 3ZM0.113249 3L3 5.88675L5.88675 3L3 0.113249L0.113249 3ZM32 2.5H30.9643V3.5H32V2.5ZM28.8929 2.5H26.8214V3.5L28.8929 3.5V2.5ZM24.75 2.5L22.6786 2.5V3.5H24.75V2.5ZM20.6071 2.5L18.5357 2.5V3.5L20.6071 3.5V2.5ZM16.4643 2.5L14.3929 2.5V3.5L16.4643 3.5V2.5ZM12.3214 2.5L10.25 2.5V3.5H12.3214V2.5ZM8.17857 2.5H6.10715V3.5L8.17857 3.5V2.5ZM4.03572 2.5H3V3.5H4.03572V2.5ZM34.8868 3L32 0.113249L29.1132 3L32 5.88675L34.8868 3ZM0.113249 3L3 5.88675L5.88675 3L3 0.113249L0.113249 3ZM32 2.5H30.9643V3.5H32V2.5ZM28.8929 2.5H26.8214V3.5L28.8929 3.5V2.5ZM24.75 2.5L22.6786 2.5V3.5H24.75V2.5ZM20.6071 2.5L18.5357 2.5V3.5L20.6071 3.5V2.5ZM16.4643 2.5L14.3929 2.5V3.5L16.4643 3.5V2.5ZM12.3214 2.5L10.25 2.5V3.5H12.3214V2.5ZM8.17857 2.5H6.10715V3.5L8.17857 3.5V2.5ZM4.03572 2.5H3V3.5H4.03572V2.5Z"
            fill="#94A3B8"
          />
        </svg>
        <p className="text-[#00C278]">${truncateNumber(data.totalEarnings)}</p>
      </div>
    </div>
  );
}
