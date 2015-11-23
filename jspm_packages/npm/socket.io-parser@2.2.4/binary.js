/* */ 
(function(Buffer) {
  var isArray = require('isarray');
  var isBuf = require('./is-buffer');
  exports.deconstructPacket = function(packet) {
    var buffers = [];
    var packetData = packet.data;
    function _deconstructPacket(data) {
      if (!data)
        return data;
      if (isBuf(data)) {
        var placeholder = {
          _placeholder: true,
          num: buffers.length
        };
        buffers.push(data);
        return placeholder;
      } else if (isArray(data)) {
        var newData = new Array(data.length);
        for (var i = 0; i < data.length; i++) {
          newData[i] = _deconstructPacket(data[i]);
        }
        return newData;
      } else if ('object' == typeof data && !(data instanceof Date)) {
        var newData = {};
        for (var key in data) {
          newData[key] = _deconstructPacket(data[key]);
        }
        return newData;
      }
      return data;
    }
    var pack = packet;
    pack.data = _deconstructPacket(packetData);
    pack.attachments = buffers.length;
    return {
      packet: pack,
      buffers: buffers
    };
  };
  exports.reconstructPacket = function(packet, buffers) {
    var curPlaceHolder = 0;
    function _reconstructPacket(data) {
      if (data && data._placeholder) {
        var buf = buffers[data.num];
        return buf;
      } else if (isArray(data)) {
        for (var i = 0; i < data.length; i++) {
          data[i] = _reconstructPacket(data[i]);
        }
        return data;
      } else if (data && 'object' == typeof data) {
        for (var key in data) {
          data[key] = _reconstructPacket(data[key]);
        }
        return data;
      }
      return data;
    }
    packet.data = _reconstructPacket(packet.data);
    packet.attachments = undefined;
    return packet;
  };
  exports.removeBlobs = function(data, callback) {
    function _removeBlobs(obj, curKey, containingObject) {
      if (!obj)
        return obj;
      if ((global.Blob && obj instanceof Blob) || (global.File && obj instanceof File)) {
        pendingBlobs++;
        var fileReader = new FileReader();
        fileReader.onload = function() {
          if (containingObject) {
            containingObject[curKey] = this.result;
          } else {
            bloblessData = this.result;
          }
          if (!--pendingBlobs) {
            callback(bloblessData);
          }
        };
        fileReader.readAsArrayBuffer(obj);
      } else if (isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
          _removeBlobs(obj[i], i, obj);
        }
      } else if (obj && 'object' == typeof obj && !isBuf(obj)) {
        for (var key in obj) {
          _removeBlobs(obj[key], key, obj);
        }
      }
    }
    var pendingBlobs = 0;
    var bloblessData = data;
    _removeBlobs(bloblessData);
    if (!pendingBlobs) {
      callback(bloblessData);
    }
  };
})(require('buffer').Buffer);
