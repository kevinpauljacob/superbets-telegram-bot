import Image from "next/image";
import Link from "next/link";

export default function StoreBanner() {
  const games = [
    // {
    //   href: "/store",
    //   src: "/assets/banners/raffle.png",
    // },
    {
      href: "/leaderboard",
      src: "/assets/banners/banner_1.png",
    },
    {
      href: "/leaderboard",
      src: "/assets/banners/banner_2.png",
    },
    {
      href: "/leaderboard",
      src: "/assets/banners/leaderboard.png",
    },
    // {
    //   href: "/stake",
    //   src: "/assets/banners/staking.png",
    // },
  ];
  return (
    <div className="relative w-full flex flex-row overflow-x-auto no-scrollbar overflow-hidden max-h-52 sm:max-h-full ">
      {games.map((game, index) => (
        <div
          key={index}
          className="w-full h-full min-w-[18.5rem] transform transition-transform duration-300 hover:-translate-y-4"
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
