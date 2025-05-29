const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
      'react-dom': 'react-dom'
    }
  }
];