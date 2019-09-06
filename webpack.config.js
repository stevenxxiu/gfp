'use strict'
let autoprefixer = require('autoprefixer')
let fs = require('fs')
let path = require('path')
let webpack = require('webpack')
let env = process.env.NODE_ENV.trim()
let resRoot = path.resolve('.').replace(/\\/g, '/')

module.exports = {
  mode: 'development',
  entry: {browser: 'gfp/bin/main.js', pref: 'gfp/bin/pref.js'}[env],
  resolve: {modules: ['node_modules', '.', 'gfp/lib']},
  externals: {
    'jquery': '$',
    'slickgrid': 'Slick',
    'chai': 'chai',
    'sinon': 'sinon',
  },
  module: {
    rules: [
      {
        test: /\.html$/, loader: 'html-loader', options: {minimize: true, attrs: 'img:src', root: resRoot},
      }, {
        test: /\.sass$/, use: [
          {loader: 'css-loader'},
          {loader: 'postcss-loader', options: {plugins: [autoprefixer({overrideBrowserslist: ['last 2 versions']})]}},
          {loader: 'sass-loader'},
        ],
      }, {
        test: /\.png$/, loader: 'url-loader', options: {mimetype: 'img/png', limit: 10000},
      }, {
        test: /\.js$/, exclude: [path.resolve('gfp/lib')], loader: 'babel-loader', options: {plugins: [
          ...(env == 'test' ? ['istanbul'] : []),
        ]},
      },
    ],
  },
  plugins: [
    new webpack.BannerPlugin({banner: env != 'browser' ? '' : fs.readFileSync('gfp/header.js', 'utf-8'), raw: true}),
  ],
  watch: true,
  performance: {hints: false},
  devtool: env != 'browser' ? 'inline-source-map': '#',
}
