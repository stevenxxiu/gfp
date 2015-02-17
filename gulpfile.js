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

function karmaTask(karmaConfig, bundle){
  var first = true;
  watchCall('gfp/**/*.js', {}, function(){
    bundle().on('end', function(){
      if(first){
        karmaConfig = merge.recursive(true, {
          frameworks: ['mocha', 'chai'],
          client: {mocha: {reporter: 'html', ui: 'tdd'}},
          autoWatch: false
        }, karmaConfig);
        karma.server.start(karmaConfig);
        open('http://localhost:' + karmaConfig.port);
        first = false;
      }
      // monkey-patch to get rid of stdout
      var http = require('http');
      var request = http.request;
      http.request = function(options, response){return request(options);};
      karma.runner.run(karmaConfig, function(){});
      http.request = request;
    });
  });
}

gulp.task('test', function(){
  var fileName = 'google_search_filter_plus.test.js';
  karmaTask({
    port: 9876,
    reporters: ['progress'],
    files: [path.join('dist', fileName)],
    preprocessors: {'dist/*': ['sourcemap']}
  }, function(){
    return bundle({
      entries: glob.sync('gfp/**/test_*.js'), debug: true
    }).pipe(source(fileName)).pipe(gulp.dest('dist'));
  });
});

gulp.task('cover', function(){
  var fileName = 'google_search_filter_plus.cover.js';
  karmaTask({
    port: 9877,
    reporters: ['coverage'],
    files: [
      {pattern: 'node_modules/isparta/node_modules/babel-core/browser-polyfill.js', watched: false},
      path.join('dist', fileName)
    ]
  }, function(){
    return bundle({
      entries: glob.sync('gfp/**/test_*.js'),
      transform: [
        istanbul({instrumenter: isparta, defaultIgnore: false, ignore: [path.join(__dirname, 'gfp/lib/') + '**']}),
        babelify.configure({only: new RegExp(regExpEscape(path.join(__dirname, 'gfp/lib/')))})
      ]
    }).pipe(source(fileName)).pipe(gulp.dest('dist'));
  });
});

gulp.task('default', ['test', 'cover']);
