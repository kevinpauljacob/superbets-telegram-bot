import { seedStatus } from "@/utils/vrf";
import Image from "next/image";
import { useState } from "react";
import { IoIosArrowDown, IoMdCopy } from "react-icons/io";
import { Bet } from "./HistoryTable";
import RollDiceProvablyFairModal, { PFModalData } from "./ProvablyFairModal";
import { useGlobalContext } from "@/components/GlobalContext";
import DraggableBar from "./DraggableBar";
interface ModalData {
  bet: Bet;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modalData: ModalData;
}

export default function VerifyBetModal({ isOpen, onClose, modalData }: Props) {
  //handling dice
  const { bet } = modalData;
  const { getProvablyFairData } = useGlobalContext();

  //Provably Fair Modal handling
  const [isPFModalOpen, setIsPFModalOpen] = useState(false);
  const [choice, setChoice] = useState<number>(
    bet?.direction === "over" ? 100 - bet?.chance : bet?.chance,
  );

  const openPFModal = () => {
    setIsPFModalOpen(true);
  };

  const closePFModal = () => {
    setIsPFModalOpen(false);
  };

  const [PFModalData, setPFModalData] = useState<PFModalData>({
    activeGameSeed: {
      wallet: "",
      clientSeed: "",
      serverSeed: "",
      serverSeedHash: "",
      nonce: 0,
      status: "",
    },
    nextGameSeed: {
      wallet: "",
      clientSeed: "",
      serverSeed: "",
      serverSeedHash: "",
      nonce: 0,
      status: "",
    },
    tab: "seeds",
  });

  //to handle dropodown
  const [openDropDown, setOpenDropDown] = useState<boolean>(false);

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const copyToClipboard = (text?: string) => {
    if (text) navigator.clipboard.writeText(text);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-gray-800 opacity-75"
            onClick={handleClose}
          ></div>
          <div className="bg-[#121418] max-h-[100vh] modalscrollbar overflow-y-scroll p-8 rounded-lg z-10 w-11/12 sm:w-[600px]">
            <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-0">
              <div className="font-changa text-[1.75rem] font-semibold text-white mr-4">
                Dice
              </div>
              <div className="text-[#F0F0F0] text-md">{bet.createdAt}</div>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-3">
              <button className="px-4 py-1.5 sm:py-2 mb-2 sm:mb-0 w-full text-white rounded-md bg-[#D9D9D9] bg-opacity-5 grid">
                <div className="text-[#94A3B8] text-sm">Bet</div>
                <div className="text-white">{bet.amount.toFixed(4)} $SOL</div>
              </button>
              <button className="px-4 py-1.5 sm:py-2 mb-2 sm:mb-0 w-full text-white rounded-md bg-[#D9D9D9] bg-opacity-5 grid">
                <div className="text-[#94A3B8] text-sm">Multiplier</div>
                <div className="text-white">
                  {bet.direction === "over"
                    ? (98 / (100 - (100 - bet.chance))).toFixed(2)
                    : (98 / (100 - bet.chance)).toFixed(2)}{" "}
                  x
                </div>
              </button>
              <button className="px-4 py-1.5 sm:py-2 mb-2 sm:mb-0 w-full text-white rounded-md bg-[#D9D9D9] bg-opacity-5 grid">
                <div className="text-[#94A3B8] text-sm">Payout</div>
                <div className="text-white">
                  {bet.amountWon.toFixed(4)} $SOL
                </div>
              </button>
            </div>
            <div className="mt-8 px-8 pt-10 border-2 border-white border-opacity-5 rounded-md">
              <div className="relative w-full mb-8 xl:mb-6 pb-5 pt-10">
                <DraggableBar
                  choice={choice}
                  setChoice={setChoice}
                  strikeNumber={bet.strikeNumber}
                  result={bet.result === "Won" ? true : false}
                  rollType={bet.direction}
                  draggable={false}
                />
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="text-sm text-[#F0F0F0]">Multiplier</label>
                  <input
                    type="text"
                    name="multiplier"
                    value={
                      bet.direction === "over"
                        ? (98 / (100 - (100 - bet.chance))).toFixed(2)
                        : (98 / (100 - bet.chance)).toFixed(2)
                    }
                    className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm text-[#F0F0F0]">
                    {bet.direction === "over" ? "Roll Over" : "Roll Under"}
                  </label>
                  <input
                    type="text"
                    name="choice"
                    value={
                      bet.direction === "over" ? 100 - bet.chance : bet.chance
                    }
                    className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm text-[#F0F0F0]">Chance</label>
                  <input
                    type="text"
                    name="chance"
                    value={bet.chance}
                    className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative"
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="my-8 px-4 py-4 border-2 border-white border-opacity-5 rounded-md">
              <div className="flex items-center justify-between text-[#F0F0F0]">
                <div className="text-xl font-changa font-semibold">
                  Provably Fair
                </div>
                <div
                  className={`hover:cursor-pointer ${
                    openDropDown ? "rotate-180" : ""
                  }`}
                  onClick={() => setOpenDropDown(!openDropDown)}
                >
                  <IoIosArrowDown />
                </div>
              </div>
              {openDropDown && (
                <div className="">
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <div className="sm:w-1/2">
                      <label className="text-xs text-[#F0F0F0]">
                        Client Seed
                      </label>
                      <div className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative flex items-center justify-between">
                        <div className="truncate">
                          {bet.gameSeed?.clientSeed}
                        </div>
                        <div
                          onClick={() =>
                            copyToClipboard(bet.gameSeed?.clientSeed)
                          }
                          className="cursor-pointer"
                        >
                          <Image
                            src={"/assets/copy.png"}
                            width={20}
                            height={20}
                            alt="copy"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="sm:w-1/2">
                      <label className="text-xs text-[#F0F0F0]">Nonce</label>
                      <div className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative flex items-center justify-between">
                        <div>{bet.nonce}</div>
                        <div
                          onClick={() => copyToClipboard(bet.nonce?.toString())}
                          className="cursor-pointer"
                        >
                          <Image
                            src={"/assets/copy.png"}
                            width={20}
                            height={20}
                            alt="copy"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="w-full">
                      <label className="text-xs text-[#F0F0F0]">
                        Server Seed{" "}
                        {bet.gameSeed?.status !== seedStatus.EXPIRED
                          ? "(Hashed)"
                          : ""}
                      </label>
                      <div className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative flex items-center justify-between">
                        <div className="truncate mr-1">
                          {bet.gameSeed?.serverSeed ??
                            bet.gameSeed?.serverSeedHash}
                        </div>
                        <div
                          onClick={() =>
                            copyToClipboard(
                              bet.gameSeed?.serverSeed ??
                                bet.gameSeed?.serverSeedHash,
                            )
                          }
                          className="cursor-pointer"
                        >
                          <Image
                            src={"/assets/copy.png"}
                            width={20}
                            height={20}
                            alt="copy"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="footer grid gap-1">
                    {bet.gameSeed?.status !== seedStatus.EXPIRED ? (
                      <>
                        <div className="text-xs text-[#94A3B8] text-center mb-2">
                          To verify this bet, you first need to rotate your seed
                          pair.
                        </div>
                        <button
                          className="bg-[#7839C5] rounded-md w-full text-xl text-white text-semibold py-2"
                          onClick={async () => {
                            const fpData = await getProvablyFairData();
                            if (fpData)
                              setPFModalData({ ...fpData, tab: "seeds" });

                            openPFModal();
                          }}
                        >
                          Rotate
                        </button>
                      </>
                    ) : (
                      <button
                        className="bg-[#7839C5] rounded-md w-full text-xl text-white text-semibold py-2"
                        onClick={async () => {
                          const fpData = await getProvablyFairData();
                          if (fpData)
                            setPFModalData({ ...fpData, tab: "verify" });

                          openPFModal();
                        }}
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <RollDiceProvablyFairModal
            isOpen={isPFModalOpen}
            onClose={closePFModal}
            modalData={PFModalData}
            setModalData={setPFModalData}
            bet={bet}
          />
        </div>
      )}
    </>
  );
}
