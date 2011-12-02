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

// @require widget.js

DEFINE_CLASS("DlUploadEntry", DlWidget, function(D, P, DOM) {

        D.DEFAULT_EVENTS = [ "onUploadStart", "onUploadEnd", "onChange" ];

        D.DEFAULT_ARGS = {
                _url    : [ "url", null ],
                _files  : [ "files", [ "file" ] ],
                _params : [ "params", null ]
        };

        D.BEFORE_BASE = function() {
                if (!(this._files instanceof Array))
                        this._files = [ this._files ];
        };

        P._createElement = function() {
                D.BASE._createElement.call(this);
                var iframe = DOM.createElement("iframe", null, {
                        frameBorder       : 0,
                        marginHeight      : 0,
                        marginWidth       : 0,
                        allowTransparency : true,
                        src               : is_ie ? "javascript:'';" : "about:blank"
                }, this.getElement());
                this.refNode("_iframe", iframe);
        };

        P.init = function() {
                var HTML = String.buffer(
                        "<html style='margin: 0; padding: 0; overflow: hidden; height: 100%;'>",
                        "<head>",
                        "<link type='text/css' rel='stylesheet' href='",
                        Dynarch.getFileURL("css/uploadentry.css"), "' />",
                        "</head>",
                        "<body>",
                        "<form action='",
                        this._url,
                        "' method='POST' encoding='multipart/form-data'>",
                        "<input type='hidden' name='_uploaderID' value='", this.getWidgetId(), "' />"
                );
                var p = this._params;
                if (p) {
                        if (p instanceof Array)
                                p = p.toHash("");
                        for (var i in p)
                                HTML("<input type='hidden' name='", i, "' value='", p[i], "' />");
                }
                this._files.foreach(function(name) {
                        HTML("<label class='upload'><input type='file' name='", name, "' /></label>");
                });
                HTML("</form></body></html>");
                var win = this._iframe.contentWindow;
                var doc = win.document;
                doc.open();
                doc.write(HTML.get());
                doc.close();

                this.refNode("_win", win);
                this.refNode("_doc", doc);
                this.refNode("_form", doc.getElementsByTagName("form")[0]);
                this._form.method = "POST";
                this._form.encoding = "multipart/form-data";
                var change_handler = onUploadChange.$(null, this);
                this._files.foreach(function(name) {
                        var field = this._form.elements.namedItem(name);
                        field.onchange = change_handler;
                        field.parentNode.onmousemove = onMouseMove;
                }, this);
        };

        P.setParam = function(name, val) {
                if (typeof name == "string") {
                        var el = this.getField(name);
                        if (!el) {
                                el = this._doc.createElement("input");
                                el.type = "hidden";
                                el.name = name;
                                this._form.appendChild(el);
                        }
                        el.value = val;
                } else
                        for (var i in name)
                                this.setParam(i, name[i]);
        };

        P.getParam = function(name) {
                var el = this.getField(name);
                return el && el.value;
        };

        P.getField = function(name) {
                return this._form.elements.namedItem(name);
        };

        P.submit = function() {
                this.callHooks("onUploadStart");
                this._form.submit();
        };

        D.finishUpload = function(upload) {
                if (!(upload instanceof DlUploadEntry))
                        upload = DlWidget.getById(upload);
                if (upload) {
                        upload.init();
                        upload.applyHooks("onUploadEnd", Array.$(arguments, 1));
                }
                else
                        // fixme: should we do this?
                        throw ("No such uploader: " + upload);
        };

        function onUploadChange(obj) {
                obj.applyHooks("onChange", [ this, this.name, this.value ]);
        };

        function onMouseMove(ev) {
                if (is_ie)
                        ev = this.ownerDocument.parentWindow.event;
                this.firstChild.style.right = 30 - ev.clientX + "px";
        };

});
