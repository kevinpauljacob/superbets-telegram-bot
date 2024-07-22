import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        // Adding a custom 14-column configuration
        14: "repeat(14, minmax(0, 1fr))",
      },
      dropShadow:{
        "3xl":'0px 4px 4px #1D1D1D'
      },
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
        xs2: "345px",
        xs: "400px",
        sm2: "475px",
        lg2: '1160px'
      },
      colors: {
        "fomo-green": "#3ED179",
        "fomo-red": "#D13E40",
        "staking-secondary": "#94A3B8",
        "staking-bg": "#121418",
        "table-secondary": "#171A20"
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
