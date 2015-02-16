/*jshint -W079*/
var babelify = require('babelify');
var browserify = require('browserify');
var istanbul = require('browserify-istanbul');
var FirefoxProfile = require('firefox-profile');
var gulp = require('gulp');
var addsrc = require('gulp-add-src');
var concat = require('gulp-concat-util');
var watch = require('gulp-watch');
var isparta = require('isparta');
var karma = require('karma');
var merge = require('merge');
var open = require('open');
var path = require('path');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

function regExpEscape(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

gulp.task('build', function(){
  function cb(){
    var fileName = 'google_search_filter_plus.user.js';
    browserify({paths: ['.', './gfp/lib'], entries: 'gfp/main.js'})
      .transform(babelify.configure({blacklist: ['regenerator']}))
      .on('error', function(err){console.log(err.message);})
      .bundle()
      .pipe(source(fileName))
      .pipe(buffer())
      .pipe(addsrc('gfp/header.js'))
      .pipe(concat(fileName))
      .pipe(gulp.dest('dist'));
  }
  watch('gfp/**/!(test_*.js)', {}, cb); cb();
});

gulp.task('greasemonkey', ['build'], function(){
  new FirefoxProfile.Finder().getPath('default', function(err, path){
    gulp.src('dist/google_search_filter_plus.user.js').pipe(gulp.dest(path + '/gm_scripts/Google_Search_Filter_Plus'));
  });
});

var karmaConfig = {
  common: {
    frameworks: ['browserify', 'qunit'],
    preprocessors: {
      'gfp/**/test_*.js': ['browserify'],
    },
    browserify: {
      paths: ['.', './gfp/lib']
    }
  },
  test: {
    port: 9876,
    files: ['gfp/**/test_*.js'],
    reporters: ['progress'],
    browserify: {
      debug: true,
      transform: [babelify.configure({blacklist: ['regenerator']})]
    }
  },
  cover: {
    port: 9877,
    files: [
      {pattern: 'node_modules/isparta/node_modules/babel-core/browser-polyfill.js', watched: false}, 'gfp/**/test_*.js'
    ],
    reporters: ['progress', 'coverage'],
    browserify: {
      transform: [
        istanbul({instrumenter: isparta, defaultIgnore: false, ignore: [path.join(__dirname, '/gfp/lib/') + '**']}),
        babelify.configure({only: new RegExp(regExpEscape(path.join(__dirname, '/gfp/lib/')))})
      ]
    }
  }
};

gulp.task('test', function(){
  var config = merge.recursive(karmaConfig.common, karmaConfig.test);
  karma.server.start(config);
  open('http://localhost:' + config.port);
});

gulp.task('cover', function(){
  var config = merge.recursive(karmaConfig.common, karmaConfig.cover);
  karma.server.start(config);
  open('http://localhost:' + config.port);
});

gulp.task('default', ['greasemonkey']);
