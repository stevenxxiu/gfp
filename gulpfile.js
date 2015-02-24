var babelify = require('babelify');
var browserify = require('browserify');
var istanbul = require('browserify-istanbul');
var FirefoxProfile = require('firefox-profile');
var glob = require('glob');
var gulp = require('gulp');
var addsrc = require('gulp-add-src');
var concat = require('gulp-concat-util');
var watch = require('gulp-watch');
var isparta = require('isparta');
var merge = require('merge');
var path = require('path');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var karma = require('./gulp-karma');

function globToRegExp(str){
  var escaped = str.replace(/[-\[\]/{}()*+?.\\^$|]/g, '\\$&');
  return escaped.replace(/\\\*(\\\*)?/g, '.*');
}

function watchCall(glob, options, callback){
  callback();
  watch(glob, options, callback);
}

function bundle(config){
  return browserify(merge(
    {paths: ['.', './gfp/lib'], transform: [babelify.configure({blacklist: ['regenerator']})]}, config || {})
  ).bundle().on('error', function(err){console.log(err.message);});
}

function build(){
  var fileName = 'google_search_filter_plus.user.js';
  return bundle({entries: 'gfp/main.js'})
    .pipe(source(fileName))
    .pipe(buffer())
    .pipe(addsrc('gfp/header.js'))
    .pipe(concat(fileName))
    .pipe(gulp.dest('dist'));
}

gulp.task('build', function(){
  watchCall('gfp/**/!(test_*.js)', {}, build);
});

gulp.task('greasemonkey', function(){
  new FirefoxProfile.Finder().getPath('default', function(err, profilePath){
    watchCall('gfp/**/!(test_*.js)', {}, function(){
      build().pipe(gulp.dest(path.join(profilePath, 'gm_scripts/Google_Search_Filter_Plus')));
    });
  });
});

var karmaConfig = {
  frameworks: ['mocha', 'chai'],
  client: {
    captureConsole: true,
    mocha: {reporter: 'html', ui: 'tdd'}
  }
};

gulp.task('test', function(){
  watchCall('gfp/**/*.js', {}, function(){
    bundle({entries: glob.sync('gfp/**/test_*.js'), debug: true})
      .pipe(source('google_search_filter_plus.test.js'))
      .pipe(gulp.dest('dist'))
      .pipe(karma(merge(true, karmaConfig, {
        port: 9876,
        reporters: ['progress'],
        preprocessors: {'dist/google_search_filter_plus.test.js': ['sourcemap']}
      })));
  });
});

gulp.task('cover', function(){
  watchCall('gfp/**/*.js', {}, function(){
    var ignore = ['gfp/lib/**', 'gfp/**/test_*.js'].map(function(str){return path.join(__dirname, str);});
    bundle({
      entries: glob.sync('gfp/**/test_*.js'),
      transform: [
        istanbul({instrumenter: isparta, defaultIgnore: false, ignore: ignore}),
        babelify.configure({only: ignore.map(globToRegExp)})
      ]
    })
      .pipe(source('google_search_filter_plus.cover.js'))
      .pipe(gulp.dest('dist'))
      .pipe(karma(merge(true, karmaConfig, {
        port: 9877,
        reporters: ['coverage'],
        files: [{pattern: 'node_modules/isparta/node_modules/babel-core/browser-polyfill.js', watched: false}]
      })));
  });
});

gulp.task('default', ['test', 'cover']);
