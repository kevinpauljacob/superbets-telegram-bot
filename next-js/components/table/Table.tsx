import { useWallet } from "@solana/wallet-adapter-react";
import { ReactNode, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import BetRow from "../games/BetRow";
import { useGlobalContext } from "../GlobalContext";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import Loader from "../games/Loader";

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
    const visiblePages = 3;
    const currentPage = page;

    if (maxPages < 7)
      return [...Array(maxPages - visiblePages - 1)].map((_, i) => {
        const pageNumber = i + 3;
        return (
          <button
            key={i}
            onClick={() => setPage(pageNumber)}
            className={`${
              currentPage === pageNumber ? "text-opacity-75" : "text-opacity-50"
            } text-[#F0F0F0] transition-all cursor-pointer`}
          >
            {pageNumber}
          </button>
        );
      });

    if (currentPage <= visiblePages) {
      return [...Array(visiblePages)].map((_, i) => {
        const pageNumber = i + 3;
        return (
          <button
            key={i}
            onClick={() => setPage(pageNumber)}
            className={`${
              currentPage === pageNumber ? "text-opacity-75" : "text-opacity-50"
            } text-[#F0F0F0] transition-all cursor-pointer`}
          >
            {pageNumber}
          </button>
        );
      });
    }

    if (currentPage >= maxPages - 2) {
      return [...Array(visiblePages)].map((_, i) => {
        const pageNumber = maxPages - 4 + i;
        return (
          <button
            key={i}
            onClick={() => setPage(pageNumber)}
            className={`${
              currentPage === pageNumber ? "text-opacity-75" : "text-opacity-50"
            } text-[#F0F0F0] transition-all cursor-pointer`}
          >
            {pageNumber}
          </button>
        );
      });
    }

    const middlePage = Math.floor(visiblePages / 2);
    const startPage = currentPage - middlePage;
    const endPage = currentPage + middlePage;
    return [...Array(visiblePages)].map((_, i) => {
      const pageNumber = startPage + i;
      return (
        <button
          key={i}
          onClick={() => setPage(pageNumber)}
          className={`${
            currentPage === pageNumber ? "text-opacity-75" : "text-opacity-50"
          } text-[#F0F0F0] transition-all cursor-pointer`}
        >
          {pageNumber}
        </button>
      );
    });
  };

  return (
    <div className="pb-5 mt-4 flex w-full cursor-pointer items-center justify-center gap-6 font-changa">
      <button
        onClick={() => {
          if (page > 1) setPage(page - 1);
        }}
        className={`cursor-pointer text-[#F0F0F0] ${
          page > 1 ? "" : "opacity-50 pointer-events-none"
        }`}
      >
        <FaChevronLeft />
      </button>
      {bets && bets.length > 0 && (
        <>
          <button
            onClick={() => setPage(1)}
            className={`${
              page === 1 ? "text-opacity-75" : "text-opacity-50"
            } text-[#F0F0F0] transition-all cursor-pointer`}
          >
            1
          </button>
          {maxPages > 1 && (
            <button
              onClick={() => {
                (page === 1 || page === 2 || page === 3) && setPage(1);
              }}
              className={`${
                page === 2 ? "text-opacity-75" : "text-opacity-50"
              } text-[#F0F0F0] transition-all cursor-pointer`}
            >
              {page === 2 || page === 1 || page === 3 ? "2" : ". . . "}
            </button>
          )}
          {maxPages > 4 && renderPageNumbers()}
          {maxPages > 3 && (
            <button
              onClick={() => {
                (page === maxPages - 2 ||
                  page === maxPages - 1 ||
                  page === maxPages) &&
                  setPage(maxPages - 1);
              }}
              className={`${
                page === maxPages - 1 ? "text-opacity-75" : "text-opacity-50"
              } text-[#F0F0F0] transition-all cursor-pointer`}
            >
              {page === maxPages - 2 ||
              page === maxPages - 1 ||
              page === maxPages
                ? maxPages - 1
                : ". . ."}
            </button>
          )}
          {maxPages > 2 && (
            <button
              onClick={() => setPage(maxPages)}
              className={`${
                page === maxPages ? "text-opacity-75" : "text-opacity-50"
              } text-[#F0F0F0] transition-all cursor-pointer`}
            >
              {maxPages}
            </button>
          )}
        </>
      )}
      <button
        onClick={() => {
          if (page < maxPages) setPage(page + 1);
        }}
        className={`cursor-pointer text-[#F0F0F0] ${
          page < maxPages ? "" : "opacity-50 pointer-events-none"
        }`}
      >
        <FaChevronRight />
      </button>
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
      <div className="mb-[1.4rem] hidden md:flex w-full flex-row items-center gap-2 bg-[#121418] py-1 rounded-[5px]">
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
      <div className="mb-[1.4rem] flex md:hidden w-full flex-row items-center bg-[#121418] rounded-md py-1 gap-2">
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

interface TableProps extends TableButtonProps, PaginationProps {
  loading: boolean;
}

export const Table: React.FC<TableProps> = ({
  all,
  setAll,
  page,
  setPage,
  bets,
  maxPages,
  loading,
}) => {
  const transactionsPerPage = 10;

  const {
    isVerifyModalOpen: isOpen,
    setIsVerifyModalOpen: setIsOpen,
    openVerifyModal: openModal,
    closeVerifyModal: closeModal,
    setVerifyModalData,
  } = useGlobalContext();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.height = `${containerRef.current.scrollHeight}px`;
    }
  }, [loading]);

  return (
    <div
      className="flex w-full flex-col pb-[10rem] lg:pb-10"
      ref={containerRef}
    >
      <TableButtons all={all} setAll={setAll} />
      {loading ? (
        <div className="h-20">
          <Loader />
        </div>
      ) : (
        <>
          <div className="scrollbar mt-8 w-full pb-8">
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
                <span className="font-changa text-[#F0F0F080]">
                  No Bets made.
                </span>
              )}
            </div>
          </div>
          <TablePagination
            page={page}
            setPage={setPage}
            maxPages={maxPages}
            bets={bets}
          />
        </>
      )}
    </div>
  );
};
