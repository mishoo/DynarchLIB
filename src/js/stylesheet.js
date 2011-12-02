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

DEFINE_CLASS("DlStyleSheet", DlEventProxy, function(D, P, DOM) {

        // var DEFAULT_EVENTS = [ "onChange", "onInsert", "onRemove" ];

        D.CONSTRUCT = function() {
                this._init();
        };

        function cleanup() {
                DOM.trash(this._el);
                this._s = null; // break references
                this._el = null;
        };

        P.insertRule = function(sel, style, index) {
                var s = this._s;
                if (index == null)
                        index = this.getRules().length;
                if (typeof style == "object") {
                        var tmp = [];
                        for (var i in style)
                                tmp.push(i + ":" + style[i]);
                        style = tmp.join(";");
                } else if (style instanceof Array) {
                        style = style.join(";");
                }
                if (is_ie) {
                        sel = sel.split(/\s*,\s*/);
                        if (sel.length == 1) {
                                s.addRule(sel, style, index);
                        } else {
                                var rule_id = DOM.ID();
                                var a = this._ier[rule_id] = [];
                                for (var i = 0; i < sel.length; ++i) {
                                        s.addRule(sel[i], style, index + i);
                                        a.push(this.getRules()[index + i]);
                                }
                                return rule_id;
                        }
                } else {
                        s.insertRule(sel + "{" + style + "}", index);
                }
                return this.getRules()[index];
        };

        P.deleteRule = function(rule) {
                if (is_ie && typeof rule == "string") {
                        this._ier[rule].foreach(this.deleteRule.$(this));
                        delete this._ier[rule];
                } else {
                        var rules = this.getRules();
                        for (var i = rules.length; --i >= 0;) {
                                if (rules[i] === rule) {
                                        if (is_ie) {
                                                this._s.removeRule(i);
                                                // XXX: MSDN states that the page isn't refreshed:
                                                // http://msdn.microsoft.com/en-us/library/ms531195(VS.85).aspx
                                                // if (!this.disabled())
                                                //        this.refresh();
                                        } else {
                                                this._s.deleteRule(i);
                                        }
                                        return i;
                                }
                        }
                }
        };

        P.modifyRule = function(rule, changes) {
                if (is_ie && typeof rule == "string") {
                        this._ier[rule].foreach(function(r) {
                                this.modifyRule(r, changes);
                        }, this);
                } else {
                        for (var i in changes) {
                                rule.style[i] = changes[i];
                        }
                }
        };

        // hope this works...
        P.refresh = function() {
                var v = this.disabled();
                this.disabled(!v);
                this.disabled(v);
        };

        P.getRules = function() {
                return is_ie ? this._s.rules : this._s.cssRules;
        };

        P.disabled = function(dis) {
                var s = is_ie ? this._s : this._el;
                if (dis != null) {
                        s.disabled = dis;
                }
                return !!s.disabled;
        };

        P._init = function() {
                if (is_ie)
                        this._ier = {};
                this._el = DOM.createElement("style", null, { type: "text/css" }, document.getElementsByTagName("head")[0]);
                this._s = document.styleSheets[document.styleSheets.length - 1];
                this.addEventListener("onDestroy", cleanup);
        };

});
