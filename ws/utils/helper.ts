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
    label: "BRONZE",
    text: "Do you even FOMO bro?",
  },
  1: {
    limit: 5_000,
    label: "SILVER",
    text: "Caught the FOMO bug?",
  },
  2: {
    limit: 25_000,
    label: "GOLD",
    text: "FOMO is rising...",
  },
  3: {
    limit: 100_000,
    label: "PLATINUM",
    text: "On your way to FOMOtopia.",
  },
  4: {
    limit: 250_000,
    label: "ELITE",
    text: "FOMO Jedi - May the gains be with you.",
  },
  5: {
    limit: 500_000,
    label: "SUPREME",
    text: "FOMO Wizard - Spreading magic.",
  },
  6: {
    limit: 750_000,
    label: "LEGENDARY",
    text: "FOMO God – Missing out is for mortals, not you.",
  },
  7: {
    limit: 1_000_000,
    label: "MYTHICAL",
    text: "FOMO is You and You are FOMO.",
  },
};
