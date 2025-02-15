// rollup.config.js
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.js', // Adjust if your entry file is different
  output: {
    file: 'dist/onairos.umd.js',
    format: 'umd',
    name: 'Onairos',
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
    },
    inlineDynamicImports: true,
    sourcemap: true,  // Enable for debugging
  },
  plugins: [
    json(),
    resolve({
      browser: true,  // Ensure it resolves browser-compatible modules
      preferBuiltins: false, // Prevents using Node.js built-in modules
    }),
    typescript(),
    babel({
      presets: ['@babel/preset-react'],
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    commonjs({
      include: /node_modules/, // Ensures CommonJS dependencies work
      requireReturnsDefault: "auto", // Helps with default exports
    }),
  ],
};
