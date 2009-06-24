// @require eventproxy.js

(function(){

        // var DEFAULT_EVENTS = [ "onChange", "onInsert", "onRemove" ];

        DlStyleSheet.inherits(DlEventProxy);
        function DlStyleSheet() {
                DlEventProxy.call(this);
                this._init();
        };

        eval(Dynarch.EXPORT("DlStyleSheet", true));

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
                                var rule_id = ID();
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
                this._el = CE("style", null, { type: "text/css" }, document.getElementsByTagName("head")[0]);
                this._s = document.styleSheets[document.styleSheets.length - 1];
                this.addEventListener("onDestroy", cleanup);
        };

})();
