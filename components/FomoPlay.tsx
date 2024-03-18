import Image from "next/image";
import Dollar from "/public/assets/dollar.png";
import Link from "next/link";

export default function FomoPlay() {
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

  return (
    <div>
      <div className="flex items-center mb-1.5">
        <Image src={Dollar} alt="" width={26} height={26} />
        <span className="font-bold text-xl pl-3">
          FOMO: Play - The best casino games
        </span>
      </div>
      <div className="flex flex-wrap justify-center sm:justify-start">
        {games.map((game, index) => (
          <Link href={game.href} key={index} className="pr-3.5 mt-3.5">
            <Image src={game.src} alt="" width={210} height={294} />
          </Link>
        ))}
      </div>
    </div>
  );
}
