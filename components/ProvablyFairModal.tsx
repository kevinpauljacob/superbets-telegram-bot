import { generateClientSeed } from "@/utils/vrf";
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
  game: string;
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
    setModalData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
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
          <div className="bg-[#121418] p-8 rounded-lg z-10 md:w-1/3">
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
                      <div className="flex items-center justify-end">
                        <input
                          value={newClientSeed}
                          type="text"
                          onChange={(e) => setNewClientSeed(e.target.value)}
                          className="bg-[#202329] rounded-md px-4 py-2 w-full"
                        />
                        <div className="grid absolute bg-transparent p-2 h-fit">
                          <button
                            className="flex items-center justify-center my-auto bg-[#7839C5] text-white px-4 py-[2px] rounded-md"
                            onClick={handleSetClientSeed}
                          >
                            Change
                          </button>
                        </div>
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
              <div>
                <div className="grid gap-2">
                  <div>
                    <label className="text-sm font-semibold">Game</label>
                    <div className="flex items-center justify-end">
                      <select
                        name="game"
                        value={modalData.game}
                        onChange={handleChange}
                        className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full relative appearance-none"
                      >
                        <option value="DICE">Dice</option>
                        <option value="COIN_FLIP">Coin Flip</option>
                        <option value="BINARY">Binary</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Client Seed</label>
                    <input
                      type="text"
                      name="clientSeed"
                      value={""}
                      onChange={handleChange}
                      className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full relative"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Server Seed</label>
                    <input
                      type="text"
                      name="serverSeed"
                      value={""}
                      onChange={handleChange}
                      className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full relative"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Nonce</label>
                    <input
                      type="text"
                      name="nonce"
                      value={""}
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
