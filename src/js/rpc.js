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

// @require eventproxy.js
// @require singleton.js
// @require system.js

DEFINE_CLASS("DlRPC", DlEventProxy, function(D, P) {

	D.CONSTRUCT = function() {
		if (this.method == null)
			this.method = this.data != null ? "POST" : "GET";
		this._timeoutID = 0;
	};

        D.DEFAULT_EVENTS = "onStart onStop onTimeout onUploadProgress onUploadDone onUploadError onUploadAbort".qw();

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
			Object.merge(this, newArgs);
		var req, urlargs = false, i;
		if (window.XMLHttpRequest) {
			req = new XMLHttpRequest();
		} else if (window.ActiveXObject) {
			req = new ActiveXObject("Microsoft.XMLHTTP");
		} else
			throw "Browser does not support XMLHttpRequest";
		this._request = req;
		req.onreadystatechange = onState.$(this, req);
                if (req.upload) {
                        req.upload.addEventListener("progress", this.$("callHooks", "onUploadProgress"), false);
                        req.upload.addEventListener("load", this.$("callHooks", "onUploadDone"), false);
                        req.upload.addEventListener("error", this.$("callHooks", "onUploadError"), false);
                        req.upload.addEventListener("abort", this.$("callHooks", "onUploadAbort"), false);
                }
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
                                        this.data = data;
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

});
