//> This file is part of DynarchLIB, an AJAX User Interface toolkit
//> http://www.dynarchlib.com/
//>
//> Copyright (c) 2004-2011, Mihai Bazon, Dynarch.com.  All rights reserved.
//>
//> Redistribution and use in source and binary forms, with or without
//> modification, are permitted provided that the following conditions are
//> met:
//>
//>     * Redistributions of source code must retain the above copyright
//>       notice, this list of conditions and the following disclaimer.
//>
//>     * Redistributions in binary form must reproduce the above copyright
//>       notice, this list of conditions and the following disclaimer in
//>       the documentation and/or other materials provided with the
//>       distribution.
//>
//>     * Neither the name of Dynarch.com nor the names of its contributors
//>       may be used to endorse or promote products derived from this
//>       software without specific prior written permission.
//>
//> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
//> EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//> IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
//> PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE
//> FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
//> CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
//> SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//> INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
//> CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//> ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
//> THE POSSIBILITY OF SUCH DAMAGE.

// @require exception.js

DEFINE_EXCEPTION("DlValidatorException");

DlValidatorException.MISMATCH = 1;
DlValidatorException.TOO_SMALL = 2;
DlValidatorException.TOO_BIG = 3;

DEFINE_CLASS("DlValidator", null, function(D, P){

        D.CONSTRUCT = function(callback) {
	        if (callback) {
                        if (typeof callback == "string")
                                callback = D[callback];
		        this._callback = callback;
		        this._args = arguments.length > 1
			        ? Array.$(arguments, 1)
			        : null;
	        }
        };

	P.ok = function(data) {
		if (typeof this._lastData != "undefined" && this._lastData === data)
			return true;
		try {
			var args = [ data ].concat(this._args || Array.$(arguments, 1));
			var val = this._callback.apply(this, args);
			this._lastData = data;
			this._lastValue = val;
			return true;
		} catch(ex) {
			if (ex instanceof DlValidatorException) {
				this._error = ex;
				return false;
			} else
				throw ex;
		}
	};

	P.getLastVal = function() { return this._lastValue; };
	P.getLastData = function() { return this._lastData; };
	P.getError = function() { return this._error; };

	D.Number = function(data, minVal, maxVal, integer, decimals) {
		data = data.replace(/\s/g, "");
		var n = new Number(data);
		if (isNaN(n))
			throw new DlValidatorException("Value must be numeric",
						       DlValidatorException.MISMATCH);
		if (integer && n != Math.round(n))
			throw new DlValidatorException("Value must be an integer",
						       DlValidatorException.MISMATCH);
		if (minVal != null && n < minVal)
			throw new DlValidatorException("Value must be bigger than " + minVal,
						       DlValidatorException.TOO_SMALL);
		if (maxVal != null && n > maxVal)
			throw new DlValidatorException("Value must be smaller than " + maxVal,
						       DlValidatorException.TOO_BIG);
		if (decimals)
			n = n.toFixed(decimals);
		return n;
	};

        // very dumb Email validator
        D.Email = function(data) {
                data = data.trim();
                if (!/^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i.test(data)) {
                        throw new DlValidatorException("That doesn't look like an email address", DlValidatorException.MISMATCH);
                }
                return data;
        };

	// very very simple URL validator
	D.URL = function(data, args) {
		if (!args)
			args = {};
                data = data.trim();
		if (!/^(https?|ftps?):\x2f\x2f/.test(data)) {
                        if (/^([a-z0-9_-]+\.)+[a-z]+$/i.test(data)) {
                                if (!/^www\./.test(data))
                                        data = "www." + data;
                                return "http://" + data + "/";
                        }
			throw new DlValidatorException("Value must be an absolute URL",
						       DlValidatorException.MISMATCH);
                }
		return data;
	};

        function findMonth(str) {
                str = str.toLowerCase();
                function f(a) {
                        return a.foreach(function(n, i){
                                if (n.toLowerCase().indexOf(str) == 0)
                                        $RETURN(i);
                        });
                };
                var mo = f(DlTEXTS._date_shortMonthNames) || f(DlTEXTS._date_monthNames);
                if (mo != null)
                        mo++;
                return mo;
        };

        D.Date = function(data, format, monthFirst) {

                if (!/\S/.test(data))
                        return "";

                if (!format)
                        format = "%Y-%m-%d";

                data = data.replace(/^\s+/, "").replace(/\s+$/, "");

                var today = new Date();
                var yr = null, mo = null, da = null, h = null, m = null, s = null;

                // deal with time first

                var b = data.match(/([0-9]{1,2}):([0-9]{1,2})(:[0-9]{1,2})?\s*(am|pm)?/i);
                if (b) {
                        h = parseInt(b[1], 10);
                        m = parseInt(b[2], 10);
                        s = b[3] ? parseInt(b[3].substr(1), 10) : 0;
                        data = data.substring(0, b.index) + data.substr(b.index + b[0].length);
                        if (b[4]) {
                                if (b[4].toLowerCase() == "pm" && h < 12)
                                        h += 12;
                                else if (b[4].toLowerCase() == "am" && h >= 12)
                                        h -= 12;
                        }
                }

                var a = data.split(/\W+/);
                var mod = [];
                a.foreach(function(v){
                        if (/^[0-9]{4}$/.test(v)) {
                                yr = parseInt(v, 10);
                                if (!mo && !da && monthFirst == null)
                                        monthFirst = true;
                        } else if (/^[0-9]{1,2}$/.test(v)) {
                                v = parseInt(v, 10);
                                if (v >= 60) {
                                        yr = v;
                                } else if (v >= 0 && v <= 12) {
                                        mod.push(v);
                                } else if (v >= 1 && v <= 31) {
                                        da = v;
                                }
                        } else {
                                // maybe month name?
                                mo = findMonth(v);
                        }
                });

                if (mod.length >= 2) {
                        // quite nasty
                        if (monthFirst) {
                                if (!mo)
                                        mo = mod.shift();
                                if (!da)
                                        da = mod.shift();
                        } else {
                                if (!da)
                                        da = mod.shift();
                                if (!mo)
                                        mo = mod.shift();
                        }
                } else if (mod.length == 1) {
                        if (!da)
                                da = mod.shift();
                        else if (!mo)
                                mo = mod.shift();
                }

                if (!yr)
                        yr = mod.length > 0 ? mod.shift() : today.getFullYear();

                if (yr < 30)
                        yr += 2000;
                else if (yr < 99)
                        yr += 1900;

                if (!mo)
                        mo = today.getMonth() + 1;

                // console.log("yr: %o, mo: %o, da: %o, h: %o, m: %o, s: %o, mod: %o", yr, mo, da, h, m, s, mod);

                if (yr && mo && da) {
                        this._date = new Date(yr, mo - 1, da, h, m, s);
                } else {
                        this._date = null;
                        throw new DlValidatorException("Can't figure out this date",
                                                       DlValidatorException.MISMATCH);
                }

                return this._date.print(format);
        };

});
