import { User } from "@/context/transactions";
import { createContext, useContext, useState, ReactNode } from "react";

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
}

const GlobalContext = createContext<GlobalContextProps | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "ru" | "ko" | "ch">("en");
  const [userData, setUserData] = useState<User | null>(null);
  const [stake, setStake] = useState(true);
  const [amount, setAmount] = useState(0);
  const [solBal, setSolBal] = useState<number>(0.0);

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
  "Use a referral code (optional)": {
    ru: "Используйте реферальный код (необязательный)",
    ko: "추천 코드 사용 (선택 과목)",
    ch: "使用推荐代码（可选）",
  },
  "Referrer receives 10% of all the SOL you degen away.": {
    ru: "Реферер получает 10% от всех SOL, которые вы отдали.",
    ko: "추천인은 귀하가 떨어진 모든 SOL의 10%를 받습니다.",
    ch: "推荐人将获得您消耗的所有SOL的10％。",
  },
  "Apply Code": {
    ru: "Применить код",
    ko: "코드 적용",
    ch: "应用代码",
  },
  "Invalid Code": {
    ru: "Неверный код",
    ko: "유효하지 않은 코드",
    ch: "无效的代码",
  },
  "Step 1 : Select keys": {
    ru: "Шаг 1: Выберите ключи",
    ko: "1단계: 키 선택",
    ch: "步骤1：选择密钥",
  },
  "Step 2 : Select team": {
    ru: "Шаг 2: Выберите команду",
    ko: "2단계: 팀 선택",
    ch: "步骤2：选择团队",
  },
  "More info": {
    ru: "Больше информации",
    ko: "더 많은 정보",
    ch: "更多信息",
  },
  Back: {
    ru: "Назад",
    ko: "뒤쪽에",
    ch: "返回",
  },
  "Referral code applied successfully !!": {
    ru: "Реферальный код успешно применен!",
    ko: "추천코드가 성공적으로 적용되었습니다!!",
    ch: "推荐代码已成功应用！!",
  },
  "keys bought successfully !!": {
    ru: "ключи успешно куплены!!",
    ko: "열쇠 구입 성공!!",
    ch: "钥匙购买成功！!",
  },
  "Game id not found": {
    ru: "Идентификатор игры не найден",
    ko: "게임 ID를 찾을 수 없습니다",
    ch: "找不到遊戲ID",
  },
  KEY: {
    ru: "КЛЮЧ",
    ko: "密钥",
    ch: "鑰匙",
  },
  KEYS: {
    ru: "КЛЮЧИ",
    ko: "密钥",
    ch: "按鍵",
  },
  Keys: {
    ru: "ключей",
    ko: "키",
    ch: "按鍵",
  },
  "Break Time": {
    ru: "Перерыв",
    ko: "휴식 시간",
    ch: "休息时间",
  },
  Buy: {
    ru: "Купить",
    ko: "구입하다",
    ch: "购买",
  },
  "keys for": {
    ru: "ключи для",
    ko: "키",
    ch: "钥匙",
  },
  "Recent Buyers": {
    ru: "Последние покупатели",
    ko: "최근 구매자",
    ch: "最近的买家",
  },
  "History of recent purchases... Do you see a pattern here? Mhh..": {
    ru: "История недавних покупок... Замечаете ли вы здесь какой-то шаблон? Мхм..",
    ko: "최근 구매 내역... 여기서 어떤 패턴을 보시나요? 음..",
    ch: "最近购买记录...你在这里看到了什么模式？哦..",
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
  "Winner, winner, chicken dinner in": {
    ru: "Победитель, победитель, куриный обед через",
    ko: "우승자, 닭 저녁 식사까지",
    ch: "赢家，赢家，晚餐时间还有",
  },
  "Active Pot": {
    ru: "Активный банк",
    ko: "활성화된 상금",
    ch: "活跃奖池",
  },
  "Your Keys": {
    ru: "Ваши ключи",
    ko: "당신의 키",
    ch: "你的密钥",
  },
  "Your Earnings": {
    ru: "Ваши заработки",
    ko: "당신의 수익",
    ch: "您的收益",
  },
  Total: {
    ru: "Всего",
    ko: "총",
    ch: "总",
  },
  "SOL you earned in this round.": {
    ru: "SOL, которую вы заработали в этом раунде.",
    ko: "이번 라운드에서 얻은 SOL입니다.",
    ch: "本轮获得的 SOL。",
  },
  "Your current game keys.": {
    ru: "Ваши текущие ключи игры.",
    ko: "현재 게임 키입니다.",
    ch: "您当前的游戏密钥。",
  },
  "Current jackpot amount.": {
    ru: "Текущая сумма джекпота.",
    ko: "현재 잭팟 금액.",
    ch: "当前奖池金额。",
  },
  "Total Invested": {
    ru: "Всего инвестировано",
    ko: "총 투자된 금액",
    ch: "总投资额",
  },
  "Distributed Rewards": {
    ru: "Распределенные награды",
    ko: "배포된 보상",
    ch: "分发奖励",
  },
  "Time Purchased": {
    ru: "Время покупки",
    ko: "구매 시간",
    ch: "购买时间",
  },
  "Total SOL spent this round by users.": {
    ru: "Общее количество SOL, потраченное в этом раунде пользователями.",
    ko: "이 라운드에서 사용자가 사용한 총 SOL.",
    ch: "本轮用户总花费的SOL。",
  },
  "Total SOL distributed to key holders this round.": {
    ru: "Общее количество SOL, распределенное владельцам ключей в этом раунде.",
    ko: "이번 라운드에 키 홀더에게 배포된 총 SOL.",
    ch: "本轮向密钥持有人分配的SOL总量。",
  },
  "Total time added by all players through purchasing keys": {
    ru: "Общее время, добавленное всеми игроками при покупке ключей.",
    ko: "모든 플레이어가 키를 구매하여 추가한 총 시간",
    ch: "所有玩家通过购买密钥添加的总时间",
  },
  "Advisory board": {
    ru: "Консультативный совет",
    ko: "자문위원회",
    ch: "顾问委员会",
  },
  "Refer your friends to join the party and earn 10% of all their key purchases. Win-win, right?":
    {
      ru: "Приглашайте своих друзей присоединиться к вечеринке и зарабатывайте 10% от всех их покупок ключей. Беспроигрышный вариант, правда?",
      ko: "친구를 파티에 초대하고 모든 주요 구매 금액의 10%를 받으세요. 윈윈이죠?",
      ch: "邀请您的朋友加入派对，赚取他们所有密钥购买金额的10％。 双赢，对吧？",
    },
  "Create Code": {
    ru: "Создать код",
    ko: "코드 생성",
    ch: "创建代码",
  },
  "Code already in use.": {
    ru: "Код уже используется.",
    ko: "코드가 이미 사용 중입니다.",
    ch: "代码已在使用中。",
  },
  "Create a referral code first !!": {
    ru: "Сначала создайте реферальный код !!",
    ko: "먼저 추천코드를 만드세요!!",
    ch: "首先创建推荐代码！！",
  },
  "Copied to clipboard !!": {
    ru: "Скопировано в буфер обмена!!",
    ko: "클립보드에 복사되었습니다!!",
    ch: "复制到剪贴板！！",
  },
  "Referral code created successfully !!": {
    ru: "Реферальный код успешно создан!!",
    ko: "추천 코드가 성공적으로 생성되었습니다!!",
    ch: "推荐代码创建成功！！",
  },
  "Wallet must purchase keys using your link. Generating Referral code requires additional fee of":
    {
      ru: "Кошелек должен приобрести ключи по вашей ссылке. Генерация реферального кода требует дополнительной платы в размере",
      ko: "월렛은 귀하의 링크를 사용하여 키를 구매해야 합니다. 추천 코드 생성에는 추가 수수료가 필요합니다.",
      ch: "钱包必须使用您的链接购买密钥。生成推荐代码需要额外的费用",
    },
  "Total Referred": {
    ru: "Всего рефералов",
    ko: "총 추천",
    ch: "总参考",
  },
  Referred: {
    ru: "Рефералов",
    ko: "추천",
    ch: "被推荐",
  },
  "Referral Returns": {
    ru: "Возвраты по рефералам",
    ko: "추천 보상",
    ch: "推荐返还",
  },
  Stats: {
    ru: "Статистика",
    ko: "통계",
    ch: "统计数据",
  },
  "Number of Keys": {
    ru: "Количество ключей",
    ko: "키 수",
    ch: "键数",
  },
  "Share the fun, reap the rewards! 10% of your referrals' purchases will forever be going to YOU!":
    {
      ru: "Делитесь весельем и получайте награды! 10% ваших рефералов' покупки навсегда останутся у ВАС!",
      ko: "재미를 공유하고 보상을 받으세요! 추천의 10% 구매는 영원히 당신에게 갈 것입니다!",
      ch: "分享乐趣，收获奖励！ 您的推荐购买的10％将永远属于您！",
    },
  "Total number of people that you referred": {
    ru: "Общее количество людей, которых вы пригласили",
    ko: "귀하가 추천한 총 사람 수",
    ch: "您推荐的总人数",
  },

  "Key Returns": {
    ru: "Возврат ключа",
    ko: "키 리턴",
    ch: "密钥回报",
  },
  "Overall earnings excluding referrals.": {
    ru: "Общий доход за вычетом рефералов.",
    ko: "추천을 제외한 총 수입.",
    ch: "总收入，不包括推荐。",
  },
  "Total earnings from referrals.": {
    ru: "Общий доход от рефералов.",
    ko: "추천 수익 총액.",
    ch: "来自推荐的总收益。",
  },
  "Total Earnings": {
    ru: "Общий доход",
    ko: "총 수익",
    ch: "总收益",
  },
  "Total amount you can withdraw, earnings and referrals put together.": {
    ru: "Общая сумма, которую вы можете снять, доходы и реферальные начисления вместе.",
    ko: "인출할 수 있는 총 금액, 수입 및 추천을 모두 합친 것입니다.",
    ch: "您可以提取的总金额，包括收入和推荐奖金在内。",
  },
  Withdraw: {
    ru: "Снять",
    ko: "인출",
    ch: "提款",
  },
  "Wallet not connected": {
    ru: "Подключение кошелька не выполнено",
    ko: "지갑이 연결되지 않았습니다",
    ch: "未连接钱包",
  },
  "No funds to withdraw": {
    ru: "Нет средств для вывода",
    ko: "인출 할 자금이 없습니다",
    ch: "无可提取资金",
  },
  "Withdrawal successful": {
    ru: "Успешный вывод",
    ko: "인출 성공",
    ch: "成功提款",
  },
  "It's time to create your referral code and get ready to shill it...": {
    ru: "Пора создать свой реферальный код и быть готовым его рекламировать...",
    ko: "당신의 추천 코드를 만들고 준비하세요...",
    ch: "是时候创建您的推荐代码并准备好推销它了......",
  },
  YOU: {
    ru: "ТЫ",
    ko: "너",
    ch: "你",
  },
  "YOU ARE": {
    ru: "ТЫ",
    ko: "너는",
    ch: "你是",
  },
  "EXIT SCAMMED": {
    ru: "Выход из проекта с мошеннической целью",
    ko: "사기당함",
    ch: "退出欺诈",
  },
  "GETTING AWAY WITH": {
    ru: "УХОДИТЬ С",
    ko: "떠나가는 중",
    ch: "逃避",
  },
  "Solana down !": {
    ru: "Солана не работает!",
    ko: "솔라나 다운!",
    ch: "Solana崩溃！",
  },
  Join: {
    ru: "Присоединяйся",
    ko: "가입하기",
    ch: "加入",
  },
  "for updates on when we'll resume play": {
    ru: "чтобы узнать, когда мы возобновим игру",
    ko: "게임 재개 시 업데이트를 위해",
    ch: "了解我们何时恢复比赛的更新",
  },
  "The wait is almost over...": {
    ru: "Ожидание почти завершено...",
    ko: "대기가 거의 끝났습니다...",
    ch: "等待即将结束...",
  },
  "Break between games ongoing, load up your bags for the next round": {
    ru: "Перерыв между играми, готовьте свои сумки на следующий раунд",
    ko: "게임 간 휴식 중, 다음 라운드를 위해 가방을 싸세요",
    ch: "游戏之间的休息，为下一轮做好准备",
  },
  "This round has ended, buy a key to start a new round": {
    ru: "Этот раунд завершен, купите ключ, чтобы начать новый раунд",
    ko: "이 라운드가 끝났습니다. 새 라운드를 시작하려면 키를 구매하세요.",
    ch: "本轮比赛已结束，请购买钥匙以开始新一轮比赛",
  },
  "Round is in the pre-game phase, key prices are constant with max. of 30K keys":
    {
      ru: "Раунд находится в предварительной фазе игры, цены на ключи постоянны с максимальным количеством 30 тыс. ключей",
      ko: "이번 라운드는 프리게임 단계이며, 키 가격은 최대 30,000개의 키로 고정됩니다",
      ch: "本轮比赛处于预赛阶段，钥匙价格恒定，最多30,000个钥匙",
    },
  "This round is slowww, might as well buy another key": {
    ru: "Этот раунд медленный, лучше купить еще один ключ",
    ko: "이 라운드는 느리니까 다른 키를 사는 것도 괜찮아요",
    ch: "本轮比赛速度慢，最好买另一个钥匙",
  },
  "Create Referral": {
    ru: "Создать реферал",
    ko: "추천 생성",
    ch: "创建推荐",
  },
  "Buy Keys": {
    ru: "Купить ключи",
    ko: "열쇠 구매",
    ch: "购买钥匙",
  },
};
