import { translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const CountdownTimer = dynamic(() => import("./CountdownTimer"), {
  ssr: false,
});

export default function InfoBar() {
  const { language } = useGlobalContext();

  const [stats, setStats] = useState({
    totalVolume: 0,
    totalPlayers: 0,
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      label: translator("Unique Players", language),
      value: stats.totalPlayers,
    },
    {
      label: translator("Total Volume", language),
      value: `${(stats.totalVolume ?? 0).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })} SOL`,
    },
    {
      label: translator("Exit Game", language),
      value: <CountdownTimer targetDate={new Date(Date.UTC(2024, 5, 2, 19, 30, 0))} />,
    },
  ];

  useEffect(() => {
    fetch("/api/games/global/getAggStats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.stats);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="w-full min-h-[2rem] z-[100] bg-[linear-gradient(90deg,#1D3B7C_0%,#1D3B7C_100%)] text-[#E7E7E7] text-opacity-70 flex items-center justify-center text-xs gap-5">
      {/* samll screens (mobile) */}
      <div className="w-full flex md:hidden justify-center ">
          <div className="flex items-center gap-1">
            <span className="text-[#e7e7e7] text-opacity-70 text-xs font-normal">
              {slides[currentSlide].label} :
            </span>
            <span className="text-[#e7e7e7] text-opacity-70 text-xs font-medium">
              {slides[currentSlide].value}
            </span>
          </div>
      </div>
      {/* medium screen */}
      {slides.map(({label,value})=>(<div className="hidden md:flex items-center gap-1">
        <span className="text-[#e7e7e7] text-opacity-70 text-xs font-normal">
          {label} :
        </span>
        <span className="text-[#e7e7e7] text-opacity-70 text-xs font-medium">
          {value}
        </span>
      </div>))}
    </div>
  );
}
