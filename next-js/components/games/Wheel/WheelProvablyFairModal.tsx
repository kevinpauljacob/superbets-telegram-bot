import {
  GameType,
  generateClientSeed,
  generateGameResult,
} from "@/utils/provably-fair";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Wheel } from "./VerifyWheelModal";
import toast from "react-hot-toast";
import { FaRegCopy } from "react-icons/fa6";
import { MdClose } from "react-icons/md";
import Arc from "@/components/games/Wheel/Arc";
import { riskToChance } from "@/components/games/Wheel/Segments";
import { verify } from "tweetnacl";
import CheckPF from "@/public/assets/CheckPF.svg";

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
  const [strikeNumber, setStrikeNumber] = useState<number>(0);
  const [strikeMultiplier, setStrikeMultiplier] = useState<number>();
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [hoveredMultiplier, setHoveredMultiplier] = useState<number | null>(
    null,
  );

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
          risk: bet.risk,
          segments: bet.segments,
        }
      : {
          clientSeed: "",
          serverSeed: "",
          nonce: "",
          risk: "low",
          segments: 10,
        },
  );

  useEffect(() => {
    setStrikeNumber(
      generateGameResult(
        verificationState.serverSeed,
        verificationState.clientSeed,
        parseInt(verificationState.nonce),
        GameType.wheel,
      ),
    );
  }, []);

  const multipliers = riskToChance[verificationState.risk];
  const sortedMultipliers = multipliers
    .slice()
    .sort((a, b) => a.multiplier - b.multiplier);

  const uniqueSegments = sortedMultipliers.filter(
    (segment, index, self) =>
      index === 0 || self[index - 1].multiplier !== segment.multiplier,
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

  useEffect(() => {
    const resultAngle = ((strikeNumber - 1) * 360) / 100;
    const rotationAngle = 360 / verificationState.segments;
    setRotationAngle(rotationAngle);
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${360 - resultAngle}deg)`;
    }

    const item = riskToChance[verificationState.risk];
    let strikeMultiplier = 0;

    for (let i = 0, isFound = false; i < 100 && !isFound; ) {
      for (let j = 0; j < item.length; j++) {
        i += (item[j].chance * 10) / verificationState.segments;
        if (i >= strikeNumber) {
          strikeMultiplier = item[j].multiplier;
          setStrikeMultiplier(strikeMultiplier);
          isFound = true;
          break;
        }
      }
    }
  }, [
    isOpen,
    strikeNumber,
    verificationState.risk,
    verificationState.segments,
  ]);

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
          <div className="bg-[#121418] max-h-[80dvh] modalscrollbar overflow-y-scroll p-8 rounded-lg z-10 w-11/12 sm:w-[32rem] -mt-[4.7rem] md:mt-0">
            <div className="flex font-chakra tracking-wider text-2xl font-semibold text-[#F0F0F0] items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src={CheckPF} alt="" />
                PROVABLY FAIR
              </div>
              <div className="hover:cursor-pointer">
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
                  <div className="mt-3">
                    <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                      Active Client Seed
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
                      Active Server Seed (Hashed)
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
                      Total Bets
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
                    Rotate Seed Pair
                  </div>
                  <div className="mt-2">
                    <div>
                      <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                        New Client Seed *
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
                          Change
                        </button>
                      </div>
                    </div>
                    <div className="mt-5">
                      <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
                        Next Server Seed
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
              <div className="grid w-full text-white">
                <div className="grid gap-2">
                  <div className="border-2 border-opacity-5 border-[#FFFFFF] md:px-8">
                    <div className="px-8 py-5">
                      <div className="flex justify-center items-center w-full">
                        <div className="relative  w-[200px] h-[200px] flex justify-center">
                          <Image
                            src="/assets/wheelPointer.svg"
                            alt="Pointer"
                            width={25}
                            height={25}
                            id="pointer"
                            className="absolute z-50 -top-2 transition-all duration-100"
                          />
                          <div
                            ref={wheelRef}
                            className="relative w-[200px] h-[200px] rounded-full overflow-hidden"
                          >
                            {typeof window !== "undefined" && (
                              <svg viewBox="0 0 300 300">
                                {rotationAngle &&
                                  Array.from({
                                    length: verificationState.segments,
                                  }).map((_, index) => (
                                    <Arc
                                      key={index}
                                      index={index}
                                      rotationAngle={rotationAngle}
                                      risk={verificationState.risk}
                                      segments={verificationState.segments}
                                    />
                                  ))}
                              </svg>
                            )}
                          </div>
                          <div className="absolute z-10 w-[79.75%] h-[79.75%] rounded-full bg-black/10 left-[10%] top-[10%]" />
                          <div className="absolute z-20 w-[66.5%] h-[66.5%] rounded-full bg-[#171A1F] left-[16.75%] top-[16.75%]" />
                          <div className="absolute z-20 w-[62.5%] h-[62.5%] rounded-full bg-[#0C0F16] left-[18.75%] top-[18.75%] text-white flex items-center justify-center text-2xl font-semibold font-changa text-opacity-80 ">
                            {strikeMultiplier}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {uniqueSegments.map((segment, index) => (
                          <div
                            key={index}
                            className="relative w-full"
                            onMouseEnter={() =>
                              setHoveredMultiplier(segment.multiplier)
                            }
                            onMouseLeave={() => setHoveredMultiplier(null)}
                          >
                            <div
                              className={`w-full border-t-[6px] text-center font-chakra font-semibold bg-[#202329] text-xs text-white rounded-md px-1.5 md:px-5 py-2.5`}
                              style={{ borderColor: segment.color }}
                            >
                              {segment.multiplier}x
                            </div>
                            {hoveredMultiplier === segment.multiplier && (
                              <div className="absolute top-[-80px] left-0 z-50 flex gap-2 text-white bg-[#202329] border border-white/10 rounded-lg w-full p-2 fadeInUp duration-100 min-w-[200px]">
                                <div className="w-1/2">
                                  <div className="flex justify-between text-[10px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                                    <span className="">Profit</span>
                                    <span>0.00 SOL</span>
                                  </div>
                                  <div className="border border-white/10 rounded-lg text-[10px] p-2 mt-2">
                                    0.00
                                  </div>
                                </div>
                                <div className="w-1/2">
                                  <div className="text-[10px] font-medium font-changa text-opacity-90 text-[#F0F0F0]">
                                    Chance
                                  </div>
                                  <div className="border border-white/10 rounded-lg text-[10px] p-2 mt-2">
                                    {segment.chance}%
                                  </div>
                                </div>
                              </div>
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
                        value={GameType.wheel}
                        onChange={(e) =>
                          setModalData((prevData) => ({
                            ...prevData,
                            game: e.target.value as GameType,
                          }))
                        }
                        className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative appearance-none"
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
                      className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative"
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
                      className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative"
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
                      className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative"
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
                        className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative appearance-none"
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
                        className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative appearance-none"
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
