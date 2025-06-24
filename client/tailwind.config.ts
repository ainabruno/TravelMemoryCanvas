// client/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'rgba(0, 0, 0, 0.1)', // permet d'utiliser @apply border-border
      },
    },
  },
  plugins: [],
}

export default config
