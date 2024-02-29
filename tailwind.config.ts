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
      // keyframes: {
      //   "rotate-y": {
      //     "0%": {
      //       transform: "rotateY(0deg)",
      //     },
      //     "100%": {
      //       transform: "rotateY(180deg)",
      //     },
      //   },
      // },
      // animation: {
      //   'rotate-y': 'rotate-y 1s ease-in-out forwards',
      // }
    },
  },
  plugins: [],
};
export default config;
