import { translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { SPL_TOKENS } from "@/context/config";

const CountdownTimer = dynamic(() => import("./CountdownTimer"), {
  ssr: false,
});

type TokenVolumes = {
  [token: string]: number;
};

export default function InfoBar() {
  const { language } = useGlobalContext();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalVolumes: SPL_TOKENS.reduce((acc: TokenVolumes, token) => {
      acc[token.tokenMint] = 0;
      return acc;
    }, {}),
    totalPlayers: 0,
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [animationClass, setAnimationClass] = useState("slide-in");
  const [volume, setVolume] = useState<number>(0);

  const getVolume = async (totalVolume: TokenVolumes) => {
    const mintIds = Object.keys(totalVolume).join(",");
    const data = await (
      await fetch(`https://price.jup.ag/v6/price?ids=${mintIds}&vsToken=SOL`)
    ).json();

    let volume = 0;

    for (const [mintId, amount] of Object.entries(totalVolume)) {
      const price = data?.data[mintId]?.price ?? 0;
      volume += amount * price;
    }

    setVolume(volume);
  };

  const slides = [
    {
      label: translator("Unique Players", language),
      value: stats.totalPlayers,
    },
    {
      label: translator("Total Volume", language),
      value: `${volume.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })} SOL`,
    },
    {
      label: translator("Exit Game", language),
      value: (
        <CountdownTimer
          targetDate={new Date(Date.UTC(2024, 5, 2, 19, 30, 0))}
        />
      ),
    },
  ];

  useEffect(() => {
    fetch("/api/games/global/getAggStats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          getVolume(data.stats.totalVolumes);
        }
      });
  }, [router.pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationClass("slide-out"); // Start by fading out the current slide
      setTimeout(() => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
        setAnimationClass("slide-in");
      }, 1500); // This should match the duration of the slide-out animation in globals.css
    }, 4000); // Total time each slide is shown
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="w-full min-h-[2rem] z-[100] bg-[linear-gradient(90deg,#1D3B7C_0%,#1D3B7C_100%)] text-[#E7E7E7] text-opacity-70 flex items-center justify-center text-xs gap-5">
      {/* samll screens (mobile) */}
      <div className="w-full flex md:hidden justify-center ">
        <div
          key={currentSlide}
          className={`flex items-center gap-1 ${animationClass}`}
        >
          <span className="text-[#e7e7e7] text-opacity-70 text-xs font-normal">
            {slides[currentSlide].label} :
          </span>
          <span className="text-[#e7e7e7] text-opacity-70 text-xs font-medium">
            {slides[currentSlide].value}
          </span>
        </div>
      </div>
      {/* medium screen */}
      {slides.map(({ label, value }, index) => (
        <div key={index} className="hidden md:flex items-center gap-1">
          <span className="text-[#e7e7e7] text-opacity-70 text-xs font-normal">
            {label} :
          </span>
          <span className="text-[#e7e7e7] text-opacity-70 text-xs font-medium">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
