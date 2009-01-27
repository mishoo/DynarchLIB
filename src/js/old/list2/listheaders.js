(function(){

	var RESIZE_HANDLE_WIDTH = 6;

	eval(DynarchDomUtils.importCommonVars());
	var BASE = DlListHeaders.inherits(DlContainer);
	function DlListHeaders(args) {
		if (args) {
			D.setDefaults(this, args);
			BASE.constructor.call(this, args);

			this._resizeHandlers = {
				onMouseMove  : doResize.$(this),
				onMouseUp    : stopResize.$(this),
				onMouseOver  : DlException.stopEventBubbling,
				onMouseOut   : DlException.stopEventBubbling,
				onMouseEnter : DlException.stopEventBubbling,
				onMouseLeave : DlException.stopEventBubbling
			};
		}
	};
	var D = window.DlListHeaders = DlListHeaders;
	var P = D.prototype;

	D.DEFAULT_ARGS = {
		_columns : [ "columns", null ],
		_spacing : [ "spacing", 0 ]
	};

	P._createElement = function() {
		BASE._createElement.call(this);
		this.initColumns();
		this.setUnselectable();
	};

	P._setListeners = function() {
		this.registerEvents([ "onColResize" ]);
	};

/** One column:

 - width (undefined means auto)
 - label
 - resizable

*/

	{
		var handle = null;

		function startColResize(self, ev) {
			handle = this;
			ev = ev || window.event;
			var dlev = new DlEvent(ev);
			self._dragPos = dlev.computePos(self);
			for (var i = this; i; i = i.nextSibling)
				i.origPos = self._dragPos.x - i.offsetLeft;
			for (var i = this.col + 1; i < self._columns.length; ++i) {
				var w = self._widgets[i];
				w.origPos = self._dragPos.x - w.getElement().offsetLeft;
			}
			self._dragPos.origSize = self._widgets[this.col].getOuterSize().x;
			self._setResizeCaptures(true);
			AC(document.body, "CURSOR-RESIZE-E");
			AC(this, "DlListHeaders-resizeHandleDragging");
		};

		function doResize(ev) {
			var pos = ev.computePos(this);
			var newsize = this._dragPos.origSize + pos.x - this._dragPos.x;
			if (newsize > 15) {
				for (var i = handle; i; i = i.nextSibling)
					i.style.left = pos.x - i.origPos + "px";
				var w = this._widgets[handle.col];
				w.setOuterSize({ x: newsize });
				for (var i = handle.col + 1; i < this._columns.length; ++i) {
					var w = this._widgets[i];
					w.setPos(pos.x - w.origPos);
				}
				this.callHooks("onColResize", false, handle.col, newsize);
			}
		};

		function stopResize(ev) {
			var col = handle.col;
			DC(handle, "DlListHeaders-resizeHandleDragging");
			handle = null;
			DC(document.body, "CURSOR-RESIZE-E");
			this._setResizeCaptures(false);
			var pos = ev.computePos(this);
			var newsize = this._dragPos.origSize + pos.x - this._dragPos.x;
			if (newsize > 15) {
				this.callHooks("onColResize", true, col, newsize);
			}
		};
	}

	P.getColSize = function(col) {
		return this._widgets[col].getOuterSize().x;
	};

	P.setColSize = function(col, newsize) {
		if (newsize < 15)
			newsize = 15;
		var orig = this.getColSize(col);
		var diff = newsize - orig;
		var w = this._widgets[col];
		w.setOuterSize({ x: newsize });
		var div = this._widgets.peek().getElement().nextSibling;
		while (div) {
			if (div.widget === w)
				break;
			div = div.nextSibling;
		}
	};

	P._setResizeCaptures = function(capture) {
		(capture ? DlEvent.captureGlobals : DlEvent.releaseGlobals)(this._resizeHandlers);
	};

	P.initColumns = function() {
		this._columns.foreach(function(col, i) {
			var btn = new DlListHeadLabel({ label: col.label, parent: this, iconClass: col.icon });
			if (col.width)
				btn.setOuterSize({ x: col.width });
			if (col.align)
				btn.addClass("DlAlign-" + col.align);
		}, this);
		var space = this._spacing, left = 0, height = 0;
		var colResizeHandler = startColResize.$(null, this);
		this._columns.foreach.$(this._columns, function(col, i) {
			var b = this._widgets[i], sz = b.getOuterSize();
			b.setPos(left, 0);
			b.setOuterSize({ x: sz.x });
			left += sz.x + space;
			if (sz.y > height)
				height = sz.y;
			if (col.resizable) {
				var div = CE("div", { left   : left - RESIZE_HANDLE_WIDTH/2 + "px",
						      height : height + "px",
						      width  : space + RESIZE_HANDLE_WIDTH + "px" },
					     { className   : "DlListHeaders-resizeHandle",
					       onmousedown : colResizeHandler,
					       col	   : i,
					       widget      : b
					     },
					     this.getElement());
			}
			if (i == this._columns.length - 1)
				this.setOuterSize({ x: 10000, y: height });
		}.$(this)).delayed(10);
	};
})();

(function(){
	var BASE = DlListHeadLabel.inherits(DlButton);
	function DlListHeadLabel(args) {
		if (args) {
			D.setDefaults(this, args);
			BASE.constructor.call(this, args);
		}
	};
	var D = window.DlListHeadLabel = DlListHeadLabel;
	var P = D.prototype;

// 	var CLS = { active    : "DlListHeadLabel-active",
// 		    hover     : "DlListHeadLabel-hover",
// 		    checked   : "DlListHeadLabel-1",
// 		    unchecked : "DlListHeadLabel-0",
// 		    empty     : "DlListHeadLabel-empty",
// 		    disabled  : "DlListHeadLabel-disabled"
// 		  };

// 	D.DEFAULT_ARGS = {
// 		_classes : [ "classes", CLS ]
// 	};
})();
