import { obfuscatePubKey } from "@/context/transactions";

interface BetRowProps {
  bet: any;
  all: boolean;
}

const BetRow: React.FC<BetRowProps> = ({ bet, all }) => {
  return (
    <>
      {all && (
        <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
          {obfuscatePubKey(bet.wallet)}
        </span>
      )}
      <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        Name
      </span>
      <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        {(bet.amount ?? 0).toFixed(4)}
      </span>
      <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        Multiplier
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
    </>
  );
};

export default BetRow;
