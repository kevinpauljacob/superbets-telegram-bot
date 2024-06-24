import { seedStatus } from "@/utils/provably-fair";
import { useState } from "react";
import { IoIosArrowDown, IoMdCopy } from "react-icons/io";
import CoinFlipProvablyFairModal, {
  PFModalData,
} from "./CoinFlipProvablyFairModal";
import { useGlobalContext } from "@/components/GlobalContext";
import { FaRegCopy } from "react-icons/fa6";
import { MdClose } from "react-icons/md";
import { translator } from "@/context/transactions";
import Loader from "../Loader";
import {
  AdaptiveModal,
  AdaptiveModalContent,
} from "@/components/AdaptiveModal";
import { SPL_TOKENS } from "@/context/config";

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
  tokenMint: string;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
  const handleSeedClick = async () => {
    setIsLoading(true);
    try {
      const fpData = await getProvablyFairData();
      if (fpData) setPFModalData({ ...fpData, tab: "seeds" });
      openPFModal();
    } catch (error) {
      console.error("Error fetching provably fair data", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleVerifyClick = async () => {
    setIsLoading(true);
    try {
      const fpData = await getProvablyFairData();
      if (fpData) setPFModalData({ ...fpData, tab: "verify" });
      openPFModal();
    } catch (error) {
      console.error("Error fetching provably fair data", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <AdaptiveModal open={isOpen} onOpenChange={() => onClose()}>
          <AdaptiveModalContent className="bg-[#121418] sm:overflow-y-auto min-h-[50dvh] max-h-[80dvh] w-full pb-6">
            <div className="flex flex-1 px-6 sm:p-0 justify-center overflow-y-auto">
              <div className="flex flex-col w-full">
                <div className="flex flex-wrap sm:flex-col justify-between items-center sm:items-start mb-4 sm:mb-[1.4rem]">
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
                      {flip.amount.toFixed(4)} $
                      {SPL_TOKENS.find(
                        (token) => token.tokenMint === flip.tokenMint,
                      )?.tokenName ?? ""}
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
                      {flip.amountWon.toFixed(4)} $
                      {SPL_TOKENS.find(
                        (token) => token.tokenMint === flip.tokenMint,
                      )?.tokenName ?? ""}
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
                        className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative focus:ring-0 focus:outline-none"
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
                        className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative focus:ring-0 focus:outline-none"
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
                              ? translator(
                                  translator("(Hashed)", language),
                                  language,
                                )
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
                              onClick={handleSeedClick}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader />
                              ) : (
                                translator("Rotate", language)
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            className="bg-[#7839C5] rounded-md w-full text-sm text-white text-opacity-90 text-semibold py-3"
                            onClick={handleVerifyClick}
                          >
                            {isLoading ? (
                              <Loader />
                            ) : (
                              translator("Verify", language)
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <CoinFlipProvablyFairModal
              isOpen={isPFModalOpen}
              onClose={closePFModal}
              modalData={PFModalData}
              setModalData={setPFModalData}
              flip={flip}
            />
          </AdaptiveModalContent>
        </AdaptiveModal>
      )}
    </>
  );
}
