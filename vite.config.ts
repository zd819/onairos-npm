import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'Onairos',
      formats: ['es', 'cjs'],
    },
    assetsDir: 'assets',
  },
  assetsInclude: ['**/*.png'],
});
