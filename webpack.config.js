const path = require('path');
const webpack = require('webpack');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, 'src', 'onairos.jsx'),
//   './src/onairos.jsx', // Replace with your entry file
  output: {
    publicPath: '/', // or ''
    path: path.resolve(__dirname, 'dist'),
    // The filename of the entry chunk
    filename: '[name].[contenthash].bundle.js',
    libraryTarget: 'umd', // This makes your library compatible with different module systems
    globalObject: 'this', // Ensures compatibility with both browser and Node environments
    chunkFilename: '[name].[contenthash].chunk.js',
  },
  // webpack.config.js
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            // drop_console: true, // Removes console.* statements
            // drop_debugger: true, // Removes debugger statements
            dead_code: true, // Removes unreachable code
          },
          mangle: true, // Renames variables and functions to shorter names
          output: {
            // comments: false, // Removes comments
          },
        },
        extractComments: false, // Does not extract comments to a separate file
      }),
    ],
  },
  // Make sure devtool is set to 'none' or false in production to disable source maps
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      // You can add more loaders here for other file types (e.g., CSS, images)
    ]
  },
  resolve: {
      extensions: ['.js', '.jsx', '.mjs'], // Add '.mjs' for ES Module files,
      fallback: {
        // "buffer": require.resolve("buffer/"),
        // Add any other polyfills here
      }
    },
    
};
