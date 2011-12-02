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

var DlKeyboard = {

	BACKSPACE   : 8,
	TAB         : 9,
	ENTER       : 13,
	ESCAPE      : 27,
        SPACE       : 32,
        DASH        : 45,
	PAGE_UP     : 33,
	PAGE_DOWN   : 34,
	END         : 35,
	HOME        : 36,
	ARROW_LEFT  : 37,
	ARROW_UP    : 38,
	ARROW_RIGHT : 39,
	ARROW_DOWN  : 40,
        INSERT      : 45,
	DELETE      : 46,
        F1          : 112,
        F2          : 113,
        F3          : 114,
        F4          : 115,
        F5          : 116,
        F6          : 117,
        F7          : 118,
        F8          : 119,
        F9          : 120,
        F10         : 121,
        F11         : 122,
        F12         : 123,

	parseKey : function(str) {
		var o = {}, m;
                str = str.toUpperCase();
		if ((m = /^([a-z]+)\s+\x27(.)\x27$/i.exec(str))) {
			o[m[1]] = true;
			o.key = m[2];
		} else if ((m = /^([a-z]+)-([a-z]+)\s+\x27(.)\x27$/i.exec(str))) {
			o[m[1]] = o[m[2]] = true;
			o.key = m[3];
		} else if ((m = /^([a-z]+)-([a-z]+)-([a-z]+)\s+\x27(.)\x27$/i.exec(str))) {
			o[m[1]] = o[m[2]] = o[m[3]] = true;
			o.key = m[4];
		}
		return o;
	},

        checkKey : function(ev, k) {
                if (typeof k == "string")
                        k = DlKeyboard.parseKey(k);
                return ( ((!k.CTRL  && !ev.ctrlKey)   ||  (k.CTRL    && ev.ctrlKey)) &&
			 ((!k.ALT   && !ev.altKey)    ||  (k.ALT     && ev.altKey)) &&
			 ((!k.SHIFT && !ev.shiftKey)  ||  (k.SHIFT   && ev.shiftKey)) &&
			 ev.keyStr.toUpperCase() == k.key.toUpperCase() );
        }

};

DlKeyboard.KEYS_CONTROL = [
	"BACKSPACE", "TAB", "DELETE", "ESCAPE", "ENTER",
	"PAGE_UP", "PAGE_DOWN", "END", "HOME",
	"ARROW_LEFT", "ARROW_UP", "ARROW_RIGHT", "ARROW_DOWN"
].keys_map(DlKeyboard).toHash(true);

DlKeyboard.KEYS_MOVE = [
        "ARROW_LEFT", "ARROW_UP", "ARROW_RIGHT", "ARROW_DOWN"
].keys_map(DlKeyboard).toHash(true);

DlKeyboard.KEYS_MOVE_PREV = [
        "ARROW_LEFT", "ARROW_UP"
].keys_map(DlKeyboard).toHash(true);
