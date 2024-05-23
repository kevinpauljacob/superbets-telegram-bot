import { GameType, seedStatus } from "@/utils/provably-fair";
import Image from "next/image";
import { useState } from "react";
import { IoIosArrowDown, IoMdCopy } from "react-icons/io";
import CoinFlipProvablyFairModal, {
  PFModalData,
} from "./CoinFlipProvablyFairModal";
import { useGlobalContext } from "@/components/GlobalContext";
import { FaRegCopy } from "react-icons/fa6";
import { MdClose } from "react-icons/md";
import { translator } from "@/context/transactions";

export interface Flip {
  flipType: "heads" | "tails";
  createdAt: string;
  wallet: string;
  amount: number;
  result: "Won" | "Lost";
  risk?: string;
  segments?: number;
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
  flip: Flip;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modalData: ModalData;
  wallet?: string;
}

export default function VerifyFlipModal({
  isOpen,
  onClose,
  modalData,
  wallet,
}: Props) {
  const { flip } = modalData;
  const { getProvablyFairData, language } = useGlobalContext();

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

  const handleClose = () => {
    //@ts-ignore
    document.addEventListener("click", function (event) {
      //@ts-ignore
      var targetId = event.target.id;
      if (targetId && targetId === "modal-bg") onClose();
    });
  };

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
          onClick={() => {
            handleClose();
          }}
          id="modal-bg"
          className="absolute z-[150] left-0 top-0 flex h-full w-full items-center justify-center bg-[#33314680] backdrop-blur-[0px] transition-all"
        >
          <div className="relative bg-[#121418] max-h-[80dvh]  overflow-y-scroll p-8 rounded-lg z-10 w-11/12 sm:w-[34rem] -mt-[4.7rem] md:mt-0 nobar">
            <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-[1.4rem]">
              <div className="font-changa text-2xl font-semibold text-white mr-4 text-opacity-90">
                {translator("Coin Flip", language)}
              </div>
              <div className="text-[#F0F0F0] text-opacity-75 font-changa text-sm">
                {formatDate(flip.createdAt)}
              </div>
            </div>
            <div className="flex flex-row gap-3">
              <button className="px-1 py-3 flex flex-col items-center justify-center w-full text-white rounded-md bg-[#202329]">
                <div className="font-changa text-xs text-[#94A3B8] text-opacity-75">
                  Flip
                </div>
                <div className="text-white font-chakra text-xs font-medium">
                  {flip.amount.toFixed(4)} $SOL
                </div>
              </button>
              <button className="px-1 py-3 flex flex-col items-center justify-center w-full text-white rounded-md bg-[#202329]">
                <div className="font-changa text-xs text-[#94A3B8] text-opacity-75">
                  {translator("Multiplier", language)}
                </div>
                <div className="text-white font-chakra text-xs font-medium">
                  {(2 / 1).toFixed(2)} x
                </div>
              </button>
              <button className="px-1 py-3 flex flex-col items-center justify-center w-full text-white rounded-md bg-[#202329]">
                <div className="font-changa text-xs text-[#94A3B8] text-opacity-75">
                  {translator("Payout", language)}
                </div>
                <div className="text-white font-chakra text-xs font-medium">
                  {flip.amountWon.toFixed(4)} $SOL
                </div>
              </button>
            </div>
            <div className="mt-6 px-4 md:px-12 pt-7 border-2 border-white border-opacity-5 rounded-md">
              <div className="grid place-items-center">
                {flip.flipType === "heads" ? (
                  <div
                    className={`w-[4.5rem] h-[4.5rem] bg-[#FFC20E] rounded-full`}
                  >
                    {/* <span className="text-white text-2xl text-bold font-changa my-auto mx-auto">
                      HEADS
                    </span> */}
                  </div>
                ) : (
                  <div
                    className={`w-[4.5rem] h-[4.5rem] bg-[#C0C9D2] rounded-full`}
                  >
                    {/* <span className="text-black text-2xl text-bold font-changa my-auto mx-auto">
                      TAILS
                    </span> */}
                  </div>
                )}
              </div>
              <div className="flex gap-4 pt-7 mb-8">
                <div className="w-full">
                  <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                    {translator("Multiplier", language)}
                  </label>
                  <input
                    type="text"
                    name="multiplier"
                    value={(2 / 1).toFixed(2)}
                    className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative"
                    readOnly
                  />
                </div>
                <div className="w-full">
                  <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                    {translator("Chance", language)}
                  </label>
                  <input
                    type="text"
                    name="chance"
                    value={((1 / 2) * 100).toFixed(2)}
                    className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative"
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 px-4 py-4 border-2 border-white border-opacity-5 rounded-md transition-all">
              <div className="flex items-center justify-between text-[#F0F0F0]">
                <div className="text-base font-changa font-medium text-[#F0F0F0] text-opacity-90">
                  {translator("Provably Fair", language)}
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
                        {translator("Client Seed", language)}
                      </label>
                      <div className="bg-[#202329] mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between">
                        <span className="truncate text-[#B9B9BA] text-xs font-semibold">
                          {flip.gameSeed?.clientSeed}
                        </span>
                        <FaRegCopy
                          onClick={() =>
                            copyToClipboard(flip.gameSeed?.clientSeed)
                          }
                          className="w-5 h-5 text-[#555555] cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="sm:w-1/2">
                      <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                        {translator("Nonce", language)}
                      </label>
                      <div className="bg-[#202329] mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between">
                        <span className="truncate text-[#B9B9BA] text-xs font-semibold">
                          {flip.nonce}
                        </span>
                        <FaRegCopy
                          onClick={() =>
                            copyToClipboard(flip.nonce?.toString())
                          }
                          className="w-5 h-5 text-[#555555] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="w-full">
                      <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                        {translator("Server Seed", language)}{" "}
                        {flip.gameSeed?.status !== seedStatus.EXPIRED
                          ? "(Hashed)"
                          : ""}
                      </label>
                      <div className="bg-[#202329] mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between">
                        <span className="truncate text-[#B9B9BA] text-xs font-semibold">
                          {flip.gameSeed?.serverSeed ??
                            flip.gameSeed?.serverSeedHash}
                        </span>
                        <FaRegCopy
                          onClick={() =>
                            copyToClipboard(
                              flip.gameSeed?.serverSeedHash ??
                                flip.gameSeed?.serverSeedHash,
                            )
                          }
                          className="w-5 h-5 text-[#555555] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="footer grid gap-1 mt-10">
                    {flip.wallet !== wallet ? (
                      <>
                        <div className="text-xs text-[#94A3B8] font-changa text-opacity-75 text-center">
                          {translator(
                            "The bettor must first rotate their seed pair to verify this bet.",
                            language,
                          )}
                        </div>
                        <button
                          className="bg-[#7839C5] rounded-md w-full text-sm text-white text-opacity-90 text-semibold py-3 disabled:opacity-70"
                          disabled
                        >
                          {translator("Rotate", language)}
                        </button>
                      </>
                    ) : flip.gameSeed?.status !== seedStatus.EXPIRED ? (
                      <>
                        <div className="text-xs text-[#94A3B8] font-changa text-opacity-75 text-center">
                          {translator(
                            "To verify this flip, you first need to rotate your seed pair.",
                            language,
                          )}
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
                          {translator("Rotate", language)}
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
                        {translator("Verify", language)}
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
              className="absolute top-3 right-3 hover:cursor-pointer hover:bg-[#26282c] transition-all rounded-full p-[2px]"
              color="#F0F0F0"
            />
          </div>
          <CoinFlipProvablyFairModal
            isOpen={isPFModalOpen}
            onClose={closePFModal}
            modalData={PFModalData}
            setModalData={setPFModalData}
            flip={flip}
          />
        </div>
      )}
    </>
  );
}
