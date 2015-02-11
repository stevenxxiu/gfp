var to5ify = require('6to5ify');
var browserify = require('browserify');
var FirefoxProfile = require('firefox-profile');
var gulp = require('gulp');
var addsrc = require('gulp-add-src');
var concat = require('gulp-concat-util');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

var fileName = 'google_search_filter_plus.user.js';

gulp.task('build', function(){
  browserify({paths: ['.']})
    .transform(to5ify.configure({blacklist: ['generators']}))
    .add('gfp/main.js')
    .bundle()
    .on('error', function(err){console.log('Error: ' + err.message);})
    .pipe(source(fileName))
    .pipe(buffer())
    .pipe(addsrc('gfp/header.js'))
    .pipe(concat(fileName))
    .pipe(gulp.dest('dist'));
});

gulp.task('greasemonkey', ['build'], function(){
  new FirefoxProfile.Finder().getPath('default', function(err, path){
    gulp.src('dist/' + fileName).pipe(gulp.dest(path + '/gm_scripts/Google_Search_Filter_Plus'));
  });
});
