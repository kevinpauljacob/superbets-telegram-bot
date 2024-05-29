import Image from "next/image";
import Card from "/public/assets/storeMystery.svg";

interface StoreCardProps {
  src: string;
  name: string;
  points: string;
}

export default function StoreCard({ src, name, points }: StoreCardProps) {
  return (
    <div className="bg-[#171717] rounded-md w-full mb-[1.4rem]">
      <div>
        <Image
          className="rounded-md w-full"
          src={Card}
          alt={name}
          width={100}
          height={100}
        />
      </div>
      <div className="px-3">
        <div className="text-center font-bold mt-2 mb-4">
          <p className="text-xs font-medium text-[#94A3B8] font-changa">Mystery Box</p>
          <p className="text-lg sm:text-xl text-white font-semibold font-chakra mt-1">{points} points</p>
        </div>
        <button type="button" disabled className="text-xs font-bold font-chakra disabled:opacity-50 tracking-wider bg-[#202329] rounded-[5px] w-full h-[3.1rem] mb-4">
          REDEEM
        </button>
      </div>
    </div>
  );
}
