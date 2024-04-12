interface MultiplierHistoryProps {
    multiplierHistory: number[];
  }
  export function MultiplierHistory({
    multiplierHistory,
  }: MultiplierHistoryProps) {
  
  
    return (
      <div className="absolute w-16 md:right-56 flex gap-3 rounded-md bg-transparent">
        {multiplierHistory.map((multiplier: number, index) => {
          if (index > 3 || !multiplier) return null;
          return (
            <span
              key={`${multiplier}${index}${Math.random()}`}
              className={`flex items-center border rounded-md justify-center bg-[#282E3D] ${multiplier>=2? 'text-[#72F238] border-[#72F238]': 'text-[#F1323E] border-[#F1323E]'} py-1 px-2 text-white`}
            >
              {multiplier.toFixed(2)}x
            </span>
          );
        })}
      </div>
    );
  }