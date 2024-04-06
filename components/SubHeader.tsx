import Image from "next/image";
import coin from "/public/assets/coin.svg";
import { useGlobalContext } from "./GlobalContext";
import { useRouter } from "next/router";
import Link from "next/link";

export default function SubHeader() {
  const cards = [
    {
      cardSrc: "/assets/cardImg.png",
      userSrc: "/assets/userImg.png",
      address: "xvdg..fhfh",
      price: "2.54",
    },
    {
      cardSrc: "/assets/cardImg.png",
      userSrc: "/assets/userImg.png",
      address: "xvdg..fhfh",
      price: "2.54",
    },
    {
      cardSrc: "/assets/cardImg.png",
      userSrc: "/assets/userImg.png",
      address: "xvdg..fhfh",
      price: "2.54",
    },
    {
      cardSrc: "/assets/cardImg.png",
      userSrc: "/assets/userImg.png",
      address: "xvdg..fhfh",
      price: "2.54",
    },
    {
      cardSrc: "/assets/cardImg.png",
      userSrc: "/assets/userImg.png",
      address: "xvdg..fhfh",
      price: "2.54",
    },
  ];

  const { coinData } = useGlobalContext();

  return (
    <div className="flex flex-col w-full">
      <div className="w-full text-white h-[70px] flex items-center border-y border-[#1E2220] px-4 lg:pl-4 lg:pr-4 bg-[#121418]">
        <div className="flex w-full items-center overflow-x-auto">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-[#1E2220] flex items-center rounded-md mx-2.5 min-w-[150px]"
            >
              <Image src={card.cardSrc} alt="" width={52} height={52} />
              <div className="pl-2 pr-4 py-1">
                <div className="flex items-center">
                  <Image src={card.userSrc} alt="" width={23} height={23} />
                  <span className="text-sm">{card.address}</span>
                </div>
                <p className="text-[#72F238]">+${card.price}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:flex items-center border-l border-[#1E2220] pl-4 md:min-w-fit">
          {/* <div className="mr-2">
          <Image src={coin} alt="" width={23} height={23} />
        </div>
        <span
          className="text-3xl font-semibold bg-gradient-to-r from-[#9945FF] to-[#6F26BB] text-transparent"
          style={{ WebkitBackgroundClip: "text", backgroundClip: "text" }}
        >
          2300
        </span> */}
          <div className="flex items-center gap-2">
            <div className="flex items-center px-4 py-1 gap-2 border-2 border-white border-opacity-5 rounded-[5px]">
              <Image src={"/assets/sol.png"} alt="" width={20} height={17} />
              <span className="font-changa text-2xl">
                {(coinData ? coinData[0].amount : 0).toFixed(4)}
              </span>
            </div>
            <Link
              href={"/balance"}
              className="flex items-center px-4 py-2 gap-2 bg-[#9945FF] cursor-pointer rounded-[5px]"
            >
              <Image src={"/assets/wallet.png"} alt="" width={20} height={20} />
              <span className="text-sm font-semibold text-white text-opacity-90">
                Wallet
              </span>
            </Link>
          </div>
        </div>
      </div>
      <div className="flex md:hidden items-center justify-between my-4 mx-2 rounded-[5px] bg-[#121418] border-l border-[#1E2220] p-2 md:min-w-fit">
        <Image src={"/assets/wallet2.png"} alt="" width={30} height={30} />
        <div className="flex items-center gap-2">
          <div className="flex items-center px-2 py-0.5 gap-2 border-2 border-white border-opacity-5 rounded-[5px]">
            <Image src={"/assets/sol.png"} alt="" width={13} height={11} />
            <span className="font-changa text-base text-[#94A3B8]">
              {(coinData ? coinData[0].amount : 0).toFixed(4)}
            </span>
          </div>
          <Link
            href={"/balance"}
            className="flex items-center px-2 py-1.5 gap-2 bg-[#9945FF] cursor-pointer rounded-[5px]"
          >
            <Image src={"/assets/wallet.png"} alt="" width={13} height={11} />
            <span className="text-xs text-white text-opacity-90">Wallet</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
