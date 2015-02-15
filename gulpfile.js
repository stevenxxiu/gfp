var to5ify = require('6to5ify');
var browserify = require('browserify');
var FirefoxProfile = require('firefox-profile');
var glob = require('glob');
var gulp = require('gulp');
var addsrc = require('gulp-add-src');
var concat = require('gulp-concat-util');
var sourcemaps = require('gulp-sourcemaps');
var watch = require('gulp-watch');
var isparta = require('isparta');
var merge = require('merge');
var istanbul = require('browserify-istanbul');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

function bundle(config){
  config = config || {};
  config = merge({paths: ['.', './gfp/lib'], transform: [to5ify.configure({blacklist: ['regenerator']})]}, config);
  // transform run twice bug workaround
  var transforms = config.transform;
  delete config.transform;
  var res = browserify(config);
  for(var i = 0; i < transforms.length; i++)
    res.transform(transforms[i]);
  return res.bundle().on('error', function(err){console.log(err.message);});
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
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('dist'));
  }
  watch('gfp/**/*.js', {}, cb); cb();
});

gulp.task('cover', function(){
  function cb(){
    var fileName = 'google_search_filter_plus.cover.js';
    bundle({
      entries: glob.sync('gfp/**/test_*.js'),
      transform: [istanbul({instrumenter: isparta, defaultIgnore: false})]
    })
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
