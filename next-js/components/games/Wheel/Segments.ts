type RiskToChance = Record<
  string,
  Array<{ multiplier: number; chance: number; color: string }>
>;

export const riskToChance: RiskToChance = {
  low: [
    {
      multiplier: 0,
      chance: 10,
      color: "#343843",
    },
    {
      multiplier: 1.1,
      chance: 30,
      color: "#BEC6D1",
    },
    {
      multiplier: 0,
      chance: 10,
      color: "#343843",
    },
    {
      multiplier: 1.1,
      chance: 30,
      color: "#BEC6D1",
    },
    {
      multiplier: 2,
      chance: 20,
      color: "#886CFF",
    },
  ],
  medium: [
    {
      multiplier: 3,
      chance: 10,
      color: "#C7F025",
    },
    {
      multiplier: 0,
      chance: 10,
      color: "#343843",
    },
    {
      multiplier: 1,
      chance: 10,
      color: "#BEC6D1",
    },
    {
      multiplier: 0,
      chance: 10,
      color: "#343843",
    },
    {
      multiplier: 2.5,
      chance: 10,
      color: "#FF5F5F",
    },
    {
      multiplier: 0,
      chance: 10,
      color: "#343843",
    },
    {
      multiplier: 1.5,
      chance: 10,
      color: "#BEC6D1",
    },
    {
      multiplier: 0,
      chance: 10,
      color: "#343843",
    },
    {
      multiplier: 2,
      chance: 10,
      color: "#886CFF",
    },
    {
      multiplier: 0,
      chance: 10,
      color: "#343843",
    },
  ],
  high: [
    {
      multiplier: 10,
      chance: 10,
      color: "#C7F025",
    },
    {
      multiplier: 0,
      chance: 90,
      color: "#343843",
    },
  ],
};
