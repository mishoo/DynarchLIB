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

// @require hbox.js
// @require button.js
// @require popupmenu.js

DEFINE_CLASS("DlButtonMenu", DlHbox, function(D, P) {

        D.CONSTRUCT = DlMenuBase;

        D.DEFAULT_EVENTS = [ "onSelect", "onPopup", "onHide", "onClick" ];

        D.DEFAULT_ARGS = {
                label      : [ "label", null ],
                _iconClass : [ "iconClass", null ],
                _shiftMenu : [ "shiftMenu", null ],
                _connected : [ "connected", false ]
        };

        P.ALIGN = {
                prefer: "Br",
                fallX1: "_r",
                fallX2: "_l",
                fallY1: "B_",
                fallY2: "T_"
        };

        P.activateSubmenu = function(activate) {
                this._mainBtn.condClass(activate, "DlButton-1");
                this._menuBtn.condClass(activate, "DlButton-1");
        };

        P._createElement = function() {
                D.BASE._createElement.call(this);
                this._mainBtn = new DlButton({ parent    : this,
                                               focusable : false,
                                               label     : this.label,
                                               className : "LabelPart",
                                               noCapture : this._connected,
                                               iconClass : this._iconClass });
                this._mainBtn.connectEvents("onClick", this);
                this._menuBtn = new DlButton({ parent    : this,
                                               focusable : false,
                                               label     : "&nbsp;",
                                               className : "MenuArrow",
                                               noCapture : true });
                this._menuBtn.getElement().parentNode.style.width = "3px";
                this._menuBtn.getContentElement().className = "MenuArrow-inner";
                if (this._connected)
                        this._mainBtn.connectEvents("onMouseDown", this._menuBtn);

                // err, why did I need that?
//              if (!is_gecko) {
//                      // Gecko has a stupid bug, oh my dear, oh my dear
//                      this._menuBtn.getElement().style.overflow = "hidden";
//              }
                this._mainBtn.connectEvents([ "onMouseEnter", "onMouseLeave" ], this._menuBtn);

                this._menuBtn.addEventListener("onMouseDown", this._do_popupMenu.$(this));
                this.addEventListener("onDestroy", this.setMenu.$(this, null));
        };

        P._do_popupMenu = function(ev) {
                if (!this._popupVisible) {
                        var p = this._getContextMenuPopup();
                        p.popup({ timeout   : 0,
                                  content   : this.getMenu(),
                                  align     : this.ALIGN,
                                  anchor    : this.getTableElement(),
                                  isContext : true,
                                  widget    : this,
                                  shift     : this._shiftMenu,
                                  onHide    : this.callHooks.$(this, "onHide")
                                });
                        if (ev instanceof DlEvent)
                                ev._justFocusedWidget = p;
                        this.callHooks("onPopup");
                }
        };

        P.getMenu = function() {
                return this._menu;
        };

        P.getButton = function() { return this._mainBtn; };
        P.getArrow = function() { return this._menuBtn; };

        P.setMenu = function(menu) {
                if (this._menu instanceof DlWidget)
                        this._menu.destroy();
                if (menu instanceof DlWidget)
                        menu.ref();
                this._menu = menu;
        };

});
