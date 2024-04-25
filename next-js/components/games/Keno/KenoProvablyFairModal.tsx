import {
  GameType,
  generateClientSeed,
  generateGameResult,
} from "@/utils/provably-fair";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Keno } from "./HistoryTable";
import toast from "react-hot-toast";
import { FaRegCopy } from "react-icons/fa6";

export interface PFModalData {
  activeGameSeed: {
    wallet: string;
    clientSeed: string;
    serverSeed: string;
    serverSeedHash: string;
    nonce: number;
    status: string;
  };
  nextGameSeed: {
    wallet: string;
    clientSeed: string;
    serverSeed: string;
    serverSeedHash: string;
    nonce: number;
    status: string;
  };
  tab?: "seeds" | "verify";
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modalData: PFModalData;
  setModalData: React.Dispatch<React.SetStateAction<PFModalData>>;
  bet?: Keno;
}

export default function RollDiceProvablyFairModal({
  isOpen,
  onClose,
  modalData,
  setModalData,
  bet,
}: Props) {
  const [state, setState] = useState<"seeds" | "verify">(
    modalData.tab ?? "seeds",
  );
  const [newClientSeed, setNewClientSeed] = useState<string>(
    generateClientSeed(),
  );
  const [strikeNumbers, setStrikeNumbers] = useState<number[]>([]);

  const [verificationState, setVerificationState] = useState<{
    clientSeed: string;
    serverSeed: string;
    nonce: string;
  }>(
    bet?.gameSeed
      ? {
          clientSeed: bet.gameSeed?.clientSeed,
          serverSeed: bet.gameSeed?.serverSeed ?? "",
          nonce: bet.nonce?.toString() ?? "",
        }
      : {
          clientSeed: "",
          serverSeed: "",
          nonce: "",
        },
  );

  useEffect(() => {
    setStrikeNumbers(
      generateGameResult(
        verificationState.serverSeed,
        verificationState.clientSeed,
        parseInt(verificationState.nonce),
        GameType.keno,
      ),
    );
  }, []);

  const handleToggleState = (newState: "seeds" | "verify") => {
    setState(newState);
  };

  const handleClose = () => {
    //@ts-ignore
    document.addEventListener("click", function (event) {
      //@ts-ignore
      var targetId = event.target.id;
      if (targetId && targetId === "modal-bg") onClose();
    });
  };

  useEffect(() => {
    if (modalData.tab) handleToggleState(modalData.tab);
  }, [modalData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setVerificationState((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    const { clientSeed, serverSeed, nonce } = verificationState;

    setStrikeNumbers(
      generateGameResult(
        name === "serverSeed" ? value : serverSeed,
        name === "clientSeed" ? value : clientSeed,
        parseInt(name === "nonce" ? value : nonce),
        GameType.keno,
      ),
    );
  };

  const handleSetClientSeed = async () => {
    if (!/^[\x00-\x7F]*$/.test(newClientSeed) || newClientSeed.trim() === "")
      return toast.error("Invalid client seed");

    let data = await fetch(`/api/games/gameSeed/change`, {
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

  const copyToClipboard = (text?: string) => {
    if (text) navigator.clipboard.writeText(text);
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={() => {
            handleClose();
          }}
          id="modal-bg"
          className="absolute z-[150] left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 backdrop-blur transition-all"
        >
          <div className="bg-[#121418] p-8 rounded-lg z-10 w-11/12 sm:w-[600px]">
            <div className="font-changa text-[1.75rem] font-semibold text-[#F0F0F0]">
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
              <div className="text-white">
                <div className="">
                  <div className="mt-2.5">
                    <label className="text-[13px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                      Active Client Seed
                    </label>
                    <div className="bg-[#202329] mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between">
                      <span className="truncate text-[#B9B9BA] text-xs font-semibold">
                        {modalData.activeGameSeed.clientSeed}
                      </span>
                      <FaRegCopy
                        onClick={() =>
                          copyToClipboard(modalData.activeGameSeed.clientSeed)
                        }
                        className="w-5 h-5 text-[#555555] cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <label className="text-[13px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                      Active Server Seed (Hashed)
                    </label>
                    <div className="bg-[#202329] mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between">
                      <span className="truncate text-[#B9B9BA] text-xs font-semibold">
                        {modalData.activeGameSeed.serverSeedHash}
                      </span>
                      <FaRegCopy
                        onClick={() =>
                          copyToClipboard(
                            modalData.activeGameSeed.serverSeedHash,
                          )
                        }
                        className="w-5 h-5 text-[#555555] cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <label className="text-[13px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                      Total Bets
                    </label>
                    <input
                      type="text"
                      name="totalBets"
                      placeholder={modalData.activeGameSeed.nonce.toString()}
                      className="bg-[#202329] text-[#B9B9BA] text-xs font-semibold mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between"
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <div className="font-changa text-[1.60rem] font-semibold text-white my-4">
                    Rotate Seed Pair
                  </div>
                  <div className="">
                    <div>
                      <label className="text-[13px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                        New Client Seed *
                      </label>
                      <div className="mt-1 flex items-center justify-end gap-4">
                        <input
                          value={newClientSeed}
                          type="text"
                          onChange={(e) => setNewClientSeed(e.target.value)}
                          className="bg-[#202329] text-[#B9B9BA] text-xs font-semibold mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between"
                        />
                        <button
                          className="flex items-center justify-center h-full px-4 py-2 my-auto bg-[#7839C5] text-white rounded-md"
                          onClick={handleSetClientSeed}
                        >
                          Change
                        </button>
                      </div>
                    </div>
                    <div className="mt-5">
                      <label className="text-[13px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                        Next Server Seed
                      </label>
                      <div className="bg-[#202329] mt-1 rounded-md px-4 py-3 w-full relative flex items-center justify-between">
                        <span className="truncate text-[#B9B9BA] text-xs font-semibold">
                          {modalData.nextGameSeed.serverSeedHash}
                        </span>
                        <FaRegCopy
                          onClick={() =>
                            copyToClipboard(
                              modalData.nextGameSeed.serverSeedHash,
                            )
                          }
                          className="w-5 h-5 text-[#555555] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {state === "verify" && (
              <div className="grid w-full text-white">
                <div className="grid gap-2">
                  <div className="border-2 border-opacity-5 border-[#FFFFFF] md:px-8">
                    <div className="p-4">
                      <div className="grid grid-cols-8 gap-2 text-white text-xl font-chakra w-full">
                        {Array.from(
                          { length: 40 },
                          (_, index) => index + 1,
                        ).map((number) => (
                          <div
                            key={number}
                            className={`flex items-center justify-center cursor-pointer ${
                              strikeNumbers.includes(number)
                                ? "bg-black border-2 border-fomo-green"
                                : "bg-[#202329]"
                            } rounded-md text-center transition-all duration-300 ease-in-out w-[45px] h-[45px]`}
                          >
                            {strikeNumbers.includes(number) ? (
                              <div className="flex justify-center items-center bg-[#FFD100] text-black rounded-full w-[38px] h-[38px]">
                                {number}
                              </div>
                            ) : (
                              <div>{number}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                      Game
                    </label>
                    <div className="flex items-center">
                      <select
                        name="game"
                        value={GameType.keno}
                        onChange={(e) =>
                          setModalData((prevData) => ({
                            ...prevData,
                            game: e.target.value as GameType,
                          }))
                        }
                        className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative appearance-none"
                      >
                        <option value={GameType.keno}>Keno</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                      Client Seed
                    </label>
                    <input
                      type="text"
                      name="clientSeed"
                      value={verificationState.clientSeed}
                      onChange={handleChange}
                      className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                      Server Seed
                    </label>
                    <input
                      type="text"
                      name="serverSeed"
                      value={verificationState.serverSeed}
                      onChange={handleChange}
                      className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                      Nonce
                    </label>
                    <input
                      type="text"
                      name="nonce"
                      value={verificationState.nonce}
                      onChange={handleChange}
                      className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative"
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
