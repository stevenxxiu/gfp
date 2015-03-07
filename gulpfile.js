/*jshint -W079*/
var FirefoxProfile = require('firefox-profile');
var gulp = require('gulp');
var addsrc = require('gulp-add-src');
var concat = require('gulp-continuous-concat');
var gulpWebpack = require('gulp-webpack');
var karma = require('karma');
var merge = require('merge').recursive;
var open = require('open');
var path = require('path');
var webpack = require('webpack');

var webpackConfig = {
  resolve: {root: [path.resolve('.'), path.resolve('gfp/lib')]},
  module: {
    loaders: [
      {test: /\.html$/, loader: 'html?minimize&attrs=img:src&root=' + path.resolve('.')},
      {test: /\.css$/, loader: 'css?minimize&root=' + path.resolve('.')},
      {test: /\.png$/, loader: 'url?mimetype=image/png'},
    ]
  }
};

function build(){
  var fileName = 'google_search_filter_plus.user.js';
  var babelOptions =
    'babel?blacklist[]=es6.forOf&blacklist[]=es6.arrowFunctions&blacklist[]=es6.blockScoping&blacklist[]=regenerator';
  return gulp.src('gfp/main.js')
    .pipe(gulpWebpack(merge(true, webpackConfig, {
      module: {
        loaders: [
          {
            test: /\.js$/, exclude: /[\\/](gfp[\\/]lib|node_modules)[\\/]/,
            loader: babelOptions + '&optional=spec.protoToAssign'
          }, {test: /\.js$/, include: /[\\/]gfp[\\/]lib[\\/]/, exclude: /[\\/]node_modules[\\/]/, loader: babelOptions}
        ].concat(webpackConfig.module.loaders)
      },
      watch: true,
      output: {filename: fileName},
    }), webpack))
    .pipe(addsrc('gfp/header.js'))
    .pipe(concat(fileName));
}

gulp.task('build', function(){
  build().pipe(gulp.dest('dist'));
});

gulp.task('greasemonkey', function(){
  new FirefoxProfile.Finder().getPath('default', function(err, profilePath){
      build().pipe(gulp.dest(path.join(profilePath, 'gm_scripts/Google_Search_Filter_Plus')));
  });
});

var karmaConfig = {
  frameworks: ['mocha', 'chai', 'sinon'],
  client: {
    captureConsole: true,
    mocha: {reporter: 'html', ui: 'tdd'},
  },
};

gulp.task('test', function(){
  karma.server.start(merge(true, karmaConfig, {
    port: 9876,
    reporters: ['progress'],
    files: ['gfp/test.js'],
    preprocessors: {'gfp/test.js': ['webpack', 'sourcemap']},
    webpack: merge(true, webpackConfig, {
      devtool: '#inline-source-map',
      module: {
        loaders: [
          {test: /\.js$/, exclude: /[\\/]node_modules[\\/]/, loader: 'babel?blacklist=regenerator'}
        ].concat(webpackConfig.module.loaders)
      },
    }),
  }));
  open('http://localhost:9876');
});

gulp.task('cover', function(){
  karma.server.start(merge(true, karmaConfig, {
    port: 9877,
    reporters: ['coverage'],
    files: [{pattern: 'node_modules/babel-core/browser-polyfill.js', watched: false}, 'gfp/test.js'],
    preprocessors: {'gfp/test.js': ['webpack']},
    webpack: merge(true, webpackConfig, {
      module: {
        loaders: [
          {test: /\.js$/, exclude: /[\\/](gfp[\\/]lib|tests|node_modules)[\\/]/, loader: 'isparta-instrumenter'},
          {test: /\.js$/, include: /[\\/](gfp[\\/]lib|tests)[\\/]/, exclude: /[\\/]node_modules[\\/]/, loader: 'babel'}
        ].concat(webpackConfig.module.loaders),
      },
    }),
  }));
  open('http://localhost:9877');
});

gulp.task('default', ['test', 'cover']);
