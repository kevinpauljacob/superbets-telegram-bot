import { GameType, seedStatus } from "@/utils/vrf";
import Image from "next/image";
import { useState } from "react";
import { IoIosArrowDown, IoMdCopy } from "react-icons/io";
import { Flip } from "../Flips";
import CoinFlipProvablyFairModal, {
  PFModalData,
} from "./CoinFlipProvablyFairModal";
import { useGlobalContext } from "@/components/GlobalContext";

interface ModalData {
  flip: Flip;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modalData: ModalData;
}

export default function VerifyFlipModal({ isOpen, onClose, modalData }: Props) {
  const { flip } = modalData;
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
          <div className="bg-[#121418] max-h-[100vh] modalscrollbar overflow-y-scroll p-8 rounded-lg z-10 w-11/12 md:w-1/3">
            <div className="flex justify-between items-center">
              <div className="font-changa text-[1.75rem] font-semibold text-white">
                Coin Flip
              </div>
              <div className="text-[#F0F0F0] text-md">{flip.createdAt}</div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 w-full text-white rounded-md bg-[#D9D9D9] bg-opacity-5 grid">
                <div className="text-[#94A3B8] text-sm">Flip</div>
                <div className="text-white">{flip.amount} $SOL</div>
              </button>
              <button className="px-4 py-2 w-full text-white rounded-md bg-[#D9D9D9] bg-opacity-5 grid">
                <div className="text-[#94A3B8] text-sm">Multiplier</div>
                <div className="text-white">{(2 / 1).toFixed(2)} x</div>
              </button>
              <button className="px-4 py-2 w-full text-white rounded-md bg-[#D9D9D9] bg-opacity-5 grid">
                <div className="text-[#94A3B8] text-sm">Payout</div>
                <div className="text-white">{flip.amountWon} $SOL</div>
              </button>
            </div>
            <div className="mt-8 px-8 pt-10 border-2 border-white border-opacity-5 rounded-md">
              <div className="grid place-items-center">
                {flip.flipType === "heads" ? (
                  <div
                    className={`w-24 h-24 bg-[#FFC20E] rounded-full grid place-items-center p-2 border-4 ${
                      flip.result === "Won"
                        ? "border-green-500"
                        : "border-red-500"
                    }`}
                  >
                    <span className="text-white text-2xl text-bold font-changa my-auto mx-auto">
                      HEADS
                    </span>
                  </div>
                ) : (
                  <div
                    className={`w-24 h-24 bg-[#C0C9D2] rounded-full grid place-items-center p-2 border-4 ${
                      flip.result === "Won"
                        ? "border-green-500"
                        : "border-red-500"
                    }`}
                  >
                    <span className="text-black text-2xl text-bold font-changa my-auto mx-auto">
                      TAILS
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-4 pt-10">
                <div>
                  <label className="text-sm text-[#F0F0F0]">Multiplier</label>
                  <input
                    type="text"
                    name="multiplier"
                    value={(2 / 1).toFixed(2)}
                    className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm text-[#F0F0F0]">Chance</label>
                  <input
                    type="text"
                    name="chance"
                    value={((1 / 2) * 100).toFixed(2)}
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
                <div className="grid">
                  <div className="flex gap-2 w-full">
                    <div className="w-1/2">
                      <label className="text-xs text-[#F0F0F0]">
                        Client Seed
                      </label>
                      <div className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative flex items-center justify-between">
                        <div>{flip.gameSeed?.clientSeed}</div>
                        <div
                          onClick={() =>
                            copyToClipboard(flip.gameSeed?.clientSeed)
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
                    <div className="w-1/2">
                      <label className="text-xs text-[#F0F0F0]">Nonce</label>
                      <div className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative flex items-center justify-between">
                        <div>{flip.nonce}</div>
                        <div
                          onClick={() =>
                            copyToClipboard(flip.nonce?.toString())
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
                  <div className="flex gap-2 w-full">
                    <div className="w-full">
                      <label className="text-xs text-[#F0F0F0]">
                        Server Seed{" "}
                        {flip.gameSeed?.status !== seedStatus.EXPIRED
                          ? "(Hashed)"
                          : ""}
                      </label>
                      <div className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative flex items-center justify-between">
                        <div>
                          {flip.gameSeed?.serverSeedHash ??
                            flip.gameSeed?.serverSeedHash}
                        </div>
                        <div
                          onClick={() =>
                            copyToClipboard(
                              flip.gameSeed?.serverSeedHash ??
                                flip.gameSeed?.serverSeedHash,
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
                    {flip.gameSeed?.status !== seedStatus.EXPIRED ? (
                      <>
                        <div className="text-xs text-[#94A3B8] text-center">
                          To verify this flip, you first need to rotate your
                          seed pair.
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
