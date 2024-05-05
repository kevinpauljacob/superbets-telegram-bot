import { obfuscatePubKey } from "@/context/transactions";
import { useGlobalContext } from "../GlobalContext";

interface BetRowProps {
  bet: any;
  all: boolean;
  openModal: () => void;
  setVerifyModalData: (data: any) => void;
}

const BetRow: React.FC<BetRowProps> = ({
  bet,
  all,
  openModal,
  setVerifyModalData,
}) => {
  const { setCurrentGame } = useGlobalContext();

  const Capitalize = (str: string) => {
    return str?.charAt(0).toUpperCase() + str?.slice(1);
  };

  return (
    <div
      className={
        "w-full flex items-center justify-between " +
        (!all ? "hover:cursor-pointer" : "")
      }
      onClick={() => {
        if (all) return;
        setCurrentGame(bet.game);
        setVerifyModalData(bet);
        openModal();
      }}
    >
      {all && (
        <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
          {obfuscatePubKey(bet.wallet)}
        </span>
      )}

      <span className="w-full md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        {Capitalize(bet.game)}
      </span>
      <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        {(bet.amount ?? 0).toFixed(4)}
      </span>
      <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        {bet.strikeMultiplier ?? 0}
      </span>
      <span
        className={`w-full text-center font-changa text-sm text-opacity-75 ${
          bet.result === "Lost"
            ? "text-[#CF304A]"
            : bet.result === "Won"
            ? "text-[#03A66D]"
            : "text-[#F0F0F0]"
        }`}
      >
        {bet.amountWon?.toFixed(4)} SOL
      </span>
    </div>
  );
};

export default BetRow;
