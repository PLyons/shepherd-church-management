// vitest.config.ts
// Vitest testing framework configuration with React testing environment setup
// This file exists to configure the testing environment for unit and integration tests with jsdom
// RELEVANT FILES: vite.config.ts, src/test/setup.ts, package.json, src/**/__tests__/**

/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});