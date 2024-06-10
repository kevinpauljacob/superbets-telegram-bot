export const wsEndpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT!;

export const minGameAmount = 1e-6;

export const timeWeightedAvgInterval = 24 * 60 * 60 * 1000;
export const timeWeightedAvgLimit: Record<string, number> = {
  SOL: 50,
  USDC: 100,
  FOMO: 10000,
};
export const userLimitMultiplier = 5;

export const optionsEdge = 0.1;
