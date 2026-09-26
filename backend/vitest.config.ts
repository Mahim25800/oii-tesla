import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    isolate: true,
    testTimeout: 10000,
  },
});
