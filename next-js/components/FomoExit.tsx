import React, { useState } from "react";
import Image from "next/image";
import Dollar from "/public/assets/dollar.png";
import Link from "next/link";

export default function FomoExit() {
  const games = [
    {
      href: "/",
      src: "/assets/mines.png",
    },
    {
      href: "/",
      src: "/assets/blackjack.png",
    },
    {
      href: "/",
      src: "/assets/keno.png",
    },
    {
      href: "/",
      src: "/assets/plinko.png",
    },
    {
      href: "/",
      src: "/assets/wheel.png",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

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
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Image src={Dollar} alt="" width={26} height={26} />
          <span className="font-semibold font-changa text-xl text-opacity-90 pl-3">
            <span className="hidden sm:inline">
              FOMO: Exit - A unique DeFi game experience
            </span>
            <span className="sm:hidden">FOMO: Exit</span>
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
            className="bg-[#1D1A21] hover:bg-[#333037] focus:bg-[#333037] transition-all text-white font-bold py-3 px-3 md:py-3.5 md:px-6 rounded focus:outline-none focus:shadow-outline mr-3"
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
        {games.map((game, index) => (
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
