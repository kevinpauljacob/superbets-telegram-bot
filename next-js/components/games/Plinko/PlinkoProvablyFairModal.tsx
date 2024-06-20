import {
  GameType,
  generateClientSeed,
  generateGameResult,
} from "@/utils/provably-fair";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Plinko } from "./VerifyPlinkoModal";
import { FaRegCopy } from "react-icons/fa6";
import { MdClose } from "react-icons/md";
import CheckPF from "@/public/assets/CheckPF.svg";
import { errorCustom, successCustom } from "@/components/toasts/ToastGroup";
import { useGlobalContext } from "@/components/GlobalContext";
import { translator } from "@/context/transactions";
import ProvablyFairModal from "../ProvablyFairModal";
import GameSelect from "../GameSelect";
import {
  AdaptiveModal,
  AdaptiveModalContent,
} from "@/components/AdaptiveModal";

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
  bet?: Plinko;
}

export default function PlinkoProvablyFairModal({
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
  const { language } = useGlobalContext();
  const [strikeNumber, setStrikeNumber] = useState<number>(0);
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>();
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [hoveredMultiplier, setHoveredMultiplier] = useState<number | null>(
    null,
  );
  const [selectedGameType, setSelectedGameType] = useState<GameType>(
    GameType.plinko,
  );

  const [verificationState, setVerificationState] = useState<{
    clientSeed: string;
    serverSeed: string;
    nonce: string;
    risk?: string;
    rows?: number;
    parameter?: number;
  }>(
    bet?.gameSeed
      ? {
          clientSeed: bet.gameSeed.clientSeed,
          serverSeed: bet.gameSeed.serverSeedHash ?? "",
          nonce: bet.nonce?.toString() ?? "",
          risk:
            bet.risk ||
            (selectedGameType === GameType.wheel ? "low" : undefined),
          
          parameter:
            bet.rows ||
            (selectedGameType === GameType.mines ? 1 : undefined),
        }
      : {
          clientSeed: "",
          serverSeed: "",
          nonce: "",
          risk: selectedGameType === GameType.wheel ? "low" : undefined,
          
          parameter: selectedGameType === GameType.plinko ? 8 : undefined,
        },
  );

  useEffect(() => {
    setStrikeNumber(
      generateGameResult(
        verificationState.serverSeed,
        verificationState.clientSeed,
        parseInt(verificationState.nonce),
        GameType.plinko,
      ),
    );
  }, []);

  const handleToggleState = (newState: "seeds" | "verify") => {
    setState(newState);
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
      return errorCustom(translator("Invalid client seed", language));

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

    if (!data.success) return errorCustom(data.message);

    setModalData(data);
    successCustom("Successfully changed the server seed");
    setNewClientSeed(generateClientSeed());
  };

  const copyToClipboard = (text?: string) => {
    if (text) navigator.clipboard.writeText(text);
  };

  return (
    <>
      {isOpen && (
        <AdaptiveModal open={isOpen} onOpenChange={() => onClose()}>
          <AdaptiveModalContent className="bg-[#121418] sm:overflow-y-auto min-h-[50dvh] max-h-[80dvh] w-full pb-6">
            <div className="flex flex-1 px-8 sm:p-0 justify-center overflow-y-auto">
              <div className="flex flex-col w-full">
                <div className="flex font-chakra tracking-wider text-2xl font-semibold text-[#F0F0F0] items-center justify-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Image src={CheckPF} alt="" />
                    {translator("PROVABLY FAIR", language)}
                  </div>
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
                    {translator("Seeds", language)}
                  </button>
                  <button
                    className={`px-4 py-2 w-full text-white rounded-md ${
                      state === "verify"
                        ? "bg-[#D9D9D9] bg-opacity-5"
                        : "border-2 border-opacity-5 border-[#FFFFFF]"
                    }`}
                    onClick={() => handleToggleState("verify")}
                  >
                    {translator("Verify", language)}
                  </button>
                </div>
                {state === "seeds" && (
                  <div className="text-white">
                    <div className="">
                      <div className="mt-3">
                        <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                          {translator("Active Client Seed", language)}
                        </label>
                        <div className="bg-[#202329] mt-1 rounded-md px-5 py-4 w-full relative flex items-center justify-between">
                          <span className="truncate text-[#B9B9BA] text-xs font-semibold">
                            {modalData.activeGameSeed.clientSeed}
                          </span>
                          <FaRegCopy
                            onClick={() =>
                              copyToClipboard(
                                modalData.activeGameSeed.clientSeed,
                              )
                            }
                            className="w-5 h-5 text-[#555555] cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                          {translator("Active Server Seed (Hashed)", language)}
                        </label>
                        <div className="bg-[#202329] mt-1 rounded-md px-5 py-4 w-full relative flex items-center justify-between">
                          <span className="truncate max-w-[26rem] text-[#B9B9BA] text-xs font-semibold">
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
                          {translator("Total Bets", language)}
                        </label>
                        <input
                          type="text"
                          name="totalBets"
                          placeholder={modalData.activeGameSeed.nonce.toString()}
                          className="bg-[#202329] text-[#B9B9BA] text-xs font-semibold mt-1 rounded-md px-5 py-4 w-full relative flex items-center justify-between"
                          readOnly
                        />
                      </div>
                    </div>
                    <div>
                      <div className="font-chakra mt-8 tracking-wider text-xl font-semibold text-[#F0F0F0]">
                        {translator("Rotate Seed Pair", language)}
                      </div>
                      <div className="mt-2">
                        <div>
                          <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                            {translator("New Client Seed", language)}*
                          </label>
                          <div className="mt-1 w-full flex items-center justify-end gap-4 bg-[#202329] rounded-md">
                            <input
                              value={newClientSeed}
                              type="text"
                              onChange={(e) => setNewClientSeed(e.target.value)}
                              className="bg-[#202329] text-[#B9B9BA] text-xs font-semibold rounded-md px-5 py-4 w-full relative flex items-center justify-between"
                            />
                            <button
                              className="flex items-center justify-center h-full mx-2 px-5 py-1 my-auto bg-[#7839C5] text-white rounded-md font-bold text-sm"
                              onClick={handleSetClientSeed}
                            >
                              {translator("Change", language)}
                            </button>
                          </div>
                        </div>
                        <div className="mt-5">
                          <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                            {translator("Next Server Seed", language)}
                          </label>
                          <div className="bg-[#202329] mt-1 rounded-md px-5 py-4 w-full relative flex items-center justify-between">
                            <span className="truncate max-w-[26rem] text-[#B9B9BA] text-xs font-semibold">
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
                  <div className="grid w-full text-white ">
                    <div className="grid gap-2">
                      <div className="border-2 border-opacity-5 border-[#FFFFFF] md:px-8 py-2">
                        <ProvablyFairModal
                          setVerificationState={setVerificationState}
                          verificationState={verificationState}
                          selectedGameType={selectedGameType}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                          {translator("Game", language)}
                        </label>
                        <div className="flex items-center">
                          <GameSelect
                            selectedGameType={selectedGameType}
                            setSelectedGameType={setSelectedGameType}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                          {translator("Client Seed", language)}
                        </label>
                        <input
                          type="text"
                          name="clientSeed"
                          value={verificationState.clientSeed}
                          onChange={handleChange}
                          className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                          {translator("Server Seed", language)}
                        </label>
                        <input
                          type="text"
                          name="serverSeed"
                          value={verificationState.serverSeed}
                          onChange={handleChange}
                          className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-opacity-75 font-changa text-[#F0F0F0]">
                          {translator("Nonce", language)}
                        </label>
                        <input
                          type="text"
                          name="nonce"
                          value={verificationState.nonce}
                          onChange={handleChange}
                          className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AdaptiveModalContent>
        </AdaptiveModal>
      )}
    </>
  );
}