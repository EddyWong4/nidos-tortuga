import { defineConfig } from 'vitest/config';

// Configuración propia: evita que Vitest use la de la app (vite.config.ts de la raíz).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 30_000,
  },
});
