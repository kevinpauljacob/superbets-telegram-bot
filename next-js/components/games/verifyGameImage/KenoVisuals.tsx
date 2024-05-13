import React from 'react';

interface KenoVisualsProps {
  numbers: number[];
}

const KenoVisuals: React.FC<KenoVisualsProps> = ({ numbers }) => {
  return (
    <div className="grid grid-cols-8 gap-2 text-white text-xl font-chakra w-full">
      {Array.from({ length: 40 }, (_, index) => index + 1).map((number) => (
        <div key={number} className={`flex items-center justify-center cursor-pointer ${numbers.includes(number) ? "bg-black border-2 border-fomo-green" : "bg-[#202329]"} rounded-md text-center transition-all duration-300 ease-in-out w-[45px] h-[45px]`}>
          {numbers.includes(number) ? (
            <div className="flex justify-center items-center bg-[#FFD100] text-black rounded-full w-[32px] h-[32px]">
              {number}
            </div>
          ) : (
            <div>{number}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KenoVisuals;
