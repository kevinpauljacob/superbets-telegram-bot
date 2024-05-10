import { User, houseEdgeTiers, pointTiers } from "@/context/transactions";
import { useWallet } from "@solana/wallet-adapter-react";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import toast from "react-hot-toast";
import { connection } from "../context/gameTransactions";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { errorCustom } from "./toasts/ToastGroup";

interface PointTier {
  index: number;
  limit: number;
  image: string;
  label: string;
}

interface CoinBalance {
  wallet: string;
  type: boolean;
  amount: number;
  tokenMint: string;
}

interface ProvablyFairData {
  activeGameSeed: {
    wallet: string;
    clientSeed: string;
    serverSeed: string;
    serverSeedHash: string;
    nonce: number;
    status: string;
  };
  nextGameSeed: {
    wallet: string;
    clientSeed: string;
    serverSeed: string;
    serverSeedHash: string;
    nonce: number;
    status: string;
  };
}

interface GlobalContextProps {
  loading: boolean;
  setLoading: (stake: boolean) => void;

  language: "en" | "ru" | "ko" | "ch";
  setLanguage: (language: "en" | "ru" | "ko" | "ch") => void;

  userData: User | null;
  setUserData: (userData: User | null) => void;

  stake: boolean;
  setStake: (stake: boolean) => void;

  amount: number;
  setAmount: (amount: number) => void;

  solBal: number;
  setSolBal: (amount: number) => void;

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

  showWalletModal: boolean;
  setShowWalletModal: React.Dispatch<React.SetStateAction<boolean>>;

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

  openVerifyModal: () => void;
  closeVerifyModal: () => void;

  getUserDetails: () => Promise<void>;
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
}

const GlobalContext = createContext<GlobalContextProps | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "ru" | "ko" | "ch">("en");
  const [userData, setUserData] = useState<User | null>(null);
  const [stake, setStake] = useState(true);
  const [amount, setAmount] = useState(0);
  const [solBal, setSolBal] = useState<number>(0.0);
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
      wallet: "",
      type: true,
      amount: 0,
      tokenMint: "SOL",
    },
  ]);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [verifyModalData, setVerifyModalData] = useState({});

  const [sidebar, setSidebar] = useState<boolean>(false);
  const [mobileSidebar, setMobileSidebar] = useState<boolean>(false);

  const [openPFModal, setOpenPFModal] = useState<boolean>(false);

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
  const [autoBetCount, setAutoBetCount] = useState<number | string>(0);
  const [autoBetProfit, setAutoBetProfit] = useState<number>(0);

  // fomo live price
  const [fomoPrice, setFomoPrice] = useState<number>(0);
  const [currentGame, setCurrentGame] = useState<string | null>(null);

  const [houseEdge, setHouseEdge] = useState<number>(0);
  const [maxBetAmt, setMaxBetAmt] = useState<number>(0);

  useEffect(() => {
    const fetchFomoPrice = async () => {
      try {
        let data = await fetch(
          "https://price.jup.ag/v4/price?ids=FOMO&vsToken=USDC",
        ).then((res) => res.json());
        // console.log(data);
        setFomoPrice(data?.data?.FOMO?.price ?? 0);
      } catch (e) {
        console.log(e);
        setFomoPrice(0);
        errorCustom("Could not fetch fomo live price.");
      }
    };

    fetchFomoPrice();

    let intervalId = setInterval(async () => {
      fetchFomoPrice();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const openVerifyModal = () => {
    setIsVerifyModalOpen(true);
  };

  const closeVerifyModal = () => {
    setIsVerifyModalOpen(false);
  };

  const getUserDetails = async () => {
    if (wallet && wallet.publicKey)
      try {
        const res = await fetch("/api/staking/getInfo", {
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
        let points = user?.points ?? 0;
        const userTier = Object.entries(pointTiers).reduce((prev, next) => {
          return points >= next[1]?.limit ? next : prev;
        })[0];
        setHouseEdge(houseEdgeTiers[parseInt(userTier)]);
      } catch (e) {
        // errorCustom("Unable to fetch balance.");
        console.error(e);
      }
  };

  const getGlobalInfo = async () => {
    try {
      const res = await fetch("/api/staking/getInfo", {
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
      // console.log("Data: ", data);
      if (success) setGlobalInfo(data);
      // else errorCustom(message);
    } catch (e) {
      // errorCustom("Unable to fetch balance.");
      console.error(e);
    }
  };

  const getWalletBalance = async () => {
    if (wallet && wallet.publicKey)
      try {
        setWalletBalance(
          (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL,
        );
      } catch (e) {
        errorCustom("Unable to fetch balance.");
        console.error(e);
      }
  };

  const getBalance = async () => {
    setLoading(true);
    try {
      if (wallet?.publicKey)
        fetch(`/api/games/user/getUser?wallet=${wallet.publicKey?.toBase58()}`)
          .then((res) => res.json())
          .then((balance) => {
            if (
              balance.success &&
              balance?.data?.deposit &&
              balance?.data.deposit.length > 0
            ) {
              setCoinData(balance.data.deposit);
            } else {
              console.log("Could not fetch balance.");
              setCoinData(null);
            }
            setLoading(false);
          });
    } catch (e) {
      console.log("Could not fetch balance.");
      setLoading(false);
      setCoinData(null);
      console.error(e);
    }
  };

  const getProvablyFairData = async () => {
    if (wallet?.publicKey)
      try {
        const res = await fetch(`/api/games/gameSeed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet: wallet.publicKey.toBase58(),
          }),
        });

        let data = await res.json();
        if (data.success) return data;
        else return null;
      } catch (e) {
        errorCustom("Unable to fetch provably fair data.");
        return null;
      }
  };

  return (
    <GlobalContext.Provider
      value={{
        loading,
        setLoading,
        language,
        setLanguage,
        userData,
        setUserData,
        stake,
        setStake,
        amount,
        setAmount,
        solBal,
        setSolBal,
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
        isVerifyModalOpen,
        setIsVerifyModalOpen,
        verifyModalData,
        setVerifyModalData,
        sidebar,
        setSidebar,
        mobileSidebar,
        setMobileSidebar,
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
        useAutoConfig,
        setUseAutoConfig,
        currentGame,
        setCurrentGame,
        houseEdge,
        setHouseEdge,
        maxBetAmt,
        setMaxBetAmt,
        openVerifyModal,
        closeVerifyModal,
        setShowWalletModal,
        setCoinData,
        getUserDetails,
        getGlobalInfo,
        getWalletBalance,
        getBalance,
        getProvablyFairData,
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
  English: {
    ru: "Английский",
    ko: "영어",
    ch: "英语",
  },
  "Connect Wallet": {
    ru: "Подключить кошелек",
    ko: "지갑 연결",
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
  "more FOMO to reach": {
    ru: "Еще FOMO для достижения",
    ko: "다음 단계까지 필요한 FOMO",
    ch: "还需要更多FOMO",
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
};
