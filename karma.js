/*jshint -W079*/
var child_process = require('child_process');
var karma = require('karma');
var merge = require('merge');
var open = require('open');
var through = require('through2');

var ports = {};

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
    (function run(){
      child_process.fork(__filename, [JSON.stringify(config)], {silent: true}).on('exit', function(code){
        if(code === 1)
          run();
      });
    })();
    next(null, file);
  });
};

function main(){
  karma.runner.run(JSON.parse(process.argv[2]), function(code){
    // add 1 to differentiate between server response exit codes & throws (server connection errors)
    process.exit(code + 1);
  });
}

if(require.main === module)
  main();
