/*jshint -W079*/
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
var karma = require('karma');
var merge = require('merge');
var open = require('open');
var path = require('path');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

function regExpEscape(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
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

gulp.task('build', function(){
  watchCall('gfp/**/!(test_*.js)', {}, function(){
    var fileName = 'google_search_filter_plus.user.js';
    return bundle({entries: 'gfp/main.js'})
      .pipe(source(fileName))
      .pipe(buffer())
      .pipe(addsrc('gfp/header.js'))
      .pipe(concat(fileName))
      .pipe(gulp.dest('dist'));
  });
});

gulp.task('greasemonkey', ['build'], function(){
  new FirefoxProfile.Finder().getPath('default', function(err, profilePath){
    gulp.src('dist/google_search_filter_plus.user.js')
      .pipe(gulp.dest(path.join(profilePath, 'gm_scripts/Google_Search_Filter_Plus')));
  });
});

gulp.task('test', function(){
  var testFileName = 'google_search_filter_plus.test.js';
  var coverFileName = 'google_search_filter_plus.cover.js';
  karma.server.start({
    frameworks: ['qunit'],
    reporters: ['coverage', 'progress'],
    autoWatch: false,
    files: [path.join('dist', testFileName), path.join('dist', coverFileName)]
  });
  watchCall('gfp/**/*.js', {}, function(){
    var entries = glob.sync('gfp/**/test_*.js');
    bundle({debug: true, entries: entries})
      .pipe(source(testFileName))
      .pipe(buffer())
      .pipe(concat.header('if(window.location.href.endsWith("debug.html")){'))
      .pipe(concat.footer('}'))
      .pipe(gulp.dest('dist'));
    bundle({
      entries: entries,
      transform: [
        istanbul({instrumenter: isparta, defaultIgnore: false, ignore: [path.join(__dirname, 'gfp/lib/') + '**']}),
        babelify.configure({only: new RegExp(regExpEscape(path.join(__dirname, 'gfp/lib/')))})
      ]
    })
      .pipe(source(coverFileName))
      .pipe(buffer())
      .pipe(concat.header('if(!window.location.href.endsWith("debug.html")){'))
      .pipe(concat.footer('}'))
      .pipe(gulp.dest('dist'))
      .on('end', function(){
        // monkey-patch to get rid of stdout
        var http = require('http');
        var request = http.request;
        http.request = function(options, response){return request(options);};
        karma.runner.run({});
        http.request = request;
      });
  });
  open('http://localhost:9876/');
});

gulp.task('default', ['test']);
