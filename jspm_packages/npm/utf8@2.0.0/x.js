/* */ 
var utf8 = require('./utf8');
var stringEscape = require('string-escape');
utf8.encode('\xA9');
var obj = {
  'description': 'Low surrogate followed by another low surrogate',
  'decoded': '\xA9',
  'encoded': '\xED\xB0\x80'
};
actual = utf8.encode(obj.decoded);
expected = obj.encoded;
if (actual != expected) {
  console.log('fail\n', 'actual  ', stringEscape(actual), '\n', 'expected', stringEscape(expected));
} else {
  console.log('encoding successsssss');
}
