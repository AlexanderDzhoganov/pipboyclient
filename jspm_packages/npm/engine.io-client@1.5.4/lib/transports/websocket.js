/* */ 
var Transport = require('../transport');
var parser = require('engine.io-parser');
var parseqs = require('parseqs');
var inherit = require('component-inherit');
var debug = require('debug')('engine.io-client:websocket');
var WebSocket = require('ws');
module.exports = WS;
function WS(opts) {
  var forceBase64 = (opts && opts.forceBase64);
  if (forceBase64) {
    this.supportsBinary = false;
  }
  Transport.call(this, opts);
}
inherit(WS, Transport);
WS.prototype.name = 'websocket';
WS.prototype.supportsBinary = true;
WS.prototype.doOpen = function() {
  if (!this.check()) {
    return;
  }
  var self = this;
  var uri = this.uri();
  var protocols = void(0);
  var opts = {agent: this.agent};
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  this.ws = new WebSocket(uri, protocols, opts);
  if (this.ws.binaryType === undefined) {
    this.supportsBinary = false;
  }
  this.ws.binaryType = 'arraybuffer';
  this.addEventListeners();
};
WS.prototype.addEventListeners = function() {
  var self = this;
  this.ws.onopen = function() {
    self.onOpen();
  };
  this.ws.onclose = function() {
    self.onClose();
  };
  this.ws.onmessage = function(ev) {
    self.onData(ev.data);
  };
  this.ws.onerror = function(e) {
    self.onError('websocket error', e);
  };
};
if ('undefined' != typeof navigator && /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
  WS.prototype.onData = function(data) {
    var self = this;
    setTimeout(function() {
      Transport.prototype.onData.call(self, data);
    }, 0);
  };
}
WS.prototype.write = function(packets) {
  var self = this;
  this.writable = false;
  for (var i = 0,
      l = packets.length; i < l; i++) {
    parser.encodePacket(packets[i], this.supportsBinary, function(data) {
      try {
        self.ws.send(data);
      } catch (e) {
        debug('websocket closed before onclose event');
      }
    });
  }
  function ondrain() {
    self.writable = true;
    self.emit('drain');
  }
  setTimeout(ondrain, 0);
};
WS.prototype.onClose = function() {
  Transport.prototype.onClose.call(this);
};
WS.prototype.doClose = function() {
  if (typeof this.ws !== 'undefined') {
    this.ws.close();
  }
};
WS.prototype.uri = function() {
  var query = this.query || {};
  var schema = this.secure ? 'wss' : 'ws';
  var port = '';
  if (this.port && (('wss' == schema && this.port != 443) || ('ws' == schema && this.port != 80))) {
    port = ':' + this.port;
  }
  if (this.timestampRequests) {
    query[this.timestampParam] = +new Date;
  }
  if (!this.supportsBinary) {
    query.b64 = 1;
  }
  query = parseqs.encode(query);
  if (query.length) {
    query = '?' + query;
  }
  return schema + '://' + this.hostname + port + this.path + query;
};
WS.prototype.check = function() {
  return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
};
