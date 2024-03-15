import Image from "next/image";
import coin from "/public/assets/coin.svg";

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

  return (
    <div className="w-full text-white h-[70px] flex items-center justify-between border-y border-[#1E2220] pl-4 pr-8 bg-[#121418]">
      <div className="flex items-center">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-[#1E2220] flex items-center rounded-md mx-2.5 "
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
      <div className="flex items-center border-l border-[#1E2220] pl-4 ">
        <div className="mr-2">
          <Image src={coin} alt="" width={23} height={23} />
        </div>
        <span
          className="text-3xl font-semibold bg-gradient-to-r from-[#9945FF] to-[#6F26BB] text-transparent"
          style={{ WebkitBackgroundClip: "text", backgroundClip: "text" }}
        >
          2300
        </span>
      </div>
    </div>
  );
}
