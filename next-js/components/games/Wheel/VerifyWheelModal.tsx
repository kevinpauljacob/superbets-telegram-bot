import { seedStatus } from "@/utils/provably-fair";
import { useState, useEffect, useRef } from "react";
import { IoIosArrowDown } from "react-icons/io";
import Image from "next/image";
import WheelProvablyFairModal from "./WheelProvablyFairModal";
import { useGlobalContext } from "@/components/GlobalContext";
import { FaRegCopy } from "react-icons/fa6";
import Arc from "@/components/games/Wheel/Arc";
import { MdClose } from "react-icons/md";
import { translator, truncateNumber } from "@/context/transactions";
import Loader from "../Loader";
import {
  AdaptiveModal,
  AdaptiveModalContent,
} from "@/components/AdaptiveModal";
import { SPL_TOKENS } from "@/context/config";
import { PFModalData } from "../CoinFlip/CoinFlipProvablyFairModal";

export interface Wheel {
  createdAt: string;
  account: string;
  amount: number;
  risk: string;
  segments: number;
  result: string;
  strikeNumber: number;
  strikeMultiplier: number;
  minesCount?: number;
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
  bet: Wheel;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modalData: ModalData;
  account?: string;
}

export default function VerifyWheelModal({
  isOpen,
  onClose,
  modalData,
  account,
}: Props) {
  //handling dice
  const { bet } = modalData;
  const { getProvablyFairData, language } = useGlobalContext();
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotationAngle, setRotationAngle] = useState(0);

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
      account: "",
      clientSeed: "",
      serverSeed: "",
      serverSeedHash: "",
      nonce: 0,
      status: "",
    },
    nextGameSeed: {
      account: "",
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

  const Capitalize = (str: string) => {
    return str?.charAt(0).toUpperCase() + str?.slice(1);
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

  useEffect(() => {
    if (!wheelRef.current) return;
    const rotationAngle = 360 / bet.segments;
    setRotationAngle(rotationAngle);
  }, [bet.segments]);

  useEffect(() => {
    const resultAngle = ((bet.strikeNumber - 1) * 360) / 99;
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${360 - resultAngle}deg)`;
    }
  }, [isOpen]);
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
            <div className="flex flex-1 px-8 sm:p-0 justify-center overflow-y-auto">
              <div className="flex flex-col w-full">
                <div className="mx-auto h-1 w-10 rounded-full -translate-y-3 bg-gray-400 sm:hidden" />
                <div className="flex flex-wrap sm:flex-col justify-between items-center sm:items-start mb-4 sm:mb-[1.4rem]">
                  <div className="font-changa text-2xl font-semibold text-white mr-4 text-opacity-90">
                    {translator("Wheel", language)}
                  </div>
                  <div className="text-[#F0F0F0] text-opacity-75 font-changa text-sm">
                    {formatDate(bet.createdAt)}
                  </div>
                </div>
                <div className="flex flex-row gap-3">
                  <button className="px-1 py-3 flex flex-col items-center justify-center w-full text-white rounded-md bg-[#202329]">
                    <div className="font-changa text-xs text-[#94A3B8] text-opacity-75">
                      {translator("Bet", language)}
                    </div>
                    <div className="text-white font-chakra text-xs font-medium">
                      {truncateNumber(bet.amount, 4)} $
                      {SPL_TOKENS.find(
                        (token) => token.tokenMint === bet.tokenMint,
                      )?.tokenName ?? ""}
                    </div>
                  </button>
                  <button className="px-1 py-3 flex flex-col items-center justify-center w-full text-white rounded-md bg-[#202329]">
                    <div className="font-changa text-xs text-[#94A3B8] text-opacity-75">
                      {translator("Multiplier", language)}
                    </div>
                    {bet.strikeMultiplier}
                  </button>
                  <button className="px-1 py-3 flex flex-col items-center justify-center w-full text-white rounded-md bg-[#202329]">
                    <div className="font-changa text-xs text-[#94A3B8] text-opacity-75">
                      {translator("Payout", language)}
                    </div>
                    <div className="text-white font-chakra text-xs font-medium">
                      {truncateNumber(bet.amountWon, 4)} $
                      {SPL_TOKENS.find(
                        (token) => token.tokenMint === bet.tokenMint,
                      )?.tokenName ?? ""}
                    </div>
                  </button>
                </div>
                <div className="mt-6 px-4 md:px-12 pt-7 border-2 border-white border-opacity-5 rounded-md">
                  <div className="relative w-full">
                    <div className="flex justify-center items-center w-full">
                      <div className="relative w-[200px] h-[200px] flex justify-center">
                        <Image
                          src="/assets/wheelPointer.svg"
                          alt="Pointer"
                          width={25}
                          height={25}
                          id="pointer"
                          className="absolute z-50 -top-2 transition-all duration-100"
                        />
                        <div
                          ref={wheelRef}
                          className="relative w-[200px] h-[200px] rounded-full overflow-hidden"
                        >
                          {typeof window !== "undefined" && (
                            <svg viewBox="0 0 300 300">
                              {rotationAngle &&
                                Array.from({ length: bet.segments }).map(
                                  (_, index) => (
                                    <Arc
                                      key={index}
                                      index={index}
                                      rotationAngle={rotationAngle}
                                      risk={bet.risk}
                                      segments={bet.segments}
                                    />
                                  ),
                                )}
                            </svg>
                          )}
                        </div>
                        <div className="absolute z-10 w-[79.75%] h-[79.75%] rounded-full bg-black/10 left-[10%] top-[10%]" />
                        <div className="absolute z-20 w-[66.5%] h-[66.5%] rounded-full bg-[#171A1F] left-[16.75%] top-[16.75%]" />
                        <div className="absolute z-20 w-[62.5%] h-[62.5%] rounded-full bg-[#0C0F16] left-[18.75%] top-[18.75%] text-white flex items-center justify-center text-2xl font-semibold font-changa text-opacity-80 ">
                          {bet.strikeMultiplier}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2 mb-8">
                    <div className="w-full">
                      <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                        {translator("Risk", language)}
                      </label>
                      <input
                        type="text"
                        name="risk"
                        value={translator(Capitalize(bet.risk), language)}
                        className="bg-[#202329] text-white capitalize font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative"
                        readOnly
                      />
                    </div>
                    <div className="w-full">
                      <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                        {translator("Segments", language)}
                      </label>
                      <input
                        type="text"
                        name="chance"
                        value={bet.segments}
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
                            {translator("Nonce", language)}
                          </label>
                          <div className="bg-[#202329] mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between">
                            <span className="truncate text-[#B9B9BA] text-xs font-semibold">
                              {bet.nonce}
                            </span>
                            <FaRegCopy
                              onClick={() =>
                                copyToClipboard(bet.nonce?.toString())
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
                            {bet.gameSeed?.status !== seedStatus.EXPIRED
                              ? translator("(Hashed)", language)
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
                        {bet?.account !== account ? (
                          <>
                            <div className="text-xs text-[#94A3B8] font-changa text-opacity-75 text-center">
                              {translator(
                                "The bettor must first rotate their seed pair to verify this bet.",
                                language,
                              )}
                            </div>
                            <button
                              className="bg-[#5F4DFF] rounded-md w-full text-sm text-white text-opacity-90 text-semibold py-3 disabled:opacity-70"
                              disabled
                            >
                              {translator("Rotate", language)}
                            </button>
                          </>
                        ) : bet.gameSeed?.status !== seedStatus.EXPIRED ? (
                          <>
                            <div className="text-xs text-[#94A3B8] font-changa text-opacity-75 text-center">
                              {translator(
                                "To verify this bet, you first need to rotate your seed pair.",
                                language,
                              )}
                            </div>
                            <button
                              className="bg-[#5F4DFF] rounded-md w-full text-sm text-white text-opacity-90 text-semibold py-3"
                              onClick={handleSeedClick}
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
                            className="bg-[#5F4DFF] rounded-md w-full text-sm text-white text-opacity-90 text-semibold py-3"
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
            <WheelProvablyFairModal
              isOpen={isPFModalOpen}
              onClose={closePFModal}
              modalData={PFModalData}
              setModalData={setPFModalData}
              bet={bet}
            />
          </AdaptiveModalContent>
        </AdaptiveModal>
      )}
    </>
  );
}
