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
