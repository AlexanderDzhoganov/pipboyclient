/* */ 
"format cjs";
(function(Buffer) {
  !function(e) {
    if ("object" == typeof exports && "undefined" != typeof module)
      module.exports = e();
    else if ("function" == typeof define && define.amd)
      define([], e);
    else {
      var f;
      "undefined" != typeof window ? f = window : "undefined" != typeof global ? f = global : "undefined" != typeof self && (f = self), f.eio = e();
    }
  }(function() {
    var define,
        module,
        exports;
    return (function e(t, n, r) {
      function s(o, u) {
        if (!n[o]) {
          if (!t[o]) {
            var a = typeof require == "function" && require;
            if (!u && a)
              return a(o, !0);
            if (i)
              return i(o, !0);
            var f = new Error("Cannot find module '" + o + "'");
            throw f.code = "MODULE_NOT_FOUND", f;
          }
          var l = n[o] = {exports: {}};
          t[o][0].call(l.exports, function(e) {
            var n = t[o][1][e];
            return s(n ? n : e);
          }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
      }
      var i = typeof require == "function" && require;
      for (var o = 0; o < r.length; o++)
        s(r[o]);
      return s;
    })({
      1: [function(_dereq_, module, exports) {
        module.exports = _dereq_('./lib/');
      }, {"./lib/": 2}],
      2: [function(_dereq_, module, exports) {
        module.exports = _dereq_('./socket');
        module.exports.parser = _dereq_('engine.io-parser');
      }, {
        "./socket": 3,
        "engine.io-parser": 17
      }],
      3: [function(_dereq_, module, exports) {
        (function(global) {
          var transports = _dereq_('./transports');
          var Emitter = _dereq_('component-emitter');
          var debug = _dereq_('debug')('engine.io-client:socket');
          var index = _dereq_('indexof');
          var parser = _dereq_('engine.io-parser');
          var parseuri = _dereq_('parseuri');
          var parsejson = _dereq_('parsejson');
          var parseqs = _dereq_('parseqs');
          module.exports = Socket;
          function noop() {}
          function Socket(uri, opts) {
            if (!(this instanceof Socket))
              return new Socket(uri, opts);
            opts = opts || {};
            if (uri && 'object' == typeof uri) {
              opts = uri;
              uri = null;
            }
            if (uri) {
              uri = parseuri(uri);
              opts.host = uri.host;
              opts.secure = uri.protocol == 'https' || uri.protocol == 'wss';
              opts.port = uri.port;
              if (uri.query)
                opts.query = uri.query;
            }
            this.secure = null != opts.secure ? opts.secure : (global.location && 'https:' == location.protocol);
            if (opts.host) {
              var pieces = opts.host.split(':');
              opts.hostname = pieces.shift();
              if (pieces.length) {
                opts.port = pieces.pop();
              } else if (!opts.port) {
                opts.port = this.secure ? '443' : '80';
              }
            }
            this.agent = opts.agent || false;
            this.hostname = opts.hostname || (global.location ? location.hostname : 'localhost');
            this.port = opts.port || (global.location && location.port ? location.port : (this.secure ? 443 : 80));
            this.query = opts.query || {};
            if ('string' == typeof this.query)
              this.query = parseqs.decode(this.query);
            this.upgrade = false !== opts.upgrade;
            this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
            this.forceJSONP = !!opts.forceJSONP;
            this.jsonp = false !== opts.jsonp;
            this.forceBase64 = !!opts.forceBase64;
            this.enablesXDR = !!opts.enablesXDR;
            this.timestampParam = opts.timestampParam || 't';
            this.timestampRequests = opts.timestampRequests;
            this.transports = opts.transports || ['polling', 'websocket'];
            this.readyState = '';
            this.writeBuffer = [];
            this.callbackBuffer = [];
            this.policyPort = opts.policyPort || 843;
            this.rememberUpgrade = opts.rememberUpgrade || false;
            this.binaryType = null;
            this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
            this.pfx = opts.pfx || null;
            this.key = opts.key || null;
            this.passphrase = opts.passphrase || null;
            this.cert = opts.cert || null;
            this.ca = opts.ca || null;
            this.ciphers = opts.ciphers || null;
            this.rejectUnauthorized = opts.rejectUnauthorized || null;
            this.open();
          }
          Socket.priorWebsocketSuccess = false;
          Emitter(Socket.prototype);
          Socket.protocol = parser.protocol;
          Socket.Socket = Socket;
          Socket.Transport = _dereq_('./transport');
          Socket.transports = _dereq_('./transports');
          Socket.parser = _dereq_('engine.io-parser');
          Socket.prototype.createTransport = function(name) {
            debug('creating transport "%s"', name);
            var query = clone(this.query);
            query.EIO = parser.protocol;
            query.transport = name;
            if (this.id)
              query.sid = this.id;
            var transport = new transports[name]({
              agent: this.agent,
              hostname: this.hostname,
              port: this.port,
              secure: this.secure,
              path: this.path,
              query: query,
              forceJSONP: this.forceJSONP,
              jsonp: this.jsonp,
              forceBase64: this.forceBase64,
              enablesXDR: this.enablesXDR,
              timestampRequests: this.timestampRequests,
              timestampParam: this.timestampParam,
              policyPort: this.policyPort,
              socket: this,
              pfx: this.pfx,
              key: this.key,
              passphrase: this.passphrase,
              cert: this.cert,
              ca: this.ca,
              ciphers: this.ciphers,
              rejectUnauthorized: this.rejectUnauthorized
            });
            return transport;
          };
          function clone(obj) {
            var o = {};
            for (var i in obj) {
              if (obj.hasOwnProperty(i)) {
                o[i] = obj[i];
              }
            }
            return o;
          }
          Socket.prototype.open = function() {
            var transport;
            if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') != -1) {
              transport = 'websocket';
            } else if (0 == this.transports.length) {
              var self = this;
              setTimeout(function() {
                self.emit('error', 'No transports available');
              }, 0);
              return;
            } else {
              transport = this.transports[0];
            }
            this.readyState = 'opening';
            var transport;
            try {
              transport = this.createTransport(transport);
            } catch (e) {
              this.transports.shift();
              this.open();
              return;
            }
            transport.open();
            this.setTransport(transport);
          };
          Socket.prototype.setTransport = function(transport) {
            debug('setting transport %s', transport.name);
            var self = this;
            if (this.transport) {
              debug('clearing existing transport %s', this.transport.name);
              this.transport.removeAllListeners();
            }
            this.transport = transport;
            transport.on('drain', function() {
              self.onDrain();
            }).on('packet', function(packet) {
              self.onPacket(packet);
            }).on('error', function(e) {
              self.onError(e);
            }).on('close', function() {
              self.onClose('transport close');
            });
          };
          Socket.prototype.probe = function(name) {
            debug('probing transport "%s"', name);
            var transport = this.createTransport(name, {probe: 1}),
                failed = false,
                self = this;
            Socket.priorWebsocketSuccess = false;
            function onTransportOpen() {
              if (self.onlyBinaryUpgrades) {
                var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
                failed = failed || upgradeLosesBinary;
              }
              if (failed)
                return;
              debug('probe transport "%s" opened', name);
              transport.send([{
                type: 'ping',
                data: 'probe'
              }]);
              transport.once('packet', function(msg) {
                if (failed)
                  return;
                if ('pong' == msg.type && 'probe' == msg.data) {
                  debug('probe transport "%s" pong', name);
                  self.upgrading = true;
                  self.emit('upgrading', transport);
                  if (!transport)
                    return;
                  Socket.priorWebsocketSuccess = 'websocket' == transport.name;
                  debug('pausing current transport "%s"', self.transport.name);
                  self.transport.pause(function() {
                    if (failed)
                      return;
                    if ('closed' == self.readyState)
                      return;
                    debug('changing transport and sending upgrade packet');
                    cleanup();
                    self.setTransport(transport);
                    transport.send([{type: 'upgrade'}]);
                    self.emit('upgrade', transport);
                    transport = null;
                    self.upgrading = false;
                    self.flush();
                  });
                } else {
                  debug('probe transport "%s" failed', name);
                  var err = new Error('probe error');
                  err.transport = transport.name;
                  self.emit('upgradeError', err);
                }
              });
            }
            function freezeTransport() {
              if (failed)
                return;
              failed = true;
              cleanup();
              transport.close();
              transport = null;
            }
            function onerror(err) {
              var error = new Error('probe error: ' + err);
              error.transport = transport.name;
              freezeTransport();
              debug('probe transport "%s" failed because of error: %s', name, err);
              self.emit('upgradeError', error);
            }
            function onTransportClose() {
              onerror("transport closed");
            }
            function onclose() {
              onerror("socket closed");
            }
            function onupgrade(to) {
              if (transport && to.name != transport.name) {
                debug('"%s" works - aborting "%s"', to.name, transport.name);
                freezeTransport();
              }
            }
            function cleanup() {
              transport.removeListener('open', onTransportOpen);
              transport.removeListener('error', onerror);
              transport.removeListener('close', onTransportClose);
              self.removeListener('close', onclose);
              self.removeListener('upgrading', onupgrade);
            }
            transport.once('open', onTransportOpen);
            transport.once('error', onerror);
            transport.once('close', onTransportClose);
            this.once('close', onclose);
            this.once('upgrading', onupgrade);
            transport.open();
          };
          Socket.prototype.onOpen = function() {
            debug('socket open');
            this.readyState = 'open';
            Socket.priorWebsocketSuccess = 'websocket' == this.transport.name;
            this.emit('open');
            this.flush();
            if ('open' == this.readyState && this.upgrade && this.transport.pause) {
              debug('starting upgrade probes');
              for (var i = 0,
                  l = this.upgrades.length; i < l; i++) {
                this.probe(this.upgrades[i]);
              }
            }
          };
          Socket.prototype.onPacket = function(packet) {
            if ('opening' == this.readyState || 'open' == this.readyState) {
              debug('socket receive: type "%s", data "%s"', packet.type, packet.data);
              this.emit('packet', packet);
              this.emit('heartbeat');
              switch (packet.type) {
                case 'open':
                  this.onHandshake(parsejson(packet.data));
                  break;
                case 'pong':
                  this.setPing();
                  break;
                case 'error':
                  var err = new Error('server error');
                  err.code = packet.data;
                  this.emit('error', err);
                  break;
                case 'message':
                  this.emit('data', packet.data);
                  this.emit('message', packet.data);
                  break;
              }
            } else {
              debug('packet received with socket readyState "%s"', this.readyState);
            }
          };
          Socket.prototype.onHandshake = function(data) {
            this.emit('handshake', data);
            this.id = data.sid;
            this.transport.query.sid = data.sid;
            this.upgrades = this.filterUpgrades(data.upgrades);
            this.pingInterval = data.pingInterval;
            this.pingTimeout = data.pingTimeout;
            this.onOpen();
            if ('closed' == this.readyState)
              return;
            this.setPing();
            this.removeListener('heartbeat', this.onHeartbeat);
            this.on('heartbeat', this.onHeartbeat);
          };
          Socket.prototype.onHeartbeat = function(timeout) {
            clearTimeout(this.pingTimeoutTimer);
            var self = this;
            self.pingTimeoutTimer = setTimeout(function() {
              if ('closed' == self.readyState)
                return;
              self.onClose('ping timeout');
            }, timeout || (self.pingInterval + self.pingTimeout));
          };
          Socket.prototype.setPing = function() {
            var self = this;
            clearTimeout(self.pingIntervalTimer);
            self.pingIntervalTimer = setTimeout(function() {
              debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
              self.ping();
              self.onHeartbeat(self.pingTimeout);
            }, self.pingInterval);
          };
          Socket.prototype.ping = function() {
            this.sendPacket('ping');
          };
          Socket.prototype.onDrain = function() {
            for (var i = 0; i < this.prevBufferLen; i++) {
              if (this.callbackBuffer[i]) {
                this.callbackBuffer[i]();
              }
            }
            this.writeBuffer.splice(0, this.prevBufferLen);
            this.callbackBuffer.splice(0, this.prevBufferLen);
            this.prevBufferLen = 0;
            if (this.writeBuffer.length == 0) {
              this.emit('drain');
            } else {
              this.flush();
            }
          };
          Socket.prototype.flush = function() {
            if ('closed' != this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
              debug('flushing %d packets in socket', this.writeBuffer.length);
              this.transport.send(this.writeBuffer);
              this.prevBufferLen = this.writeBuffer.length;
              this.emit('flush');
            }
          };
          Socket.prototype.write = Socket.prototype.send = function(msg, fn) {
            this.sendPacket('message', msg, fn);
            return this;
          };
          Socket.prototype.sendPacket = function(type, data, fn) {
            if ('closing' == this.readyState || 'closed' == this.readyState) {
              return;
            }
            var packet = {
              type: type,
              data: data
            };
            this.emit('packetCreate', packet);
            this.writeBuffer.push(packet);
            this.callbackBuffer.push(fn);
            this.flush();
          };
          Socket.prototype.close = function() {
            if ('opening' == this.readyState || 'open' == this.readyState) {
              this.readyState = 'closing';
              var self = this;
              function close() {
                self.onClose('forced close');
                debug('socket closing - telling transport to close');
                self.transport.close();
              }
              function cleanupAndClose() {
                self.removeListener('upgrade', cleanupAndClose);
                self.removeListener('upgradeError', cleanupAndClose);
                close();
              }
              function waitForUpgrade() {
                self.once('upgrade', cleanupAndClose);
                self.once('upgradeError', cleanupAndClose);
              }
              if (this.writeBuffer.length) {
                this.once('drain', function() {
                  if (this.upgrading) {
                    waitForUpgrade();
                  } else {
                    close();
                  }
                });
              } else if (this.upgrading) {
                waitForUpgrade();
              } else {
                close();
              }
            }
            return this;
          };
          Socket.prototype.onError = function(err) {
            debug('socket error %j', err);
            Socket.priorWebsocketSuccess = false;
            this.emit('error', err);
            this.onClose('transport error', err);
          };
          Socket.prototype.onClose = function(reason, desc) {
            if ('opening' == this.readyState || 'open' == this.readyState || 'closing' == this.readyState) {
              debug('socket close with reason: "%s"', reason);
              var self = this;
              clearTimeout(this.pingIntervalTimer);
              clearTimeout(this.pingTimeoutTimer);
              setTimeout(function() {
                self.writeBuffer = [];
                self.callbackBuffer = [];
                self.prevBufferLen = 0;
              }, 0);
              this.transport.removeAllListeners('close');
              this.transport.close();
              this.transport.removeAllListeners();
              this.readyState = 'closed';
              this.id = null;
              this.emit('close', reason, desc);
            }
          };
          Socket.prototype.filterUpgrades = function(upgrades) {
            var filteredUpgrades = [];
            for (var i = 0,
                j = upgrades.length; i < j; i++) {
              if (~index(this.transports, upgrades[i]))
                filteredUpgrades.push(upgrades[i]);
            }
            return filteredUpgrades;
          };
        }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {
        "./transport": 4,
        "./transports": 5,
        "component-emitter": 12,
        "debug": 14,
        "engine.io-parser": 17,
        "indexof": 27,
        "parsejson": 28,
        "parseqs": 29,
        "parseuri": 30
      }],
      4: [function(_dereq_, module, exports) {
        var parser = _dereq_('engine.io-parser');
        var Emitter = _dereq_('component-emitter');
        module.exports = Transport;
        function Transport(opts) {
          this.path = opts.path;
          this.hostname = opts.hostname;
          this.port = opts.port;
          this.secure = opts.secure;
          this.query = opts.query;
          this.timestampParam = opts.timestampParam;
          this.timestampRequests = opts.timestampRequests;
          this.readyState = '';
          this.agent = opts.agent || false;
          this.socket = opts.socket;
          this.enablesXDR = opts.enablesXDR;
          this.pfx = opts.pfx;
          this.key = opts.key;
          this.passphrase = opts.passphrase;
          this.cert = opts.cert;
          this.ca = opts.ca;
          this.ciphers = opts.ciphers;
          this.rejectUnauthorized = opts.rejectUnauthorized;
        }
        Emitter(Transport.prototype);
        Transport.timestamps = 0;
        Transport.prototype.onError = function(msg, desc) {
          var err = new Error(msg);
          err.type = 'TransportError';
          err.description = desc;
          this.emit('error', err);
          return this;
        };
        Transport.prototype.open = function() {
          if ('closed' == this.readyState || '' == this.readyState) {
            this.readyState = 'opening';
            this.doOpen();
          }
          return this;
        };
        Transport.prototype.close = function() {
          if ('opening' == this.readyState || 'open' == this.readyState) {
            this.doClose();
            this.onClose();
          }
          return this;
        };
        Transport.prototype.send = function(packets) {
          if ('open' == this.readyState) {
            this.write(packets);
          } else {
            throw new Error('Transport not open');
          }
        };
        Transport.prototype.onOpen = function() {
          this.readyState = 'open';
          this.writable = true;
          this.emit('open');
        };
        Transport.prototype.onData = function(data) {
          var packet = parser.decodePacket(data, this.socket.binaryType);
          this.onPacket(packet);
        };
        Transport.prototype.onPacket = function(packet) {
          this.emit('packet', packet);
        };
        Transport.prototype.onClose = function() {
          this.readyState = 'closed';
          this.emit('close');
        };
      }, {
        "component-emitter": 12,
        "engine.io-parser": 17
      }],
      5: [function(_dereq_, module, exports) {
        (function(global) {
          var XMLHttpRequest = _dereq_('xmlhttprequest');
          var XHR = _dereq_('./polling-xhr');
          var JSONP = _dereq_('./polling-jsonp');
          var websocket = _dereq_('./websocket');
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
        }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {
        "./polling-jsonp": 6,
        "./polling-xhr": 7,
        "./websocket": 9,
        "xmlhttprequest": 10
      }],
      6: [function(_dereq_, module, exports) {
        (function(global) {
          var Polling = _dereq_('./polling');
          var inherit = _dereq_('component-inherit');
          module.exports = JSONPPolling;
          var rNewline = /\n/g;
          var rEscapedNewline = /\\n/g;
          var callbacks;
          var index = 0;
          function empty() {}
          function JSONPPolling(opts) {
            Polling.call(this, opts);
            this.query = this.query || {};
            if (!callbacks) {
              if (!global.___eio)
                global.___eio = [];
              callbacks = global.___eio;
            }
            this.index = callbacks.length;
            var self = this;
            callbacks.push(function(msg) {
              self.onData(msg);
            });
            this.query.j = this.index;
            if (global.document && global.addEventListener) {
              global.addEventListener('beforeunload', function() {
                if (self.script)
                  self.script.onerror = empty;
              }, false);
            }
          }
          inherit(JSONPPolling, Polling);
          JSONPPolling.prototype.supportsBinary = false;
          JSONPPolling.prototype.doClose = function() {
            if (this.script) {
              this.script.parentNode.removeChild(this.script);
              this.script = null;
            }
            if (this.form) {
              this.form.parentNode.removeChild(this.form);
              this.form = null;
              this.iframe = null;
            }
            Polling.prototype.doClose.call(this);
          };
          JSONPPolling.prototype.doPoll = function() {
            var self = this;
            var script = document.createElement('script');
            if (this.script) {
              this.script.parentNode.removeChild(this.script);
              this.script = null;
            }
            script.async = true;
            script.src = this.uri();
            script.onerror = function(e) {
              self.onError('jsonp poll error', e);
            };
            var insertAt = document.getElementsByTagName('script')[0];
            insertAt.parentNode.insertBefore(script, insertAt);
            this.script = script;
            var isUAgecko = 'undefined' != typeof navigator && /gecko/i.test(navigator.userAgent);
            if (isUAgecko) {
              setTimeout(function() {
                var iframe = document.createElement('iframe');
                document.body.appendChild(iframe);
                document.body.removeChild(iframe);
              }, 100);
            }
          };
          JSONPPolling.prototype.doWrite = function(data, fn) {
            var self = this;
            if (!this.form) {
              var form = document.createElement('form');
              var area = document.createElement('textarea');
              var id = this.iframeId = 'eio_iframe_' + this.index;
              var iframe;
              form.className = 'socketio';
              form.style.position = 'absolute';
              form.style.top = '-1000px';
              form.style.left = '-1000px';
              form.target = id;
              form.method = 'POST';
              form.setAttribute('accept-charset', 'utf-8');
              area.name = 'd';
              form.appendChild(area);
              document.body.appendChild(form);
              this.form = form;
              this.area = area;
            }
            this.form.action = this.uri();
            function complete() {
              initIframe();
              fn();
            }
            function initIframe() {
              if (self.iframe) {
                try {
                  self.form.removeChild(self.iframe);
                } catch (e) {
                  self.onError('jsonp polling iframe removal error', e);
                }
              }
              try {
                var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
                iframe = document.createElement(html);
              } catch (e) {
                iframe = document.createElement('iframe');
                iframe.name = self.iframeId;
                iframe.src = 'javascript:0';
              }
              iframe.id = self.iframeId;
              self.form.appendChild(iframe);
              self.iframe = iframe;
            }
            initIframe();
            data = data.replace(rEscapedNewline, '\\\n');
            this.area.value = data.replace(rNewline, '\\n');
            try {
              this.form.submit();
            } catch (e) {}
            if (this.iframe.attachEvent) {
              this.iframe.onreadystatechange = function() {
                if (self.iframe.readyState == 'complete') {
                  complete();
                }
              };
            } else {
              this.iframe.onload = complete;
            }
          };
        }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {
        "./polling": 8,
        "component-inherit": 13
      }],
      7: [function(_dereq_, module, exports) {
        (function(global) {
          var XMLHttpRequest = _dereq_('xmlhttprequest');
          var Polling = _dereq_('./polling');
          var Emitter = _dereq_('component-emitter');
          var inherit = _dereq_('component-inherit');
          var debug = _dereq_('debug')('engine.io-client:polling-xhr');
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
        }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {
        "./polling": 8,
        "component-emitter": 12,
        "component-inherit": 13,
        "debug": 14,
        "xmlhttprequest": 10
      }],
      8: [function(_dereq_, module, exports) {
        var Transport = _dereq_('../transport');
        var parseqs = _dereq_('parseqs');
        var parser = _dereq_('engine.io-parser');
        var inherit = _dereq_('component-inherit');
        var debug = _dereq_('debug')('engine.io-client:polling');
        module.exports = Polling;
        var hasXHR2 = (function() {
          var XMLHttpRequest = _dereq_('xmlhttprequest');
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
      }, {
        "../transport": 4,
        "component-inherit": 13,
        "debug": 14,
        "engine.io-parser": 17,
        "parseqs": 29,
        "xmlhttprequest": 10
      }],
      9: [function(_dereq_, module, exports) {
        var Transport = _dereq_('../transport');
        var parser = _dereq_('engine.io-parser');
        var parseqs = _dereq_('parseqs');
        var inherit = _dereq_('component-inherit');
        var debug = _dereq_('debug')('engine.io-client:websocket');
        var WebSocket = _dereq_('ws');
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
      }, {
        "../transport": 4,
        "component-inherit": 13,
        "debug": 14,
        "engine.io-parser": 17,
        "parseqs": 29,
        "ws": 31
      }],
      10: [function(_dereq_, module, exports) {
        var hasCORS = _dereq_('has-cors');
        module.exports = function(opts) {
          var xdomain = opts.xdomain;
          var xscheme = opts.xscheme;
          var enablesXDR = opts.enablesXDR;
          try {
            if ('undefined' != typeof XMLHttpRequest && (!xdomain || hasCORS)) {
              return new XMLHttpRequest();
            }
          } catch (e) {}
          try {
            if ('undefined' != typeof XDomainRequest && !xscheme && enablesXDR) {
              return new XDomainRequest();
            }
          } catch (e) {}
          if (!xdomain) {
            try {
              return new ActiveXObject('Microsoft.XMLHTTP');
            } catch (e) {}
          }
        };
      }, {"has-cors": 25}],
      11: [function(_dereq_, module, exports) {
        (function(global) {
          var BlobBuilder = global.BlobBuilder || global.WebKitBlobBuilder || global.MSBlobBuilder || global.MozBlobBuilder;
          var blobSupported = (function() {
            try {
              var b = new Blob(['hi']);
              return b.size == 2;
            } catch (e) {
              return false;
            }
          })();
          var blobBuilderSupported = BlobBuilder && BlobBuilder.prototype.append && BlobBuilder.prototype.getBlob;
          function BlobBuilderConstructor(ary, options) {
            options = options || {};
            var bb = new BlobBuilder();
            for (var i = 0; i < ary.length; i++) {
              bb.append(ary[i]);
            }
            return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
          }
          ;
          module.exports = (function() {
            if (blobSupported) {
              return global.Blob;
            } else if (blobBuilderSupported) {
              return BlobBuilderConstructor;
            } else {
              return undefined;
            }
          })();
        }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {}],
      12: [function(_dereq_, module, exports) {
        module.exports = Emitter;
        function Emitter(obj) {
          if (obj)
            return mixin(obj);
        }
        ;
        function mixin(obj) {
          for (var key in Emitter.prototype) {
            obj[key] = Emitter.prototype[key];
          }
          return obj;
        }
        Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
          this._callbacks = this._callbacks || {};
          (this._callbacks[event] = this._callbacks[event] || []).push(fn);
          return this;
        };
        Emitter.prototype.once = function(event, fn) {
          var self = this;
          this._callbacks = this._callbacks || {};
          function on() {
            self.off(event, on);
            fn.apply(this, arguments);
          }
          on.fn = fn;
          this.on(event, on);
          return this;
        };
        Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
          this._callbacks = this._callbacks || {};
          if (0 == arguments.length) {
            this._callbacks = {};
            return this;
          }
          var callbacks = this._callbacks[event];
          if (!callbacks)
            return this;
          if (1 == arguments.length) {
            delete this._callbacks[event];
            return this;
          }
          var cb;
          for (var i = 0; i < callbacks.length; i++) {
            cb = callbacks[i];
            if (cb === fn || cb.fn === fn) {
              callbacks.splice(i, 1);
              break;
            }
          }
          return this;
        };
        Emitter.prototype.emit = function(event) {
          this._callbacks = this._callbacks || {};
          var args = [].slice.call(arguments, 1),
              callbacks = this._callbacks[event];
          if (callbacks) {
            callbacks = callbacks.slice(0);
            for (var i = 0,
                len = callbacks.length; i < len; ++i) {
              callbacks[i].apply(this, args);
            }
          }
          return this;
        };
        Emitter.prototype.listeners = function(event) {
          this._callbacks = this._callbacks || {};
          return this._callbacks[event] || [];
        };
        Emitter.prototype.hasListeners = function(event) {
          return !!this.listeners(event).length;
        };
      }, {}],
      13: [function(_dereq_, module, exports) {
        module.exports = function(a, b) {
          var fn = function() {};
          fn.prototype = b.prototype;
          a.prototype = new fn;
          a.prototype.constructor = a;
        };
      }, {}],
      14: [function(_dereq_, module, exports) {
        exports = module.exports = _dereq_('./debug');
        exports.log = log;
        exports.formatArgs = formatArgs;
        exports.save = save;
        exports.load = load;
        exports.useColors = useColors;
        exports.colors = ['lightseagreen', 'forestgreen', 'goldenrod', 'dodgerblue', 'darkorchid', 'crimson'];
        function useColors() {
          return ('WebkitAppearance' in document.documentElement.style) || (window.console && (console.firebug || (console.exception && console.table))) || (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
        }
        exports.formatters.j = function(v) {
          return JSON.stringify(v);
        };
        function formatArgs() {
          var args = arguments;
          var useColors = this.useColors;
          args[0] = (useColors ? '%c' : '') + this.namespace + (useColors ? ' %c' : ' ') + args[0] + (useColors ? '%c ' : ' ') + '+' + exports.humanize(this.diff);
          if (!useColors)
            return args;
          var c = 'color: ' + this.color;
          args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));
          var index = 0;
          var lastC = 0;
          args[0].replace(/%[a-z%]/g, function(match) {
            if ('%%' === match)
              return;
            index++;
            if ('%c' === match) {
              lastC = index;
            }
          });
          args.splice(lastC, 0, c);
          return args;
        }
        function log() {
          return 'object' == typeof console && 'function' == typeof console.log && Function.prototype.apply.call(console.log, console, arguments);
        }
        function save(namespaces) {
          try {
            if (null == namespaces) {
              localStorage.removeItem('debug');
            } else {
              localStorage.debug = namespaces;
            }
          } catch (e) {}
        }
        function load() {
          var r;
          try {
            r = localStorage.debug;
          } catch (e) {}
          return r;
        }
        exports.enable(load());
      }, {"./debug": 15}],
      15: [function(_dereq_, module, exports) {
        exports = module.exports = debug;
        exports.coerce = coerce;
        exports.disable = disable;
        exports.enable = enable;
        exports.enabled = enabled;
        exports.humanize = _dereq_('ms');
        exports.names = [];
        exports.skips = [];
        exports.formatters = {};
        var prevColor = 0;
        var prevTime;
        function selectColor() {
          return exports.colors[prevColor++ % exports.colors.length];
        }
        function debug(namespace) {
          function disabled() {}
          disabled.enabled = false;
          function enabled() {
            var self = enabled;
            var curr = +new Date();
            var ms = curr - (prevTime || curr);
            self.diff = ms;
            self.prev = prevTime;
            self.curr = curr;
            prevTime = curr;
            if (null == self.useColors)
              self.useColors = exports.useColors();
            if (null == self.color && self.useColors)
              self.color = selectColor();
            var args = Array.prototype.slice.call(arguments);
            args[0] = exports.coerce(args[0]);
            if ('string' !== typeof args[0]) {
              args = ['%o'].concat(args);
            }
            var index = 0;
            args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
              if (match === '%%')
                return match;
              index++;
              var formatter = exports.formatters[format];
              if ('function' === typeof formatter) {
                var val = args[index];
                match = formatter.call(self, val);
                args.splice(index, 1);
                index--;
              }
              return match;
            });
            if ('function' === typeof exports.formatArgs) {
              args = exports.formatArgs.apply(self, args);
            }
            var logFn = enabled.log || exports.log || console.log.bind(console);
            logFn.apply(self, args);
          }
          enabled.enabled = true;
          var fn = exports.enabled(namespace) ? enabled : disabled;
          fn.namespace = namespace;
          return fn;
        }
        function enable(namespaces) {
          exports.save(namespaces);
          var split = (namespaces || '').split(/[\s,]+/);
          var len = split.length;
          for (var i = 0; i < len; i++) {
            if (!split[i])
              continue;
            namespaces = split[i].replace(/\*/g, '.*?');
            if (namespaces[0] === '-') {
              exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
            } else {
              exports.names.push(new RegExp('^' + namespaces + '$'));
            }
          }
        }
        function disable() {
          exports.enable('');
        }
        function enabled(name) {
          var i,
              len;
          for (i = 0, len = exports.skips.length; i < len; i++) {
            if (exports.skips[i].test(name)) {
              return false;
            }
          }
          for (i = 0, len = exports.names.length; i < len; i++) {
            if (exports.names[i].test(name)) {
              return true;
            }
          }
          return false;
        }
        function coerce(val) {
          if (val instanceof Error)
            return val.stack || val.message;
          return val;
        }
      }, {"ms": 16}],
      16: [function(_dereq_, module, exports) {
        var s = 1000;
        var m = s * 60;
        var h = m * 60;
        var d = h * 24;
        var y = d * 365.25;
        module.exports = function(val, options) {
          options = options || {};
          if ('string' == typeof val)
            return parse(val);
          return options.long ? long(val) : short(val);
        };
        function parse(str) {
          var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
          if (!match)
            return;
          var n = parseFloat(match[1]);
          var type = (match[2] || 'ms').toLowerCase();
          switch (type) {
            case 'years':
            case 'year':
            case 'y':
              return n * y;
            case 'days':
            case 'day':
            case 'd':
              return n * d;
            case 'hours':
            case 'hour':
            case 'h':
              return n * h;
            case 'minutes':
            case 'minute':
            case 'm':
              return n * m;
            case 'seconds':
            case 'second':
            case 's':
              return n * s;
            case 'ms':
              return n;
          }
        }
        function short(ms) {
          if (ms >= d)
            return Math.round(ms / d) + 'd';
          if (ms >= h)
            return Math.round(ms / h) + 'h';
          if (ms >= m)
            return Math.round(ms / m) + 'm';
          if (ms >= s)
            return Math.round(ms / s) + 's';
          return ms + 'ms';
        }
        function long(ms) {
          return plural(ms, d, 'day') || plural(ms, h, 'hour') || plural(ms, m, 'minute') || plural(ms, s, 'second') || ms + ' ms';
        }
        function plural(ms, n, name) {
          if (ms < n)
            return;
          if (ms < n * 1.5)
            return Math.floor(ms / n) + ' ' + name;
          return Math.ceil(ms / n) + ' ' + name + 's';
        }
      }, {}],
      17: [function(_dereq_, module, exports) {
        (function(global) {
          var keys = _dereq_('./keys');
          var hasBinary = _dereq_('has-binary');
          var sliceBuffer = _dereq_('arraybuffer.slice');
          var base64encoder = _dereq_('base64-arraybuffer');
          var after = _dereq_('after');
          var utf8 = _dereq_('utf8');
          var isAndroid = navigator.userAgent.match(/Android/i);
          var isPhantomJS = /PhantomJS/i.test(navigator.userAgent);
          var dontSendBlobs = isAndroid || isPhantomJS;
          exports.protocol = 3;
          var packets = exports.packets = {
            open: 0,
            close: 1,
            ping: 2,
            pong: 3,
            message: 4,
            upgrade: 5,
            noop: 6
          };
          var packetslist = keys(packets);
          var err = {
            type: 'error',
            data: 'parser error'
          };
          var Blob = _dereq_('blob');
          exports.encodePacket = function(packet, supportsBinary, utf8encode, callback) {
            if ('function' == typeof supportsBinary) {
              callback = supportsBinary;
              supportsBinary = false;
            }
            if ('function' == typeof utf8encode) {
              callback = utf8encode;
              utf8encode = null;
            }
            var data = (packet.data === undefined) ? undefined : packet.data.buffer || packet.data;
            if (global.ArrayBuffer && data instanceof ArrayBuffer) {
              return encodeArrayBuffer(packet, supportsBinary, callback);
            } else if (Blob && data instanceof global.Blob) {
              return encodeBlob(packet, supportsBinary, callback);
            }
            if (data && data.base64) {
              return encodeBase64Object(packet, callback);
            }
            var encoded = packets[packet.type];
            if (undefined !== packet.data) {
              encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
            }
            return callback('' + encoded);
          };
          function encodeBase64Object(packet, callback) {
            var message = 'b' + exports.packets[packet.type] + packet.data.data;
            return callback(message);
          }
          function encodeArrayBuffer(packet, supportsBinary, callback) {
            if (!supportsBinary) {
              return exports.encodeBase64Packet(packet, callback);
            }
            var data = packet.data;
            var contentArray = new Uint8Array(data);
            var resultBuffer = new Uint8Array(1 + data.byteLength);
            resultBuffer[0] = packets[packet.type];
            for (var i = 0; i < contentArray.length; i++) {
              resultBuffer[i + 1] = contentArray[i];
            }
            return callback(resultBuffer.buffer);
          }
          function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
            if (!supportsBinary) {
              return exports.encodeBase64Packet(packet, callback);
            }
            var fr = new FileReader();
            fr.onload = function() {
              packet.data = fr.result;
              exports.encodePacket(packet, supportsBinary, true, callback);
            };
            return fr.readAsArrayBuffer(packet.data);
          }
          function encodeBlob(packet, supportsBinary, callback) {
            if (!supportsBinary) {
              return exports.encodeBase64Packet(packet, callback);
            }
            if (dontSendBlobs) {
              return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
            }
            var length = new Uint8Array(1);
            length[0] = packets[packet.type];
            var blob = new Blob([length.buffer, packet.data]);
            return callback(blob);
          }
          exports.encodeBase64Packet = function(packet, callback) {
            var message = 'b' + exports.packets[packet.type];
            if (Blob && packet.data instanceof Blob) {
              var fr = new FileReader();
              fr.onload = function() {
                var b64 = fr.result.split(',')[1];
                callback(message + b64);
              };
              return fr.readAsDataURL(packet.data);
            }
            var b64data;
            try {
              b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
            } catch (e) {
              var typed = new Uint8Array(packet.data);
              var basic = new Array(typed.length);
              for (var i = 0; i < typed.length; i++) {
                basic[i] = typed[i];
              }
              b64data = String.fromCharCode.apply(null, basic);
            }
            message += global.btoa(b64data);
            return callback(message);
          };
          exports.decodePacket = function(data, binaryType, utf8decode) {
            if (typeof data == 'string' || data === undefined) {
              if (data.charAt(0) == 'b') {
                return exports.decodeBase64Packet(data.substr(1), binaryType);
              }
              if (utf8decode) {
                try {
                  data = utf8.decode(data);
                } catch (e) {
                  return err;
                }
              }
              var type = data.charAt(0);
              if (Number(type) != type || !packetslist[type]) {
                return err;
              }
              if (data.length > 1) {
                return {
                  type: packetslist[type],
                  data: data.substring(1)
                };
              } else {
                return {type: packetslist[type]};
              }
            }
            var asArray = new Uint8Array(data);
            var type = asArray[0];
            var rest = sliceBuffer(data, 1);
            if (Blob && binaryType === 'blob') {
              rest = new Blob([rest]);
            }
            return {
              type: packetslist[type],
              data: rest
            };
          };
          exports.decodeBase64Packet = function(msg, binaryType) {
            var type = packetslist[msg.charAt(0)];
            if (!global.ArrayBuffer) {
              return {
                type: type,
                data: {
                  base64: true,
                  data: msg.substr(1)
                }
              };
            }
            var data = base64encoder.decode(msg.substr(1));
            if (binaryType === 'blob' && Blob) {
              data = new Blob([data]);
            }
            return {
              type: type,
              data: data
            };
          };
          exports.encodePayload = function(packets, supportsBinary, callback) {
            if (typeof supportsBinary == 'function') {
              callback = supportsBinary;
              supportsBinary = null;
            }
            var isBinary = hasBinary(packets);
            if (supportsBinary && isBinary) {
              if (Blob && !dontSendBlobs) {
                return exports.encodePayloadAsBlob(packets, callback);
              }
              return exports.encodePayloadAsArrayBuffer(packets, callback);
            }
            if (!packets.length) {
              return callback('0:');
            }
            function setLengthHeader(message) {
              return message.length + ':' + message;
            }
            function encodeOne(packet, doneCallback) {
              exports.encodePacket(packet, !isBinary ? false : supportsBinary, true, function(message) {
                doneCallback(null, setLengthHeader(message));
              });
            }
            map(packets, encodeOne, function(err, results) {
              return callback(results.join(''));
            });
          };
          function map(ary, each, done) {
            var result = new Array(ary.length);
            var next = after(ary.length, done);
            var eachWithIndex = function(i, el, cb) {
              each(el, function(error, msg) {
                result[i] = msg;
                cb(error, result);
              });
            };
            for (var i = 0; i < ary.length; i++) {
              eachWithIndex(i, ary[i], next);
            }
          }
          exports.decodePayload = function(data, binaryType, callback) {
            if (typeof data != 'string') {
              return exports.decodePayloadAsBinary(data, binaryType, callback);
            }
            if (typeof binaryType === 'function') {
              callback = binaryType;
              binaryType = null;
            }
            var packet;
            if (data == '') {
              return callback(err, 0, 1);
            }
            var length = '',
                n,
                msg;
            for (var i = 0,
                l = data.length; i < l; i++) {
              var chr = data.charAt(i);
              if (':' != chr) {
                length += chr;
              } else {
                if ('' == length || (length != (n = Number(length)))) {
                  return callback(err, 0, 1);
                }
                msg = data.substr(i + 1, n);
                if (length != msg.length) {
                  return callback(err, 0, 1);
                }
                if (msg.length) {
                  packet = exports.decodePacket(msg, binaryType, true);
                  if (err.type == packet.type && err.data == packet.data) {
                    return callback(err, 0, 1);
                  }
                  var ret = callback(packet, i + n, l);
                  if (false === ret)
                    return;
                }
                i += n;
                length = '';
              }
            }
            if (length != '') {
              return callback(err, 0, 1);
            }
          };
          exports.encodePayloadAsArrayBuffer = function(packets, callback) {
            if (!packets.length) {
              return callback(new ArrayBuffer(0));
            }
            function encodeOne(packet, doneCallback) {
              exports.encodePacket(packet, true, true, function(data) {
                return doneCallback(null, data);
              });
            }
            map(packets, encodeOne, function(err, encodedPackets) {
              var totalLength = encodedPackets.reduce(function(acc, p) {
                var len;
                if (typeof p === 'string') {
                  len = p.length;
                } else {
                  len = p.byteLength;
                }
                return acc + len.toString().length + len + 2;
              }, 0);
              var resultArray = new Uint8Array(totalLength);
              var bufferIndex = 0;
              encodedPackets.forEach(function(p) {
                var isString = typeof p === 'string';
                var ab = p;
                if (isString) {
                  var view = new Uint8Array(p.length);
                  for (var i = 0; i < p.length; i++) {
                    view[i] = p.charCodeAt(i);
                  }
                  ab = view.buffer;
                }
                if (isString) {
                  resultArray[bufferIndex++] = 0;
                } else {
                  resultArray[bufferIndex++] = 1;
                }
                var lenStr = ab.byteLength.toString();
                for (var i = 0; i < lenStr.length; i++) {
                  resultArray[bufferIndex++] = parseInt(lenStr[i]);
                }
                resultArray[bufferIndex++] = 255;
                var view = new Uint8Array(ab);
                for (var i = 0; i < view.length; i++) {
                  resultArray[bufferIndex++] = view[i];
                }
              });
              return callback(resultArray.buffer);
            });
          };
          exports.encodePayloadAsBlob = function(packets, callback) {
            function encodeOne(packet, doneCallback) {
              exports.encodePacket(packet, true, true, function(encoded) {
                var binaryIdentifier = new Uint8Array(1);
                binaryIdentifier[0] = 1;
                if (typeof encoded === 'string') {
                  var view = new Uint8Array(encoded.length);
                  for (var i = 0; i < encoded.length; i++) {
                    view[i] = encoded.charCodeAt(i);
                  }
                  encoded = view.buffer;
                  binaryIdentifier[0] = 0;
                }
                var len = (encoded instanceof ArrayBuffer) ? encoded.byteLength : encoded.size;
                var lenStr = len.toString();
                var lengthAry = new Uint8Array(lenStr.length + 1);
                for (var i = 0; i < lenStr.length; i++) {
                  lengthAry[i] = parseInt(lenStr[i]);
                }
                lengthAry[lenStr.length] = 255;
                if (Blob) {
                  var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
                  doneCallback(null, blob);
                }
              });
            }
            map(packets, encodeOne, function(err, results) {
              return callback(new Blob(results));
            });
          };
          exports.decodePayloadAsBinary = function(data, binaryType, callback) {
            if (typeof binaryType === 'function') {
              callback = binaryType;
              binaryType = null;
            }
            var bufferTail = data;
            var buffers = [];
            var numberTooLong = false;
            while (bufferTail.byteLength > 0) {
              var tailArray = new Uint8Array(bufferTail);
              var isString = tailArray[0] === 0;
              var msgLength = '';
              for (var i = 1; ; i++) {
                if (tailArray[i] == 255)
                  break;
                if (msgLength.length > 310) {
                  numberTooLong = true;
                  break;
                }
                msgLength += tailArray[i];
              }
              if (numberTooLong)
                return callback(err, 0, 1);
              bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
              msgLength = parseInt(msgLength);
              var msg = sliceBuffer(bufferTail, 0, msgLength);
              if (isString) {
                try {
                  msg = String.fromCharCode.apply(null, new Uint8Array(msg));
                } catch (e) {
                  var typed = new Uint8Array(msg);
                  msg = '';
                  for (var i = 0; i < typed.length; i++) {
                    msg += String.fromCharCode(typed[i]);
                  }
                }
              }
              buffers.push(msg);
              bufferTail = sliceBuffer(bufferTail, msgLength);
            }
            var total = buffers.length;
            buffers.forEach(function(buffer, i) {
              callback(exports.decodePacket(buffer, binaryType, true), i, total);
            });
          };
        }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {
        "./keys": 18,
        "after": 19,
        "arraybuffer.slice": 20,
        "base64-arraybuffer": 21,
        "blob": 11,
        "has-binary": 22,
        "utf8": 24
      }],
      18: [function(_dereq_, module, exports) {
        module.exports = Object.keys || function keys(obj) {
          var arr = [];
          var has = Object.prototype.hasOwnProperty;
          for (var i in obj) {
            if (has.call(obj, i)) {
              arr.push(i);
            }
          }
          return arr;
        };
      }, {}],
      19: [function(_dereq_, module, exports) {
        module.exports = after;
        function after(count, callback, err_cb) {
          var bail = false;
          err_cb = err_cb || noop;
          proxy.count = count;
          return (count === 0) ? callback() : proxy;
          function proxy(err, result) {
            if (proxy.count <= 0) {
              throw new Error('after called too many times');
            }
            --proxy.count;
            if (err) {
              bail = true;
              callback(err);
              callback = err_cb;
            } else if (proxy.count === 0 && !bail) {
              callback(null, result);
            }
          }
        }
        function noop() {}
      }, {}],
      20: [function(_dereq_, module, exports) {
        module.exports = function(arraybuffer, start, end) {
          var bytes = arraybuffer.byteLength;
          start = start || 0;
          end = end || bytes;
          if (arraybuffer.slice) {
            return arraybuffer.slice(start, end);
          }
          if (start < 0) {
            start += bytes;
          }
          if (end < 0) {
            end += bytes;
          }
          if (end > bytes) {
            end = bytes;
          }
          if (start >= bytes || start >= end || bytes === 0) {
            return new ArrayBuffer(0);
          }
          var abv = new Uint8Array(arraybuffer);
          var result = new Uint8Array(end - start);
          for (var i = start,
              ii = 0; i < end; i++, ii++) {
            result[ii] = abv[i];
          }
          return result.buffer;
        };
      }, {}],
      21: [function(_dereq_, module, exports) {
        (function(chars) {
          "use strict";
          exports.encode = function(arraybuffer) {
            var bytes = new Uint8Array(arraybuffer),
                i,
                len = bytes.length,
                base64 = "";
            for (i = 0; i < len; i += 3) {
              base64 += chars[bytes[i] >> 2];
              base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
              base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
              base64 += chars[bytes[i + 2] & 63];
            }
            if ((len % 3) === 2) {
              base64 = base64.substring(0, base64.length - 1) + "=";
            } else if (len % 3 === 1) {
              base64 = base64.substring(0, base64.length - 2) + "==";
            }
            return base64;
          };
          exports.decode = function(base64) {
            var bufferLength = base64.length * 0.75,
                len = base64.length,
                i,
                p = 0,
                encoded1,
                encoded2,
                encoded3,
                encoded4;
            if (base64[base64.length - 1] === "=") {
              bufferLength--;
              if (base64[base64.length - 2] === "=") {
                bufferLength--;
              }
            }
            var arraybuffer = new ArrayBuffer(bufferLength),
                bytes = new Uint8Array(arraybuffer);
            for (i = 0; i < len; i += 4) {
              encoded1 = chars.indexOf(base64[i]);
              encoded2 = chars.indexOf(base64[i + 1]);
              encoded3 = chars.indexOf(base64[i + 2]);
              encoded4 = chars.indexOf(base64[i + 3]);
              bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
              bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
              bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
            }
            return arraybuffer;
          };
        })("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
      }, {}],
      22: [function(_dereq_, module, exports) {
        (function(global) {
          var isArray = _dereq_('isarray');
          module.exports = hasBinary;
          function hasBinary(data) {
            function _hasBinary(obj) {
              if (!obj)
                return false;
              if ((global.Buffer && global.Buffer.isBuffer(obj)) || (global.ArrayBuffer && obj instanceof ArrayBuffer) || (global.Blob && obj instanceof Blob) || (global.File && obj instanceof File)) {
                return true;
              }
              if (isArray(obj)) {
                for (var i = 0; i < obj.length; i++) {
                  if (_hasBinary(obj[i])) {
                    return true;
                  }
                }
              } else if (obj && 'object' == typeof obj) {
                if (obj.toJSON) {
                  obj = obj.toJSON();
                }
                for (var key in obj) {
                  if (obj.hasOwnProperty(key) && _hasBinary(obj[key])) {
                    return true;
                  }
                }
              }
              return false;
            }
            return _hasBinary(data);
          }
        }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {"isarray": 23}],
      23: [function(_dereq_, module, exports) {
        module.exports = Array.isArray || function(arr) {
          return Object.prototype.toString.call(arr) == '[object Array]';
        };
      }, {}],
      24: [function(_dereq_, module, exports) {
        (function(global) {
          ;
          (function(root) {
            var freeExports = typeof exports == 'object' && exports;
            var freeModule = typeof module == 'object' && module && module.exports == freeExports && module;
            var freeGlobal = typeof global == 'object' && global;
            if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
              root = freeGlobal;
            }
            var stringFromCharCode = String.fromCharCode;
            function ucs2decode(string) {
              var output = [];
              var counter = 0;
              var length = string.length;
              var value;
              var extra;
              while (counter < length) {
                value = string.charCodeAt(counter++);
                if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                  extra = string.charCodeAt(counter++);
                  if ((extra & 0xFC00) == 0xDC00) {
                    output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                  } else {
                    output.push(value);
                    counter--;
                  }
                } else {
                  output.push(value);
                }
              }
              return output;
            }
            function ucs2encode(array) {
              var length = array.length;
              var index = -1;
              var value;
              var output = '';
              while (++index < length) {
                value = array[index];
                if (value > 0xFFFF) {
                  value -= 0x10000;
                  output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
                  value = 0xDC00 | value & 0x3FF;
                }
                output += stringFromCharCode(value);
              }
              return output;
            }
            function createByte(codePoint, shift) {
              return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
            }
            function encodeCodePoint(codePoint) {
              if ((codePoint & 0xFFFFFF80) == 0) {
                return stringFromCharCode(codePoint);
              }
              var symbol = '';
              if ((codePoint & 0xFFFFF800) == 0) {
                symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
              } else if ((codePoint & 0xFFFF0000) == 0) {
                symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
                symbol += createByte(codePoint, 6);
              } else if ((codePoint & 0xFFE00000) == 0) {
                symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
                symbol += createByte(codePoint, 12);
                symbol += createByte(codePoint, 6);
              }
              symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
              return symbol;
            }
            function utf8encode(string) {
              var codePoints = ucs2decode(string);
              var length = codePoints.length;
              var index = -1;
              var codePoint;
              var byteString = '';
              while (++index < length) {
                codePoint = codePoints[index];
                byteString += encodeCodePoint(codePoint);
              }
              return byteString;
            }
            function readContinuationByte() {
              if (byteIndex >= byteCount) {
                throw Error('Invalid byte index');
              }
              var continuationByte = byteArray[byteIndex] & 0xFF;
              byteIndex++;
              if ((continuationByte & 0xC0) == 0x80) {
                return continuationByte & 0x3F;
              }
              throw Error('Invalid continuation byte');
            }
            function decodeSymbol() {
              var byte1;
              var byte2;
              var byte3;
              var byte4;
              var codePoint;
              if (byteIndex > byteCount) {
                throw Error('Invalid byte index');
              }
              if (byteIndex == byteCount) {
                return false;
              }
              byte1 = byteArray[byteIndex] & 0xFF;
              byteIndex++;
              if ((byte1 & 0x80) == 0) {
                return byte1;
              }
              if ((byte1 & 0xE0) == 0xC0) {
                var byte2 = readContinuationByte();
                codePoint = ((byte1 & 0x1F) << 6) | byte2;
                if (codePoint >= 0x80) {
                  return codePoint;
                } else {
                  throw Error('Invalid continuation byte');
                }
              }
              if ((byte1 & 0xF0) == 0xE0) {
                byte2 = readContinuationByte();
                byte3 = readContinuationByte();
                codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
                if (codePoint >= 0x0800) {
                  return codePoint;
                } else {
                  throw Error('Invalid continuation byte');
                }
              }
              if ((byte1 & 0xF8) == 0xF0) {
                byte2 = readContinuationByte();
                byte3 = readContinuationByte();
                byte4 = readContinuationByte();
                codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) | (byte3 << 0x06) | byte4;
                if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
                  return codePoint;
                }
              }
              throw Error('Invalid UTF-8 detected');
            }
            var byteArray;
            var byteCount;
            var byteIndex;
            function utf8decode(byteString) {
              byteArray = ucs2decode(byteString);
              byteCount = byteArray.length;
              byteIndex = 0;
              var codePoints = [];
              var tmp;
              while ((tmp = decodeSymbol()) !== false) {
                codePoints.push(tmp);
              }
              return ucs2encode(codePoints);
            }
            var utf8 = {
              'version': '2.0.0',
              'encode': utf8encode,
              'decode': utf8decode
            };
            if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
              define(function() {
                return utf8;
              });
            } else if (freeExports && !freeExports.nodeType) {
              if (freeModule) {
                freeModule.exports = utf8;
              } else {
                var object = {};
                var hasOwnProperty = object.hasOwnProperty;
                for (var key in utf8) {
                  hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
                }
              }
            } else {
              root.utf8 = utf8;
            }
          }(this));
        }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {}],
      25: [function(_dereq_, module, exports) {
        var global = _dereq_('global');
        try {
          module.exports = 'XMLHttpRequest' in global && 'withCredentials' in new global.XMLHttpRequest();
        } catch (err) {
          module.exports = false;
        }
      }, {"global": 26}],
      26: [function(_dereq_, module, exports) {
        module.exports = (function() {
          return this;
        })();
      }, {}],
      27: [function(_dereq_, module, exports) {
        var indexOf = [].indexOf;
        module.exports = function(arr, obj) {
          if (indexOf)
            return arr.indexOf(obj);
          for (var i = 0; i < arr.length; ++i) {
            if (arr[i] === obj)
              return i;
          }
          return -1;
        };
      }, {}],
      28: [function(_dereq_, module, exports) {
        (function(global) {
          var rvalidchars = /^[\],:{}\s]*$/;
          var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
          var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
          var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
          var rtrimLeft = /^\s+/;
          var rtrimRight = /\s+$/;
          module.exports = function parsejson(data) {
            if ('string' != typeof data || !data) {
              return null;
            }
            data = data.replace(rtrimLeft, '').replace(rtrimRight, '');
            if (global.JSON && JSON.parse) {
              return JSON.parse(data);
            }
            if (rvalidchars.test(data.replace(rvalidescape, '@').replace(rvalidtokens, ']').replace(rvalidbraces, ''))) {
              return (new Function('return ' + data))();
            }
          };
        }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {}],
      29: [function(_dereq_, module, exports) {
        exports.encode = function(obj) {
          var str = '';
          for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
              if (str.length)
                str += '&';
              str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
            }
          }
          return str;
        };
        exports.decode = function(qs) {
          var qry = {};
          var pairs = qs.split('&');
          for (var i = 0,
              l = pairs.length; i < l; i++) {
            var pair = pairs[i].split('=');
            qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
          }
          return qry;
        };
      }, {}],
      30: [function(_dereq_, module, exports) {
        var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
        var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];
        module.exports = function parseuri(str) {
          var src = str,
              b = str.indexOf('['),
              e = str.indexOf(']');
          if (b != -1 && e != -1) {
            str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
          }
          var m = re.exec(str || ''),
              uri = {},
              i = 14;
          while (i--) {
            uri[parts[i]] = m[i] || '';
          }
          if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
            uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
            uri.ipv6uri = true;
          }
          return uri;
        };
      }, {}],
      31: [function(_dereq_, module, exports) {
        var global = (function() {
          return this;
        })();
        var WebSocket = global.WebSocket || global.MozWebSocket;
        module.exports = WebSocket ? ws : null;
        function ws(uri, protocols, opts) {
          var instance;
          if (protocols) {
            instance = new WebSocket(uri, protocols);
          } else {
            instance = new WebSocket(uri);
          }
          return instance;
        }
        if (WebSocket)
          ws.prototype = WebSocket.prototype;
      }, {}]
    }, {}, [1])(1);
  });
})(require('buffer').Buffer);
