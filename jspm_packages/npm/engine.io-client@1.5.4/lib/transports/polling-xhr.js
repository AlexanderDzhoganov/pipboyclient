/* */ 
var XMLHttpRequest = require('../xmlhttprequest');
var Polling = require('./polling');
var Emitter = require('component-emitter');
var inherit = require('component-inherit');
var debug = require('debug')('engine.io-client:polling-xhr');
module.exports = XHR;
module.exports.Request = Request;
function empty() {}
function XHR(opts) {
  Polling.call(this, opts);
  if (global.location) {
    var isSSL = 'https:' == location.protocol;
    var port = location.port;
    if (!port) {
      port = isSSL ? 443 : 80;
    }
    this.xd = opts.hostname != global.location.hostname || port != opts.port;
    this.xs = opts.secure != isSSL;
  }
}
inherit(XHR, Polling);
XHR.prototype.supportsBinary = true;
XHR.prototype.request = function(opts) {
  opts = opts || {};
  opts.uri = this.uri();
  opts.xd = this.xd;
  opts.xs = this.xs;
  opts.agent = this.agent || false;
  opts.supportsBinary = this.supportsBinary;
  opts.enablesXDR = this.enablesXDR;
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  return new Request(opts);
};
XHR.prototype.doWrite = function(data, fn) {
  var isBinary = typeof data !== 'string' && data !== undefined;
  var req = this.request({
    method: 'POST',
    data: data,
    isBinary: isBinary
  });
  var self = this;
  req.on('success', fn);
  req.on('error', function(err) {
    self.onError('xhr post error', err);
  });
  this.sendXhr = req;
};
XHR.prototype.doPoll = function() {
  debug('xhr poll');
  var req = this.request();
  var self = this;
  req.on('data', function(data) {
    self.onData(data);
  });
  req.on('error', function(err) {
    self.onError('xhr poll error', err);
  });
  this.pollXhr = req;
};
function Request(opts) {
  this.method = opts.method || 'GET';
  this.uri = opts.uri;
  this.xd = !!opts.xd;
  this.xs = !!opts.xs;
  this.async = false !== opts.async;
  this.data = undefined != opts.data ? opts.data : null;
  this.agent = opts.agent;
  this.isBinary = opts.isBinary;
  this.supportsBinary = opts.supportsBinary;
  this.enablesXDR = opts.enablesXDR;
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;
  this.create();
}
Emitter(Request.prototype);
Request.prototype.create = function() {
  var opts = {
    agent: this.agent,
    xdomain: this.xd,
    xscheme: this.xs,
    enablesXDR: this.enablesXDR
  };
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  var xhr = this.xhr = new XMLHttpRequest(opts);
  var self = this;
  try {
    debug('xhr open %s: %s', this.method, this.uri);
    xhr.open(this.method, this.uri, this.async);
    if (this.supportsBinary) {
      xhr.responseType = 'arraybuffer';
    }
    if ('POST' == this.method) {
      try {
        if (this.isBinary) {
          xhr.setRequestHeader('Content-type', 'application/octet-stream');
        } else {
          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        }
      } catch (e) {}
    }
    if ('withCredentials' in xhr) {
      xhr.withCredentials = true;
    }
    if (this.hasXDR()) {
      xhr.onload = function() {
        self.onLoad();
      };
      xhr.onerror = function() {
        self.onError(xhr.responseText);
      };
    } else {
      xhr.onreadystatechange = function() {
        if (4 != xhr.readyState)
          return;
        if (200 == xhr.status || 1223 == xhr.status) {
          self.onLoad();
        } else {
          setTimeout(function() {
            self.onError(xhr.status);
          }, 0);
        }
      };
    }
    debug('xhr data %s', this.data);
    xhr.send(this.data);
  } catch (e) {
    setTimeout(function() {
      self.onError(e);
    }, 0);
    return;
  }
  if (global.document) {
    this.index = Request.requestsCount++;
    Request.requests[this.index] = this;
  }
};
Request.prototype.onSuccess = function() {
  this.emit('success');
  this.cleanup();
};
Request.prototype.onData = function(data) {
  this.emit('data', data);
  this.onSuccess();
};
Request.prototype.onError = function(err) {
  this.emit('error', err);
  this.cleanup(true);
};
Request.prototype.cleanup = function(fromError) {
  if ('undefined' == typeof this.xhr || null === this.xhr) {
    return;
  }
  if (this.hasXDR()) {
    this.xhr.onload = this.xhr.onerror = empty;
  } else {
    this.xhr.onreadystatechange = empty;
  }
  if (fromError) {
    try {
      this.xhr.abort();
    } catch (e) {}
  }
  if (global.document) {
    delete Request.requests[this.index];
  }
  this.xhr = null;
};
Request.prototype.onLoad = function() {
  var data;
  try {
    var contentType;
    try {
      contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
    } catch (e) {}
    if (contentType === 'application/octet-stream') {
      data = this.xhr.response;
    } else {
      if (!this.supportsBinary) {
        data = this.xhr.responseText;
      } else {
        data = 'ok';
      }
    }
  } catch (e) {
    this.onError(e);
  }
  if (null != data) {
    this.onData(data);
  }
};
Request.prototype.hasXDR = function() {
  return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
};
Request.prototype.abort = function() {
  this.cleanup();
};
if (global.document) {
  Request.requestsCount = 0;
  Request.requests = {};
  if (global.attachEvent) {
    global.attachEvent('onunload', unloadHandler);
  } else if (global.addEventListener) {
    global.addEventListener('beforeunload', unloadHandler, false);
  }
}
function unloadHandler() {
  for (var i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}
