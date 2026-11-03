import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rupee: {
          green: "#006B3C",
          "green-hover": "#005530",
          "green-light": "#E6F4EA",
          yellow: "#F5C400",
          "yellow-hover": "#D9AE00",
          "yellow-light": "#FFF9E6",
          dark: "#1F2937",
          gray: "#4B5563",
          lightGray: "#F3F4F6",
          border: "#E5E7EB",
        },
      },
    },
  },
  plugins: [],
};
export default config;
