const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'src', 'onairos.jsx'),
//   './src/onairos.jsx', // Replace with your entry file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'onairos.bundle.js',
    libraryTarget: 'umd', // This makes your library compatible with different module systems
    globalObject: 'this' // Ensures compatibility with both browser and Node environments
  },
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
      extensions: ['.js', '.jsx', '.mjs'] // Add '.mjs' for ES Module files
    } 
};
