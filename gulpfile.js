'use strict'
let addsrc = require('gulp-add-src')
let autoprefixer = require('autoprefixer')
let concat = require('gulp-continuous-concat')
let FirefoxProfile = require('firefox-profile')
let gulp = require('gulp')
let path = require('path')
let webpack = require('webpack')
let webpackStream = require('webpack-stream')

function build(path_){
  let resRoot = path.resolve('.').replace(/\\/g, '/')
  let fileName = 'google_search_filter_plus.user.js'
  return gulp.src(path_)
    .pipe(webpackStream({
      resolve: {modules: ['node_modules', path.resolve('.'), path.resolve('gfp/lib')]},
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
          },
        ],
      },
      plugins: [
        new webpack.LoaderOptionsPlugin({options: {postcss: [autoprefixer({browsers: ['last 2 versions']})]}}),
      ],
      watch: true,
      output: {filename: fileName},
    }, webpack))
    .pipe(addsrc('gfp/header.js'))
    .pipe(concat(fileName))
}

gulp.task('build', function(){
  build('gfp/bin/pref.js', {devtool: '#inline-source-map'}).pipe(gulp.dest('dist'))
})

gulp.task('greasemonkey', function(){
  new FirefoxProfile.Finder().getPath('dev-edition-default', function(err, profilePath){
    build('gfp/bin/main.js').pipe(gulp.dest(path.join(profilePath, 'gm_scripts/Google_Search_Filter_Plus')))
  })
})

gulp.task('test', function(){
  new karma.Server(merge(true, karmaConfig, {
    port: 9876,
    reporters: ['progress'],
    files: ['gfp/bin/test.js'],
    preprocessors: {'gfp/bin/test.js': ['webpack', 'sourcemap']},
    webpack: merge(true, webpackConfig, {
      devtool: '#inline-source-map',
      module: {
        loaders: [{
          test: /\.js$/, exclude: /[/\\]node_modules[/\\]/, loader: 'babel', query: babelConfig.test,
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
    files: ['gfp/bin/test.js'],
    preprocessors: {'gfp/bin/test.js': ['webpack']},
    webpack: merge(true, webpackConfig, {
      module: {
        loaders: [{
          test: /\.js$/, include: /[/\\]gfp[/\\]lib[/\\]/, exclude: /[/\\]node_modules[/\\]/,
          loader: 'babel', query: babelConfig.test,
        }, {
          test: /\.js$/, exclude: /[/\\](node_modules|gfp[/\\]lib)[/\\]/,
          loader: 'isparta-instrumenter', query: {babel: babelConfig.test},
        }].concat(webpackConfig.module.loaders),
      },
    }),
  })).start()
  open_('http://localhost:9877')
})

gulp.task('default', ['greasemonkey'])
