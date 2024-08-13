import { User, connection, translator } from "@/context/transactions";
import { houseEdgeTiers, pointTiers, stakingTiers } from "@/context/config";
import { launchPromoEdge } from "@/context/config";
import { useWallet } from "@solana/wallet-adapter-react";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { successCustom, errorCustom } from "./toasts/ToastGroup";
import SOL from "@/public/assets/coins/SOL";
import { GameType } from "@/utils/provably-fair";
import { SPL_TOKENS } from "@/context/config";
import { useSession } from "next-auth/react";
import { SessionUser } from "./ConnectWallet";
import SUPER from "@/public/assets/coins/SUPER";

export interface GameStat {
  game: GameType;
  amount: number;
  pnl: number;
  totalPNL: number;
  token: string;
  result: "Won" | "Lost";
}

interface PointTier {
  index: number;
  limit: number;
  image: string;
  label: string;
}
interface TokenAccount {
  mintAddress: string;
  balance: number;
}
interface CoinBalance {
  amount: number;
  tokenMint: string;
  tokenName: string;
  icon: any;
}

interface ProvablyFairData {
  activeGameSeed: {
    account: string;
    clientSeed: string;
    serverSeed: string;
    serverSeedHash: string;
    nonce: number;
    status: string;
  };
  nextGameSeed: {
    account: string;
    clientSeed: string;
    serverSeed: string;
    serverSeedHash: string;
    nonce: number;
    status: string;
  };
}

interface AutoConfigOptions {
  autoWinChange: number | null;
  autoLossChange: number | null;
  autoWinChangeReset: boolean;
  autoLossChangeReset: boolean;
  autoStopProfit: number | null;
  autoStopLoss: number | null;
  useAutoConfig: boolean;
}

interface LiveTokenPrice {
  mintAddress: string;
  price: number; // 1 Token Price in USD
}

interface Deposit {
  amount: number;
  tokenMint: string;
}
interface MyUser {
  _id: string;
  email: string;
  __v: number;
  createdAt: string;
  deposit: Deposit;
  gamesPlayed: any[]; // Assuming gamesPlayed is an array of any type. Adjust if you have more information.
  image: string;
  isOptionOngoing: boolean;
  isUSDCClaimed: boolean;
  isWeb2User: boolean;
  name: string;
  numOfGamesPlayed: number;
  updatedAt: string;
}

interface GlobalContextProps {
  // leaderboard
  myData: MyUser | null;
  setMyData: (myData: MyUser | null) => void;

  reached500: boolean;
  setReached500: (reached500: boolean) => void;

  isModalOpen: boolean;
  setIsModalOpen: (isModelOpen: boolean) => void;

  data: any[];
  setData: (data: any[]) => void;

  maxPages: number;
  setMaxPages: (maxPages: number) => void;

  claimInfo: {
    claimedCount: number;
    spotsLeft: number;
  };
  setClaimInfo: (claimInfo: {
    claimedCount: number;
    spotsLeft: number;
  }) => void;

  threshold: number;
  transactionsPerPage: number;

  getLeaderBoard: () => void;
  fetchClaimInfo: () => void;
  claimUSDCReward: () => void;

  loading: boolean;
  setLoading: (stake: boolean) => void;

  language: "en" | "ru" | "ko" | "ch";
  setLanguage: (language: "en" | "ru" | "ko" | "ch") => void;

  userData: User | null;
  setUserData: (userData: User | null) => void;

  stake: boolean;
  setStake: (stake: boolean) => void;

  stakeAmount: number;
  setStakeAmount: (amount: number) => void;

  fomoBalance: number;
  setFomoBalance: (amount: number) => void;

  livePrice: number;
  setLivePrice: (amount: number) => void;

  fomoPrice: number;
  setFomoPrice: (amount: number) => void;

  globalInfo: { users: number; stakedTotal: number; totalVolume: number };
  setGlobalInfo: (amount: {
    users: number;
    stakedTotal: number;
    totalVolume: number;
  }) => void;

  pointTier: PointTier;
  setPointTier: (pointTier: PointTier) => void;

  walletBalance: number;
  setWalletBalance: (walletBalance: number) => void;

  coinData: CoinBalance[] | null;
  setCoinData: (coinData: CoinBalance[] | null) => void;

  selectedCoin: CoinBalance;
  setSelectedCoin: (selectedCoin: CoinBalance) => void;

  showWalletModal: boolean;
  setShowWalletModal: React.Dispatch<React.SetStateAction<boolean>>;

  showCreateCampaignModal: boolean;
  setShowCreateCampaignModal: React.Dispatch<React.SetStateAction<boolean>>;

  isVerifyModalOpen: boolean;
  setIsVerifyModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  verifyModalData: any;
  setVerifyModalData: (verifyModalData: any) => void;

  sidebar: boolean;
  setSidebar: React.Dispatch<React.SetStateAction<boolean>>;

  mobileSidebar: boolean;
  setMobileSidebar: React.Dispatch<React.SetStateAction<boolean>>;

  openPFModal: boolean;
  setOpenPFModal: React.Dispatch<React.SetStateAction<boolean>>;

  showConnectModal: boolean;
  setShowConnectModal: React.Dispatch<React.SetStateAction<boolean>>;
  //configure auto
  showAutoModal: boolean;
  setShowAutoModal: React.Dispatch<React.SetStateAction<boolean>>;
  autoWinChange: number | null;
  setAutoWinChange: React.Dispatch<React.SetStateAction<number | null>>;
  autoLossChange: number | null;
  setAutoLossChange: React.Dispatch<React.SetStateAction<number | null>>;
  autoWinChangeReset: boolean;
  setAutoWinChangeReset: React.Dispatch<React.SetStateAction<boolean>>;
  autoLossChangeReset: boolean;
  setAutoLossChangeReset: React.Dispatch<React.SetStateAction<boolean>>;
  autoStopProfit: number | null;
  setAutoStopProfit: React.Dispatch<React.SetStateAction<number | null>>;
  autoStopLoss: number | null;
  setAutoStopLoss: React.Dispatch<React.SetStateAction<number | null>>;
  startAuto: boolean;
  setStartAuto: React.Dispatch<React.SetStateAction<boolean>>;
  useAutoConfig: boolean;
  setUseAutoConfig: React.Dispatch<React.SetStateAction<boolean>>;
  autoBetCount: number | string;
  setAutoBetCount: React.Dispatch<React.SetStateAction<number | string>>;
  autoBetProfit: number;
  setAutoBetProfit: React.Dispatch<React.SetStateAction<number>>;
  liveBets: any[];
  setLiveBets: React.Dispatch<React.SetStateAction<any[]>>;
  liveStats: GameStat[];
  setLiveStats: React.Dispatch<React.SetStateAction<GameStat[]>>;
  liveCurrentStat: GameType | "All";
  setLiveCurrentStat: React.Dispatch<React.SetStateAction<GameType | "All">>;
  showLiveStats: boolean;
  setShowLiveStats: React.Dispatch<React.SetStateAction<boolean>>;
  enableSounds: boolean;
  setEnableSounds: React.Dispatch<React.SetStateAction<boolean>>;

  autoConfigState: Map<string, AutoConfigOptions>;
  setAutoConfigState: React.Dispatch<
    React.SetStateAction<Map<string, AutoConfigOptions>>
  >;

  openVerifyModal: () => void;
  closeVerifyModal: () => void;

  getUserDetails: () => Promise<void>;
  getCurrentUserData: () => Promise<void>;
  getGlobalInfo: () => Promise<void>;
  getWalletBalance: () => Promise<void>;
  getBalance: () => Promise<void>;
  getProvablyFairData: () => Promise<ProvablyFairData | null>;

  currentGame: string | null;
  setCurrentGame: (currentGame: string | null) => void;

  houseEdge: number;
  setHouseEdge: (currentGame: number) => void;

  maxBetAmt: number | undefined;
  setMaxBetAmt: React.Dispatch<React.SetStateAction<number>>;

  minGameAmount: number;
  setMinGameAmount: React.Dispatch<React.SetStateAction<number>>;

  kenoRisk: "classic" | "low" | "medium" | "high";
  setKenoRisk: React.Dispatch<
    React.SetStateAction<"classic" | "low" | "medium" | "high">
  >;
  userTokens: TokenAccount[]; // Add this line
  setUserTokens: React.Dispatch<React.SetStateAction<TokenAccount[]>>;
  updatePNL: (
    game: GameType,
    win: boolean,
    betAmount: number,
    multiplier: number,
  ) => void;
  liveTokenPrice: LiveTokenPrice[];

  session: SessionUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

const GlobalContext = createContext<GlobalContextProps | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const wallet = useWallet();
  const { data: session, status } = useSession() as {
    data: SessionUser | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };

  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "ru" | "ko" | "ch">("en");
  const [userTokens, setUserTokens] = useState<TokenAccount[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [stake, setStake] = useState(true);
  const [stakeAmount, setStakeAmount] = useState<number>(0);
  const [fomoBalance, setFomoBalance] = useState<number>(0.0);
  const [livePrice, setLivePrice] = useState<number>(0.0);
  const [globalInfo, setGlobalInfo] = useState<{
    users: number;
    stakedTotal: number;
    totalVolume: number;
  }>({ users: 0, stakedTotal: 0, totalVolume: 0 });
  const [pointTier, setPointTier] = useState<PointTier>({
    index: 0,
    limit: 0,
    image: "/assets/bronze.png",
    label: "BRONZE",
  });

  const [walletBalance, setWalletBalance] = useState(0);
  const [coinData, setCoinData] = useState<CoinBalance[] | null>([
    {
      amount: 0,
      tokenMint: "SUPER",
      tokenName: "SUPER",
      icon: SUPER,
    },
  ]);
  const [selectedCoin, setSelectedCoin] = useState<CoinBalance>({
    amount: 0,
    tokenMint: "SUPER",
    tokenName: "SUPER",
    icon: SUPER,
  });

  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showCreateCampaignModal, setShowCreateCampaignModal] =
    useState<boolean>(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [verifyModalData, setVerifyModalData] = useState({});

  const [sidebar, setSidebar] = useState<boolean>(false);
  const [mobileSidebar, setMobileSidebar] = useState<boolean>(false);

  const [openPFModal, setOpenPFModal] = useState<boolean>(false);

  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);

  // configure auto
  const [showAutoModal, setShowAutoModal] = useState<boolean>(false);
  const [autoWinChange, setAutoWinChange] = useState<number | null>(null);
  const [autoLossChange, setAutoLossChange] = useState<number | null>(null);
  const [autoWinChangeReset, setAutoWinChangeReset] = useState<boolean>(true);
  const [autoLossChangeReset, setAutoLossChangeReset] = useState<boolean>(true);
  const [autoStopProfit, setAutoStopProfit] = useState<number | null>(null);
  const [autoStopLoss, setAutoStopLoss] = useState<number | null>(null);
  const [startAuto, setStartAuto] = useState<boolean>(false);
  const [useAutoConfig, setUseAutoConfig] = useState<boolean>(false);
  const [autoBetCount, setAutoBetCount] = useState<number | string>(1);
  const [autoBetProfit, setAutoBetProfit] = useState<number>(0);

  const [liveBets, setLiveBets] = useState<any[]>([]);
  const [liveStats, setLiveStats] = useState<GameStat[]>([]);
  const [showLiveStats, setShowLiveStats] = useState<boolean>(false);
  const [liveCurrentStat, setLiveCurrentStat] = useState<GameType | "All">(
    "All",
  );
  const [liveTokenPrice, setLiveTokenPrice] = useState<LiveTokenPrice[]>([]);
  const [enableSounds, setEnableSounds] = useState<boolean>(true);

  const [autoConfigState, setAutoConfigState] = useState<
    Map<string, AutoConfigOptions>
  >(new Map());

  // fomo live price
  const [fomoPrice, setFomoPrice] = useState<number>(0);
  const [currentGame, setCurrentGame] = useState<string | null>(null);

  const [houseEdge, setHouseEdge] = useState<number>(0);
  const [maxBetAmt, setMaxBetAmt] = useState<number>(0);
  const [minGameAmount, setMinGameAmount] = useState<number>(0.0001);
  const [kenoRisk, setKenoRisk] = useState<
    "classic" | "low" | "medium" | "high"
  >("classic");

  // leaderboard
  const [myData, setMyData] = useState<MyUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reached500, setReached500] = useState<boolean>(false);
  const [claimInfo, setClaimInfo] = useState({
    claimedCount: 0,
    spotsLeft: 10,
  });
  const [data, setData] = useState<any[]>([]);
  const [maxPages, setMaxPages] = useState<number>(0);
  const transactionsPerPage = 10;
  const threshold = 500;

  const openVerifyModal = () => {
    setIsVerifyModalOpen(true);
  };

  const closeVerifyModal = () => {
    setIsVerifyModalOpen(false);
  };

  const getLeaderBoard = async () => {
    try {
      const res = await fetch("/api/getInfo", {
        method: "POST",
        body: JSON.stringify({
          option: 4,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      let { success, message, users } = await res.json();
      if (success && Array.isArray(users)) {
        users = users.map((user, index) => {
          return {
            ...user,
            rank: index + 1,
          };
        });

        setMaxPages(Math.ceil(users.length / transactionsPerPage));

        setData(users);

        if (session?.user?.email) {
          let userInfo = users.find(
            (info: any) =>
              (info?.email && info?.email === session?.user?.email) ||
              (info?.wallet && info?.wallet === session?.user?.wallet),
          );

          if (userInfo.numOfGamesPlayed === 0) setIsModalOpen(true);

          setMyData(userInfo);
        }
      } else {
        setData([]);
        errorCustom(translator("Could not fetch leaderboard.", language));
      }
    } catch (e) {
      setData([]);
      errorCustom(translator("Could not fetch leaderboard.", language));
      console.error(e);
    }
  };

  const fetchClaimInfo = async () => {
    try {
      const response = await fetch("/api/games/user/claimUSDC");
      const data = await response.json();
      setClaimInfo(data);
    } catch (error) {
      console.error("Error fetching USDC claim information:", error);
    }
  };

  const claimUSDCReward = async () => {
    try {
      const response = await fetch("/api/games/user/claimUSDC", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: myData?._id,
          email: session?.user?.email,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchClaimInfo();
        getLeaderBoard();
        getBalance();
        successCustom("USDC reward claimed successfully.");
        setIsModalOpen(false);
      } else {
        errorCustom(translator(data.message, language));
      }
    } catch (error) {
      console.error("Error claiming USDC reward:", error);
      errorCustom(translator("Error claiming USDC reward.", language));
    }
  };

  const getCurrentUserData = async () => {
    try {
      const res = await fetch("/api/getInfo", {
        method: "POST",
        body: JSON.stringify({ option: 4 }),
        headers: { "Content-Type": "application/json" },
      });

      const { success, users } = await res.json();

      if (!success || !Array.isArray(users)) {
        console.error("Failed to fetch users or users data is invalid.");
        return null;
      }

      if (!session?.user?.email && !session?.user?.wallet) {
        console.error("No session user information available.");
        return null;
      }

      const userInfo = users.find(
        (info: any) =>
          (info?.email && info?.email === session?.user?.email) ||
          (info?.wallet && info?.wallet === session?.user?.wallet),
      );

      if (!userInfo) {
        console.error("User not found.");
        return null;
      }

      setMyData(userInfo);

      return userInfo;
    } catch (e) {
      console.error("Error fetching user data:", e);
      return null;
    }
  };

  const getUserDetails = async () => {
    if (wallet && wallet.publicKey)
      try {
        const res = await fetch("/api/getInfo", {
          method: "POST",
          body: JSON.stringify({
            option: 1,
            wallet: wallet.publicKey,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        const { success, message, user } = await res.json();

        if (success) {
          setUserData(user);
        } else console.error(message);

        const stakeAmount = user?.stakedAmount ?? 0;
        const stakingTier = Object.entries(stakingTiers).reduce(
          (prev, next) => {
            return stakeAmount >= next[1]?.limit ? next : prev;
          },
        )[0];

        setHouseEdge(
          launchPromoEdge || selectedCoin.tokenName === "FOMO"
            ? 0
            : houseEdgeTiers[parseInt(stakingTier)],
        );
      } catch (e) {
        // errorCustom("Unable to fetch balance.");
        console.error(e);
      }
  };

  const getGlobalInfo = async () => {
    try {
      const res = await fetch("/api/getInfo", {
        method: "POST",
        body: JSON.stringify({
          option: 3,
          wallet: wallet.publicKey,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { success, message, data } = await res.json();

      if (success) setGlobalInfo(data);
    } catch (e) {
      console.error(e);
    }
  };

  const updatePNL = async (
    game: GameType,
    win: boolean,
    betAmount: number,
    multiplier: number,
  ) => {
    let token = liveTokenPrice.find(
      (token) => token.mintAddress === selectedCoin.tokenMint,
    );
    if (!token)
      token = (await updateLivePrices()).find(
        (token) => token.mintAddress === selectedCoin.tokenMint,
      )!;

    betAmount = token.price * betAmount;

    let profit = win
      ? (multiplier * (1 - houseEdge) - 1) * betAmount
      : (multiplier - 1) * betAmount;
    let totalPNL = 0;

    if (liveStats.length > 0)
      totalPNL = liveStats[liveStats.length - 1].totalPNL;

    totalPNL += profit;

    setLiveStats([
      ...liveStats,
      {
        game: game,
        amount: betAmount,
        result: win ? "Won" : "Lost",
        pnl: profit,
        totalPNL,
        token: selectedCoin.tokenMint,
      },
    ]);
  };

  const updateLivePrices = async () => {
    let prices = [];
    try {
      let data = await (
        await fetch(
          `https://price.jup.ag/v6/price?ids=${SPL_TOKENS.map(
            (x) => x.tokenMint,
          ).join(",")}&vsToken=USDC`,
        )
      ).json();

      for (let token of SPL_TOKENS) {
        let price =
          data?.data[token.tokenMint]?.price ?? token?.tokenMint === "SUPER"
            ? 1
            : 0;
        prices.push({ mintAddress: token.tokenMint, price: price });
      }
      setLiveTokenPrice(prices);
    } catch (e) {
      console.error("Could not fetch prices!");
    }
    return prices;
  };

  useEffect(() => {
    updateLivePrices();
    setInterval(
      () => {
        updateLivePrices();
      },
      5 * 60 * 1000,
    );
  }, []);

  const getWalletBalance = async () => {
    if (wallet && wallet.publicKey)
      try {
        setWalletBalance(
          (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL,
        );
      } catch (e) {
        // errorCustom("Unable to fetch balance.");
        console.error(e);
      }
  };

  const getBalance = async () => {
    setLoading(true);
    try {
      if (wallet?.publicKey || session?.user.email) {
        let query = session?.user?.wallet
          ? `wallet=${wallet.publicKey?.toBase58()}`
          : `email=${session?.user?.email}`;
        fetch(`/api/games/user/getUser?${query}`)
          .then((res) => res.json())
          .then((balance) => {
            if (
              balance.success &&
              balance?.data?.deposit &&
              balance?.data.deposit.length > 0
            ) {
              setCoinData(balance.data.deposit);
              let prevCoin = selectedCoin;
              let coin = balance.data.deposit.find(
                (token: CoinBalance) => token.tokenName === prevCoin.tokenName,
              );
              if (coin) setSelectedCoin({ ...coin, icon: prevCoin.icon });
            } else {
              setCoinData(null);
            }
            setLoading(false);
          });
      }
    } catch (e) {
      setLoading(false);
      setCoinData(null);
      console.error(e);
    }
  };

  const getProvablyFairData = async () => {
    let query = {};
    if (session?.user)
      query = { wallet: session?.user?.wallet, email: session?.user?.email };
    try {
      const res = await fetch(`/api/games/gameSeed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });

      let data = await res.json();
      if (data.success) return data;
      else return null;
    } catch (e) {
      errorCustom(translator("Unable to fetch provably fair data.", language));
      return null;
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        session,
        status,
        loading,
        setLoading,
        language,
        setLanguage,
        userData,
        setUserData,
        myData,
        setMyData,
        isModalOpen,
        setIsModalOpen,
        data,
        setData,
        maxPages,
        setMaxPages,
        claimInfo,
        setClaimInfo,
        threshold,
        transactionsPerPage,
        reached500,
        setReached500,
        getLeaderBoard,
        fetchClaimInfo,
        claimUSDCReward,
        stake,
        setStake,
        stakeAmount,
        setStakeAmount,
        fomoBalance,
        setFomoBalance,
        livePrice,
        setLivePrice,
        fomoPrice,
        setFomoPrice,
        globalInfo,
        setGlobalInfo,
        pointTier,
        setPointTier,
        walletBalance,
        setWalletBalance,
        coinData,
        showWalletModal,
        showCreateCampaignModal,
        isVerifyModalOpen,
        setIsVerifyModalOpen,
        verifyModalData,
        setVerifyModalData,
        sidebar,
        setSidebar,
        mobileSidebar,
        setMobileSidebar,
        showConnectModal,
        setShowConnectModal,
        openPFModal,
        setOpenPFModal,
        showAutoModal,
        setShowAutoModal,
        autoWinChange,
        setAutoWinChange,
        autoLossChange,
        setAutoLossChange,
        autoWinChangeReset,
        setAutoWinChangeReset,
        autoLossChangeReset,
        setAutoLossChangeReset,
        autoStopProfit,
        setAutoStopProfit,
        autoStopLoss,
        setAutoStopLoss,
        startAuto,
        setStartAuto,
        autoBetCount,
        setAutoBetCount,
        autoBetProfit,
        setAutoBetProfit,
        liveBets,
        setLiveBets,
        autoConfigState,
        setAutoConfigState,
        useAutoConfig,
        setUseAutoConfig,
        currentGame,
        setCurrentGame,
        houseEdge,
        setHouseEdge,
        maxBetAmt,
        minGameAmount,
        setMinGameAmount,
        kenoRisk,
        setKenoRisk,
        setMaxBetAmt,
        openVerifyModal,
        closeVerifyModal,
        setShowWalletModal,
        setShowCreateCampaignModal,
        setCoinData,
        getUserDetails,
        getCurrentUserData,
        getGlobalInfo,
        getWalletBalance,
        getBalance,
        getProvablyFairData,
        selectedCoin,
        setSelectedCoin,
        userTokens,
        setUserTokens,
        liveStats,
        setLiveStats,
        showLiveStats,
        setShowLiveStats,
        enableSounds,
        setEnableSounds,
        liveCurrentStat,
        setLiveCurrentStat,
        updatePNL,
        liveTokenPrice,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};

export const translationsMap = {
  "Audited by OtterSec": {
    ru: "Проверено OtterSec",
    ko: "OtterSec의 감사",
    ch: "OtterSec的审计",
  },
  Coinflip: {
    ru: "Орел и решка",
    ko: "동전 던지기",
    ch: "抛硬币",
  },
  Dice: {
    ru: "Кости",
    ko: "주사위",
    ch: "骰子",
  },
  Contact: {
    ru: "Контакт",
    ko: "연락하다",
    ch: "接触",
  },
  Dice2: {
    ru: "Кости 2",
    ko: "주사위 2",
    ch: "骰子2",
  },
  Keno: {
    ru: "Кено",
    ko: "키노",
    ch: "Keno",
  },
  Limbo: {
    ru: "Лимбо",
    ko: "라임보",
    ch: "Limbo",
  },
  Options: {
    ru: "Опции",
    ko: "옵션",
    ch: "选项",
  },
  Wheel: {
    ru: "Колесо",
    ko: "바퀴",
    ch: "轮子",
  },
  Mines: {
    ru: "Шахты",
    ko: "광산",
    ch: "矿山",
  },
  Hilo: {
    ru: "Хайло",
    ko: "하이로",
    ch: "Hilo",
  },
  Plinko: {
    ru: "Плинко",
    ko: "플링코",
    ch: "Plinko",
  },
  Roulette: {
    ru: "Рулетка",
    ko: "룰렛",
    ch: "轮盘",
  },
  "Roulette-2": {
    ru: "Рулетка-2",
    ko: "룰렛-2",
    ch: "轮盘-2",
  },
  Roulette2: {
    ru: "Рулетка2",
    ko: "룰렛2",
    ch: "轮盘2",
  },
  All: {
    ru: "Все",
    ko: "모두",
    ch: "全部",
  },
  Withdraw: {
    ru: "Вывод",
    ko: "철수",
    ch: "提款",
  },
  Deposit: {
    ru: "Депозит",
    ko: "예금",
    ch: "存款",
  },
  History: {
    ru: "История",
    ko: "역사",
    ch: "历史",
  },
  Amount: {
    ru: "Сумма",
    ko: "양",
    ch: "量",
  },
  Coin: {
    ru: "Монета",
    ko: "동전",
    ch: "硬币",
  },
  "Current Wallet": {
    ru: "Текущий кошелек",
    ko: "현재 지갑",
    ch: "当前钱包",
  },
  English: {
    ru: "Английский",
    ko: "영어",
    ch: "英语",
  },
  Connect: {
    ru: "Подключить",
    ko: "지갑",
    ch: "连接钱包",
  },
  Back: {
    ru: "Назад",
    ko: "뒤쪽에",
    ch: "返回",
  },
  Buyer: {
    ru: "Покупатель",
    ko: "구매자",
    ch: "买家",
  },
  Tickets: {
    ru: "Билеты",
    ko: "티켓",
    ch: "门票",
  },
  Round: {
    ru: "Раунд",
    ko: "라운드",
    ch: "轮",
  },
  Bought: {
    ru: "Куплено",
    ko: "구매한 날짜",
    ch: "购买日期",
  },
  Store: {
    ru: "Магазин",
    ko: "상점",
    ch: "商店",
  },
  Leaderboard: {
    ru: "Таблица лидеров",
    ko: "리더 보드",
    ch: "排行榜",
  },
  Staking: {
    ru: "Стейкинг",
    ko: "스테이킹",
    ch: "质押",
  },
  "You have": {
    ru: "У вас есть",
    ko: "보유하고 있습니다",
    ch: "你有",
  },
  "available in your wallet to stake": {
    ru: "доступно в вашем кошельке для стейкинга",
    ko: "스테이킹할 수 있는 지갑 내 잔고",
    ch: "可用于抵押的钱包余额",
  },
  "Stake your FOMO to boost your leaderboard points and more.": {
    ru: "Ставьте свой FOMO, чтобы увеличить свои очки лидерства и многое другое.",
    ko: "리더보드 포인트 및 기타 기능을 높이려면 FOMO를 스테이크하세요.",
    ch: "抵押您的FOMO以提高您的排行榜积分等。",
  },
  "Stake your": {
    ru: "Сделайте ставку",
    ko: "당신의 스테이크",
    ch: "抵押您的",
  },
  "to boost your leaderboard points and more.": {
    ru: "для увеличения ваших очков в таблице лидеров и не только.",
    ko: "리더 보드 점수 및 기타를 높이려면.",
    ch: "以提高您的排行榜积分和更多内容。",
  },
  "Global Staking Overview": {
    ru: "Обзор глобального стейкинга",
    ko: "글로벌 스테이킹 개요",
    ch: "全球质押概览",
  },
  "Total FOMO Staked": {
    ru: "Всего заложено FOMO",
    ko: "총 FOMO 스테이크된 금액",
    ch: "总共 FOMO 抵押",
  },
  "Insufficient FOMO": {
    ru: "Недостаточно FOMO",
    ko: "FOMO가 부족합니다",
    ch: "FOMO不足",
  },
  Stake: {
    ru: "Застейкать",
    ko: "스테이킹",
    ch: "抵押",
  },
  Unstake: {
    ru: "Отозвать стейкинг",
    ko: "언스테이킹",
    ch: "解除抵押",
  },
  "Deposit FOMO": {
    ru: "Депозит FOMO",
    ko: "FOMO 입금",
    ch: "存入FOMO",
  },
  "Withdraw FOMO": {
    ru: "Вывести FOMO",
    ko: "FOMO 출금",
    ch: "提取FOMO",
  },
  Available: {
    ru: "Доступно",
    ko: "사용 가능",
    ch: "可用",
  },
  Multiplier: {
    ru: "Мультипликатор",
    ko: "곱수",
    ch: "倍数",
  },
  "FOMO Available": {
    ru: "FOMO доступно",
    ko: "FOMO 사용 가능",
    ch: "FOMO 可用",
  },
  "FOMO Staked": {
    ru: "FOMO в стейкинге",
    ko: "FOMO 스테이크",
    ch: "FOMO 质押",
  },
  "Staking Stats": {
    ru: "Статистика стейкинга",
    ko: "스테이킹 통계",
    ch: "质押统计",
  },
  "Current Tier": {
    ru: "Текущий уровень",
    ko: "현재 등급",
    ch: "当前层",
  },
  "Next Tier": {
    ru: "Следующий уровень",
    ko: "다음 티어",
    ch: "下一个层级",
  },
  "more $FOMO to reach": {
    ru: "Еще $FOMO для достижения",
    ko: "다음 단계까지 필요한 $FOMO",
    ch: "还需要更多$FOMO",
  },
  multiplier: {
    ru: "Мультипликатор",
    ko: "곱수",
    ch: "倍数",
  },
  "Unique Players": {
    ru: "Уникальные игроки",
    ko: "고유 플레이어",
    ch: "独特玩家",
  },
  "Total Volume": {
    ru: "Общий объем",
    ko: "총 거래량",
    ch: "总量",
  },
  "is You and You are": {
    ru: "Вы и Вы",
    ko: "당신과 당신은",
    ch: "你和你是",
  },

  "Do you even FOMO bro?": {
    ru: "Вы вообще чувствуете FOMO, бро?",
    ko: "당신은 FOMO를 느끼나요?",
    ch: "你连FOMO都感觉不到吗，兄弟？",
  },
  "Caught the FOMO bug?": {
    ru: "Поймал FOMO?",
    ko: "FOMO 벌레에 감염되셨나요?",
    ch: "中招了FOMO吗？",
  },
  "FOMO is rising...": {
    ru: "FOMO растет...",
    ko: "FOMO가 증가 중입니다...",
    ch: "FOMO在上升...",
  },
  "On your way to FOMOtopia.": {
    ru: "Вы на пути к FOMOтопии.",
    ko: "FOMOtopia로 향하고 계신가요?",
    ch: "你正在前往FOMOtopia的路上。",
  },
  "FOMO Jedi - May the gains be with you.": {
    ru: "FOMO джедай - Пусть выгоды будут с вами.",
    ko: "FOMO Jedi - 이익이 함께 하시길 바랍니다.",
    ch: "FOMO绝地 - 愿力量与你同在。",
  },
  "FOMO Wizard - Spreading magic.": {
    ru: "FOMO волшебник - Распространение магии.",
    ko: "FOMO 마법사 - 마법을 전파합니다.",
    ch: "FOMO巫师 - 传播魔法。",
  },
  "FOMO God – Missing out is for mortals, not you.": {
    ru: "FOMO Бог - Упускать возможность - это для смертных, а не для вас.",
    ko: "FOMO 신 - 놓치는 것은 죽었는 사람들을 위한 것입니다, 당신은 아닙니다.",
    ch: "FOMO之神 - 错过是为凡人，而不是你。",
  },
  "My Current Tier": {
    ru: "Мой текущий уровень",
    ko: "내 현재 등급",
    ch: "我的当前层",
  },
  Manual: {
    ru: "Руководство",
    ko: "수동",
    ch: "手动",
  },
  Auto: {
    ru: "Авто",
    ko: "자동",
    ch: "自动",
  },
  "Bet Amount": {
    ru: "Сумма ставки",
    ko: "배팅 금액",
    ch: "投注金额",
  },
  Why: {
    ru: "Почему",
    ko: "왜",
    ch: "为什么",
  },
  Half: {
    ru: "Половина",
    ko: "반",
    ch: "一半",
  },
  Max: {
    ru: "Макс",
    ko: "최대",
    ch: "最大",
  },
  Bet: {
    ru: "Ставка",
    ko: "배팅",
    ch: "投注",
  },
  Bets: {
    ru: "Ставки",
    ko: "배팅",
    ch: "投注",
  },
  "Max Bet": {
    ru: "Максимальная ставка",
    ko: "최대 베팅",
    ch: "最大投注",
  },
  BET: {
    ru: "Ставка",
    ko: "배팅",
    ch: "投注",
  },
  "BET AGAIN": {
    ru: "Ставить снова",
    ko: "다시 배팅",
    ch: "再次投注",
  },
  Betting: {
    ru: "Ставка",
    ko: "배팅",
    ch: "投注",
  },
  Flipping: {
    ru: "Переворот",
    ko: "뒤집기",
    ch: "翻转",
  },
  Profit: {
    ru: "Прибыль",
    ko: "이익",
    ch: "盈利",
  },
  Chance: {
    ru: "Шанс",
    ko: "기회",
    ch: "机会",
  },
  "Rolling the dice": {
    ru: "Бросок костей",
    ko: "주사위 굴리는 중",
    ch: "滚动骰子",
  },
  "Roll Over": {
    ru: "Бросок над",
    ko: "위로 굴리기",
    ch: "滚动上",
  },
  "Roll Under": {
    ru: "Бросок под",
    ko: "아래로 굴리기",
    ch: "滚动下",
  },
  STOP: {
    ru: "СТОП",
    ko: "중지",
    ch: "停止",
  },
  "Configure Auto": {
    ru: "Настроить авто",
    ko: "자동 설정",
    ch: "配置自动",
  },
  "Number of Bets": {
    ru: "Количество ставок",
    ko: "베팅 횟수",
    ch: "投注次数",
  },
  "The maximum amount you can bet with the current multiplier": {
    ru: "Максимальная сумма, которую вы можете поставить с текущим множителем",
    ko: "현재 배수로 베팅할 수 있는 최대 금액",
    ch: "您可以使用当前乘数下注的最大金额",
  },
  "The maximum amount you can bet in this game is": {
    ru: "Максимальная сумма, которую вы можете поставить в этой игре, составляет",
    ko: "이 게임에서 베팅할 수 있는 최대 금액은",
    ch: "您可以在此游戏中下注的最高金额为",
  },
  "The more you stake, the less fees you pay and the bigger your points multiplier":
    {
      ru: "Чем больше вы ставите, тем меньше вы платите комиссий и тем выше ваш множитель очков",
      ko: "더 많이 걸수록 수수료가 적게 들고 포인트 배수가 커집니다",
      ch: "投注金额越大，您支付的费用越少，积分乘数越大",
    },
  WALLET: {
    ru: "КОШЕЛЕК",
    ko: "지갑",
    ch: "钱包",
  },
  "Please deposit funds to start playing. View": {
    ru: "Пожалуйста, внесите средства, чтобы начать играть. Просмотр",
    ko: "게임을 시작하려면 자금을 입금하십시오. 보기",
    ch: "请存入资金开始游戏。查看",
  },
  "Choose Upto 5 Faces": {
    ru: "Выберите до 5 лиц",
    ko: "최대 5개의 얼굴 선택",
    ch: "选择最多5张脸",
  },
  "5 Faces": {
    ru: "5 лиц",
    ko: "5개의 얼굴",
    ch: "5张脸",
  },
  "On Win": {
    ru: "При победе",
    ko: "이기면",
    ch: "赢了",
  },
  "Increase by": {
    ru: "Увеличить на",
    ko: "증가",
    ch: "增加",
  },
  Reset: {
    ru: "Сброс",
    ko: "리셋",
    ch: "重置",
  },
  "On Loss": {
    ru: "При проигрыше",
    ko: "패배하면",
    ch: "失败",
  },
  "Stop On Profit": {
    ru: "Остановиться при прибыли",
    ko: "이익 중지",
    ch: "停止盈利",
  },
  "Stop On Loss": {
    ru: "Остановиться при убытке",
    ko: "손실 중지",
    ch: "停止损失",
  },
  APPLY: {
    ru: "ПРИМЕНИТЬ",
    ko: "적용",
    ch: "应用",
  },
  Volume: {
    ru: "Объем",
    ko: "볼륨",
    ch: "音量",
  },
  "Provably Fair": {
    ru: "Доказуемо справедливо",
    ko: "증명 가능",
    ch: "公平性",
  },
  "PROVABLY FAIR": {
    ru: "ДОКАЗУЕМО СПРАВЕДЛИВО",
    ko: "증명 가능",
    ch: "公平性",
  },
  "Reset All": {
    ru: "СБРОСИТЬ ВСЕ",
    ko: "모두 리셋",
    ch: "重置全部",
  },
  "All Bets": {
    ru: "Все ставки",
    ko: "모든 베팅",
    ch: "所有投注",
  },
  "My Bets": {
    ru: "Мои ставки",
    ko: "내 베팅",
    ch: "我的投注",
  },
  Game: {
    ru: "Игра",
    ko: "게임",
    ch: "游戏",
  },
  Payout: {
    ru: "Выплата",
    ko: "지급",
    ch: "支付",
  },
  Pending: {
    ru: "В ожидании",
    ko: "보류 중",
    ch: "待定",
  },
  "FOMO wtf casino games are currently in beta and will be undergoing audit shortly. FOMO wtf EXIT games has gone through audit performed by OtterSec in December 2023.":
    {
      ru: "Игры казино FOMO wtf находятся в бета-тестировании и вскоре будут проходить аудит. Игры FOMO wtf EXIT прошли аудит, проведенный OtterSec в декабре 2023 года.",
      ko: "FOMO wtf 카지노 게임은 현재 베타 버전이며 곧 감사를 받을 예정입니다. FOMO wtf EXIT 게임은 2023년 12월 OtterSec에 의해 감사를 받았습니다.",
      ch: "FOMO wtf赌场游戏目前处于测试阶段，将很快进行审计。 FOMO wtf EXIT游戏已于2023年12月由OtterSec进行了审计。",
    },
  Services: {
    ru: "Услуги",
    ko: "서비스",
    ch: "服务",
  },
  Platform: {
    ru: "Платформа",
    ko: "플랫폼",
    ch: "平台",
  },
  Community: {
    ru: "Сообщество",
    ko: "커뮤니티",
    ch: "社区",
  },
  Docs: {
    ru: "Документы",
    ko: "문서",
    ch: "文档",
  },
  Wallet: {
    ru: "Кошелек",
    ko: "지갑",
    ch: "钱包",
  },
  "All rights reserved": {
    ru: "Все права защищены",
    ko: "모든 권리 보유",
    ch: "保留所有权利",
  },
  Seeds: {
    ru: "Семена",
    ko: "씨앗",
    ch: "种子",
  },
  Verify: {
    ru: "Проверить",
    ko: "확인",
    ch: "验证",
  },
  Change: {
    ru: "Изменить",
    ko: "변경",
    ch: "更改",
  },
  "Active Client Seed": {
    ru: "Активное клиентское семя",
    ko: "활성 클라이언트 시드",
    ch: "活动客户种子",
  },
  "Active Server Seed (Hashed)": {
    ru: "Активное серверное семя (хешировано)",
    ko: "활성 서버 시드 (해시 처리됨)",
    ch: "活动服务器种子（已散列）",
  },
  "Total Bets": {
    ru: "Всего ставок",
    ko: "총 베팅",
    ch: "总投注",
  },
  "Rotate Seed Pair": {
    ru: "Повернуть пару семян",
    ko: "시드 페어 회전",
    ch: "旋转种子对",
  },
  "New Client Seed": {
    ru: "Новое клиентское семя",
    ko: "새로운 클라이언트 시드",
    ch: "新客户种子",
  },
  "Next Server Seed": {
    ru: "Следующее серверное семя",
    ko: "다음 서버 시드",
    ch: "下一个服务器种子",
  },
  Heads: {
    ru: "Орел",
    ko: "앞면",
    ch: "正面",
  },
  Tails: {
    ru: "Решка",
    ko: "뒷면",
    ch: "反面",
  },
  "Coin Flip": {
    ru: "Бросок монеты",
    ko: "동전 던지기",
    ch: "抛硬币",
  },
  "Client Seed": {
    ru: "Клиентское семя",
    ko: "클라이언트 시드",
    ch: "客户种子",
  },
  "Server Seed": {
    ru: "Серверное семя",
    ko: "서버 시드",
    ch: "服务器种子",
  },
  Nonce: {
    ru: "Нонс",
    ko: "논스",
    ch: "一次",
  },
  Rotate: {
    ru: "Повернуть",
    ko: "회전",
    ch: "旋转",
  },
  "To verify this flip, you first need to rotate your seed pair.": {
    ru: "Чтобы проверить этот бросок, вам нужно сначала повернуть пару семян.",
    ko: "이 동전을 확인하려면 먼저 시드 페어를 회전해야 합니다.",
    ch: "要验证此翻转，您首先需要旋转种子对。",
  },
  "Target Multiplier": {
    ru: "Целевой множитель",
    ko: "목표 배수",
    ch: "目标倍数",
  },
  Risk: {
    ru: "Риск",
    ko: "위험",
    ch: "风险",
  },
  Segments: {
    ru: "Сегменты",
    ko: "세그먼트",
    ch: "段",
  },
  Classic: {
    ru: "Классический",
    ko: "클래식",
    ch: "经典",
  },
  Low: {
    ru: "Низкий",
    ko: "낮음",
    ch: "低",
  },
  Medium: {
    ru: "Средний",
    ko: "중간",
    ch: "中等",
  },
  High: {
    ru: "Высокий",
    ko: "높음",
    ch: "高",
  },
  ENDED: {
    ru: "ЗАКОНЧЕНО",
    ko: "끝남",
    ch: "结束",
  },
  Min: {
    ru: "Мин",
    ko: "분",
    ch: "分钟",
  },
  "Select Interval": {
    ru: "Выберите интервал",
    ko: "간격 선택",
    ch: "选择间隔",
  },
  UP: {
    ru: "ВВЕРХ",
    ko: "위",
    ch: "向上",
  },
  DOWN: {
    ru: "ВНИЗ",
    ko: "아래",
    ch: "向下",
  },
  "Placing bet": {
    ru: "Совершение ставки",
    ko: "베팅 중",
    ch: "下注中",
  },
  "Checking result": {
    ru: "Проверка результата",
    ko: "결과 확인",
    ch: "检查结果",
  },
  "BET UP": {
    ru: "СТАВКА ВВЕРХ",
    ko: "베팅 위",
    ch: "投注向上",
  },
  "BET DOWN": {
    ru: "СТАВКА ВНИЗ",
    ko: "베팅 아래",
    ch: "投注向下",
  },
  AUTOPICK: {
    ru: "АВТОВЫБОР",
    ko: "자동 선택",
    ch: "自动选择",
  },
  CLEAR: {
    ru: "ОЧИСТИТЬ",
    ko: "지우기",
    ch: "清除",
  },
  "Pick upto 10 numbers": {
    ru: "Выберите до 10 чисел",
    ko: "10개의 숫자를 선택하십시오",
    ch: "最多选择10个数字",
  },
  "Dice 2": {
    ru: "Кости 2",
    ko: "주사위 2",
    ch: "骰子2",
  },
  "Fomo Flip": {
    ru: "Fomo Флип",
    ko: "Fomo 플립",
    ch: "Fomo 翻转",
  },
  "Binary Options": {
    ru: "Бинарные опционы",
    ko: "바이너리 옵션",
    ch: "二元期权",
  },
  Play: {
    ru: "Играть",
    ko: "재생",
    ch: "玩",
  },
  "Play - The best casino games": {
    ru: "Играйте - лучшие казино игры",
    ko: "플레이 - 최고의 카지노 게임",
    ch: "玩 - 最好的赌场游戏",
  },
  Exit: {
    ru: "Выход",
    ko: "출구",
    ch: "出口",
  },
  Roadmap: {
    ru: "Дорожная карта",
    ko: "로드맵",
    ch: "路线图",
  },
  Home: {
    ru: "Главная",
    ko: "홈",
    ch: "主页",
  },
  DCA: {
    ru: "DCA",
    ko: "DCA",
    ch: "DCA",
  },
  Twitter: {
    ru: "Твиттер",
    ko: "트위터",
    ch: "推特",
  },
  Telegram: {
    ru: "Телеграм",
    ko: "텔레그램",
    ch: "电报",
  },
  Menu: {
    ru: "Меню",
    ko: "메뉴",
    ch: "菜单",
  },
  Dashboard: {
    ru: "Панель",
    ko: "대시 보드",
    ch: "仪表板",
  },
  "Signing Out ...": {
    ru: "Выход ...",
    ko: "로그 아웃 중 ...",
    ch: "登出中 ...",
  },
  "You Won!": {
    ru: "Вы выиграли",
    ko: "당신이 이겼습니다",
    ch: "你赢了",
  },
  "You Lost!": {
    ru: "Вы проиграли",
    ko: "당신이 졌습니다",
    ch: "你输了",
  },
  "Maximum amount for a single bet in this game is": {
    ru: "Максимальная сумма для одной ставки в этой игре",
    ko: "이 게임에서 한 번에 베팅할 수 있는 최대 금액",
    ch: "此游戏中单次投注的最大金额为",
  },
  "The better must first rotate their seed pair to verify this bet.": {
    ru: "Сначала нужно повернуть пару семян, чтобы проверить эту ставку.",
    ko: "베팅자는 먼저 시드 페어를 회전해야 합니다.",
    ch: "投注者首先需要旋转种子对。",
  },
  "House Edge": {
    ru: "Край дома",
    ko: "하우스 엣지",
    ch: "庄家优势",
  },
  "I agree with the Privacy Policy and with the Terms of Use, Gambling is not forbidden by my local authorities and I am at least 18 years old.":
    {
      ru: "Я согласен с Политикой конфиденциальности и Условиями использования, азартные игры не запрещены моими местными властями, и мне как минимум 18 лет.",
      ko: "개인정보 처리방침 및 이용 약관에 동의합니다. 도박은 현지 당국에 의해 금지되지 않았으며, 저는 만 18세 이상입니다.",
      ch: "我同意隐私政策和使用条款，我所在地区的法律不禁止赌博，并且我已满18岁。",
    },
  "LIVE STATS": {
    ru: "Живые статистики",
    ko: "실시간 통계",
    ch: "实时统计",
  },
  Wins: {
    ru: "Победы",
    ko: "승리",
    ch: "胜",
  },
  Losses: {
    ru: "Поражения",
    ko: "패배",
    ch: "败",
  },
  Wagered: {
    ru: "Сделанные ставки",
    ko: "베팅",
    ch: "投注",
  },
  Gems: {
    ru: "Самоцветы",
    ko: "보석",
    ch: "宝石",
  },
  Rows: {
    ru: "Строки",
    ko: "행",
    ch: "行",
  },
  "Current Profit": {
    ru: "Текущая прибыль",
    ko: "현재 이익",
    ch: "当前利润",
  },
  "Profit on next tile": {
    ru: "Прибыль на следующем квадрате",
    ko: "다음 타일에서의 이익",
    ch: "下一个方块的利润",
  },
  CASHOUT: {
    ru: "ВЫВОД",
    ko: "출금",
    ch: "提现",
  },
  "Pending game found!": {
    ru: "Найдена ожидающая игра!",
    ko: "보류 중인 게임 발견!",
    ch: "找到待处理的游戏！",
  },
  "You already have a pending game!": {
    ru: "У вас уже есть ожидающая игра!",
    ko: "이미 보류 중인 게임이 있습니다!",
    ch: "您已经有一个待处理的游戏！",
  },
  "Game does not exist!": {
    ru: "Игра не существует!",
    ko: "게임이 존재하지 않습니다!",
    ch: "游戏不存在！",
  },
  "No bets placed": {
    ru: "Ставок не сделано",
    ko: "베팅 없음",
    ch: "没有下注",
  },
  "Mines game created": {
    ru: "Создана игра «Майны»",
    ko: "마인즈 게임 생성됨",
    ch: "创建了扫雷游戏",
  },
  "You have already picked this number!": {
    ru: "Вы уже выбрали это число!",
    ko: "이 숫자를 이미 선택했습니다!",
    ch: "您已经选择了这个数字！",
  },
  "Game in progress": {
    ru: "Игра в процессе",
    ko: "진행 중인 게임",
    ch: "游戏进行中",
  },
  "Max payout exceeded": {
    ru: "Превышена максимальная выплата",
    ko: "최대 지급 한도 초과",
    ch: "超过最大支付限制",
  },
  "Max payout of 25 exceeded! Cashout to continue...": {
    ru: "Превышена максимальная выплата 25! Выведите, чтобы продолжить...",
    ko: "25의 최대 지급 한도를 초과했습니다! 계속하려면 현금화하십시오...",
    ch: "超过25的最大支付限制！提取以继续...",
  },
  "Game already concluded!": {
    ru: "Игра уже завершена!",
    ko: "게임이 이미 종료되었습니다!",
    ch: "游戏已经结束！",
  },
  "Could not fetch pending game.": {
    ru: "Не удалось получить ожидающую игру.",
    ko: "보류 중인 게임을 가져올 수 없습니다.",
    ch: "无法获取待处理游戏。",
  },
  "Select at least one tile to bet on.": {
    ru: "Выберите по крайней мере один квадрат для ставки.",
    ko: "최소 1개의 타일을 선택하여 베팅하십시오.",
    ch: "至少选择1个方块进行投注。",
  },
  "High Rollers": {
    ru: "Крупные игроки",
    ko: "하이 롤러",
    ch: "大赌客",
  },
  "No Bets Made.": {
    ru: "Ставок не сделано.",
    ko: "베팅 없음.",
    ch: "没有下注。",
  },
  "Set Bet Count.": {
    ru: "Установить количество ставок.",
    ko: "베팅 횟수 설정.",
    ch: "设置投注次数。",
  },
  "Set Amount.": {
    ru: "Установить сумму.",
    ko: "금액 설정.",
    ch: "设置金额。",
  },
  "Choose amount, interval and type.": {
    ru: "Выберите сумму, интервал и тип.",
    ko: "금액, 간격 및 유형 선택.",
    ch: "选择金额，间隔和类型。",
  },
  "Wallet not connected": {
    ru: "Кошелек не подключен",
    ko: "지갑이 연결되지 않았습니다",
    ch: "钱包未连接",
  },
  "Insufficient balance for bet!": {
    ru: "Недостаточно баланса для ставки!",
    ko: "베��에 필요한 잔액이 부족합니다!",
    ch: "投注所需的余额不足！",
  },
  "Insufficient balance": {
    ru: "Недостаточно средств",
    ko: "잔액이 부족합니다",
    ch: "余额不足",
  },
  "Under maintenance": {
    ru: "Поддержка",
    ko: "유지 보수 중",
    ch: "维护中",
  },
  "Profit Limit reached.": {
    ru: "Достигнут предел прибыли.",
    ko: "이익 한도 도달.",
    ch: "达到盈利限制。",
  },
  "Loss Limit reached.": {
    ru: "Достигнут предел убытков.",
    ko: "손실 한도 도달.",
    ch: "达到损失限制。",
  },
  "Auto bet stopped": {
    ru: "Автоставка остановлена",
    ko: "자동 베팅 중지됨",
    ch: "自动投注停止",
  },
  "Could not make the Bet.": {
    ru: "Не удалось сделать ставку.",
    ko: "베팅을 할 수 없습니다.",
    ch: "无法下注。",
  },
  "Could not fetch result!": {
    ru: "Не удалось получить результат!",
    ko: "결과를 가져올 수 없습니다!",
    ch: "无法获取结果！",
  },
  "Invalid amount": {
    ru: "Неверная сумма",
    ko: "잘못된 금액",
    ch: "无效金额",
  },
  "Could not place bet.": {
    ru: "Не удалось разместить ставку.",
    ko: "베팅을 할 수 없습니다.",
    ch: "无法下注。",
  },
  "Sorry, Better luck next time!": {
    ru: "Извините, удачи в следующий раз!",
    ko: "죄송합니다. 다음에 다시 시도하세요!",
    ch: "对不起，下次好运！",
  },
  "Pick up to 10 numbers": {
    ru: "Выберите до 10 чисел",
    ko: "10개의 숫자를 선택하십시오",
    ch: "最多选择10个数字",
  },
  "10 numbers can be selected at max": {
    ru: "Максимум 10 чисел можно выбрать",
    ko: "최대 10개의 숫자를 선택할 수 있습니다",
    ch: "最多选择10个数字",
  },
  "You can only select up to 5 faces": {
    ru: "Вы можете выбрать только до 5 лиц",
    ko: "최대 5개의 얼굴만 선택할 수 있습니다",
    ch: "您最多只能选择5张脸",
  },
  "Choose at least 1 face": {
    ru: "Выберите по крайней мере 1 лицо",
    ko: "최소 1개의 얼굴을 선택하십시오",
    ch: "至少选择1张脸",
  },
  Rank: {
    ru: "Ранг",
    ko: "랭크",
    ch: "等级",
  },
  Points: {
    ru: "Баллы",
    ko: "포인트",
    ch: "积分",
  },
  "Your level progress": {
    ru: "Ваш прогресс уровня",
    ko: "당신의 레벨 진행 상황",
    ch: "您的等级进度",
  },
  BRONZE: {
    ru: "Бронза",
    ko: "브론즈",
    ch: "青铜",
  },
  "Boost Your Tier by Staking!": {
    ru: "Ставьте, чтобы увеличить свой уровень!",
    ko: "스테이킹하여 당신의 등급을 증가시키십시오!",
    ch: "通过质押来提高您的等级！",
  },
  "You can stake your $FOMO to obtain higher multiplier for your points!": {
    ru: "Вы можете заложить свой $FOMO, чтобы получить более высокий множитель для ваших очков!",
    ko: "당신의 포인트에 더 높은 배수를 얻기 위해 $FOMO를 스테이크 할 수 있습니다!",
    ch: "您可以抵押您的$FOMO以获得更高的积分倍数！",
  },
  "Current Multiplier": {
    ru: "Текущий множитель",
    ko: "현재 배수",
    ch: "当前倍数",
  },
  "Congratulations! You won": {
    ru: "Поздравляем! Ты выиграл",
    ko: "축하해요! 당신이 이겼어요",
    ch: "恭喜！你赢了",
  },
  "Invalid strike number!": {
    ru: "Неверный номер удара!",
    ko: "잘못된 스트라이크 번호!",
    ch: "无效的罢工号！",
  },
  "To verify this bet, you first need to rotate your seed pair.": {
    ru: "Чтобы проверить эту ставку, сначала нужно повернуть пару семян.",
    ko: "이 베팅을 확인하려면 먼저 시드 페어를 회전해야 합니다.",
    ch: "要验证此投注，您首先需要旋转种子对。",
  },
  Flip: {
    ru: "Флип",
    ko: "플립",
    ch: "翻转",
  },
  "(Hashed)": {
    ru: "(Хешировано)",
    ko: "(해시 처리됨)",
    ch: "(已散列)",
  },
  "No data.": {
    ru: "Нет данных.",
    ko: "데이터 없음.",
    ch: "没有数据。",
  },
  Completed: {
    ru: "Завершено",
    ko: "완료",
    ch: "已完成",
  },
  Time: {
    ru: "Время",
    ko: "시간",
    ch: "时间",
  },
  Status: {
    ru: "Статус",
    ko: "상태",
    ch: "状态",
  },
  Type: {
    ru: "Тип",
    ko: "유형",
    ch: "类型",
  },
  PLATINUM: {
    ru: "Платина",
    ko: "백금",
    ch: "铂金",
  },
  ELITE: {
    ru: "Элита",
    ko: "엘리트",
    ch: "精英",
  },
  SUPREME: {
    ru: "Суприм",
    ko: "최고",
    ch: "至尊",
  },
  LEGENDARY: {
    ru: "Легендарный",
    ko: "전설",
    ch: "传奇",
  },
  MYTHICAL: {
    ru: "Мифический",
    ko: "신화",
    ch: "神话",
  },
  SILVER: {
    ru: "Серебро",
    ko: "은",
    ch: "银",
  },
  GOLD: {
    ru: "Золото",
    ko: "금",
    ch: "金",
  },
  "Could not fetch leaderboard.": {
    ru: "Не удалось получить доску лидеров.",
    ko: "리더 보드를 가져올 수 없습니다.",
    ch: "无法获取排行榜。",
  },
  "AFFILIATE PROGRAM": {
    ru: "ПАРТНЕРСКАЯ ПРОГРАММА",
    ko: "제휴 프로그램",
    ch: "联盟计划",
  },
  Referred: {
    ru: "Рекомендованный",
    ko: "추천",
    ch: "推荐",
  },
  Earnings: {
    ru: "Доход",
    ko: "수익",
    ch: "收益",
  },
  Campaigns: {
    ru: "Кампании",
    ko: "캠페인",
    ch: "活动",
  },
  "CREATE CAMPAIGN": {
    ru: "СОЗДАТЬ КАМПАНИЮ",
    ko: "캠페인 만들기",
    ch: "创建活动",
  },
  "Create Campaign": {
    ru: "Создать кампанию",
    ko: "캠페인 만들기",
    ch: "创建活动",
  },
  "Campaign Name": {
    ru: "Название кампании",
    ko: "캠페인 이름",
    ch: "活动名称",
  },
  "Multi-Level Referral": {
    ru: "Многоуровневая реферальная",
    ko: "다단계 추천",
    ch: "多级推荐",
  },
  "Failed to create campaign!": {
    ru: "Не удалось создать кампанию!",
    ko: "캠페인을 만들지 못했습니다!",
    ch: "创建活动失败！",
  },
  "Our affiliate program includes a comprehensive retention program that keeps referred customers engaged and invested.":
    {
      ru: "Наша партнерская программа включает в себя комплексную программу удержания, которая удерживает рекомендованных клиентов и заинтересованных.",
      ko: "저희 제휴 프로그램에는 추천된 고객이 참여하고 투자하도록 유지하는 포괄적인 유지 프로그램이 포함되어 있습니다.",
      ch: "我们的联盟计划包括全面的保留计划，使推荐的客户保持参与和投资。",
    },
  "Referral Link": {
    ru: "Реферальная ссылка",
    ko: "추천 링크",
    ch: "推荐链接",
  },
  "How it Works?": {
    ru: "Как это работает?",
    ko: "작동 방식",
    ch: "它是如何工作的？",
  },
  "Total Claimed": {
    ru: "Всего заявлено",
    ko: "총 청구",
    ch: "总索赔",
  },
  "Total Claimable": {
    ru: "Всего подлежащего претензии",
    ko: "총 청구 가능",
    ch: "总索赔",
  },
  "Total Earned": {
    ru: "Всего заработано",
    ko: "총 수익",
    ch: "总收入",
  },
  CLAIM: {
    ru: "ЗАЯВИТЬ",
    ko: "청구",
    ch: "索赔",
  },
  Level: {
    ru: "Уровень",
    ko: "레벨",
    ch: "等级",
  },
  "No have not referred anyone.": {
    ru: "Нет, никто не был приглашён.",
    ko: "추천한 사람이 없습니다.",
    ch: "没有推荐任何人。",
  },
  "No campaigns created": {
    ru: "Нет созданных кампаний",
    ko: "생성된 캠페인이 없습니다",
    ch: "没有创建任何活动",
  },
  "Commission %": {
    ru: "Комиссия %",
    ko: "수수료 %",
    ch: "佣金 %",
  },
  Commission: {
    ru: "Комиссия",
    ko: "수수료",
    ch: "佣金",
  },
  Earned: {
    ru: "Заработано",
    ko: "수익",
    ch: "赚取的",
  },
  Cryptocurrency: {
    ru: "Криптовалюта",
    ko: "암호화폐",
    ch: "加密货币",
  },
  "Previously Claimed": {
    ru: "Ранее заявленные",
    ko: "이전에 청구된",
    ch: "之前已领取",
  },
  Claimable: {
    ru: "Подлежащий претензии",
    ko: "청구 가능",
    ch: "可索赔",
  },
  Signups: {
    ru: "Регистрации",
    ko: "가입",
    ch: "注册",
  },
  "Code (Campaign ID)": {
    ru: "Код (ID кампании)",
    ko: "코드 (캠페인 ID)",
    ch: "代码（活动ID）",
  },
  Copy: {
    ru: "Копировать",
    ko: "복사",
    ch: "复制",
  },
  Copied: {
    ru: "Скопировано",
    ko: "복사됨",
    ch: "复制",
  },
  "Multiplier should be at least 1.02": {
    ru: "Множитель должен быть не менее 1.02",
    ko: "배수는 최소 1.02이어야 합니다",
    ch: "倍数应至少为1.02",
  },
  "Multiplier cannot be greater than 50": {
    ru: "Множитель не может быть больше 50",
    ko: "배수는 50보다 클 수 없습니다",
    ch: "倍数不能大于50",
  },
  "User wallet not authenticated": {
    ru: "Кошелек пользователя не аутентифицирован",
    ko: "사용자 지갑이 인증되지 않았습니다",
    ch: "用户钱包未经身份验证",
  },
  "Missing parameters": {
    ru: "Отсутствуют параметры",
    ko: "매개 변수 누락",
    ch: "缺少参数",
  },
  "Invalid parameters": {
    ru: "Неверные параметры",
    ko: "잘못된 매개 변수",
    ch: "无效参数",
  },
  "Invalid bet amount": {
    ru: "Неверная сумма ставки",
    ko: "잘못된 베팅 금액",
    ch: "无效的投注金额",
  },
  "Invalid chosen numbers": {
    ru: "Неверно выбранные числа",
    ko: "잘못된 숫자 선택",
    ch: "无效的选择数字",
  },
  "User does not exist!": {
    ru: "Пользователь не существует!",
    ko: "사용자가 존재하지 않습니다!",
    ch: "用户不存在！",
  },
  "Server hash not found!": {
    ru: "Серверный хеш не найден!",
    ko: "서버 해시를 찾을 수 없습니다!",
    ch: "找不到服务器哈希！",
  },
  "No active bets on this account": {
    ru: "На этом аккаунте нет активных ставок",
    ko: "이 계정에 활성화된 베팅이 없습니다",
    ch: "此帐户上没有活动投注",
  },
  "User could not be updated!": {
    ru: "Пользователь не может быть обновлен!",
    ko: "사용자를 업데이트할 수 없습니다!",
    ch: "无法更新用户！",
  },
  "Another bet is active on this account": {
    ru: "На этом аккаунте активна другая ставка",
    ko: "이 계정에서 다른 베팅이 활성화되어 있습니다",
    ch: "此帐户上有另一个活动投注",
  },
  "Could not fetch result": {
    ru: "Не удалось получить результат",
    ko: "결과를 가져올 수 없습니다",
    ch: "无法获取结果",
  },
  "Place at least one Chip": {
    ru: "Поставьте хотя бы одну фишку",
    ko: "칩을 하나 이상 놓으십시오",
    ch: "至少放置一个筹码",
  },
  "Bet amount exceeds the maximum allowed bet.": {
    ru: "Сумма ставки превышает максимально допустимую ставку.",
    ko: "베팅 금액이 허용된 최대 베팅을 초과합니다.",
    ch: "投注金额超过了允许的最高投注。",
  },

  "Chip Value": {
    ru: "Значение фишки",
    ko: "칩 가치",
    ch: "筹码价值",
  },
  Undo: {
    ru: "Отменить",
    ko: "실행 취소",
    ch: "撤消",
  },
  Clear: {
    ru: "Очистить",
    ko: "지우기",
    ch: "清除",
  },
  to: {
    ru: "до",
    ko: "까지",
    ch: "至",
  },
  Odd: {
    ru: "Нечет",
    ko: "홀수",
    ch: "奇数",
  },
  "Invalid row index": {
    ru: "Неверный индекс строки",
    ko: "잘못된 행 인덱스",
    ch: "无效的行索引",
  },
  Even: {
    ru: "Чет",
    ko: "짝수",
    ch: "偶数",
  },
  "Bet above minimum amount.": {
    ru: "Ставьте выше минимальной суммы.",
    ko: "최소 금액 이상 베팅하세요",
    ch: "投注超过最低金额",
  },
  "Please select a token before placing a bet.": {
    ru: "Пожалуйста, выберите токен перед размещением ставки.",
    ko: "베팅을 배치하기 전에 토큰을 선택하��시오.",
    ch: "请在放置投注之前选择一个令牌。",
  },
};
