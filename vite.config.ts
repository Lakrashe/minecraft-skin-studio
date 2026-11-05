/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    // The lazily loaded `three` chunk (~250 kB gzip) is the only one above
    // Vite's 500 kB default; it never blocks first paint (docs/ARCHITECTURE.md §2).
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        // Keep the 3D stack in its own chunk so pages without 3D never download it.
        codeSplitting: {
          groups: [{ name: 'three', test: /node_modules[\\/](three|@react-three)[\\/]/ }],
        },
      },
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'tooling',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          // Type-aware ESLint runs are slow on first use.
          testTimeout: 60_000,
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup-dom.ts'],
        },
      },
    ],
  },
});
