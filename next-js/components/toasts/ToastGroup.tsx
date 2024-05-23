// import { toast } from 'react-toastify'
import toast, { ToastPosition, Toaster } from "react-hot-toast";
import { useState } from "react";
// import "react-toastify/dist/ReactToastify.css";
import Image from "next/legacy/image";
import { FaRegCheckCircle } from "react-icons/fa";
import { BsXCircle } from "react-icons/bs";
import { AiOutlineClose } from "react-icons/ai";
import { PiWarningCircle } from "react-icons/pi";
import styles from "./ToastGroup.module.css";

export const errorAlert = (text: any) => {
  toast.error(text, {
    position: "bottom-right",
    duration: 5000,
  });
};

export const errorAlertCenter = (text: any) => {
  toast.error(text, {
    position: "bottom-center",
    // autoClose: false,
    // hideProgressBar: false,
    // closeOnClick: true,
    // pauseOnHover: true,
    // draggable: true,
    // theme: 'colored',
  });
};

export const warningAlert = (text: any) => {
  toast.error(text, {
    position: "bottom-right",
    duration: 5000,
    // hideProgressBar: false,
    // closeOnClick: true,
    // pauseOnHover: true,
    // draggable: true,
    // theme: 'colored',
  });
};

export const successAlert = (text: any, state = null) => {
  if (state) {
    toast.success(text, {
      position: "bottom-right",
      // autoClose: false,
      // hideProgressBar: false,
      // closeOnClick: true,
      // pauseOnHover: true,
      // draggable: true,
      // theme: 'colored',
      // delay: 1000,
    });
  } else {
    toast.success(text, {
      position: "bottom-right",
      duration: 5000,
    });
  }
};

export const infoAlert = (text: any) => {
  toast.success(text, {
    position: "bottom-right",
    duration: 5000,
  });
};

export const successCustom = (
  text: any,
  duration?: number,
  position?: ToastPosition,
) => {
  toast.custom(
    (t) => (
      <div
        className={`h-12 min-w-[18rem] overflow-hidden ${
          t.visible ? "opacity-100" : "opacity-0"
        } flex flex-col rounded-md bg-[#17181A]`}
      >
        <div className="w-full h-11 flex flex-row px-3 gap-3 items-center">
          <FaRegCheckCircle className="w-5 h-5 text-fomo-green" />
          <span className="text-white text-sm flex-1">{text}</span>
          <AiOutlineClose
            onClick={() => {
              toast.dismiss(t.id);
            }}
            className="w-5 h-4 text-white"
          />
        </div>
        <div className="w-full h-1 bg-[#282E3D] bg-opacity-80">
          <div className={`h-1 bg-fomo-green ${styles.progressBar}`}></div>
        </div>
      </div>
    ),
    {
      duration: duration ?? 2000,
      position: position ?? "bottom-right",
    },
  );
};

export const errorCustom = (
  text: any,
  position?: ToastPosition,
  duration: number = 2000,
) => {
  toast.custom(
    (t) => (
      <div
        className={`h-12 min-w-[18rem] overflow-hidden ${
          t.visible ? "opacity-100" : "opacity-0"
        } flex flex-col rounded-md bg-[#17181A]`}
      >
        <div className="w-full h-11 flex flex-row px-3 gap-3 items-center">
          <BsXCircle className="w-5 h-5 text-fomo-red" />
          <span className="text-white text-sm flex-1">{text}</span>
          <AiOutlineClose
            onClick={() => {
              toast.dismiss(t.id);
            }}
            className="w-5 h-4 cursor-pointer text-white"
          />
        </div>
        <div className="w-full h-1 bg-[#282E3D] bg-opacity-80">
          <div className={`h-1 bg-fomo-red ${styles.progressBar}`}></div>
        </div>
      </div>
    ),
    {
      duration,
      position: position ?? "bottom-right",
    },
  );
};

export const warningCustom = (
  text: any,
  position?: ToastPosition,
  duration: number = 2000,
) => {
  toast.custom(
    (t) => (
      <div
        className={`h-12 min-w-[18rem] overflow-hidden ${
          t.visible ? "opacity-100" : "opacity-0"
        } flex flex-col rounded-md bg-[#17181A]`}
      >
        <div className="w-full h-11 flex flex-row px-3 gap-3 items-center">
          <PiWarningCircle className="w-6 h-6 text-[#7839C5]" />
          <span className="text-white text-sm flex-1">{text}</span>
          <AiOutlineClose
            onClick={() => {
              toast.dismiss(t.id);
            }}
            className="w-5 h-4 text-white"
          />
        </div>
        <div className="w-full h-1 bg-[#282E3D] bg-opacity-80">
          <div className={`h-1 bg-[#8795A8] ${styles.progressBar}`}></div>
        </div>
      </div>
    ),
    {
      duration,
      position: position ?? "bottom-right",
    },
  );
};
