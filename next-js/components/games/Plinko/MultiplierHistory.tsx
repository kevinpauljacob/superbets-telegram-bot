interface MultiplierHistoryProps {
  multiplierHistory: number[];
}
export function MultiplierHistory({
  multiplierHistory,
}: MultiplierHistoryProps) {

  const multiplierColorMap: {
    [key: number]: string;
  } = {
    0.5: "#FFD498",
    1: "#FFBA5A",
    1.1: "#F28C54",
    2.1: "#FE6359",
    5.6: "#B4122C",
  };

  return (
    <div className="absolute right-20 top-40 flex w-16 flex-col gap-1 overflow-hidden rounded-md bg-transparent">
      {multiplierHistory.map((multiplier: number, index) => {
        if (index > 3 || !multiplier) return null;
        return (
          <span
            key={`${multiplier}${index}${Math.random()}`}
            className={`flex items-center border rounded-md justify-center bg-${multiplierColorMap[multiplier]} p-1 font-bold text-[${multiplierColorMap[multiplier]}]`}
            style={{
              borderColor : multiplierColorMap[multiplier],
              color : multiplierColorMap[multiplier],
            }}
          >
            {multiplier}x
          </span>
        );
      })}
    </div>
  );
}
