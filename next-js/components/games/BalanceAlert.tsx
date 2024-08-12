import { translator } from "@/context/transactions";
import { useGlobalContext } from "../GlobalContext";
import { useSession } from "next-auth/react";

export default function BalanceAlert() {
  const {
    setShowWalletModal,
    setShowConnectModal,
    language,
    selectedCoin,
    minGameAmount,
    session,
    status,
  } = useGlobalContext();
  return (
    (!selectedCoin ||
      (selectedCoin && selectedCoin.amount < minGameAmount) ||
      !(status === "authenticated")) && (
      <div className="mt-5 w-full rounded-lg bg-[#0C0F16] px-3 pt-4 text-white md:px-6">
        <div className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
          {translator("Please deposit funds to start playing. View", language)}{" "}
          <u
            onClick={() => {
              status === "authenticated"
                ? setShowWalletModal(true)
                : setShowConnectModal(true);
            }}
            className="cursor-pointer"
          >
            {translator("WALLET", language)}
          </u>
        </div>
      </div>
    )
  );
}
