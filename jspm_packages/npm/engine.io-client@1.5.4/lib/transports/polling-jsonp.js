/* */ 
var Polling = require('./polling');
var inherit = require('component-inherit');
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
