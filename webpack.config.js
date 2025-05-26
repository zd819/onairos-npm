const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    main: path.resolve(__dirname, 'src', 'onairos.jsx'),
    iframe: path.resolve(__dirname, 'src', 'iframe', 'data_request_page.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
    publicPath: 'auto',
  },
  externals: {
    react: {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'React',
      root: 'React'
    },
    'react-dom': {
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'ReactDOM',
      root: 'ReactDOM'
    }
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            dead_code: true,
          },
          mangle: true,
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
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
      {
        test: /\.(png|jpg|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/[hash][ext][query]'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.mjs'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'iframe', 'data_request_iframe.html'),
      filename: 'data_request_iframe.html',
      chunks: ['iframe'],
      inject: true
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src', 'iframe', 'data_request_iframe.html'),
          to: path.resolve(__dirname, 'dist', 'data_request_iframe.html')
        }
      ]
    })
  ]
};