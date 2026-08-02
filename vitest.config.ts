import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  },
});
