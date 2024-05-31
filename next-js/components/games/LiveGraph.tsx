import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
} from "chart.js"
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from "react-chartjs-2";
import { useGlobalContext } from "../GlobalContext";
import { useEffect, useState } from "react";
import { GameType } from "@/utils/provably-fair";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    annotationPlugin,
);

export default function LiveGraph() {
    const { liveStats, liveCurrentStat } = useGlobalContext();
    const [datasets, setDatasets] = useState<{
        label: GameType;
        data: {
            x: number;
            y: number;
        }[];
        borderColor: string;
        tension: number;
        borderWidth: number;
        pointRadius: number;
    }[]>([]);

    useEffect(() => {
        console.log(liveStats)
        let allData = liveStats;
        if (liveCurrentStat !== "All") {
            allData = liveStats.filter(_ => _.game === liveCurrentStat)
        }

        let data = allData.map((_, index) => {
            let nextEl = allData[index + 1];

            return {
                label: _.game,
                data: [
                    {
                        x: index,
                        y: _.pnl
                    },
                    {
                        x: nextEl ? index + 1 : index,
                        y: nextEl ? nextEl.pnl : _.pnl
                    }
                ],
                borderColor: _.result !== "Won" ? '#F1323E' : '#72F238',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            }
        })

        setDatasets(data)
    }, [liveStats])

    return (
        <Line
            data={{
                labels: datasets.map((_, index) => _.data[0].x),
                datasets: datasets,
            }}

            options={{
                scales: {
                    y: {
                        display: false
                    },
                    x: {
                        display: false
                    }
                },
                plugins: {
                    annotation: {
                        annotations: {
                            mainLine: {
                                type: 'line',
                                yMin: 0,
                                yMax: 0,
                                borderColor: '#94A3B8',
                                borderWidth: 1,
                                drawTime: 'beforeDatasetsDraw',
                            }
                        }
                    },
                },
            }
            } />
    )
}