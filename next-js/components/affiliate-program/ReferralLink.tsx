import { formatNumber, translator } from "@/context/transactions";
import { useState, useEffect } from "react";
import { copyToClipboard } from "@/pages/affiliate-program";
import { useGlobalContext } from "../GlobalContext";

export default function ReferralLink({
  campaignName,
  referralCode,
  totalEarnings,
  signupCount,
}: {
  campaignName: string;
  referralCode: string;
  totalEarnings: Record<string, any>;
  signupCount: number;
}) {
  const [earnings, setEarnings] = useState(0);
  const [buttonText, setButtonText] = useState("Copy");
  const { language } = useGlobalContext();

  const calculatedTotalEarnings = () => {
    let total = 0;
    for (let key in totalEarnings) {
      total += totalEarnings[key];
    }
    setEarnings(total);
  };

  useEffect(() => {
    calculatedTotalEarnings();
  }, [totalEarnings]);

  return (
    <div className="flex items-center justify-between bg-staking-bg rounded-[10px] py-4 px-3.5 sm:px-5 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-[14px]">
        <p className="text-white font-chakra font-semibold sm:text-lg">
          {campaignName}
        </p>
        <div className="flex gap-[12px]">
          <span className="bg-white/5 rounded-[5px] text-sm font-chakra text-[#94A3B8] font-normal px-4 py-2">
            {`referralCode=${referralCode}`}
          </span>
          <button
            onClick={() => {
              copyToClipboard(
                `https://superbets.games?referralCode=${referralCode}`,
              );
              setButtonText("Copied!");
              setTimeout(() => {
                setButtonText("Copy");
              }, 2000);
            }}
            className="bg-[#5F4DFF] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] transition-all cursor-pointer rounded-[5px] text-white/75 text-[13px] font-chakra font-medium px-5"
          >
            {translator(buttonText, language)}
          </button>
        </div>
      </div>
      <div className="hidden sm:flex gap-[14px]">
        <p className="bg-white/5 rounded-[5px] text-sm font-chakra text-[#94A3B8] font-normal px-4 py-2">
          {translator("Signups", language)} :{" "}
          <span className="font-chakra text-[13px] font-semibold text-[#94A3B8]">
            {signupCount}
          </span>
        </p>
        <p className="bg-white/5 rounded-[5px] text-sm font-chakra text-[#94A3B8] font-normal px-4 py-2">
          {translator("Total Earned", language)}:{" "}
          <span className="font-chakra text-[13px] font-semibold text-[#94A3B8]">
            ${formatNumber(earnings, 2)}
          </span>
        </p>
      </div>
    </div>
  );
}
