const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = (env, argv) => {
  const config = {
    entry: {
      app: './src/main/app.ts',
      preload: './src/main/preload.ts'
    },
    target: 'electron-main',
    output: {
      path: path.resolve(__dirname, '../../dist'),
      filename: '[name].js',
      devtoolModuleFilenameTemplate: '[absolute-resource-path]'
    },
    externals: [
      nodeExternals(),
      nodeExternals({
        modulesDir: path.resolve(__dirname, '../../../../node_modules')
      })
    ],
    module: {
      rules: [
        {
          test: /\.ts?$/,
          loader: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.jsx', '.json'],
      alias: { src: path.resolve('./src') }
    },
    node: {
      __dirname: false
    },
    plugins: [
      new webpack.DefinePlugin({
        IS_DEV: argv.mode === 'development',
        IS_TESTING: env.isTesting ? true : false,
        WEBSITE_URL: JSON.stringify(
          argv.mode === 'development'
            ? 'http://localhost:3000/'
            : 'https://mockoon.com/'
        ),
        API_URL: JSON.stringify(
          argv.mode === 'development'
            ? 'http://localhost:5003/'
            : 'https://api.mockoon.com/'
        )
      })
    ]
  };

  if (argv.mode === 'development') {
    config.devtool = 'source-map';
  }

  return config;
};
