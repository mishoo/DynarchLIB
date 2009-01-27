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
		this._hbox = new DlHbox({ parent: this });
		this.initColumns();
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
			for (var i = handle; i; i = i.nextSibling)
				i.origPos = self._dragPos.x - i.offsetLeft;
			self._dragPos.origSize = self._hbox._widgets[handle.col].getSize().x;
			self._setResizeCaptures(true);
			AC(document.body, "CURSOR-RESIZE-EW");
		};

		function doResize(ev) {
			var pos = ev.computePos(this);
			var newsize = this._dragPos.origSize + pos.x - this._dragPos.x;
			if (newsize > 15) {
				for (var i = handle; i; i = i.nextSibling)
					i.style.left = pos.x - i.origPos + "px";
				this._hbox._widgets[handle.col].setSize({ x: newsize });
			}
		};

		function stopResize(ev) {
			handle = null;
			DC(document.body, "CURSOR-RESIZE-EW");
			this._setResizeCaptures(false);
		};
	}

	P._setResizeCaptures = function(capture) {
		(capture ? DlEvent.captureGlobals : DlEvent.releaseGlobals)(this._resizeHandlers);
	};

	P.initColumns = function() {
		var space = this._spacing;
		this._columns.foreach(function(col, i) {
			if (space && i)
				this._hbox.createCellElement().style.paddingLeft = space + "px";
			var btn = new DlListHeadLabel({ label: col.label, parent: this._hbox, iconClass: col.icon });
			if (col.width)
				btn.setSize({ x: col.width });
		}, this);
		this._columns.foreach.$(this._columns, function(col, i) {
			if (col.resizable) {
				var el = this._hbox._widgets[i].getElement().parentNode;
				var x = el.offsetLeft + el.offsetWidth;
				var y = el.offsetHeight;
				var div = CE("div", { left   : x - RESIZE_HANDLE_WIDTH/2 + "px",
						      height : y + "px",
						      width  : space + RESIZE_HANDLE_WIDTH + "px" },
					     { className: "DlListHeaders-resizeHandle" },
					     this.getElement());
				div.col = i;
				div.onmousedown = startColResize.$(null, this);
			}
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
