import {
  GameType,
  generateClientSeed,
  generateGameResult,
} from "@/utils/provably-fair";
import { useEffect, useState } from "react";
import { Limbo } from "./HistoryTable";
import Image from "next/image";
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
  flip?: Limbo;
}

export default function LimboProvablyFairModal({
  isOpen,
  onClose,
  modalData,
  setModalData,
  flip,
}: Props) {
  const [state, setState] = useState<"seeds" | "verify">(
    modalData.tab ?? "seeds",
  );
  const [newClientSeed, setNewClientSeed] = useState<string>(
    generateClientSeed(),
  );
  const [multiplier, setMultiplier] = useState<string>("1.00");

  const [verificationState, setVerificationState] = useState<{
    clientSeed: string;
    serverSeed: string;
    nonce: string;
  }>(
    flip?.gameSeed
      ? {
          clientSeed: flip.gameSeed.clientSeed,
          serverSeed: flip.gameSeed.serverSeed ?? "",
          nonce: flip.nonce?.toString() ?? "",
        }
      : {
          clientSeed: "",
          serverSeed: "",
          nonce: "",
        },
  );

  useEffect(() => {
    setMultiplier(
      (
        100 /
        generateGameResult(
          verificationState.serverSeed,
          verificationState.clientSeed,
          parseInt(verificationState.nonce),
          GameType.limbo,
        )
      ).toFixed(2),
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
      if (targetId && targetId === "pf-modal-bg") onClose();
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

    setMultiplier(
      (
        100 /
        generateGameResult(
          name === "serverSeed" ? value : serverSeed,
          name === "clientSeed" ? value : clientSeed,
          parseInt(name === "nonce" ? value : nonce),
          GameType.limbo,
        )
      ).toFixed(2),
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
          id="pf-modal-bg"
          className="absolute z-[150] left-0 top-0 flex h-full w-full items-center justify-center bg-[#33314680] backdrop-blur-[0px] transition-all"
        >
          <div className="bg-[#121418] p-8 rounded-lg z-10 w-11/12 sm:w-[600px]">
            <div className="font-changa text-[1.75rem] font-semibold text-[#F0F0F0]">
              Provably Fair
            </div>
            <div className="w-full flex mt-8 mb-6">
              <button
                className={`w-full border-2 hover:duration-75 rounded-md py-2 mr-1 text-white font-semibold text-sm transition duration-300 ease-in-out ${
                  state === "seeds"
                    ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
                    : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
                }`}
                onClick={() => handleToggleState("seeds")}
              >
                Seeds
              </button>
              <button
                className={`w-full border-2 hover:duration-75 rounded-md py-2 ml-1 text-white font-semibold text-sm transition-all duration-300 ease-in-out ${
                  state === "verify"
                    ? "bg-[#d9d9d90d] border-transparent text-opacity-90"
                    : "border-[#d9d9d90d] hover:bg-[#9361d1] focus:bg-[#602E9E] text-opacity-50 hover:text-opacity-90"
                }`}
                onClick={() => handleToggleState("verify")}
              >
                Verify
              </button>
            </div>
            {state === "seeds" && (
              <div className="text-white">
                <div className="">
                  <div className="mt-3">
                    <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
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
                  <div className="mt-4">
                    <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
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
                  <div className="mt-4">
                    <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
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
                  <div className="font-chakra mt-8 tracking-wider text-xl font-semibold text-[#F0F0F0]">
                    Rotate Seed Pair
                  </div>
                  <div className="mt-2">
                    <div>
                      <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
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
                      <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
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
                    <div className="flex justify-center items-center gap-4 md:px-8 py-4 md:text-6xl font-changa">
                      {multiplier}x
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
                      value={GameType.limbo}
                      onChange={(e) =>
                        setModalData((prevData) => ({
                          ...prevData,
                          game: e.target.value as GameType,
                        }))
                      }
                      className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md p-3 w-full relative appearance-none"
                    >
                      {/* <option value={GameType.dice}>Dice</option>
                      <option value={GameType.coin}>Coin Flip</option> */}
                      <option value={GameType.limbo}>Limbo</option>
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
            )}
          </div>
        </div>
      )}
    </>
  );
}
