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
// @require geometry.js

DEFINE_CLASS("DlCanvas", DlContainer, function(D, P, DOM){

        var MAX_Z = 100000;
        var THE_EVENTS = "onMouseMove onMouseDown onMouseUp onMouseEnter onMouseLeave onClick";
        var EX = DlException.stopEventBubbling;

        D.DEFAULT_ARGS = {
                width: [ "width", 100 ],
                height: [ "height", 100 ]
        };
        D.CONSTRUCT = function() {
                this._elements = [];
                this._activeEl = null;
                this._noUpdates = 0;
        };
        P.setMouseListeners = function() {
                THE_EVENTS.qw().foreach(function(ev){
                        if (this[ev] instanceof Function)
                                this.addEventListener(ev, this[ev]);
                }, this);
        };
        P._createElement = function() {
                D.BASE._createElement.apply(this, arguments);
                this.setContent("<canvas width='" + this.width + "' height='" + this.height + "'></canvas>");
        };
        P.getCanvas = function() {
                return this.getContentElement().firstChild;
        };
        P.getContext = function() {
                return this._context || this.refNode("_context", this.getCanvas().getContext('2d'));
        };
        P.withContext = function(cont) {
                cont(this.getContext());
        };
        P.withSavedContext = function(cont) {
                this.getContext().save();
                try {
                        return cont(this.getContext());
                } finally {
                        this.getContext().restore();
                }
        };
        P.setSize = function(size) {
                this.getCanvas().width = size.x;
                this.getCanvas().height = size.y;
                this.refresh();
                this.callHooks("onResize");
        };
        P.add = function(el) {
                this._elements.push(el);
                this.refresh();
        };
        P.clear = function() {
                var c = this.getCanvas();
                this.getContext().clearRect(0, 0, c.width, c.height);
        };
        P.refresh = function() {
                if (this._noUpdates == 0) {
                        this.clear();
                        this.getSortedElements().reverse().foreach(this.renderElement, this);
                }
        };
        P.getSortedElements = function() {
                var a = this._elements.mergeSort($cmp_zindex);
                if (this._activeEl)
                        a.unshift.apply(a, this._activeEl.handles());
                return a;
        };
        P.renderElement = function(el) {
                var ctx = this.getContext();
                ctx.save();
                el.render(ctx, this);
                ctx.restore();
        };
        P.withNoUpdates = function(cont) {
                ++this._noUpdates;
                try { return cont(); }
                finally { --this._noUpdates; }
        };

        // event handlers

        function mouseHandler(cont) {
                return function(ev) {
                        var pos = ev.computePos(this);
                        var ctx = this.getContext();
                        var args = [ pos.x, pos.y, ctx, this, ev ];
                        return cont.call(this, ev, pos, ctx, args);
                };
        };

        P.onMouseMove = mouseHandler(function(ev, pos, ctx, args) {
                this.getSortedElements().foreach(function(el){
                        if (el.pointInside(pos, ctx)) {
                                if (!el.__mouseInside) {
                                        el.__mouseInside = true;
                                        el.applyHooks("onMouseEnter", args);
                                }
                                el.applyHooks("onMouseMove", args);
                        } else if (el.__mouseInside) {
                                el.__mouseInside = false;
                                el.applyHooks("onMouseLeave", args);
                        }
                }, this);
        });

        P.onMouseLeave = mouseHandler(function(ev, pos, ctx, args) {
                this.getSortedElements().foreach(function(el){
                        if (el.__mouseInside) {
                                el.__mouseInside = false;
                                el.applyHooks("onMouseLeave", args);
                        }
                }, this);
        });

        P.onMouseDown = mouseHandler(function(ev, pos, ctx, args) {
                var active_set = false;
                this.getSortedElements().foreach(function(el){
                        if (el.pointInside(pos, ctx)) {
                                if (el instanceof D.Handle) {
                                        active_set = true;
                                }
                                else if (!active_set && el.activable()) {
                                        if (el !== this._activeEl) {
                                                if (this._activeEl)
                                                        this._activeEl.applyHooks("onActivate", [ false ]);
                                                el.applyHooks("onActivate", [ true ]);
                                                this._activeEl = el;
                                        }
                                        active_set = true;
                                }
                                el.applyHooks("onMouseDown", args);
                                $BREAK();
                        }
                }, this);
                if (!active_set) {
                        if (this._activeEl) {
                                this._activeEl.applyHooks("onActivate", [ false ]);
                                this._activeEl = null;
                                this.refresh();
                        }
                } else {
                        this.refresh();
                }
        });

        P.onMouseUp = mouseHandler(function(ev, pos, ctx, args) {
                this.getSortedElements().foreach(function(el){
                        if (el.pointInside(pos, ctx))
                                el.applyHooks("onMouseUp", args);
                }, this);
        });

        P.onClick = mouseHandler(function(ev, pos, ctx, args) {
                this.getSortedElements().foreach(function(el){
                        if (el.pointInside(pos, ctx))
                                el.applyHooks("onClick", args);
                }, this);
        });

        D.make_movable = make_movable;
        D.make_resizable = make_resizable;

        /* -----[ supporting classes ]----- */

        D.Element = DEFINE_CLASS(null, DlEventProxy, function(D, P){
                D.CONSTRUCT = function() {
                        this._zIndex = 0;
                };
                D.DEFAULT_EVENTS = (THE_EVENTS + " onActivate").qw();
                P.pointInside = function(p, ctx) {
                        ctx.save();
                        this.setMyPath(ctx);
                        ctx.restore();
                        return ctx.isPointInPath(p.x, p.y);
                };
                P.handles = function() {
                        return [];
                };
                P.activable = function() {
                        return false;
                };
                P.setClipPath = function(ctx) {
                        this.setMyPath(ctx);
                };
                P.zIndex = function(z) {
                        if (z != null) this._zIndex = z;
                        return this._zIndex;
                };
        });

        D.Rect = DEFINE_CLASS(null, D.Element, function(D, P){
                D.CONSTRUCT = function(x, y, w, h) {
                        this._p1 = new DlPoint(x, y);
                        this._p2 = new DlPoint(x + w, y + h);
                        this.normalize();
                };
                P.normalize = function() {
                        this._p1.normalize(this._p2);
                };
                P.rectangle = function() {
                        return new DlRect(this._p1, this._p2);
                };
                P.left = function(x) {
                        if (x != null) {
                                this._p1.x = x;
                                this.normalize();
                        }
                        return this._p1.x;
                };
                P.top = function(y) {
                        if (y != null) {
                                this._p1.y = y;
                                this.normalize();
                        }
                        return this._p1.y;
                };
                P.right = function(x) {
                        if (x != null) {
                                this._p2.x = x;
                                this.normalize();
                        }
                        return this._p2.x;
                };
                P.bottom = function(y) {
                        if (y != null) {
                                this._p2.y = y;
                                this.normalize();
                        }
                        return this._p2.y;
                };
                P.hcenter = function() {
                        return (this.left() + this.right()) / 2;
                };
                P.vcenter = function() {
                        return (this.top() + this.bottom()) / 2;
                };
                P.width = function(w) {
                        return Math.abs(this._p2.x - this._p1.x);
                };
                P.height = function(h) {
                        return Math.abs(this._p2.y - this._p1.y);
                };
                P.getPos = function() {
                        return this._p1;
                };
                P.setPos = function(x, y) {
                        if (x != null) {
                                var dx = x - this._p1.x;
                                this._p1.x = x;
                                this._p2.x += dx;
                        }
                        if (y != null) {
                                var dy = y - this._p1.y;
                                this._p1.y = y;
                                this._p2.y += dy;
                        }
                };
                P.setMyPath = function(ctx) {
                        ctx.beginPath();
                        ctx.translate(this.hcenter(), this.vcenter());
                        //ctx.rotate(Math.PI / 10);
                        var w = this.width(), h = this.height();
                        var w2 = w / 2, h2 = h / 2;
                        ctx.rect(-w2, -h2, w, h);
                        ctx.closePath();
                };
                P.render = function(ctx) {
                        ctx.fillStyle = "#ffffff";
                        ctx.strokeStyle = "#000000";
                        this.setMyPath(ctx);
                        ctx.fill();
                        ctx.stroke();
                };
        });

        D.Ellipse = DEFINE_CLASS(null, D.Rect, function(D, P){
                function ellipse(ctx, x, y, w, h) {
                        var kappa = .5522848,
                        ox = (w / 2) * kappa, // control point offset horizontal
                        oy = (h / 2) * kappa, // control point offset vertical
                        xe = x + w,           // x-end
                        ye = y + h,           // y-end
                        xm = x + w / 2,       // x-middle
                        ym = y + h / 2;       // y-middle

                        ctx.moveTo(x, ym);
                        ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
                        ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
                        ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
                        ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
                };
                P.setMyPath = function(ctx) {
                        ctx.beginPath();
                        ctx.translate(this.hcenter(), this.vcenter());
                        var w = this.width(), h = this.height();
                        var w2 = w / 2, h2 = h / 2;
                        ellipse(ctx, -w2, -h2, w, h);
                        ctx.closePath();
                };
        });

        function make_movable(self) {
                self.registerEvents([ "onMove" ]);
                self._dragHandlers = {
                        onMouseMove: doDrag,
                        onMouseUp: stopDrag,
                        onMouseOver: EX,
                        onMouseOut: EX,
                        onMouseEnter: EX,
                        onMouseLeave: EX
                };
                self.addEventListener({
                        onMouseDown: startDrag,
                });

                function startDrag(x, y, ctx, cw, ev) {
                        self.dragging = true;
                        self.ctx = ctx;
                        self.cw = cw;
                        var pos = self.getPos();
                        self._dragDiff = {
                                x: pos.x - x,
                                y: pos.y - y
                        };
                        DlEvent.captureGlobals(self._dragHandlers);
                        ev.domStop = true;
                };

                function stopDrag() {
                        DlEvent.releaseGlobals(self._dragHandlers);
                        self.dragging = false;
                        self.cw.refresh();
                        self.cw = null;
                        self.ctx = null;
                        self._dragPos = null;
                };

                function doDrag(ev) {
                        var pos = ev.computePos(self.cw);
                        pos = {
                                x: pos.x + self._dragDiff.x,
                                y: pos.y + self._dragDiff.y
                        };
                        self.setPos(pos.x, pos.y);
                        self.applyHooks("onMove", [ pos ]);
                        self.cw.refresh();
                        EX();
                };
        };

        function make_resizable(self) {
                self._handles = {};
                make_movable(self);
                self.addEventListener({
                        onActivate: function(active){
                                if (!active) {
                                        Array.hashKeys(this._handles).map("destroy");
                                        this._handles = {};
                                } else {
                                        createHandles();
                                }
                        },
                        onMove: function() {
                                updateHandles();
                        }
                });

                function createHandles() {
                        makeHandle(self, "TL", function(){ return [ self.left()    , self.top()     ] });
                        makeHandle(self, "T" , function(){ return [ self.hcenter() , self.top()     ] });
                        makeHandle(self, "TR", function(){ return [ self.right()   , self.top()     ] });
                        makeHandle(self, "L" , function(){ return [ self.left()    , self.vcenter() ] });
                        makeHandle(self, "R" , function(){ return [ self.right()   , self.vcenter() ] });
                        makeHandle(self, "BL", function(){ return [ self.left()    , self.bottom()  ] });
                        makeHandle(self, "B" , function(){ return [ self.hcenter() , self.bottom()  ] });
                        makeHandle(self, "BR", function(){ return [ self.right()   , self.bottom()  ] });
                };

                function updateHandles() {
                        Object.foreach(self._handles, function(h){
                                h.update();
                        });
                };

                self.handles = function() {
                        return Array.hashValues(this._handles);
                };

                self.activable = function() {
                        return true;
                };

                function makeHandle(self, type, getpos) {
                        var pos = getpos();
                        var handle = new Handle(pos[0], pos[1]);
                        handle.update = function() {
                                var pos = getpos();
                                this.setPos(pos[0], pos[1]);
                        };
                        self._handles[type] = handle;
                        handle.addEventListener("onMove", MOVE_HANDLE[type]);
                        return handle;
                };

                var MOVE_HANDLE = {
                        TL: function(pos) {
                                self.left(pos.x);
                                self.top(pos.y);
                                updateHandles();
                        },
                        T: function(pos) {
                                self.top(pos.y);
                                updateHandles();
                        },
                        TR: function(pos) {
                                self.right(pos.x);
                                self.top(pos.y);
                                updateHandles();
                        },
                        L: function(pos) {
                                self.left(pos.x);
                                updateHandles();
                        },
                        R: function(pos) {
                                self.right(pos.x);
                                updateHandles();
                        },
                        BL: function(pos) {
                                self.left(pos.x);
                                self.bottom(pos.y);
                                updateHandles();
                        },
                        B: function(pos) {
                                self.bottom(pos.y);
                                updateHandles();
                        },
                        BR: function(pos) {
                                self.right(pos.x);
                                self.bottom(pos.y);
                                updateHandles();
                        }
                };
        };

        // a Handle is that little black thingy that you drag in order
        // to resize a rectangle, for example.  They could be useful
        // for various other stuff.

        var Handle = D.Handle = DEFINE_CLASS(null, D.Element, function(D, P){
                var DIM_COLOR = "rgba(0, 0, 0, 0.5)";
                var STRONG_COLOR = "#5500ff";
                var HOVER_COLOR = "rgba(255, 0, 0, 0.5)";
                D.CONSTRUCT = function(x, y, sz) {
                        var self = this;
                        make_movable(self);
                        self._point = new DlPoint(x, y);
                        self._size = sz || 4;
                        self.addEventListener({
                                onMouseEnter: function(x, y, ctx, cw) {
                                        cw.withSavedContext(function(ctx){
                                                ctx.strokeStyle = STRONG_COLOR;
                                                ctx.fillStyle = HOVER_COLOR;
                                                self.setMyPath(ctx);
                                                ctx.fill();
                                                ctx.stroke();
                                        });
                                },
                                onMouseLeave: function(x, y, ctx, cw) {
                                        cw.withSavedContext(function(ctx){
                                                self.setClipPath(ctx);
                                                ctx.clip();
                                                cw.refresh();
                                        });
                                }
                        });
                };
                P.setMyPath = function(ctx) {
                        ctx.beginPath();
                        ctx.arc(this._point.x, this._point.y, this._size, 0, 2 * Math.PI, true);
                        ctx.closePath();
                };
                P.setClipPath = function(ctx) {
                        ctx.beginPath();
                        ctx.rect(this._point.x - this._size - 1,
                                 this._point.y - this._size - 1,
                                 this._size * 2 + 2,
                                 this._size * 2 + 2);
                        ctx.closePath();
                };
                P.render = function(ctx) {
                        ctx.fillStyle = this.dragging ? STRONG_COLOR : DIM_COLOR;
                        this.setMyPath(ctx);
                        ctx.fill();
                };
                P.zIndex = function() {
                        return MAX_Z;
                };
                P.setPos = function(x, y) {
                        if (x != null) this._point.x = x;
                        if (y != null) this._point.y = y;
                };
                P.getPos = function() {
                        return this._point;
                };
        });

        /* -----[ other utilities ]----- */

        function $cmp_zindex(a, b) {
                return b.zIndex() - a.zIndex();
        };

});
