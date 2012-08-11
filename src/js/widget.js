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
// @require event.js

DEFINE_CLASS("DlWidget", DlEventProxy, function(D, P, DOM) {

        var CE = DOM.createElement,
            AC = DOM.addClass,
            DC = DOM.delClass,
            CC = DOM.condClass,
            ID = Dynarch.ID;

        D.FIXARGS = function(args) {
                if (args.focusable == null && args.tabIndex)
                        args.focusable = true;
        };

        D.CONSTRUCT = function() {
                this.__propsUserData = {};
                this.__refNodes = [];

                if (!(this._parent == null || this._parent instanceof DlContainer))
                        throw new DlException("Parent must be an instance of DlContainer");

                this.id = ID(this._objectType || "DlWidget");
                WIDGETS[this.id] = this;

                this.initDOM();
        };

        D.DEFAULT_ARGS = {
                userData         : [ "data"             , null ],
                _parent          : [ "parent"           , null ],
                _fillParent      : [ "fillParent"       , null ],
                _tagName         : [ "tagName"          , "div" ],
                _dragArgs        : [ "drag"             , null ],
                _element         : [ "element"          , null ],
                _focusable       : [ "focusable"        , false ],
                _tabIndex        : [ "tabIndex"         , 0 ],
                _accessKey       : [ "accessKey"        , null ],
                __appendArgs     : [ "appendArgs"       , window.undefined ],
                __addClassName   : [ "className"        , "" ],
                __disabled       : [ "disabled"         , false ],
                __tooltip        : [ "tooltip"          , null ],
                __contextMenu    : [ "contextMenu"      , null ],
                __tooltipTimeout : [ "tooltipTimeout"   , 650 ],
                __refCnt         : [ "_refCnt"          , 0 ],
                __noPropEvents   : [ "dontBubbleEvents" , null ]
        };

        D.DEFAULT_EVENTS = [
                "onMouseEnter",
                "onMouseLeave",
                "onMouseMove",
                "onMouseDown",
                "onMouseUp",
                "onMouseOver",
                "onMouseOut",
                "onMouseWheel",
                "onClick",
                "onDblClick",
                "onDisabled",
                "onDisplay",
                "onFocus",
                "on_DOM_Focus",
                "onBlur",
                "on_DOM_Blur",
                "onKeyDown",
                "onKeyUp",
                "onKeyPress",
                "onResize",
                "onContextMenu",
                "onTooltipShow",
                "onTooltipHide"

                // DnD events -- not yet used
                // "onDragStart",
                // "onDragAvailable",
                // "onDragCancel",
                // "onDrop"
        ];

        var WIDGETS = D.WIDGETS = {};

        D.getById = function(id) { return WIDGETS[id]; };
        D.getFromElement = function(el) { return el._dynarch_object; };

        D.getFromUpElement = function(el) {
                while (el && !el._dynarch_object)
                        el = el.parentNode;
                return el && el._dynarch_object;
        };

        var TOOLTIP = null;
        function getTooltip() {
                if (!TOOLTIP)
                        TOOLTIP = new DlTooltip({});
                return TOOLTIP;
        };
        D.getTooltip = getTooltip;

        P.getWidgetId = function() {
                return this.id;
        };

        P._className = [];

        P.FINISH_OBJECT_DEF = function() {
                D.BASE.FINISH_OBJECT_DEF.call(this);
                this._className = this._className.concat([ this._objectType ]);
        };

        var RESIZE_RECT = null;
        P.getResizeRect = D.getResizeRect = function() {
                if (!RESIZE_RECT)
                        RESIZE_RECT = CE("div", { display: "none" },
                                         { className: "Dl-ResizeRect",
                                           innerHTML: "&nbsp;" },
                                         document.body);
                return RESIZE_RECT;
        };

        D.debug_countHooks = function() {
                var ret = {};
                Array.hashKeys(DlWidget.WIDGETS).foreach(function(id){
                        ret[id] = DlWidget.WIDGETS[id].debug_countHooks();
                });
                return ret;
        };

        function onDestroy() {
                if (this.__tooltipActive)
                        getTooltip().hide();
                if (this.__contextMenu instanceof D)
                        this.__contextMenu.destroy();
                if (this.parent)
                        try {
                                this.parent.removeWidget(this);
                        } catch(ex) {};
                var el = this.getElement();
                if (el) {
                        // delete el["_dynarch_object"]; // not good for IE
                        el._dynarch_object = null;
                        // delete el["_dynarch_focusable"]; // same.
                        el._dynarch_focusable = null;
                }
                this._element = null;
                DOM.trash(el);
                if (WIDGETS[this.id]) {
                        WIDGETS[this.id] = null;
                        delete WIDGETS[this.id];
                }
                el = null;
                this.__refNodes.r_foreach(function(name, i){
                        this.__refNodes[i] = null;
                        this[name] = null;
                        delete this[name];
                }, this);
                this.__refNodes = null;
                this.userData = null;
                this.__propsUserData = null;
        };

        P.destroy = function() {
                if (this.unref() <= 0)
                        D.BASE.destroy.call(this);
        };

        P.__onTooltipShow = function() {
                this.__tooltipActive = true;
                this.callHooks("onTooltipShow");
        };

        P.__onTooltipHide = function() {
                this.__tooltipActive = false;
                this.callHooks("onTooltipHide");
        };

        P._popupTooltip = function() {
                getTooltip().popup({ timeout : this.__tooltipTimeout,
                                     content : this.__tooltip,
                                     anchor  : this.getElement(),
                                     align   : "mouse",
                                     onPopup : this.__onTooltipShow,
                                     onHide  : this.__onTooltipHide,
                                     widget  : this
                                   });
        };

        function onMouseEnter() {
                if (this.__tooltip)
                        this._popupTooltip();
        };

        function onMouseLeave() {
                getTooltip().hide();
        };

        // drag handlers
        {
                function dragMouseMove(da, ev) {
                        if (!da.dragging) {
                                if (Math.abs(ev.pos.x - da.startPos.x) >= da.delta ||
                                    Math.abs(ev.pos.y - da.startPos.y) >= da.delta) {
                                        da.dragging = true;
                                        da.makeElementCopy(this, ev);
                                        da.applyHooks("onStartDrag", [ this, ev ]);
                                        this.addClass(da.draggingClass);
                                }
                        }
                        if (da.dragging) {
                                var el = da.elementCopy;
                                if (el) {
                                        el.style.left = ev.pos.x + 5 + "px";
                                        el.style.top = ev.pos.y + 5 + "px";
                                }
                                da.moving(this, ev);
                                DlException.stopEventBubbling();
                        }
                };

                function dragCancel(da, ev, wasCancel) {
                        this.delClass(da.draggingClass);
                        DlEvent.releaseGlobals(da.captures);
                        da.captures = null;
                        DRAGGING = false;
                        if (!wasCancel)
                                da.doDrop(this, ev);
                        da.reset(wasCancel);
                };

                function dragMouseUp(da, ev) {
                        if (ev.button == 0) {
                                var wasDropped = da.dragging && da.canDrop;
                                dragCancel.call(this, da, ev, !wasDropped);
                        }
                };

                function dragMouseOver(da, ev) {
                        DlException.stopEventBubbling();
                };

                function dragMouseOut(da, ev) {
                        DlException.stopEventBubbling();
                };

                function dragMouseEnter(da, ev) {
                        var obj = ev.getObject();
                        var insideThis = false, p = obj;
                        while (p) {
                                if (p === this) {
                                        insideThis = true;
                                        break;
                                }
                                p = p.parent;
                        }
                        var canDrop = da.dropOK(this, ev, obj, insideThis);
                        DlException.stopEventBubbling();
                };

                function dragMouseLeave(da, ev) {
                        DlException.stopEventBubbling();
                };

                function dragKeyPress(da, ev) {
                        if (ev.keyCode == DlKeyboard.ESCAPE) {
                                dragCancel.call(this, da, ev, true);
                        }
                        DlException.stopEventBubbling();
                };

                function dragContextMenu(da, ev) {
                        DlException.stopEventBubbling();
                };
        }

        var DRAGGING = false;

        function onMouseDown(ev) {
                getTooltip().cancel();
                if (this._focusable && !ev._justFocusedWidget) {
                        ev._justFocusedWidget = this;
                        if (this._focusable < 2)
                                // otherwise are focused automagically.
                                this.focus();
                }
                if (ev.button == 0) {
                        var da = this._dragArgs, el;
                        if (da && !DRAGGING) {
                                if (da.startOK(this, ev)) {
                                        var obj = ev.getObject();
                                        if (obj)
                                                obj.applyHooks("onMouseLeave", [ ev ]);
                                        DRAGGING = true;
                                        da.source = this;
                                        da.captures = {
                                                onMouseMove   : dragMouseMove.$(this, da),
                                                onMouseUp     : dragMouseUp.$(this, da),
                                                onMouseOver   : dragMouseOver.$(this, da),
                                                onMouseOut    : dragMouseOut.$(this, da),
                                                onMouseEnter  : dragMouseEnter.$(this, da),
                                                onMouseLeave  : dragMouseLeave.$(this, da),
                                                onContextMenu : dragContextMenu.$(this, da),
                                                onKeyPress    : dragKeyPress.$(this, da)
                                        };
                                        da.startPos = ev.pos;
                                        da.startElPos = this.getPos();
                                        DlEvent.captureGlobals(da.captures);
                                        // DlException.stopEventBubbling();
                                        // ev.stopDomEvent();
                                }
                        }
                }
        };

        function onContextMenu(ev) {
                var content = this.__contextMenu;
                if (typeof content == "function")
                        content = content.call(this, ev);
                if (content) {
                        var p = this._getContextMenuPopup();
                        p.popup({ timeout    : 0,
                                  content    : content,
                                  anchor     : content.contextMenuAnchor || this.getElement(),
                                  align      : content.contextMenuAlign || "mouse",
                                  widget     : this,
                                  onPopup    : content.contextMenuOnPopup || null,
                                  onHide     : content.contextMenuOnHide || null,
                                  isContext  : true });
                        DlException.stopEventBubbling();
                }
        };

        P.setData = function(key, val) {
                if (arguments.length == 1)
                        delete this.__propsUserData[key];
                else
                        this.__propsUserData[key] = val;
        };

        P.getData = function(key) {
                return this.__propsUserData[key];
        };

        P._getDlPopup = function() {
                var p = this.getParent(DlPopup) || 0;
                if (p)
                        p = p._level + 1;
                return DlPopupMenu.get(p);
        };

        P._getContextMenuPopup = P._getDlPopup;

        var LISTENERS = {
                onDestroy     : onDestroy,
                onMouseEnter  : onMouseEnter,
                onMouseLeave  : onMouseLeave,
                onMouseDown   : onMouseDown,
                onContextMenu : onContextMenu
        };

        P._setListeners = function() {
                this.addEventListener(LISTENERS);
                this.addEventListener((is_ie || is_khtml) ? "onKeyDown" : "onKeyPress", this._handle_focusKeys);
        };

        P._handle_focusKeys = function(ev) {};

        P._check_accessKey = function(ev) {
                return this._accessKey && DlKeyboard.checkKey(ev, this._accessKey);
        };

        P._handle_accessKey = function(ev) {
                this.focus();
        };

        P._setFocusedStyle = function(focused) {
                this.condClass(focused, this._className.peek() + "-focus");
        };

        P.focus = function() {
                if (this._focusable) {
                        DlEvent.focusedWidget(this);
                        this._setFocusedStyle(true);
                        this.callHooks("onFocus");
                        if (!(this instanceof DlEntry)) {
                                this.scrollIntoView();
                        }
                } else if (this.parent) {
                        this.parent.focus();
                }
        };

        P.blur = function() {
                if (this._focusable) {
                        if (!this.destroyed) {
                                this._setFocusedStyle(false);
                                this.callHooks("onBlur");
                        }
                }
        };

        P.focusInside = function() {
                var fw = DlEvent.focusedWidget();
                while (fw) {
                        if (fw == this)
                                break;
                        fw = fw.parent;
                }
                return !!fw;
        };

        P._createElement = function(html) {
                var el = this._element;
                if (!el) {
                        var C = this.constructor, cn = C.__joinedClassName || this._className.join(" ");
                        if (!C.__joinedClassName)
                                C.__joinedClassName = cn;
                        if (this.__addClassName)
                                cn += " " + this.__addClassName;
                        if (html) {
                                el = DOM.createFromHtml(html);
                                el.className = cn;
                        } else {
                                el = CE(this._tagName, null, { className : cn });
                        }
                        if (this._focusable)
                                el._dynarch_focusable = true;
                        this._element = el;
                } else {
                        this.__alreadyInDom = true;
                }
                el._dynarch_object = this;
        };

        P.getElement = function() { return this._element };

        P.getParentNode = function() { return this._element.parentNode };

        P.getDOMChildren = function() {
                return Array.$(this.getContentElement().childNodes);
        };

        P.getContentElement = function() {
                return this.getElement();
        };

        P.setStyle = function(a, b) {
                var s = this.getElement().style;
                if (arguments.length > 1) {
                        // FIXME: add IE hacks
                        s[a] = b;
                } else {
                        for (var i in a)
                                this.setStyle(i, a[i]);
                }
//              else if (a instanceof Array) {
//                      if (b == null)
//                              b = "";
//                      a.foreach(function(a) {
//                              s[a] = b;
//                      });
//              }
        };

        P.setContent = function(content) {
                var el = this.getContentElement();
                while (el.firstChild)
                        el.removeChild(el.lastChild);
                if (typeof content == "string") {
                        el.innerHTML = content;
                } else if (content instanceof Function) {
                        return this.setContent(content.call(this));
                } else if (content instanceof D) {
                        // el.innerHTML = "";
                        // IE effectively destroys elements when we're using
                        // innerHTML (how stupid!).  This is not desirable
                        // since we might keep references to elements for
                        // further use, i.e. in DlPopup(Menu)
                        this.appendWidget(content, this.__appendArgs);
                } else if (content instanceof Array) {
                        // assuming array of strings
                        el.innerHTML = content.join("");
                } else if (content != null) {
                        // assuming HTMLElement
                        el.appendChild(content);
                }
                return content != null;
        };

        P.ref = function() { return this.__refCnt++; };
        P.unref = function() { return --this.__refCnt; };
        P.refCnt = function() { return this.__refCnt; };

        P.setContextMenu = function(menu) {
                if (this.__contextMenu instanceof D)
                        this.__contextMenu.destroy();
                if (menu instanceof D)
                        menu.ref();
                this.__contextMenu = menu;
        };

        P.setTooltip = function(tt) {
                this.__tooltip = tt;
        };

        P.initDOM = function() {
                this._setListeners();
                this._createElement();
                if (this._parent) {
                        this._parent.appendWidget(this, this.__appendArgs);
                        this._parent = null; // this was a temporary property
                }
                if (this.__disabled)
                        this.disabled(true, true);
                this.__onTooltipShow = this.__onTooltipShow.$(this);
                this.__onTooltipHide = this.__onTooltipHide.$(this);
                return this;
        };

        P.setUnselectable = function(el, val) {
                if (el == null)
                        el = this.getElement();
                DOM.setUnselectable(el, val);
        };

        P.disabled = function(v, force) {
                if (v != null && (force || v != this.__disabled)) {
                        this.__disabled = v;
                        this.condClass(v, "DlWidget-disabled");
                        this.condClass(v, this._className.peek() + "-disabled");
                        this.applyHooks("onDisabled", [ v ]);
                }
                return this.__disabled;
        };

        P.enabled = function(v, force) {
                if (v != null) {
                        this.disabled(!v, force);
                }
                return !this.__disabled;
        };

        P.getParent = function(type, skipThis) {
                if (type == null)
                        return this.parent;
                var parent = this;
                if (skipThis)
                        parent = this.parent;
                while (parent && !(parent instanceof type))
                        parent = parent.parent;
                return parent;
        };

        P.findParent = function(f, skipThis) {
                var tmp, parent = this;
                if (skipThis)
                        parent = this.parent;
                if (f instanceof Function) {
                        while (parent && !f(parent))
                                parent = parent.parent;
                } else {
                        var args = Array.$(arguments, 2);
                        while (parent) {
                                tmp = parent[f];
                                if (tmp)
                                        if (tmp instanceof Function) {
                                                if (tmp.apply(parent, args))
                                                        break;
                                        } else
                                                break;
                                parent = parent.parent;
                        }
                }
                return parent;
        };

        P.getPos = function() {
                return DOM.getPos(this.getElement());
        };

        P.getBRPos = function() {
                return DOM.getBRPos(this.getElement());
        };

        P.getOffsetPos = function() {
                var el = this.getElement();
                return { x: el.offsetLeft,
                         y: el.offsetTop };
        };

        P.setPos = function(x, y) {
                var el = this.getElement();
                if (x != null && typeof x == "object") {
                        y = x.y;
                        x = x.x;
                }
                if (x != null)
                        el.style.left = x + "px";
                if (y != null)
                        el.style.top = y + "px";
        };

        P.setSize = P.setOuterSize = function(size) {
                DOM.setOuterSize(this.getElement(), size.x, size.y);
                this.callHooks("onResize");
        };

        P.setInnerSize = function(size) {
                DOM.setInnerSize(this.getContentElement(), size.x, size.y);
                this.callHooks("onResize");
        };

        P.getSize = P.getOuterSize = function() {
                return DOM.getOuterSize(this.getElement());
        };

        P.getInnerSize = function() {
                return DOM.getInnerSize(this.getContentElement());
        };

        P.display = function(v) {
                var s = this.getElement().style;
                if (v != null) {
                        s.display = v ? "" : "none";
                        this.applyHooks("onDisplay", [ v, s.display, "display" ]);
                        return v;
                }
                return s.display != "none";
        };

        P.visibility = function(v) {
                var s = this.getElement().style;
                if (v != null) {
                        s.visibility = v ? "" : "hidden";
                        this.applyHooks("onDisplay", [ v, s.visibility, "visibility" ]);
                        return v;
                }
                return s.visible != "hidden";
        };

        P.opacity = function(o) {
                return DOM.setOpacity(this.getElement(), o);
        };

        P.position = function(p) {
                var s = this.getElement().style, o = s.position;
                if (p != null) {
                        s.position = p;
                }
                return o;
        };

        // FIXME: sucks?!
        P.setIconClass = function(iconClass) {
                var e2 = this.getContentElement();
                CC(e2, iconClass != null, this.__withIconClass || this._className.peek() + "-withIcon");
                if (this.iconClass)
                        DC(e2, this.iconClass);
                if (iconClass)
                        AC(e2, iconClass);
                this.iconClass = iconClass;
        };

        P.addClass = function(ac, dc) {
                AC(this.getElement(), ac, dc);
        };

        P.delClass = function(dc, ac) {
                DC(this.getElement(), dc, ac);
        };

        P.condClass = function(cond, clsTrue, clsFalse) {
                CC(this.getElement(), cond, clsTrue, clsFalse);
                return cond;
        };

        P.zIndex = function(zIndex) {
                var el = this.getElement();
                if (zIndex != null) {
                        el.style.zIndex = zIndex;
                        return zIndex;
                }
                if (el.style.zIndex)
                        return parseInt(el.style.zIndex, 10);
                return 0;
        };

        P.refNode = function(name, el) {
                this[name] = el;
                this.__refNodes.remove(name);
                if (el != null)
                        this.__refNodes.push(name);
                return el;
        };

        P.debug_highlight = function(color) {
                this.getElement().style.backgroundColor = color || "yellow";
        };

        P.getQuickPopup = function() {
                var p = this.getParent(DlPopup) || 0;
                if (p)
                        p = p._level + 1;
                return DlDialogPopup.get(p);
        };

        P.quickPopup = function(args) {
                var p = this.getQuickPopup();
                args = Object.makeCopy(args);
                Object.mergeUndefined(args, {
                        anchor    : this.getElement(),
                        align     : { prefer: "CC" }
                });
                p.popup(args);
        };

        P.getScroll = function() {
                var el = this.getElement();
                return { x: el.scrollLeft,
                         y: el.scrollTop };
        };

        P.scrollIntoView = function() {
                // XXX: this is messy.
                if (is_gecko)
                        this.getElement().scrollIntoView();
                else
                        DOM.scrollIntoView(this.getElement());
        };

        P.flash = function(timeout, steps) {
                DOM.flash(this.getElement(), timeout, steps);
        };

        DlEvent.atUnload(function(){
                do {
                        window.DL_CLOSING = true;
                        var destroying = false;
                        for (var i in WIDGETS) {
                                destroying = true;
                                var w = WIDGETS[i];
                                try { WIDGETS[i] = null; delete WIDGETS[i]; w.destroy(); } catch(ex) {};
                                break;
                        }
                } while (destroying);
                WIDGETS = null;
        });

});
