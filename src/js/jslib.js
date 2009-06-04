// @require texts.js

// Force caching in IE.
try {
        document.execCommand("BackgroundImageCache", false, true);
} catch(e){};

Array.$ = function(obj, start) {
        if (start == null)
                start = 0;
        var a, i, j;
        try {
                a = Array.prototype.slice.call(obj, start);
        } catch (ex) {
                a = new Array(obj.length - start);
                for (i = start, j = 0; i < obj.length; ++i, ++j)
                        a[j] = obj[i];
        }
        return a;
};

Object.merge = function(dest, src) {
        for (var i in src)
                dest[i] = src[i];
};

Object.merge(Object, {

        mergeDefined: function(dest, src) {
                for (var i in src)
                        if (typeof src[i] != "undefined")
                                dest[i] = src[i];
        },

        mergeUndefined: function(dest, src) {
                for (var i in src)
                        if (!(i in dest))
                                dest[i] = src[i];
        },

        remove: function(from, keys) {
                for (var i = keys.length; --i >= 0;)
                        delete from[keys[i]];
        },

        isEmpty: function(o) {
                for (var i in o)
                        return false;
                return true;
        },

        makeCopy: function(src) {
                var i, dest = {};
                for (i in src)
                        dest[i] = src[i];
                return dest;
        },

        makeDeepCopy: function(src) {
                if (src instanceof Array) {
                        var a = [], i = src.length;
                        while (--i >= 0)
                                a[i] = Object.makeDeepCopy(src[i]);
                        return a;
                }
                if (src === null)
                        return null;
                if (src instanceof Date)
                        return new Date(src);
                if (src instanceof Object) {
                        var i, dest = {};
                        for (i in src)
                                dest[i] = Object.makeDeepCopy(src[i]);
                        return dest;
                }
                return src;
        },

        makeShortcuts: function(obj, props) {
                for (var i in props)
                        obj[i] = obj[props[i]];
        }

});

Object.merge(Function.prototype, {

        $ : Function.prototype.closure = function(obj) {
                var args = Array.$(arguments, 1), f = this;
                if (obj == window.undefined)
                        return function() { return f.apply(this, args.concat(Array.$(arguments))) };
                else
                        return function() { return f.apply(obj, args.concat(Array.$(arguments))) };
        },

        $0 : function(obj) {
                var f = this, args = Array.$(arguments, 1);
                return function() { return f.apply(obj, args) };
        },

        $$ : function(a) { return this.$.apply(this, a) },

        $A : function(obj, a) { return this.$.apply(this, [ obj ].concat(a)) },

        $C : function() {
                var args = Array.$(arguments), f = this;
                return function() { return f.apply(null, args.concat(Array.$(arguments))) }
        },

        inverse : function() {
                var f = this;
                return function() { return !f.apply(this, arguments); };
        },

        clearingTimeout : function(timeout, obj) {
                var id = null, handler = this, args = Array.$(arguments, 2), f = function() {
                        id && clearTimeout(id);
                        id = setTimeout(handler.$A(obj == null ? this : obj, args.concat(Array.$(arguments))), timeout);
                };
                f.cancel = function() { clearTimeout(id) };
                f.doItNow = function() { clearTimeout(id); handler.apply(obj, args.concat(Array.$(arguments))) };
                return f;
        },

        rarify : function(calls, timeout) {
                var
                        f       = this.$$(Array.$(arguments, 2)),
                        ft      = this.clearingTimeout.apply(this, Array.$(arguments, 1)),
                        i       = calls,
                        id      = null,
                        restart = function() { i = calls };
                return function() {
                        id && clearTimeout(id);
                        id = setTimeout(restart, timeout);
                        if (i-- > 0)
                                return f.apply(this, arguments);
                        return ft.apply(this, arguments);
                };
        }

});

Object.merge(Function, {
        noop         : function(){},
        identity     : function(x) { return x; },
        returnTrue   : function() { return true; },
        returnFalse  : function() { return false; },
        invoke       : function(x) { return x(); }
});

// loop control functions

function $_YIELD(timeout) { this.timeout = timeout || 0; };
var $_BREAK = {};
var $_CONTINUE = {};
function $_RETURN(args) { this.args = args; };

function $YIELD(timeout) { throw new $_YIELD(timeout); };
function $BREAK() { throw $_BREAK; };
function $CONTINUE() { throw $_CONTINUE; };
function $RETURN(args) { throw new $_RETURN(args); };

(function() {
        var UA = navigator.userAgent;
        is_opera = /opera/i.test(UA);
        is_ie = /msie/i.test(UA) && !is_opera && !(/mac_powerpc/i.test(UA));
        is_ie5 = is_ie && /msie 5\.[^5]/i.test(UA);
        is_ie6 = is_ie && /msie 6/i.test(UA);
        is_ie7 = is_ie && /msie 7/i.test(UA);
        is_ie8 = is_ie && /msie 8/i.test(UA);
        ie_box_model = is_ie && document.compatMode && document.compatMode == "BackCompat";
        is_mac_ie = /msie.*mac/i.test(UA);
        is_khtml = /Konqueror|Safari|KHTML/i.test(UA);
        is_safari = /Safari/i.test(UA);
        is_safari3 = is_safari && /Version\/3/i.test(UA);
        is_konqueror = is_khtml && !is_safari3;
        is_gecko = /gecko/i.test(UA) && !is_khtml && !is_opera && !is_ie;
        is_chrome = /Chrome/i.test(UA);
        // is_w3 = !is_ie || is_ie7; // FIXME: the part about IE7 is to be verified
        is_w3 = !is_ie;

        if (is_gecko && /rv:\s*([0-9.]+)/.test(UA))
                gecko_version = parseFloat(RegExp.$1);

        Date._MD = [ 31,28,31,30,31,30,31,31,30,31,30,31 ];
        Date.SECOND = 1000;
        Date.MINUTE = 60 * Date.SECOND;
        Date.HOUR   = 60 * Date.MINUTE;
        Date.DAY    = 24 * Date.HOUR;
        Date.WEEK   =  7 * Date.DAY;

        var F = Function.prototype
                , A = Array.prototype
                , D = Date.prototype
                , S = String.prototype
                , N = Number.prototype;

        // Object inheritance

        INHERITANCE = {};

        F.inherits = function(base, name) {
                var p = (this.prototype = new base);
                p.constructor = this;
                this.BASE = base.prototype;
                this._objectType = p._objectType = name || Dynarch.getFunctionName(this);
                INHERITANCE[this._objectType] = name || Dynarch.getFunctionName(base);
                if (p.__patchSubclassPrototype instanceof Function)
                        p.__patchSubclassPrototype();
                return this.BASE;
        };

        Function.getInheritanceGraph = function() {
                return INHERITANCE;
        };

        F.delayed = function(timeout) {
                var f = arguments.length > 1
                        ? this.$$(Array.$(arguments, 1))
                        : this;
                return setTimeout(f, timeout);
        };

        F.setInterval = function(timeout) {
                var f = arguments.length > 1
                        ? this.$$(Array.$(arguments, 1))
                        : this;
                setTimeout(f, 0); // call right away
                return setInterval(f, timeout);
        };

        F.inject = function(props) {
                if (props == null)
                        props = this.OBJECT_EXTENSIONS;
                Dynarch.merge(this.prototype, props);
                return this;
        };

        F.setDefaults = function(obj, args, overwrite) {
                return Dynarch.setDefaults.call(obj, this.DEFAULT_ARGS, args, overwrite);
        };

        Array.hashKeys = function(obj) {
                var a = [], i = 0, key;
                for (key in obj)
                        a[i++] = key;
                return a;
        };

        Array.hashValues = function(obj) {
                var a = [], i = 0, key;
                for (key in obj)
                        a[i++] = obj[key];
                return a;
        };

        A.accumulate = function(f, val) {
                if (arguments.length < 2)
                        val = 0;
                for (var i = 0; i < this.length; ++i)
                        val = f(this[i], val, i);
                return val;
        };

        A.foreach = function(f, obj) {
                if (obj == null)
                        obj = this;
                var i = 0, l = this.length;
                while (l-- > 0) try {
                        f.call(obj, this[i], i++);
                } catch(ex) {
                        if (ex === $_BREAK) break;
                        if (ex === $_CONTINUE) continue;
                        if (ex instanceof $_RETURN) return ex.args;
                        throw ex;
                }
        };

        A.r_foreach = function(f, obj) {
                if (obj == null)
                        obj = this;
                for (var i = this.length; --i >= 0;) try {
                        f.call(obj, this[i], i);
                } catch(ex) {
                        if (ex === $_BREAK) break;
                        if (ex === $_CONTINUE) continue;
                        if (ex instanceof $_RETURN) return ex.args;
                        throw ex;
                }
        };

        A.assign_each = function(f, obj) {
                return this.foreach(function(el, i) {
                        this[i] = f.call(obj, i, el);
                });
        };

        A.r_assign_each = function(f, obj) {
                return this.r_foreach(function(el, i) {
                        this[i] = f.call(obj, i, el);
                });
        };

        A.toHash = function(val, obj) {
                var h = {};
                if (val instanceof Function) {
                        this.foreach(function(s, i) {
                                h[s] = val.call(obj, s, i);
                        });
                } else {
                        this.foreach(function(s, i) {
                                h[s] = val != null ? val : (i + 1);
                        });
                }
                return h;
        };

        A.toHash2 = function() {
                var hash = {}, i = 0;
                while (i < this.length)
                        hash[this[i++]] = this[i++];
                return hash;
        };

        A.map = function(f, obj) {
                var i = 0, l = this.length, a = [], args, func;
                if (!(f instanceof Function)) {
                        args = Array.$(arguments, 1);
                        while (l-- > 0) {
                                obj = this[i];
                                func = obj[f];
                                a[i++] = (func instanceof Function)
                                        ? func.apply(obj, args)
                                        : func;
                        }
                } else {
                        if (obj == null)
                                obj = this;
                        while (l-- > 0) try {
                                a.push(f.call(obj, this[i], i++));
                        } catch(ex) {
                                if (ex === $_BREAK) break;
                                if (ex === $_CONTINUE) continue;
                                if (ex instanceof $_RETURN) {
                                        a.push(ex.args);
                                        break;
                                }
                                throw ex;
                        }
                }
                return a;
        };

        A.r_map = function(f, obj) {
                var i = this.length, a = [], func;
                if (!(f instanceof Function)) {
                        args = Array.$(arguments, 1);
                        while (--i >= 0) {
                                obj = this[i];
                                func = obj[f];
                                a[i] = (func instanceof Function)
                                        ? func.apply(obj, args)
                                        : func;
                        }
                } else {
                        if (obj == null)
                                obj = this;
                        while (--i >= 0) try {
                                a.push(f.call(obj, this[i], i));
                        } catch(ex) {
                                if (ex === $_BREAK) break;
                                if (ex === $_CONTINUE) continue;
                                if (ex instanceof $_RETURN) {
                                        a.push(ex.args);
                                        break;
                                }
                                throw ex;
                        }
                }
                return a.reverse();
        };

        A.keys_map = function(obj) {
                return this.map(function(key) {
                        return obj[key];
                });
        };

        A.grep = function(cond, obj) {
                var i = 0, l = this.length, a = [], el, args, func;
                if (cond instanceof RegExp) {
                        while (l-- > 0) {
                                el = this[i++];
                                cond.test(el) && a.push(el);
                        }
                } else if (cond instanceof Function) {
                        if (obj == null)
                                obj = this;
                        while (l-- > 0) {
                                el = this[i];
                                cond.call(obj, el, i++) && a.push(el);
                        }
                } else {
                        args = Array.$(arguments, 1);
                        while (l-- > 0) {
                                obj = this[i++];
                                func = obj[cond];
                                if (obj[cond] instanceof Function) {
                                        obj[cond].apply(obj, args) && a.push(obj);
                                } else if (obj[cond]) {
                                        a.push(obj);
                                }
                        }
                }
                return a;
        };

        A.grep_last = function(f, i) {
                if (i == null)
                        i = this.length - 1;
                while (i >= 0) {
                        var el = this[i--];
                        if (f(el))
                                return el;
                }
                return null;
        };

        A.grep_first = function(f, i) {
                for (i = i || 0; i < this.length; ++i) {
                        var el = this[i];
                        if (f(el))
                                return el;
                }
                return null;
        };

        A.contains = function(el) {
                for (var i = this.length; --i >= 0;)
                        if (this[i] === el)
                                return true;
                return false;
        };

        A.find = function(el) {
                for (var i = this.length; --i >= 0;)
                        if (this[i] === el)
                                return i;
                return -1;
        };

        A.remove = function(el) {
                for (var i = this.length; --i >= 0;)
                        if (this[i] === el)
                                this.splice(i, 1);
                return this;
        };

        A.pushUnique = function(el) {
                if (this.find(el) < 0) {
                        this.push(el);
                        return this.length;
                }
                return null;
        };

        function makeComparator(cmp, reverse) {
                if (reverse) {
                        if (cmp instanceof Function) return function(el1, el2) { return cmp(el2, el1); };
                        else return function(el2, el1) { return (el1 < el2) ? -1 : ((el1 > el2) ? 1 : 0); };
                } else {
                        if (cmp instanceof Function) return cmp;
                        else return function(el1, el2) { return (el1 < el2) ? -1 : ((el1 > el2) ? 1 : 0); };
                }
        };

        A.mergeSort = function(cmp, reverse) {
                if (this.length < 2)
                        return Array.$(this);
                var _cmp = makeComparator(cmp, reverse);
                function merge(a, b) {
                        var r = [], ai = 0, bi = 0, i = 0;
                        while (ai < a.length && bi < b.length) {
                                _cmp(a[ai], b[bi]) <= 0
                                        ? r[i++] = a[ai++]
                                        : r[i++] = b[bi++];
                        }
                        if (ai < a.length)
                                r.push.apply(r, a.slice(ai));
                        if (bi < b.length)
                                r.push.apply(r, b.slice(bi));
                        return r;
                };
                function _ms(a) {
                        if (a.length <= 1)
                                return a;
                        var m = Math.floor(a.length / 2), left = a.slice(0, m), right = a.slice(m);
                        left = _ms(left);
                        right = _ms(right);
                        return merge(left, right);
                };
                return _ms(this);
        };

        A.qsort = function(cmp, reverse) {
                if (this.length < 2)
                        return;
                var _cmp = makeComparator(cmp, reverse), a = this, tmp, modified = false;
                function _qs(st, en) {
                        var j = st, k = en, sw = false;
                        if (j < k) {
                                do {
                                        if (_cmp(a[j], a[k]) > 0) {
                                                tmp = a[j];
                                                a[j] = a[k];
                                                a[k] = tmp;
                                                sw = !sw;
                                                modified = true;
                                        }
                                        sw ? --k : ++j;
                                } while (j < k);
                                _qs(st, j - 1);
                                _qs(j + 1, en);
                        }
                };
                _qs(0, this.length - 1);
                return modified;
        };

        A.peek = function() {
                if (this.length > 0)
                        return this[this.length - 1];
        };

        A.min = function(f, obj) {
                if (this.length == 0)
                        return null;
                if (arguments.length > 0) {
                        var min = f != null
                                ? f.call(obj, this[0], 0)
                                : this[0];
                        for (i = 1; i < this.length; ++i) {
                                min = Math.min(min, (f != null
                                                     ? f.call(obj, this[i], i)
                                                     : this[i]));
                        }
                        return min;
                }
                return Math.min.apply(Math, this);
        };

        A.max = function(f, obj) {
                if (this.length == 0)
                        return null;
                if (arguments.length > 0) {
                        var max = f != null
                                ? f.call(obj, this[0], 0)
                                : this[0];
                        for (i = 1; i < this.length; ++i) {
                                max = Math.max(max, (f != null
                                                     ? f.call(obj, this[i], i)
                                                     : this[i]));
                        }
                        return max;
                }
                return Math.max.apply(Math, this);
        };

        A.rotateIndex = function(idx) {
                return Math.rotateLimit(idx, 0, this.length - 1);
        };

        A.limitIndex = function(idx) {
                return Math.limit(idx, 0, this.length - 1);
        };

        A.nullLimitIndex = function(idx) {
                return Math.nullLimit(idx, 0, this.length - 1);
        };

        A.bytesToString = function() {
                var s = String.buffer(), i = 0, c;
                while (i < this.length) {
                        c = this[i++];
                        if (!(c & 0xF0 ^ 0xF0)) {
                                // 4 bytes
                                c = ((c & 0x03) << 18) |
                                        ((this[i++] & 0x3F) << 12) |
                                        ((this[i++] & 0x3F) << 6) |
                                        (this[i++] & 0x3F);
                        } else if (!(c & 0xE0 ^ 0xE0)) {
                                // 3 bytes
                                c = ((c & 0x0F) << 12) |
                                        ((this[i++] & 0x3F) << 6) |
                                        (this[i++] & 0x3F);
                        } else if (!(c & 0xC0 ^ 0xC0)) {
                                // 2 bytes
                                c = ((c & 0x1F) << 6) |
                                        (this[i++] & 0x3F);
                        }
                        s(String.fromCharCode(c));
                }
                return s.get();
        };

        N.map = function(start, stop) {
                return start + (stop - start) * this;
        };

        N.mapInt = function(start, stop) {
                return Math.round(this.map(start, stop));
        };

        N.bits1Array = function() {
                var n = this, a = [], v = 1, i = 0;
                while (n > 0) {
                        if (n & 1)
                                a[i++] = v;
                        v = v << 1;
                        n = n >> 1;
                }
                return a;
        };

        N.times = function(f, obj) {
                var i = this, j = 0;
                while (--i >= 0)
                        f.call(obj, j++, i);
        };

//         var HEX_DIGITS = [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F" ];
//         N.hex = function(width) {
//                 var n = this, ret = [];
//                 do
//                         ret.unshift(HEX_DIGITS[n & 0xF]);
//                 while ((n >>= 4) > 0);
//                 if (width != null) {
//                         n = width - ret.length;
//                         while (n-- > 0)
//                                 ret.unshift("0");
//                 }
//                 return ret.join("");
//         };

        N.hex = function(width) {
                var n = this.toString(16).toUpperCase();
                if (width)
                        while (n.length < width)
                                n = "0" + n;
                return n;
        };

        var $1K = N.$1K = 1024
        , $1M = N.$1M = $1K * 1024
        , $1G = N.$1G = $1M * 1024
        , $1T = N.$1T = $1G * 1024;
        N.formatBytes = function(fixed) {
                var sz = this, spec, r;
                if (sz < $1K) {
                        spec = "B";
                } else if (sz < $1M) {
                        sz /= $1K;
                        spec = "K";
                } else if (sz < $1G) {
                        sz /= $1M;
                        spec = "M";
                } else if (sz < $1T) {
                        sz /= $1G;
                        spec = "G";
                }
                // spec = " " + spec;
                r = Math.round(sz);
                if (fixed && sz != r)
                        return sz.toFixed(fixed) + spec;
                else
                        return r + spec;
        };

        N.zeroPad = function(width, zero) {
                var s = "" + Math.round(this);
                if (zero == null)
                        zero = "0";
                while (s.length < width)
                        s = zero + s;
                return s;
        };

        N.formatTime = function() {
                var s = this, h, m;
                m = s / 60; s %= 60;
                h = m / 60; m %= 60;
                return [h, m, s].map("zeroPad", 2).join(":");
        };

        N.limit = function(min, max) {
                return Math.limit(this, min, max);
        };

        N.rotateLimit = function(min, max) {
                return Math.rotateLimit(this, min, max);
        };

        N.nullLimit = function(min, max) {
                return Math.nullLimit(this, min, max);
        };

        Math.nullLimit = function(n, min, max) {
                if (n < min)
                        n = null;
                if (n > max)
                        n = null;
                return n;
        };

        Math.limit = function(n, min, max) {
                if (n < min)
                        n = min;
                if (n > max)
                        n = max;
                return n + 0;
        };

        Math.rotateLimit = function(n, min, max) {
                if (n < min)
                        n = max;
                if (n > max)
                        n = min;
                return n + 0;
        };

        // see texts.js
        Date._MN = DlTEXTS._date_monthNames;
        Date._SMN = DlTEXTS._date_shortMonthNames;
        Date._DN = DlTEXTS._date_dayNames;
        Date._SDN = DlTEXTS._date_shortDayNames;
        Date._FDOW = DlTEXTS._date_firstDayOfWeek;

        Date.isWeekend = function(day) {
                return day == 0 || day == 6;
        };

        Date.parseMySQL = function(str) {
                var a = str.split(/\s+/), d = a[0].split(/-/), t = a[1].split(/:/);
                return new Date(d[0], d[1] - 1, d[2], t[0] || null, t[1] || null, t[2] || null);
        };

        D.getMonthDays = function(m) {
                var y = this.getFullYear();
                if (m == null)
                        m = this.getMonth();
                return (((0 == (y%4)) && ( (0 != (y%100)) || (0 == (y%400)))) && m == 1) ? 29 : Date._MD[m];
        };

        D.getDayOfYear = function() {
                var now = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
                var then = new Date(this.getFullYear(), 0, 0, 0, 0, 0);
                var time = now - then;
                return Math.floor(time / Date.DAY);
        };

        D.getWeekNumber = function() {
                var d = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
                var DoW = d.getDay();
                d.setDate(d.getDate() - (DoW + 6) % 7 + 3); // Nearest Thu
                var ms = d.valueOf(); // GMT
                d.setMonth(0);
                d.setDate(4); // Thu in Week 1
                return Math.round((ms - d.valueOf()) / (7 * 864e5)) + 1;
        };

        D.dateEqualsTo = function(date, monthOnly) {
                return this.getFullYear() == date.getFullYear()
                        && this.getMonth() == date.getMonth()
                        && (monthOnly || this.getDate() == date.getDate());
        };

        D.print = function (str) {
                var m = this.getMonth();
                var d = this.getDate();
                var y = this.getFullYear();
                var wn = this.getWeekNumber();
                var w = this.getDay();
                var s = {};
                var hr = this.getHours();
                var pm = (hr >= 12);
                var ir = (pm) ? (hr - 12) : hr;
                var dy = this.getDayOfYear();
                if (ir == 0)
                        ir = 12;
                var min = this.getMinutes();
                var sec = this.getSeconds();
                s["%a"] = Date.getDayName(w, true); // abbreviated weekday name [FIXME: I18N]
                s["%A"] = Date.getDayName(w); // full weekday name
                s["%b"] = Date.getMonthName(m, true); // abbreviated month name [FIXME: I18N]
                s["%B"] = Date.getMonthName(m); // full month name
                // FIXME: %c : preferred date and time representation for the current locale
                s["%C"] = 1 + Math.floor(y / 100); // the century number
                s["%d"] = (d < 10) ? ("0" + d) : d; // the day of the month (range 01 to 31)
                s["%e"] = d; // the day of the month (range 1 to 31)
                // FIXME: %D : american date style: %m/%d/%y
                // FIXME: %E, %F, %G, %g, %h (man strftime)
                s["%H"] = (hr < 10) ? ("0" + hr) : hr; // hour, range 00 to 23 (24h format)
                s["%I"] = (ir < 10) ? ("0" + ir) : ir; // hour, range 01 to 12 (12h format)
                s["%j"] = (dy < 100) ? ((dy < 10) ? ("00" + dy) : ("0" + dy)) : dy; // day of the year (range 001 to 366)
                s["%k"] = hr;           // hour, range 0 to 23 (24h format)
                s["%l"] = ir;           // hour, range 1 to 12 (12h format)
                s["%m"] = (m < 9) ? ("0" + (1+m)) : (1+m); // month, range 01 to 12
                s["%M"] = (min < 10) ? ("0" + min) : min; // minute, range 00 to 59
                s["%n"] = "\n";         // a newline character
                s["%p"] = pm ? "PM" : "AM";
                s["%P"] = pm ? "pm" : "am";
                // FIXME: %r : the time in am/pm notation %I:%M:%S %p
                // FIXME: %R : the time in 24-hour notation %H:%M
                s["%s"] = Math.floor(this.getTime() / 1000);
                s["%S"] = (sec < 10) ? ("0" + sec) : sec; // seconds, range 00 to 59
                s["%t"] = "\t";         // a tab character
                // FIXME: %T : the time in 24-hour notation (%H:%M:%S)
                s["%U"] = s["%W"] = s["%V"] = (wn < 10) ? ("0" + wn) : wn;
                s["%u"] = w + 1;        // the day of the week (range 1 to 7, 1 = MON)
                s["%w"] = w;            // the day of the week (range 0 to 6, 0 = SUN)
                // FIXME: %x : preferred date representation for the current locale without the time
                // FIXME: %X : preferred time representation for the current locale without the date
                s["%y"] = ('' + y).substr(2, 2); // year without the century (range 00 to 99)
                s["%Y"] = y;            // year with the century
                s["%%"] = "%";          // a literal '%' character

                var re = /%./g;
                return str.replace(re, function (par) { return s[par] || par; });

                var a = str.match(re);
                for (var i = 0; i < a.length; i++) {
                        var tmp = s[a[i]];
                        if (tmp) {
                                re = new RegExp(a[i], 'g');
                                str = str.replace(re, tmp);
                        }
                }

                return str;
        };

        Date.getMonthName = function(mon, sh) {
                var a = sh ? Date._SMN : Date._MN;
                return a[mon % 12];
        };

        Date.getFirstDayOfWeek = function() {
                return Date._FDOW;
        };

        Date.getDayName = function(day, sh) {
                var a = sh ? Date._SDN : Date._DN;
                return a[day % 7];
        };

        S.breakable = function(re) {
                if (!re)
                        re = /([_.-])/g;
                return this.replace(re, "$1<span class='BreakPoint'> </span>");
        };

        S.printf = function() {
                var a = Array.$(arguments), i = 0;
                return this.replace(/%[sdfo%]/g, function(s) {
                        s = s.charAt(1);
                        var v = a[i++];
                        switch (s) {
                            case "s": return v.toString();
                            case "d": return parseInt(v);
                            case "f": return parseFloat(v).toFixed(3);
                            case "o": return v; // not quite as useful as in Firebug console...
                            case "%": return "%";
                        }
                        return "undefined";
                });
        };

        S.fixedWidth = function(w) {
                return String.buffer("<div style='width:", w, "'>", this, "</div>").get();
        };

        S.noWrap = function() {
                return this.replace(/\x20/g, "&nbsp;");
        };

        S.lastIndexOfRegexp = function(re, caret) {
                var m, pos = 0;
                re.lastIndex = 0;
                re.global = true;
                while (m = re.exec(this)) {
                        if (re.lastIndex >= caret)
                                break;
                        pos = re.lastIndex;
                }
                return pos;
        };

        S.hashWords = function(val) {
                return this.trim().split(/\s+/).toHash(arguments.length > 0 ?
                                                       val : true);
        };

        S.arrayWords = function() {
                return this.trim().split(/\s+/);
        };

        S.qw = S.arrayWords;

        S.trim = function(nostart, noend) {
                var str = nostart ? this : this.replace(/^\s+/, "");
                if (!noend)
                        str = str.replace(/\s+$/, "");
                return str;
        };

        var CE_CACHE = {
                HTML_ESCAPE_DIV  : document.createElement("div"),
                HTML_ESCAPE_TEXT : document.createTextNode("")
        };
        CE_CACHE.HTML_ESCAPE_DIV.appendChild(CE_CACHE.HTML_ESCAPE_TEXT);

        S.htmlEscape = is_gecko ? function() {
                return this.replace(/&/g, "&amp;")
                //      .replace(/\x22/g, "&quot;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\u00A0/g, "&#xa0;");
        } : function() {
                CE_CACHE.HTML_ESCAPE_TEXT.data = this;
                return CE_CACHE.HTML_ESCAPE_DIV.innerHTML;
        };

        S.decodeJSON = function(safe) {
                return DlJSON.decode(this, safe);
        };

        S.makeLabel = function() {
                return this.replace(/\s+/g, "&nbsp;");
        };

        S.capitalizeString = function() {
                return this.charAt(0).toUpperCase() + this.substr(1);
        };

        S.htmlEmbed = function(tag, c) {
                var a = [ "<", tag ];
                if (c != null)
                        a.push(" class='", c, "'");
                a.push(">", this, "</", tag, ">");
                return a.join("");
        };

        S.bold = S.htmlEmbed.$(window.undefined, "b");

        S.repeat = S.x = function(i) {
                if (i == 0)
                        return "";
                if (i == 1)
                        return "" + this;
                var d = this.repeat(i >> 1);
                d += d;
                if (i & 1)
                        d += this;
                return d;
        };

        S.hexToBytes = function(unsafe) {
                var a = [], i = 0, s = this;
                if (unsafe)
                        s = s.replace(/[^0-9a-f]/ig, "");
                if (s.length & 1)
                        s = "0" + s;
                while (i < s.length) {
                        a.push(parseInt(s.substr(i, 2), 16));
                        i++; i++;
                }
                return a;
        };

        S.toBytes = function() {
                var a = [], i = this.length, j = 0, k = 0, c;
                while (--i >= 0) {
                        c = this.charCodeAt(k++);
                        // unicode support
                        if (c < 0x80) {
                                // one byte - ASCII
                                a[j++] = c;
                        } else if (c < 0x800) {
                                // two bytes
                                a[j++] = 0xC0 | ((c >>> 6) & 0x1F);
                                a[j++] = 0x80 | (c & 0x3F);
                        } else if (c < 0x10000) {
                                // three bytes
                                a[j++] = 0xE0 | ((c >>> 12) & 0x0F);
                                a[j++] = 0x80 | ((c >>> 6) & 0x3F);
                                a[j++] = 0x80 | (c & 0x3F);
                        } else if (c < 0x110000) {
                                // four bytes
                                a[j++] = 0xF0 | ((c >>> 18) & 0x03);
                                a[j++] = 0x80 | ((c >>> 12) & 0x3F);
                                a[j++] = 0x80 | ((c >>> 6) & 0x3F);
                                a[j++] = 0x80 | (c & 0x3F);
                        }
                }
                return a;
        };

        String.firstNonEmpty = function() {
                for (var i = 0; i < arguments.length; ++i) {
                        var s = arguments[i];
                        if (/\S/.test(s))
                                return s;
                }
        };

        var ids = {};

        window.Dynarch = {
                // functions to cope with objects in JavaScript
                // merge an object
                merge : Object.merge,

                // copy an object
                copy : function(dest, src) {
                        for (var i in dest)
                                delete dest[i];
                        Dynarch.merge(dest, src);
                },

                // return a copy of a given object
                makeCopy : Object.makeCopy,

                makeDeepCopy : Object.makeDeepCopy,

                // merge src into dest but only those properties that are
                // undefined in dest
                mergeUndefined : Object.mergeUndefined,

                // Call this in the context of some object.  Sets the default
                // properties of "this" according to their description in
                // defaults.  Can throw an exception if invalid data was
                // passed.
                setDefaults : function(defaults, args, overwrite) {
                        var i, val, def;
                        for (i in defaults) {
                                if (overwrite || !(i in this)) {
                                        def = defaults[i];
                                        if (def instanceof Array) {
                                                if (def[0] != null) {
                                                        val = def[0];
                                                        if (val in args)
                                                                val = args[val];
                                                        else
                                                                val = def[1];
                                                } else
                                                        val = def[1];
                                        } else
                                                val = def;
                                        this[i] = val;
                                }
                        }
                },

                ID : function(namespace) {
                        if (namespace == null)
                                namespace = "generic";
                        if (!(namespace in ids))
                                ids[namespace] = 0;
                        return "dynarch-" + namespace + "-" + (++ids[namespace]);
                },

                getFunctionName : function(f) {
                        if (f.name)
                                return f.name;
                        else if (/function\s+(\$?[a-z0-9_]+)\(/i.test(f.toString()))
                                return RegExp.$1;
                        return "UNKNOWN_FUNCTION";
                },

                EXPORT : function(name, imp) {
                        var ret = String.buffer("var D=window.", name, "=", name, ",P=", name, ".prototype;");
                        if (imp)
                                ret(DynarchDomUtils.importCommonVars());
                        return ret.get();
                },

                getBaseURL : function() {
                        var u = window.Dynarch_Base_Url;
                        if (!u) {
                                var scripts = document.getElementsByTagName("script"), i = 0, s;
                                while (s = scripts[i++])
                                        if (s.className == "DynarchLIB") {
                                                u = s.src;
                                                if (/^(.*)\x2fjs\x2f/.test(u)) {
                                                        Dynarch_Base_Url = u = RegExp.$1;
                                                        break;
                                                }
                                        }
                        }
                        return u;
                },

                getFileURL : function(file) {
                        return Dynarch.getBaseURL() + "/" + file;
                },

                // TODO: deprecated

                makeArray : Array.$,

                noop : Function.noop
        };

        window.DynarchDomUtils = {
                related : function(element, ev) {
                        var related, type;
                        if (is_ie) {
                                type = ev.type;
                                if (type == "mouseover")
                                        related = ev.fromElement;
                                else if (type == "mouseout")
                                        related = ev.toElement;
                        } else
                                related = ev.relatedTarget;
                        if (is_gecko && related) {
                                try {
                                        // throws Permission Denied when the
                                        // target is a <input> or <textarea>, see:
                                        // https://bugzilla.mozilla.org/show_bug.cgi?id=101197
                                        related.parentNode;
                                } catch(ex) {
                                        // doesn't anyone fix these things?
                                        try {
                                                related = ev.parentNode;
                                        } catch(ex) {
                                                // AWWWWWWWWW!!!!
                                                related = ev.target;
                                        }
                                }
                        }
                        try {
                                for (; related; related = related.parentNode)
                                        if (related === element)
                                                return true;
                        } catch(ex) {
                                // FirefoXXX.
                                return true;
                        }
                        return false;
                },

                getScrollbarSize : function(el) {
                        return { x: el.offsetWidth - el.clientWidth, y : el.offsetHeight - el.clientHeight };
                },

                addEvent : function(el, evname, func) {
                        if (typeof evname == "string") {
                                if (el.addEventListener) {
                                        el.addEventListener(evname, func, false);
                                } else if (el.attachEvent) {
                                        el.attachEvent("on" + evname, func);
                                } else {
                                        el["on" + evname] = func;
                                }
                        } else if (evname instanceof Array) {
                                DynarchDomUtils.addEvents(el, evname, func);
                        } else {
                                // object
                                for (var i in evname)
                                        DynarchDomUtils.addEvent(el, i, evname[i]);
                        }
                },
                addEvents : function(el, evs, func) {
                        for (var i = evs.length; --i >= 0;)
                                DynarchDomUtils.addEvent(el, evs[i], func);
                },
                removeEvent : function(el, evname, func) {
                        if (typeof evname == "string") {
                                if (el.removeEventListener)
                                        el.removeEventListener(evname, func, false);
                                else if (el.detachEvent)
                                        el.detachEvent("on" + evname, func);
                                else
                                        el["on" + evname] = "";
                        } else if (evname instanceof Array) {
                                DynarchDomUtils.removeEvents(el, evname, func);
                        } else {
                                // object
                                for (var i in evname)
                                        DynarchDomUtils.removeEvent(el, i, evname[i]);
                        }
                },
                removeEvents : function(el, evs, func) {
                        for (var i = evs.length; --i >= 0;)
                                DynarchDomUtils.removeEvent(el, evs[i], func);
                },
                condEvent : function(cond) {
                        cond = cond ? DynarchDomUtils.addEvent : DynarchDomUtils.removeEvent;
                        return cond.apply(DynarchDomUtils, Array.$(arguments, 1));
                },
                condEvents : function(cond) {
                        cond = cond ? DynarchDomUtils.addEvents : DynarchDomUtils.removeEvents;
                        return cond.apply(DynarchDomUtils, Array.$(arguments, 1));
                },
                stopEvent : function(ev) {
                        if (is_ie) {
                                ev.cancelBubble = true;
                                ev.returnValue = false;
                        } else {
                                ev.preventDefault();
                                ev.stopPropagation();
                        }
                        return false;
                },

                addLoadHandler : function(el, handler) {
                        if (is_ie) {
                                el.onreadystatechange = function() {
                                        if (el.readyState == 4) {
                                                // _sometimes_ IE throws errors, so try{} it
                                                try {
                                                        el.onreadystatechange = null;
                                                } catch(ex) {};
                                                handler();
                                        }
                                };
                        } else
                                DynarchDomUtils.addEvent(el, "load", handler);
                },

                callHandler : function(obj, method) {
                        if (!obj[method])
                                return;
                        if (obj[method] instanceof Function)
                                obj[method].call(obj);
                        else if (typeof obj[method] == "string")
                                eval(obj[method]);
                },
                setStyleProperty : function(el, prop, val) {
                        switch (prop) {
                            case "float":
                                prop = "styleFloat";
                                break;
                            default:
                                prop = prop.toLowerCase().replace(/-([a-z])/g, function(s, p1) {
                                                                          return p1.toUpperCase();
                                                                  });
                        }
                        el.style[prop] = val;
                },

                setOpacity : function(el, o) {
                        if (o != null) {
                                if (o == "" && o != 0) {
                                        is_ie
                                                ? el.style.filter = ""
                                                : el.style.opacity = "";
                                } else {
                                        is_ie
                                                ? el.style.filter = "alpha(opacity=" + Math.round(o * 100) + ")"
                                                : el.style.opacity = o;
                                }
                                return o;
                        } else {
                                if (!is_ie)
                                        return parseFloat(el.style.opacity);
                                else
                                        if (/alpha\(opacity=([0-9.])+\)/.test(el.style.opacity))
                                                return parseFloat(RegExp.$1);
                        }
                },

                getClosestParentByTagName : function(el, tag) {
                        tag = tag.toLowerCase();
                        while (el && el.tagName && el.tagName.toLowerCase() != tag)
                                el = el.parentNode;
                        return el;
                },

                isInside : function(el, parent) {
                        try {
                                while (el) {
                                        if (el === parent)
                                                return true;
                                        el = el.parentNode;
                                }
                        } catch(ex) {}
                        return false;
                },

                getWindowSize : function() {
                        if (is_gecko) {
                                if (document.documentElement.clientWidth)
                                        return { x: document.documentElement.clientWidth, y: document.documentElement.clientHeight };
                                else
                                        return { x: window.innerWidth, y: window.innerHeight };
                        }
                        if (is_opera)
                                return { x: window.innerWidth, y: window.innerHeight };
                        if (is_ie) {
                                if (!document.compatMode || document.compatMode == "BackCompat")
                                        return { x: document.body.clientWidth, y: document.body.clientHeight };
                                else
                                        return { x: document.documentElement.clientWidth, y: document.documentElement.clientHeight };
                        }
                        // let's hope we never get to use this hack.
                        var div = document.createElement("div"), s = div.style;
                        s.position = "absolute";
                        s.bottom = s.right = "0px";
                        document.body.appendChild(div);
                        s = { x: div.offsetLeft, y: div.offsetTop };
                        document.body.removeChild(div);
                        return s;
                },

                getPos : function (el) {
                        if (el.getBoundingClientRect) {
                                var box = el.getBoundingClientRect();
                                return { x: box.left - document.documentElement.clientLeft,
                                         y: box.top - document.documentElement.clientTop };
                        } else if (document.getBoxObjectFor) {
                                var box = el.ownerDocument.getBoxObjectFor(el);
                                var pos = { x: box.x, y: box.y };
                                // is this a bug or what?  we have to substract scroll values manually!
                                while (el.parentNode && el.parentNode !== document.body) {
                                        el = el.parentNode;
                                        pos.x -= el.scrollLeft;
                                        pos.y -= el.scrollTop;
                                }
                                return pos;
                        }
                        // other browsers do the hard way
                        if (/^body$/i.test(el.tagName))
                                return { x: 0, y: 0 };
                        var
                                SL = 0, ST = 0,
                                is_div = /^div$/i.test(el.tagName),
                                r, tmp;
                        if (is_div && el.scrollLeft)
                                SL = el.scrollLeft;
                        if (is_div && el.scrollTop)
                                ST = el.scrollTop;
                        r = { x: el.offsetLeft - SL, y: el.offsetTop - ST };
                        if (el.offsetParent) {
                                tmp = DynarchDomUtils.getPos(el.offsetParent);
                                r.x += tmp.x;
                                r.y += tmp.y;
                        }
                        return r;
                },

                getBRPos : function(el) {
                        var pos = DynarchDomUtils.getPos(el), size = DynarchDomUtils.getOuterSize(el);
                        pos.x += size.x - 1;
                        pos.y += size.y - 1;
                        return pos;
                },

                setPos : function(el, x, y) {
                        if (typeof x == "number")
                                x += "px";
                        if (typeof y == "number")
                                y += "px";
                        if (x != null)
                                el.style.left = x;
                        if (y != null)
                                el.style.top = y;
                },

                createElement : function(tag, st, at, par, pos) {
                        var el = CE_CACHE[tag], i;
                        if (!el)
                                el = CE_CACHE[tag] = document.createElement(tag);
                        el = el.cloneNode(false);
                        if (st) for (i in st)
                                if (is_ie)
                                        DynarchDomUtils.setStyleProperty(el, i, st[i]);
                                else
                                        el.style.setProperty(i, st[i], "");
                        if (at) for (i in at)
                                // el.setAttribute(i, at[i]);
                                el[i] = at[i];
                        if (par) {
                                if (typeof pos == "number")
                                        pos = par.childNodes[pos];
                                if (!pos)
                                        pos = null;
                                par.insertBefore(el, pos);
                        }
                        return el;
                },

                setUnselectable : function(el, unsel) {
                        if (unsel == null)
                                unsel = true;
                        if (!is_ie) {
                                unsel = unsel ? "none" : "normal";
                                el.style.MozUserSelect = unsel;
                                el.style.WebkitUserSelect = unsel;
                                el.style.userSelect = unsel;
                        } else {
                                unsel = unsel ? "on" : "off";
                                var els = Array.$(el.getElementsByTagName("*"));
                                els.push(el);
                                els.foreach(function(el) { el.setAttribute("unselectable", unsel); });
                        }
                },

                addClass : function(el, ac, dc) {
                        DynarchDomUtils.delClass(el, dc, ac);
                },
                delClass : function(el, dc, ac) {
                        if (el) {
                                var cls = el.className;
                                if (dc instanceof RegExp) {
                                        cls = cls.replace(dc, " ");
                                        dc = null;
                                }
                                if (ac || dc) {
                                        var a = cls.split(/\s+/), i = a.length, r = {};
                                        dc && (r[dc] = 1);
                                        ac && (r[ac] = 1);
                                        while (--i >= 0)
                                                if (a[i] in r)
                                                        a.splice(i, 1);
                                        ac && a.push(ac);
                                        cls = a.join(" ");
                                }
                                el.className = cls;
                        }
                },
                condClass : function(el, cond, clsTrue, clsFalse) {
                        DynarchDomUtils[cond ? "addClass" : "delClass"]
                                (el, clsTrue, clsFalse);
                },
                hasClass: function(el, cls) {
                        return el.className.split(" ").contains(cls);
                },

                elementIsVisible: function(el) {
                        //var s = DynarchDomUtils.getStyle;
                        //return s(el, "display") != "none" && s(el, "visibility") != "hidden";
                        return !!el.offsetWidth && el.style.visibility != "hidden";
                },

                ie_getBackgroundColor : function(el) {
                        var r = document.body.createTextRange();
                        r.moveToElementText(el);
                        return "#" + parseInt(r.queryCommandValue("BackColor")).hex(6);
                },

                getStyle : function(el, prop) {
                        var ret = null;
                        if (window.getComputedStyle) {
                                // ret = document.defaultView.getComputedStyle(el, "").getPropertyCSSValue(prop).cssText;
                                ret = document.defaultView.getComputedStyle(el, "").getPropertyValue(prop);
                        } else if (el.currentStyle) {
                                prop = prop.replace(/-[a-z]/g, function(s) {
                                        return s.charAt(1).toUpperCase();
                                });
                                // exceptions
                                if (prop == "backgroundColor") {
                                        ret = ie_getBackgroundColor(el);
                                } else {
                                        ret = el.currentStyle[prop];
                                }
                        }
                        return ret;
                },

                getStylePX : function(el, prop) {
                        var val = parseInt(DynarchDomUtils.getStyle(el, prop), 10);
                        if (isNaN(val))
                                val = 0;
                        return val;
                },

                getBorder : function(el) {
                        return { x: el.offsetWidth - el.clientWidth, y: el.offsetHeight - el.clientHeight };
                },

                getPadding : function(el) {
                        var dx, dy, getStyle = DynarchDomUtils.getStylePX;

                        dx = getStyle(el, "padding-left") + getStyle(el, "padding-right");
                        dy = getStyle(el, "padding-top") + getStyle(el, "padding-bottom");

                        return { x: dx, y: dy };
                },

                getPaddingAndBorder : function(el) {
                        var dx = 0, dy = 0, getStyle = DynarchDomUtils.getStylePX;

                        dx += getStyle(el, "border-left-width");
                        dx += getStyle(el, "border-right-width");
                        dy += getStyle(el, "border-top-width");
                        dy += getStyle(el, "border-bottom-width");

                        dx += getStyle(el, "padding-left");
                        dx += getStyle(el, "padding-right");
                        dy += getStyle(el, "padding-top");
                        dy += getStyle(el, "padding-bottom");

                        return { x: dx, y: dy };
                },

                getSelectionRange : function(input) {
                        var start, end;
                        if (is_ie) {
                                var range, isCollapsed, b;

                                range = document.selection.createRange();
                                isCollapsed = range.compareEndPoints("StartToEnd", range) == 0;
                                if (!isCollapsed)
                                        range.collapse(true);
                                b = range.getBookmark();
                                start = b.charCodeAt(2) - 2;

                                range = document.selection.createRange();
                                isCollapsed = range.compareEndPoints("StartToEnd", range) == 0;
                                if (!isCollapsed)
                                        range.collapse(false);
                                b = range.getBookmark();
                                end = b.charCodeAt(2) - 2;
                        } else {
                                start = input.selectionStart;
                                end = input.selectionEnd;
                        }
                        return { start: start, end: end };
                },

                setSelectionRange : function(input, start, end) {
                        if (end == null)
                                end = start;
                        if (start > end) {
                                var tmp = start;
                                start = end;
                                end = tmp;
                        }
                        if (typeof start == "object") {
                                end = start.end;
                                start = start.start;
                        }
                        if (is_ie) {
                                var range = input.createTextRange();
                                range.collapse(true);
                                range.moveStart("character", start);
                                range.moveEnd("character", end - start);
                                range.select();
                        } else {
                                input.setSelectionRange(start, end);
                        }
                },

                setOuterSize : function(el, x, y) {
                        //var pb = DynarchDomUtils.getBorder(el);
                        var pb = DynarchDomUtils.getPaddingAndBorder(el);
                        if (x != null && pb.x != NaN)
                                x -= pb.x;
                        if (y != null && pb.y != NaN)
                                y -= pb.y;
                        DynarchDomUtils.setInnerSize(el, x, y);
                },

                setInnerSize : function(el, x, y) {
                        try {
                                if (typeof x == "number" && x != NaN) x = Math.abs(x) + "px";
                                if (typeof y == "number" && y != NaN) y = Math.abs(y) + "px";
                                if (x != null && x != NaN && !(is_ie && x <= 0))
                                        el.style.width = x;
                                if (y != null && y != NaN && !(is_ie && y <= 0))
                                        el.style.height = y;
                        } catch(ex) {};
                },

                getOuterSize : function(el) {
                        return { x: el.offsetWidth, y: el.offsetHeight };
                },

                getInnerSize : function(el) {
                        var s = DynarchDomUtils.getOuterSize(el);
                        var pb = DynarchDomUtils.getPaddingAndBorder(el);
                        s.x -= pb.x;
                        s.y -= pb.y;
                        // amazing, eh?
                        return s;
                },

                // this includes the f'king padding :(
//              getInnerSize : function(el) {
//                      return { x: el.clientWidth, y: el.clientHeight };
//              },

                importCommonVars : function() {
                        return [ "var DOM=DynarchDomUtils",
                                 "AC=DOM.addClass",
                                 "DC=DOM.delClass",
                                 "CC=DOM.condClass",
                                 "CE=DOM.createElement",
                                 "ID=Dynarch.ID"
                                ].join(",");
                },

                // looks like this is the proper way to dispose elements, at least in IE.
                // to be efficient, MAKE SURE YOU DON'T KEEP ANY REFERENCES TO THESE ELEMENTS!
                trash : function(el) {
                        var gc = CE_CACHE._trash;
                        if (!gc) {
                                gc = CE_CACHE._trash = DynarchDomUtils.createElement(
                                        "div",
                                        { zIndex: -10000 },
                                        { className: "DYNARCH-GARBAGE-COLLECTOR" },
                                        document.body
                                );
                        }
                        if (el) {
                                gc.appendChild(el);
                                gc.innerHTML = "";
                        }
                        return gc;
                },

                createFromHtml : function(html) {
                        var div = this.trash();
                        div.innerHTML = html;
                        return div.firstChild;
                },

                swapNodes : function(n1, n2) {
                        var n1p = n1.parentNode, n1n = n1.nextSibling;
                        n2.parentNode.replaceChild(n1, n2);
                        n1p.insertBefore(n2, n1n);
                },

                scrollIntoView : function(el) {
                        var p = el.parentNode;

                        // we must find the nearest parent that has a scrollbar
                        while (p && (p.scrollHeight == p.clientHeight || p.scrollWidth == p.clientWidth || /table|tbody/i.test(p.tagName)))
                                p = p.parentNode;

                        if (p && p !== document.body) { // NEVER scroll the body!
                                // build array of parents (whoa!)
                                var a = [], tmp = p;
                                while (tmp) {
                                        a.push(tmp);
                                        tmp = tmp.parentNode;
                                }

                                // find relative pos
                                var t = 0, l = 0;
                                tmp = el;
                                while (tmp && tmp != p) {
                                        t += tmp.offsetTop;
                                        l += tmp.offsetLeft;
                                        tmp = tmp.offsetParent;
                                        if (a.contains(tmp)) {
                                                if (tmp != p) {
                                                        t -= p.offsetTop;
                                                        l -= p.offsetLeft;
                                                }
                                                break;
                                        }
                                }

                                // dlconsole.log("top: %d, left: %d, scroll: %o:%o", t, l, p.tagName, p.className);
                                // dlconsole.log("%d:%d %d:%d", p.scrollHeight, p.clientHeight, p.scrollWidth, p.clientWidth);

                                var b = t + el.offsetHeight, r = l + el.offsetWidth;

                                if (t < p.scrollTop)
                                        p.scrollTop = t;
                                if (t > p.scrollTop && b > p.scrollTop + p.clientHeight)
                                        p.scrollTop = b - p.clientHeight;

                                if (l < p.scrollLeft)
                                        p.scrollLeft = l;
                                if (l > p.scrollLeft && r > p.scrollLeft + p.clientWidth)
                                        p.scrollLeft = r - p.clientWidth;

                                // Dude! DOM sucks, I'm tellin' ya.
                        }
                },

                flash : function(el, timeout, steps) {
                        if (!steps)
                                steps = 3;
                        var timer = setInterval(function() {
                                el.style.visibility = (steps & 1) ? "hidden" : "";
                                --steps;
                                if (steps < 0)
                                        clearInterval(timer);
                        }, timeout || 150);
                },

                walk: function(el, f) {
                        if (!f(el))
                                for (var i = el.firstChild; i; i = i.nextSibling)
                                        if (i.nodeType == 1)
                                                DynarchDomUtils.walk(i, f);
                }

        };

        DynarchDomUtils.CE_CACHE = CE_CACHE;

})();

var $ = is_gecko
        ? document.getElementById.$(document)
        : function(id) {
                return document.getElementById(id);
        };

String.template = function() {
        var format = String.buffer.apply(this, arguments).get();
        return function(props) {
                return format.replace(/(.?)\$(\{.*?\}|[a-zA-Z0-9_]+)/g,
                                      function(s, p1, p2) {
                                              if (p1.charAt(0) == "\\")
                                                      return s.substr(1);
                                              if (p2.charAt(0) == "{")
                                                      p2 = p2.substr(1, p2.length - 2);
                                              eval("p2 = props." + p2);
                                              return p1 + p2;
                                      });
        };
};

String.buffer = (is_ie || is_khtml)
        ? function() {
                var a = [], idx = 0, f = function() {
                        for (var i = 0; i < arguments.length; ++i)
                                a[idx++] = arguments[i];
                        return f;
                };
                f.get = function() {
                        a = [ a.join("") ];
                        idx = 1;
                        return a[0];
                };
                if (arguments.length > 0)
                        f.apply(this, arguments);
                return f;
        } : function() {
                var str = "", f = function() {
                        str = str.concat.apply(str, arguments);
                        return f;
                };
                if (arguments.length > 0)
                        f.apply(this, arguments);
                f.get = function() { return str; };
                return f;
        };

if ((is_safari && !is_safari3) || is_ie5) {
        if (!String.prototype.__old_replace) {
                String.prototype.__old_replace = String.prototype.replace;
                String.prototype.replace = function(re, val) {
                        if (!(val instanceof Function))
                                return this.__old_replace(re, val);
                        else {
                                var str = this.slice(0), v, l, a;
                                while (a = re.exec(str)) {
                                        v = val.apply(null, a);
                                        l = a[0].length;
                                        re.lastIndex -= l - v.length;
                                        str = str.substr(0, a.index) + v + str.substr(a.index + l);
                                        if (!re.global)
                                                break;
                                }
                                return str;
                        }
                };
        }
}
