import { useGlobalContext } from "../GlobalContext";

export default function BalanceAlert() {
  const { coinData, setShowWalletModal } = useGlobalContext();
  return (
    (!coinData || (coinData && coinData[0].amount < 0.0001)) && (
      <div className="mb-5 w-full rounded-lg bg-[#0C0F16] px-3 pt-4 text-white md:px-6">
        <div className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
          Please deposit funds to start playing. View{" "}
          <u
            onClick={() => {
              setShowWalletModal(true);
            }}
            className="cursor-pointer"
          >
            WALLET
          </u>
        </div>
      </div>
    )
  );
}
