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

DEFINE_CLASS("DlEntry", DlContainer, function(D, P, DOM) {

        var CE = DOM.createElement;

        D.FIXARGS = function(args) {
                args.tagName = "table";
                this._isTextArea = args.type == "textarea";
        };

        D.DEFAULT_EVENTS = [ "onChange",
                             "onKey-ENTER",
                             "onKey-ESCAPE",
                             "onValidationError",
                             "onValidation",
                             "onPaste",
                             "onCopy",
                             "onCut" ];

        D.DEFAULT_ARGS = {
                _domType    : [ "type"       , "text" ],
                _value      : [ "value"      , null ],
                _size       : [ "size"       , null ],
                _rows       : [ "rows"       , null ],
                _readonly   : [ "readonly"   , false ],
                _emptyText  : [ "emptyText"  , "" ],
                _emptyValue : [ "emptyValue" , "" ],
                _width      : [ "width"      , null ],
                _name       : [ "name"       , null ],
                _validators : [ "validators" , [] ],
                _allowEmpty : [ "allowEmpty" , null ],
                _focusable  : [ "focusable"  , 2 ],
                _maxlen     : [ "maxlength"  , null ],
                _noSelect   : [ "noSelect"   , false ],
                _trim       : [ "trim"       , false ],
                _noWrap     : [ "noWrap"     , false ] // only for textareas
        };

        P.validate = function(val) {
                if (val == null)
                        val = this.getValue(true);
                if (this._allowEmpty != null) {
                        if (!/\S/.test(val)) {
                                this.condClass(!this._allowEmpty, "DlEntry-ValidationError");
                                this.applyHooks("onValidation", [ !this._allowEmpty ]);
                                return this._allowEmpty;
                        }
                }
                var a = this._validators, i, v, err = false;
                for (i = 0; i < a.length; ++i) {
                        v = a[i];
                        if (!v.ok(val)) {
                                err = v.getError() || true;
                                break;
                        }
                }
                if (v && !err)
                        this.setValue(v.getLastVal(), true);
                this.validationError = err;
                if (!this._noSelect && this._focused && !this.readonly() && this._domType != "textarea")
                        this.select();
                // alert(err + " \n " + this._validators.length);
                this.condClass(err, "DlEntry-ValidationError");
                this.applyHooks("onValidation", [ err ]);
                if (err) {
                        this.setInvalidTooltip(err.message);
                        this.applyHooks("onValidationError", [ err ]);
                }
                return !err;
        };

        P.setInvalidTooltip = function(tt) {
                this._invalidTooltip.setTooltip(tt);
        };

        P.timerFocus = function(timeout) {
                return this.focus.clearingTimeout(timeout || 10, this);
        };

        P.select = function() {
                try {
                        if (is_gecko)
                                this.setSelectionRange(0, this.getValue(true).length);
                        else
                                this.getInputElement().select();
                } catch(ex) {}
        };

        P.focus = function() {
                this.getInputElement().focus();
                if (!this._noSelect && !this.readonly() && this._domType != "textarea")
                        this.select();
        };

        P.blur = function() {
                this.getInputElement().blur();
        };

        function element_focus() {
                this.addClass("DlEntry-Focus");
                this._focused = true;
                D.BASE.focus.call(this);
                if (this._isEmpty) {
                        this.getInputElement().value = "";
                        this.delClass("DlEntry-empty");
                        this._isEmpty = false;
                }
        };

        function element_blur() {
                this.delClass("DlEntry-Focus");
                this._focused = false;
                D.BASE.blur.call(this);
                this.__setEmpty();
        };

        function element_change() {
                if (!this.destroyed) {
                        this.__setEmpty();
                        this.callHooks("onChange");
                }
        };

        P.__setEmpty = function(value) {
                if (value == null)
                        value = this.getInputElement().value;
                this._isEmpty = this.__checkEmpty(value);
                if (!this._isEmpty) {
                        this.delClass("DlEntry-empty");
                } else if (!this._focused) {
                        this.addClass("DlEntry-empty");
                        this.getInputElement().value = "";
                } else {
                        this.getInputElement().value = value;
                }
                return this._isEmpty;
        };

        P.__checkEmpty = function(value) {
                if (value == null)
                        value = this.getInputElement().value;
                return value === "";
        };

        P._createElement = function() {
                D.BASE._createElement.apply(this, arguments);
                var el = this.getElement();
                el.appendChild(DlElementCache.get("TBODY_RC"));
                el.cellSpacing = el.cellPadding = el.border = 0;
                el = el.rows[0].cells[0];
                el.className = "DlEntry-cell";
                var input = this._isTextArea
                        ? document.createElement("textarea")
                        : input = document.createElement("input");
                input.id = this.id + "-input";
                input.setAttribute("autocomplete", "off", 1);
                if (this._noWrap)
                        input.setAttribute("wrap", "off");
                if (this._isTextArea) {
                        if (this._rows)
                                input.rows = this._rows;
                }
                if (this._maxlen != null)
                        input.setAttribute("maxlength", this._maxlen);
                switch (this._domType) {
                    case "password":
                    case "file":
                    case "hidden":
                        input.type = this._domType;
                }
                if (is_gecko && gecko_version < 1.9 && !this._no_gecko_bug)
                        el = CE("div", null, { className: "Gecko-Bug-226933" }, el);
                el = CE("div", { position: "relative", overflow: "hidden" }, null, el); // XXX: this is becoming quite sucky!
                if (this._emptyText) {
                        CE("label", null, {
                                htmlFor   : this.id + "-input",
                                className : "DlEntry-emptyText",
                                innerHTML : this._emptyText.htmlEscape()
                        }, el);
                }
                el.appendChild(input);
                this.refNode("_invalidTooltip", new DlWidget({
                        className  : "DlEntry-invalidIcon",
                        parent     : this,
                        appendArgs : el
                }));
        };

        P.getInputElement = function() {
                return this.getElement().getElementsByTagName(this._isTextArea ? "textarea" : "input")[0];
        };

        P.getContentElement = P.getInputElement; // ALIAS

        P.setIfEmpty = function(value, nocall) {
                if (this._isEmpty && value)
                        this.setValue(value, nocall);
        };

        P.isEmpty = function() {
                return this.__checkEmpty();
        };

        P.setValue = function(value, nocall) {
                if (!this.__setEmpty(value)) {
                        if (this._maxlen != null)
                                value = String(value).substr(0, this._maxlen);
                        var el = this.getInputElement();
                        el.value = value;
                        el.defaultValue = value;
                }
                if (!nocall)
                        this.callHooks("onChange");
        };

        P.isDirty = function() {
                var el = this.getInputElement();
                return el.value != el.defaultValue;
        };

        P.clear = function(nocall) {
                this.setValue("", nocall);
                return this;
        };

        P.getValue = function(real) {
                var val = !real && this.isEmpty() ? this._emptyValue : this.getInputElement().value;
                if (this._trim && typeof val == "string")
                        val = val.trim();
                return val;
        };

        P.getSelectionRange = function() {
                return DOM.getSelectionRange(this.getInputElement());
        };

        P.setSelectionRange = function(start, end) {
                DOM.setSelectionRange(this.getInputElement(), start, end);
        };

        P.moveEOF = function() {
                var l = this.getValue(true).length;
                this.setSelectionRange(l, l);
        };

        P.moveBOF = function() {
                this.setSelectionRange(0, 0);
        };

        P.collapse = function(atStart) {
                var p = this.getSelectionRange();
                p = atStart ? p.start : p.end;
                this.setSelectionRange(p, p);
        };

        P.insertReplacingSelection = function(text, select) {
                var r = this.getSelectionRange();
                var v = this.getValue();
                this.setValue(v.substr(0, r.start) + text + v.substr(r.end));
                this.setSelectionRange(r.start, select ? r.start + text.length : r.start);
        };

        function onChange() {
                this.validate();
        };

        function onKeyPress(ev) {
                //if (ev.keyCode in DlKeyboard.KEYS_CONTROL)
                //this.__setEmpty();
                this._isEmpty = false;
                if (ev.keyCode == DlKeyboard.ENTER) {
                        this.applyHooks("onKey-ENTER", [ ev ]);
                } else if (ev.keyCode == DlKeyboard.ESCAPE) {
                        this.applyHooks("onKey-ESCAPE", [ ev ]);
                }
        };

        P.initDOM = function() {
                D.BASE.initDOM.call(this);
                var input = this.getInputElement();
                DOM.addEvent(input, { focus   : this._on_element_focus = element_focus.$(this),
                                      blur    : this._on_element_blur = element_blur.$(this),
                                      change  : this._on_element_change = element_change.clearingTimeout(10, this) });
                this.addEventListener({ onChange   : onChange,
                                        onKeyPress : onKeyPress });
                if (this._value != null)
                        this.setValue(this._value, true);
                else
                        this.clear(true);
                if (this._width != null)
                        input.style.width = this._width;
                else if (this._size != null)
                        // input.size = this._size;
                        // input.style.width = this._size * 15 + "px";
                        this.setSize({ x: this._size * 9 + 7 - this._size });
                if (this._name != null)
                        input.name = this._name;
                this.readonly(this._readonly);
        };

        P.readonly = function(readonly) {
                var input = this.getInputElement();
                if (readonly != null) {
                        input.readOnly = readonly;
                        readonly
                                ? input.setAttribute("readonly", true, 1)
                                : input.removeAttribute("readonly");
                        this.condClass(readonly, "DlEntry-Readonly");
                }
                return input.getAttribute("readonly");
        };

        P.disabled = function(v, force) {
                var isDisabled = D.BASE.disabled.call(this, v, force);
                if (v != null)
                        this.getInputElement().disabled = !!v;
                return isDisabled;
        };

        P.setSize = P.setOuterSize = function(size) {
                var input = this.getInputElement()
                , x = size.x, y = size.y
                , tpb = DOM.getPaddingAndBorder(this.getElement())
                , ipb = DOM.getPaddingAndBorder(input)
                , sb = this._btn ? this._btn.getSize().x : 0;
                if (sb) {
                        DOM.setOuterSize(input, size.x - tpb.x - ipb.x - sb + 2); // XXX: fuzz factor = 2
                } else {
                        if (x != null)
                                x -= ipb.x + 4;
                        if (y != null)
                                y -= ipb.y + 4;
                        if (this._domType != "textarea")
                                y = null;
                        DOM.setInnerSize(input, x, y);
                        if (x != null) {
                                x += 8;
                                DOM.setInnerSize(this.getElement(), x);
                        }
                }
        };

        P._makeButton = function(label, iconClass, className, classes) {
                if (!classes && !className) {
                        className = "DlEntry-dropDownBtn";
                        classes = {
                                hover  : "DlEntry-dropDownBtn-hover",
                                active : "DlEntry-dropDownBtn-active"
                        };
                }
                var td = CE("td", null, null, this.getElement().rows[0]);
                return this._btn = new DlAbstractButton({
                        parent     : this,
                        appendArgs : td,
                        label      : label,
                        iconClass  : iconClass,
                        className  : className,
                        classes    : classes
                });
        };

});
