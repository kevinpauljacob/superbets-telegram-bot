import FOMO from "@/public/assets/coins/FOMO";
import SOL from "@/public/assets/coins/SOL";
import USDC from "@/public/assets/coins/USDC";

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "development";

export type spl_token = {
  tokenName: string;
  tokenMint: string;
  decimal: number;
  icon: any;
};

const SPL_TOKENS: Array<spl_token> = [
  {
    tokenName: "SOL",
    tokenMint: "SOL", //So11111111111111111111111111111111111111112
    decimal: 9,
    icon: SOL,
  },
  {
    tokenName: "USDC",
    tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimal: 6,
    icon: USDC,
  },
  {
    tokenName: "FOMO",
    tokenMint: "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw",
    decimal: 9,
    icon: FOMO,
  },
  // {
  //   tokenName: "USDT",
  //   tokenMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  //   decimal: 6,
  //   icon: "https://upload.wikimedia.org/wikipedia/commons/0/01/USDT_Logo.png",
  // },
];

let wsEndpoint: string;

let minGameAmount: number;

let timeWeightedAvgInterval: number;
let timeWeightedAvgLimit: Record<string, number>;
let userLimitMultiplier: number;

let optionsEdge: number;

let launchPromoEdge = false;
let maintainance = false;

if (environment === "development") {
  wsEndpoint = "wss://fomo-staking-1.onrender.com";

  minGameAmount = 0.000001;

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
  //TODO: Add production config

  wsEndpoint = "";

  minGameAmount = 0.000001;

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
}

export {
  SPL_TOKENS,
  wsEndpoint,
  minGameAmount,
  timeWeightedAvgInterval,
  timeWeightedAvgLimit,
  userLimitMultiplier,
  optionsEdge,
  launchPromoEdge,
  maintainance,
};
