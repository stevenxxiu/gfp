var babelify = require('babelify');
var browserify = require('browserify');
var istanbul = require('browserify-istanbul');
var FirefoxProfile = require('firefox-profile');
var glob = require('glob');
var gulp = require('gulp');
var addsrc = require('gulp-add-src');
var concat = require('gulp-concat-util');
var minifyCSS = require('gulp-minify-css');
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

function watch(name, deps, glob, cb){
  if(!cb){cb = glob; glob = deps; deps = [];}
  gulp.task('_' + name, deps, cb);
  gulp.task(name, ['_' + name], function(){gulp.watch(glob, ['_' + name]);});
}

function bundle(config){
  return browserify(merge(
    {paths: ['.', './gfp/lib'], transform: [babelify.configure({blacklist: ['regenerator']})]}, config || {})
  ).bundle().on('error', function(err){console.log(err.message);});
}

gulp.task('resources', function(){
  gulp.src('gfp/css/gui.css')
    .pipe(minifyCSS())
    .pipe(concat('resource.js', {process: function(src){
      var ext = path.extname(this.path);
      return 'export let ' + path.basename(this.path, ext) + {'.css': 'Style'}[ext] + ' = ' + JSON.stringify(src) + ';';
    }}))
    .pipe(gulp.dest('gfp'));
});

watch('build', ['resources'], ['gfp/**/!(test_*.js)', 'gfp/css/*.css'], function(){
  var fileName = 'google_search_filter_plus.user.js';
  return bundle({entries: 'gfp/main.js'})
    .pipe(source(fileName))
    .pipe(buffer())
    .pipe(addsrc('gfp/header.js'))
    .pipe(concat(fileName))
    .pipe(gulp.dest('dist'));
});

watch('greasemonkey', ['_build'], ['gfp/**/!(test_*.js)', 'gfp/css/*.css'], function(){
  new FirefoxProfile.Finder().getPath('default', function(err, profilePath){
    gulp.src('dist/google_search_filter_plus.user.js')
      .pipe(gulp.dest(path.join(profilePath, 'gm_scripts/Google_Search_Filter_Plus')));
    });
});

var karmaConfig = {
  frameworks: ['mocha', 'chai'],
  client: {
    captureConsole: true,
    mocha: {reporter: 'html', ui: 'tdd'}
  }
};

watch('test', ['resources'], 'gfp/**/*.js', function(){
  bundle({entries: glob.sync('gfp/**/test_*.js'), debug: true})
    .pipe(source('google_search_filter_plus.test.js'))
    .pipe(gulp.dest('dist'))
    .pipe(karma(merge(true, karmaConfig, {
      port: 9876,
      reporters: ['progress'],
      preprocessors: {'dist/google_search_filter_plus.test.js': ['sourcemap']}
    })));
});

watch('cover', ['resources'], 'gfp/**/*.js', function(){
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

gulp.task('default', ['test', 'cover']);
