// postcss.config.js
// PostCSS configuration for CSS processing with TailwindCSS and Autoprefixer plugins
// This file exists to configure CSS post-processing pipeline for the build system
// RELEVANT FILES: tailwind.config.js, vite.config.ts, src/index.css, package.json

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}