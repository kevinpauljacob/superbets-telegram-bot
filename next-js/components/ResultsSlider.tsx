import { useEffect, useRef } from "react";

interface Result {
  result: number;
  win: boolean;
}

export default function ResultsSlider({ results }: { results: Result[] }) {
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = resultsContainerRef.current;
    if (container) {
      const lastChild = container.lastElementChild;
      if (lastChild) {
        // setTimeout(()=>{},500)
        lastChild.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "end",
        });
      }
    }
  }, [results]);

  return (
    <div className="flex overflow-x-auto no-scrollbar items-center max-w-[318px]" ref={resultsContainerRef}>
      {results.map((result, index) => (
        <div
          key={index}
          className={`${
            result.win
              ? "border-[#72F238] text-[#72F238]"
              : "border-[#282E3D] text-white"
          } font-chakra text-xs font-semibold border-2 bg-[#282E3D] text-opacity-75 rounded-md transition-all duration-300 px-3 py-1 ml-1 sm:ml-2`}
        >
          {result.result}
        </div>
      ))}
    </div>
  );
}
