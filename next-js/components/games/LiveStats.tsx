import Draggable from 'react-draggable';
import { useGlobalContext } from '../GlobalContext';
import { useEffect, useState } from 'react';
import { GameType } from "@/utils/provably-fair";
import LiveGraph from './LiveGraph';

export default function LiveStats() {
    const {
        showLiveStats,
        setShowLiveStats,
        liveCurrentStat,
        setLiveCurrentStat,
        liveStats,
        setLiveStats
    } = useGlobalContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [data, setData] = useState({
        wagered: 0,
        pnl: 0,
        wins: 0,
        losses: 0
    })

    const games = [
        "All",
        ...liveStats.map((game) => game.game)
    ].filter((value, index, self) => self.indexOf(value) === index)

    useEffect(() => {
        if (liveCurrentStat === "All") {
            const wagered = liveStats.reduce((acc, curr) => acc + curr.amount, 0)
            const pnl = liveStats.reduce((acc, curr) => acc + curr.pnl, 0)
            let wins = 0;
            let losses = 0;

            for (let stat of liveStats) {
                if (stat.pnl > 0) wins++
                else losses++
            }

            setData({
                wagered,
                pnl,
                wins,
                losses
            })
        } else {
            let games = liveStats.filter((game) => game.game === liveCurrentStat)

            const wagered = games.reduce((acc, curr) => acc + curr.amount, 0)
            const pnl = games.reduce((acc, curr) => acc + curr.pnl, 0)
            let wins = 0;
            let losses = 0;

            for (let stat of games) {
                if (stat.pnl > 0) wins++
                else losses++
            }

            setData({
                wagered,
                pnl,
                wins,
                losses
            })
        }
    }, [liveCurrentStat, liveStats])

    return (
        <Draggable bounds="parent" handle=".handle">
            <div className={`absolute m-4 w-[269px] h-[449px] bg-[#121418] border border-white/10 rounded-lg flex flex-col ${showLiveStats ? "" : "hidden"}`} style={{
                zIndex: 99999999
            }}>
                <div className='handle w-full h-16 flex flex-row items-center justify-between p-5 cursor-move select-none'>
                    <h1 className='text-white text-[16px] font-chakra'>LIVE STATS</h1>

                    <div className='flex flex-row gap-2'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" className='cursor-pointer' onClick={() => {
                            setLiveStats([])
                        }}>
                            <path d="M3.74913 12.25C2.90703 11.4109 2.33321 10.3404 2.10048 9.17461C1.86774 8.00878 1.98658 6.80009 2.44192 5.70191C2.89727 4.60373 3.66858 3.66558 4.65799 3.00649C5.6474 2.3474 6.8103 1.9971 7.99913 2.00002" stroke="white" />
                            <path d="M12.25 3.75C13.0921 4.58917 13.6659 5.65958 13.8987 6.82541C14.1314 7.99124 14.0125 9.19993 13.5572 10.2981C13.1019 11.3963 12.3305 12.3344 11.3411 12.9935C10.3517 13.6526 9.18883 14.0029 8 14" stroke="white" />
                            <path d="M3.7575 10V12.2425H2" stroke="white" />
                            <path d="M12.2422 6.00007V3.75757H13.9997" stroke="white" />
                        </svg>

                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="white" className='cursor-pointer hover:fill-red-400' onClick={() => setShowLiveStats(false)}>
                            <path d="M8.72953 8.00702L12.849 3.91002C13.0465 3.71452 13.0465 3.39802 12.849 3.20302C12.652 3.00752 12.332 3.00752 12.135 3.20302L8.01903 7.29652L3.86503 3.14202C3.66803 2.94452 3.34803 2.94452 3.15103 3.14202C2.95403 3.34002 2.95403 3.66052 3.15103 3.85802L7.30203 8.00952L3.13603 12.1525C2.93903 12.348 2.93903 12.6645 3.13603 12.8595C3.33303 13.055 3.65303 13.055 3.85003 12.8595L8.01253 8.72002L12.15 12.858C12.347 13.0555 12.667 13.0555 12.864 12.858C13.061 12.66 13.061 12.3395 12.864 12.142L8.72953 8.00702Z" fill="current" />
                        </svg>
                    </div>
                </div>

                <div className="border border-white/10"></div>

                <div className='flex flex-col grow p-4 relative select-none'>
                    <div className='w-full h-[41px] bg-[#202329] rounded-md cursor-pointer flex flex-row items-center justify-between p-3' onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        <h1 className='text-white text-[12px] font-chakra uppercase'>{liveCurrentStat}</h1>
                        <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" className={isDropdownOpen ? "rotate-180" : ""}>
                            <path d="M5.46967 6.53043C5.76256 6.82332 6.23744 6.82332 6.53033 6.53043L11.3033 1.75746C11.5962 1.46457 11.5962 0.989692 11.3033 0.696799C11.0104 0.403906 10.5355 0.403906 10.2426 0.696799L6 4.93944L1.75736 0.696799C1.46447 0.403906 0.989593 0.403906 0.696699 0.696799C0.403806 0.989692 0.403806 1.46457 0.696699 1.75746L5.46967 6.53043ZM5.25 6V6.0001H6.75V6H5.25Z" fill="white" />
                        </svg>
                    </div>

                    {isDropdownOpen && (
                        <div className='absolute w-[89%] mt-12 p-2 max-h-40 bg-[#202329] rounded-md overflow-y-auto nobar'>
                            {games.map((game, index) => (
                                <div key={index} className='w-full h-8 flex flex-row items-center justify-between p-3 cursor-pointer hover:bg-[#30363D] rounded-md' onClick={() => {
                                    setLiveCurrentStat(game as GameType)
                                    setIsDropdownOpen(false)
                                }}>
                                    <h1 className='text-white text-[12px] font-chakra uppercase'>{game}</h1>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className='w-full flex flex-row mt-3'>
                        <div className='w-1/2 flex flex-col bg-[#202329] rounded-lg p-2 mr-1'>
                            <div className='text-[10px] text-[#94A3B8] font-chakra text-left'>Wagered</div>
                            <div className='text-white text-[12px] font-chakra flex flex-row items-center justify-end'>
                                <span>
                                    {data.wagered.toFixed(4)}
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-1">
                                    <g opacity="0.5">
                                        <path d="M7 12.25C9.8995 12.25 12.25 9.8995 12.25 7C12.25 4.10051 9.8995 1.75 7 1.75C4.10051 1.75 1.75 4.10051 1.75 7C1.75 9.8995 4.10051 12.25 7 12.25Z" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M6.12405 10.3906C5.37119 10.1979 4.70389 9.76001 4.22737 9.1461C3.75084 8.5322 3.49219 7.77715 3.49219 7C3.49219 6.22285 3.75084 5.4678 4.22737 4.8539C4.70389 4.23999 5.37119 3.80214 6.12405 3.60938" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M7.875 3.60938C8.62786 3.80214 9.29516 4.23999 9.77168 4.8539C10.2482 5.4678 10.5069 6.22285 10.5069 7C10.5069 7.77715 10.2482 8.5322 9.77168 9.1461C9.29516 9.76001 8.62786 10.1979 7.875 10.3906" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M6.5625 7C6.33044 7 6.10788 6.90781 5.94378 6.74372C5.77969 6.57962 5.6875 6.35706 5.6875 6.125C5.6875 5.89294 5.77969 5.67038 5.94378 5.50628C6.10788 5.34219 6.33044 5.25 6.5625 5.25" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M7.4375 7C7.66956 7 7.89212 7.09219 8.05622 7.25628C8.22031 7.42038 8.3125 7.64294 8.3125 7.875C8.3125 8.10706 8.22031 8.32962 8.05622 8.49372C7.89212 8.65781 7.66956 8.75 7.4375 8.75" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M7 4.375V5.25" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M7 8.75V9.625" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M6.5625 7H7.4375" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M8.3125 5.6875C8.3125 5.6875 7.875 5.25 7.4375 5.25H6.5625" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M5.6875 8.3125C5.6875 8.3125 6.125 8.75 6.5625 8.75H7.4375" stroke="#F0F0F0" stroke-width="0.5" />
                                    </g>
                                </svg>
                            </div>
                        </div>

                        <div className='w-1/2 flex flex-col bg-[#202329] rounded-lg p-2 ml-1'>
                            <div className='text-[10px] text-[#94A3B8] font-chakra text-left'>Profit</div>
                            <div className='text-white text-[12px] font-chakra flex flex-row items-center justify-end'>
                                <span className={data.pnl > 0 ? "text-[#72F238]" : "text-[#F1323E]"}>
                                    {data.pnl > 0 ? "+" : ""}
                                    {data.pnl.toFixed(4)}
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-1">
                                    <g opacity="0.5">
                                        <path d="M7 12.25C9.8995 12.25 12.25 9.8995 12.25 7C12.25 4.10051 9.8995 1.75 7 1.75C4.10051 1.75 1.75 4.10051 1.75 7C1.75 9.8995 4.10051 12.25 7 12.25Z" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M6.12405 10.3906C5.37119 10.1979 4.70389 9.76001 4.22737 9.1461C3.75084 8.5322 3.49219 7.77715 3.49219 7C3.49219 6.22285 3.75084 5.4678 4.22737 4.8539C4.70389 4.23999 5.37119 3.80214 6.12405 3.60938" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M7.875 3.60938C8.62786 3.80214 9.29516 4.23999 9.77168 4.8539C10.2482 5.4678 10.5069 6.22285 10.5069 7C10.5069 7.77715 10.2482 8.5322 9.77168 9.1461C9.29516 9.76001 8.62786 10.1979 7.875 10.3906" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M6.5625 7C6.33044 7 6.10788 6.90781 5.94378 6.74372C5.77969 6.57962 5.6875 6.35706 5.6875 6.125C5.6875 5.89294 5.77969 5.67038 5.94378 5.50628C6.10788 5.34219 6.33044 5.25 6.5625 5.25" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M7.4375 7C7.66956 7 7.89212 7.09219 8.05622 7.25628C8.22031 7.42038 8.3125 7.64294 8.3125 7.875C8.3125 8.10706 8.22031 8.32962 8.05622 8.49372C7.89212 8.65781 7.66956 8.75 7.4375 8.75" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M7 4.375V5.25" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M7 8.75V9.625" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M6.5625 7H7.4375" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M8.3125 5.6875C8.3125 5.6875 7.875 5.25 7.4375 5.25H6.5625" stroke="#F0F0F0" stroke-width="0.5" />
                                        <path d="M5.6875 8.3125C5.6875 8.3125 6.125 8.75 6.5625 8.75H7.4375" stroke="#F0F0F0" stroke-width="0.5" />
                                    </g>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className='w-full flex flex-row mt-3'>
                        <div className='w-1/2 flex flex-col bg-[#202329] rounded-lg p-2 mr-1'>
                            <div className='text-[10px] text-[#94A3B8] font-chakra text-left'>Wins</div>
                            <div className='text-[12px] font-chakra flex flex-row items-center justify-end text-[#72F238]'>
                                {data.wins}
                            </div>
                        </div>

                        <div className='w-1/2 flex flex-col bg-[#202329] rounded-lg p-2 ml-1'>
                            <div className='text-[10px] text-[#94A3B8] font-chakra text-left'>Losses</div>
                            <div className='text-[12px] font-chakra flex flex-row items-center justify-end text-[#F1323E]'>
                                {data.losses}
                            </div>
                        </div>
                    </div>
                </div>

                <LiveGraph />
            </div>
        </Draggable>
    )
}