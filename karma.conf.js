'use strict'
module.exports = function(config){
  config.set({
    frameworks: ['mocha'],
    files: [
      'https://unpkg.com/chai@3.5.0/chai.js',
      'https://unpkg.com/sinon@2.0.0-pre.4/pkg/sinon.js',
      'gfp/bin/test.js',
    ],
    preprocessors: {'gfp/bin/test.js': ['webpack', 'sourcemap']},
    webpack: require('./webpack.config.js'),
    webpackMiddleware: {
      stats: {chunks: false},
    },
    client: {
      captureConsole: true,
      mocha: {ui: 'tdd'},
    },
    reporters: ['mocha', 'coverage'],
    coverageReporter: {
      reporters: [{type: 'html'}, {type: 'text'}],
    },
    plugins: [
      require('karma-coverage'),
      require('karma-mocha'),
      require('karma-mocha-reporter'),
      require('karma-sourcemap-loader'),
      require('karma-webpack'),
    ],
  })
}
