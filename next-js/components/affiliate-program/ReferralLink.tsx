import { formatNumber } from "@/context/transactions";
import { useState, useEffect } from "react";

export default function ReferralLink({
  campaignName,
  referralCode,
  totalEarnings,
}: {
  campaignName: string;
  referralCode: string;
  totalEarnings: Record<string, any>;
}) {
  const [earnings, setEarnings] = useState(0);
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
    <div className="flex items-center justify-between bg-staking-bg rounded-[10px] py-4 px-5 mb-4">
      <div className="flex items-center gap-[14px]">
        <p className="text-white font-chakra font-semibold text-lg">
          {campaignName}
        </p>
        <div className="flex gap-[12px]">
          <span className="bg-white/5 rounded-[5px] text-sm font-chakra text-[#94A3B8] font-normal px-4 py-2">
            {`http://localhost:3000?referralCode=${referralCode}`}
          </span>
          <button className="bg-[#7839C5] rounded-[5px] text-white/75 text-[13px] font-chakra font-medium px-5">
            Copy
          </button>
        </div>
      </div>
      <div className="flex gap-[14px]">
        <p className="bg-white/5 rounded-[5px] text-sm font-chakra text-[#94A3B8] font-normal px-4 py-2">
          Signups :{" "}
          <span className="font-chakra text-[13px] font-semibold text-[#94A3B8]">
            45
          </span>
        </p>
        <p className="bg-white/5 rounded-[5px] text-sm font-chakra text-[#94A3B8] font-normal px-4 py-2">
          Total Earned :{" "}
          <span className="font-chakra text-[13px] font-semibold text-[#94A3B8]">
            ${formatNumber(earnings, 2)}
          </span>
        </p>
      </div>
    </div>
  );
}
