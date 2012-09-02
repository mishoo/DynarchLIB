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

// @require container.js

DEFINE_CLASS("DlWM", DlContainer, function(D, P, DOM){

        P.getInnerSize = P.getOuterSize = P.getSize = function() {
                return ( this.parent
                         ? this.parent.getInnerSize()
                         : DOM.getWindowSize() );
        };

        P.initDOM = function() {
                D.BASE.initDOM.apply(this, arguments);
                this.getElement().innerHTML = "<div class='DlWM-modalStopper'></div>";
                this.dialogsVisible = [];
                this.modalsVisible = 0;
                this._manageEvents = {
                        onShow: _on_dlgShow.$(null, this),
                        onHide: _on_dlgHide.$(null, this)
                };
                var resize = this.on_parentResize.$(this);
                this.parent
                        ? this.parent.addEventListener("onResize", resize)
                        : DOM.addEvent(window, "resize", resize);
        };

        P.getModalStopperElement = function() {
                return this.getElement().childNodes[0];
        };

        P.activatePrev = function() {
                var a = this.dialogsVisible;
                if (a.length > 1) {
                        a.peek().deactivate();
                        a.unshift(a.pop());
                        var top = a.pop();
                        top.activate();
                }
        };

        P.activateNext = function() {
                var a = this.dialogsVisible;
                if (a.length > 1) {
                        a[0].activate();
                }
        };

        P.getActiveDialog = function() {
                return this.dialogsVisible.peek();
        };

        P.updateZIndex = function() {
                this.dialogsVisible.r_foreach(function(d, i) {
                        d.zIndex((d.__modal ? 900 : 500) + i);
                });
        };

        P.getVisibleDialogs = function() {
                return this.dialogsVisible;
        };

        P.getAllDialogs = function() {
                return this.children().grep(function(w){ return w instanceof DlDialog });
        };

        P.appendWidget = function(w) {
                D.BASE.appendWidget.apply(this, arguments);
                if (w instanceof DlDialog)
                        this.manage(w);
        };

        P.removeWidget = function(w) {
                D.BASE.removeWidget.apply(this, arguments);
                if (w instanceof DlDialog)
                        this.unmanage(w);
        };

        P.manage = function(dlg) { dlg.addEventListener(this._manageEvents) };
        P.unmanage = function(dlg) { dlg.removeEventListener(this._manageEvents) };

        P.on_dlgShow = function(dlg) {
                if (dlg.__modal)
                        this.modalsVisible++;
                this.condClass(this.modalsVisible > 0, "DlWM-hasModals");
        };

        P.on_dlgHide = function(dlg) {
                if (dlg.__modal)
                        this.modalsVisible--;
                this.condClass(this.modalsVisible > 0, "DlWM-hasModals");
                if (this.dialogsVisible.length == 0 && this.parent)
                        this.parent.focus();
        };

        P.on_parentResize = function() {
                this.dialogsVisible.foreach(function(dlg){
                        if (dlg.__maximized)
                                dlg.__doMaximize();
                });
                this.callHooks("onResize");
        };

        P.rearrange = function(algo) {
                var a = this.dialogsVisible.map(function(dlg){
                        var pos = dlg.getOffsetPos(), size = dlg.getOuterSize();
                        return { dlg: dlg, x: pos.x, y: pos.y, w: size.x, h: size.y };
                });
                algo(a, this.getInnerSize());
                a.foreach(function(o){
                        o.dlg.setPos(o.x, o.y);
                        o.dlg.setSize({ x: o.w, y: o.h });
                });
        };

        P.tileHoriz = function() { this.rearrange(algo_tileHoriz) };
        P.tileVert = function() { this.rearrange(algo_tileVert) };

        function _on_dlgShow(wm) { wm.on_dlgShow(this) };
        function _on_dlgHide(wm) { wm.on_dlgHide(this) };

        DlContainer.prototype._makeWindowManager = function() {
                if (!this.__wm)
                        (this.__wm = new DlWM({ parent: this })).addEventListener(
                                "onDestroy", function(){ this.__wm = null }.$(this));
                return this.__wm;
        };

        function sortX(a, b) { return a.x < b.x ? -1 : a.x > b.x ? 1 : 0 };
        function sortY(a, b) { return a.y < b.y ? -1 : a.y > b.y ? 1 : 0 };

        function algo_tileHoriz(a, size) {
                var n = a.length, w = Math.floor(size.x / n), x = 0;
                a.mergeSort(sortX).foreach(function(o, i){
                        o.y = 0;
                        o.x = x;
                        o.h = size.y;
                        if (i == n - 1)
                                o.w = size.x - x;
                        else
                                o.w = w;
                        x += w;
                });
        };

        function algo_tileVert(a, size) {
                var n = a.length, h = Math.floor(size.y / n), y = 0;
                a.mergeSort(sortY).foreach(function(o, i){
                        o.x = 0;
                        o.y = y;
                        o.w = size.x;
                        if (i == n - 1)
                                o.h = size.y - y;
                        else
                                o.h = h;
                        y += h;
                });
        };

});

DEFINE_CLASS("DlDialog", DlContainer, function(D, P, DOM){

        var EX = DlException.stopEventBubbling,
            AC = DOM.addClass,
            DC = DOM.delClass,
            CC = DOM.condClass,
            CE = DOM.createElement;

        D.DEFAULT_EVENTS = [ "onShow", "onHide", "onActivate", "onQuitBtn" ];

        D.DEFAULT_ARGS = {
                _title         : [ "title"        , "DlDialog" ],
                _noEmptyTitle  : [ "noEmptyTitle" , true ],
                _fixed         : [ "fixed"        , false ],
                _resizable     : [ "resizable"    , false ],
                _focusable     : [ "focusable"    , true ],
                _iconClass     : [ "iconClass"    , null ],
                _focusedWidget : [ "focusDefault" , null ],
                __noShadows    : [ "noShadows"    , false ],
                __quitBtn      : [ "quitBtn"      , false ],
                __maxBtn       : [ "maxBtn"       , true ],
                __modal        : [ "modal"        , false ],
                __moveDelay    : [ "moveDelay"    , null ]
        };

        D.FIXARGS = function(args) {
                if (!args.parent)
                        args.parent = D.getTopWM();
                if (!(args.parent instanceof DlWM)) {
                        if (args.parent instanceof DlDialog)
                                args.noShadows = true;
                        args.parent = args.parent._makeWindowManager();
                }
        };

        D.CONSTRUCT = function() {
                this.__doDrag = this.__moveDelay != null
                        ? __doDrag.clearingTimeout(this.__moveDelay, this)
                        : __doDrag.$(this);
                this.active = false;
        };

        var TOP_WM;
        D.getTopWM = function() {
                if (!TOP_WM) {
                        TOP_WM = new DlWM({ className: "DlTopWindowManager" });
                        document.body.appendChild(TOP_WM.getElement());
                }
                return TOP_WM;
        };

        var HTML = ( "<div class='DlDialog-Rel'>" +
                     "<div class='DlDialog-WindowButtons'></div>" +
                     "<div class='DlDialog-Title'><div></div></div>" +
                     "<div class='DlDialog-Content'></div>" +
                     "</div>" );

        var HIDE_POS = { x: -30000, y: -30000 };

        P._setDragCaptures = function(capture) {
                DlEvent[capture ? "captureGlobals" : "releaseGlobals"](this._dragHandlers);
        };

        P._setResizeCaptures = function(capture) {
                DlEvent[capture ? "captureGlobals" : "releaseGlobals"](this._resizeHandlers);
        };

        function activateCkt() {
                var ckt = DOM.CE_CACHE["DlDialog.EVENT_STOPPER"];
                if (!ckt) {
                        ckt = DOM.CE_CACHE["DlDialog.EVENT_STOPPER"] = CE("div", null, { className: "DYNARCH-EVENT-STOPPER" }, document.body);
                        // if (is_ie || is_gecko) {
                        //         DOM.setOpacity(ckt, 0.2);
                        //         ckt.style.background = "#00f";
                        // }
                }
                ckt.style.visibility = "";
                return ckt;
        };

        function deactivateCkt() {
                var ckt = DOM.CE_CACHE["DlDialog.EVENT_STOPPER"];
                if (ckt) {
                        ckt.className = "DYNARCH-EVENT-STOPPER";
                        ckt.style.visibility = "hidden";
                }
                return ckt;
        };

        D.activateEventStopper = function(act) {
                return act ? activateCkt() : deactivateCkt();
        };

        function startDrag(ev) {
                if (!this.dragging && !this.__maximized) {
                        DlPopup.clearAllPopups();
                        this.activate();
                        this.dragging = true;
                        ev || (ev = window.event);
                        var dlev = (ev instanceof DlEvent)
                                ? ev
                                : new DlEvent(ev);
                        this.addClass("DlDialog-Dragging");
                        this._dragPos = dlev.computePos(this);
                        this._setDragCaptures(true);
                        AC(activateCkt(), "CURSOR-DRAGGING");

                        if (this.__moveDelay != null) {
                                var div = this.getResizeRect();
                                AC(div, "Dl-ResizeRect-moving");
                                var sz = this.getOuterSize();
                                DOM.setPos(div, dlev.elPos.x, dlev.elPos.y);
                                DOM.setOuterSize(div, sz.x, sz.y);
                                div.style.display = "";
                        }

                        if (dlev !== ev)
                                return DOM.stopEvent(ev);
                }
        };

        function startCtrlDrag(ev) {
                if (ev.ctrlKey && ev.shiftKey) {
                        if (ev.button == 0 && this._dragHandlers) {
                                startDrag.call(this, ev);
                        } else if (ev.button == 2 && ev.dl_type == "onContextMenu" && this._resizable) {
                                startResize.call(this, ev);
                                EX();
                        }
                }
        };

        function stopDrag(ev) {
                if (this.dragging) {
                        var div = this.getResizeRect();
                        this.dragging = false;
                        this.delClass("DlDialog-Dragging");
                        this._setDragCaptures(false);
                        if (this.__moveDelay != null) {
                                if (ev) {
                                        var pos = __dragGetPos.call(this, ev);
                                        this.__doDrag.doItNow(pos.x, pos.y);
                                } else {
                                        this.__doDrag.cancel();
                                }
                        }
                        DC(div, "Dl-ResizeRect-moving");
                        div.style.display = "none";
                        deactivateCkt();
                }
        };

        function __dragGetPos(ev) {
                var p = this.parent;
                ev.computePos(p.getContentElement());
                var x = ev.relPos.x - this._dragPos.x,
                    y = ev.relPos.y - this._dragPos.y,
                    sz = this.getOuterSize(),
                    ws = p.getInnerSize();
                if (x < 0)
                        x = 0;
                else if (x + sz.x > ws.x)
                x = ws.x - sz.x;
                if (y < 0)
                        y = 0;
                else if (y + sz.y > ws.y)
                y = ws.y - sz.y;
                return { x: x, y: y };
        };

        function __dragDIV(pos) {
                var x = pos.x, y = pos.y;
                pos = DOM.getPos(this.parent.getContentElement());
                x += pos.x;
                y += pos.y;
                DOM.setPos(this.getResizeRect(), x, y);
        };

        function __doDrag(x, y) {
                this.setPos(x, y);
                this.__oldDlgPos = this.getOffsetPos();
        };

        function doDrag(ev) {
                var pos = __dragGetPos.call(this, ev);
                if (this.__moveDelay != null)
                        __dragDIV.call(this, pos);
                this.__doDrag(pos.x, pos.y);
                EX();
        };

        function startResize(ev) {
                if (!this.resizing) {
                        this.resizing = true;
                        ev || (ev = window.event);
                        var dlev = (ev instanceof DlEvent)
                                ? ev
                                : new DlEvent(ev);
                        this._dragPos = dlev.computePos(this);
                        var sz = this.getOuterSize();
                        this._dragPos.x -= sz.x;
                        this._dragPos.y -= sz.y;
                        var pos = this.getPos();
                        var div = this.getResizeRect();
                        DOM.setPos(div, pos.x, pos.y);
                        DOM.setOuterSize(div, sz.x, sz.y);
                        div.style.display = "";
                        // this.display(false);
                        this.addClass("DlDialog-Resizing");
                        this._setResizeCaptures(true);
                        AC(activateCkt(), "CURSOR-DRAGGING");
                        doResize.call(this, dlev, true);
                        if (dlev !== ev)
                                DOM.stopEvent(ev);
                }
        };

        function stopResize(ev) {
                if (this.resizing) {
                        this.disableHooks("onResize");
                        this.getElement().style.overflow = "hidden";
                        var div = this.getResizeRect();
                        var sz = DOM.getOuterSize(div);
                        DOM.setPos(div, 0, 0);
                        div.style.display = "none";
                        // this.display(true);
                        this.delClass("DlDialog-Resizing");
                        this.setOuterSize({ x: sz.x - 2, y: sz.y - 2 });
                        if (is_gecko)
                                // FIXME: wicked!
                                D.BASE.setOuterSize.call(this, { x: "auto", y: "auto" });
                        this.resizing = false;
                        this._setResizeCaptures(false);
                        this.getElement().style.overflow = "";
                        deactivateCkt();
                        this.enableHooks("onResize");
                        this.callHooks("onResize");
                }
        };

        function doResize(ev, domStop) {
                if (this.resizing) {
                        var div = this.getResizeRect();
                        var pos = DOM.getPos(div);
                        pos.x = ev.pos.x - this._dragPos.x - pos.x - 2;
                        if (pos.x < 100)
                                pos.x = 100;
                        pos.y = ev.pos.y - this._dragPos.y - pos.y - 2;
                        if (pos.y < 100)
                                pos.y = 100;
                        if (this._resizable === 1)
                                pos.y = null;
                        if (this._resizable === 2)
                                pos.x = null;
                        DOM.setInnerSize(div, pos.x, pos.y);
//                         div.innerHTML = [ "<table style='height: 100%' align='center'><tr><td><span class='Title'>",
//                                           this._title,
//                                           "</span><br/>",
//                                           pos.x, " × ",
//                                           pos.y,
//                                           "</td></tr></table>"
//                                         ].join("");
                        domStop || EX();
                }
        };

        P.setOuterSize = P.setSize = function(sz) {
                sz = Object.makeCopy(sz);
                if (sz.y != null)
                        sz.y -= this.getTitleElement().offsetHeight;
                this.setInnerSize(sz);
        };

        P.hide = function() {
                if (this.display() && DOM.elementIsVisible(this.getElement())) {
                        this.__oldDlgPos = this.getOffsetPos();
                        this.display(false);
                        this.setPos(HIDE_POS);
                }
        };

        P.show = function(center) {
                if (!this.__wasDisplayed) {
                        this.setStyle({ visibility: "" }); // bypass DlWidget::visibility so we don't call handlers
                }
                if (!this.display() || !this.__wasDisplayed) {
                        if (this.__oldDlgPos)
                                this.setPos(this.__oldDlgPos);
                        else if (center)
                                this.centerOnParent();
                        this.display(true);
                } else {
                        this.activate();
                }
                this.__wasDisplayed = true;
        };

        P.activate = function() {
                var vd = this.parent.getVisibleDialogs();
                var act = vd.peek();
                if (!this.active) {
                        if (act && act.active)
                                act.deactivate(true);
                        this.addClass("DlDialog-Active");
                        vd.remove(this);
                        vd.push(this);
                        this.parent.updateZIndex();
                        this.active = true;
                        this.focus();
                        if (this._focusedWidget && !this._focusedWidget.destroyed)
                                this._focusedWidget.focus();
                        this.applyHooks("onActivate", [ true ]);
                }
        };

        P.deactivate = function() {
                if (this.active) {
                        this.delClass("DlDialog-Active");
                        this.active = false;
                        // this.callHooks("onBlur");
                        this.blur();
                        this.applyHooks("onActivate", [ false ]);
                }
        };

        function onDisplay(disp, val) {
                var sys = DlSystem();
                if (disp) {
                        this.callHooks("onShow");
                        this.activate();
                        this.setModal(this.__modal, true);
                        sys.applyHooks("on-dialog-show", [ this ]);
                        if (this.__maximized)
                                this.__doMaximize.delayed(1, this);
                } else {
                        var vd = this.parent.getVisibleDialogs();
                        vd.remove(this);
                        this.callHooks("onHide");
                        this.deactivate();
                        sys.applyHooks("on-dialog-hide", [ this ]);
                        if (vd.length >= 1)
                                vd.peek().activate();
                }
        };

        function onMouseWheel(ev) {
                if (ev.shiftKey || ev.altKey) {
                        var opc = this.__dlgOpacity;
                        if (opc == null)
                                opc = 100;
                        if (ev.wheelDelta > 0)
                                opc += 0.05;
                        else
                                opc -= 0.05;
                        opc = this.__dlgOpacity = opc.limit(0.1, 1);
                        this.opacity(opc);
                        EX();
                }
        };

        P._createElement = function() {
                D.BASE._createElement.call(this);
                this.setPos(HIDE_POS);
                //this.display(false);
                this.setStyle({ visibility: "hidden" }); // bypass DlWidget::visibility so we don't call handlers
                this.getElement().innerHTML = HTML;
                var rel = this.getRelElement();

                if (this.__noShadows) {
                        this.__noShadows = true;
                        AC(rel, "DlDialog-noShadows");
                }

                this.title(this._title);
                this.setUnselectable(this.getTitleElement());

                // create title buttons
                var quitBtn = this.__quitBtn;
                if (quitBtn) {
                        var foo = this.__quitBtn = new DlAbstractButton({
                                parent     : this,
                                className  : "DlDialog-QuitBtn",
                                appendArgs : this.getButtonsElement(),
                                classes    : {
                                        hover  : "DlDialog-QuitBtn-hover",
                                        active : "DlDialog-QuitBtn-active"
                                }
                        });
                        if (quitBtn == "destroy") {
                                quitBtn = this.destroy.$(this);
                        } else if (quitBtn == "hide") {
                                quitBtn = this.hide.$(this);
                        }
                        if (quitBtn instanceof Function)
                                foo.addEventListener("onClick", quitBtn);
                        else
                                foo.connectEvents("onClick", this, "onQuitBtn");
                }

                if (this._resizable)
                        this.makeResizable();

                this.setIconClass(this._iconClass);

                if (!this._fixed)
                        this.makeDraggable();

                this.addEventListener({ onMouseDown   : this.activate,
                                        onMouseWheel  : onMouseWheel,
                                        onDisplay     : onDisplay,
                                        onDestroy     : this.hide });
        };

        P.setIconClass = function(iconClass) {
		var e2 = this.getTitleElement().firstChild;
		CC(e2, iconClass != null, "DlDialog-Title-withIcon");
		if (this.iconClass)
			DC(e2, this.iconClass);
		if (iconClass)
			AC(e2, iconClass);
		this.iconClass = iconClass;
	};

        P.getState = function() {
                var state = this.__maximized && this.__maximizeSavePos;
                if (state)
                        state = Object.makeDeepCopy(state);
                else
                        state = {
                                pos  : this.getOffsetPos(),
                                size : this.getOuterSize()
                        };
                state.max = !!this.__maximized;
                return state;
        };

        P.maximize = function(c) {
                if (c == null)
                        c = this.__maxBtn.checked();
                var pos, size;
                this.__maximized = c;
                if (c) {
                        pos = this.getOffsetPos();
                        size = this.getOuterSize();
                        this.__maximizeSavePos = { pos: pos, size: size };
                }
                this.condClass(c, "DlDialog-Maximized");
                if (c) {
                        this.__doMaximize();
                } else {
                        pos = this.__maximizeSavePos;
                        size = pos.size;
                        pos = pos.pos;
                        this.setOuterSize({ x: size.x, y: size.y });
                        this.setPos(pos.x, pos.y);
                }
                this.__maxBtn.checked(c, true);
                if (this._focusedWidget && !this._focusedWidget.destroyed)
                        this._focusedWidget.focus();
        };

        P.__doMaximize = function() {
                this.setPos(0, 0);
                var ws = this.parent.getInnerSize();
                this.setOuterSize({ x: ws.x, y: ws.y });
        };

        P.setModal = function(modal, noset) {
                if (!noset)
                        this.__modal = modal;
                if (this.display()) {
                        this.parent.updateZIndex();
                }
        };

        P.modal = function() {
                return this.__modal;
        };

        P.makeResizable = function() {
                if (!this._resizeHandlers) {
                        this.getContentElement().style.overflow = "hidden";
                        var div = this.getRelElement();
                        var el = CE("div", null, { className: "ResizeHandle" }, null);
                        div.insertBefore(el, div.firstChild);
                        this._resizeHandlers = {
                                onMouseMove  : doResize.$(this),
                                onMouseUp    : stopResize.$(this),
                                onMouseOver  : EX,
                                onMouseOut   : EX,
                                onMouseEnter : EX,
                                onMouseLeave : EX
                        };
                        DOM.addEvent(el, "mousedown", startResize.$(this));
                        this.resizing = false;
                        if (this.__maxBtn) {
                                this.__maxBtn = new DlAbstractButton({
                                        parent     : this,
                                        className  : "DlDialog-MaximizeBtn",
                                        appendArgs : this.getButtonsElement(),
                                        type       : DlAbstractButton.TYPE.TWOSTATE,
                                        classes    : {
                                                hover   : "DlDialog-MaximizeBtn-hover",
                                                active  : "DlDialog-MaximizeBtn-active",
                                                checked : "DlDialog-MaximizeBtn-1"
                                        }
                                });
                                this.__maxBtn.addEventListener("onChange", this.maximize.$0(this, null));
                        }
                }
        };

        P.makeDraggable = function(el) {
                if (!el) {
                        el = this.getTitleElement();
                        el.style.cursor = "default";
                        this.addEventListener([ "onMouseDown", "onContextMenu" ], startCtrlDrag);
                }
                if (!this._dragHandlers) {
                        this._dragHandlers = {
                                onMouseMove  : doDrag.$(this),
                                onMouseUp    : stopDrag.$(this),
                                onMouseOver  : EX,
                                onMouseOut   : EX,
                                onMouseEnter : EX,
                                onMouseLeave : EX
                        };
                        this.dragging = false;
                }
                DOM.addEvent(el, "mousedown", startDrag.$(this));
        };

        P.title = function(title) {
                if (title != null) {
                        if (title instanceof Array)
                                title = title.join("");
                        this._title = title;
                        this.getTitleElement().firstChild.innerHTML = title;
                        if (this._noEmptyTitle) {
                                this.getTitleElement().style.display = /\S/.test(title) ? "" : "none";
                        }
                }
                return this._title;
        };

        P._handle_focusKeys = function(ev) {
                if (!ev.altKey && !ev.ctrlKey) {
                        if (ev.keyCode == DlKeyboard.ESCAPE) {
                                if (!this.dragging && this.__quitBtn) {
                                        this.__quitBtn.keyClicked(ev);
                                } else if (this.dragging) {
                                        stopDrag.call(this);
                                }
                        } else if (ev.keyCode == DlKeyboard.TAB) {
                                var w = ev.focusedWidget;
                                w = ev.shiftKey
                                        ? this.getPrevFocusWidget(w)
                                        : this.getNextFocusWidget(w);
                                if (w)
                                        w.focus();
                                ev.domStop = true;
                                EX();
                        }
                }
                this._handleKeybinding(ev);
        };

        function _el(o, p) {
                var a = o.getRelElement().childNodes;
                return a[a.length - p];
        };

        P.getRelElement = function() {
                return this.getElement().firstChild;
        };

        P.getContentElement = function() {
                return _el(this, 1);
        };

        P.getTitleElement = function() {
                return _el(this, 2);
        };

        P.getButtonsElement = function() {
                return _el(this, 3);
        };

        P.centerOnParent = function() {
                var sz = this.getOuterSize(), ps = this.parent.getOuterSize();
                this.setPos((ps.x - sz.x) / 2, (ps.y - sz.y) / 2);
        };

        P.getWM = function() { return this.parent };

        DlWidget.prototype.getParentDialog = function() {
                var d = this.parent;
                while (d && !(d instanceof D))
                        d = d.parent;
                return d;
        };

});

DEFINE_CLASS("DlDialogPopup", DlPopup, function(D, P) {
        D.FIXARGS = function(args) {
                args.autolink = false;
                args.zIndex = 5000;
        };
});
