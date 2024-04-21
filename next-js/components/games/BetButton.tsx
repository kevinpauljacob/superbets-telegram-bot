import { ReactNode } from "react";

export default function BetButton({
  disabled,
  children,
  onClickFunction,
}: {
  disabled: boolean;
  children: ReactNode;
  onClickFunction: (data: any) => {};
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={onClickFunction}
      className={`disabled:cursor-default disabled:opacity-70 hover:duration-75 hover:opacity-90 w-full h-[3.75rem] rounded-lg transition-all bg-[#7839C5] disabled:bg-[#4b2876] hover:bg-[#9361d1] focus:bg-[#602E9E] flex items-center justify-center font-chakra font-semibold text-2xl tracking-wider text-white`}
    >
      {children}
    </button>
  );
}
