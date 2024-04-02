import { generateClientSeed } from "@/utils/vrf";
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

    //handling coin flip
    const [wonCoinFace, setWonCoinface] = useState<"heads" | "tails">("heads")
    const [selectedCoinFace, setSelectedCoinface] = useState<"heads" | "tails">("heads")
    
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

    const [wonFace, setWonFace] = useState<number>(2);
    const [selectedFace, setSelectedFace] = useState<number[]>([1]);

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
                    <div className="bg-[#121418] p-8 rounded-lg z-10 w-11/12 md:w-1/3">
                        <div className="font-changa text-[1.75rem] font-semibold text-white">
                            Provably Fair
                        </div>
                        <div className="my-4 flex w-full items-center justify-center">
                            <button
                                className={`px-4 py-2 mr-2 w-full text-white rounded-md ${state === "seeds"
                                    ? "bg-[#D9D9D9] bg-opacity-5"
                                    : "border-2 border-opacity-5 border-[#FFFFFF]"
                                    }`}
                                onClick={() => handleToggleState("seeds")}
                            >
                                Seeds
                            </button>
                            <button
                                className={`px-4 py-2 w-full text-white rounded-md ${state === "verify"
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
                                    <div className="border-2 border-opacity-5 border-[#FFFFFF] md:px-8 pt-8">
                                        {
                                            modalData.game === "COIN_FLIP" ?
                                                <div className="flex justify-center items-center gap-4 md:px-8 py-4">
                                                    <div className={`bg-[#202329] py-4 px-4 rounded-md flex gap-2 items-center justify-center min-w-1/3 ${wonCoinFace==="heads"? 'border-2 border-[#7839C5]': 'border-[rgb(192,201,210)]'}`}>
                                                        <div className="w-5 h-5 bg-[rgb(192,201,210)] border border-white rounded-full"></div>
                                                        <div className="font-changa text-xl font-semibold">Heads</div>
                                                    </div>
                                                    <div className={`bg-[#202329] py-4 px-4 rounded-md flex gap-2 items-center justify-center min-w-1/3  ${wonCoinFace==="tails"? 'border-2 border-[#7839C5]': 'border-[rgb(192,201,210)]'}`}>
                                                        <div className="w-5 h-5 bg-[#FFC20E] rounded-full"></div>
                                                        <div className="font-changa text-xl font-semibold">Tails</div>
                                                    </div>
                                                </div>
                                                :
                                                modalData.game === "DICE" ?
                                                    <div className="px-8">
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
                                                                    <Image
                                                                        src="/assets/progressTip.png"
                                                                        alt="progress bar"
                                                                        width={13}
                                                                        height={13}
                                                                        className="absolute top-[2px]"
                                                                    />
                                                                    <Image
                                                                        src={
                                                                            wonFace === 1 ?
                                                                                "/assets/activeDiceFace1.png"
                                                                                :
                                                                                selectedFaces[1]
                                                                                    ? "/assets/finalDiceFace1.png"
                                                                                    : "/assets/diceFace1.png"
                                                                        }
                                                                        width={50}
                                                                        height={50}
                                                                        alt=""
                                                                        className={`inline-block mt-6 ${selectedFace.includes(1) ? "selected-face" : ""
                                                                            }`}
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col items-center mr-2 sm:mr-0">
                                                                    <Image
                                                                        src="/assets/progressTip.png"
                                                                        alt="progress bar"
                                                                        width={13}
                                                                        height={13}
                                                                        className="absolute top-[2px]"
                                                                    />
                                                                    <Image
                                                                        src={
                                                                            wonFace === 2 ?
                                                                                "/assets/activeDiceFace2.png"
                                                                                :
                                                                                selectedFaces[2]
                                                                                    ? "/assets/finalDiceFace2.png"
                                                                                    : "/assets/diceFace2.png"
                                                                        }
                                                                        width={50}
                                                                        height={50}
                                                                        alt=""
                                                                        className={`inline-block mt-6 ${selectedFace.includes(2) ? "selected-face" : ""
                                                                            }`}
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col items-center mr-2 sm:mr-0">
                                                                    <Image
                                                                        src="/assets/progressTip.png"
                                                                        alt="progress bar"
                                                                        width={13}
                                                                        height={13}
                                                                        className="absolute top-[2px]"
                                                                    />
                                                                    <Image
                                                                        src={
                                                                            wonFace === 3 ?
                                                                                "/assets/activeDiceFace3.png"
                                                                                :
                                                                                selectedFaces[3]
                                                                                    ? "/assets/finalDiceFace3.png"
                                                                                    : "/assets/diceFace3.png"
                                                                        }
                                                                        width={50}
                                                                        height={50}
                                                                        alt=""
                                                                        className={`inline-block mt-6 ${selectedFace.includes(3) ? "selected-face" : ""
                                                                            }`}
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col items-center mr-2 sm:mr-0">
                                                                    <Image
                                                                        src="/assets/progressTip.png"
                                                                        alt="progress bar"
                                                                        width={13}
                                                                        height={13}
                                                                        className="absolute top-[2px]"
                                                                    />
                                                                    <Image
                                                                        src={
                                                                            wonFace === 4 ?
                                                                                "/assets/activeDiceFace4.png"
                                                                                :
                                                                                selectedFaces[4]
                                                                                    ? "/assets/finalDiceFace4.png"
                                                                                    : "/assets/diceFace4.png"
                                                                        }
                                                                        width={50}
                                                                        height={50}
                                                                        alt=""
                                                                        className={`inline-block mt-6 ${selectedFace.includes(4) ? "selected-face" : ""
                                                                            }`}
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col items-center mr-2 sm:mr-0">
                                                                    <Image
                                                                        src="/assets/progressTip.png"
                                                                        alt="progress bar"
                                                                        width={13}
                                                                        height={13}
                                                                        className="absolute top-[2px]"
                                                                    />
                                                                    <Image
                                                                        src={
                                                                            wonFace === 5 ?
                                                                                "/assets/activeDiceFace5.png"
                                                                                :
                                                                                selectedFaces[5]
                                                                                    ? "/assets/finalDiceFace5.png"
                                                                                    : "/assets/diceFace5.png"
                                                                        }
                                                                        width={50}
                                                                        height={50}
                                                                        alt=""
                                                                        className={`inline-block mt-6 ${selectedFace.includes(5) ? "selected-face" : ""
                                                                            }`}
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col items-center">
                                                                    <Image
                                                                        src="/assets/progressTip.png"
                                                                        alt="progress bar"
                                                                        width={13}
                                                                        height={13}
                                                                        className="absolute top-[2px]"
                                                                    />
                                                                    <Image
                                                                        src={
                                                                            wonFace === 6 ?
                                                                                "/assets/activeDiceFace6.png"
                                                                                :
                                                                                selectedFaces[6]
                                                                                    ? "/assets/finalDiceFace6.png"
                                                                                    : "/assets/diceFace6.png"
                                                                        }
                                                                        width={50}
                                                                        height={50}
                                                                        alt=""
                                                                        className={`inline-block mt-6 ${selectedFace.includes(6) ? "selected-face" : ""
                                                                            }`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    :
                                                    <div>
                                                    </div>

                                        }
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold">Game</label>
                                        <div className="flex items-center">
                                            <select
                                                name="game"
                                                value={modalData.game}
                                                onChange={handleChange}
                                                className="bg-[#202329] mt-1 rounded-md px-4 py-2 mb-4 w-full relative appearance-none"
                                            >
                                                <option value="DICE">Dice</option>
                                                <option value="COIN_FLIP">Coin Flip</option>
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
