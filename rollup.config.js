// rollup.config.js
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import inject from '@rollup/plugin-inject';

export default {
  // Tell Rollup not to include react and react-dom in the bundle:
  external: ['react', 'react-dom'],
  input: 'src/index.js',
  output: {
    file: 'dist/onairos.umd.js',
    format: 'umd',
    name: 'Onairos',
    exports: 'named', // <--- This forces named export
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    inlineDynamicImports: true,
    sourcemap: true,
  },
  plugins: [
    json(),
    resolve({
      browser: true,
      preferBuiltins: false,
      mainFields: ['browser', 'module', 'main'],
    }),
    typescript(),
    babel({
      presets: ['@babel/preset-react'],
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    commonjs({
      include: /node_modules/,
      requireReturnsDefault: 'auto',
    }),
    // Inject polyfills for Node globals:
    inject({
      Buffer: ['buffer', 'Buffer'],
      process: 'process',
    }),
  ],
};

