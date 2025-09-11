// vite.config.ts
// Vite build configuration with React plugin and path alias resolution
// This file exists to configure the Vite development server and build process for the React application
// RELEVANT FILES: vitest.config.ts, src/main.tsx, package.json, tsconfig.json

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})