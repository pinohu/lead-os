import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "dynasty-blue": "#1e40af",
        "dynasty-purple": "#7c3aed",
      },
    },
  },
  plugins: [],
}
export default config
