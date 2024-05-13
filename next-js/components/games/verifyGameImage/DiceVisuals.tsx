import React from 'react';
import Image from "next/image";

interface DiceVisualsProps {
  wonFace: number;
}

const DiceVisuals: React.FC<DiceVisualsProps> = ({ wonFace }) => {
  return (
    <div className="flex justify-around md:gap-2">
      {Array.from({ length: 6 }, (_, i) => i + 1).map(face => (
        <div key={face} className="flex flex-col items-center">
          {wonFace === face && (
            <Image src="/assets/pointer-green.png" alt="pointer green" width={13} height={13} className="absolute -top-[20px]" />
          )}
          <Image src={`/assets/diceFace${face}.png`} width={50} height={50} alt={`Dice face ${face}`} className={`inline-block mt-6 ${wonFace === face ? "selected-face" : ""}`} />
        </div>
      ))}
    </div>
  );
};

export default DiceVisuals;
