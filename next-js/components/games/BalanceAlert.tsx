import { translator } from "@/context/transactions";
import { useGlobalContext } from "../GlobalContext";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { handleSignIn } from "../ConnectWallet";

export default function BalanceAlert() {
  const { data: session, status } = useSession();
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const { setShowWalletModal, language, selectedCoin, minGameAmount } =
    useGlobalContext();
  return (
    (!selectedCoin ||
      (selectedCoin && selectedCoin.amount < minGameAmount) ||
      !wallet.connected ||
      !(status === "authenticated")) && (
      <div className="mt-5 w-full rounded-lg bg-[#0C0F16] px-3 pt-4 text-white md:px-6">
        <div className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
          {translator("Please deposit funds to start playing. View", language)}{" "}
          <u
            onClick={() => {
              wallet.connected && status === "authenticated"
                ? setShowWalletModal(true)
                : handleSignIn(wallet, walletModal);
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
