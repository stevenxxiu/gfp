'use strict'
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const env = (process.env.NODE_ENV || 'script').trim()

module.exports = {
  mode: 'development',
  entry: { script: 'gfp/bin/main.js', pref: 'gfp/bin/pref.js' }[env],
  resolve: { modules: ['node_modules', '.', 'gfp/lib'] },
  externals: {
    jquery: '$',
    slickgrid: 'Slick',
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
        options: { minimize: true },
      },
      {
        test: /\.sass$/,
        use: [
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [['postcss-preset-env', { browsers: 'last 2 versions' }]],
              },
            },
          },
          { loader: 'sass-loader' },
        ],
      },
      {
        test: /\.png$/,
        type: 'asset/inline',
      },
      {
        test: /\.js$/,
        exclude: [path.resolve('gfp/lib')],
        loader: 'babel-loader',
      },
    ],
  },
  output: {
    publicPath: '/',
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: env !== 'script' ? '' : fs.readFileSync('gfp/header.js', 'utf-8'),
      raw: true,
    }),
  ],
  watch: true,
  performance: { hints: false },
  devtool: env !== 'script' ? 'inline-source-map' : false,
}
