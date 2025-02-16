// rollup.config.js
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import inject from '@rollup/plugin-inject';

export default {
  input: 'src/index.js', // Your cleaned entry file
  output: {
    file: 'dist/onairos.umd.js',
    format: 'umd',
    name: 'Onairos',
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
    },
    inlineDynamicImports: true,
    sourcemap: true,
  },
  plugins: [
    json(),
    resolve({
      browser: true,             // Use browser-specific modules
      preferBuiltins: false,     // Bundle dependencies instead of using Node built-ins
      mainFields: ["browser", "module", "main"],
    }),
    typescript(),
    babel({
      presets: ['@babel/preset-react'],
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    commonjs({
      include: /node_modules/,
      requireReturnsDefault: "auto",
    }),
    // Inject polyfills for Node globals:
    inject({
      Buffer: ['buffer', 'Buffer'],
      process: 'process',
    }),
  ],
};
