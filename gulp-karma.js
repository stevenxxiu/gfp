/*jshint -W079*/
var http = require('http');
var karma = require('karma');
var merge = require('merge');
var open = require('open');
var through = require('through2');

var ports = {};

function run(config, retry){
  function rerun(){
    if(retry)
      setTimeout(function(){run(config, retry);}, 100);
  }
  var req = http.request({
    hostname: config.hostname || 'localhost',
    path: (config.urlRoot || '/') + 'run',
    port: config.port || 9876,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, function(response){
    response.on('data', function(buffer){
      if(/^No captured browser/.test(buffer.toString()))
        rerun();
    });
  });
  req.on('error', rerun);
  req.end(JSON.stringify({}));
}

module.exports = function(config){
  return through.obj(function(file, encoding, next){
    var first = !ports[config.port];
    if(first){
      config = merge.recursive(true, config);
      config = merge.recursive({port: 9876, files: []}, config);
      config.files.push(file.path);
      config = merge.recursive(config, {autoWatch: false});
      karma.server.start(config);
      ports[config.port] = true;
      open('http://localhost:' + config.port);
    }
    run(config, first);
    next(null, file);
  });
};
