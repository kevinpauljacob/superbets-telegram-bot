import { seedStatus } from "@/utils/provably-fair";
import { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import KenoProvablyFairModal, { PFModalData } from "./KenoProvablyFairModal";
import { useGlobalContext } from "@/components/GlobalContext";
import { FaRegCopy } from "react-icons/fa6";
import { MdClose } from "react-icons/md";

export interface Keno {
  createdAt: string;
  wallet: string;
  amount: number;
  result: string;
  risk: string;
  strikeNumbers: number[];
  chosenNumbers: number[];
  strikeMultiplier: number;
  amountWon: number;
  nonce?: number;
  gameSeed?: {
    status: seedStatus;
    clientSeed: string;
    nonce: number;
    serverSeed?: string;
    serverSeedHash: string;
  };
}

interface ModalData {
  bet: Keno;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modalData: ModalData;
}

export default function VerifyDice2Modal({
  isOpen,
  onClose,
  modalData,
}: Props) {
  //handling dice
  const { bet } = modalData;
  const { getProvablyFairData } = useGlobalContext();

  //Provably Fair Modal handling
  const [isPFModalOpen, setIsPFModalOpen] = useState(false);

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

  // const handleClose = () => {
  //   //@ts-ignore
  //   document.addEventListener("click", function (event) {
  //     //@ts-ignore
  //     var targetId = event.target.id;
  //     if (targetId && targetId === "modal-bg") onClose();
  //   });
  // };

  const copyToClipboard = (text?: string) => {
    if (text) navigator.clipboard.writeText(text);
  };

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const day = date.getUTCDate().toString().padStart(2, "0");
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = (date.getUTCFullYear() + "").slice(2);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes} UTC`;
  }

  return (
    <>
      {isOpen && (
        <div
          // onClick={() => {
          //   handleClose();
          // }}
          // id="modal-bg"
          className="absolute z-[150] left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 backdrop-blur transition-all"
        >
          <div className="relative bg-[#121418] max-h-[80dvh] modalscrollbar overflow-y-scroll p-8 rounded-lg z-10 w-11/12 sm:w-[34rem]">
            <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-5">
              <div className="font-changa text-2xl font-semibold text-white mr-4 text-opacity-90">
                Keno
              </div>
              <div className="text-[#F0F0F0] text-opacity-75 font-changa text-sm">
                {formatDate(bet.createdAt)}
              </div>
            </div>
            <div className="flex flex-row gap-3">
              <button className="px-1 py-3 flex flex-col items-center justify-center w-full text-white rounded-md bg-[#202329]">
                <div className="font-changa text-xs text-[#94A3B8] text-opacity-75">
                  Bet
                </div>
                <div className="text-white font-chakra text-xs font-medium">
                  {bet.amount.toFixed(4)} $SOL
                </div>
              </button>
              <button className="px-1 py-3 flex flex-col items-center justify-center w-full text-white rounded-md bg-[#202329]">
                <div className="font-changa text-xs text-[#94A3B8] text-opacity-75">
                  Multiplier
                </div>
                <div className="text-white font-chakra text-xs font-medium">
                  {bet.strikeMultiplier?.toFixed(1)} x
                </div>
              </button>
              <button className="px-1 py-3 flex flex-col items-center justify-center w-full text-white rounded-md bg-[#202329]">
                <div className="font-changa text-xs text-[#94A3B8] text-opacity-75">
                  Payout
                </div>
                <div className="text-white font-chakra text-xs font-medium">
                  {bet.amountWon?.toFixed(4)} $SOL
                </div>
              </button>
            </div>
            <div className="mt-6 px-4 md:px-12 pt-7 border-2 border-white border-opacity-5 rounded-md">
              <div className="relative w-full">
                <div className="grid grid-cols-8 gap-2 text-white text-xl font-chakra">
                  {Array.from({ length: 40 }, (_, index) => index + 1).map(
                    (number) => (
                      <div
                        key={number}
                        className={`flex items-center justify-center cursor-pointer ${
                          bet.strikeNumbers?.length === 0 &&
                          bet.chosenNumbers?.includes(number)
                            ? "bg-[#7839C5]"
                            : bet.strikeNumbers?.includes(number) &&
                              bet.chosenNumbers?.includes(number)
                            ? "bg-black border-2 border-fomo-green"
                            : bet.chosenNumbers?.includes(number)
                            ? "bg-black border-2 border-fomo-red text-fomo-red"
                            : "bg-[#202329]"
                        } rounded-md text-center transition-all duration-300 ease-in-out w-[45px] h-[45px]`}
                      >
                        {bet.strikeNumbers?.includes(number) &&
                        bet.chosenNumbers?.includes(number) ? (
                          <div className="flex justify-center items-center bg-[#FFD100] text-black rounded-full w-[32px] h-[32px]">
                            {number}
                          </div>
                        ) : (
                          <div>{number}</div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-7 mb-8">
                <div className="w-full">
                  <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                    Risk
                  </label>
                  <input
                    type="text"
                    name="multiplier"
                    value={bet.risk}
                    className="bg-[#202329] text-white font-chakra capitalize text-xs font-medium mt-1 rounded-md p-3 w-full relative"
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 px-4 py-4 border-2 border-white border-opacity-5 rounded-md transition-all">
              <div className="flex items-center justify-between text-[#F0F0F0]">
                <div className="text-base font-changa font-medium text-[#F0F0F0] text-opacity-90">
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
                <div className="fadeInDown">
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:mb-4 mt-4">
                    <div className="sm:w-1/2">
                      <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                        Client Seed
                      </label>
                      <div className="bg-[#202329] mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between">
                        <span className="truncate text-[#B9B9BA] text-xs font-semibold">
                          {bet.gameSeed?.clientSeed}
                        </span>
                        <FaRegCopy
                          onClick={() =>
                            copyToClipboard(bet.gameSeed?.clientSeed)
                          }
                          className="w-5 h-5 text-[#555555] cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="sm:w-1/2">
                      <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                        Nonce
                      </label>
                      <div className="bg-[#202329] mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between">
                        <span className="truncate text-[#B9B9BA] text-xs font-semibold">
                          {bet.nonce}
                        </span>
                        <FaRegCopy
                          onClick={() => copyToClipboard(bet.nonce?.toString())}
                          className="w-5 h-5 text-[#555555] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="w-full">
                      <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                        Server Seed{" "}
                        {bet.gameSeed?.status !== seedStatus.EXPIRED
                          ? "(Hashed)"
                          : ""}
                      </label>
                      <div className="bg-[#202329] mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between">
                        <span className="truncate text-[#B9B9BA] text-xs font-semibold">
                          {bet.gameSeed?.serverSeed ??
                            bet.gameSeed?.serverSeedHash}
                        </span>
                        <FaRegCopy
                          onClick={() =>
                            copyToClipboard(
                              bet.gameSeed?.serverSeedHash ??
                                bet.gameSeed?.serverSeedHash,
                            )
                          }
                          className="w-5 h-5 text-[#555555] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="footer grid gap-1 mt-10">
                    {bet.gameSeed?.status !== seedStatus.EXPIRED ? (
                      <>
                        <div className="text-xs text-[#94A3B8] font-changa text-opacity-75 text-center">
                          To verify this bet, you first need to rotate your seed
                          pair.
                        </div>
                        <button
                          className="bg-[#7839C5] rounded-md w-full text-sm text-white text-opacity-90 text-semibold py-3"
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
                        className="bg-[#7839C5] rounded-md w-full text-sm text-white text-opacity-90 text-semibold py-3"
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
            <MdClose
              onClick={() => {
                onClose();
              }}
              size={22}
              className="absolute top-3 right-3 hover:cursor-pointer"
              color="#F0F0F0"
            />
          </div>
          <KenoProvablyFairModal
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
