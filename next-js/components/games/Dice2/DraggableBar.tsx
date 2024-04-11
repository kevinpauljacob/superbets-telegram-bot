import React, { useState, useEffect, useRef, RefObject } from "react";

const ProgressBar = ({ chance, setChance, strikeNumber, result, rollType }) => {
  const [isDragging, setIsDragging] = useState(false);

  const progressBarRef: RefObject<HTMLDivElement> =
    useRef<HTMLDivElement>(null);
  const indicatorsRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const strikeNumberRef: RefObject<HTMLDivElement> =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [chance]);

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

  const handleChange = (e) => {
    let newValue = parseFloat(e.target.value);
    newValue = Math.max(2, Math.min(newValue, 98));
    setChance(newValue);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrag = (e) => {
    if (isDragging) {
      const rect = e.target.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      let newChance = (offsetX / rect.width) * 100;

      if (newChance < 2) {
        newChance = 2;
      } else if (newChance > 98) {
        newChance = 98;
      }
      setChance(newChance);
    }
  };

  const indicators = [0, 25, 50, 75, 100];

  const progressBarStyles = {
    progressBar: {
      position: "relative",
      width: "100%",
      backgroundColor: rollType === "over" ? "#72F238" : "#F1323E",
    },
    rangeInput: {
      position: "absolute",
      width: "100%",
      height: "20px",
      margin: 0,
      padding: 0,
      opacity: 0,
    },
    fill: {
      height: "10px",
      width: chance <= 2 ? `2%` : `${chance}%`,
      background: rollType === "over" ? "#F1323E" : "#72F238",
    },
    cursor: {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      backgroundColor: "#7839C5",
      width: "17px",
      height: "26px",
      borderRadius: "7px",
      left:
        chance <= 2
          ? `8.5px`
          : chance >= 98
          ? `calc(${chance}% - 17px)`
          : `calc(${chance}% - 8.5px)`,
      cursor: "pointer",
    },
  };

  const indicatorStyles = {
    container: {
      display: "flex",
      justifyContent: "space-between",
      color: "white",
      fontWeight: "bold",
      margin: "auto",
      // width: `${progressBarRef.current?.clientWidth}px`,
    },
    svg: {
      width: "11px",
      height: "10px",
      fill: "#282E3D",
      top: "-25px",
      marginBottom: "10px",
    },
  };

  return (
    <div>
      <div className="border-8 border-[#282E3D] bg-[#282E3D] rounded-lg">
        <div className="bg-[#0C0F16] rounded-md p-4">
          <div
            ref={progressBarRef}
            style={progressBarStyles.progressBar}
            className="relative rounded-full"
          >
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={chance}
              onChange={handleChange}
              onMouseMove={handleDrag}
              onTouchMove={handleDrag}
              onMouseDown={handleDragStart}
              onMouseUp={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchEnd={handleDragEnd}
              style={progressBarStyles.rangeInput}
            />
            <div
              className="progress-bar-fill rounded-full"
              style={progressBarStyles.fill}
            ></div>
            <div
              style={progressBarStyles.cursor}
              onMouseDown={handleDragStart} // Start dragging when cursor is clicked
              onMouseUp={handleDragEnd} // Stop dragging when mouse button is released
            ></div>
            <div
              className="absolute -top-16 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${strikeNumber}%` }}
            >
              {strikeNumber !== 0 && (
                <div
                  ref={strikeNumberRef}
                  className="relative flex flex-col items-center w-max"
                >
                  <div
                    className={`${
                      result ? "border-[#72F238]" : "border-[#F1323E]"
                    } z-10 font-chakra text-sm font-semibold border-2 bg-[#282E3D] w-max text-white text-opacity-75 rounded-md px-4 py-1.5`}
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
      <div ref={indicatorsRef} style={indicatorStyles.container}>
        {indicators.map((indicator) => (
          <div
            key={indicator}
            style={indicatorStyles.indicator}
            className="relative"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 11 10"
              style={indicatorStyles.svg}
            >
              <path
                d="M8.0572 7.83135C6.8865 9.73978 4.1135 9.73978 2.9428 7.83134L0.941367 4.56867C-0.284844 2.56975 1.15351 0 3.49857 0L7.50144 0C9.8465 0 11.2848 2.56975 10.0586 4.56867L8.0572 7.83135Z"
                fill="#282E3D"
              />
            </svg>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2">
              {indicator}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
