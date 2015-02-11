var to5ify = require('6to5ify');
var browserify = require('browserify');
var FirefoxProfile = require('firefox-profile');
var glob = require('glob');
var gulp = require('gulp');
var addsrc = require('gulp-add-src');
var concat = require('gulp-concat-util');
var gutil = require('gulp-util');
var merge = require('merge');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

function bundle(config, cb){
  config = config || {};
  config = merge(config, watchify.args);
  config = merge(config, {paths: ['.'], transform: to5ify.configure({blacklist: ['regenerator']})});
  return watchify(browserify(config), {delay: 0})
    .on('update', cb)
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .bundle();
}

gulp.task('build', function build(){
  var fileName = 'google_search_filter_plus.user.js';
  bundle({entries: './gfp/main.js'}, build)
    .pipe(source(fileName))
    .pipe(buffer())
    .pipe(addsrc('./gfp/header.js'))
    .pipe(concat(fileName))
    .pipe(gulp.dest('./dist'));
});

gulp.task('test', function test(){
  var fileName = 'google_search_filter_plus.test.js';
  bundle({debug: true, entries: glob.sync('./gfp/**/tests/*.js')}, test)
    .pipe(source(fileName))
    .pipe(gulp.dest('./dist'));
});

gulp.task('greasemonkey', ['build'], function(){
  new FirefoxProfile.Finder().getPath('default', function(err, path){
    gulp.src('dist/google_search_filter_plus.user.js').pipe(gulp.dest(path + '/gm_scripts/Google_Search_Filter_Plus'));
  });
});

gulp.task('default', ['test']);
