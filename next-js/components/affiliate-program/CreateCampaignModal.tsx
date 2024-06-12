import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { translator } from "@/context/transactions";
import { useGlobalContext } from "@/components/GlobalContext";

type Props = {
  modal: boolean;
  setModal: (modal: boolean) => void;
};

export default function CoinFlipProvablyFairModal({ modal, setModal }: Props) {
  const { language } = useGlobalContext();
  const handleClose = () => {
    //@ts-ignore
    document.addEventListener("click", function (event) {
      //@ts-ignore
      var targetId = event.target.id;
      if (targetId && targetId === "pf-modal-bg") setModal(false);
    });
  };

  return (
    <div
      onClick={() => {
        handleClose();
      }}
      id="pf-modal-bg"
      className="absolute z-[150] left-0 top-0 flex h-full w-full items-center justify-center bg-[#33314680] backdrop-blur-[0px] transition-all"
    >
      <div className="bg-[#121418] max-h-[80dvh]  overflow-y-scroll p-8 rounded-lg z-10 w-11/12 sm:w-[32rem] -mt-[4.7rem] md:mt-0 nobar">
        <div className="flex font-chakra tracking-wider text-2xl font-semibold text-[#F0F0F0] items-center justify-between">
          <div className="flex items-center gap-2">
            {translator("Create Campaign", language)}
          </div>
          <div className="hover:cursor-pointer">
            <MdClose
              size={25}
              color="#F0F0F0"
              onClick={() => {
                setModal(false);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
