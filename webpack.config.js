const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const baseConfig = {
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
    },
    'ajv': 'ajv',
    'ajv/dist/runtime/validation_error': 'ajv/dist/runtime/validation_error',
    'ajv/dist/runtime/equal': 'ajv/dist/runtime/equal',
    'ajv/dist/runtime/ucs2length': 'ajv/dist/runtime/ucs2length',
    'ajv/dist/runtime/uri': 'ajv/dist/runtime/uri',
    '@anthropic-ai/sdk': '@anthropic-ai/sdk',
    '@google/generative-ai': '@google/generative-ai',
    '@pinecone-database/pinecone': '@pinecone-database/pinecone',
    'openai': 'openai'
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
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "assert": require.resolve("assert"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "url": require.resolve("url"),
      "zlib": require.resolve("browserify-zlib"),
      "path": require.resolve("path-browserify"),
      "vm": require.resolve("vm-browserify"),
      "fs": false,
      "net": false,
      "tls": false,
      "child_process": false
    }
  }
};

module.exports = [
  // UMD build for browsers
  {
    ...baseConfig,
    entry: {
      onairos: path.resolve(__dirname, 'src', 'onairos.jsx'),
      iframe: path.resolve(__dirname, 'src', 'iframe', 'data_request_page.js')
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: (pathData) => {
        return pathData.chunk.name === 'onairos' ? 'onairos.bundle.js' : '[name].bundle.js';
      },
      libraryTarget: 'umd',
      library: 'Onairos',
      globalObject: 'this',
      umdNamedDefine: true,
      publicPath: 'auto',
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
            from: path.resolve(__dirname, 'public', 'data_request_popup.html'),
            to: path.resolve(__dirname, 'dist', 'data_request_popup.html')
          }
        ]
      })
    ]
  },
  // ESM build
  {
    ...baseConfig,
    entry: path.resolve(__dirname, 'src', 'onairos.jsx'),
    experiments: {
      outputModule: true
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'onairos.esm.js',
      library: {
        type: 'module'
      },
      environment: {
        module: true
      }
    },
    externals: {
      react: 'react',
      'react-dom': 'react-dom',
      'ajv': 'ajv',
      'ajv/dist/runtime/validation_error': 'ajv/dist/runtime/validation_error',
      'ajv/dist/runtime/equal': 'ajv/dist/runtime/equal',
      'ajv/dist/runtime/ucs2length': 'ajv/dist/runtime/ucs2length',
      'ajv/dist/runtime/uri': 'ajv/dist/runtime/uri',
      '@anthropic-ai/sdk': '@anthropic-ai/sdk',
      '@google/generative-ai': '@google/generative-ai',
      '@pinecone-database/pinecone': '@pinecone-database/pinecone',
      'openai': 'openai'
    }
  }
];