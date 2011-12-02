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
// @require geometry.js

// HAIRY STUFF, try not to touch it. ;-)

DEFINE_CLASS("DlPopup", DlContainer, function(D, P, DOM) {

        var CE = DOM.createElement,
            AC = DOM.addClass,
            DC = DOM.delClass,
            CC = DOM.condClass;

        var POPUPS = {};
        var ALL_POPUPS = {};
        var POPUPS_BY_ID = {};

        // DlPopup.POPUPS_BY_ID = POPUPS_BY_ID;

        var RE_REMOVE_SCROLL = /DlPopup-scroll(Up|Down)?-hover/g;

        D.BEFORE_BASE = function() {
                this._hasScrolling = false;
                this.visible = false;
        };

        D.DEFAULT_EVENTS = [ "onPopup", "onHide" ];

        D.DEFAULT_ARGS = {
                _level     : [ "level"      , 0 ],
                _autolink  : [ "autolink"   , true ],
                _oscroll   : [ "scroll"     , { step1: 5, step2: 10, speed: 40 } ],
                _align     : [ "align"      , null ],
                _zIndex    : [ "zIndex"     , 1000 ],
                _focusable : [ "focusable"  , true ]
        };

        P.FINISH_OBJECT_DEF = function() {
                D.BASE.FINISH_OBJECT_DEF.call(this);
                this.constructor.get = D.get;
                this.constructor.clearAll = D.clearAll;
                POPUPS[this._objectType] = [];
                ALL_POPUPS[this._objectType] = {};
        };

        // FIXME: this function is known to suck
        D.get = function(level, nocreate) {
                var type = this.prototype._objectType;
                var shouldAttach = false;
                var max = POPUPS[type].length;
                if (level == null || level >= max) {
                        level = max;
                        shouldAttach = true;
                }
                var pt = ALL_POPUPS[type];
                if (!ALL_POPUPS[type])
                        pt = ALL_POPUPS[type] = {};
                var ret = pt[level];
                if (!ret) {
                        if (!nocreate)
                                ret = pt[level] = new this({ level: level });
                        else
                                ret = null;
                }
                ret.detachPopup();
                if (shouldAttach && level > 0)
                        ret.attachToPopup(POPUPS[type].peek());
                return ret;
        };

        D.clearAll = function(lev) {
                var a = POPUPS[this.prototype._objectType];
                a = a[lev || 0];
                if (a)
                        a.hide();
        };

        D.clearAllPopups = function(except) {
                for (var i in POPUPS_BY_ID) {
                        if (!except || !except[i])
                                POPUPS_BY_ID[i].hide();
                }
        };

        P._createElement = function() {
                var parent = this._parent;
                this._parent = null;
                D.BASE._createElement.call(this);
                var div = this.getElement();
                this.parent = parent;
                this.display(false);
                document.body.appendChild(div);
                if (is_gecko)
                        div = CE("div", null, { className: "Gecko-Bug-302380" }, div);
                this.refNode("_contentEl", CE("div", null, { className: "DlPopup-scrollArea" }, div));
                this.zIndex(this._zIndex);
        };

        P.getContentElement = function() {
                return this._contentEl;
        };

        P.getScrollDiv = P.getContentElement;

        P._scrollSetArrowState = function() {
                var
                        div      = this.getScrollDiv(),
                        s1       = this._scroll_el(0),
                        s2       = this._scroll_el(1),
                        at_start = div.scrollTop == 0,
                        at_end   = div.scrollTop + div.offsetHeight == div.scrollHeight;
                if (at_start || at_end)
                        this._scrollStopHandler();
                CC(s1, at_start, "DlPopup-scrollUp-disabled");
                CC(s2, at_end, "DlPopup-scrollDown-disabled");
        };

        function _scrollHandler(dir) {
                this.getScrollDiv().scrollTop += this._scrollStep * dir;
                this._scrollSetArrowState();
        };

        function _scrollStartHandler(self, dir) {
                self._scrollStep = self._oscroll.step1;
                self._scrollTimer = setInterval(_scrollHandler.$(self, dir),
                                                self._oscroll.speed);
                AC(this, "DlPopup-scroll-hover");
                CC(this, dir > 0, "DlPopup-scrollDown-hover", "DlPopup-scrollUp-hover");
        };

        P._scrollStopHandler = function() {
                if (this._scrollTimer) {
                        clearInterval(this._scrollTimer);
                        this._scrollTimer = null;
                        this._scrollSetArrowState();
                }
                DC(this._scroll_el(0), RE_REMOVE_SCROLL);
                DC(this._scroll_el(1), RE_REMOVE_SCROLL);
        };

        P._scrollDoubleSpeed = function(dbl) {
                this._scrollStep = this._oscroll[dbl ? "step2" : "step1"];
                return false;
        };

        P._scroll_setup = function() {
                if (!this._hasScrolling) {
                        this._hasScrolling = true;
                        var e = this.getElement(),
                                s1 = CE("div", null, { className: "DlPopup-scrollUp" }, e, 0),
                                s2 = CE("div", null, { className: "DlPopup-scrollDown" }, e);
                        s1.onmouseover = _scrollStartHandler.$(null, this, -1);
                        s2.onmouseover = _scrollStartHandler.$(null, this, 1);
                        s1.onmouseout = s2.onmouseout = this._scrollStopHandler.$(this);
                        s1.onmousedown = s2.onmousedown = this._scrollDoubleSpeed.$(this, true);
                        s1.onmouseup = s2.onmouseup = this._scrollDoubleSpeed.$(this, false);
                        this.refNode("_scrollEl0", s1);
                        this.refNode("_scrollEl1", s2);
                        this.getScrollDiv().onscroll = this._scrollSetArrowState.$(this);
                }
                this._scroll_visibile(true);
        };

        P._scroll_el = function(p) {
                return this["_scrollEl"+p];
        };

        P._scroll_visibile = function(vis) {
                if (this._hasScrolling) {
                        if (is_gecko) // Gecko-Bug-302380 : https://bugzilla.mozilla.org/show_bug.cgi?id=302380
                                this.getScrollDiv().parentNode.style.overflow = vis ? "auto" : "";
                        vis = vis ? "" : "none";
                        this._scroll_el(0).style.display = vis;
                        this._scroll_el(1).style.display = vis;
                        this.args.scrollVisible = !vis;
                }
        };

        function onPopup() {
                POPUPS[this._objectType][this._level] = this;
                if (!this._autolink || this._level == 0)
                        POPUPS_BY_ID[this.id] = this;
        };
        function onHide() {
                var a = POPUPS[this._objectType];
                var child = a[this._level + 1];
                if (child)
                        child.hide();
                a.splice(this._level, 1); // couldn't we use pop() instead?
                if (POPUPS_BY_ID[this.id])
                        delete POPUPS_BY_ID[this.id];
        };
        function onMouseWheel(ev) {
                if (this.args.scrollVisible) {
                        var div = this.getScrollDiv(), st = div.scrollTop;
                        if (ev.wheelDelta < 0) {
                                st += 20;
                        } else {
                                st -= 20;
                                if (st < 0)
                                        st = 0;
                        }
                        div.scrollTop = st;
                        ev.domStop = true;
                        DlException.stopEventBubbling();
                }
        };

        var have_doc_listener = false;
        function global_onMouseDown(ev) {
                var obj = ev.getObject();
                var except = {};
                while (obj && !(obj instanceof D)) {
                        if (obj.currentPopup)
                                except[obj.currentPopup.id] = true;
                        obj = obj.parent;
                }
                if (obj) {
//                      var top = obj.getToplevelPopup();
//                      if (!top)
//                              top = obj;
//                      except[top.id] = true;
                        while (obj != null) {
                                except[obj.id] = true;
                                obj = obj._parentPopup;
                        }
                }
                D.clearAllPopups(except);
        };

        P._setListeners = function() {
                D.BASE._setListeners.call(this);
                this.addEventListener({ onPopup      : onPopup,
                                        onMouseWheel : onMouseWheel,
                                        onHide       : onHide });
                if (!have_doc_listener) {
                        have_doc_listener = true;
                        DlEvent.captureGlobal("onMouseDown", global_onMouseDown);
                }
        };

        function _do_popup(args) {
                if (args.onBeforePopup)
                        args.onBeforePopup.call(this, args);
                this._timer = null;
                if (!this.setContent(args.content))
                        return; // nothing to popup
                if (args.onPopup)
                        args.onPopup.call(this, args);
                this.applyHooks("onPopup", [ args ]);
                this.showAt(args.anchor, args.align || this._align, args.pos, args.shift, args.fluid);
                this._prevFocus = DlEvent.focusedWidget();
                this.focus();
        };

        P.popup = function(args) {
                this.args = args;
                this.cancel();
                if (!args.timeout)
                        _do_popup.call(this, args);
                else
                        this._timer = _do_popup.$(this, args).delayed(args.timeout);
        };

        function _do_hide() {
                if (this.visible) {
                        if (this.args && this.args.onHide)
                                this.args.onHide.call(this, this.args);
                        if (this._focusable && this._prevFocus) try {
                                this._prevFocus.focus();
                        } catch(ex) {}
                        this.args = null;
                        this._timer = null;
                        this.callHooks("onHide");
                        this.display(false);
                        this.visible = false;
                        // we need to delay this so that onmouseout events occur
                        // this.setContent.$(this, null).delayed(100);
                }
        };

        P.hide = function(timeout) {
                this.cancel();
                if (!timeout)
                        _do_hide.call(this);
                else
                        this._timer = _do_hide.$(this).delayed(timeout);
        };

        P.cancel = function() {
                if (this._timer) {
                        clearTimeout(this._timer);
                        this._timer = null;
                }
        };

        P.correctPos = Function.noop;

        P.reposition = function() {
                if (this.visible) {
                        this.showAt(this.args.anchor,
                                    this.args.align || this._align,
                                    this.args.pos,
                                    this.args.shift,
                                    this.args.fluid);
                }
        };

        P.showAt = function(anchor, align, mousePos, shift, fluid) {
                var origpos, p, sa, div = this.getScrollDiv();
                if (!align)
                        align = this._align;
                if (align == "mouse") {
                        if (mousePos == null)
                                mousePos = Object.makeCopy(DlEvent.latestMouseEvent.pos);
                        origpos = mousePos;
                        if (this._mouseDiff) {
                                origpos.x += this._mouseDiff.x;
                                origpos.y += this._mouseDiff.y;
                        }
                        align = {
                                prefer : "__",
                                fallX1 : "_R",
                                fallX2 : "_L",
                                fallY1 : "B_",
                                fallY2 : "T_"
                        };
                } else {
                        origpos = DOM.getPos(anchor);
                        if (shift) {
                                if (shift.x)
                                        origpos.x += shift.x;
                                if (shift.y)
                                        origpos.y += shift.y;
                        }
                }
                sa = DOM.getOuterSize(anchor);
                p = Object.makeCopy(origpos);
                this.visibility(false);
                div.style.height = "";
                this._scroll_visibile(false);
                this.setPos(-30000, -30000);
                this.display(true);
                if (is_ie)
                        this.getElement().style.width = "";
                var r = this._bestPosition(align, p, sa),
                        h = r.height();
                var sph = this.getScrollDiv().offsetHeight;
                var fuzz = this.getElement().offsetHeight - sph;
                p = r.getTL();
                // alert(h+ " -- "+ sp.h);
                if (h < sph) {
                        if (fluid) {
                                this.children(0).setSize({ y: h });
                        } else {
                                if (is_ie)
                                        this.getElement().style.width = div.offsetWidth + "px";
                                this._scroll_setup();
                                var
                                        h1 = this._scroll_el(0).offsetHeight,
                                        h2 = this._scroll_el(1).offsetHeight;
                                div.style.height = h - h1 - h2 - fuzz + "px";
                                this._scrollSetArrowState();
                                div.scrollTop = 0;
                        }
                }
                this.correctPos(p);
                this.setPos(p.x, p.y);
                if (this._parentPopup) {
                        var ZI = this._parentPopup.zIndex() + 1;
                        this.zIndex(ZI);
                }
                this.visibility(true);
                this.visible = true;
        };

        P._bestPosition = function(align, p, sa) {
                var sp = DOM.getWindowSize(),
                        r  = new DlRect(0, 0, sp.x, sp.y),
                        p1 = new DlPoint(p);

                sp = this.getSize();

                // check preferred alignment
                this._doAlign(align.prefer, p1, sa);
                var tmp = new DlRect(p1, sp).intersect(r);
                var cxp = this.checkXPos(p1, r);
                var cyp = this.checkYPos(p1, r);
                if (cxp == 0 && cyp == 0)
                        // all set
                        return tmp;

                if (cxp != 0) {

                        // check left
                        p1.x = p.x;
                        this._doAlign(align.fallX1, p1, sa);
                        var rl = new DlRect(p1, sp).intersect(r);

                        // check right
                        p1.x = p.x;
                        this._doAlign(align.fallX2, p1, sa);
                        var rr = new DlRect(p1, sp).intersect(r);

                        if (rl && rr) {
                                p1 = rl.area() > rr.area() ? rl.getTL() : rr.getTL();
                        } else if (rl) {
                                p1 = rl.getTL();
                        } else if (rr) {
                                p1 = rr.getTL();
                        }
                        this.args.fallX = true;

                }

                if (cyp != 0) {

                        // check top
                        p1.y = p.y;
                        this._doAlign(align.fallY1, p1, sa);
                        var rt = new DlRect(p1, sp).intersect(r);

                        // check bottom
                        p1.y = p.y;
                        this._doAlign(align.fallY2, p1, sa);
                        var rb = new DlRect(p1, sp).intersect(r);

                        if (rt && rb) {
                                p1 = rt.area() > rb.area() ? rt.getTL() : rb.getTL();
                        } else if (rt) {
                                p1 = rt.getTL();
                        } else if (rb) {
                                p1 = rb.getTL();
                        }
                        this.args.fallY = true;

                }

                return new DlRect(p1, sp).intersect(r);
        };

        P._doAlign = function(align, p, sa) {
                var
                        sp     = this.getSize(),
                        valign = align.substr(0, 1),
                        halign = "";

                if (align.length > 1)
                        halign = align.substr(1, 1);

                switch (valign) {
                    case "T": p.y -= sp.y; if (this._mouseDiff && this.args.align == "mouse") p.y -= 2*this._mouseDiff.y; break;
                    case "B": p.y += sa.y; if (this._mouseDiff && this.args.align == "mouse") p.y += 2*this._mouseDiff.y; break;
                    case "C":
                    case "c": p.y += (sa.y - sp.y) / 2; break;
                    case "t": p.y += sa.y - sp.y; break;
                    case "b": break; // already there
                }
                switch (halign) {
                    case "L": p.x -= sp.x; if (this._mouseDiff && this.args.align == "mouse") p.x -= 2*this._mouseDiff.x; break;
                    case "R": p.x += sa.x; if (this._mouseDiff && this.args.align == "mouse") p.x += 2*this._mouseDiff.x; break;
                    case "C":
                    case "c": p.x += (sa.x - sp.x) / 2; break;
                    case "l": p.x += sa.x - sp.x; break;
                    case "r": break; // already there
                }
        };

        P.checkXPos = function(p, rect) {
                if (p.x < rect.x)
                        return p.x - rect.x;
                var s = this.getSize();
                var d = p.x + s.x - rect.x - rect.w;
                return d > 0 ? d : 0;
        };

        P.checkYPos = function(p, rect) {
                if (p.y < rect.y)
                        return p.y - rect.y;
                var s = this.getSize();
                var d = p.y + s.y - rect.y - rect.h;
                return d > 0 ? d : 0;
        };

        P.attachToPopup = function(popup) {
                this._parentPopup = popup;
                popup._childPopup = this;
        };

        P.detachPopup = function() {
                if (this._parentPopup)
                        this._parentPopup._childPopup = null;
                this._parentPopup = null;
        };

        P.getToplevelPopup = function() {
                var p = this;
                while (p._parentPopup)
                        p = p._parentPopup;
                return p;
//              return POPUPS[this._objectType][0];
        };

        P._handle_focusKeys = function(ev) {
                if (!ev.altKey && !ev.ctrlKey) {
                        if (ev.keyCode == DlKeyboard.ESCAPE) {
                                this.hide();
                        } else if (ev.keyCode == DlKeyboard.TAB) {
                                var w = ev.focusedWidget;
                                w = ev.shiftKey
                                        ? this.getPrevFocusWidget(w)
                                        : this.getNextFocusWidget(w);
                                if (w)
                                        w.focus();
                                ev.domStop = true;
                                DlException.stopEventBubbling();
                        }
                }
                this._handleKeybinding(ev);
        };

});
