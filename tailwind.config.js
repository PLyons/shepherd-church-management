// tailwind.config.js
// TailwindCSS configuration with custom color schemes and responsive design settings
// This file exists to configure TailwindCSS styling framework with church management system specific design tokens
// RELEVANT FILES: postcss.config.js, src/index.css, src/components/common/*, vite.config.ts

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}