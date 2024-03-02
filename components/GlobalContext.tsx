import { User } from "@/context/transactions";
import { useWallet } from "@solana/wallet-adapter-react";
import { createContext, useContext, useState, ReactNode } from "react";
import toast from "react-hot-toast";

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

  globalInfo: { users: number; stakedTotal: number };
  setGlobalInfo: (amount: { users: number; stakedTotal: number }) => void;

  getUserDetails: () => void;
  getGlobalInfo: () => void;
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
  const [globalInfo, setGlobalInfo] = useState<{
    users: number;
    stakedTotal: number;
  }>({ users: 0, stakedTotal: 0 });

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
        console.log("User: ", user);
        if (success) setUserData(user);
        else toast.error(message);
        if (stake) setSolBal(solBal - amount);
        else setSolBal(solBal + amount);
        // getWalletBalance();
      } catch (e) {
        toast.error("Unable to fetch balance.");
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
      console.log("Data: ", data);
      if (success) setGlobalInfo(data);
      // else toast.error(message);
    } catch (e) {
      toast.error("Unable to fetch balance.");
      console.error(e);
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
        globalInfo,
        setGlobalInfo,
        getUserDetails,
        getGlobalInfo
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
  "Sake your FOMO tokens to receive multipliers for your points which gets you amazing rewards from our store.":
    {
      ru: "Определите ваши токены FOMO, чтобы получить множители для ваших очков, которые позволят вам получить удивительные награды в нашем магазине.",
      ko: "상점에서 멋진 보상을 받을 수 있는 점수에 대한 곱셈기를 받기 위해 FOMO 토큰을 지정하세요.",
      ch: "把你的 FOMO 代币押出，以获得积分的倍增器，从而在我们的商店获得惊人的奖励。",
    },
  "Global staking Overview": {
    ru: "Обзор глобального стейкинга",
    ko: "글로벌 스테이킹 개요",
    ch: "全球质押概览",
  },
  "Total FOMO staked": {
    ru: "Всего заложено FOMO",
    ko: "총 FOMO 스테이크된 금액",
    ch: "总共 FOMO 抵押",
  },
  "Insufficient $FOMO": {
    ru: "Недостаточно $FOMO",
    ko: "$FOMO가 부족합니다",
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
  "My Multiplier": {
    ru: "Мой множитель",
    ko: "내 배수",
    ch: "我的倍数",
  },
  "My FOMO Available": {
    ru: "Мои доступные FOMO",
    ko: "내 사용 가능한 FOMO",
    ch: "我的可用 FOMO",
  },
  "My FOMO staked": {
    ru: "Мои FOMO вложены",
    ko: "내 FOMO 스테이크됨",
    ch: "我的 FOMO 抵押",
  },
  "My Staking Stats": {
    ru: "Моя статистика стейкинга",
    ko: "내 스테이킹 통계",
    ch: "我的质押统计",
  },
  "My Current tier": {
    ru: "Мой текущий уровень",
    ko: "내 현재 티어",
    ch: "我的当前层级",
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
};
