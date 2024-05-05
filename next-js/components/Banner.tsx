import Image from "next/image";
import BannerLeft from "/public/assets/storeBannerLeft.svg";
import BannerRight from "/public/assets/storeBannerRight.svg";
import Link from "next/link";

export default function StoreBanner() {
  const games = [
    {
      href: "/",
      src: "/assets/banners/raffle.png",
    },
    {
      href: "/",
      src: "/assets/banners/leaderboard.png",
    },
    {
      href: "/",
      src: "/assets/banners/staking.png",
    },
  ];
  return (
    <div className="relative w-full flex flex-row overflow-x-auto no-scrollbar min-h-[185px] overflow-hidden">
      {games.map((game, index) => (
        <div
          key={index}
          className="w-full h-full min-w-[18.5rem] transform transition-transform duration-300"
        >
          <Link href={game.href} className="bg-white mx-4">
            <Image
              src={game.src}
              alt="banners"
              width="100"
              height="100"
              unoptimized
              className="w-[95%] mr-3.5"
            />
          </Link>
        </div>
      ))}
    </div>
  );
}
