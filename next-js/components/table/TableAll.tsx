import BetRow from "../games/BetRow";
import Image from "next/image";
import { useGlobalContext } from "../GlobalContext";
import { translator } from "@/context/transactions";
import Dollar from "@/public/assets/dollar.png";

interface TableAllProps {
  bets: any[];
}

export const TableHeader = () => {
  const allHeaders = ["Wallet", "Game", "Bet Amount", "Multiplier", "Payout"];
  const smallScreenHeaders = ["Game", "Payout"];

  const { language } = useGlobalContext();
  return (
    <>
      <div className="mb-4 hidden md:flex w-full flex-row items-center gap-2 bg-[#121418] py-1 rounded-[5px]">
        {allHeaders.map((header, index) => (
          <span
            key={index}
            className="w-full text-center font-changa text-[#F0F0F080]"
          >
            {translator(header, language)}
          </span>
        ))}
      </div>
      <div className="mb-4 flex md:hidden w-full flex-row items-center bg-[#121418] rounded-md py-1 gap-2">
        {smallScreenHeaders.map((header, index) => (
          <span
            key={index}
            className="w-full text-center font-changa text-[#F0F0F080]"
          >
            {header}
          </span>
        ))}
      </div>
    </>
  );
};

export const TableAll: React.FC<TableAllProps> = ({ bets }) => {
  const {
    isVerifyModalOpen: isOpen,
    setIsVerifyModalOpen: setIsOpen,
    openVerifyModal: openModal,
    closeVerifyModal: closeModal,
    setVerifyModalData,
    language,
  } = useGlobalContext();

  return (
    <div className="mt-5">
      <div className="flex items-center mb-5">
        <Image src={Dollar} alt="" width={26} height={26} />
        <span className="font-medium font-changa text-xl text-opacity-90 pl-3">
          <span className="hidden sm:inline">
            {translator("Bets", language)}
          </span>
          <span className="sm:hidden">{translator("Bets", language)}</span>
        </span>
      </div>
      <div className="flex w-full flex-col max-h-[540px] mt-2">
        <TableHeader />
        {bets.length ? (
          <div className="scrollbar w-full overflow-y-scroll nobar">
            <div className="flex w-full md:min-w-[50rem] flex-col items-center">
              {bets.map((bet, index) => (
                <div
                  key={index}
                  className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] hover:bg-[#1f2024] py-3"
                >
                  <BetRow
                    bet={bet}
                    all={true}
                    openModal={openModal}
                    setVerifyModalData={setVerifyModalData}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <span className="font-changa text-[#F0F0F080]">
            {translator("No Bets made.", language)}
          </span>
        )}
      </div>
      {/* Blur container at the end of the table */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 backdrop-filter backdrop-blur-[12px] pointer-events-none"
        style={{ zIndex: 1 }}
      ></div>
    </div>
  );
};
