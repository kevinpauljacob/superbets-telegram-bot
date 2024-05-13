import React from 'react';
import DraggableBar from "@/components/games/Dice2/DraggableBar";

interface Dice2VisualsProps {
  value: number;
}

const Dice2Visuals: React.FC<Dice2VisualsProps> = ({ value }) => {
  return (
    <div className="px-8 pt-20 pb-8">
      <div className="w-full">
        <DraggableBar
          choice={value}
          setChoice={() => {}} // Add correct setter function if needed
          strikeNumber={value}
          result={false}
          rollType={"over"}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default Dice2Visuals;
