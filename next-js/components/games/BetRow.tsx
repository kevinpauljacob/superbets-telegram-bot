import { obfuscatePubKey, translator } from "@/context/transactions";
import { useGlobalContext } from "../GlobalContext";
import Image from "next/image";

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
  const { setCurrentGame, language } = useGlobalContext();

  const Capitalize = (str: string) => {
    return str?.charAt(0).toUpperCase() + str?.slice(1);
  };

  return (
    <div
      className="w-full flex items-center justify-between cursor-pointer"
      onClick={() => {
        setCurrentGame(bet.game);
        setVerifyModalData(bet);
        openModal();
      }}
    >
      {all && (
        <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
          <p className="flex items-center justify-center gap-2">
            <Image
              src={`/assets/badges/T-${bet.userTier}.png`}
              alt="badge"
              width={20}
              height={20}
            />
            {obfuscatePubKey(bet.wallet)}
          </p>
        </span>
      )}

      <span className="w-full md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        <p className="flex items-center justify-center gap-2">
          <Image
            src={`/assets/live-win-cards/${bet.game}.png`}
            alt={bet.game}
            width={25}
            height={25}
            className="rounded-md"
          />
          {translator(Capitalize(bet.game), language)}
        </p>
      </span>
      <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        {(bet.amount ?? 0).toFixed(4)}
      </span>
      <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        {bet.strikeMultiplier ?? 0}
      </span>
      {bet.result === "Pending" ? (
        <span className="w-full text-center font-changa text-sm text-opacity-75 text-[#F0F0F0]">
          {translator("Pending", language)}
        </span>
      ) : bet.amountWon > bet.amount ? (
        <span className="w-full text-center font-changa text-sm text-opacity-75 text-fomo-green">
          {bet.amountWon.toFixed(4)} SOL
        </span>
      ) : (
        <span className="w-full text-center font-changa text-sm text-opacity-75 text-fomo-red">
          {(bet.amountWon - bet.amount).toFixed(4)} SOL
        </span>
      )}
    </div>
  );
};

export default BetRow;
