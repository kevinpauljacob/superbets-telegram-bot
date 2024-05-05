import { useWallet } from "@solana/wallet-adapter-react";
import { ReactNode } from "react";
import toast from "react-hot-toast";
import BetRow from "../games/BetRow";
import { useGlobalContext } from "../GlobalContext";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

interface PaginationProps {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  bets: any[];
  maxPages: number;
}

export const TablePagination: React.FC<PaginationProps> = ({
  page,
  setPage,
  bets,
  maxPages,
}) => {
  const renderPageNumbers = () => {
    const visiblePages = 5; 
    const currentPage = page;

    if (maxPages <= visiblePages) {
      return [...Array(maxPages)].map((_, i) => {
        const pageNumber = i + 1;
        return (
          <span
            key={i}
            onClick={() => setPage(pageNumber)}
            className={`${
              currentPage === pageNumber ? "text-opacity-75" : "text-opacity-50"
            } text-[#F0F0F0] transition-all cursor-pointer`}
          >
            {pageNumber}
          </span>
        );
      });
    }

    if (currentPage <= visiblePages) {
      return [...Array(visiblePages)].map((_, i) => {
        const pageNumber = i + 1;
        return (
          <span
            key={i}
            onClick={() => setPage(pageNumber)}
            className={`${
              currentPage === pageNumber ? "text-opacity-75" : "text-opacity-50"
            } text-[#F0F0F0] transition-all cursor-pointer`}
          >
            {pageNumber}
          </span>
        );
      });
    }

    if (currentPage > maxPages - visiblePages) {
      return [...Array(visiblePages)].map((_, i) => {
        const pageNumber = maxPages - visiblePages + i + 1;
        return (
          <span
            key={i}
            onClick={() => setPage(pageNumber)}
            className={`${
              currentPage === pageNumber ? "text-opacity-75" : "text-opacity-50"
            } text-[#F0F0F0] transition-all cursor-pointer`}
          >
            {pageNumber}
          </span>
        );
      });
    }

    const middlePage = Math.floor(visiblePages / 2);
    const startPage = currentPage - middlePage;
    const endPage = currentPage + middlePage;
    return [...Array(visiblePages)].map((_, i) => {
      const pageNumber = startPage + i;
      return (
        <span
          key={i}
          onClick={() => setPage(pageNumber)}
          className={`${
            currentPage === pageNumber ? "text-opacity-75" : "text-opacity-50"
          } text-[#F0F0F0] transition-all cursor-pointer`}
        >
          {pageNumber}
        </span>
      );
    });
  };

  return (
    <div className="pb-5 mt-4 flex w-full cursor-pointer items-center justify-center gap-6 font-changa">
      <span
        onClick={() => {
          if (page > 1) setPage(page - 1);
        }}
        className={`cursor-pointer text-[#F0F0F0] ${
          page > 1 ? "" : "opacity-50 pointer-events-none"
        }`}
      >
        <FaChevronLeft />
      </span>
      {bets && bets.length > 0 && renderPageNumbers()}
      <span
        onClick={() => {
          if (page < maxPages) setPage(page + 1);
        }}
        className={`cursor-pointer text-[#F0F0F0] ${
          page < maxPages ? "" : "opacity-50 pointer-events-none"
        }`}
      >
        <FaChevronRight />
      </span>
    </div>
  );
};


interface TableButtonProps {
  all: boolean;
  setAll: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TableButtons: React.FC<TableButtonProps> = ({ all, setAll }) => {
  const wallet = useWallet();
  return (
    <div className="mt-[1rem] md:mt-[3.5rem] flex w-full items-center justify-center gap-4 md:justify-start">
      <button
        onClick={() => {
          if (wallet.publicKey) setAll(false);
          else toast.error("Wallet not connected");
        }}
        className={`${
          all ? "bg-[#202329] hover:bg-[#47484A]" : "bg-[#7839C5]"
        } w-full transform rounded-[5px] px-8 py-2 font-changa text-xl text-white transition duration-200 md:w-fit`}
      >
        My Bets
      </button>
      <button
        onClick={() => {
          setAll(true);
        }}
        className={`${
          all ? "bg-[#7839C5]" : "bg-[#202329] hover:bg-[#47484A]"
        } w-full transform rounded-[5px] px-8 py-2 font-changa text-xl text-white transition duration-200 md:w-fit`}
      >
        All Bets
      </button>
    </div>
  );
};

interface TableNodeProps {
  children: ReactNode;
}

export const TableHeader = ({ all, setAll }: TableButtonProps) => {
  const headers = ["Game", "Bet Amount", "Multiplier", "Payout"];
  const allHeaders = ["Wallet", ...headers];

  const smallScreenHeaders = ["Game", "Payout"];

  return (
    <>
      <div className="mb-5 hidden md:flex w-full flex-row items-center gap-2 bg-[#121418] py-1 rounded-[5px]">
        {!all
          ? headers.map((header, index) => (
              <span
                key={index}
                className="w-full text-center font-changa text-[#F0F0F080]"
              >
                {header}
              </span>
            ))
          : allHeaders.map((header, index) => (
              <span
                key={index}
                className="w-full text-center font-changa text-[#F0F0F080]"
              >
                {header}
              </span>
            ))}
      </div>
      <div className="mb-5 flex md:hidden w-full flex-row items-center bg-[#121418] rounded-md py-1 gap-2">
        {smallScreenHeaders.map((header, index) => (
          <span
            key={index}
            className="w-full text-center font-changa text-[#F0F0F080]"
          >
            {header}
          </span>
        ))}
      </div>
    </>
  );
};

export const TableRow: React.FC<TableNodeProps> = ({ children }) => {
  return children;
};

interface TableProps extends TableButtonProps, PaginationProps {}

export const Table: React.FC<TableProps> = ({
  all,
  setAll,
  page,
  setPage,
  bets,
  maxPages,
}) => {
  const transactionsPerPage = 10;
  const {
    isVerifyModalOpen: isOpen,
    setIsVerifyModalOpen: setIsOpen,
    openVerifyModal: openModal,
    closeVerifyModal: closeModal,
    setVerifyModalData,
  } = useGlobalContext();
  return (
    <div className="flex w-full flex-col pb-10">
      <TableButtons all={all} setAll={setAll} />
      <div className="scrollbar mt-8 w-full md:overflow-x-auto pb-8">
        <div className="flex w-full md:min-w-[50rem] flex-col items-center">
          <TableHeader all={all} setAll={setAll} />

          {bets.length ? (
            bets
              .slice(
                page * transactionsPerPage - transactionsPerPage,
                page * transactionsPerPage,
              )
              .map((bet, index) => (
                <div
                  key={index}
                  className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] py-3"
                >
                  <BetRow
                    bet={bet}
                    all={all}
                    openModal={openModal}
                    setVerifyModalData={setVerifyModalData}
                  />
                </div>
              ))
          ) : (
            <span className="font-changa text-[#F0F0F080]">No Bets made.</span>
          )}
        </div>
      </div>
      <TablePagination
        page={page}
        setPage={setPage}
        maxPages={maxPages}
        bets={bets}
      />
    </div>
  );
};
