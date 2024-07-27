import FOMO from "@/public/assets/coins/FOMO";
import SOL from "@/public/assets/coins/SOL";
import SUPER from "@/public/assets/coins/SUPER";
import USDC from "@/public/assets/coins/USDC";
import { GameTokens, GameType } from "@/utils/provably-fair";

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "development";

export type spl_token = {
  tokenName: string;
  tokenMint: string;
  decimal: number;
  icon: any;
};

const SPL_TOKENS: Array<spl_token> = [
  // {
  //   tokenName: "SOL",
  //   tokenMint: "SOL", //So11111111111111111111111111111111111111112
  //   decimal: 9,
  //   icon: SOL,
  // },
  // {
  //   tokenName: "USDC",
  //   tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  //   decimal: 6,
  //   icon: USDC,
  // },
  // {
  //   tokenName: "FOMO",
  //   tokenMint: "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw",
  //   decimal: 9,
  //   icon: FOMO,
  // },
  {
    tokenName: "SUPER",
    tokenMint: "SUPER",
    decimal: 6,
    icon: SUPER,
  },
];

export const stakingTiers: Record<
  number,
  {
    limit: number;
    multiplier: number;
  }
> = {
  0: {
    limit: 0,
    multiplier: 0.5,
  },
  1: {
    limit: 300,
    multiplier: 1,
  },
  2: {
    limit: 3000,
    multiplier: 1.05,
  },
  3: {
    limit: 15000,
    multiplier: 1.15,
  },
  4: {
    limit: 40000,
    multiplier: 1.3,
  },
  5: {
    limit: 75000,
    multiplier: 1.5,
  },
  6: {
    limit: 150000,
    multiplier: 1.75,
  },
  7: {
    limit: 600000,
    multiplier: 2,
  },
};

export const pointTiers: Record<
  number,
  {
    limit: number;
    label: string;
    text: string;
  }
> = {
  0: {
    limit: 0,
    label: "BRONZE I",
    text: "Do you even FOMO bro?",
  },
  1: {
    limit: 300,
    label: "BRONZE II",
    text: "Do you even FOMO bro?",
  },
  2: {
    limit: 875,
    label: "BRONZE III",
    text: "Do you even FOMO bro?",
  },
  3: {
    limit: 1500,
    label: "BRONZE IV",
    text: "Do you even FOMO bro?",
  },
  4: {
    limit: 2700,
    label: "BRONZE V",
    text: "Do you even FOMO bro?",
  },
  5: {
    limit: 5000,
    label: "SILVER I",
    text: "Caught the FOMO bug?",
  },
  6: {
    limit: 8000,
    label: "SILVER II",
    text: "Caught the FOMO bug?",
  },
  7: {
    limit: 11500,
    label: "SILVER III",
    text: "Caught the FOMO bug?",
  },
  8: {
    limit: 15500,
    label: "SILVER IV",
    text: "Caught the FOMO bug?",
  },
  9: {
    limit: 20000,
    label: "SILVER V",
    text: "Caught the FOMO bug?",
  },
  10: {
    limit: 25000,
    label: "GOLD I",
    text: "FOMO is rising...",
  },
  11: {
    limit: 32000,
    label: "GOLD II",
    text: "FOMO is rising...",
  },
  12: {
    limit: 44000,
    label: "GOLD III",
    text: "FOMO is rising...",
  },
  13: {
    limit: 60000,
    label: "GOLD IV",
    text: "FOMO is rising...",
  },
  14: {
    limit: 79000,
    label: "GOLD V",
    text: "FOMO is rising...",
  },
  15: {
    limit: 100000,
    label: "PLATINUM",
    text: "On your way to FOMOtopia.",
  },
  16: {
    limit: 250000,
    label: "ELITE",
    text: "FOMO Jedi - May the gains be with you.",
  },
  17: {
    limit: 500000,
    label: "SUPREME",
    text: "FOMO Wizard - Spreading magic.",
  },
  18: {
    limit: 750000,
    label: "LEGENDARY",
    text: "FOMO God – Missing out is for mortals, not you.",
  },
  19: {
    limit: 1000000,
    label: "MYTHICAL",
    text: "FOMO is You and You are FOMO.",
  },
};

export const houseEdgeTiers: Record<number, number> = {
  0: 0.01,
  1: 0.009,
  2: 0.0075,
  3: 0.006,
  4: 0.005,
  5: 0.0035,
  6: 0.0015,
  7: 0,
};

type PayoutValue<T> = number;

let maxPayouts: {
  [K in GameTokens]: {
    [K in GameType]: PayoutValue<K>;
  };
};

const commissionLevels: Record<number, number> = {
  0: 0.25,
  1: 0.035,
  2: 0.025,
  3: 0.02,
  4: 0.01,
};

let wsEndpoint: string;

let minGameAmount: number;

let timeWeightedAvgInterval: number;
let timeWeightedAvgLimit: Record<string, number>;
let userLimitMultiplier: number;

let optionsEdge: number;

let launchPromoEdge = false;
let maintainance = false;

let minAmtFactor: number = 10 ** -3;

if (environment === "development") {
  maxPayouts = {
    [GameTokens.SOL]: {
      [GameType.dice]: 1,
      [GameType.coin]: 1,
      [GameType.options]: 1,
      [GameType.dice2]: 1,
      [GameType.wheel]: 1,
      [GameType.plinko]: 1,
      [GameType.limbo]: 1,
      [GameType.roulette1]: 1,
      [GameType.roulette2]: 1,
      [GameType.keno]: 1,
      [GameType.mines]: 1,
      [GameType.hilo]: 1,
    },
    [GameTokens.FOMO]: {
      [GameType.dice]: 1,
      [GameType.coin]: 1,
      [GameType.options]: 1,
      [GameType.dice2]: 1,
      [GameType.wheel]: 1,
      [GameType.plinko]: 1,
      [GameType.limbo]: 1,
      [GameType.roulette1]: 1,
      [GameType.roulette2]: 1,
      [GameType.keno]: 1,
      [GameType.mines]: 1,
      [GameType.hilo]: 1,
    },
    [GameTokens.USDC]: {
      [GameType.dice]: 1,
      [GameType.coin]: 1,
      [GameType.options]: 1,
      [GameType.dice2]: 1,
      [GameType.wheel]: 1,
      [GameType.plinko]: 1,
      [GameType.limbo]: 1,
      [GameType.roulette1]: 1,
      [GameType.roulette2]: 1,
      [GameType.keno]: 1,
      [GameType.mines]: 1,
      [GameType.hilo]: 1,
    },
    [GameTokens.SUPER]: {
      [GameType.dice]: 1,
      [GameType.coin]: 1,
      [GameType.options]: 1,
      [GameType.dice2]: 1,
      [GameType.wheel]: 1,
      [GameType.plinko]: 1,
      [GameType.limbo]: 1,
      [GameType.roulette1]: 1,
      [GameType.roulette2]: 1,
      [GameType.keno]: 1,
      [GameType.mines]: 1,
      [GameType.hilo]: 1,
    },
  };

  wsEndpoint = "wss://fomo-staking-1.onrender.com";

  minGameAmount = 0.000001;
  minAmtFactor = 10 ** -6;

  timeWeightedAvgInterval = 24 * 60 * 60 * 1000;
  timeWeightedAvgLimit = {
    SOL: 50,
    USDC: 100,
    FOMO: 10000,
  };
  userLimitMultiplier = 5;

  optionsEdge = 0.1;
  launchPromoEdge = false;
  maintainance = false;
} else if (environment === "production") {
  maxPayouts = {
    [GameTokens.SOL]: {
      [GameType.dice]: 1,
      [GameType.coin]: 1,
      [GameType.options]: 1,
      [GameType.dice2]: 1,
      [GameType.wheel]: 1,
      [GameType.plinko]: 1,
      [GameType.limbo]: 1,
      [GameType.roulette1]: 1,
      [GameType.roulette2]: 1,
      [GameType.keno]: 1,
      [GameType.mines]: 1,
      [GameType.hilo]: 1,
    },
    [GameTokens.FOMO]: {
      [GameType.dice]: 7500,
      [GameType.coin]: 7500,
      [GameType.options]: 7500,
      [GameType.dice2]: 7500,
      [GameType.wheel]: 7500,
      [GameType.plinko]: 7500,
      [GameType.limbo]: 7500,
      [GameType.roulette1]: 7500,
      [GameType.roulette2]: 7500,
      [GameType.keno]: 7500,
      [GameType.mines]: 7500,
      [GameType.hilo]: 7500,
    },
    [GameTokens.USDC]: {
      [GameType.dice]: 125,
      [GameType.coin]: 125,
      [GameType.options]: 125,
      [GameType.dice2]: 125,
      [GameType.wheel]: 125,
      [GameType.plinko]: 125,
      [GameType.limbo]: 125,
      [GameType.roulette1]: 125,
      [GameType.roulette2]: 125,
      [GameType.keno]: 125,
      [GameType.mines]: 125,
      [GameType.hilo]: 125,
    },
    [GameTokens.SUPER]: {
      [GameType.dice]: 1,
      [GameType.coin]: 1,
      [GameType.options]: 1,
      [GameType.dice2]: 1,
      [GameType.wheel]: 1,
      [GameType.plinko]: 1,
      [GameType.limbo]: 1,
      [GameType.roulette1]: 1,
      [GameType.roulette2]: 1,
      [GameType.keno]: 1,
      [GameType.mines]: 1,
      [GameType.hilo]: 1,
    },
  };

  wsEndpoint = "wss://ws.fomowtf.com";

  minGameAmount = 0.001;
  minAmtFactor = 10 ** -3;

  timeWeightedAvgInterval = 24 * 60 * 60 * 1000;
  timeWeightedAvgLimit = {
    SOL: 50,
    USDC: 500,
    FOMO: 30000,
  };
  userLimitMultiplier = 5;

  optionsEdge = 0.1;
  launchPromoEdge = false;
  maintainance = false;
}

export {
  SPL_TOKENS,
  wsEndpoint,
  minGameAmount,
  minAmtFactor,
  timeWeightedAvgInterval,
  timeWeightedAvgLimit,
  userLimitMultiplier,
  optionsEdge,
  launchPromoEdge,
  maintainance,
  maxPayouts,
  commissionLevels,
};
