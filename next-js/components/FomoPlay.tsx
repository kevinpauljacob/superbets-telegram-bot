import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";
import FomoPlayIcon from "@/public/assets/fomoplay.svg";
import Store from "@/public/assets/sidebar-icons/Store";

export default function FomoPlay() {
  const games = [
    {
      href: "/dice",
      src: "/assets/game-cards/dice.png",
    },
    {
      href: "/dice2",
      src: "/assets/game-cards/dice2.png",
    },
    {
      href: "/coinflip",
      src: "/assets/game-cards/coinflip.png",
    },
    // {
    //   href: "/options",
    //   src: "/assets/game-cards/options.png",
    // },
    {
      href: "/limbo",
      src: "/assets/game-cards/limbo.png",
    },
    {
      href: "/keno",
      src: "/assets/game-cards/keno.png",
    },
    {
      href: "/wheel",
      src: "/assets/game-cards/wheel.png",
    },
    {
      href: "/mines",
      src: "/assets/game-cards/mines.png",
    },
    {
      href: "/plinko",
      src: "/assets/game-cards/plinko.png",
    },
    {
      href: "/roulette",
      src: "/assets/game-cards/roulette.png",
    },
    // {
    //   href: "/roulette2",
    //   src: "/assets/game-cards/roulette.png",
    // },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const { language } = useGlobalContext();
  const router = useRouter();

  const filteredGames = games.filter((game) => game.href !== router.pathname);

  const nextSlide = () => {
    setCurrentSlide((prevSlide) =>
      prevSlide === games.length - 1 ? 0 : prevSlide + 1,
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) =>
      prevSlide === 0 ? games.length - 1 : prevSlide - 1,
    );
  };

  return (
    <div className="mt-5">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <Store className="w-5 h-5" />
          <span className="font-medium font-changa text-xl text-opacity-90 pl-3">
            <span className="inline text-white">
              SuperBets Games
            </span>
          </span>
        </div>
        <div className="">
          <button
            className="bg-[#1D1A21] hover:bg-[#333037] focus:bg-[#333037] transition-all text-white font-bold py-3 px-3 md:py-3.5 md:px-6 rounded focus:outline-none focus:shadow-outline mr-3"
            onClick={prevSlide}
          >
            <Image
              src="/assets/downArrow.png"
              alt=""
              width={10}
              height={10}
              className="rotate-90"
            />
          </button>
          <button
            className="bg-[#1D1A21] hover:bg-[#333037] focus:bg-[#333037] transition-all text-white font-bold py-3 px-3 md:py-3.5 md:px-6 rounded focus:outline-none focus:shadow-outline"
            onClick={nextSlide}
          >
            <Image
              src="/assets/downArrow.png"
              alt=""
              width={10}
              height={10}
              className="-rotate-90"
            />
          </button>
        </div>
      </div>
      <div className="flex items-end relative min-h-[15rem] overflow-x-auto no-scrollbar">
        {filteredGames.map((game, index) => (
          <div
            key={index}
            className="absolute flex items-end top-0 left-0 w-max h-full transform transition-transform duration-300"
            style={{
              transform: `translateX(${index * 100 - currentSlide * 100}%)`,
            }}
          >
            <Link
              href={game.href}
              key={index}
              className="mt-3.5 flex items-end transition-transform z-20 hover:-translate-y-4"
            >
              <Image
                src={game.src}
                alt=""
                width={154}
                height={216}
                className="mr-3.5"
              />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
