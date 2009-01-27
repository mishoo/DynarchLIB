// @require widget.js
// @require layout.js

(function() {

	var BASE = DlResizeBar.inherits(DlWidget);
	function DlResizeBar(args) {
		if (args) {
			D.setDefaults(this, args);
			this._invert = this._invert ? -1 : 1;
			DlWidget.call(this, args);
		}
	};

	eval(Dynarch.EXPORT("DlResizeBar", true));

	D.DEFAULT_ARGS = {
		_isHoriz : [ "horiz"	    , null ],
		_widget  : [ "widget"	    , null ],
		_invert  : [ "invert"	    , false ],
		_min     : [ "min"	    , null ],
		_max     : [ "max"	    , null ],
		_cont    : [ "continuous"   , false ],
		_keepPrc : [ "keepPercent"  , false ]
	};

	D.getDragBar = function() {
		return DlElementCache.DRAGGING_LINE;
	};

	P.initDOM = function() {
		BASE.initDOM.call(this);
		this.condClass(this.isHoriz(), "DlResizeBar-Horizontal", "DlResizeBar-Vertical");
		this.setUnselectable(null, true);
	};

	P.isHoriz = function() {
		if (this._isHoriz == null) {
			var args = DlLayout.getArgs(this);
			if (args)
				this._isHoriz = /top|bottom/.test(args.pos);
		}
		return this._isHoriz;
	};

	P._setListeners = function() {
		BASE._setListeners.call(this);
		this._resizeHandlers = {
			onMouseMove  : mouseMove.$(this),
			onMouseUp    : stopResize.$(this),
			onMouseOver  : DlException.stopEventBubbling,
			onMouseOut   : DlException.stopEventBubbling,
			onMouseEnter : DlException.stopEventBubbling,
			onMouseLeave : DlException.stopEventBubbling
		};
		this.addEventListener("onMouseDown", startDrag);
	};

	P._setResizeCaptures = function(capture) {
		(capture ? DlEvent.captureGlobals : DlEvent.releaseGlobals)(this._resizeHandlers);
		var div = DlDialog.activateEventStopper(capture);
                CC(div, capture, this.isHoriz() ? "CURSOR-RESIZE-S" : "CURSOR-RESIZE-E");
	};

	function startDrag(ev) {
		var el = DlElementCache.DRAGGING_LINE;
		var pos = this.getPos();
		this._dragPos = this.isHoriz() ? pos.y : pos.x;
		var mpos = this.isHoriz() ? ev.pos.y : ev.pos.x;
		this._mposDiff = mpos - this._dragPos;
		var size = this.getSize();
		el.style.top = pos.y + "px";
		el.style.left = pos.x + "px";
		el.style.width = size.x + "px";
		el.style.height = size.y + "px";
		if (this._widget) {
			var s = this._widget instanceof DlWidget
                                ? this._widget.getSize()
                                : DOM.getOuterSize(this._widget);
			this._dragSize = this.isHoriz() ? s.y : s.x;
		}
		document.body.appendChild(el);
		this._setResizeCaptures(true);
		DlException.stopEventBubbling();
	};

	P._doResize = function(ev) {
		var H = this.isHoriz();
		var pos = DOM.getPos(DlElementCache.DRAGGING_LINE);
		var pos = H ? pos.y : pos.x;
		var diff = this._invert * (pos - this._dragPos);
		var w = this._widget;
		if (w) {
			var s = this._dragSize;
                        if (w instanceof DlWidget) {
                                var f = DlLayout.getArgs(w);
                                if (f) {
                                        f = f.fill;
                                        var isPrc = /%$/.test(f);
                                        if (isPrc && !this._keepPrc || f == null || typeof f == "number") {
                                                DlLayout.setFill(w, s + diff);
                                        } else if (isPrc) {
                                                // if s == f, then s + diff = X
                                                // X = f * (s + diff) / s
                                                f = parseFloat(f);
                                                DlLayout.setFill(w, f * (s + diff) / s + "%");
                                        }
                                } else {
                                        if (this._isHoriz)
                                                w.setSize({ y: s + diff });
                                        else
                                                w.setSize({ x: s + diff });
                                }
                        } else {
                                if (this._isHoriz)
                                        DOM.setOuterSize(w, null, s + diff);
                                else
                                        DOM.setOuterSize(w, s + diff, null);
                        }
                }
	};

	function stopResize(ev) {
		this._setResizeCaptures(false);
		this._doResize(ev);
		document.body.removeChild(DlElementCache.DRAGGING_LINE);
	};

	function mouseMove(ev) {
		var el = DlElementCache.DRAGGING_LINE;
		var pos = this.isHoriz() ? ev.pos.y : ev.pos.x;
		pos -= this._mposDiff;
		var diff = this._invert * (pos - this._dragPos);
		var min = this._min, max = this._max, w = this._widget;
		if (w) {
			var args = DlLayout.getArgs(w);
			if (args) {
				if (min == null)
					min = args.min;
				if (max == null)
					max = args.max;
			}
			var s;
			if (min != null || max != null) {
				s = this._dragSize + diff;
			}
			if (min != null && s < min) {
				pos += this._invert * (min - s);
			} else if (max != null && s > max) {
				pos += this._invert * (max - s);
			}
		}
		if (this.isHoriz())
			el.style.top = pos + "px";
		else
			el.style.left = pos + "px";
		if (this._cont)
			this._doResize(ev);
	};

})();
