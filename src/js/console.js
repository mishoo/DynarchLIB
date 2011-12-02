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

// @if DEBUG
// @require ALL

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
        },

        protect : function(name) {
                var func = eval(name), f = function() {
                        try {
                                var a = [];
                                for (var i = 0; i < arguments.length; ++i)
                                        a.push(arguments[i]);
                                console.log(name + " [" + a.join(", ") + "]");
                                func.apply(this, arguments);
                        } catch(ex) {
                                alert("Exception in " + name + "\n" + ex);
                                throw ex;
                        }
                };
                eval(name + " = f");
        }

};

if (!window.dlconsole) {
        window.dlconsole = new DlConsole();
}
