DlJSON = {

	RE_strings : /(\x22(\\.|[^\x22\\])*\x22|\x27(\\.|[^\x27\\])*\x27)/g,
	RE_forbid  : /([\n;()+=\x2f*.-])/g,
	//RE_forbid  : /([;()+=\x2f*.-])/g,

	encode : function(obj) {
		var tmp, i;
		if (obj instanceof Array) {
			tmp = [ "[", obj.map(DlJSON.encode).join(","), "]" ].join("");
		} else if (obj instanceof Date) {
			tmp = DlJSON.encode(obj.toUTCString());
		} else if (obj == null) {
			tmp = "null";
		} else if (typeof obj == "object") {
			tmp = [];
			for (i in obj)
				tmp.push([ DlJSON.encode(i), ":", DlJSON.encode(obj[i]) ].join(""));
			tmp = [ "{", tmp.join(","), "}" ].join("");
		} else if (typeof obj == "string") {
			tmp = [ '"', obj.replace(/\x5c/g, "\\\\").replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/\x22/g, "\\\""), '"' ].join("");
		} else
			tmp = obj.toString();
		return tmp;
	},

	decode : function(str, safe) {
		str = str.trim();
		if (!safe) {
			var tmp = str.replace(DlJSON.RE_strings, "");
			if (DlJSON.RE_forbid.test(tmp))
				throw new DlSecurityException("Character " + RegExp.$1 + " not allowed in JSON input!");
		}
		try {
			var val;
			eval([ "val=", str ].join(""));
			return val;
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
