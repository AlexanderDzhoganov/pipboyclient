/* */ 
"format cjs";
(function(process) {
  ;
  (function(window, undefined) {
    'use strict';
    var counter = 0;
    var doc = isHostType(window, 'document') && document;
    var freeDefine = typeof define == 'function' && typeof define.amd == 'object' && define.amd && define;
    var freeExports = typeof exports == 'object' && exports && (typeof global == 'object' && global && global == global.global && (window = global), exports);
    var freeRequire = typeof require == 'function' && require;
    var getAllKeys = Object.getOwnPropertyNames;
    var getDescriptor = Object.getOwnPropertyDescriptor;
    var hasOwnProperty = {}.hasOwnProperty;
    var isExtensible = Object.isExtensible || function() {
      return true;
    };
    var microtimeObject = req('microtime');
    var perfObject = isHostType(window, 'performance') && performance;
    var perfName = perfObject && (perfObject.now && 'now' || perfObject.webkitNow && 'webkitNow');
    var processObject = isHostType(window, 'process') && process;
    var propertyIsEnumerable = {}.propertyIsEnumerable;
    var setDescriptor = Object.defineProperty;
    var toString = {}.toString;
    var trash = doc && doc.createElement('div');
    var uid = 'uid' + (+new Date);
    var calledBy = {};
    var divisors = {
      '1': 4096,
      '2': 512,
      '3': 64,
      '4': 8,
      '5': 0
    };
    var tTable = {
      '1': 12.706,
      '2': 4.303,
      '3': 3.182,
      '4': 2.776,
      '5': 2.571,
      '6': 2.447,
      '7': 2.365,
      '8': 2.306,
      '9': 2.262,
      '10': 2.228,
      '11': 2.201,
      '12': 2.179,
      '13': 2.16,
      '14': 2.145,
      '15': 2.131,
      '16': 2.12,
      '17': 2.11,
      '18': 2.101,
      '19': 2.093,
      '20': 2.086,
      '21': 2.08,
      '22': 2.074,
      '23': 2.069,
      '24': 2.064,
      '25': 2.06,
      '26': 2.056,
      '27': 2.052,
      '28': 2.048,
      '29': 2.045,
      '30': 2.042,
      'infinity': 1.96
    };
    var uTable = {
      '5': [0, 1, 2],
      '6': [1, 2, 3, 5],
      '7': [1, 3, 5, 6, 8],
      '8': [2, 4, 6, 8, 10, 13],
      '9': [2, 4, 7, 10, 12, 15, 17],
      '10': [3, 5, 8, 11, 14, 17, 20, 23],
      '11': [3, 6, 9, 13, 16, 19, 23, 26, 30],
      '12': [4, 7, 11, 14, 18, 22, 26, 29, 33, 37],
      '13': [4, 8, 12, 16, 20, 24, 28, 33, 37, 41, 45],
      '14': [5, 9, 13, 17, 22, 26, 31, 36, 40, 45, 50, 55],
      '15': [5, 10, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59, 64],
      '16': [6, 11, 15, 21, 26, 31, 37, 42, 47, 53, 59, 64, 70, 75],
      '17': [6, 11, 17, 22, 28, 34, 39, 45, 51, 57, 63, 67, 75, 81, 87],
      '18': [7, 12, 18, 24, 30, 36, 42, 48, 55, 61, 67, 74, 80, 86, 93, 99],
      '19': [7, 13, 19, 25, 32, 38, 45, 52, 58, 65, 72, 78, 85, 92, 99, 106, 113],
      '20': [8, 14, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 90, 98, 105, 112, 119, 127],
      '21': [8, 15, 22, 29, 36, 43, 50, 58, 65, 73, 80, 88, 96, 103, 111, 119, 126, 134, 142],
      '22': [9, 16, 23, 30, 38, 45, 53, 61, 69, 77, 85, 93, 101, 109, 117, 125, 133, 141, 150, 158],
      '23': [9, 17, 24, 32, 40, 48, 56, 64, 73, 81, 89, 98, 106, 115, 123, 132, 140, 149, 157, 166, 175],
      '24': [10, 17, 25, 33, 42, 50, 59, 67, 76, 85, 94, 102, 111, 120, 129, 138, 147, 156, 165, 174, 183, 192],
      '25': [10, 18, 27, 35, 44, 53, 62, 71, 80, 89, 98, 107, 117, 126, 135, 145, 154, 163, 173, 182, 192, 201, 211],
      '26': [11, 19, 28, 37, 46, 55, 64, 74, 83, 93, 102, 112, 122, 132, 141, 151, 161, 171, 181, 191, 200, 210, 220, 230],
      '27': [11, 20, 29, 38, 48, 57, 67, 77, 87, 97, 107, 118, 125, 138, 147, 158, 168, 178, 188, 199, 209, 219, 230, 240, 250],
      '28': [12, 21, 30, 40, 50, 60, 70, 80, 90, 101, 111, 122, 132, 143, 154, 164, 175, 186, 196, 207, 218, 228, 239, 250, 261, 272],
      '29': [13, 22, 32, 42, 52, 62, 73, 83, 94, 105, 116, 127, 138, 149, 160, 171, 182, 193, 204, 215, 226, 238, 249, 260, 271, 282, 294],
      '30': [13, 23, 33, 43, 54, 65, 76, 87, 98, 109, 120, 131, 143, 154, 166, 177, 189, 200, 212, 223, 235, 247, 258, 270, 282, 293, 305, 317]
    };
    var support = {};
    (function() {
      support.air = isClassOf(window.runtime, 'ScriptBridgingProxyObject');
      support.argumentsClass = isClassOf(arguments, 'Arguments');
      support.browser = doc && isHostType(window, 'navigator');
      support.charByIndex = ('x'[0] + Object('x')[0]) == 'xx';
      support.charByOwnIndex = support.charByIndex && hasKey('x', '0');
      support.java = isClassOf(window.java, 'JavaPackage');
      support.timeout = isHostType(window, 'setTimeout') && isHostType(window, 'clearTimeout');
      try {
        support.decompilation = Function('return (' + (function(x) {
          return {
            'x': '' + (1 + x) + '',
            'y': 0
          };
        }) + ')')()(0).x === '1';
      } catch (e) {
        support.decompilation = false;
      }
      try {
        var o = {};
        support.descriptors = (setDescriptor(o, o, o), 'value' in getDescriptor(o, o));
      } catch (e) {
        support.descriptors = false;
      }
      try {
        support.getAllKeys = /\bvalueOf\b/.test(getAllKeys(Object.prototype));
      } catch (e) {
        support.getAllKeys = false;
      }
      support.iteratesOwnFirst = (function() {
        var props = [];
        function ctor() {
          this.x = 1;
        }
        ctor.prototype = {'y': 1};
        for (var prop in new ctor) {
          props.push(prop);
        }
        return props[0] == 'x';
      }());
      try {
        support.nodeClass = ({'toString': 0} + '', toString.call(doc || 0) != '[object Object]');
      } catch (e) {
        support.nodeClass = true;
      }
    }());
    var timer = {
      'ns': Date,
      'start': null,
      'stop': null
    };
    var noArgumentsClass = !support.argumentsClass,
        noCharByIndex = !support.charByIndex,
        noCharByOwnIndex = !support.charByOwnIndex;
    var abs = Math.abs,
        floor = Math.floor,
        max = Math.max,
        min = Math.min,
        pow = Math.pow,
        sqrt = Math.sqrt;
    function Benchmark(name, fn, options) {
      var me = this;
      if (me == null || me.constructor != Benchmark) {
        return new Benchmark(name, fn, options);
      }
      if (isClassOf(name, 'Object')) {
        options = name;
      } else if (isClassOf(name, 'Function')) {
        options = fn;
        fn = name;
      } else if (isClassOf(fn, 'Object')) {
        options = fn;
        fn = null;
        me.name = name;
      } else {
        me.name = name;
      }
      setOptions(me, options);
      me.id || (me.id = ++counter);
      me.fn == null && (me.fn = fn);
      me.stats = deepClone(me.stats);
      me.times = deepClone(me.times);
    }
    function Deferred(clone) {
      var me = this;
      if (me == null || me.constructor != Deferred) {
        return new Deferred(clone);
      }
      me.benchmark = clone;
      clock(me);
    }
    function Event(type) {
      var me = this;
      return (me == null || me.constructor != Event) ? new Event(type) : (type instanceof Event) ? type : extend(me, {'timeStamp': +new Date}, typeof type == 'string' ? {'type': type} : type);
    }
    function Suite(name, options) {
      var me = this;
      if (me == null || me.constructor != Suite) {
        return new Suite(name, options);
      }
      if (isClassOf(name, 'Object')) {
        options = name;
      } else {
        me.name = name;
      }
      setOptions(me, options);
    }
    function concat() {
      var value,
          j = -1,
          length = arguments.length,
          result = slice.call(this),
          index = result.length;
      while (++j < length) {
        value = arguments[j];
        if (isClassOf(value, 'Array')) {
          for (var k = 0,
              l = value.length; k < l; k++, index++) {
            if (k in value) {
              result[index] = value[k];
            }
          }
        } else {
          result[index++] = value;
        }
      }
      return result;
    }
    function insert(start, deleteCount, elements) {
      var deleteEnd = start + deleteCount,
          elementCount = elements ? elements.length : 0,
          index = start - 1,
          length = start + elementCount,
          object = this,
          result = Array(deleteCount),
          tail = slice.call(object, deleteEnd);
      while (++index < deleteEnd) {
        if (index in object) {
          result[index - start] = object[index];
          delete object[index];
        }
      }
      index = start - 1;
      while (++index < length) {
        object[index] = elements[index - start];
      }
      start = index--;
      length = max(0, (object.length >>> 0) - deleteCount + elementCount);
      while (++index < length) {
        if ((index - start) in tail) {
          object[index] = tail[index - start];
        } else if (index in object) {
          delete object[index];
        }
      }
      deleteCount = deleteCount > elementCount ? deleteCount - elementCount : 0;
      while (deleteCount--) {
        index = length + deleteCount;
        if (index in object) {
          delete object[index];
        }
      }
      object.length = length;
      return result;
    }
    function reverse() {
      var upperIndex,
          value,
          index = -1,
          object = Object(this),
          length = object.length >>> 0,
          middle = floor(length / 2);
      if (length > 1) {
        while (++index < middle) {
          upperIndex = length - index - 1;
          value = upperIndex in object ? object[upperIndex] : uid;
          if (index in object) {
            object[upperIndex] = object[index];
          } else {
            delete object[upperIndex];
          }
          if (value != uid) {
            object[index] = value;
          } else {
            delete object[index];
          }
        }
      }
      return object;
    }
    function shift() {
      return insert.call(this, 0, 1)[0];
    }
    function slice(start, end) {
      var index = -1,
          object = Object(this),
          length = object.length >>> 0,
          result = [];
      start = toInteger(start);
      start = start < 0 ? max(length + start, 0) : min(start, length);
      start--;
      end = end == null ? length : toInteger(end);
      end = end < 0 ? max(length + end, 0) : min(end, length);
      while ((++index, ++start) < end) {
        if (start in object) {
          result[index] = object[start];
        }
      }
      return result;
    }
    function splice(start, deleteCount) {
      var object = Object(this),
          length = object.length >>> 0;
      start = toInteger(start);
      start = start < 0 ? max(length + start, 0) : min(start, length);
      deleteCount = arguments.length == 1 ? length - start : min(max(toInteger(deleteCount), 0), length - start);
      return insert.call(object, start, deleteCount, slice.call(arguments, 2));
    }
    function toInteger(value) {
      value = +value;
      return value === 0 || !isFinite(value) ? value || 0 : value - (value % 1);
    }
    function unshift() {
      var object = Object(this);
      insert.call(object, 0, 0, arguments);
      return object.length;
    }
    function bind(fn, thisArg) {
      return function() {
        fn.apply(thisArg, arguments);
      };
    }
    function createFunction() {
      createFunction = function(args, body) {
        var result,
            anchor = freeDefine ? define.amd : Benchmark,
            prop = uid + 'createFunction';
        runScript((freeDefine ? 'define.amd.' : 'Benchmark.') + prop + '=function(' + args + '){' + body + '}');
        result = anchor[prop];
        delete anchor[prop];
        return result;
      };
      createFunction = support.browser && (createFunction('', 'return"' + uid + '"') || noop)() == uid ? createFunction : Function;
      return createFunction.apply(null, arguments);
    }
    function delay(bench, fn) {
      bench._timerId = setTimeout(fn, bench.delay * 1e3);
    }
    function destroyElement(element) {
      trash.appendChild(element);
      trash.innerHTML = '';
    }
    function forProps() {
      var forShadowed,
          skipSeen,
          forArgs = true,
          shadowed = ['constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf'];
      (function(enumFlag, key) {
        function Klass() {
          this.valueOf = 0;
        }
        ;
        Klass.prototype.valueOf = 0;
        for (key in new Klass) {
          enumFlag += key == 'valueOf' ? 1 : 0;
        }
        for (key in arguments) {
          key == '0' && (forArgs = false);
        }
        skipSeen = enumFlag == 2;
        forShadowed = !enumFlag;
      }(0));
      forProps = function(object, callback, options) {
        options || (options = {});
        var result = object;
        object = Object(object);
        var ctor,
            key,
            keys,
            skipCtor,
            done = !result,
            which = options.which,
            allFlag = which == 'all',
            index = -1,
            iteratee = object,
            length = object.length,
            ownFlag = allFlag || which == 'own',
            seen = {},
            skipProto = isClassOf(object, 'Function'),
            thisArg = options.bind;
        if (thisArg !== undefined) {
          callback = bind(callback, thisArg);
        }
        if (allFlag && support.getAllKeys) {
          for (index = 0, keys = getAllKeys(object), length = keys.length; index < length; index++) {
            key = keys[index];
            if (callback(object[key], key, object) === false) {
              break;
            }
          }
        } else {
          for (key in object) {
            if ((done = !(skipProto && key == 'prototype') && !(skipSeen && (hasKey(seen, key) || !(seen[key] = true))) && (!ownFlag || ownFlag && hasKey(object, key)) && callback(object[key], key, object) === false)) {
              break;
            }
          }
          if (!done && (forArgs && isArguments(object) || ((noCharByIndex || noCharByOwnIndex) && isClassOf(object, 'String') && (iteratee = noCharByIndex ? object.split('') : object)))) {
            while (++index < length) {
              if ((done = callback(iteratee[index], String(index), object) === false)) {
                break;
              }
            }
          }
          if (!done && forShadowed) {
            ctor = object.constructor;
            skipCtor = ctor && ctor.prototype && ctor.prototype.constructor === ctor;
            for (index = 0; index < 7; index++) {
              key = shadowed[index];
              if (!(skipCtor && key == 'constructor') && hasKey(object, key) && callback(object[key], key, object) === false) {
                break;
              }
            }
          }
        }
        return result;
      };
      return forProps.apply(null, arguments);
    }
    function getFirstArgument(fn) {
      return (!hasKey(fn, 'toString') && (/^[\s(]*function[^(]*\(([^\s,)]+)/.exec(fn) || 0)[1]) || '';
    }
    function getMean(sample) {
      return reduce(sample, function(sum, x) {
        return sum + x;
      }) / sample.length || 0;
    }
    function getSource(fn, altSource) {
      var result = altSource;
      if (isStringable(fn)) {
        result = String(fn);
      } else if (support.decompilation) {
        result = (/^[^{]+\{([\s\S]*)}\s*$/.exec(fn) || 0)[1];
      }
      result = (result || '').replace(/^\s+|\s+$/g, '');
      return /^(?:\/\*+[\w|\W]*?\*\/|\/\/.*?[\n\r\u2028\u2029]|\s)*(["'])use strict\1;?$/.test(result) ? '' : result;
    }
    function isArguments() {
      isArguments = function(value) {
        return toString.call(value) == '[object Arguments]';
      };
      if (noArgumentsClass) {
        isArguments = function(value) {
          return hasKey(value, 'callee') && !(propertyIsEnumerable && propertyIsEnumerable.call(value, 'callee'));
        };
      }
      return isArguments(arguments[0]);
    }
    function isClassOf(value, name) {
      return value != null && toString.call(value) == '[object ' + name + ']';
    }
    function isHostType(object, property) {
      var type = object != null ? typeof object[property] : 'number';
      return !/^(?:boolean|number|string|undefined)$/.test(type) && (type == 'object' ? !!object[property] : true);
    }
    function isPlainObject(value) {
      var result = false;
      if (!(value && typeof value == 'object') || (noArgumentsClass && isArguments(value))) {
        return result;
      }
      var ctor = value.constructor;
      if ((support.nodeClass || !(typeof value.toString != 'function' && typeof(value + '') == 'string')) && (!isClassOf(ctor, 'Function') || ctor instanceof ctor)) {
        if (support.iteratesOwnFirst) {
          forProps(value, function(subValue, subKey) {
            result = subKey;
          });
          return result === false || hasKey(value, result);
        }
        forProps(value, function(subValue, subKey) {
          result = !hasKey(value, subKey);
          return false;
        });
        return result === false;
      }
      return result;
    }
    function isStringable(value) {
      return hasKey(value, 'toString') || isClassOf(value, 'String');
    }
    function methodize(fn) {
      return function() {
        var args = [this];
        args.push.apply(args, arguments);
        return fn.apply(null, args);
      };
    }
    function noop() {}
    function req(id) {
      try {
        var result = freeExports && freeRequire(id);
      } catch (e) {}
      return result || null;
    }
    function runScript(code) {
      var anchor = freeDefine ? define.amd : Benchmark,
          script = doc.createElement('script'),
          sibling = doc.getElementsByTagName('script')[0],
          parent = sibling.parentNode,
          prop = uid + 'runScript',
          prefix = '(' + (freeDefine ? 'define.amd.' : 'Benchmark.') + prop + '||function(){})();';
      try {
        script.appendChild(doc.createTextNode(prefix + code));
        anchor[prop] = function() {
          destroyElement(script);
        };
      } catch (e) {
        parent = parent.cloneNode(false);
        sibling = null;
        script.text = code;
      }
      parent.insertBefore(script, sibling);
      delete anchor[prop];
    }
    function setOptions(bench, options) {
      options = extend({}, bench.constructor.options, options);
      bench.options = forOwn(options, function(value, key) {
        if (value != null) {
          if (/^on[A-Z]/.test(key)) {
            forEach(key.split(' '), function(key) {
              bench.on(key.slice(2).toLowerCase(), value);
            });
          } else if (!hasKey(bench, key)) {
            bench[key] = deepClone(value);
          }
        }
      });
    }
    function resolve() {
      var me = this,
          clone = me.benchmark,
          bench = clone._original;
      if (bench.aborted) {
        me.teardown();
        clone.running = false;
        cycle(me);
      } else if (++me.cycles < clone.count) {
        if (support.timeout) {
          setTimeout(function() {
            clone.compiled.call(me, timer);
          }, 0);
        } else {
          clone.compiled.call(me, timer);
        }
      } else {
        timer.stop(me);
        me.teardown();
        delay(clone, function() {
          cycle(me);
        });
      }
    }
    function deepClone(value) {
      var accessor,
          circular,
          clone,
          ctor,
          descriptor,
          extensible,
          key,
          length,
          markerKey,
          parent,
          result,
          source,
          subIndex,
          data = {'value': value},
          index = 0,
          marked = [],
          queue = {'length': 0},
          unmarked = [];
      function Marker(object) {
        this.raw = object;
      }
      function forPropsCallback(subValue, subKey) {
        if (subValue && subValue.constructor == Marker) {
          return;
        }
        if (subValue === Object(subValue)) {
          queue[queue.length++] = {
            'key': subKey,
            'parent': clone,
            'source': value
          };
        } else {
          try {
            clone[subKey] = subValue;
          } catch (e) {}
        }
      }
      function getMarkerKey(object) {
        var result = uid;
        while (object[result] && object[result].constructor != Marker) {
          result += 1;
        }
        return result;
      }
      do {
        key = data.key;
        parent = data.parent;
        source = data.source;
        clone = value = source ? source[key] : data.value;
        accessor = circular = descriptor = false;
        if (value === Object(value)) {
          if (isClassOf(value.deepClone, 'Function')) {
            clone = value.deepClone();
          } else {
            ctor = value.constructor;
            switch (toString.call(value)) {
              case '[object Array]':
                clone = new ctor(value.length);
                break;
              case '[object Boolean]':
                clone = new ctor(value == true);
                break;
              case '[object Date]':
                clone = new ctor(+value);
                break;
              case '[object Object]':
                isPlainObject(value) && (clone = {});
                break;
              case '[object Number]':
              case '[object String]':
                clone = new ctor(value);
                break;
              case '[object RegExp]':
                clone = ctor(value.source, (value.global ? 'g' : '') + (value.ignoreCase ? 'i' : '') + (value.multiline ? 'm' : ''));
            }
          }
          if (clone && clone != value && !(descriptor = source && support.descriptors && getDescriptor(source, key), accessor = descriptor && (descriptor.get || descriptor.set))) {
            if ((extensible = isExtensible(value))) {
              markerKey = getMarkerKey(value);
              if (value[markerKey]) {
                circular = clone = value[markerKey].raw;
              }
            } else {
              for (subIndex = 0, length = unmarked.length; subIndex < length; subIndex++) {
                data = unmarked[subIndex];
                if (data.object === value) {
                  circular = clone = data.clone;
                  break;
                }
              }
            }
            if (!circular) {
              if (extensible) {
                value[markerKey] = new Marker(clone);
                marked.push({
                  'key': markerKey,
                  'object': value
                });
              } else {
                unmarked.push({
                  'clone': clone,
                  'object': value
                });
              }
              forProps(value, forPropsCallback, {'which': 'all'});
            }
          }
        }
        if (parent) {
          if (accessor || (descriptor && !(descriptor.configurable && descriptor.enumerable && descriptor.writable))) {
            if ('value' in descriptor) {
              descriptor.value = clone;
            }
            setDescriptor(parent, key, descriptor);
          } else {
            parent[key] = clone;
          }
        } else {
          result = clone;
        }
      } while ((data = queue[index++]));
      for (index = 0, length = marked.length; index < length; index++) {
        data = marked[index];
        delete data.object[data.key];
      }
      return result;
    }
    function each(object, callback, thisArg) {
      var result = object;
      object = Object(object);
      var fn = callback,
          index = -1,
          length = object.length,
          isSnapshot = !!(object.snapshotItem && (length = object.snapshotLength)),
          isSplittable = (noCharByIndex || noCharByOwnIndex) && isClassOf(object, 'String'),
          isConvertable = isSnapshot || isSplittable || 'item' in object,
          origObject = object;
      if (length === length >>> 0) {
        if (isConvertable) {
          callback = function(value, index) {
            return fn.call(this, value, index, origObject);
          };
          if (isSplittable) {
            object = object.split('');
          } else {
            object = [];
            while (++index < length) {
              object[index] = isSnapshot ? result.snapshotItem(index) : result[index];
            }
          }
        }
        forEach(object, callback, thisArg);
      } else {
        forOwn(object, callback, thisArg);
      }
      return result;
    }
    function extend(destination, source) {
      var result = destination;
      delete arguments[0];
      forEach(arguments, function(source) {
        forProps(source, function(value, key) {
          result[key] = value;
        });
      });
      return result;
    }
    function filter(array, callback, thisArg) {
      var result;
      if (callback == 'successful') {
        callback = function(bench) {
          return bench.cycles && isFinite(bench.hz);
        };
      } else if (callback == 'fastest' || callback == 'slowest') {
        result = filter(array, 'successful').sort(function(a, b) {
          a = a.stats;
          b = b.stats;
          return (a.mean + a.moe > b.mean + b.moe ? 1 : -1) * (callback == 'fastest' ? 1 : -1);
        });
        result = filter(result, function(bench) {
          return result[0].compare(bench) == 0;
        });
      }
      return result || reduce(array, function(result, value, index) {
        return callback.call(thisArg, value, index, array) ? (result.push(value), result) : result;
      }, []);
    }
    function forEach(array, callback, thisArg) {
      var index = -1,
          length = (array = Object(array)).length >>> 0;
      if (thisArg !== undefined) {
        callback = bind(callback, thisArg);
      }
      while (++index < length) {
        if (index in array && callback(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }
    function forOwn(object, callback, thisArg) {
      return forProps(object, callback, {
        'bind': thisArg,
        'which': 'own'
      });
    }
    function formatNumber(number) {
      number = String(number).split('.');
      return number[0].replace(/(?=(?:\d{3})+$)(?!\b)/g, ',') + (number[1] ? '.' + number[1] : '');
    }
    function hasKey() {
      hasKey = function(object, key) {
        var parent = object != null && (object.constructor || Object).prototype;
        return !!parent && key in Object(object) && !(key in parent && object[key] === parent[key]);
      };
      if (isClassOf(hasOwnProperty, 'Function')) {
        hasKey = function(object, key) {
          return object != null && hasOwnProperty.call(object, key);
        };
      } else if ({}.__proto__ == Object.prototype) {
        hasKey = function(object, key) {
          var result = false;
          if (object != null) {
            object = Object(object);
            object.__proto__ = [object.__proto__, object.__proto__ = null, result = key in object][0];
          }
          return result;
        };
      }
      return hasKey.apply(this, arguments);
    }
    function indexOf(array, value, fromIndex) {
      var index = toInteger(fromIndex),
          length = (array = Object(array)).length >>> 0;
      index = (index < 0 ? max(0, length + index) : index) - 1;
      while (++index < length) {
        if (index in array && value === array[index]) {
          return index;
        }
      }
      return -1;
    }
    function interpolate(string, object) {
      forOwn(object, function(value, key) {
        string = string.replace(RegExp('#\\{' + key.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1') + '\\}', 'g'), value);
      });
      return string;
    }
    function invoke(benches, name) {
      var args,
          bench,
          queued,
          index = -1,
          eventProps = {'currentTarget': benches},
          options = {
            'onStart': noop,
            'onCycle': noop,
            'onComplete': noop
          },
          result = map(benches, function(bench) {
            return bench;
          });
      function execute() {
        var listeners,
            async = isAsync(bench);
        if (async) {
          bench.on('complete', getNext);
          listeners = bench.events.complete;
          listeners.splice(0, 0, listeners.pop());
        }
        result[index] = isClassOf(bench && bench[name], 'Function') ? bench[name].apply(bench, args) : undefined;
        return !async && getNext();
      }
      function getNext(event) {
        var cycleEvent,
            last = bench,
            async = isAsync(last);
        if (async) {
          last.off('complete', getNext);
          last.emit('complete');
        }
        eventProps.type = 'cycle';
        eventProps.target = last;
        cycleEvent = Event(eventProps);
        options.onCycle.call(benches, cycleEvent);
        if (!cycleEvent.aborted && raiseIndex() !== false) {
          bench = queued ? benches[0] : result[index];
          if (isAsync(bench)) {
            delay(bench, execute);
          } else if (async) {
            while (execute()) {}
          } else {
            return true;
          }
        } else {
          eventProps.type = 'complete';
          options.onComplete.call(benches, Event(eventProps));
        }
        if (event) {
          event.aborted = true;
        } else {
          return false;
        }
      }
      function isAsync(object) {
        var async = args[0] && args[0].async;
        return Object(object).constructor == Benchmark && name == 'run' && ((async == null ? object.options.async : async) && support.timeout || object.defer);
      }
      function raiseIndex() {
        var length = result.length;
        if (queued) {
          do {
            ++index > 0 && shift.call(benches);
          } while ((length = benches.length) && !('0' in benches));
        } else {
          while (++index < length && !(index in result)) {}
        }
        return (queued ? length : index < length) ? index : (index = false);
      }
      if (isClassOf(name, 'String')) {
        args = slice.call(arguments, 2);
      } else {
        options = extend(options, name);
        name = options.name;
        args = isClassOf(args = 'args' in options ? options.args : [], 'Array') ? args : [args];
        queued = options.queued;
      }
      if (raiseIndex() !== false) {
        bench = result[index];
        eventProps.type = 'start';
        eventProps.target = bench;
        options.onStart.call(benches, Event(eventProps));
        if (benches.aborted && benches.constructor == Suite && name == 'run') {
          eventProps.type = 'cycle';
          options.onCycle.call(benches, Event(eventProps));
          eventProps.type = 'complete';
          options.onComplete.call(benches, Event(eventProps));
        } else {
          if (isAsync(bench)) {
            delay(bench, execute);
          } else {
            while (execute()) {}
          }
        }
      }
      return result;
    }
    function join(object, separator1, separator2) {
      var result = [],
          length = (object = Object(object)).length,
          arrayLike = length === length >>> 0;
      separator2 || (separator2 = ': ');
      each(object, function(value, key) {
        result.push(arrayLike ? value : key + separator2 + value);
      });
      return result.join(separator1 || ',');
    }
    function map(array, callback, thisArg) {
      return reduce(array, function(result, value, index) {
        result[index] = callback.call(thisArg, value, index, array);
        return result;
      }, Array(Object(array).length >>> 0));
    }
    function pluck(array, property) {
      return map(array, function(object) {
        return object == null ? undefined : object[property];
      });
    }
    function reduce(array, callback, accumulator) {
      var noaccum = arguments.length < 3;
      forEach(array, function(value, index) {
        accumulator = noaccum ? (noaccum = false, value) : callback(accumulator, value, index, array);
      });
      return accumulator;
    }
    function abortSuite() {
      var event,
          me = this,
          resetting = calledBy.resetSuite;
      if (me.running) {
        event = Event('abort');
        me.emit(event);
        if (!event.cancelled || resetting) {
          calledBy.abortSuite = true;
          me.reset();
          delete calledBy.abortSuite;
          if (!resetting) {
            me.aborted = true;
            invoke(me, 'abort');
          }
        }
      }
      return me;
    }
    function add(name, fn, options) {
      var me = this,
          bench = Benchmark(name, fn, options),
          event = Event({
            'type': 'add',
            'target': bench
          });
      if (me.emit(event), !event.cancelled) {
        me.push(bench);
      }
      return me;
    }
    function cloneSuite(options) {
      var me = this,
          result = new me.constructor(extend({}, me.options, options));
      forOwn(me, function(value, key) {
        if (!hasKey(result, key)) {
          result[key] = value && isClassOf(value.clone, 'Function') ? value.clone() : deepClone(value);
        }
      });
      return result;
    }
    function filterSuite(callback) {
      var me = this,
          result = new me.constructor;
      result.push.apply(result, filter(me, callback));
      return result;
    }
    function resetSuite() {
      var event,
          me = this,
          aborting = calledBy.abortSuite;
      if (me.running && !aborting) {
        calledBy.resetSuite = true;
        me.abort();
        delete calledBy.resetSuite;
      } else if ((me.aborted || me.running) && (me.emit(event = Event('reset')), !event.cancelled)) {
        me.running = false;
        if (!aborting) {
          invoke(me, 'reset');
        }
      }
      return me;
    }
    function runSuite(options) {
      var me = this;
      me.reset();
      me.running = true;
      options || (options = {});
      invoke(me, {
        'name': 'run',
        'args': options,
        'queued': options.queued,
        'onStart': function(event) {
          me.emit(event);
        },
        'onCycle': function(event) {
          var bench = event.target;
          if (bench.error) {
            me.emit({
              'type': 'error',
              'target': bench
            });
          }
          me.emit(event);
          event.aborted = me.aborted;
        },
        'onComplete': function(event) {
          me.running = false;
          me.emit(event);
        }
      });
      return me;
    }
    function emit(type) {
      var listeners,
          me = this,
          event = Event(type),
          events = me.events,
          args = (arguments[0] = event, arguments);
      event.currentTarget || (event.currentTarget = me);
      event.target || (event.target = me);
      delete event.result;
      if (events && (listeners = hasKey(events, event.type) && events[event.type])) {
        forEach(listeners.slice(), function(listener) {
          if ((event.result = listener.apply(me, args)) === false) {
            event.cancelled = true;
          }
          return !event.aborted;
        });
      }
      return event.result;
    }
    function listeners(type) {
      var me = this,
          events = me.events || (me.events = {});
      return hasKey(events, type) ? events[type] : (events[type] = []);
    }
    function off(type, listener) {
      var me = this,
          events = me.events;
      events && each(type ? type.split(' ') : events, function(listeners, type) {
        var index;
        if (typeof listeners == 'string') {
          type = listeners;
          listeners = hasKey(events, type) && events[type];
        }
        if (listeners) {
          if (listener) {
            index = indexOf(listeners, listener);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          } else {
            listeners.length = 0;
          }
        }
      });
      return me;
    }
    function on(type, listener) {
      var me = this,
          events = me.events || (me.events = {});
      forEach(type.split(' '), function(type) {
        (hasKey(events, type) ? events[type] : (events[type] = [])).push(listener);
      });
      return me;
    }
    function abort() {
      var event,
          me = this,
          resetting = calledBy.reset;
      if (me.running) {
        event = Event('abort');
        me.emit(event);
        if (!event.cancelled || resetting) {
          calledBy.abort = true;
          me.reset();
          delete calledBy.abort;
          if (support.timeout) {
            clearTimeout(me._timerId);
            delete me._timerId;
          }
          if (!resetting) {
            me.aborted = true;
            me.running = false;
          }
        }
      }
      return me;
    }
    function clone(options) {
      var me = this,
          result = new me.constructor(extend({}, me, options));
      result.options = extend({}, me.options, options);
      forOwn(me, function(value, key) {
        if (!hasKey(result, key)) {
          result[key] = deepClone(value);
        }
      });
      return result;
    }
    function compare(other) {
      var critical,
          zStat,
          me = this,
          sample1 = me.stats.sample,
          sample2 = other.stats.sample,
          size1 = sample1.length,
          size2 = sample2.length,
          maxSize = max(size1, size2),
          minSize = min(size1, size2),
          u1 = getU(sample1, sample2),
          u2 = getU(sample2, sample1),
          u = min(u1, u2);
      function getScore(xA, sampleB) {
        return reduce(sampleB, function(total, xB) {
          return total + (xB > xA ? 0 : xB < xA ? 1 : 0.5);
        }, 0);
      }
      function getU(sampleA, sampleB) {
        return reduce(sampleA, function(total, xA) {
          return total + getScore(xA, sampleB);
        }, 0);
      }
      function getZ(u) {
        return (u - ((size1 * size2) / 2)) / sqrt((size1 * size2 * (size1 + size2 + 1)) / 12);
      }
      if (me == other) {
        return 0;
      }
      if (size1 + size2 > 30) {
        zStat = getZ(u);
        return abs(zStat) > 1.96 ? (zStat > 0 ? -1 : 1) : 0;
      }
      critical = maxSize < 5 || minSize < 3 ? 0 : uTable[maxSize][minSize - 3];
      return u <= critical ? (u == u1 ? 1 : -1) : 0;
    }
    function reset() {
      var data,
          event,
          me = this,
          index = 0,
          changes = {'length': 0},
          queue = {'length': 0};
      if (me.running && !calledBy.abort) {
        calledBy.reset = true;
        me.abort();
        delete calledBy.reset;
      } else {
        data = {
          'destination': me,
          'source': extend({}, me.constructor.prototype, me.options)
        };
        do {
          forOwn(data.source, function(value, key) {
            var changed,
                destination = data.destination,
                currValue = destination[key];
            if (value && typeof value == 'object') {
              if (isClassOf(value, 'Array')) {
                if (!isClassOf(currValue, 'Array')) {
                  changed = currValue = [];
                }
                if (currValue.length != value.length) {
                  changed = currValue = currValue.slice(0, value.length);
                  currValue.length = value.length;
                }
              } else if (!currValue || typeof currValue != 'object') {
                changed = currValue = {};
              }
              if (changed) {
                changes[changes.length++] = {
                  'destination': destination,
                  'key': key,
                  'value': currValue
                };
              }
              queue[queue.length++] = {
                'destination': currValue,
                'source': value
              };
            } else if (value !== currValue && !(value == null || isClassOf(value, 'Function'))) {
              changes[changes.length++] = {
                'destination': destination,
                'key': key,
                'value': value
              };
            }
          });
        } while ((data = queue[index++]));
        if (changes.length && (me.emit(event = Event('reset')), !event.cancelled)) {
          forEach(changes, function(data) {
            data.destination[data.key] = data.value;
          });
        }
      }
      return me;
    }
    function toStringBench() {
      var me = this,
          error = me.error,
          hz = me.hz,
          id = me.id,
          stats = me.stats,
          size = stats.sample.length,
          pm = support.java ? '+/-' : '\xb1',
          result = me.name || (isNaN(id) ? id : '<Test #' + id + '>');
      if (error) {
        result += ': ' + join(error);
      } else {
        result += ' x ' + formatNumber(hz.toFixed(hz < 100 ? 2 : 0)) + ' ops/sec ' + pm + stats.rme.toFixed(2) + '% (' + size + ' run' + (size == 1 ? '' : 's') + ' sampled)';
      }
      return result;
    }
    function clock() {
      var applet,
          options = Benchmark.options,
          template = {
            'begin': 's$=new n$',
            'end': 'r$=(new n$-s$)/1e3',
            'uid': uid
          },
          timers = [{
            'ns': timer.ns,
            'res': max(0.0015, getRes('ms')),
            'unit': 'ms'
          }];
      clock = function(clone) {
        var deferred;
        if (clone instanceof Deferred) {
          deferred = clone;
          clone = deferred.benchmark;
        }
        var bench = clone._original,
            fn = bench.fn,
            fnArg = deferred ? getFirstArgument(fn) || 'deferred' : '',
            stringable = isStringable(fn);
        var source = {
          'setup': getSource(bench.setup, preprocess('m$.setup()')),
          'fn': getSource(fn, preprocess('m$.fn(' + fnArg + ')')),
          'fnArg': fnArg,
          'teardown': getSource(bench.teardown, preprocess('m$.teardown()'))
        };
        var count = bench.count = clone.count,
            decompilable = support.decompilation || stringable,
            id = bench.id,
            isEmpty = !(source.fn || stringable),
            name = bench.name || (typeof id == 'number' ? '<Test #' + id + '>' : id),
            ns = timer.ns,
            result = 0;
        clone.minTime = bench.minTime || (bench.minTime = bench.options.minTime = options.minTime);
        if (applet) {
          try {
            ns.nanoTime();
          } catch (e) {
            ns = timer.ns = new applet.Packages.nano;
          }
        }
        var compiled = bench.compiled = createFunction(preprocess('t$'), interpolate(preprocess(deferred ? 'var d$=this,#{fnArg}=d$,m$=d$.benchmark._original,f$=m$.fn,su$=m$.setup,td$=m$.teardown;' + 'if(!d$.cycles){' + 'd$.fn=function(){var #{fnArg}=d$;if(typeof f$=="function"){try{#{fn}\n}catch(e$){f$(d$)}}else{#{fn}\n}};' + 'd$.teardown=function(){d$.cycles=0;if(typeof td$=="function"){try{#{teardown}\n}catch(e$){td$()}}else{#{teardown}\n}};' + 'if(typeof su$=="function"){try{#{setup}\n}catch(e$){su$()}}else{#{setup}\n};' + 't$.start(d$);' + '}d$.fn();return{}' : 'var r$,s$,m$=this,f$=m$.fn,i$=m$.count,n$=t$.ns;#{setup}\n#{begin};' + 'while(i$--){#{fn}\n}#{end};#{teardown}\nreturn{elapsed:r$,uid:"#{uid}"}'), source));
        try {
          if (isEmpty) {
            throw new Error('The test "' + name + '" is empty. This may be the result of dead code removal.');
          } else if (!deferred) {
            bench.count = 1;
            compiled = (compiled.call(bench, timer) || {}).uid == uid && compiled;
            bench.count = count;
          }
        } catch (e) {
          compiled = null;
          clone.error = e || new Error(String(e));
          bench.count = count;
        }
        if (decompilable && !compiled && !deferred && !isEmpty) {
          compiled = createFunction(preprocess('t$'), interpolate(preprocess((clone.error && !stringable ? 'var r$,s$,m$=this,f$=m$.fn,i$=m$.count' : 'function f$(){#{fn}\n}var r$,s$,m$=this,i$=m$.count') + ',n$=t$.ns;#{setup}\n#{begin};m$.f$=f$;while(i$--){m$.f$()}#{end};' + 'delete m$.f$;#{teardown}\nreturn{elapsed:r$}'), source));
          try {
            bench.count = 1;
            compiled.call(bench, timer);
            bench.compiled = compiled;
            bench.count = count;
            delete clone.error;
          } catch (e) {
            bench.count = count;
            if (clone.error) {
              compiled = null;
            } else {
              bench.compiled = compiled;
              clone.error = e || new Error(String(e));
            }
          }
        }
        clone.compiled = compiled;
        if (!clone.error) {
          result = compiled.call(deferred || bench, timer).elapsed;
        }
        return result;
      };
      function getRes(unit) {
        var measured,
            begin,
            count = 30,
            divisor = 1e3,
            ns = timer.ns,
            sample = [];
        while (count--) {
          if (unit == 'us') {
            divisor = 1e6;
            if (ns.stop) {
              ns.start();
              while (!(measured = ns.microseconds())) {}
            } else if (ns[perfName]) {
              divisor = 1e3;
              measured = Function('n', 'var r,s=n.' + perfName + '();while(!(r=n.' + perfName + '()-s)){};return r')(ns);
            } else {
              begin = ns();
              while (!(measured = ns() - begin)) {}
            }
          } else if (unit == 'ns') {
            divisor = 1e9;
            if (ns.nanoTime) {
              begin = ns.nanoTime();
              while (!(measured = ns.nanoTime() - begin)) {}
            } else {
              begin = (begin = ns())[0] + (begin[1] / divisor);
              while (!(measured = ((measured = ns())[0] + (measured[1] / divisor)) - begin)) {}
              divisor = 1;
            }
          } else {
            begin = new ns;
            while (!(measured = new ns - begin)) {}
          }
          if (measured > 0) {
            sample.push(measured);
          } else {
            sample.push(Infinity);
            break;
          }
        }
        return getMean(sample) / divisor;
      }
      function preprocess(code) {
        return interpolate(code, template).replace(/\$/g, /\d+/.exec(uid));
      }
      each(doc && doc.applets || [], function(element) {
        return !(timer.ns = applet = 'nanoTime' in element && element);
      });
      try {
        if (typeof timer.ns.nanoTime() == 'number') {
          timers.push({
            'ns': timer.ns,
            'res': getRes('ns'),
            'unit': 'ns'
          });
        }
      } catch (e) {}
      try {
        if ((timer.ns = new (window.chrome || window.chromium).Interval)) {
          timers.push({
            'ns': timer.ns,
            'res': getRes('us'),
            'unit': 'us'
          });
        }
      } catch (e) {}
      if ((timer.ns = perfName && perfObject)) {
        timers.push({
          'ns': timer.ns,
          'res': getRes('us'),
          'unit': 'us'
        });
      }
      if (processObject && typeof(timer.ns = processObject.hrtime) == 'function') {
        timers.push({
          'ns': timer.ns,
          'res': getRes('ns'),
          'unit': 'ns'
        });
      }
      if (microtimeObject && typeof(timer.ns = microtimeObject.now) == 'function') {
        timers.push({
          'ns': timer.ns,
          'res': getRes('us'),
          'unit': 'us'
        });
      }
      timer = reduce(timers, function(timer, other) {
        return other.res < timer.res ? other : timer;
      });
      if (timer.unit != 'ns' && applet) {
        applet = destroyElement(applet);
      }
      if (timer.res == Infinity) {
        throw new Error('Benchmark.js was unable to find a working timer.');
      }
      if (timer.unit == 'ns') {
        if (timer.ns.nanoTime) {
          extend(template, {
            'begin': 's$=n$.nanoTime()',
            'end': 'r$=(n$.nanoTime()-s$)/1e9'
          });
        } else {
          extend(template, {
            'begin': 's$=n$()',
            'end': 'r$=n$(s$);r$=r$[0]+(r$[1]/1e9)'
          });
        }
      } else if (timer.unit == 'us') {
        if (timer.ns.stop) {
          extend(template, {
            'begin': 's$=n$.start()',
            'end': 'r$=n$.microseconds()/1e6'
          });
        } else if (perfName) {
          extend(template, {
            'begin': 's$=n$.' + perfName + '()',
            'end': 'r$=(n$.' + perfName + '()-s$)/1e3'
          });
        } else {
          extend(template, {
            'begin': 's$=n$()',
            'end': 'r$=(n$()-s$)/1e6'
          });
        }
      }
      timer.start = createFunction(preprocess('o$'), preprocess('var n$=this.ns,#{begin};o$.elapsed=0;o$.timeStamp=s$'));
      timer.stop = createFunction(preprocess('o$'), preprocess('var n$=this.ns,s$=o$.timeStamp,#{end};o$.elapsed=r$'));
      options.minTime || (options.minTime = max(timer.res / 2 / 0.01, 0.05));
      return clock.apply(null, arguments);
    }
    function compute(bench, options) {
      options || (options = {});
      var async = options.async,
          elapsed = 0,
          initCount = bench.initCount,
          minSamples = bench.minSamples,
          queue = [],
          sample = bench.stats.sample;
      function enqueue() {
        queue.push(bench.clone({
          '_original': bench,
          'events': {
            'abort': [update],
            'cycle': [update],
            'error': [update],
            'start': [update]
          }
        }));
      }
      function update(event) {
        var clone = this,
            type = event.type;
        if (bench.running) {
          if (type == 'start') {
            clone.count = bench.initCount;
          } else {
            if (type == 'error') {
              bench.error = clone.error;
            }
            if (type == 'abort') {
              bench.abort();
              bench.emit('cycle');
            } else {
              event.currentTarget = event.target = bench;
              bench.emit(event);
            }
          }
        } else if (bench.aborted) {
          clone.events.abort.length = 0;
          clone.abort();
        }
      }
      function evaluate(event) {
        var critical,
            df,
            mean,
            moe,
            rme,
            sd,
            sem,
            variance,
            clone = event.target,
            done = bench.aborted,
            now = +new Date,
            size = sample.push(clone.times.period),
            maxedOut = size >= minSamples && (elapsed += now - clone.times.timeStamp) / 1e3 > bench.maxTime,
            times = bench.times,
            varOf = function(sum, x) {
              return sum + pow(x - mean, 2);
            };
        if (done || clone.hz == Infinity) {
          maxedOut = !(size = sample.length = queue.length = 0);
        }
        if (!done) {
          mean = getMean(sample);
          variance = reduce(sample, varOf, 0) / (size - 1) || 0;
          sd = sqrt(variance);
          sem = sd / sqrt(size);
          df = size - 1;
          critical = tTable[Math.round(df) || 1] || tTable.infinity;
          moe = sem * critical;
          rme = (moe / mean) * 100 || 0;
          extend(bench.stats, {
            'deviation': sd,
            'mean': mean,
            'moe': moe,
            'rme': rme,
            'sem': sem,
            'variance': variance
          });
          if (maxedOut) {
            bench.initCount = initCount;
            bench.running = false;
            done = true;
            times.elapsed = (now - times.timeStamp) / 1e3;
          }
          if (bench.hz != Infinity) {
            bench.hz = 1 / mean;
            times.cycle = mean * bench.count;
            times.period = mean;
          }
        }
        if (queue.length < 2 && !maxedOut) {
          enqueue();
        }
        event.aborted = done;
      }
      enqueue();
      invoke(queue, {
        'name': 'run',
        'args': {'async': async},
        'queued': true,
        'onCycle': evaluate,
        'onComplete': function() {
          bench.emit('complete');
        }
      });
    }
    function cycle(clone, options) {
      options || (options = {});
      var deferred;
      if (clone instanceof Deferred) {
        deferred = clone;
        clone = clone.benchmark;
      }
      var clocked,
          cycles,
          divisor,
          event,
          minTime,
          period,
          async = options.async,
          bench = clone._original,
          count = clone.count,
          times = clone.times;
      if (clone.running) {
        cycles = ++clone.cycles;
        clocked = deferred ? deferred.elapsed : clock(clone);
        minTime = clone.minTime;
        if (cycles > bench.cycles) {
          bench.cycles = cycles;
        }
        if (clone.error) {
          event = Event('error');
          event.message = clone.error;
          clone.emit(event);
          if (!event.cancelled) {
            clone.abort();
          }
        }
      }
      if (clone.running) {
        bench.times.cycle = times.cycle = clocked;
        period = bench.times.period = times.period = clocked / count;
        bench.hz = clone.hz = 1 / period;
        bench.initCount = clone.initCount = count;
        clone.running = clocked < minTime;
        if (clone.running) {
          if (!clocked && (divisor = divisors[clone.cycles]) != null) {
            count = floor(4e6 / divisor);
          }
          if (count <= clone.count) {
            count += Math.ceil((minTime - clocked) / period);
          }
          clone.running = count != Infinity;
        }
      }
      event = Event('cycle');
      clone.emit(event);
      if (event.aborted) {
        clone.abort();
      }
      if (clone.running) {
        clone.count = count;
        if (deferred) {
          clone.compiled.call(deferred, timer);
        } else if (async) {
          delay(clone, function() {
            cycle(clone, options);
          });
        } else {
          cycle(clone);
        }
      } else {
        if (support.browser) {
          runScript(uid + '=1;delete ' + uid);
        }
        clone.emit('complete');
      }
    }
    function run(options) {
      var me = this,
          event = Event('start');
      me.running = false;
      me.reset();
      me.running = true;
      me.count = me.initCount;
      me.times.timeStamp = +new Date;
      me.emit(event);
      if (!event.cancelled) {
        options = {'async': ((options = options && options.async) == null ? me.async : options) && support.timeout};
        if (me._original) {
          if (me.defer) {
            Deferred(me);
          } else {
            cycle(me, options);
          }
        } else {
          compute(me, options);
        }
      }
      return me;
    }
    extend(Benchmark, {
      'options': {
        'async': false,
        'defer': false,
        'delay': 0.005,
        'id': undefined,
        'initCount': 1,
        'maxTime': 5,
        'minSamples': 5,
        'minTime': 0,
        'name': undefined,
        'onAbort': undefined,
        'onComplete': undefined,
        'onCycle': undefined,
        'onError': undefined,
        'onReset': undefined,
        'onStart': undefined
      },
      'platform': req('platform') || window.platform || {
        'description': window.navigator && navigator.userAgent || null,
        'layout': null,
        'product': null,
        'name': null,
        'manufacturer': null,
        'os': null,
        'prerelease': null,
        'version': null,
        'toString': function() {
          return this.description || '';
        }
      },
      'version': '1.0.0',
      'support': support,
      'deepClone': deepClone,
      'each': each,
      'extend': extend,
      'filter': filter,
      'forEach': forEach,
      'forOwn': forOwn,
      'formatNumber': formatNumber,
      'hasKey': (hasKey(Benchmark, ''), hasKey),
      'indexOf': indexOf,
      'interpolate': interpolate,
      'invoke': invoke,
      'join': join,
      'map': map,
      'pluck': pluck,
      'reduce': reduce
    });
    extend(Benchmark.prototype, {
      'count': 0,
      'cycles': 0,
      'hz': 0,
      'compiled': undefined,
      'error': undefined,
      'fn': undefined,
      'aborted': false,
      'running': false,
      'setup': noop,
      'teardown': noop,
      'stats': {
        'moe': 0,
        'rme': 0,
        'sem': 0,
        'deviation': 0,
        'mean': 0,
        'sample': [],
        'variance': 0
      },
      'times': {
        'cycle': 0,
        'elapsed': 0,
        'period': 0,
        'timeStamp': 0
      },
      'abort': abort,
      'clone': clone,
      'compare': compare,
      'emit': emit,
      'listeners': listeners,
      'off': off,
      'on': on,
      'reset': reset,
      'run': run,
      'toString': toStringBench
    });
    extend(Deferred.prototype, {
      'benchmark': null,
      'cycles': 0,
      'elapsed': 0,
      'timeStamp': 0,
      'resolve': resolve
    });
    extend(Event.prototype, {
      'aborted': false,
      'cancelled': false,
      'currentTarget': undefined,
      'result': undefined,
      'target': undefined,
      'timeStamp': 0,
      'type': ''
    });
    Suite.options = {'name': undefined};
    extend(Suite.prototype, {
      'length': 0,
      'aborted': false,
      'running': false,
      'forEach': methodize(forEach),
      'indexOf': methodize(indexOf),
      'invoke': methodize(invoke),
      'join': [].join,
      'map': methodize(map),
      'pluck': methodize(pluck),
      'pop': [].pop,
      'push': [].push,
      'sort': [].sort,
      'reduce': methodize(reduce),
      'abort': abortSuite,
      'add': add,
      'clone': cloneSuite,
      'emit': emit,
      'filter': filterSuite,
      'listeners': listeners,
      'off': off,
      'on': on,
      'reset': resetSuite,
      'run': runSuite,
      'concat': concat,
      'reverse': reverse,
      'shift': shift,
      'slice': slice,
      'splice': splice,
      'unshift': unshift
    });
    extend(Benchmark, {
      'Deferred': Deferred,
      'Event': Event,
      'Suite': Suite
    });
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
      define(function() {
        return Benchmark;
      });
    } else if (freeExports) {
      if (typeof module == 'object' && module && module.exports == freeExports) {
        (module.exports = Benchmark).Benchmark = Benchmark;
      } else {
        freeExports.Benchmark = Benchmark;
      }
    } else {
      window['Benchmark'] = Benchmark;
    }
    if (support.air) {
      clock({'_original': {
          'fn': noop,
          'count': 1,
          'options': {}
        }});
    }
  }(this));
})(require('process'));
