import Image from "next/image";
import Dollar from "/public/assets/dollar.png";
import Link from "next/link";

export default function FomoExit() {
  const games = [
    {
      href: "/",
      src: "/assets/f1game.png",
    },
    {
      href: "/",
      src: "/assets/clrgame.png",
    },
    {
      href: "/",
      src: "/assets/odrgame.png",
    },
  ];

  return (
    <div>
      <div className="flex items-center mb-5">
        <Image src={Dollar} alt="" width={26} height={26} />
        <span className="font-bold text-xl pl-3">
          FOMO: Exit - A unique DeFi game experience
        </span>
      </div>
      <div className="flex flex-wrap">
        {games.map((game, index) => (
          <Link href={game.href} key={index} className="pr-3.5">
            <Image src={game.src} alt="" width={295} height={160} />
          </Link>
        ))}
      </div>
    </div>
  );
}
