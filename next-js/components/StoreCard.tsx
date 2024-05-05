import Image from "next/image";
import Card from "/public/assets/Card.png";

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
        <div className="text-center font-bold my-3">
          <p className="text-xs text-[#9945FF] font-changa">{name}</p>
          <p className="text-lg sm:text-xl font-changa">{points} points</p>
        </div>
        <button className="text-base sm:text-xl font-bold font-changa bg-[#9945FF] rounded-md w-full py-1 sm:py-2 mb-4">
          Redeem
        </button>
      </div>
    </div>
  );
}
