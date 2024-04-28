import { soundAlert } from "@/utils/soundUtils";
import React, { useState, useEffect, useRef, RefObject } from "react";

function debounce(func: any, timeout = 100) {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      //@ts-ignore
      func.apply(this, args);
    }, timeout);
  };
}

type ProgressBarProps = {
  choice: number;
  setChoice: (choice: number) => void;
  strikeNumber: number;
  result: boolean;
  rollType: string;
  draggable?: boolean;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  choice,
  setChoice,
  strikeNumber,
  result,
  rollType,
  draggable = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const progressBarRef: RefObject<HTMLDivElement> =
    useRef<HTMLDivElement>(null);
  const indicatorsRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const strikeNumberRef: RefObject<HTMLDivElement> =
    useRef<HTMLDivElement>(null);

  const sliderMove = debounce(() => soundAlert("/sounds/slider.wav"))

  useEffect(() => {
    sliderMove()
    if (progressBarRef.current && indicatorsRef.current) {
      indicatorsRef.current.style.width = `${progressBarRef.current.clientWidth}px`;
      alignIndicators(); // Call function to align indicators
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", () => {
        if (progressBarRef.current && indicatorsRef.current) {
          indicatorsRef.current.style.width = `${progressBarRef.current.clientWidth}px`;
          alignIndicators(); // Call function to align indicators
        }
      });
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", () => {});
      }
    };
  }, [choice]);

  const alignIndicators = () => {
    if (indicatorsRef.current) {
      const rangeRect = progressBarRef.current?.getBoundingClientRect();
      const indicatorsRect = indicatorsRef.current?.getBoundingClientRect();
      if (rangeRect && indicatorsRect) {
        // const diff = rangeRect.width / (indicators.length - 1);
        const offset = rangeRect.left - indicatorsRect.left;
        const adjustedOffset =
          offset + (rangeRect.width - indicatorsRect.width) / 2;
        indicatorsRef.current.style.transform = `translateX(${adjustedOffset}px)`;
      }
    }
  };

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   let newValue = parseFloat(e.target.value);
  //   newValue = Math.max(2, Math.min(newValue, 98));
  //   setChoice(newValue);
  // };

  // const handleDragStart = () => {
  //   setIsDragging(true);
  // };

  // const handleDragEnd = () => {
  //   setIsDragging(false);
  // };

  // const handleDrag = (e: any) => {
  //   if (isDragging) {
  //     const rect = e.target.getBoundingClientRect();
  //     const offsetX = e.clientX - rect.left;
  //     let newChoice = (offsetX / rect.width) * 100;

  //     if (newChoice < 2) {
  //       newChoice = 2;
  //     } else if (newChoice > 98) {
  //       newChoice = 98;
  //     }
  //     setChoice(newChoice);
  //   }
  // };

  const indicators = [0, 25, 50, 75, 100];

  return (
    <div>
      <div className="border-4 sm:border-[6px] border-[#282E3D] bg-[#282E3D] rounded-lg">
        <div className="bg-[#0C0F16] rounded-md p-4">
          <div
            className={`relative rounded-full h-1 sm:h-2 flex ${
              rollType === "over" ? "bg-fomo-green" : "bg-fomo-red"
            }`}
          >
            <input
              id="min-slider"
              type="range"
              onChange={(e) => {
                const value = parseInt(e.currentTarget.value);
                //@ts-ignore
                document.getElementById("min-slider")!.value =
                  value >= 2 ? (value <= 98 ? value : 98) : 2;
                setChoice(value >= 2 ? (value <= 98 ? value : 98) : 2);
              }}
              disabled={!draggable}
              value={choice}
              min={0}
              max="100"
              step={0.01}
              className={`dice2 w-full h-1 sm:h-2 bg-transparent rounded-lg appearance-none cursor-pointer z-50`}
            />
            {/* bar fill  */}
            <div
              className={`progress-bar-fill absolute rounded-l-full h-1 sm:h-2 ${
                rollType === "over" ? "bg-fomo-red" : "bg-fomo-green"
              }`}
              style={{ width: `${choice}%` }}
            ></div>
            <div
              className="absolute -top-16 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{ marginLeft: `${strikeNumber}%` }}
            >
              {strikeNumber !== 0 && (
                <div
                  ref={strikeNumberRef}
                  className="relative flex flex-col items-center w-max"
                >
                  <div
                    className={`${
                      result
                        ? "border-fomo-green text-white"
                        : "border-fomo-red text-white"
                    } z-10 font-chakra text-sm font-semibold border-2 bg-[#282E3D] w-max text-opacity-75 rounded-md px-4 py-1.5`}
                  >
                    {strikeNumber}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17"
                    height="13"
                    viewBox="0 0 17 13"
                    fill="none"
                    className="absolute -bottom-[10px]"
                  >
                    <path
                      d="M10.8181 11.1779C9.61798 12.6389 7.38191 12.6389 6.18177 11.1779L1.02844 4.90421C-0.579729 2.94643 0.813028 0 3.34662 0L13.6533 0C16.1869 0 17.5797 2.94645 15.9715 4.90422L10.8181 11.1779Z"
                      fill={result ? "#72F238" : "#F1323E"}
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        ref={indicatorsRef}
        className="flex items-center justify-between px-[1.5rem] text-white m-auto font-bold"
      >
        {indicators.map((indicator) => (
          <div key={indicator} className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12px"
              height="12px"
              viewBox="0 0 11 10"
              className="w-[12px] h-[12px] mb-2 -mt-0.5"
            >
              <path
                d="M8.0572 7.83135C6.8865 9.73978 4.1135 9.73978 2.9428 7.83134L0.941367 4.56867C-0.284844 2.56975 1.15351 0 3.49857 0L7.50144 0C9.8465 0 11.2848 2.56975 10.0586 4.56867L8.0572 7.83135Z"
                fill="#282E3D"
              />
            </svg>
            <span className="absolute -bottom-3 sm:-bottom-5 left-1/2 -translate-x-1/2 text-xs sm:text-base font-chakra font-semibold">
              {indicator}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
