/* */ 
var url = require('./url');
var eio = require('engine.io-client');
var Socket = require('./socket');
var Emitter = require('component-emitter');
var parser = require('socket.io-parser');
var on = require('./on');
var bind = require('component-bind');
var object = require('object-component');
var debug = require('debug')('socket.io-client:manager');
var indexOf = require('indexof');
var Backoff = require('backo2');
module.exports = Manager;
function Manager(uri, opts) {
  if (!(this instanceof Manager))
    return new Manager(uri, opts);
  if (uri && ('object' == typeof uri)) {
    opts = uri;
    uri = undefined;
  }
  opts = opts || {};
  opts.path = opts.path || '/socket.io';
  this.nsps = {};
  this.subs = [];
  this.opts = opts;
  this.reconnection(opts.reconnection !== false);
  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
  this.reconnectionDelay(opts.reconnectionDelay || 1000);
  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
  this.randomizationFactor(opts.randomizationFactor || 0.5);
  this.backoff = new Backoff({
    min: this.reconnectionDelay(),
    max: this.reconnectionDelayMax(),
    jitter: this.randomizationFactor()
  });
  this.timeout(null == opts.timeout ? 20000 : opts.timeout);
  this.readyState = 'closed';
  this.uri = uri;
  this.connected = [];
  this.encoding = false;
  this.packetBuffer = [];
  this.encoder = new parser.Encoder();
  this.decoder = new parser.Decoder();
  this.autoConnect = opts.autoConnect !== false;
  if (this.autoConnect)
    this.open();
}
Manager.prototype.emitAll = function() {
  this.emit.apply(this, arguments);
  for (var nsp in this.nsps) {
    this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
  }
};
Manager.prototype.updateSocketIds = function() {
  for (var nsp in this.nsps) {
    this.nsps[nsp].id = this.engine.id;
  }
};
Emitter(Manager.prototype);
Manager.prototype.reconnection = function(v) {
  if (!arguments.length)
    return this._reconnection;
  this._reconnection = !!v;
  return this;
};
Manager.prototype.reconnectionAttempts = function(v) {
  if (!arguments.length)
    return this._reconnectionAttempts;
  this._reconnectionAttempts = v;
  return this;
};
Manager.prototype.reconnectionDelay = function(v) {
  if (!arguments.length)
    return this._reconnectionDelay;
  this._reconnectionDelay = v;
  this.backoff && this.backoff.setMin(v);
  return this;
};
Manager.prototype.randomizationFactor = function(v) {
  if (!arguments.length)
    return this._randomizationFactor;
  this._randomizationFactor = v;
  this.backoff && this.backoff.setJitter(v);
  return this;
};
Manager.prototype.reconnectionDelayMax = function(v) {
  if (!arguments.length)
    return this._reconnectionDelayMax;
  this._reconnectionDelayMax = v;
  this.backoff && this.backoff.setMax(v);
  return this;
};
Manager.prototype.timeout = function(v) {
  if (!arguments.length)
    return this._timeout;
  this._timeout = v;
  return this;
};
Manager.prototype.maybeReconnectOnOpen = function() {
  if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
    this.reconnect();
  }
};
Manager.prototype.open = Manager.prototype.connect = function(fn) {
  debug('readyState %s', this.readyState);
  if (~this.readyState.indexOf('open'))
    return this;
  debug('opening %s', this.uri);
  this.engine = eio(this.uri, this.opts);
  var socket = this.engine;
  var self = this;
  this.readyState = 'opening';
  this.skipReconnect = false;
  var openSub = on(socket, 'open', function() {
    self.onopen();
    fn && fn();
  });
  var errorSub = on(socket, 'error', function(data) {
    debug('connect_error');
    self.cleanup();
    self.readyState = 'closed';
    self.emitAll('connect_error', data);
    if (fn) {
      var err = new Error('Connection error');
      err.data = data;
      fn(err);
    } else {
      self.maybeReconnectOnOpen();
    }
  });
  if (false !== this._timeout) {
    var timeout = this._timeout;
    debug('connect attempt will timeout after %d', timeout);
    var timer = setTimeout(function() {
      debug('connect attempt timed out after %d', timeout);
      openSub.destroy();
      socket.close();
      socket.emit('error', 'timeout');
      self.emitAll('connect_timeout', timeout);
    }, timeout);
    this.subs.push({destroy: function() {
        clearTimeout(timer);
      }});
  }
  this.subs.push(openSub);
  this.subs.push(errorSub);
  return this;
};
Manager.prototype.onopen = function() {
  debug('open');
  this.cleanup();
  this.readyState = 'open';
  this.emit('open');
  var socket = this.engine;
  this.subs.push(on(socket, 'data', bind(this, 'ondata')));
  this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
  this.subs.push(on(socket, 'error', bind(this, 'onerror')));
  this.subs.push(on(socket, 'close', bind(this, 'onclose')));
};
Manager.prototype.ondata = function(data) {
  this.decoder.add(data);
};
Manager.prototype.ondecoded = function(packet) {
  this.emit('packet', packet);
};
Manager.prototype.onerror = function(err) {
  debug('error', err);
  this.emitAll('error', err);
};
Manager.prototype.socket = function(nsp) {
  var socket = this.nsps[nsp];
  if (!socket) {
    socket = new Socket(this, nsp);
    this.nsps[nsp] = socket;
    var self = this;
    socket.on('connect', function() {
      socket.id = self.engine.id;
      if (!~indexOf(self.connected, socket)) {
        self.connected.push(socket);
      }
    });
  }
  return socket;
};
Manager.prototype.destroy = function(socket) {
  var index = indexOf(this.connected, socket);
  if (~index)
    this.connected.splice(index, 1);
  if (this.connected.length)
    return;
  this.close();
};
Manager.prototype.packet = function(packet) {
  debug('writing packet %j', packet);
  var self = this;
  if (!self.encoding) {
    self.encoding = true;
    this.encoder.encode(packet, function(encodedPackets) {
      for (var i = 0; i < encodedPackets.length; i++) {
        self.engine.write(encodedPackets[i]);
      }
      self.encoding = false;
      self.processPacketQueue();
    });
  } else {
    self.packetBuffer.push(packet);
  }
};
Manager.prototype.processPacketQueue = function() {
  if (this.packetBuffer.length > 0 && !this.encoding) {
    var pack = this.packetBuffer.shift();
    this.packet(pack);
  }
};
Manager.prototype.cleanup = function() {
  var sub;
  while (sub = this.subs.shift())
    sub.destroy();
  this.packetBuffer = [];
  this.encoding = false;
  this.decoder.destroy();
};
Manager.prototype.close = Manager.prototype.disconnect = function() {
  this.skipReconnect = true;
  this.backoff.reset();
  this.readyState = 'closed';
  this.engine && this.engine.close();
};
Manager.prototype.onclose = function(reason) {
  debug('close');
  this.cleanup();
  this.backoff.reset();
  this.readyState = 'closed';
  this.emit('close', reason);
  if (this._reconnection && !this.skipReconnect) {
    this.reconnect();
  }
};
Manager.prototype.reconnect = function() {
  if (this.reconnecting || this.skipReconnect)
    return this;
  var self = this;
  if (this.backoff.attempts >= this._reconnectionAttempts) {
    debug('reconnect failed');
    this.backoff.reset();
    this.emitAll('reconnect_failed');
    this.reconnecting = false;
  } else {
    var delay = this.backoff.duration();
    debug('will wait %dms before reconnect attempt', delay);
    this.reconnecting = true;
    var timer = setTimeout(function() {
      if (self.skipReconnect)
        return;
      debug('attempting reconnect');
      self.emitAll('reconnect_attempt', self.backoff.attempts);
      self.emitAll('reconnecting', self.backoff.attempts);
      if (self.skipReconnect)
        return;
      self.open(function(err) {
        if (err) {
          debug('reconnect attempt error');
          self.reconnecting = false;
          self.reconnect();
          self.emitAll('reconnect_error', err.data);
        } else {
          debug('reconnect success');
          self.onreconnect();
        }
      });
    }, delay);
    this.subs.push({destroy: function() {
        clearTimeout(timer);
      }});
  }
};
Manager.prototype.onreconnect = function() {
  var attempt = this.backoff.attempts;
  this.reconnecting = false;
  this.backoff.reset();
  this.updateSocketIds();
  this.emitAll('reconnect', attempt);
};
