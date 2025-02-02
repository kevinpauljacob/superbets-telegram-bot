import {
  GameType,
  generateClientSeed,
  generateGameResult,
} from "@/utils/provably-fair";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Roulette2 } from "./VerifyRoulette2Modal";
import { FaRegCopy } from "react-icons/fa6";
import { MdClose } from "react-icons/md";
import CheckPF from "@/public/assets/CheckPF.svg";
import { errorCustom, successCustom } from "@/components/toasts/ToastGroup";
import { useGlobalContext } from "@/components/GlobalContext";
import { translator } from "@/context/transactions";
import ProvablyFairModal from "../ProvablyFairModal";
import GameSelect from "../GameSelect";
import { PFModalData } from "../CoinFlip/CoinFlipProvablyFairModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modalData: PFModalData;
  setModalData: React.Dispatch<React.SetStateAction<PFModalData>>;
  bet?: Roulette2;
}

export default function Roulette2ProvablyFairModal({
  isOpen,
  onClose,
  modalData,
  setModalData,
  bet,
}: Props) {
  const [state, setState] = useState<"seeds" | "verify">(
    modalData.tab ?? "seeds",
  );
  const [newClientSeed, setNewClientSeed] =
    useState<string>(generateClientSeed());
  const { language, session } = useGlobalContext();
  /*   const [strikeNumber, setStrikeNumber] = useState<number>(0);
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>();
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [hoveredMultiplier, setHoveredMultiplier] = useState<number | null>(
    null,
  ); */
  const [selectedGameType, setSelectedGameType] = useState<GameType>(
    GameType.roulette2,
  );
  const [verificationState, setVerificationState] = useState<{
    clientSeed: string;
    serverSeed: string;
    nonce: string;
    risk?: string;
    segments?: number;
    parameter?: number;
  }>(
    bet?.gameSeed
      ? {
          clientSeed: bet.gameSeed.clientSeed,
          serverSeed: bet.gameSeed.serverSeed ?? "",
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
        account: modalData.activeGameSeed.account,
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
        <div
          onClick={() => {
            handleClose();
          }}
          id="pf-modal-bg"
          className="absolute z-[150] left-0 top-0 flex h-full w-full items-center justify-center bg-[#33314680] backdrop-blur-[0px] transition-all"
        >
          <div className="bg-[#121418] max-h-[80dvh]  overflow-y-scroll p-8 rounded-lg z-10 w-11/12 sm:w-[32rem] -mt-[4.7rem] md:mt-0 nobar">
            <div className="flex font-chakra tracking-wider text-2xl font-semibold text-[#F0F0F0] items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src={CheckPF} alt="" />
                {translator("PROVABLY FAIR", language)}
              </div>
              <div className="hover:cursor-pointer hover:bg-[#26282c] transition-all rounded-full p-[2px]">
                <MdClose
                  size={25}
                  color="#F0F0F0"
                  onClick={() => {
                    onClose();
                  }}
                />
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
                          copyToClipboard(modalData.activeGameSeed.clientSeed)
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
                          className="flex items-center justify-center h-full mx-2 px-5 py-1 my-auto bg-[#5F4DFF] text-white rounded-md font-bold text-sm"
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
              <div className="grid w-full text-white ">
                <div className="grid gap-2">
                  <div
                    className={`md:px-8 py-2 mt-6 px-4  pt-7 border-2 border-white border-opacity-5 rounded-md ${selectedGameType === GameType.roulette1 || selectedGameType === GameType.roulette2 ? "w-full h-[480px] flex items-center " : ""}
                    `}
                  >
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
      )}
    </>
  );
}
