import { GameType, generateClientSeed, generateGameResult } from "@/utils/vrf";
import Image from "next/image";
import { useState } from "react";

interface ModalData {
  activeGameSeed: {
    wallet: string;
    clientSeed: string;
    serverSeed: string;
    serverSeedHash: string;
    currentNonce: number;
    status: string;
  };
  nextGameSeed: {
    wallet: string;
    clientSeed: string;
    serverSeed: string;
    serverSeedHash: string;
    currentNonce: number;
    status: string;
  };
  totalBets: string;
  game: GameType;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modalData: ModalData;
  setModalData: React.Dispatch<React.SetStateAction<ModalData>>;
}

export default function ProvablyFairModal({
  isOpen,
  onClose,
  modalData,
  setModalData,
}: Props) {
  const [state, setState] = useState<"seeds" | "verify">("seeds");
  const [newClientSeed, setNewClientSeed] = useState<string>(
    generateClientSeed(),
  );

  const [verificationState, setVerificationState] = useState<{
    clientSeed: string;
    serverSeed: string;
    currentNonce: string;
  }>({
    clientSeed: "",
    serverSeed: "",
    currentNonce: "",
  });

  //handling coin flip
  const [wonCoinFace, setWonCoinface] = useState<"heads" | "tails">("heads");
  const [selectedCoinFace, setSelectedCoinface] = useState<"heads" | "tails">(
    "heads",
  );

  const [wonDiceFace, setWonDiceFace] = useState<number>(1);

  const handleToggleState = (newState: "seeds" | "verify") => {
    setState(newState);
  };

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setVerificationState((prevData) => ({
      ...prevData,
      [name]: name === "currentNonce" ? parseInt(value) : value,
    }));

    const { clientSeed, serverSeed, currentNonce } = verificationState;

    if (modalData.game === GameType.coin)
      setWonCoinface(
        (generateGameResult(
          name === "clientSeed" ? value : clientSeed,
          name === "serverSeed" ? value : serverSeed,
          parseInt(name === "currentNonce" ? value : currentNonce),
          modalData.game,
        ) as number) === 1
          ? "heads"
          : "tails",
      );
    else if (modalData.game === GameType.dice)
      setWonDiceFace(
        generateGameResult(
          name === "clientSeed" ? value : clientSeed,
          name === "serverSeed" ? value : serverSeed,
          parseInt(name === "currentNonce" ? value : currentNonce),
          modalData.game,
        ) as number,
      );
  };

  const handleSetClientSeed = async () => {
    let data = await fetch(`/api/games/vrf/change`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wallet: modalData.activeGameSeed.wallet,
        clientSeed: newClientSeed,
      }),
    }).then((res) => res.json());

    if (!data.success) return console.error(data.message);

    setModalData(data);
    setNewClientSeed(generateClientSeed());
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-gray-800 opacity-75"
            onClick={handleClose}
          ></div>
          <div className="bg-[#121418] p-8 rounded-lg z-10 w-11/12 md:w-1/3">
            <div className="font-changa text-[1.75rem] font-semibold text-white">
              Provably Fair
            </div>
            <div className="my-4 flex w-full items-center justify-center">
              <button
                className={`px-4 py-2 mr-2 w-full text-white rounded-md ${
                  state === "seeds"
                    ? "bg-[#D9D9D9] bg-opacity-5"
                    : "border-2 border-opacity-5 border-[#FFFFFF]"
                }`}
                onClick={() => handleToggleState("seeds")}
              >
                Seeds
              </button>
              <button
                className={`px-4 py-2 w-full text-white rounded-md ${
                  state === "verify"
                    ? "bg-[#D9D9D9] bg-opacity-5"
                    : "border-2 border-opacity-5 border-[#FFFFFF]"
                }`}
                onClick={() => handleToggleState("verify")}
              >
                Verify
              </button>
            </div>
            {state === "seeds" && (
              <div>
                <div className="grid gap-2">
                  <div>
                    <label className="text-sm font-semibold">
                      Active Client Seed
                    </label>
                    <input
                      type="text"
                      name="activeClientSeed"
                      placeholder={modalData.activeGameSeed.clientSeed}
                      className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full pointer-events-none"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">
                      Active Server Seed (Hashed)
                    </label>
                    <input
                      type="text"
                      name="activeServerSeedHash"
                      placeholder={modalData.activeGameSeed.serverSeedHash}
                      className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full pointer-events-none"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Total Bets</label>
                    <input
                      type="text"
                      name="totalBets"
                      placeholder={modalData.activeGameSeed.currentNonce.toString()}
                      className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full pointer-events-none"
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <div className="font-changa text-[1.60rem] font-semibold text-white my-4">
                    Rotate Seed Pair
                  </div>
                  <div className="grid gap-2">
                    <div>
                      <label className="text-sm font-semibold">
                        New Client Seed *
                      </label>
                      <div className="mt-1 flex items-center justify-end gap-4">
                        <input
                          value={newClientSeed}
                          type="text"
                          onChange={(e) => setNewClientSeed(e.target.value)}
                          className="bg-[#202329] rounded-md px-4 py-2 w-full"
                        />
                        <button
                          className="flex items-center justify-center h-full px-4 py-2 my-auto bg-[#7839C5] text-white rounded-md"
                          onClick={handleSetClientSeed}
                        >
                          Change
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">
                        Next Server Seed
                      </label>
                      <input
                        type="text"
                        name="nextServerSeedHash"
                        placeholder={modalData.nextGameSeed.serverSeedHash}
                        className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full pointer-events-none"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {state === "verify" && (
              <div className="grid w-full">
                <div className="grid gap-2">
                  <div className="border-2 border-opacity-5 border-[#FFFFFF] md:px-8">
                    {modalData.game === GameType.coin ? (
                      <div className="flex justify-center items-center gap-4 md:px-8 py-4">
                        <div
                          className={`bg-[#202329] py-4 px-4 rounded-md flex gap-2 items-center justify-center min-w-1/3 ${
                            wonCoinFace === "heads"
                              ? "border-2 border-[#7839C5]"
                              : "border-[rgb(192,201,210)]"
                          }`}
                        >
                          <div className="w-5 h-5 bg-[rgb(192,201,210)] border border-white rounded-full"></div>
                          <div className="font-changa text-xl font-semibold">
                            Heads
                          </div>
                        </div>
                        <div
                          className={`bg-[#202329] py-4 px-4 rounded-md flex gap-2 items-center justify-center min-w-1/3  ${
                            wonCoinFace === "tails"
                              ? "border-2 border-[#7839C5]"
                              : "border-[rgb(192,201,210)]"
                          }`}
                        >
                          <div className="w-5 h-5 bg-[#FFC20E] rounded-full"></div>
                          <div className="font-changa text-xl font-semibold">
                            Tails
                          </div>
                        </div>
                      </div>
                    ) : modalData.game === GameType.dice ? (
                      <div className="px-8 pt-10 pb-4">
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
                            {Array.from({ length: 6 }, (_, i) => i + 1).map(
                              (face) => (
                                <div
                                  key={face}
                                  className="flex flex-col items-center"
                                >
                                  {wonDiceFace === face && (
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
                                      wonDiceFace === face
                                        ? `/assets/activeDiceFace${face}.png`
                                        : `/assets/diceFace${face}.png`
                                    }
                                    width={50}
                                    height={50}
                                    alt=""
                                    className={`inline-block mt-6 ${
                                      wonDiceFace === face
                                        ? "selected-face"
                                        : ""
                                    }`}
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div></div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Game</label>
                    <div className="flex items-center">
                      <select
                        name="game"
                        value={modalData.game}
                        onChange={(e) =>
                          setModalData((prevData) => ({
                            ...prevData,
                            game: e.target.value as GameType,
                          }))
                        }
                        className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full relative appearance-none"
                      >
                        <option value={GameType.dice}>Dice</option>
                        <option value={GameType.coin}>Coin Flip</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Client Seed</label>
                    <input
                      type="text"
                      name="clientSeed"
                      value={verificationState.clientSeed}
                      onChange={handleChange}
                      className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full relative"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Server Seed</label>
                    <input
                      type="text"
                      name="serverSeed"
                      value={verificationState.serverSeed}
                      onChange={handleChange}
                      className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full relative"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Nonce</label>
                    <input
                      type="text"
                      name="currentNonce"
                      value={verificationState.currentNonce}
                      onChange={handleChange}
                      className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full relative"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
