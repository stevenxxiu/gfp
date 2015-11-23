'use strict'
let addsrc = require('gulp-add-src')
let concat = require('gulp-continuous-concat')
let FirefoxProfile = require('firefox-profile')
let gulp = require('gulp')
let karma = require('karma')
let merge = require('merge').recursive
let open_ = require('open')
let path = require('path')
let webpack = require('webpack')
let webpackStream = require('webpack-stream')

let webpackConfig = {
  resolve: {root: [path.resolve('.'), path.resolve('gfp/lib')]},
  module: {
    loaders: [
      {test: /\.html$/, loader: `html?minimize=true&attrs=img:src&root=${path.resolve('.')}`},
      {test: /\.scss$/, loader: 'css?minimize!sass?indentedSyntax'},
      {test: /\.png$/, loader: 'url?mimetype=image/png'},
    ],
  },
}

let babelConfig = {
  build: {
    plugins: [
      'transform-es2015-block-scoped-functions',
      'transform-es2015-classes',
      'transform-es2015-constants',
      'transform-es2015-destructuring',
      'transform-es2015-function-name',
      'transform-es2015-modules-commonjs',
      'transform-es2015-object-super',
      'transform-es2015-parameters',
      'transform-es2015-unicode-regex',
    ],
  },
  test: {
    presets: ['es2015-without-regenerator'],
  },
}

let karmaConfig = {
  frameworks: ['mocha', 'chai', 'sinon'],
  client: {
    captureConsole: true,
    mocha: {reporter: 'html', ui: 'tdd'},
  },
}

function build(){
  let fileName = 'google_search_filter_plus.user.js'
  return gulp.src('gfp/main.js')
    .pipe(webpackStream(merge(true, webpackConfig, {
      module: {
        loaders: [{
          test: /\.js$/, exclude: /[\\/]node_modules[\\/]/,
          loader: 'babel', query: babelConfig.build,
        }].concat(webpackConfig.module.loaders),
      },
      watch: true,
      output: {filename: fileName},
    }), webpack))
    .pipe(addsrc('gfp/header.js'))
    .pipe(concat(fileName))
}

gulp.task('build', function(){
  build().pipe(gulp.dest('dist'))
})

gulp.task('greasemonkey', function(){
  new FirefoxProfile.Finder().getPath('default', function(err, profilePath){
    build().pipe(gulp.dest(path.join(profilePath, 'gm_scripts/Google_Search_Filter_Plus')))
  })
})

gulp.task('test', function(){
  new karma.Server(merge(true, karmaConfig, {
    port: 9876,
    reporters: ['progress'],
    files: ['gfp/test.js'],
    preprocessors: {'gfp/test.js': ['webpack', 'sourcemap']},
    webpack: merge(true, webpackConfig, {
      devtool: '#inline-source-map',
      module: {
        loaders: [{
          test: /\.js$/, exclude: /[\\/]node_modules[\\/]/, loader: 'babel', query: babelConfig.test,
        }].concat(webpackConfig.module.loaders),
      },
    }),
  })).start()
  open_('http://localhost:9876')
})

gulp.task('cover', function(){
  new karma.Server(merge(true, karmaConfig, {
    port: 9877,
    reporters: ['coverage'],
    files: ['gfp/test.js'],
    preprocessors: {'gfp/test.js': ['webpack']},
    webpack: merge(true, webpackConfig, {
      module: {
        loaders: [{
          test: /\.js$/, exclude: /[\\/](node_modules)[\\/]/,
          loader: 'isparta-instrumenter', query: {babel: babelConfig.test},
        }].concat(webpackConfig.module.loaders),
      },
    }),
  })).start()
  open_('http://localhost:9877')
})

gulp.task('default', ['test', 'cover'])
