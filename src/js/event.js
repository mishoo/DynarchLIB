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

DEFINE_CLASS("DlEvent", null, function(D, P, DOM){

        var CE = DOM.createElement;

        var EVENT_MAP = {
                "mouseover"       : "onMouseEnter",
                "mouseout"        : "onMouseLeave",
                "mousedown"       : "onMouseDown",
                "mouseup"         : "onMouseUp",
                "mousemove"       : "onMouseMove",
                "click"           : "onClick",
                "dblclick"        : "onDblClick",
                "keydown"         : "onKeyDown",
                "keyup"           : "onKeyUp",
                "keypress"        : "onKeyPress",
                "contextmenu"     : "onContextMenu",
                "focus"           : "on_DOM_Focus",
                "blur"            : "on_DOM_Blur",
                "mousewheel"      : "onMouseWheel",
                "DOMMouseScroll"  : "onMouseWheel",
                "textInput"       : "onTextInput",
                "paste"           : "onPaste",
                "copy"            : "onCopy",
                "cut"             : "onCut"
        };

        D.CONSTRUCT = function(ev) {
                this.type = ev.type;
                this.dl_type = EVENT_MAP[this.type] || this.type;
                this.ctrlKey = ev.ctrlKey;
                this.which = ev.which;
                this.keyIdentifier = ev.keyIdentifier;
                if (is_macintosh) {
                        this.altGrKey = ev.altKey;
                        this.altKey = ev.metaKey;
                } else {
                        // this.metaKey = ev.metaKey;
                        this.altKey = ev.altKey;
                }
                this.shiftKey = ev.shiftKey;
                this.button = ev.button;
                this.focusedWidget = D.focusedWidget();
                if (is_ie) {
                        switch (ev.button) {
                            case 0: this.button = null; break;
                            case 1: this.button = 0; break;
                            case 2: this.button = 2; break;
                            case 4: this.button = 1; break;
                        }
                }
                if (this.type.indexOf("key") == 0) {
                        this.keyCode = ev.keyCode;
                        this.charCode = "which" in ev ? ev.which : (is_ie || is_opera) ? ev.keyCode : ev.charCode;
                        this.keyStr = String.fromCharCode(this.charCode);
                }
                if (this.dl_type == "onMouseWheel") {
                        var delta;
                        if (ev.wheelDelta) {
                                delta = ev.wheelDelta / 120;
                        } else if (ev.detail) {
                                delta = -ev.detail / 3;
                        }
                        this.wheelDelta = delta;
                }
                this.pos = { x : ev.clientX,
                             y : ev.clientY };
                this.relPos = this.pos;
                if (is_ie) {
                        this.target = ev.srcElement;
                        switch (this.type) {
                            case "mouseover" : this.relatedTarget = ev.fromElement; break;
                            case "mouseout"  : this.relatedTarget = ev.toElement; break;
                        }
                } else try {
                        this.target = ev.target;
                        if (this.target.nodeType == 3 /* Node.TEXT */)
                                this.target = this.target.parentNode;
                        if (this.type == "mouseout" || this.type == "mouseover") {
                                this.relatedTarget = ev.relatedTarget;
                                if (this.relatedTarget && this.relatedTarget.nodeType == 3 /* Node.TEXT */)
                                        this.relatedTarget = this.relatedTarget.parentNode;
                        }
                } catch(ex) {
                        // ignore, mozilla bug: 208427 (4 years old, still "NEW")
                        this.relatedTarget = ev.explicitOriginalTarget;
                        // this._failed = true;
                }
        };

        P.computePos = function(widget) {
                var el = widget
                        ? ( widget instanceof DlWidget ?
                            widget.getElement() :
                            widget )
                        : document.body;
                var pos = this.elPos = el
                        ? DOM.getPos(el)
                        : { x: 0, y: 0 };
                return this.relPos = { x     : this.pos.x - pos.x,
                                       y     : this.pos.y - pos.y,
                                       elPos : pos
                                     };
        };

        P.getObject = function(type) {
                var el = this.target;
                var obj = this.object;
                if (!obj) {
                        try {
                                while (el && !DlWidget.getFromElement(el))
                                        el = el.parentNode;
                                obj = el ? DlWidget.getFromElement(el) : null;
                        } catch(ex) {
                                obj = null;
                        }
                        this.object = obj;
                }
                if (type)
                        obj = obj.getParent(type);
                return obj;
        };

        P.getParentElement = function(tag, stop) {
                if (stop && stop instanceof DlWidget)
                        stop = stop.getElement();
                if (stop && el === stop)
                        return null;
                var el = this.target;
                try {
                        while (el && el.tagName.toLowerCase() != tag) {
                                el = el.parentNode;
                                if (stop && el === stop)
                                        return null;
                        }
                } catch(ex) {
                        el = null;
                }
                return el;
        };

        D.stopEvent = DOM.stopEvent;

        // var _captures = {};
        // var _captures_by_event = {};

//        var prev_ms_enter;

        function _processEvent(obj, dev, el, ev) {
                var o2 = dev.getObject();
                switch (dev.type) {

                    case "click":
                        break;

                    case "mousedown":
                        obj._ev_mouseDown = true;
                        obj.applyHooks(dev.dl_type, [ dev ]);
                        break;

                    case "mouseup":
                        var tmp = obj._ev_mouseDown;
                        obj._ev_mouseDown = false;
                        obj.applyHooks(dev.dl_type, [ dev ]);
                        if (tmp && obj._ev_mouseInside && dev.button === 0) {
                                dev = new DlEvent(ev);
                                dev.dl_type = "onClick";
                                this.push([ obj, dev, el, ev ]);
                        }
                        break;

                    case "mouseover":
                    case "mouseout":
                        if (!el || !DOM.related(el, ev)) {
                                if (obj === o2)
                                        obj._ev_mouseInside = dev.type == "mouseover";
                                obj.applyHooks(dev.dl_type, [ dev ]);
//                                 if (dev.dl_type == "onMouseEnter") {
//                                         if (prev_ms_enter && !prev_ms_enter.destroyed && prev_ms_enter._ev_mouseInside && prev_ms_enter != obj) {
//                                                 var tmp = obj.parent;
//                                                 while (tmp && tmp != prev_ms_enter)
//                                                         tmp = tmp.parent;
//                                                 if (!tmp) {
//                                                         dev = new DlEvent(ev);
//                                                         dev.dl_type = "onMouseLeave";
//                                                         this.push([ prev_ms_enter, dev, el, ev ]);
//                                                         prev_ms_enter._ev_mouseInside = false;
//                                                 }
//                                         }
//                                         prev_ms_enter = obj;
//                                 } else if (dev.dl_type == "onMouseLeave") {
//                                         prev_ms_enter = null;
//                                 }
                        } else {
                                // FIXME: this seems to be a hack ;)
                                dev.dl_type = dev.type == "mouseover"
                                        ? "onMouseOver" : "onMouseOut";
                                obj.applyHooks(dev.dl_type, [ dev ]);
                        }
                        break;

//                  case "keydown":
//                  case "keyup":
//                  case "keypress":

                    case "dblclick":
                        if ((is_ie || is_opera) && !obj.hasHooks("onDblClick")) {
                                dev = new DlEvent(ev);
                                dev.type = "click";
                                obj.applyHooks(dev.dl_type = "onClick", [ dev ]);
                                break;
                        }
                        // else we go to default!

                    default:
                        obj.applyHooks(dev.dl_type, [ dev ]);
                        break;
                }
                if (ev && dev.domStop)
                        DOM.stopEvent(ev);
        };

        var focusedWidget = null;

        function on_focusedWidget_destroy() {
                if (this === focusedWidget)
                        focusedWidget = null;
        };

        D.fakeBlur = function() {
                if (is_safari && focusedWidget.blur)
                        return focusedWidget.blur();
                var a = DOM.CE_CACHE.FAKE_FOCUS;
                if (!a) {
                        a = DOM.CE_CACHE.FAKE_FOCUS =
                                CE("a", null, {
                                        href      : "#",
                                        innerHTML : ".",
                                        className : "DYNARCH-FAKE-FOCUS"
                                }, document.body);
                }
                a.focus();
                if (is_ie) {
                        var r = document.body.createTextRange();
                        r.moveStart("character", 0);
                        r.collapse(true);
                        r.select();
                }
                a.blur();
                window.status = "";
        };

        D.focusedWidget = function(w) {
                if (arguments.length > 0 && focusedWidget !== w) {
                        if (focusedWidget && !focusedWidget.destroyed /* XXX: WTF? */) {
                                if (focusedWidget._focusable == 2) {
                                        if (w._focusable < 2)
                                                D.fakeBlur();
                                } else {
                                        focusedWidget.blur();
                                }
                                focusedWidget.removeEventListener("onDestroy", on_focusedWidget_destroy);
                        }
                        focusedWidget = w;
                        if (w) {
                                w.addEventListener("onDestroy", on_focusedWidget_destroy);
                                var p = w.parent;
                                while (p) {
                                        p._focusedWidget = w;
                                        p = p.parent;
                                }
                        }
                }
                return focusedWidget;
        };

        D.checkDisabled = function(w) {
                while (w) {
                        if (w.disabled())
                                return true;
                        w = w.parent;
                }
                return false;
        };

        P.destroy = function() {
                this.object =
                        this.target =
                        this.relatedTarget =
//                      this.pos =
//                      this.relPos =
                        null;
        };

        P.stopDomEvent = function() {
                D.stopEvent(D.latestDomEvent);
        };

        var GLOBAL_CAPTURES = D.GLOBAL_CAPTURES = {};

        var KEY_EVENTS = "keydown keyup keypress".hashWords();

        // var CKT=0;
        D._genericEventHandler = function(ev, ev2) {
                ev || (ev = window.event);
                // window.status = "still here " + (++CKT);
                var el, obj, dev = ev instanceof D ? ev : new D(ev);
                if (ev2)
                        ev = ev2;
                if (dev._failed) {
                        // ignore, mozilla bug: 208427 (4 years old, still "NEW")
                        // ev.relatedTarget is an anonymous DIV
                        D.stopEvent(ev);
                        return;
                }
                D.latestEvent = dev;
                D.latestDomEvent = ev;
                if (dev.pos.x && dev.dl_type != "onMouseWheel") {
                        D.latestMouseEvent = dev;
                        if (dev.dl_type == "onMouseDown")
                                D.latestMouseDownEvent = dev;
                }
                try {
                        var a = GLOBAL_CAPTURES[dev.dl_type], i;
                        if (a)
                                for (i = a.length; --i >= 0;)
                                        a[i](dev);

                        if (dev.type in KEY_EVENTS && focusedWidget)
                                el = focusedWidget.getElement();
                        else
                                el = dev.target;

                        //window.status = dev.dl_type;
                        var objects = [];
                        i = 0;
                        while (el) {
                                obj = DlWidget.getFromElement(el);
                                if (obj) {
                                        if (!D.checkDisabled(obj))
                                                objects[i++] = [ obj, dev, el, ev ];
                                        if (obj.__noPropEvents && obj.__noPropEvents.test(dev.dl_type))
                                                break;
                                }
                                el = el.parentNode;
                        }
                        for (i = 0; i < objects.length; ++i)
                                _processEvent.apply(objects, objects[i]);
                } catch(ex) {
                        if (ex instanceof DlExStopEventBubbling)
                                D.stopEvent(ev);
                        else
                                throw ex;
                }
                dev.destroy();
        };

        var _unloadListeners = [];
        function _unloadHandler() {
                _unloadListeners.r_foreach(Function.invoke);
        };

        D._unloadHandler = _unloadHandler;

        // map type => function ref.
        D.captureGlobals = function(obj) {
                for (var i in obj)
                        D.captureGlobal(i, obj[i]);
        };

        // map type => function ref.
        D.releaseGlobals = function(obj) {
                for (var i in obj)
                        D.releaseGlobal(i, obj[i]);
        };

        D.captureGlobal = function(type, f) {
                var a = GLOBAL_CAPTURES[type];
                if (!a)
                        a = GLOBAL_CAPTURES[type] = [];
                a.push(f);
        };

        D.releaseGlobal = function(type, f) {
                var a = GLOBAL_CAPTURES[type];
                if (a)
                        a.remove(f);
        };

        D.atUnload = function(f) { _unloadListeners.push(f); };

        DOM.addEvents
        (document, [ "contextmenu", "click", "dblclick",
                     "mousedown", "mouseup",
                     "mouseover",
                     "mouseout",
                     "mousemove",
                     is_gecko ? "DOMMouseScroll" : "mousewheel",
                     "keydown", "keyup", "keypress",
                     "paste", "copy", "cut" ],
         D._genericEventHandler);

        DOM.addEvent(window, "unload", _unloadHandler);

});
