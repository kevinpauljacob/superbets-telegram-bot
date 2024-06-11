import FOMO from "@/public/assets/coins/FOMO";
import SOL from "@/public/assets/coins/SOL";
import USDC from "@/public/assets/coins/USDC";

export type spl_token = {
  tokenName: string;
  tokenMint: string;
  decimal: number;
  icon: any;
};

export const SPL_TOKENS: Array<spl_token> = [
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
