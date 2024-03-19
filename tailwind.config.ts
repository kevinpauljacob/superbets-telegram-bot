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
      },
      transitionProperty: {
        width: "width",
      },
      screens: {
        xs: "400px",
      },
      fontFamily: {
        koulen: ["Koulen", "sans-serif"],
        changa: ["Changa", "sans-serif"],
        bungee: ["Bungee", "cursive"],
        lilita: ["Lilita One", "sans serif"],
        goldman: ["Goldman", "sans serif"],
    },
    },
  },
  plugins: [],
};
export default config;
