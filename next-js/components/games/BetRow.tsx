import {
  obfuscatePubKey,
  translator,
  truncateNumber,
} from "@/context/transactions";
import { useGlobalContext } from "../GlobalContext";
import Image from "next/image";
import { SPL_TOKENS } from "@/context/config";

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
        <div className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
          <div className="flex items-center justify-center gap-5 mr-8">
            {/* <div className="relative w-6 h-6">
              <Image
                src={`/assets/badges/T-${bet.userTier}.png`}
                alt="badge"
                layout="fill"
                objectFit="contain"
                objectPosition="center"
              />
            </div> */}
            <span className="w-[10%]">{bet?.wallet ? obfuscatePubKey(bet.wallet) : bet?.account}</span>
          </div>
        </div>
      )}

      <div className="w-full md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        <div className="w-full flex items-center justify-center gap-5 mr-5">
          <div className="relative w-6 h-6">
            <Image
              src={`/assets/live-win-cards/${bet.game}.png`}
              alt={bet.game}
              layout="fill"
              objectFit="contain"
              objectPosition="center"
              className="rounded-md"
            />
          </div>
          <span className="w-[10%]">
            {translator(Capitalize(bet.game), language)}
          </span>
        </div>
      </div>
      <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        {truncateNumber(bet?.amount ?? 0, 4)}
      </span>
      <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
        {truncateNumber(bet?.strikeMultiplier ?? 0)}
      </span>
      {bet.result === "Pending" ? (
        <span className="w-full text-center font-changa text-sm text-opacity-75 text-[#F0F0F0]">
          {translator("Pending", language)}
        </span>
      ) : (bet.game === "roulette" || bet.game === "roulette2") &&
        bet.amountLost > 0.0 ? (
        <span className="w-full text-center font-changa text-sm text-opacity-75 text-fomo-red">
          {truncateNumber(-bet.amountLost, 6)}{" "}
          {SPL_TOKENS.find((token) => token.tokenMint === bet?.tokenMint)
            ?.tokenName ?? ""}
        </span>
      ) : (bet.game === "roulette" || bet.game === "roulette2") &&
        bet.amountLost === 0 ? (
        <span className="w-full text-center font-changa text-sm text-opacity-75 text-fomo-green">
          {truncateNumber(bet.amountWon, 6)}{" "}
          {SPL_TOKENS.find((token) => token.tokenMint === bet?.tokenMint)
            ?.tokenName ?? ""}
        </span>
      ) : bet.amountWon > bet.amount ? (
        <span className="w-full text-center font-changa text-sm text-opacity-75 text-fomo-green">
          {truncateNumber(bet.amountWon, 4)}{" "}
          {SPL_TOKENS.find((token) => token.tokenMint === bet?.tokenMint)
            ?.tokenName ?? ""}
        </span>
      ) : (
        <span className="w-full text-center font-changa text-sm text-opacity-75 text-fomo-red">
          {truncateNumber(bet?.amountWon - bet.amount, 4)}{" "}
          {SPL_TOKENS.find((token) => token.tokenMint === bet?.tokenMint)
            ?.tokenName ?? ""}
        </span>
      )}
    </div>
  );
};

export default BetRow;
