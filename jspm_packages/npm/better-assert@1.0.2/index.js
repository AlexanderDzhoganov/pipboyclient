/* */ 
(function(process) {
  var AssertionError = require('assert').AssertionError,
      callsite = require('callsite'),
      fs = require('fs');
  module.exports = process.env.NO_ASSERT ? function() {} : assert;
  function assert(expr) {
    if (expr)
      return;
    var stack = callsite();
    var call = stack[1];
    var file = call.getFileName();
    var lineno = call.getLineNumber();
    var src = fs.readFileSync(file, 'utf8');
    var line = src.split('\n')[lineno - 1];
    var src = line.match(/assert\((.*)\)/)[1];
    var err = new AssertionError({
      message: src,
      stackStartFunction: stack[0].getFunction()
    });
    throw err;
  }
})(require('process'));
