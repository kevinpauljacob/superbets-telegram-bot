import { soundAlert } from "@/utils/soundUtils";
import { ReactNode, useEffect, useRef } from "react";
import { useGlobalContext } from "@/components/GlobalContext";
import { translator } from "@/context/transactions";

export default function BetButton({
  disabled,
  children,
  onClickFunction,
}: {
  disabled: boolean;
  children: ReactNode;
  onClickFunction?: (data: any) => void;
}) {
  const betButtonRef = useRef<HTMLButtonElement>(null);
  const { language, coinData, selectedCoin, enableSounds, minGameAmount } = useGlobalContext();

  useEffect(() => {
    const handleClick = () => {
      soundAlert("/sounds/betbutton.wav", !enableSounds);
    };

    const buttonElement = betButtonRef.current;
    if (buttonElement) {
      buttonElement.addEventListener("click", handleClick);
    }

    return () => {
      if (buttonElement) {
        buttonElement.removeEventListener("click", handleClick);
      }
    };
  }, [betButtonRef]);

  return (
    <button
      type="submit"
      disabled={
        disabled ||
        !coinData ||
        !selectedCoin ||
        (selectedCoin && selectedCoin.amount < minGameAmount)
      }
      onClick={onClickFunction}
      ref={betButtonRef}
      className={`disabled:cursor-default disabled:opacity-70 hover:duration-75 hover:opacity-90 w-full h-[3.75rem] rounded-lg transition-all bg-[#5F4DFF] disabled:bg-[#555555] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] flex items-center justify-center font-chakra font-semibold text-xl tracking-wider text-white`}
    >
      {translator(children as string, language)}
    </button>
  );
}
