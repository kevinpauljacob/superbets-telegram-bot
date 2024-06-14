import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { translator } from "@/context/transactions";
import { useGlobalContext } from "@/components/GlobalContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { successCustom, errorCustom } from "../toasts/ToastGroup";

type Props = {
  modal: boolean;
  setModal: (modal: boolean) => void;
};

export default function CoinFlipProvablyFairModal({ modal, setModal }: Props) {
  const wallet = useWallet();
  const { language } = useGlobalContext();
  const [campaignName, setCampaignName] = useState("");
  const [campaignCode, setCampaignCode] = useState("");

  const handleClose = () => {
    //@ts-ignore
    document.addEventListener("click", function (event) {
      //@ts-ignore
      var targetId = event.target.id;
      if (targetId && targetId === "pf-modal-bg") setModal(false);
    });
  };

  const createCampaign = async (event: any) => {
    event.preventDefault();
    try {
      const response = await fetch(`/api/games/referralCode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          referralCode: campaignCode,
        }),
      });

      const { success, message } = await response.json();

      if (success) {
        successCustom(message);
      } else {
        errorCustom(message);
      }
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setCampaignCode("");
      setCampaignName("");
    }
  };

  return (
    <div
      onClick={() => {
        handleClose();
      }}
      id="pf-modal-bg"
      className="absolute z-[150] left-0 top-0 flex h-full w-full items-center justify-center bg-[#33314680] backdrop-blur-[0px] transition-all"
    >
      <div className="bg-[#121418] max-h-[80dvh]  overflow-y-scroll p-8 rounded-lg z-10 w-11/12 sm:w-[32rem] -mt-[4.7rem] md:mt-0 nobar">
        <div className="flex font-chakra tracking-wider text-2xl font-semibold text-[#F0F0F0] items-center justify-between">
          <div className="flex items-center gap-2 font-changa">
            {translator("Create Campaign", language)}
          </div>
          <div className="hover:cursor-pointer">
            <MdClose
              size={25}
              color="#F0F0F0"
              onClick={() => {
                setModal(false);
              }}
            />
          </div>
        </div>
        <form onSubmit={(event) => createCampaign(event)}>
          <div className="mt-4">
            <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
              {translator("Campaign Name", language)}
            </label>
            <input
              type="text"
              name="Campaign Name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="font-chakra bg-[#202329] text-[#94A3B8] text-base mt-1 rounded-[5px] px-5 py-4 w-full relative flex items-center justify-between"
            />
          </div>
          <div className="mt-4">
            <label className="text-xs font-changa text-opacity-90 text-[#F0F0F0]">
              {translator("Code (Campaign ID)", language)}
            </label>
            <input
              type="text"
              name="Code (Campaign ID)"
              value={campaignCode}
              onChange={(e) => setCampaignCode(e.target.value)}
              className="font-chakra bg-[#202329] text-[#94A3B8] text-base mt-1 rounded-[5px] px-5 py-4 w-full relative flex items-center justify-between"
            />
          </div>
          <button
            type="submit"
            className="bg-[#7839C5] rounded-[5px] font-chakra uppercase font-semibold text-lg text-center text-white w-full mt-11 py-4"
          >
            {translator("Create Campaign", language)}
          </button>
        </form>
      </div>
    </div>
  );
}
