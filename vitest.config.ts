import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Plain Node test environment is enough for everything currently tested
// (pure pricing/cart math, store logic) — no DOM/jsdom needed yet. If
// component tests are added later, switch `environment` to 'jsdom' and add
// the `jsdom` dev dependency.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    globals: false,
  },
});
