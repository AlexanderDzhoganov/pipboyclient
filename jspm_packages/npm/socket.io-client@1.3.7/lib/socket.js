/* */ 
var parser = require('socket.io-parser');
var Emitter = require('component-emitter');
var toArray = require('to-array');
var on = require('./on');
var bind = require('component-bind');
var debug = require('debug')('socket.io-client:socket');
var hasBin = require('has-binary');
module.exports = exports = Socket;
var events = {
  connect: 1,
  connect_error: 1,
  connect_timeout: 1,
  disconnect: 1,
  error: 1,
  reconnect: 1,
  reconnect_attempt: 1,
  reconnect_failed: 1,
  reconnect_error: 1,
  reconnecting: 1
};
var emit = Emitter.prototype.emit;
function Socket(io, nsp) {
  this.io = io;
  this.nsp = nsp;
  this.json = this;
  this.ids = 0;
  this.acks = {};
  if (this.io.autoConnect)
    this.open();
  this.receiveBuffer = [];
  this.sendBuffer = [];
  this.connected = false;
  this.disconnected = true;
}
Emitter(Socket.prototype);
Socket.prototype.subEvents = function() {
  if (this.subs)
    return;
  var io = this.io;
  this.subs = [on(io, 'open', bind(this, 'onopen')), on(io, 'packet', bind(this, 'onpacket')), on(io, 'close', bind(this, 'onclose'))];
};
Socket.prototype.open = Socket.prototype.connect = function() {
  if (this.connected)
    return this;
  this.subEvents();
  this.io.open();
  if ('open' == this.io.readyState)
    this.onopen();
  return this;
};
Socket.prototype.send = function() {
  var args = toArray(arguments);
  args.unshift('message');
  this.emit.apply(this, args);
  return this;
};
Socket.prototype.emit = function(ev) {
  if (events.hasOwnProperty(ev)) {
    emit.apply(this, arguments);
    return this;
  }
  var args = toArray(arguments);
  var parserType = parser.EVENT;
  if (hasBin(args)) {
    parserType = parser.BINARY_EVENT;
  }
  var packet = {
    type: parserType,
    data: args
  };
  if ('function' == typeof args[args.length - 1]) {
    debug('emitting packet with ack id %d', this.ids);
    this.acks[this.ids] = args.pop();
    packet.id = this.ids++;
  }
  if (this.connected) {
    this.packet(packet);
  } else {
    this.sendBuffer.push(packet);
  }
  return this;
};
Socket.prototype.packet = function(packet) {
  packet.nsp = this.nsp;
  this.io.packet(packet);
};
Socket.prototype.onopen = function() {
  debug('transport is open - connecting');
  if ('/' != this.nsp) {
    this.packet({type: parser.CONNECT});
  }
};
Socket.prototype.onclose = function(reason) {
  debug('close (%s)', reason);
  this.connected = false;
  this.disconnected = true;
  delete this.id;
  this.emit('disconnect', reason);
};
Socket.prototype.onpacket = function(packet) {
  if (packet.nsp != this.nsp)
    return;
  switch (packet.type) {
    case parser.CONNECT:
      this.onconnect();
      break;
    case parser.EVENT:
      this.onevent(packet);
      break;
    case parser.BINARY_EVENT:
      this.onevent(packet);
      break;
    case parser.ACK:
      this.onack(packet);
      break;
    case parser.BINARY_ACK:
      this.onack(packet);
      break;
    case parser.DISCONNECT:
      this.ondisconnect();
      break;
    case parser.ERROR:
      this.emit('error', packet.data);
      break;
  }
};
Socket.prototype.onevent = function(packet) {
  var args = packet.data || [];
  debug('emitting event %j', args);
  if (null != packet.id) {
    debug('attaching ack callback to event');
    args.push(this.ack(packet.id));
  }
  if (this.connected) {
    emit.apply(this, args);
  } else {
    this.receiveBuffer.push(args);
  }
};
Socket.prototype.ack = function(id) {
  var self = this;
  var sent = false;
  return function() {
    if (sent)
      return;
    sent = true;
    var args = toArray(arguments);
    debug('sending ack %j', args);
    var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
    self.packet({
      type: type,
      id: id,
      data: args
    });
  };
};
Socket.prototype.onack = function(packet) {
  debug('calling ack %s with %j', packet.id, packet.data);
  var fn = this.acks[packet.id];
  fn.apply(this, packet.data);
  delete this.acks[packet.id];
};
Socket.prototype.onconnect = function() {
  this.connected = true;
  this.disconnected = false;
  this.emit('connect');
  this.emitBuffered();
};
Socket.prototype.emitBuffered = function() {
  var i;
  for (i = 0; i < this.receiveBuffer.length; i++) {
    emit.apply(this, this.receiveBuffer[i]);
  }
  this.receiveBuffer = [];
  for (i = 0; i < this.sendBuffer.length; i++) {
    this.packet(this.sendBuffer[i]);
  }
  this.sendBuffer = [];
};
Socket.prototype.ondisconnect = function() {
  debug('server disconnect (%s)', this.nsp);
  this.destroy();
  this.onclose('io server disconnect');
};
Socket.prototype.destroy = function() {
  if (this.subs) {
    for (var i = 0; i < this.subs.length; i++) {
      this.subs[i].destroy();
    }
    this.subs = null;
  }
  this.io.destroy(this);
};
Socket.prototype.close = Socket.prototype.disconnect = function() {
  if (this.connected) {
    debug('performing disconnect (%s)', this.nsp);
    this.packet({type: parser.DISCONNECT});
  }
  this.destroy();
  if (this.connected) {
    this.onclose('io client disconnect');
  }
  return this;
};
