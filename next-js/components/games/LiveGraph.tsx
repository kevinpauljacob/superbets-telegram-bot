import { GameStat, useGlobalContext } from "../GlobalContext";
import { useEffect, useState } from "react";
import { GameType } from "@/utils/provably-fair";
import { ResponsiveContainer, AreaChart, Area, XAxis, ReferenceLine, Dot } from 'recharts';

const colors = {
    red: "#f1323e",
    redFill: "#782932",
    green: "#3dd179",
    greenFill: "#2d6c4b",
    mid: "#808796"
}

export default function LiveGraph() {
    const { liveStats: data, liveCurrentStat } = useGlobalContext();
    const [positiveData, setPositiveData] = useState<GameStat[]>([]);
    const [negativeData, setNegativeData] = useState<GameStat[]>([]);

    useEffect(() => {
        let fdata: GameStat[] = data

        if (liveCurrentStat !== "All") {
            const filteredData = data.filter(item => item.game === liveCurrentStat);
            fdata = filteredData;
        }

        for (let i = 0; i < fdata.length - 1; i++) {
            if (fdata[i].pnl < 0 && fdata[i + 1].pnl > 0) {
                fdata.splice(i + 1, 0, { pnl: 0, amount: 0, result: "Won", game: GameType.dice });
            } else if (fdata[i].pnl > 0 && fdata[i + 1].pnl < 0) {
                fdata.splice(i + 1, 0, { pnl: 0, amount: 0, result: "Won", game: GameType.dice });
            }
        }

        //@ts-ignore
        fdata.forEach((item, index) => item.index = index);

        const positiveD = fdata.map(item => ({ ...item, pnl: item.pnl > 0 ? item.pnl : 0 }));
        const negativeD = fdata.map(item => ({ ...item, pnl: item.pnl < 0 ? item.pnl : 0 }));

        setPositiveData(positiveD);
        setNegativeData(negativeD);
    }, [data, liveCurrentStat])

    return (
        <ResponsiveContainer style={{
            padding: "15px",
            borderRadius: "10px",
        }}>
            <AreaChart data={negativeData}>
                <defs>
                    <linearGradient id="colorpnl" >
                        <stop offset="100%" stopColor={colors.greenFill} />
                    </linearGradient>
                    <linearGradient id="colorpnlNeg">
                        <stop offset="100%" stopColor={colors.redFill} />
                    </linearGradient>
                </defs>

                <XAxis dataKey="index" type="number" domain={[0, data.length - 1]} hide />

                <Area type="monotone" dataKey="pnl" stroke="#00c853" strokeWidth={2} fillOpacity={1} fill="url(#colorpnl)" data={positiveData} />
                <Area type="monotone" dataKey="pnl" stroke="#d50000" strokeWidth={2} fillOpacity={1} fill="url(#colorpnlNeg)" data={negativeData} />

                <ReferenceLine y={0} strokeWidth={2} stroke={colors.mid} />
            </AreaChart>
        </ResponsiveContainer>
    )
}