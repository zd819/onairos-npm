const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { ProvidePlugin, NormalModuleReplacementPlugin } = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/onairos.native.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'onairos.native.js',
    library: {
      name: 'Onairos',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
  externals: {
    'react': 'react',
    'react-native': 'react-native',
    'react-dom': 'react-dom',
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        format: {
          comments: false,
        },
        compress: {
          drop_console: false, // Keep console logs for debugging
        },
      },
      extractComments: false,
    })],
  },
  plugins: [
    // Provide polyfills for browser APIs that might not exist in React Native
    new ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    // Replace browser-specific modules with empty modules for React Native
    new NormalModuleReplacementPlugin(
      /lucide-react/,
      path.resolve(__dirname, 'src/mobile/shims/lucide-shim.js')
    ),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      // Ignore native image formats that don't work in React Native
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              emitFile: false, // Don't emit files for React Native
              name: '[path][name].[ext]',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Add shims for browser APIs not available in React Native
      'browser-apis': path.resolve(__dirname, 'src/mobile/shims/browser-apis.js'),
    },
    fallback: {
      "crypto": false,
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "process": require.resolve("process/browser"),
    }
  },
};
