/* */ 
var XMLHttpRequest = require('../xmlhttprequest');
var XHR = require('./polling-xhr');
var JSONP = require('./polling-jsonp');
var websocket = require('./websocket');
exports.polling = polling;
exports.websocket = websocket;
function polling(opts) {
  var xhr;
  var xd = false;
  var xs = false;
  var jsonp = false !== opts.jsonp;
  if (global.location) {
    var isSSL = 'https:' == location.protocol;
    var port = location.port;
    if (!port) {
      port = isSSL ? 443 : 80;
    }
    xd = opts.hostname != location.hostname || port != opts.port;
    xs = opts.secure != isSSL;
  }
  opts.xdomain = xd;
  opts.xscheme = xs;
  xhr = new XMLHttpRequest(opts);
  if ('open' in xhr && !opts.forceJSONP) {
    return new XHR(opts);
  } else {
    if (!jsonp)
      throw new Error('JSONP disabled');
    return new JSONP(opts);
  }
}
