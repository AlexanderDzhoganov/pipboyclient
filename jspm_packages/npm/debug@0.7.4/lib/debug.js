/* */ 
(function(process) {
  var tty = require('tty');
  module.exports = debug;
  var names = [],
      skips = [];
  (process.env.DEBUG || '').split(/[\s,]+/).forEach(function(name) {
    name = name.replace('*', '.*?');
    if (name[0] === '-') {
      skips.push(new RegExp('^' + name.substr(1) + '$'));
    } else {
      names.push(new RegExp('^' + name + '$'));
    }
  });
  var colors = [6, 2, 3, 4, 5, 1];
  var prev = {};
  var prevColor = 0;
  var isatty = tty.isatty(2);
  function color() {
    return colors[prevColor++ % colors.length];
  }
  function humanize(ms) {
    var sec = 1000,
        min = 60 * 1000,
        hour = 60 * min;
    if (ms >= hour)
      return (ms / hour).toFixed(1) + 'h';
    if (ms >= min)
      return (ms / min).toFixed(1) + 'm';
    if (ms >= sec)
      return (ms / sec | 0) + 's';
    return ms + 'ms';
  }
  function debug(name) {
    function disabled() {}
    disabled.enabled = false;
    var match = skips.some(function(re) {
      return re.test(name);
    });
    if (match)
      return disabled;
    match = names.some(function(re) {
      return re.test(name);
    });
    if (!match)
      return disabled;
    var c = color();
    function colored(fmt) {
      fmt = coerce(fmt);
      var curr = new Date;
      var ms = curr - (prev[name] || curr);
      prev[name] = curr;
      fmt = '  \u001b[9' + c + 'm' + name + ' ' + '\u001b[3' + c + 'm\u001b[90m' + fmt + '\u001b[3' + c + 'm' + ' +' + humanize(ms) + '\u001b[0m';
      console.error.apply(this, arguments);
    }
    function plain(fmt) {
      fmt = coerce(fmt);
      fmt = new Date().toUTCString() + ' ' + name + ' ' + fmt;
      console.error.apply(this, arguments);
    }
    colored.enabled = plain.enabled = true;
    return isatty || process.env.DEBUG_COLORS ? colored : plain;
  }
  function coerce(val) {
    if (val instanceof Error)
      return val.stack || val.message;
    return val;
  }
})(require('process'));
