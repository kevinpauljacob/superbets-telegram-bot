import { GameStat, useGlobalContext } from "../GlobalContext";
import { useEffect, useState } from "react";
import { GameType } from "@/utils/provably-fair";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  ReferenceLine,
  Dot,
  Tooltip,
} from "recharts";

const colors = {
  red: "#f1323e",
  redFill: "#782932",
  green: "#3dd179",
  greenFill: "#2d6c4b",
  mid: "#808796",
};

export default function LiveGraph({
  setHoverValue,
}: {
  setHoverValue: (value: number | null) => void;
}) {
  const { liveStats: data, liveCurrentStat } = useGlobalContext();
  const [combinedData, setCombinedData] = useState<GameStat[]>([]);

  const CustomTooltip = ({ active, payload, label, coordinate }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].payload.totalPNL;
      setHoverValue(value);

      return null;
    }

    setHoverValue(null);
    return null;
  };

  const CustomPositiveDot = ({ cx, cy, payload, active }: any) => {
    if (payload.positivePNL !== 0) {
      return (
        <Dot
          r={5}
          cx={cx}
          cy={cy}
          fill="white"
          stroke="white"
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  const CustomNegativeDot = ({ cx, cy, payload, active }: any) => {
    if (payload.negativePNL !== 0) {
      return (
        <Dot
          r={5}
          cx={cx}
          cy={cy}
          fill="white"
          stroke="white"
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  useEffect(() => {
    let fdata: GameStat[] = data;

    if (liveCurrentStat !== "All") {
      const filteredData = data.filter((item) => item.game === liveCurrentStat);
      fdata = filteredData.map((item, index) => ({ ...item, index }));
    }

    for (let i = 0; i < fdata.length - 1; i++) {
      if (fdata[i].totalPNL < 0 && fdata[i + 1].totalPNL > 0) {
        fdata.splice(i + 1, 0, {
          pnl: 0,
          amount: 0,
          result: "Won",
          token: "SOL",
          game: GameType.dice,
          totalPNL: 0,
        });
      } else if (fdata[i].totalPNL > 0 && fdata[i + 1].totalPNL < 0) {
        fdata.splice(i + 1, 0, {
          pnl: 0,
          amount: 0,
          result: "Won",
          token: "SOL",
          game: GameType.dice,
          totalPNL: 0,
        });
      }
    }

    //@ts-ignore
    fdata.forEach((item, index) => (item.index = index));

    const combinedD = fdata.map((item) => ({
      ...item,
      positivePNL: item.totalPNL > 0 ? item.totalPNL : 0,
      negativePNL: item.totalPNL < 0 ? item.totalPNL : 0,
    }));

    setCombinedData(combinedD);
  }, [data, liveCurrentStat]);

  return (
    <ResponsiveContainer
      height={450}
      width={"100%"}
      style={{ borderRadius: "10px" }}
    >
      <AreaChart data={combinedData}>
        <defs>
          <linearGradient id="colorpnl">
            <stop offset="100%" stopColor={colors.greenFill} />
          </linearGradient>
          <linearGradient id="colorpnlNeg">
            <stop offset="100%" stopColor={colors.redFill} />
          </linearGradient>
        </defs>

        <XAxis dataKey="index" type="number" domain={[0, "dataMax"]} hide />

        <Area
          type="monotone"
          dataKey="positivePNL"
          stroke="#00c853"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorpnl)"
          isAnimationActive={false}
          activeDot={<CustomPositiveDot />}
        />
        <Area
          type="monotone"
          dataKey="negativePNL"
          stroke="#d50000"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorpnlNeg)"
          isAnimationActive={false}
          activeDot={<CustomNegativeDot />}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            stroke: colors.mid,
            strokeWidth: 2,
            fill: "none",
            strokeDasharray: "3 3",
          }}
        />

        <ReferenceLine y={0} strokeWidth={2} stroke={colors.mid} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
