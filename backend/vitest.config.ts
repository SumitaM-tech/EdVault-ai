import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Backend has no CSS. An inline (empty) PostCSS config stops Vite from
  // walking up to the frontend's ../postcss.config.js (which needs tailwindcss).
  css: { postcss: { plugins: [] } },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-test-secret-123456',
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:5432/test?schema=public',
      ALLOW_MOCK_SERVICES: 'true',
      FRONTEND_URL: 'http://localhost:5173',
    },
  },
});
