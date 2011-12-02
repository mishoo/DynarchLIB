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

DlJSON = {

	RE_strings : /(\x22(\\.|[^\x22\\])*\x22|\x27(\\.|[^\x27\\])*\x27)/g,
	RE_forbid  : /([\n;()+=\x2f*-])/g,
	//RE_forbid  : /([;()+=\x2f*.-])/g,

	encode : function(obj) {
		var tmp, i;
                if (obj == null) {
			tmp = "null";
		} else if (obj.dynarchlib_toJSON) {
                        tmp = obj.dynarchlib_toJSON();
                } else if (obj instanceof Array) {
			tmp = "[" + obj.map(DlJSON.encode).join(",") + "]";
		} else if (obj instanceof Date) {
			tmp = DlJSON.encode(obj.toUTCString());
		} else if (typeof obj == "object") {
			tmp = [];
			for (i in obj)
				tmp.push(DlJSON.encode(i) + ":" + DlJSON.encode(obj[i]));
			tmp = "{" + tmp.join(",") + "}";
		} else if (typeof obj == "string") {
			tmp = '"' + obj.replace(/\x5c/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/\t/g, "\\t").replace(/\x22/g, "\\\"") + '"';
		} else
			tmp = obj.toString();
		return tmp;
	},

        encodeIndented: function(obj, level) {
                if (level == null) level = 2;
                var current = 0;
                function with_indent(cont) {
                        // return ++indent,cont(indent--); // interesting way to minify this?
                        ++current;
                        cont = cont();
                        --current;
                        return cont;
                };
                function indent(line) {
                        return " ".repeat(current * level) + line;
                };
                return function rec(obj) {
		        var tmp;
                        if (obj == null) {
			        tmp = "null";
		        } else if (obj.dynarchlib_toJSON) {
                                tmp = obj.dynarchlib_toJSON();
                        } else if (obj instanceof Array) {
			        tmp = "[ " + obj.map(rec).join(", ") + " ]";
		        } else if (obj instanceof Date) {
			        tmp = rec(obj.toUTCString());
		        } else if (typeof obj == "object") {
			        tmp = with_indent(function(){
                                        var tmp = [];
                                        for (var i in obj) tmp.push(rec(i) + " : " + rec(obj[i]));
                                        return tmp.map(indent).join(",\n") + "\n";
                                });
			        tmp = "{\n" + tmp + indent("}");
		        } else if (typeof obj == "string") {
			        tmp = '"' + obj.replace(/\x5c/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/\t/g, "\\t").replace(/\x22/g, "\\\"") + '"';
		        } else
			        tmp = obj.toString();
		        return tmp;
                }(obj);
        },

	decode : function(str, safe) {
		if (!safe) {
                        str = str.trim();
			var tmp = str.replace(DlJSON.RE_strings, "");
			if (DlJSON.RE_forbid.test(tmp))
				throw new DlSecurityException("Character " + RegExp.$1 + " not allowed in JSON input!");
		}
		try {
			return Dynarch.evalClean(str);
		} catch(ex) {
			throw new DlDataException("Malformed data in JSON input: " + ex);
		}
	},

	domToObject : function(el) {
		var obj = {};
		var text = String.buffer();
		for (var i = el.firstChild; i; i = i.nextSibling) {
			if (i.nodeType == 1) {
				var o = DlJSON.domToObject(i), tag = i.nodeName;
				if (!(tag in obj)) {
					obj[tag] = o;
				} else {
					if (!(obj[tag] instanceof Array))
						obj[tag] = [ obj[tag] ];
					obj[tag].push(o);
				}
			} else if (i.nodeType == 3) {
				text(i.nodeValue);
			}
		}
		obj.$text = text.get();
		return obj;
	}

};
