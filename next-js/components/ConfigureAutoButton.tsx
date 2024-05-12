import { useGlobalContext } from "./GlobalContext";

export default function ConfigureAutoButton({disabled=false}:{disabled?: boolean}) {
  const { useAutoConfig, setShowAutoModal } = useGlobalContext();
  console.log("Configure Auto:", disabled)
  return (
    <button
      onClick={() => {
        setShowAutoModal(true);
      }}
      disabled={disabled} 
      className={`${disabled ?"cursor-not-allowed" : "cursor-pointer"} flex relative mb-[1.4rem] rounded-md w-full h-[3.75rem] lg:h-11 items-center justify-center opacity-75 text-white text-opacity-90 border-2 border-white bg-white bg-opacity-0 hover:bg-opacity-5`}
    >

      Configure Auto
    
      <div
        className={`${
          useAutoConfig ? "bg-fomo-green" : "bg-fomo-red"
        } absolute top-0 right-0 m-1.5 bg-fomo-green w-2 h-2 rounded-full`}
      />
    </button>
  );
}
