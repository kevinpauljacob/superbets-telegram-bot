import {
  GameType,
  generateClientSeed,
  generateGameResult,
} from "@/utils/provably-fair";
import { useEffect, useState } from "react";
import { Wheel } from "./HistoryTable";
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
  bet?: Wheel;
}

export default function WheelProvablyFairModal({
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
  const [strikeNumber, setStrikeNumber] = useState<number>(50.0);

  const [verificationState, setVerificationState] = useState<{
    clientSeed: string;
    serverSeed: string;
    nonce: string;
    risk: string;
    segments: number;
  }>(
    bet?.gameSeed
      ? {
          clientSeed: bet.gameSeed?.clientSeed,
          serverSeed: bet.gameSeed?.serverSeed ?? "",
          nonce: bet.nonce?.toString() ?? "",
          risk: bet.risk?.toString() ?? "",
          segments: bet.segments ?? 0,
        }
      : {
          clientSeed: "",
          serverSeed: "",
          nonce: "",
          risk: "low",
          segments: 10,
        },
  );

  const handleToggleState = (newState: "seeds" | "verify") => {
    setState(newState);
  };

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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

    setStrikeNumber(
      generateGameResult(
        name === "serverSeed" ? value : serverSeed,
        name === "clientSeed" ? value : clientSeed,
        parseInt(name === "nonce" ? value : nonce),
        GameType.wheel,
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
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur transition-all"
            onClick={handleClose}
          ></div>
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
                    <div className="px-8 pt-20 pb-8">
                      <div className="w-full"></div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                      Game
                    </label>
                    <div className="flex items-center">
                      <select
                        name="game"
                        value={GameType.wheel}
                        onChange={(e) =>
                          setModalData((prevData) => ({
                            ...prevData,
                            game: e.target.value as GameType,
                          }))
                        }
                        className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative appearance-none"
                      >
                        <option value={GameType.wheel}>Wheel</option>
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
                  <div>
                    <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                      Risk
                    </label>
                    <div className="flex items-center">
                      <select
                        name="risk"
                        value={verificationState.risk}
                        onChange={handleChange}
                        className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative appearance-none"
                      >
                        <option value={"low"}>Low</option>
                        <option value={"medium"}>Medium</option>
                        <option value={"high"}>High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                      Segments
                    </label>
                    <div className="flex items-center">
                      <select
                        name="segments"
                        value={verificationState.segments}
                        onChange={handleChange}
                        className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative appearance-none"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={40}>40</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
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
