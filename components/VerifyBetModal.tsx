import Image from "next/image";
import { useState } from "react";
import { IoIosArrowDown, IoMdCopy } from "react-icons/io";

interface ModalData {
  game: string;
  betTime: string;
  betAmount: number;
  multiplier: number;
  payout: number;
  chance: number;
  verificationAttributes: {
    clientSeed: string;
    nonce: number;
    serverSeed: string;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modalData: ModalData;
  setModalData: React.Dispatch<React.SetStateAction<ModalData>>;
}

export default function VerifyBetModal({
  isOpen,
  onClose,
  modalData,
  setModalData,
}: Props) {
  //handling dice
  const [selectedFaces, setSelectedFaces] = useState<{
    [key: number]: boolean;
  }>({
    1: true,
    2: true,
    3: false,
    4: false,
    5: false,
    6: false,
  });

  const [wonDiceFace, setWonDiceFace] = useState<number>(2);

  //to handle coin flip
  const [wonCoinFace, setWonCoinFace] = useState<"heads" | "tails">("heads");

  //to handle dropodown
  const [openDropDown, setOpenDropDown] = useState<boolean>(false);

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
                {modalData.game}
              </div>
              <div className="text-[#F0F0F0] text-md">{modalData.betTime}</div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 w-full text-white rounded-md bg-[#D9D9D9] bg-opacity-5 grid">
                <div className="text-[#94A3B8] text-sm">Bet</div>
                <div className="text-white">{modalData.betAmount} $SOL</div>
              </button>
              <button className="px-4 py-2 w-full text-white rounded-md bg-[#D9D9D9] bg-opacity-5 grid">
                <div className="text-[#94A3B8] text-sm">Multiplier</div>
                <div className="text-white">{modalData.multiplier} x</div>
              </button>
              <button className="px-4 py-2 w-full text-white rounded-md bg-[#D9D9D9] bg-opacity-5 grid">
                <div className="text-[#94A3B8] text-sm">Payout</div>
                <div className="text-white">{modalData.payout} $SOL</div>
              </button>
            </div>
            <div className="mt-8 px-8 pt-10 border-2 border-white border-opacity-5 rounded-md">
              {modalData.game === "dice" ? (
                <div className="relative w-full mb-8 xl:mb-6">
                  <div>
                    <Image
                      src="/assets/progressBar.png"
                      alt="progress bar"
                      width={900}
                      height={100}
                    />
                  </div>
                  <div className="flex justify-around md:gap-2">
                    <div className="flex flex-col items-center mr-2 sm:mr-0">
                      {selectedFaces[1] && wonDiceFace === 1 && (
                        <Image
                          src="/assets/pointer-green.png"
                          alt="pointer green"
                          width={13}
                          height={13}
                          className="absolute -top-[2px]"
                        />
                      )}
                      <Image
                        src="/assets/progressTip.png"
                        alt="progress bar"
                        width={13}
                        height={13}
                        className="absolute top-[2px]"
                      />
                      <Image
                        src={
                          wonDiceFace === 1
                            ? "/assets/activeDiceFace1.png"
                            : selectedFaces[1]
                            ? "/assets/finalDiceFace1.png"
                            : "/assets/diceFace1.png"
                        }
                        width={50}
                        height={50}
                        alt=""
                        className={`inline-block mt-6 ${
                          selectedFaces[1] ? "selected-face" : ""
                        }`}
                      />
                    </div>
                    <div className="flex flex-col items-center mr-2 sm:mr-0">
                      {selectedFaces[2] && wonDiceFace === 2 && (
                        <Image
                          src="/assets/pointer-green.png"
                          alt="pointer green"
                          width={13}
                          height={13}
                          className="absolute -top-[20px]"
                        />
                      )}
                      <Image
                        src="/assets/progressTip.png"
                        alt="progress bar"
                        width={13}
                        height={13}
                        className="absolute top-[2px]"
                      />
                      <Image
                        src={
                          wonDiceFace === 2
                            ? "/assets/activeDiceFace2.png"
                            : selectedFaces[2]
                            ? "/assets/finalDiceFace2.png"
                            : "/assets/diceFace2.png"
                        }
                        width={50}
                        height={50}
                        alt=""
                        className={`inline-block mt-6 ${
                          selectedFaces[2] ? "selected-face" : ""
                        }`}
                      />
                    </div>
                    <div className="flex flex-col items-center mr-2 sm:mr-0">
                      {selectedFaces[3] && wonDiceFace === 3 && (
                        <Image
                          src="/assets/pointer-green.png"
                          alt="pointer green"
                          width={13}
                          height={13}
                          className="absolute -top-[20px]"
                        />
                      )}
                      <Image
                        src="/assets/progressTip.png"
                        alt="progress bar"
                        width={13}
                        height={13}
                        className="absolute top-[2px]"
                      />
                      <Image
                        src={
                          wonDiceFace === 3
                            ? "/assets/activeDiceFace3.png"
                            : selectedFaces[3]
                            ? "/assets/finalDiceFace3.png"
                            : "/assets/diceFace3.png"
                        }
                        width={50}
                        height={50}
                        alt=""
                        className={`inline-block mt-6 ${
                          selectedFaces[3] ? "selected-face" : ""
                        }`}
                      />
                    </div>
                    <div className="flex flex-col items-center mr-2 sm:mr-0">
                      {selectedFaces[4] && wonDiceFace === 4 && (
                        <Image
                          src="/assets/pointer-green.png"
                          alt="pointer green"
                          width={13}
                          height={13}
                          className="absolute -top-[20px]"
                        />
                      )}
                      <Image
                        src="/assets/progressTip.png"
                        alt="progress bar"
                        width={13}
                        height={13}
                        className="absolute top-[2px]"
                      />
                      <Image
                        src={
                          wonDiceFace === 4
                            ? "/assets/activeDiceFace4.png"
                            : selectedFaces[4]
                            ? "/assets/finalDiceFace4.png"
                            : "/assets/diceFace4.png"
                        }
                        width={50}
                        height={50}
                        alt=""
                        className={`inline-block mt-6 ${
                          selectedFaces[3] ? "selected-face" : ""
                        }`}
                      />
                    </div>
                    <div className="flex flex-col items-center mr-2 sm:mr-0">
                      {selectedFaces[5] && wonDiceFace === 5 && (
                        <Image
                          src="/assets/pointer-green.png"
                          alt="pointer green"
                          width={13}
                          height={13}
                          className="absolute -top-[20px]"
                        />
                      )}
                      <Image
                        src="/assets/progressTip.png"
                        alt="progress bar"
                        width={13}
                        height={13}
                        className="absolute top-[2px]"
                      />
                      <Image
                        src={
                          wonDiceFace === 5
                            ? "/assets/activeDiceFace5.png"
                            : selectedFaces[5]
                            ? "/assets/finalDiceFace5.png"
                            : "/assets/diceFace5.png"
                        }
                        width={50}
                        height={50}
                        alt=""
                        className={`inline-block mt-6 ${
                          selectedFaces[5] ? "selected-face" : ""
                        }`}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      {selectedFaces[6] && wonDiceFace === 6 && (
                        <Image
                          src="/assets/pointer-green.png"
                          alt="pointer green"
                          width={13}
                          height={13}
                          className="absolute -top-[20px]"
                        />
                      )}
                      <Image
                        src="/assets/progressTip.png"
                        alt="progress bar"
                        width={13}
                        height={13}
                        className="absolute top-[2px]"
                      />
                      <Image
                        src={
                          wonDiceFace === 6
                            ? "/assets/activeDiceFace6.png"
                            : selectedFaces[6]
                            ? "/assets/finalDiceFace6.png"
                            : "/assets/diceFace6.png"
                        }
                        width={50}
                        height={50}
                        alt=""
                        className={`inline-block mt-6 ${
                          selectedFaces[6] ? "selected-face" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid place-items-center">
                  {wonCoinFace === "heads" ? (
                    <div className="w-50 h-50 bg-[#FFC20E] rounded-full"></div>
                  ) : (
                    <div className="w-50 h-50 bg-[#C0C9D2] rounded-full"></div>
                  )}
                </div>
              )}
              <div className="flex gap-4">
                <div>
                  <label className="text-sm text-[#F0F0F0]">Multiplier</label>
                  <input
                    type="text"
                    name="multiplier"
                    value={modalData.multiplier}
                    className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#F0F0F0]">Chance</label>
                  <input
                    type="text"
                    name="chance"
                    value={modalData.chance}
                    className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative"
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
                        <div>{modalData.verificationAttributes.clientSeed}</div>
                        <div>
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
                        <div>{modalData.verificationAttributes.nonce}</div>
                        <div>
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
                        Server Seed (Hashed)
                      </label>
                      <div className="bg-[#202329] text-white mt-1 rounded-md px-4 py-2 mb-4 w-full relative flex items-center justify-between">
                        <div>{modalData.verificationAttributes.serverSeed}</div>
                        <div>
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
                    <div className="text-xs text-[#94A3B8] text-center">
                      To verify this bet, you first need to rotate your seed
                      pair.
                    </div>
                    <button className="bg-[#7839C5] rounded-md w-full text-xl text-white text-semibold py-2">
                      Rotate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
