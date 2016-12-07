'use strict'
let addsrc = require('gulp-add-src')
let autoprefixer = require('autoprefixer')
let concat = require('gulp-continuous-concat')
let FirefoxProfile = require('firefox-profile')
let gulp = require('gulp')
let istanbul = require('istanbul')
let Mocha = require('mocha')
let path = require('path')
let through = require('through-gulp')
let webpack = require('webpack')
let webpackStream = require('webpack-stream')

function build(inPath, outPath, cover=false){
  let resRoot = path.resolve('.').replace(/\\/g, '/')
  return gulp.src(inPath)
    .pipe(webpackStream({
      resolve: {modules: ['node_modules', '.', 'gfp/lib']},
      externals: {
        'jquery': '$',
        'slickgrid': 'Slick',
        'chai': 'require("chai")',
        'sinon': 'require("sinon")',
        'jsdom': 'require("jsdom")',
        'jsdom-global/register': 'require("jsdom-global/register")',
      },
      module: {
        rules: [
          {
            test: /\.html$/, loader: 'html-loader', options: {minimize: true, attrs: 'img:src', root: resRoot},
          }, {
            test: /\.scss$/, use: [
              {loader: 'css-loader', options: {minimize: true, root: resRoot}}, {loader: 'postcss-loader'},
              {loader: 'sass-loader', options: {indentedSyntax: true}},
            ],
          }, {
            test: /\.png$/, loader: 'url-loader', options: {mimetype: 'img/png', limit: 10000},
          }, ...(cover ? [{
            test: /\.js$/, exclude: [path.resolve('gfp/lib')], loader: 'babel-loader', options: {plugins: ['istanbul']},
          }] : []),
        ],
      },
      plugins: [
        new webpack.LoaderOptionsPlugin({options: {postcss: [autoprefixer({browsers: ['last 2 versions']})]}}),
      ],
      watch: true,
      output: {filename: outPath},
    }, webpack))
}

gulp.task('pref', () => {
  build('gfp/bin/pref.js', 'pref.js', {devtool: '#inline-source-map'}).pipe(gulp.dest('dist'))
})

gulp.task('greasemonkey', () => {
  new FirefoxProfile.Finder().getPath('dev-edition-default', (err, profilePath) =>
    build('gfp/bin/main.js', 'google_search_filter_plus.user.js')
      .pipe(addsrc('gfp/header.js'))
      .pipe(concat('google_search_filter_plus.user.js'))
      .pipe(gulp.dest(path.join(profilePath, 'gm_scripts/Google_Search_Filter_Plus')))
  )
})

gulp.task('test', () => {
  build('gfp/bin/test.js', 'test.js', true).pipe(gulp.dest('dist')).pipe(through(function(file, encoding, callback){
    new Mocha({ui: 'tdd'}).addFile('dist/test.js').run(() => {
      let collector = new istanbul.Collector()
      let reporter = new istanbul.Reporter()
      collector.add(global.__coverage__)
      reporter.addAll(['text', 'lcov'])
      reporter.write(collector, true, () => {})
      delete global.__coverage__
      delete require.cache[path.resolve('dist/test.js')]
      this.push(file)
      callback()
    })
  }))
})

gulp.task('default', ['greasemonkey'])
