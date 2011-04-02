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
                this.clear();
                this.redraw();
        };
        P.getSortedElements = function() {
                var a = this._elements.mergeSort($cmp_zindex);
                if (this._activeEl)
                        a.unshift.apply(a, this._activeEl.handles());
                return a;
        };
        P.redraw = function() {
                this.getSortedElements().reverse().foreach(this.renderElement, this);
        };
        P.renderElement = function(el) {
                var ctx = this.getContext();
                ctx.save();
                el.render(ctx, this);
                ctx.restore();
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
                                if (!active_set && el.activable()) {
                                        if (el !== this._activeEl) {
                                                if (this._activeEl)
                                                        this._activeEl.applyHooks("onActivate", [ false ]);
                                                el.applyHooks("onActivate", [ true ]);
                                                this._activeEl = el;
                                        }
                                        active_set = true;
                                }
                                el.applyHooks("onMouseDown", args);
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

        /* -----[ supporting classes ]----- */

        D.Element = DEFINE_CLASS(null, DlEventProxy, function(D, P){
                D.DEFAULT_EVENTS = (THE_EVENTS + " onActivate").qw();
                P.pointInside = function(p, ctx) {
                        try {
                                ctx.save();
                                this.setMyPath(ctx);
                                return ctx.isPointInPath(p.x, p.y);
                        } finally {
                                ctx.restore();
                        }
                };
                P.handles = function() {
                        return [];
                };
                P.activable = function() {
                        return false;
                };
        });

        D.Rect = DEFINE_CLASS(null, D.Element, function(D, P){
                D.CONSTRUCT = function(x, y, w, h) {
                        this._rect = new DlRect(x || 0, y || 0, w || 0, h || 0);
                        this._zIndex = 0;
                };
                P.rectangle = function() {
                        return this._rect;
                };
                P.copyRectangle = function() {
                        return new DlRect(this._rect);
                };
                P.left = function(x) {
                        if (x != null) this._rect.x = x;
                        return this._rect.x;
                };
                P.top = function(y) {
                        if (y != null) this._rect.y = y;
                        return this._rect.y;
                };
                P.right = function(r) {
                        if (r != null) this._rect.w = r - this._rect.x;
                        return this._rect.x + this._rect.w;
                };
                P.bottom = function(b) {
                        if (b != null) this._rect.h = b - this._rect.y;
                        return this._rect.y + this._rect.h;
                };
                P.hcenter = function() {
                        return this.left() + this.width() / 2;
                };
                P.vcenter = function() {
                        return this.top() + this.height() / 2;
                };
                P.width = function(w) {
                        return this._rect.width(w);
                };
                P.height = function(h) {
                        return this._rect.height(h);
                };
                P.zIndex = function(z) {
                        if (z != null) this._zIndex = z;
                        return this._zIndex;
                };
                P.getPos = function() {
                        return this._rect.getTL();
                };
                P.setPos = function(x, y) {
                        this.left(x);
                        this.top(y);
                };
                P.setMyPath = function(ctx) {
                        ctx.beginPath();
                        ctx.rect(this.left(), this.top(), this.width(), this.height());
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
                        EX();
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

        // ActiveRect -- movable

        D.ActiveRect = DEFINE_CLASS(null, D.Rect, function(D, P){
                D.CONSTRUCT = function() {
                        this._handles = {};
                        make_movable(this);
                        this.addEventListener({
                                onActivate: function(active){
                                        if (!active) {
                                                Array.hashKeys(this._handles).map("destroy");
                                                this._handles = {};
                                        } else {
                                                this.createHandles();
                                        }
                                },
                                onMove: function() {
                                        this.createHandles();
                                }
                        });
                };
                P.createHandles = function() {
                        var self = this;
                        makeHandle(self, "TL", self.left(), self.top());
                        makeHandle(self, "T", self.hcenter(), self.top());
                        makeHandle(self, "TR", self.right(), self.top());
                        makeHandle(self, "L", self.left(), self.vcenter());
                        makeHandle(self, "R", self.right(), self.vcenter());
                        makeHandle(self, "BL", self.left(), self.bottom());
                        makeHandle(self, "B", self.hcenter(), self.bottom());
                        makeHandle(self, "BR", self.right(), self.bottom());
                };
                P.handles = function() {
                        return Array.hashValues(this._handles);
                };
                P.activable = function() {
                        return true;
                };

                function makeHandle(self, type, x, y) {
                        var handle = new Handle(x, y);
                        self._handles[type] = handle;
                        return handle;
                };
        });

        // a Handle is that little black thingy that you drag in order
        // to resize a rectangle, for example.  They could be useful
        // for various other stuff.

        var Handle = D.Handle = DEFINE_CLASS(null, D.Element, function(D, P){
                var DIM_COLOR = "rgba(0, 0, 255, 0.5)";
                var STRONG_COLOR = "#5500ff";
                D.CONSTRUCT = function(x, y, sz) {
                        var self = this;
                        make_movable(self);
                        self._point = new DlPoint(x, y);
                        self._size = sz || 4;
                        self.addEventListener({
                                onMouseEnter: function(x, y, ctx, cw) {
                                        cw.withSavedContext(function(ctx){
                                                ctx.fillStyle = STRONG_COLOR;
                                                self.setMyPath(ctx);
                                                ctx.fill();
                                        });
                                },
                                onMouseLeave: function(x, y, ctx, cw) {
                                        cw.withSavedContext(function(ctx){
                                                self.setMyPath(ctx);
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
                P.render = function(ctx) {
                        ctx.fillStyle = this.dragging ? STRONG_COLOR : DIM_COLOR;
                        this.setMyPath(ctx);
                        ctx.fill();
                };
                P.zIndex = function() {
                        return MAX_Z;
                };
                P.setPos = function(x, y) {
                        this._point.x = x;
                        this._point.y = y;
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
