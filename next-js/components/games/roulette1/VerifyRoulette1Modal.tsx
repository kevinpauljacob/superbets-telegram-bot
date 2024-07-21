import { seedStatus } from "@/utils/provably-fair";
import { useState, useEffect, useRef } from "react";
import { IoIosArrowDown } from "react-icons/io";
import Image from "next/image";
import WheelProvablyFairModal, {
  PFModalData,
} from "../Wheel/WheelProvablyFairModal";
import { useGlobalContext } from "@/components/GlobalContext";
import { FaRegCopy } from "react-icons/fa6";
import Arc from "@/components/games/Wheel/Arc";
import { MdClose } from "react-icons/md";
import { translator, truncateNumber } from "@/context/transactions";
import Loader from "../Loader";
import { SPL_TOKENS } from "@/context/config";
import Roulette1ProvablyFairModal from "./Roulette1ProvablyFairModal";

export interface Roulette1 {
  createdAt: string;
  wallet: string;
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
  bet: Roulette1;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modalData: ModalData;
  wallet?: string;
}

export default function VerifyRoulette1Modal({
  isOpen,
  onClose,
  modalData,
  wallet,
}: Props) {
  //handling dice
  const { bet } = modalData;
  console.log(modalData);
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
  const rows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ];

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

  type PredefinedBetType =
    | "1-12"
    | "13-24"
    | "25-36"
    | "1-18"
    | "19-36"
    | "even"
    | "odd"
    | "red"
    | "black"
    | "1st-column"
    | "2nd-column"
    | "3rd-column";
  const predefinedBets: Record<PredefinedBetType, number[]> = {
    "1-12": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "13-24": [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    "25-36": [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    "1-18": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    "19-36": [
      19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
    ],
    even: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
    odd: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
    red: [
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 28, 30, 32, 34, 36,
    ],
    black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 29, 31, 33, 35],
    "1st-column": [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    "2nd-column": [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    "3rd-column": [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  };
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
          <div className="relative bg-[#121418] max-h-[80vh] no-scrollbar overflow-y-scroll p-8 rounded-lg z-10 w-11/12 sm:w-[34rem]">
            <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-[1.4rem]">
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
                  {SPL_TOKENS.find((token) => token.tokenMint === bet.tokenMint)
                    ?.tokenName ?? ""}
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
                  {SPL_TOKENS.find((token) => token.tokenMint === bet.tokenMint)
                    ?.tokenName ?? ""}
                </div>
              </button>
            </div>
            <div className="mt-6 px-4  pt-7 border-2 border-white border-opacity-5 rounded-md  w-full h-[480px] flex items-center ">
              <div className="font-chakra font-semibold text-base rotate-90  sm:top-0 mb-7 mx-2">
                <div className="flex flex-col w-full text-[12px] items-start gap-1 ">
                  <div className="w-full flex items-start gap-1">
                    <div
                      className={`h-[125px] w-[27.3px] sm:w-[30.6px] sm:h-[207px] flex flex-col justify-center text-center cursor-pointer bg-[#149200] rounded-[5px]
            text-white relative  ${bet.strikeNumber === 0 ? "border-[#3DD179]" : ""}
            mb-1`}
                    >
                      <p className="-rotate-90">0</p>
                    </div>
                    <div className="grid grid-cols-12 grid-rows-3 gap-1">
                      {rows.map((row, rowIndex) => (
                        <>
                          {row.map((number, colIndex) => {
                            return (
                              <div
                                key={colIndex}
                                className="relative flex justify-center items-center"
                              >
                                <button
                                  data-testid={`roulette-tile-${number}`}
                                  className={`h-[40px] w-[27.3px] sm:w-[35px] sm:h-[67px] flex items-center justify-center relative text-center ${
                                    predefinedBets.red.includes(number)
                                      ? "bg-[#F1323E]  "
                                      : "bg-[#2A2E38]  "
                                  }${bet.strikeNumber === number ? "border-[#3DD179] border-2" : ""} text-white rounded-[5px]  `}
                                >
                                  <p className="-rotate-90">{number}</p>
                                </button>
                              </div>
                            );
                          })}
                        </>
                      ))}
                    </div>
                    <div className="flex flex-col justify-between items-center gap-[5px] mt-0">
                      {rows.map((_, rowIndex) => (
                        <div
                          key={`row-${rowIndex}`}
                          className="h-[40px] w-[27px] sm:w-[30px] sm:h-[67px] flex items-center justify-center text-center bg-transparent border-2 border-[#26272B] text-white cursor-pointer relative rounded-[5px] "
                        >
                          <p className="-rotate-90">2:1</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-[3px]">
                    <div className="flex w-full justify-center gap-1">
                      <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-[5px] w-[120px] h-[40px] sm:w-[128px] sm:h-[67px]  ">
                        1 to 12
                      </button>
                      <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-[5px] w-[120px] h-[40px] sm:w-[128px] sm:h-[67px]  ">
                        13 to 24
                      </button>
                      <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-[5px] w-[120px] h-[40px] sm:w-[128px] sm:h-[67px]  ">
                        25 to 36
                      </button>
                    </div>
                    <div className="flex w-full justify-center gap-1">
                      <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  ">
                        1 to 18
                      </button>
                      <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  ">
                        Even
                      </button>
                      <button className="relative flex items-center justify-center bg-[#F1323E] cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  "></button>
                      <button className="relative flex items-center justify-center bg-[#2A2E38] cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  "></button>
                      <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  ">
                        Odd
                      </button>
                      <button className="relative flex items-center justify-center bg-[#0E0F14] border border-[#26272B] text-white cursor-pointer rounded-md w-[58px] h-[40px] sm:w-[62px] sm:h-[63px]  ">
                        19 to 36
                      </button>
                    </div>
                  </div>
                  <div className=" sm:w-12 bg-transparent hidden sm:block" />
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
                          onClick={() => copyToClipboard(bet.nonce?.toString())}
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
                    {bet.wallet !== wallet ? (
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
            <MdClose
              onClick={() => {
                onClose();
              }}
              size={22}
              className="absolute top-3 right-3 hover:cursor-pointer hover:bg-[#26282c] transition-all rounded-full p-[2px]"
              color="#F0F0F0"
            />
          </div>
          <Roulette1ProvablyFairModal
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
