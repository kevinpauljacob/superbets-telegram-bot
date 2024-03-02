import { translator } from "@/context/transactions";
import { useGlobalContext } from "./GlobalContext";

export default function InfoBar() {
  const { language } = useGlobalContext();
  return (
    <div className="w-full sticky top-0 z-50 py-1 bg-[#C7F284] flex items-center justify-center text-black font-medium text-xs gap-5">
      <p className="text-center">
        {translator("Unique Players", language)} : <b>23.567</b>
      </p>
      <p className="text-center">
        {translator("Total Volume", language)} : <b>$435.567</b>
      </p>
      <p className="text-center">
        {translator("Total Volume", language)} : <b>$435.567</b>
      </p>
    </div>
  );
}
