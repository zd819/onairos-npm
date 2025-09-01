import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, './setup.js')],
    include: ['tests/laravel/**/*.test.js']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      'onairos': resolve(__dirname, '../../src/index.js'),
      'onairos/blade': resolve(__dirname, '../../src/laravel/blade-helpers.js'),
      'onairos/vite-plugin': resolve(__dirname, '../../src/laravel/vite-plugin.js')
    }
  }
}); 