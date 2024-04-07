import React, { useState } from "react";
import Image from "next/image";
import Dollar from "/public/assets/dollar.png";
import Link from "next/link";

export default function FomoPlay() {
  const games = [
    {
      href: "/dice",
      src: "/assets/dicecard.png",
    },
    {
      href: "/coinflip",
      src: "/assets/flipcard.png",
    },
    {
      href: "/options",
      src: "/assets/binarycard.png",
    },
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Image src={Dollar} alt="" width={26} height={26} />
          <span className="font-semibold font-changa text-xl text-opacity-90 pl-3">
            <span className="hidden sm:inline">
              FOMO: Play - The best casino games
            </span>
            <span className="sm:hidden">FOMO: Play</span>
          </span>
        </div>
        <div className="">
          <button
            className="bg-[#1D1A21] hover:bg-gray-500/30 text-white font-bold py-4 px-5 rounded focus:outline-none focus:shadow-outline mr-3"
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
            className="bg-[#1D1A21] hover:bg-gray-500/30 text-white font-bold py-4 px-5 rounded focus:outline-none focus:shadow-outline"
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
      <div className="relative min-h-[295px] overflow-hidden">
        {games.map((game, index) => (
          <div
            key={index}
            className="absolute top-0 left-0 w-max h-full transform transition-transform duration-300"
            style={{
              transform: `translateX(${index * 100 - currentSlide * 100}%)`,
            }}
          >
            <Link href={game.href} key={index} className="pr-3.5 mt-3.5">
              <Image
                src={game.src}
                alt=""
                width={210}
                height={294}
                className="mr-3.5"
              />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
