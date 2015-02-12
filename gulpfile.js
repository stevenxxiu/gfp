var to5ify = require('6to5ify');
var browserify = require('browserify');
var FirefoxProfile = require('firefox-profile');
var glob = require('glob');
var gulp = require('gulp');
var addsrc = require('gulp-add-src');
var concat = require('gulp-concat-util');
var watch = require('gulp-watch');
var merge = require('merge');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

function bundle(config){
  config = config || {};
  config = merge(config, {paths: ['.'], transform: to5ify.configure({blacklist: ['regenerator']})});
  return browserify(config).bundle().on('error', function(err){console.log(err.message);});
}

gulp.task('build', function(){
  function cb(){
    var fileName = 'google_search_filter_plus.user.js';
    bundle({entries: 'gfp/main.js'})
      .pipe(source(fileName))
      .pipe(buffer())
      .pipe(addsrc('gfp/header.js'))
      .pipe(concat(fileName))
      .pipe(gulp.dest('dist'));
  }
  watch('gfp/**/!(test_*.js)', {}, cb); cb();
});

gulp.task('test', function(){
  function cb(){
    var fileName = 'google_search_filter_plus.test.js';
    bundle({debug: true, entries: glob.sync('gfp/**/test_*.js')})
      .pipe(source(fileName))
      .pipe(gulp.dest('dist'));
  }
  watch('gfp/**/*.js', {}, cb); cb();
});

gulp.task('greasemonkey', ['build'], function(){
  new FirefoxProfile.Finder().getPath('default', function(err, path){
    gulp.src('dist/google_search_filter_plus.user.js').pipe(gulp.dest(path + '/gm_scripts/Google_Search_Filter_Plus'));
  });
});

gulp.task('default', ['test']);
