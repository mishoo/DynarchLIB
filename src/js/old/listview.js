// @require container.js
// @require gridmodel.js

(function(){

	eval(DynarchDomUtils.importCommonVars());

	var DEFAULT_ARGS = {
		_model   : [ "model"   , null ],
		_sortCol : [ "sortCol" , null ],
		_headers : [ "headers" , true ]
	};
	var BASE = DlListView.inherits(DlContainer);
	function DlListView(args) {
		if (args) {
			BASE.constructor.call(this, args);
			Dynarch.setDefaults.call(this, DEFAULT_ARGS, args);
			if (this._model != null)
				this.setModel(this._model);
		}
	};

	var D = DlListView;
	var P = D.prototype;

	D.RE_ALIGN_CLASS = /DlListView-align-[^\s]+/g;

	function setTDW(td, width) {
		td.style.width = width + "px";
		td.firstChild.style.width = width - 6 + "px";
	};

	function scrollHeader() {
		var scroller = this.getScroller();
		var head_scroller = this.getHeadScroller();
		head_scroller.scrollLeft = scroller.scrollLeft;
	};

// 	P._createElement = function() {
// 		BASE._createElement.call(this);
// 	};

	P.getHeaderRow = function() {
		if (!this._idHeaders) {
			this._idHeaders = ID();
			var table = CE("table", null, { id: this._idHeaders,
							className: "DlListView-colheader",
							cellSpacing: 0,
							cellPadding: 0 },
				       CE("div", null, { className: "DlListView-headscroller" },
					  this.getElement()));
			if (!this._headers)
				table.style.display = "none";
			return CE("tr", null, null,
				  CE("tbody", null, null, table));
		} else
			return document.getElementById(this._idHeaders).rows[0];
	};

	P.getHeaderTable = function() {
		return this.getHeaderRow().parentNode.parentNode;
	};

	P.getScroller = function() {
		return document.getElementById(this._idScroller);
	};

	P.getHeadScroller = function() {
		return this.getScroller().previousSibling;
	};

	P.getContentTable = function() {
		return this.getScroller().firstChild;
	};

	P.getHeadButton = function(i) {
		return this._headButtons[i];
	};

	P.makeHeader = function() {
		var cp = this._model.getColProps();
		var tr = this.getHeaderRow();
		cp.foreach(function(prop, col){
				   var td = CE("td", null, { className: "DlListView-colheader-cell" }, tr);
				   var b = new DlListHeadButton({ parent: this, appendArgs: td, col: col,
								  model: this._model,
								  className: "DlListView-colheader-celldiv" });
				   this._headButtons.push(b);
				   this._model.writeHeader(col, td, b);
			   }, this);
	};

	P.getColWidth = function(col) {
		var t = this.getContentTable();
		var td = t.rows[0].cells[col];
 		if (!is_ie)
 			return parseInt(td.firstChild.style.width) + 6;
 		else
			return td.offsetWidth;
	};

	P.setColWidth = function(col, width, headOnly) {
		setTDW(this.getHeaderRow().cells[col], width);
		if (!headOnly) {
			setTDW(this.getContentTable().rows[0].cells[col], width);
			scrollHeader.call(this);
		}
		this.resetHeaderWidth();
//  		Dynarch.makeArray(this.getContentTable().rows).r_foreach(function(row) {
//  			setTDW(row.cells[col], width);
//  		});
	};

	P.resetHeaderWidth = function() {
		var cols = this._model.cols;
		var last = this.getHeaderRow().cells[cols - 1];
		var last_w = this.getColWidth(cols - 1);
		var table = this.getContentTable();
		var scroller = this.getScroller();
		var barw = DOM.getScrollbarSize(scroller).x;
		var diff = this.getInnerSize().x - table.offsetWidth;
		--last_w;
		if (table.offsetWidth < scroller.clientWidth) {
			setTDW(last, last_w + diff);
// 			last = table.rows[0].lastChild;
// 			setTDW(last, last_w + diff - barw);
		} else {
			setTDW(last, last_w + barw);
		}
	};

	P.resetWidths = function() {
		var table = this.getContentTable();
		if (is_ie) {
			table.style.tableLayout = "auto";
			this.getHeaderTable().style.tableLayout = "auto";
		}
		var cp = this._model.getColProps();
		var head_cells = this.getHeaderRow().cells;
		var first_row = this.getContentTable().rows[0].cells;
		var n = first_row.length;
		var col_widths = new Array(n);
		var head_widths = new Array(n);
		for (var i = n; --i >= 0;) {
			col_widths[i] = first_row[i].offsetWidth;
			head_widths[i] = head_cells[i].offsetWidth;
		}
		this.display(false);
		cp.r_foreach(function(prop, col){
			var w = prop.width;
			if (w == null)
				w = Math.max(col_widths[col], head_widths[col]);
			var last = col + 1 == this.length;
			setTDW(head_cells[col], w);
			setTDW(first_row[col], w);
		});
		if (is_ie) {
			table.style.tableLayout = "";
			this.getHeaderTable().style.tableLayout = "";
		}
		this.display(true);
		this.resetHeaderWidth();
	};

	P.setModel = function(model) {
		this.destroyChildWidgets();

		this._headButtons = [];
		var el = this.getElement();
		el.innerHTML = "";
		this._model = model;

		this._idHeaders = null;

		this._idScroller = ID();

		this.makeHeader();

		var scroller = CE("div", null, { id: this._idScroller, className: "DlListView-scroller" }, el);
		DOM.addEvent(scroller, "scroll", scrollHeader.$(this));
		var table = CE("table", null, { className: "DlListView-content",
						cellSpacing: 0,
						cellPadding: 0 });
		var tbody = CE("tbody", null, null, table);

		var cache_tr, cache_td;
		CE("div", null, { className: "DlListView-celldiv" },
		   cache_td = CE("td", null, { className: "DlListView-cell" },
				 cache_tr = CE("tr", null, { className: "DlListView-row" })));
		(this._model.cols - 1).times(function(){
			cache_tr.appendChild(cache_td.cloneNode(true));
		});

		var data = model.data;
		for (var i = 0; i < data.length; ++i) {
			var row = data[i];
			var tr = cache_tr.cloneNode(true);
			CC(tr, i & 1, "DlListView-row-odd", "DlListView-row-even");
			for (var j = 0; j < row.length; ++j)
				row[j].write(this, tr.cells[j]);
			tbody.appendChild(tr);
		}

		scroller.appendChild(table);
		this.setUnselectable();
	};

	P.refresh = function() {
		var table = this.getContentTable();
		table.style.display = "none";
		this._model.data.r_foreach(function(row, i) {
			tr = table.rows[i];
			row.r_foreach(function(cell, j) {
				cell.write(this, tr.cells[j]);
			});
		});
		table.style.display = "";
	};

	P.setSize = P.setOuterSize = function(size) {
		var el = this.getElement();
		DOM.setOuterSize(el, size.x, size.y);
		var h = this.getHeaderTable().offsetHeight;
		var bp = DOM.getBorder(el);
		if (size.y)
			this.getScroller().style.height = size.y - bp.y - h + "px";
		if (size.x) {
			this.getScroller().style.width =
				this.getHeadScroller().style.width = size.x - bp.x + "px";
		}
		this.resetHeaderWidth();
	};

	window.DlListView = D;

})();

(function(){
	eval(DynarchDomUtils.importCommonVars());

	var BASE = DlListItem.inherits(DlAbstractButton);
	function DlListItem(args) {
		if (args) {
			DlListItem.setDefaults(this, args);
			BASE.constructor.call(this, args);
		}
	};

	var D = DlListItem;
	var P = D.prototype;

	D.DEFAULT_ARGS = {
		_noCapture : [ "noCapture", true ],
		_row       : [ "row"      , 0 ],
		_listView  : [ "listView" , null ]
	};
})();

(function(){

	eval(DynarchDomUtils.importCommonVars());

	var BASE = DlListHeadButton.inherits(DlAbstractButton);
	function DlListHeadButton(args) {
		if (args) {
			DlListHeadButton.setDefaults(this, args);
			BASE.constructor.call(this, args);
			this._resizeHandlers = {
				onMouseMove  : doDrag.$(this),
				onMouseUp    : stopDrag.$(this),
				onMouseOver  : DlException.stopEventBubbling,
				onMouseOut   : DlException.stopEventBubbling,
				onMouseEnter : DlException.stopEventBubbling,
				onMouseLeave : DlException.stopEventBubbling
			};
		}
	};

	var D = DlListHeadButton;
	var P = D.prototype;

	D.DEFAULT_ARGS = {
		_col       : [ "col"       , 0 ],
		_model     : [ "model"     , null ],
		_classes   : [ "classes"   , { active    : "DlListHeadButton-active",
					       hover     : "DlListHeadButton-hover",
					       checked   : "DlListHeadButton-1",
					       unchecked : "DlListHeadButton-0",
					       empty     : "DlListHeadButton-empty",
					       disabled  : "DlListHeadButton-disabled" } ]
	};

	var RE_REMOVE_SORT = /DlListHeadButton-sort-[^\s]+/g;

	function cursorResize(how) {
		var CC = DynarchDomUtils.condClass, b = document.body;
		CC(b, how < 0, "CURSOR-RESIZE-W");
		CC(b, how > 0, "CURSOR-RESIZE-E");
	};

	function startDrag(ev) {
		if (!this.dragging) {
			this.dragging = true;
			this._dragPos = ev.pos;
			this._dragWidth = this.parent.getColWidth(this._col);
			if (this._canResize < 0)
				this._dragWidth2 = this.parent.getColWidth(this._col - 1);
			this._setResizeCaptures(true);
		}
	};

	function doResize(ev, full) {
		full = !full;
		var pos = ev.pos;
		var delta = pos.x - this._dragPos.x;
		var lv = this.parent, col = this._col, prev = col - 1;
		if (this._canResize > 0) {
			var w = this._dragWidth + delta;
			if (w < 6)
				w = 6;
			lv.setColWidth(col, w, full);
		} else {
			var w = this._dragWidth - delta;
			if (w < 6)
				w = 6;
			lv.setColWidth(col, w, full);
			w = this._dragWidth2 + delta;
			if (w < 6)
				w = 6;
			lv.setColWidth(prev, w, full);
		}
	};

	function doDrag(ev) {
		if (this.dragging) {
			if (this._doResizeTimeout)
				clearTimeou(this._doResizeTimeout);
			setTimeout(doResize.$(this, ev, false), 30);
			DlException.stopEventBubbling();
		}
	};

	function stopDrag(ev) {
		if (this.dragging) {
			this.dragging = false;
			this._setResizeCaptures(false);
			doResize.call(this, ev, true);
			cursorResize(0);
		}
	};

	D.OBJECT_EXTENSIONS = {

 		_createLabelElement : DlButton.prototype._createLabelElement,

 		getContentElement : DlButton.prototype.getContentElement,

		setIconClass : DlButton.prototype.setIconClass,

		_onMouseDown : function(ev) {
			if (this._canResize == 0)
				return BASE._onMouseDown.call(this, ev);
			startDrag.call(this, ev);
			DlException.stopEventBubbling();
		},

		_onMouseUp : function(ev) {
			if (this._canResize == 0)
				return BASE._onMouseUp.call(this, ev);
		},

		_onMouseEnter : function(ev) {
			this._setResizeState(ev);
			if (this._canResize == 0)
				BASE._onMouseEnter.call(this, ev);
		},

		_onMouseLeave : function(ev) {
			cursorResize(0);
			return BASE._onMouseLeave.call(this, ev);
		},

		_onMouseMove : function(ev) {
			this._setResizeState(ev);
			//if (this._canResize != 0)
			//this._onMouseLeave();
		},

		_onClick : function(ev) {
			var lv = this.parent;
			var table = lv.getContentTable();

			// temporarily hide table
			table.style.display = "none";

			var tbody = table.firstChild;
			var rows = table.rows;
			var first_row = rows[0].cells;

			// associate <tr> with model data
			this._model.data.r_foreach(function(row, i){
				row._tr = rows[i];
			});

			// sort
			if (lv._sortCol == this._col)
				lv._sortOrder = !lv._sortOrder;
			else
				lv._sortOrder = true;
			this._model.qsort(this._col, !lv._sortOrder);
			if (lv._sortCol != null)
				lv._headButtons[lv._sortCol].delClass(RE_REMOVE_SORT);

			// set class names
			this.delClass(RE_REMOVE_SORT);
			lv._sortCol = this._col;
			this.addClass("DlListHeadButton-sort-" + (lv._sortOrder ? "up" : "down"));

			// reorder table rows
			this._model.data.foreach(function(row, i){
				CC(row._tr, i & 1, "DlListView-row-odd", "DlListView-row-even");
				tbody.appendChild(row._tr);
				delete row._tr;
			});

			// reset col widths since first <tr> might have moved
			var new_first_row = table.rows[0].cells;
			if (new_first_row !== first_row) {
				for (var i = 0; i < first_row.length; ++i) {
					new_first_row[i].style.width = first_row[i].style.width;
					new_first_row[i].firstChild.style.width = first_row[i].firstChild.style.width;
					first_row[i].style.width = "";
					first_row[i].firstChild.style.width = "";
				}
			}

			// display table
			table.style.display = "";
		},

		_setResizeState : function(ev) {
			var can = this._canResize = this._checkCanResize(ev);
			this.condClass(can == 0, this._classes.hover);
			cursorResize(can);
		},

		_checkCanResize : function(ev) {
			var pos = ev.computePos(this);
			var sz = this.getSize();
			if (this._col > 0 && pos.x < 6 && pos.x >= 0) {
				return -1;
			} else if (this._col < this._model.cols - 1 &&
				   pos.x > sz.x - 6 && pos.x <= sz.x) {
				return 1;
			}
			return 0;
		},

		_setListeners : function() {
			BASE._setListeners.call(this);
			this.addEventListener("onMouseMove", this._onMouseMove.$(this));
		},

		_setResizeCaptures : function(capture) {
			(capture ? DlEvent.captureGlobals : DlEvent.releaseGlobals)
				(this._resizeHandlers);
		}

	};
	D.inject();

	window.DlListHeadButton = D;

})();
