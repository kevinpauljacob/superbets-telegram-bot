export const HOUSE_TAX = 0.3;
export const FLIP_TAX = 0.015;
export const ROLL_TAX = 0.015;

export const SPL_TOKENS = [
  {
    tokenName: "SOL",
    tokenMint: "SOL",//So11111111111111111111111111111111111111112
    decimal: 9,
    icon: "https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png",
    betSizes: [1, 3, 5],
    networks: ["solana"]
  },
  {
    tokenName: "BTC",
    tokenMint: "BTC",
    decimal: 8,
    icon: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Bitcoin_Logo.png",
    betSizes: [0.001, 0.005, 0.01],
    networks: ["bitcoin"]
  },
  {
    tokenName: "ETH",
    tokenMint: "ETH",
    decimal: 18,
    icon: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Ethereum_Logo.png",
    betSizes: [0.01, 0.05, 0.1], 
    networks: ["ethereum"]
  },
  {
    tokenName: "USDT",
    tokenMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimal: 6,
    icon: "https://upload.wikimedia.org/wikipedia/commons/0/01/USDT_Logo.png",
    betSizes: [1, 3, 5],
    networks: ["ethereum", "solana", "polygon"]
  },
  {
    tokenName: "USDC",
    tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimal: 6,
    icon: "https://upload.wikimedia.org/wikipedia/commons/4/49/USDC_Logo.png",
    betSizes: [1, 5, 20],
    networks: ["ethereum", "solana", "polygon"]
  },
];
