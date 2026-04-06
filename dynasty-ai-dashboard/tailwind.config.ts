import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        "dynasty-blue": "#1e40af",
        "dynasty-purple": "#7c3aed",
      },
    },
  },
  plugins: [],
}
export default config
