import toast from "react-hot-toast";

interface InfoToastProps {
  message: string;
  toast: any;
}

const InfoToast: React.FC<InfoToastProps> = ({ message, toast }) => {
  return (
    <div className="border-2 border-[#292C32] bg-[#202329] text-blue-500 font-semibold px-4 py-2 rounded-md flex items-center">
      <div className="mr-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <span className="font-chakra text-white text-opacity-90 pt-0.5 bg-[#292C32]">{message}</span>
    </div>
  );
};

const showInfoToast = (message: string) => {
  toast.custom((t) => <InfoToast message={message} toast={t} />, {
    position: "top-right",
    duration: 3000,
  });
};

export default showInfoToast;
