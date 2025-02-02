import { useGlobalContext } from "./GlobalContext";
import { translator } from "@/context/transactions";

export default function ConfigureAutoButton({
  disabled = true,
}: {
  disabled: boolean;
}) {
  const { useAutoConfig, setShowAutoModal, language } = useGlobalContext();
  
  return (
    <button
      type="button"
      onClick={() => {
        setShowAutoModal(true);
      }}
      disabled={disabled}
      className={`${
        disabled ? "cursor-default" : "cursor-pointer"
      } disabled:opacity-50 flex relative mb-[1.4rem] rounded-md w-full h-[3.75rem] lg:h-11 items-center justify-center opacity-75 text-white text-opacity-90 border-2 border-white bg-white bg-opacity-0 hover:bg-opacity-5`}
    >
      {translator("Configure Auto", language)}
      <div
        className={`${
          useAutoConfig ? "bg-fomo-green" : "bg-fomo-red"
        } absolute top-0 right-0 m-1.5 bg-fomo-green w-2 h-2 rounded-full`}
      />
    </button>
  );
}