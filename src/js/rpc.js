// @require eventproxy.js
// @require singleton.js
// @require system.js

(function() {

	var BASE = DlRPC.inherits(DlEventProxy);
	function DlRPC(args) {
		if (args) {
			DlEventProxy.call(this);
			DlRPC.setDefaults(this, args);
			this.registerEvents(DEFAULT_EVENTS);
			if (this.method == null)
				this.method = this.data != null ? "POST" : "GET";
			this._timeoutID = 0;
		}
	};

	eval(Dynarch.EXPORT("DlRPC"));

        var DEFAULT_EVENTS = [ "onStart", "onStop", "onTimeout" ];

	D.DEFAULT_ARGS = {
		url      : [ "url"      , null ],
		args     : [ "args"     , null ],
		callback : [ "callback" , null ],
		method   : [ "method"   , null ],
		data     : [ "data"     , null ],
		timeout  : [ "timeout"  , null ]
	};

	function onState(req) {
		if (req.readyState == 4) {
			delete req['onreadystatechange'];
			this._request = null;
			if (this._timeoutID) {
				clearTimeout(this._timeoutID);
				this._timeoutID = null;
			}
                        var args;
                        try {
                                args = {
                                        success    : req.status == 200,
                                        status     : req.status,
                                        statusText : req.statusText,
                                        timeout    : false,
                                        xml        : req.responseXML,
                                        text       : req.responseText
                                };
                        } catch(ex) { /* firefox croaks with "statusText not available" on abort() */ };
			DlSystem().applyHooks("on-rpc-stop", [ this, args, req ]);
			this.applyHooks("onStop", [ this, args, req ]);
			if (this.callback)
				this.callback(args);
		}
	};

	function onTimeout(req) {
		this._request = null;
		req.abort();
		DlSystem().applyHooks("on-rpc-timeout", [ this, req ]);
		this.applyHooks("onTimeout", [ this, req ]);
		if (this.callback)
			this.callback({ success: false, timeout: true });
	};

        P.abort = function() {
                this._request.abort();
        };

	P.call = function(newArgs) {
		if (newArgs != null)
			Dynarch.merge(this, newArgs);
		var req, urlargs = false, i;
		if (window.XMLHttpRequest) {
			req = new XMLHttpRequest();
		} else if (window.ActiveXObject) {
			req = new ActiveXObject("Microsoft.XMLHTTP");
		} else
			throw "Browser does not support XMLHttpRequest";
		this._request = req;
		req.onreadystatechange = onState.$(this, req);
		var args = this.args;
		if (args) {
			urlargs = [];
			for (i in args)
				urlargs.push(escape(i) + "=" + escape(args[i]));
			if (urlargs.length == 0)
				urlargs = false;
			else
				urlargs = urlargs.join("&");
		}
		var url = this.url;

		switch (this.method) {
		    case "POST":
			var data = this.data;
			if (urlargs && data)
				url += "?" + urlargs; // send arguments by GET. ;-)
			req.open("POST", url, true);
			if (!data) {
				req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
				this._start(urlargs);
			} else {
				if (typeof data != "string") {
					data = DlJSON.encode(data);
					req.setRequestHeader("Content-Type", "text/javascript; charset=UTF-8");
				}
				this._start(data);
			}
			break;

		    case "GET":
			if (urlargs)
				url += "?" + urlargs;
			req.open("GET", url, true);
			this._start(null);
			break;
		}
	};

	P._start = function(data) {
		if (this.timeout)
			this._timeoutID = onTimeout.delayed(this.timeout, this, this._request);
		else
			this._timeoutID = 0;
		DlSystem().applyHooks("on-rpc-start", [ this ]);
		this.applyHooks("onStart", [ this ]);
		this._request.send(data);
	};

})();
