import { FaInfoCircle } from "react-icons/fa";

export default function ToolTip({ element }: { element: any }) {
  return (
    <div className="z-30 group flex relative justify-start">
      <FaInfoCircle className="text-white text-opacity-30 text-lg" />
      <div className="hidden group-hover:flex max-w-[20rem] -ml-14 bg-[#171515] p-3 rounded-md absolute min-w-max top-full mt-2  items-center justify-center text-left">
        {element}
      </div>
    </div>
  );
}
