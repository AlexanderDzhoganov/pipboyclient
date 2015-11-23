/* */ 
(function(Buffer) {
  var debug = require('debug')('socket.io-parser');
  var json = require('json3');
  var isArray = require('isarray');
  var Emitter = require('component-emitter');
  var binary = require('./binary');
  var isBuf = require('./is-buffer');
  exports.protocol = 4;
  exports.types = ['CONNECT', 'DISCONNECT', 'EVENT', 'BINARY_EVENT', 'ACK', 'BINARY_ACK', 'ERROR'];
  exports.CONNECT = 0;
  exports.DISCONNECT = 1;
  exports.EVENT = 2;
  exports.ACK = 3;
  exports.ERROR = 4;
  exports.BINARY_EVENT = 5;
  exports.BINARY_ACK = 6;
  exports.Encoder = Encoder;
  exports.Decoder = Decoder;
  function Encoder() {}
  Encoder.prototype.encode = function(obj, callback) {
    debug('encoding packet %j', obj);
    if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
      encodeAsBinary(obj, callback);
    } else {
      var encoding = encodeAsString(obj);
      callback([encoding]);
    }
  };
  function encodeAsString(obj) {
    var str = '';
    var nsp = false;
    str += obj.type;
    if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
      str += obj.attachments;
      str += '-';
    }
    if (obj.nsp && '/' != obj.nsp) {
      nsp = true;
      str += obj.nsp;
    }
    if (null != obj.id) {
      if (nsp) {
        str += ',';
        nsp = false;
      }
      str += obj.id;
    }
    if (null != obj.data) {
      if (nsp)
        str += ',';
      str += json.stringify(obj.data);
    }
    debug('encoded %j as %s', obj, str);
    return str;
  }
  function encodeAsBinary(obj, callback) {
    function writeEncoding(bloblessData) {
      var deconstruction = binary.deconstructPacket(bloblessData);
      var pack = encodeAsString(deconstruction.packet);
      var buffers = deconstruction.buffers;
      buffers.unshift(pack);
      callback(buffers);
    }
    binary.removeBlobs(obj, writeEncoding);
  }
  function Decoder() {
    this.reconstructor = null;
  }
  Emitter(Decoder.prototype);
  Decoder.prototype.add = function(obj) {
    var packet;
    if ('string' == typeof obj) {
      packet = decodeString(obj);
      if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) {
        this.reconstructor = new BinaryReconstructor(packet);
        if (this.reconstructor.reconPack.attachments === 0) {
          this.emit('decoded', packet);
        }
      } else {
        this.emit('decoded', packet);
      }
    } else if (isBuf(obj) || obj.base64) {
      if (!this.reconstructor) {
        throw new Error('got binary data when not reconstructing a packet');
      } else {
        packet = this.reconstructor.takeBinaryData(obj);
        if (packet) {
          this.reconstructor = null;
          this.emit('decoded', packet);
        }
      }
    } else {
      throw new Error('Unknown type: ' + obj);
    }
  };
  function decodeString(str) {
    var p = {};
    var i = 0;
    p.type = Number(str.charAt(0));
    if (null == exports.types[p.type])
      return error();
    if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
      var buf = '';
      while (str.charAt(++i) != '-') {
        buf += str.charAt(i);
        if (i == str.length)
          break;
      }
      if (buf != Number(buf) || str.charAt(i) != '-') {
        throw new Error('Illegal attachments');
      }
      p.attachments = Number(buf);
    }
    if ('/' == str.charAt(i + 1)) {
      p.nsp = '';
      while (++i) {
        var c = str.charAt(i);
        if (',' == c)
          break;
        p.nsp += c;
        if (i == str.length)
          break;
      }
    } else {
      p.nsp = '/';
    }
    var next = str.charAt(i + 1);
    if ('' !== next && Number(next) == next) {
      p.id = '';
      while (++i) {
        var c = str.charAt(i);
        if (null == c || Number(c) != c) {
          --i;
          break;
        }
        p.id += str.charAt(i);
        if (i == str.length)
          break;
      }
      p.id = Number(p.id);
    }
    if (str.charAt(++i)) {
      try {
        p.data = json.parse(str.substr(i));
      } catch (e) {
        return error();
      }
    }
    debug('decoded %s as %j', str, p);
    return p;
  }
  Decoder.prototype.destroy = function() {
    if (this.reconstructor) {
      this.reconstructor.finishedReconstruction();
    }
  };
  function BinaryReconstructor(packet) {
    this.reconPack = packet;
    this.buffers = [];
  }
  BinaryReconstructor.prototype.takeBinaryData = function(binData) {
    this.buffers.push(binData);
    if (this.buffers.length == this.reconPack.attachments) {
      var packet = binary.reconstructPacket(this.reconPack, this.buffers);
      this.finishedReconstruction();
      return packet;
    }
    return null;
  };
  BinaryReconstructor.prototype.finishedReconstruction = function() {
    this.reconPack = null;
    this.buffers = [];
  };
  function error(data) {
    return {
      type: exports.ERROR,
      data: 'parser error'
    };
  }
})(require('buffer').Buffer);
