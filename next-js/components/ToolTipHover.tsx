import React from 'react';

interface TooltipProps {
  direction?: 'top' | 'bottom' | 'left' | 'right';
  text: string;
  children: React.ReactNode;
}

const HoverToolTip: React.FC<TooltipProps> = ({ direction = 'bottom', text, children }) => {
  return (
    <div className={`relative group ${direction === 'left' || direction === 'right' ? 'flex items-center' : ''}`}>
      <div className="cursor-pointer z-10 relative">
        {children}
      </div>
      <div
        className={`absolute w-fit px-2 py-1 bg-[#121418] text-sm text-[#F0F0F080] border border-white border-opacity-20 rounded shadow transition-all duration-250 opacity-0 z-10 invisible transform-gpu group-hover:opacity-100 group-hover:visible ${
          direction === 'bottom' ? 'top-10 mt-2 left-1/2 transform -translate-x-1/2' :
          direction === 'top' ? 'bottom-10 mb-2 left-1/2 transform -translate-x-1/2' :
          direction === 'left' ? 'right-10 mr-2 top-1/2 transform -translate-y-1/2' :
          'left-8 ml-2 top-1/2 transform -translate-y-1/2'
        }`}
      >
        {text}
        {/* <div className={`absolute w-0 h-0 border-[8px] border-transparent drop-shadow-[1px_2px_1px_rgba(0,0,0,0.1)] ${
          direction === 'bottom' ? '-top-4 left-1/2 transform -translate-x-1/2 border-b-[#F0F0F0]' :
          direction === 'top' ? '-bottom-4 left-1/2 transform -translate-x-1/2 border-t-[#F0F0F0]' :
          direction === 'left' ? '-right-4 top-1/2 transform -translate-y-1/2 border-l-[#F0F0F0]' :
          '-left-4 top-1/2 transform -translate-y-1/2 border-r-[#F0F0F0]'
        }`}>
        </div> */}
      </div>
    </div>
  );
};

export default HoverToolTip;
