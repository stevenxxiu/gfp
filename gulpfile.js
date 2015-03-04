/*jshint -W079*/
var FirefoxProfile = require('firefox-profile');
var gulp = require('gulp');
var addsrc = require('gulp-add-src');
var concat = require('gulp-continuous-concat');
var gulpWebpack = require('gulp-webpack');
var karma = require('karma');
var merge = require('merge');
var open = require('open');
var path = require('path');
var webpack = require('webpack');

var webpackConfig = {resolve: {root: [path.resolve('.'), path.resolve('gfp/lib')]}};

gulp.task('greasemonkey', function(){
  new FirefoxProfile.Finder().getPath('default', function(err, profilePath){
    var fileName = 'google_search_filter_plus.user.js';
    gulp.src('gfp/main.js')
      .pipe(gulpWebpack(merge(true, webpackConfig, {
        module: {
          loaders: [{
            test: /\.js$/, exclude: /[\\/](gfp[\\/]lib|node_modules)[\\/]/,
            loader: 'babel-loader?blacklist=regenerator&optional=spec.protoToAssign'
          }, {
            test: /\.js$/, include: /[\\/]gfp[\\/]lib[\\/]/, exclude: /[\\/]node_modules[\\/]/,
            loader: 'babel-loader?blacklist=regenerator'
          }]
        },
        watch: true,
        output: {filename: fileName},
      }), webpack))
      .pipe(addsrc('gfp/header.js'))
      .pipe(concat(fileName))
      .pipe(gulp.dest('dist'))
      .pipe(gulp.dest(path.join(profilePath, 'gm_scripts/Google_Search_Filter_Plus')));
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
      module: {loaders: [{
        test: /\.js$/, exclude: /[\\/]node_modules[\\/]/, loader: 'babel-loader?blacklist=regenerator'
      }]},
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
        preLoaders: [{
          test: /\.js$/, exclude: /[\\/](gfp[\\/]lib|tests|node_modules)[\\/]/, loader: 'isparta-instrumenter-loader'
        }],
        loaders: [{
          test: /\.js$/, include: /[\\/](gfp[\\/]lib|tests)[\\/]/, exclude: /[\\/]node_modules[\\/]/,
          loader: 'babel-loader'
        }],
      },
    }),
  }));
  open('http://localhost:9877');
});

gulp.task('default', ['test', 'cover']);
