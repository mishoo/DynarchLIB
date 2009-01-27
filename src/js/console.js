// @if DEBUG
// @require jslib.js

function DlConsole(){
        this._messages = [];
        DlConsole.INSTANCE = this;
};

DlConsole.prototype = {

        log : function(str) {
                str = str.printf.apply(str, Array.$(arguments, 1));
                this._addMsg({ str: str });
        },

        line : function() {
                this._addMsg({ str: "&nbsp;", cls: "sep" });
        },

        CC : function(text, cn) {
                var div = this.win.document.createElement("div");
                div.className = cn || "msg";
                div.innerHTML = text;
                this.win.document.body.appendChild(div);
                this.win.scrollTo(0, div.offsetTop + div.offsetHeight);
                if (this._last)
                        DynarchDomUtils.delClass(this._last, "current");
                DynarchDomUtils.addClass(div, "current");
                this._last = div;
        },

        _addMsg : function(msg) {
                this._init();
                if (!this.win)
                        // delay
                        this._messages.push(msg);
                else
                        this.CC(msg.str, msg.cls);
        },

        _init : function() {
                if (!this.win) {
                        window.open(Dynarch.getFileURL("html/dlconsole.html"),
                                    "DlConsole",
                                    "height=400,width=600,menubar=0,toolbar=0,scrollbars=1");
                }
        },

        _loaded : function(win) {
                this._last = null;
                this.win = win;
                this.log("<b>DynarchLIB Console</b><br />Initialized at %s", new Date());
                this.line();
                this._messages.foreach(this._addMsg, this);
        }

};

if (!window.dlconsole) {
        window.dlconsole = new DlConsole();
}
