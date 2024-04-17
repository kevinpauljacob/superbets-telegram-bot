import {
  GameType,
  generateClientSeed,
  generateGameResult,
} from "@/utils/provably-fair";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Dice2 } from "./HistoryTable";
import toast from "react-hot-toast";
import DraggableBar from "@/components/games/Dice2/DraggableBar";

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
  bet?: Dice2;
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
  const [strikeNumber, setStrikeNumber] = useState<number>(50.0);

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
        GameType.dice2,
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
            className="absolute inset-0 bg-gray-800 opacity-75"
            onClick={handleClose}
          ></div>
          <div className="bg-[#121418] p-8 rounded-lg z-10 w-11/12 sm:w-[600px]">
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
              <div className="text-white">
                <div className="">
                  <div>
                    <label className="text-sm font-semibold">
                      Active Client Seed
                    </label>
                    <div className="flex items-center justify-between bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full">
                      <div className="truncate">
                        {modalData.activeGameSeed.clientSeed}
                      </div>
                      <div
                        onClick={() =>
                          copyToClipboard(modalData.activeGameSeed.clientSeed)
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
                  <div>
                    <label className="text-sm font-semibold">
                      Active Server Seed (Hashed)
                    </label>
                    <div className="flex items-center justify-between bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full">
                      <div className="truncate mr-1">
                        {modalData.activeGameSeed.serverSeedHash}
                      </div>
                      <div
                        onClick={() =>
                          copyToClipboard(
                            modalData.activeGameSeed.serverSeedHash,
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
                  <div>
                    <label className="text-sm font-semibold">Total Bets</label>
                    <input
                      type="text"
                      name="totalBets"
                      placeholder={modalData.activeGameSeed.nonce.toString()}
                      className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full pointer-events-none"
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
                      <label className="text-sm font-semibold">
                        New Client Seed *
                      </label>
                      <div className="mt-1 flex items-center justify-end gap-4">
                        <input
                          value={newClientSeed}
                          type="text"
                          onChange={(e) => setNewClientSeed(e.target.value)}
                          className="bg-[#202329] rounded-md px-4 py-2 w-full truncate"
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
                      <label className="text-sm font-semibold">
                        Next Server Seed
                      </label>
                      <div className="flex items-center justify-between bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full">
                        <div className="truncate mr-1">
                          {modalData.nextGameSeed.serverSeedHash}
                        </div>
                        <div
                          onClick={() =>
                            copyToClipboard(
                              modalData.nextGameSeed.serverSeedHash,
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
                </div>
              </div>
            )}
            {state === "verify" && (
              <div className="grid w-full text-white">
                <div className="grid gap-2">
                  <div className="border-2 border-opacity-5 border-[#FFFFFF] md:px-8">
                    <div className="px-8 pt-16 pb-8">
                      <div className="w-full">
                        <DraggableBar
                          choice={strikeNumber}
                          setChoice={setStrikeNumber}
                          strikeNumber={strikeNumber}
                          result={false}
                          rollType={"over"}
                          draggable={false}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Game</label>
                    <div className="flex items-center">
                      <select
                        name="game"
                        value={GameType.dice2}
                        onChange={(e) =>
                          setModalData((prevData) => ({
                            ...prevData,
                            game: e.target.value as GameType,
                          }))
                        }
                        className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full relative appearance-none"
                      >
                        <option value={GameType.dice2}>Dice</option>
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
                      name="nonce"
                      value={verificationState.nonce}
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
