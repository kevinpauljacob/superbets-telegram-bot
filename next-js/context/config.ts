export type spl_token = {
  tokenName: string;
  tokenMint: string;
  decimal: number;
  icon: string;
};

export const SPL_TOKENS: Array<spl_token> = [
  {
    tokenName: "SOL",
    tokenMint: "SOL", //So11111111111111111111111111111111111111112
    decimal: 9,
    icon: "https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png",
  },
  {
    tokenName: "USDC",
    tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimal: 6,
    icon: "https://upload.wikimedia.org/wikipedia/commons/4/49/USDC_Logo.png",
  },
  {
    tokenName: "FOMO",
    tokenMint: "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw",
    decimal: 9,
    //TODO: change the icon
    icon: "https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f617277656176652e6e65742f4450564d673166466a73314e6e564a4f7a6662727565596f4232736d76364b6950347661684c79686b3163",
  },
  // {
  //   tokenName: "USDT",
  //   tokenMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  //   decimal: 6,
  //   icon: "https://upload.wikimedia.org/wikipedia/commons/0/01/USDT_Logo.png",
  // },
];
