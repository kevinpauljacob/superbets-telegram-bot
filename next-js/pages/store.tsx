import { useEffect } from "react";
import { useGlobalContext } from "@/components/GlobalContext";
import StoreCard from "@/components/StoreCard";
import FOMOHead from "@/components/HeadElement";
import { getFOMOBalance } from "./stake";

export default function Store() {
  const {
    setFomoBalance,
    getGlobalInfo,
    getUserDetails,
  } = useGlobalContext();


  // useEffect(() => {
  //   if (session?.user && wallet && wallet.publicKey) {
  //     getFOMOBalance(wallet, setFomoBalance);
  //     getUserDetails();
  //   }
  //   getGlobalInfo();
  // }, [session?.user, wallet.publicKey]);

  const cardDetails = [
    { src: "image1.jpg", name: "Product 1", points: "500,000" },
    { src: "image2.jpg", name: "Product 2", points: "750,000" },
    { src: "image3.jpg", name: "Product 3", points: "1,000,000" },
  ];

  return <></>

  return (
    <>
      <FOMOHead title={"Store | SUPERBETS.GAMES - 0% House Edge, Pure Wins"} />
      <div className="text-white w-full flex flex-col items-start justify-start px-5 lg:px-16 pb-10 overflow-hidden min-h-screen">
        <span className="font-bold text-white text-opacity-90 font-chakra text-[1.75rem] mb-6">
          FOMO STORE
        </span>
        <div className="grid 2xl:grid-cols-5 xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-3 grid-cols-2 gap-4 xl:gap-4 w-full sm:w-[85%]">
          {cardDetails.map((card, index) => (
            <StoreCard
              key={index}
              src={card.src}
              name={card.name}
              points={card.points}
            />
          ))}
        </div>
      </div>
    </>
  );
}
