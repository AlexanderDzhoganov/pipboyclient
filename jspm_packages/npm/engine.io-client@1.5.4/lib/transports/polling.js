/* */ 
var Transport = require('../transport');
var parseqs = require('parseqs');
var parser = require('engine.io-parser');
var inherit = require('component-inherit');
var debug = require('debug')('engine.io-client:polling');
module.exports = Polling;
var hasXHR2 = (function() {
  var XMLHttpRequest = require('../xmlhttprequest');
  var xhr = new XMLHttpRequest({xdomain: false});
  return null != xhr.responseType;
})();
function Polling(opts) {
  var forceBase64 = (opts && opts.forceBase64);
  if (!hasXHR2 || forceBase64) {
    this.supportsBinary = false;
  }
  Transport.call(this, opts);
}
inherit(Polling, Transport);
Polling.prototype.name = 'polling';
Polling.prototype.doOpen = function() {
  this.poll();
};
Polling.prototype.pause = function(onPause) {
  var pending = 0;
  var self = this;
  this.readyState = 'pausing';
  function pause() {
    debug('paused');
    self.readyState = 'paused';
    onPause();
  }
  if (this.polling || !this.writable) {
    var total = 0;
    if (this.polling) {
      debug('we are currently polling - waiting to pause');
      total++;
      this.once('pollComplete', function() {
        debug('pre-pause polling complete');
        --total || pause();
      });
    }
    if (!this.writable) {
      debug('we are currently writing - waiting to pause');
      total++;
      this.once('drain', function() {
        debug('pre-pause writing complete');
        --total || pause();
      });
    }
  } else {
    pause();
  }
};
Polling.prototype.poll = function() {
  debug('polling');
  this.polling = true;
  this.doPoll();
  this.emit('poll');
};
Polling.prototype.onData = function(data) {
  var self = this;
  debug('polling got data %s', data);
  var callback = function(packet, index, total) {
    if ('opening' == self.readyState) {
      self.onOpen();
    }
    if ('close' == packet.type) {
      self.onClose();
      return false;
    }
    self.onPacket(packet);
  };
  parser.decodePayload(data, this.socket.binaryType, callback);
  if ('closed' != this.readyState) {
    this.polling = false;
    this.emit('pollComplete');
    if ('open' == this.readyState) {
      this.poll();
    } else {
      debug('ignoring poll - transport state "%s"', this.readyState);
    }
  }
};
Polling.prototype.doClose = function() {
  var self = this;
  function close() {
    debug('writing close packet');
    self.write([{type: 'close'}]);
  }
  if ('open' == this.readyState) {
    debug('transport open - closing');
    close();
  } else {
    debug('transport not open - deferring close');
    this.once('open', close);
  }
};
Polling.prototype.write = function(packets) {
  var self = this;
  this.writable = false;
  var callbackfn = function() {
    self.writable = true;
    self.emit('drain');
  };
  var self = this;
  parser.encodePayload(packets, this.supportsBinary, function(data) {
    self.doWrite(data, callbackfn);
  });
};
Polling.prototype.uri = function() {
  var query = this.query || {};
  var schema = this.secure ? 'https' : 'http';
  var port = '';
  if (false !== this.timestampRequests) {
    query[this.timestampParam] = +new Date + '-' + Transport.timestamps++;
  }
  if (!this.supportsBinary && !query.sid) {
    query.b64 = 1;
  }
  query = parseqs.encode(query);
  if (this.port && (('https' == schema && this.port != 443) || ('http' == schema && this.port != 80))) {
    port = ':' + this.port;
  }
  if (query.length) {
    query = '?' + query;
  }
  return schema + '://' + this.hostname + port + this.path + query;
};
