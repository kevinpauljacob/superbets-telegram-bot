import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "leaderboard-bg": "url('/assets/leaderboard-bg.svg')",
      },
      transitionProperty: {
        width: "width",
      },
      screens: {
        xs: "400px",
        lg2: '1160px'
      },
      colors: {
        "fomo-green": "#72F238",
        "fomo-red": "#F1323E",
        "staking-secondary": "#94A3B8",
        "staking-bg": "#121418",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        koulen: ["Koulen", "sans-serif"],
        changa: ["Changa", "sans-serif"],
        bungee: ["Bungee", "cursive"],
        lilita: ["Lilita One", "sans serif"],
        goldman: ["Goldman", "sans serif"],
        chakra: ["Chakra Petch", "sans serif"],
      },
    },
  },
  plugins: [],
};
export default config;
