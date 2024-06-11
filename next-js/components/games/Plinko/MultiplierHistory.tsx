export interface MultiplierHistory {
  color: string;
  value: number;
}
export function MultiplierHistory({
  multiplierHistory,
}: {
  multiplierHistory: MultiplierHistory[];
}) {

  return (
    <div className="z-[100] absolute right-0 top-0 m-6 flex w-14 flex-col gap-2 overflow-hidden rounded-md bg-transparent">
      {multiplierHistory.map((multiplier: MultiplierHistory, index) => {
        if (index > 3 || !multiplier) return null;
        return (
          <span
            key={`${multiplier.value}${index}${Math.random()}`}
            className={`flex items-center border font-semibold font-chakra text-xs rounded-md justify-center p-1 bg-[#282E3D]`}
            style={{
              borderColor: multiplier.color,
              color: multiplier.color,
            }}
          >
            {multiplier.value}x
          </span>
        );
      })}
    </div>
  );
}
