import { ChangeEvent, useState } from "react";
import { LinesType, RisksType } from "@/pages/plinko";

interface PlinkoBetActions {
  onRunBet: (betValue: number) => void;
  onChangeLines: (lines: LinesType) => void;
  onChangeRisk: (risks: RisksType) => void;
}

export function BetActions({
  onRunBet,
  onChangeLines,
  onChangeRisk,
}: PlinkoBetActions) {
  const [betValue, setBetValue] = useState<number>(0.0);
  const [tab, setTab] = useState<"Manual" | "Auto">("Manual");
  const maxLinesQnt = 16;
  const linesOptions: number[] = [];
  for (let i = 8; i <= maxLinesQnt; i++) {
    linesOptions.push(i);
  }

  function handleChangeLines(e: ChangeEvent<HTMLSelectElement>) {
    onChangeLines(Number(e.target.value) as LinesType);
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBetValue(parseInt(e.target.value));
  };

  function changeRisks(risk: String) {
    onChangeRisk(risk as RisksType);
  }

  return (
    <div className="h-full w-full place-content-center px-8 bg-[#121418] text-white border-r border-opacity-20 border-white">
      <div className="grid gap-3">
        <div className="my-4 flex w-full items-center justify-center">
          <button
            className={`px-4 py-2 mr-2 w-full text-white rounded-md ${
              tab === "Manual"
                ? "bg-[#D9D9D9] bg-opacity-5"
                : "border-2 border-opacity-5 border-[#FFFFFF]"
            }`}
            onClick={() => setTab("Manual")}
          >
            Manual
          </button>
          <button
            className={`px-4 py-2 w-full text-white rounded-md ${
              tab === "Auto"
                ? "bg-[#D9D9D9] bg-opacity-5"
                : "border-2 border-opacity-5 border-[#FFFFFF]"
            }`}
            onClick={() => setTab("Auto")}
          >
            Auto
          </button>
        </div>
        <div className="grid w-full">
          <div className="text-white text-md">Bet Value</div>
          <div className="grid grid-cols-8 gap-4 w-full">
            <input
              className="col-span-6 bg-[#202329] py-3 px-3 rounded-md"
              type="number"
              id="betAmount"
              value={betValue}
              onChange={handleInputChange}
            />
            <button className="bg-[#202329] rounded-md w-full px-3 text-center col-span-2">
              Max
            </button>
          </div>
        </div>
        <div className="grid w-full">
          <div className="text-white text-md">Risk</div>
          <div className="grid md:grid-cols-3 bg-[#0C0F16] p-4 gap-4">
            <button
              className="bg-[#202329] rounded-md text-center py-2 px-4"
              onClick={() => changeRisks("Low")}
            >
              Low
            </button>
            <button
              className="bg-[#202329] rounded-md text-center py-2 px-4"
              onClick={() => changeRisks("Medium")}
            >
              Medium
            </button>
            <button
              className="bg-[#202329] rounded-md text-center py-2 px-4"
              onClick={() => changeRisks("High")}
            >
              High
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <select
            onChange={handleChangeLines}
            defaultValue={8}
            className="w-full rounded-md text-black border-2 border-secondary bg-background py-2 px-4 font-bold transition-all placeholder:font-bold placeholder:text-text focus:border-purple focus:outline-none disabled:line-through disabled:opacity-80"
            id="lines"
          >
            {linesOptions.map((line) => (
              <option key={line} value={line}>
                {line} Lines
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            onRunBet(1);
          }}
          className="rounded-md bg-[#7839C5] py-4 px-2 font-changa w-full"
        >
          Bet
        </button>
      </div>
    </div>
  );
}
