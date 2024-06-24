import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { translator } from "@/context/transactions";
import { useGlobalContext } from "@/components/GlobalContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { successCustom, errorCustom } from "../toasts/ToastGroup";
import { AdaptiveModal, AdaptiveModalContent } from "../AdaptiveModal";

export default function CreateCampaignModal() {
  const wallet = useWallet();
  const { language, showCreateCampaignModal, setShowCreateCampaignModal } =
    useGlobalContext();
  const [campaignName, setCampaignName] = useState("");
  const [campaignCode, setCampaignCode] = useState("");

  // const handleClose = () => {
  //   //@ts-ignore
  //   document.addEventListener("click", function (event) {
  //     //@ts-ignore
  //     var targetId = event.target.id;
  //     if (targetId && targetId === "pf-modal-bg") setModal(false);
  //   });
  // };

  const createCampaign = async (event: any) => {
    event.preventDefault();
    try {
      const response = await fetch(`/api/referral`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.publicKey,
          referralCode: campaignCode,
          campaignName: campaignName,
        }),
      });

      const { success, message } = await response.json();

      if (success) {
        successCustom(message);
        setShowCreateCampaignModal(false);
      } else {
        errorCustom(translator("Failed to create campaign!", language));
      }
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setCampaignCode("");
      setCampaignName("");
    }
  };

  return (
    <AdaptiveModal
      open={showCreateCampaignModal}
      onOpenChange={() => setShowCreateCampaignModal(false)}
    >
      <AdaptiveModalContent className="bg-[#121418] sm:overflow-y-auto min-h-[50dvh] max-h-[80dvh] w-full pb-6">
        <div className="px-8 sm:p-0">
          <div className="flex font-chakra tracking-wider text-2xl font-semibold text-[#F0F0F0] items-center justify-between">
            <div className="flex items-center gap-2 font-changa">
              {translator("Create Campaign", language)}
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
      </AdaptiveModalContent>
    </AdaptiveModal>
  );
}
