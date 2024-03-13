import Image from "next/image";
import Card from "/public/assets/Card.png";

interface StoreCardProps {
  src: string;
  name: string;
  points: string;
}

export default function StoreCard({ src, name, points }: StoreCardProps) {
  return (
    <div className="bg-[#171717] rounded-md min-w-[260px] mb-5">
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
          <p className="text-xs text-[#9945FF]">{name}</p>
          <p className="text-xl">{points} points</p>
        </div>
        <button className="text-xl font-bold bg-[#9945FF] rounded-md w-full py-2 mb-4">
          Redeem
        </button>
      </div>
    </div>
  );
}
