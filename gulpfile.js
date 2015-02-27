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
var watchify = require('watchify');
var karma = require('./gulp-karma');

function resolvePath(str){
  return path.resolve(str);
}

function globToRegExp(str){
  var escaped = str.replace(/[-\[\]/{}()*+?.\\^$|]/g, '\\$&');
  return escaped.replace(/\\\*(\\\*)?/g, '.*');
}

function bundle(config, pipe){
  var ignore = ['gfp/lib/**'].map(resolvePath).map(globToRegExp);
  var entries = config.entries;
  config = merge(true, config || {});
  config = merge(true, {
    paths: ['.', './gfp/lib'], transform: [
      babelify.configure({blacklist: ['regenerator'], optional: ['spec.protoToAssign'], ignore: ignore}),
      babelify.configure({only: ignore})
    ]
  }, config);
  config = merge(true, config, {entries: glob.sync(entries)});
  config = merge(true, config, watchify.args);
  var bundler = browserify(config);
  bundler = watchify(bundler, {delay: 100, glob: entries});
  bundler.on('update', function(){
    pipe.call(bundler.bundle().on('error', function(err){
      console.log(err.message);
    }));
  });
  bundler.emit('update');
}

function build(cb){
  var fileName = 'google_search_filter_plus.user.js';
  bundle({entries: 'gfp/main.js'}, function(){
    var sr = this
      .pipe(source(fileName))
      .pipe(buffer())
      .pipe(addsrc('gfp/header.js'))
      .pipe(concat(fileName))
      .pipe(gulp.dest('dist'));
    cb(sr);
  });
}

gulp.task('_resources', function(){
  gulp.src('gfp/css/gui.css')
    .pipe(minifyCSS())
    .pipe(concat('resource.js', {process: function(src){
      var ext = path.extname(this.path);
      var name = path.basename(this.path, ext);
      return 'export let ' + name + {'.css': 'Style'}[ext] + ' = ' + JSON.stringify(src) + ';';
    }}))
    .pipe(gulp.dest('gfp'));
});

gulp.task('resources', ['_resources'], function(){
  gulp.watch('gfp/css/*.css', ['_resources']);
});

gulp.task('greasemonkey', ['resources'], function(){
  new FirefoxProfile.Finder().getPath('default', function(err, profilePath){
    build(function(sr){
      sr.pipe(gulp.dest(path.join(profilePath, 'gm_scripts/Google_Search_Filter_Plus')));
    });
  });
});

var karmaConfig = {
  frameworks: ['mocha', 'chai', 'sinon'],
  client: {
    captureConsole: true,
    mocha: {reporter: 'html', ui: 'tdd'}
  }
};

gulp.task('test', ['resources'], function(){
  bundle({entries: 'gfp/**/test_*.js', debug: true}, function(){
    this
      .pipe(source('google_search_filter_plus.test.js'))
      .pipe(gulp.dest('dist'))
      .pipe(karma(merge(true, karmaConfig, {
        port: 9876,
        reporters: ['progress'],
        preprocessors: {'dist/google_search_filter_plus.test.js': ['sourcemap']}
      })));
  });
});

gulp.task('cover', ['resources'], function(){
  var ignore = ['gfp/lib/**', 'gfp/**/test_*.js'].map(resolvePath);
  bundle({
    entries: 'gfp/**/test_*.js',
    transform: [
      istanbul({instrumenter: isparta, defaultIgnore: false, ignore: ignore}),
      babelify.configure({only: ignore.map(globToRegExp)})
    ]
  }, function(){
    this
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
