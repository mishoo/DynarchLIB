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
// @require drag.js
// @require resizebar.js
// @require dialog.js

/* -----[ data model ]----- */

DEFINE_CLASS("DlRecord", DlEventProxy, function(D, P) {

        D.DEFAULT_EVENTS = [ "onChange" ];

        D.DEFAULT_ARGS = {
                _data : [ "data"      , null ],
                _set  : [ "recordSet" , null ]
        };

        P.id = function() {
                return this._data.id;
        };

        P.get = function(key) {
                return this._data[key];
        };

        P.set = function(key, val, nohooks) {
                var a, old = this._data[key];
                this._data[key] = val;
                if (!nohooks) {
                        a = [ this, key, val, old ];
                        this.applyHooks("onChange", a);
                        this._set && this._set.applyHooks("onChange", a);
                }
        };

        P.compareTo = function(rec, col) {
                var a = this.get(col), b = rec.get(col);
                return a < b ? -1 : a == b ? 0 : 1;
        };

});

DEFINE_CLASS("DlRecordCache", DlEventProxy, function(D, P) {

        D.DEFAULT_EVENTS = [ "onChange", "onInsert", "onBeforeDelete", "onDelete", "onRefresh" ];

        D.DEFAULT_ARGS = {
                _data  : [ "data"  , null ]
        };

        D.CONSTRUCT = function() {
                this._init();
        };

        P.get = function(id) {
                return this._data[id];
        };

        P.hasRecord = function(id) {
                return this.get(id);
        };

        // override to support lazy loading
        P.getRecords = function(ids, callback, obj) {
                callback.call(obj, ids.map(this.get, this));
        };

        P.getAllIds = function() { return Array.hashKeys(this._data) };

        P.getAllRecords = function() { return Array.hashValues(this._data) };

        P.getHash = function() {
                return this._data;
        };

        P.formatHTML = function(rec, col_id, buf, col) {
                var html = col ? col.format(rec, this) : null;
                if (html == null) html = String(rec.get(col_id)).htmlEscape();
                buf(html);
        };

        // override
        P.getRecClass = function(rec) {};
        P.getCellClass = function(rec, col) {};

        P.getInsertPos = function(rec) {};

        P.insert = function(rec, where) {
                if (where == null)
                        where = this.getInsertPos(rec);
                this._data[rec.id()] = rec;
                rec._set = this;
                this.applyHooks("onInsert", [ rec, where ]);
        };

        P.remove = function(id) {
                this.applyHooks("onBeforeDelete", [ this.get(id) ]);
                if (id instanceof Array) {
                        id.foreach(function(id){
                                delete this._data[id];
                        }, this);
                } else
                        delete this._data[id];
                this.applyHooks("onDelete", [ id ]);
        };

        P.sort = function(ids, col, prev, rev, callback, obj) {
                var a;
                if (col == prev && rev !== null) {
                        a = ids.reverse();
                } else {
                        a = ids.mergeSort(function(a, b){
                                a = this.get(a);
                                b = this.get(b);
                                return a.compareTo(b, col);
                        }.$(this), rev);
                }
                callback.call(obj, a);
        };

        P._init = function() {
                if (!this._data) {
                        this._data = {};
                } else {
                        // expecting an array but convert to hash
                        var d = {};
                        this._data.foreach(function(rec){
                                d[rec.id()] = rec;
                                rec._set = this;
                        }, this);
                        this._data = d;
                }
        };

});

DEFINE_CLASS("DlDataGridHeadLabel", DlButton, function(D, P, DOM) {

        D.FIXARGS = function(args) {
                if (!("contextMenu" in args))
                        args.contextMenu = this._getContextMenu;
        };

        D.CONSTRUCT = function() {
                if (!this.isSortable()) {
                        var c = this._classes = Object.makeCopy(this._classes);
                        c.active = c.hover = null;
                }
        };

        var MIN_COL_WID = 20;

        P.setWidth = function(w) {
                this.setOuterSize({ x: w });
        };

        P.isSortable = function() {
                return this.col.isSortable();
        };

        // P.label = function(label) {
        //         if (arguments.length > 0)
        //                 this.setContent("<div class='DlButton-Label'>" + (this._label = label) + "</div>");
        //         return this._label;
        // };

        P._onClick = function() {
                if (this.isSortable())
                        this.parent._onHeadClick(this.col, this);
        };

        P._getContextMenu = function() {
                var m = this._dgContextMenu, grid = this.parent, a;
                if (!m) {
                        this._dgContextMenu = m = new DlVMenu({});
                        a = m.buttons = [];
                        grid._cols.foreach(function(col, i){
                                if (col.getMenuLabel()) {
                                        var cb = a[i] = new DlCheckbox({ parent: m, label: col.getMenuLabel(), checked: col.isVisible() });
                                        cb.addEventListener("onChange", function() {
                                                col.setVisible(this.checked());
                                        });
                                }
                        });
                } else {
                        a = m.buttons;
                        grid._cols.foreach(function(col, i){
                                a[i].checked(col.isVisible(), true);
                        });
                }
                return m;
        };

        D.DEFAULT_ARGS = {
                col : [ "col", null ],
                _focusable : [ "focusable", false ],
                _noCapture : [ "noCapture", true ],
                _classes : [ "classes", { active    : "DlDataGridHeadLabel-active",
                                          hover     : "DlDataGridHeadLabel-hover",
                                          checked   : "DlDataGridHeadLabel-1",
                                          unchecked : "DlDataGridHeadLabel-0",
                                          empty     : "DlDataGridHeadLabel-empty",
                                          disabled  : "DlDataGridHeadLabel-disabled"
                                        } ]
        };

        var EX = DlException.stopEventBubbling;

        function getResizeHandle(p) {
                var d = p._resizeHandle;
                if (!d) {
                        d = p._resizeHandle = new DlWidget({ parent: p, className: "DlDataGrid-resizeHandle" });
                        d.display(false);
                        d.grid = p.parent;
                        d.addEventListener({ onMouseLeave : d.display.$(d, false),
                                             onMouseDown  : startResize
                                           });
                        d._resizeCaptures = {
                                onMouseMove  : doResize.$(d),
                                onMouseUp    : stopResize.$(d),
                                onMouseOver  : EX,
                                onMouseOut   : EX,
                                onMouseEnter : EX,
                                onMouseLeave : EX
                        };
                }
                return d;
        };

        D._on_headMouseMove = function(ev) {
                if (!this._colPos || this.dragging)
                        return;
                var grid = this.parent, sl = grid.getBodyDiv().scrollLeft;
                var x = ev.computePos(this).x + sl;
                var found;
                this._colPos.foreach(function(c){
                        if (Math.abs(x - c.pos) < 4) {
                                if (c.col.isResizable())
                                        found = c;
                                $BREAK();
                        }
                });
                var rh = getResizeHandle(this);
                if (found) {
                        if (found.col !== rh.col) {
                                rh.found = found;
                                rh.col = found.col;
                                rh.pos = found.pos;
                                rh.setPos(found.pos - sl);
                        }
                        rh.display(true);
                } else {
                        rh.display(false);
                        rh.found = rh.col = null;
                }
        };

        D._on_headMouseLeave = function(ev) {
                getResizeHandle(this).display(false);
        };

        function startResize(ev) {
                this.dragging = true;
                var bar = DlResizeBar.getDragBar(), s = bar.style;
                this.sl = this.grid.getBodyDiv().scrollLeft;
                s.left = this.pos - this.sl - 1 + "px";
                s.height = "100%";
                s.width = this.getElement().offsetWidth - 4 + "px";
                s.top = "0px";
                this.grid.getElement().appendChild(bar);
                var es = DlDialog.activateEventStopper(true);
                DOM.addClass(es, "CURSOR-RESIZE-E");
                DlEvent.captureGlobals(this._resizeCaptures);
                this.origW = this.grid.getColWidth(this.col);
                this.origM = ev.pos.x;
                this.col._button.addClass("DlDataGridHeadLabel-resizing");
                EX();
        };

        function doResize(ev) {
                var
                        bar = DlResizeBar.getDragBar(),
                        left = this.pos + ev.pos.x - this.origM - 1,
                        diff = left - this.pos,
                        w = this.origW + diff;
                if (w < MIN_COL_WID) {
                        left += MIN_COL_WID - w;
                        w = MIN_COL_WID;
                }
                left -= this.sl;
                bar.style.left = left + "px";
                this.width = w;
                this.diff = diff;
                if (!is_ie) {
                        var el = this.col._button.getElement();
                        el.style.width = el.parentNode.style.width = el.parentNode.parentNode.style.width = w + "px";
                }
                EX();
        };

        function stopResize(ev) {
                this.dragging = false;
                this.grid.getElement().removeChild(DlResizeBar.getDragBar());
                var es = DlDialog.activateEventStopper(false);
                DOM.delClass(es, "CURSOR-RESIZE-E");
                DlEvent.releaseGlobals(this._resizeCaptures);
                if (this.width) {
                        this.grid.setColWidth(this.col, this.width);
                        this.grid._computeColPos();
                }
                this.col._button.delClass("DlDataGridHeadLabel-resizing");
                if (!is_ie) {
                        var el = this.col._button.getElement();
                        el.style.width = el.parentNode.style.width = el.parentNode.parentNode.style.width = "";
                }
                this.width = this.diff = this.found = this.col = null;
                this.parent.callHooks("onMouseMove", ev);
                EX();
        };

});

DEFINE_CLASS("DlGridCol", DlEventProxy, function(D, P) {

        D.DEFAULT_EVENTS = [ "onChange", "onVisibility" ];

        D.DEFAULT_ARGS = {
                _field_id    : [ "id"         , null ],
                _width       : [ "width"      , null ],
                _fill        : [ "fill"       , null ],
                _style       : [ "style"      , null ],
                _label       : [ "label"      , null ],
                _menuLabel   : [ "menuLabel"  , null ],
                _tooltip     : [ "tooltip"    , null ],
                _iconClass   : [ "iconClass"  , null ],
                _isSortable  : [ "sortable"   , true ],
                _isResizable : [ "resizable"  , true ],
                _cssRule     : [ "cssRule"    , null ],
                _isVisible   : [ "visible"    , true ],
                _format      : [ "format"     , null ]
        };

        var DEFAULT_STYLE = {};

        P.id = function() {
                return this._field_id;
        };

        P.getWidth = function() {
                return this._width;
        };

        P.getFill = function() {
                return this._fill;
        };

        P.getLabel = function() {
                return this._label;
        };

        P.getMenuLabel = function() {
                return this._menuLabel || this._label;
        };

        P.getTooltip = function() {
                return this._tooltip;
        };

        P.getIconClass = function() {
                return this._iconClass;
        };

        P.getStyle = function(key, def) {
                return (this._style || DEFAULT_STYLE)[key] || def;
        };

        P.isSortable = function() {
                return this._isSortable;
        };

        P.isResizable = function() {
                return this._isResizable;
        };

        P.isVisible = function() {
                return this._isVisible;
        };

        P.setVisible = function(v) {
                this._isVisible = v;
                this.applyHooks("onVisibility", [ v ]);
        };

        P.sort = function() {}; // override

        P.format = function(rec, set) {
                if (this._format)
                        return this._format(rec, set, this.id());
        };

});

DEFINE_CLASS("DlGridDragCol", DlDrag, function(D, P, DOM) {

        D.CONSTRUCT = function() {
                this.addEventListener("onStartDrag", function(w) {
                        this.grid_pos = w.parent.getPos();
                        w._onMouseLeave();
                });
        };

        // D.DEFAULT_ARGS = {};

        P.startOK = function(widget, ev) {
		return true;
	};

        P.dropOK = function(widget, ev, target, inside) {
                if (!inside && target instanceof DlDataGridHeadLabel && widget.parent === target.parent) {
                        this.target = target;
                        return this.canDrop = true;
                }
                return this.canDrop = false;
        };

        P.doDrop = function(widget, ev) {
                widget.parent.reorderColumn(widget.col, this.target.col, !this.dropBefore);
        };

        var DROP_INDICATOR;
        function getDropIndicator() {
                var d = DROP_INDICATOR;
                if (!d)
                        d = DROP_INDICATOR = DOM.createElement("div", { display: "none" }, { className: "DlDataGrid-drop-col" }, document.body);
                return d;
        };

	P.moving = function(widget, ev) {
		var target = this.target;
                var di = getDropIndicator();
                var s = di.style;
		if (this.canDrop && target) {
			var relPos = ev.computePos(target);
                        var te = target.getElement();
			var w = te.offsetWidth;
			var before = relPos.x <= w / 2;
                        var pos = target.col.index;
                        if (before)
                                pos--;
                        if (pos < 0) {
                                pos = 0;
                        } else {
                                pos = widget.parent._headCont._colPos[pos].pos - widget.parent.getBodyDiv().scrollLeft;
                        }
                        s.display = "block";
                        s.left = pos + this.grid_pos.x + "px";
                        s.top = relPos.elPos.y + "px";
			this.dropBefore = before;
		} else if (target) {
			this.dropBefore = null;
                        s.display = "none";
		}
	};

        P.reset = function() {
                if (DROP_INDICATOR)
                        DROP_INDICATOR.style.display = "none";
                D.BASE.reset.apply(this, arguments);
        };

});

DEFINE_CLASS("DlSelectionModel", DlEventProxy, function(D, P) {

        D.DEFAULT_EVENTS = [ "onChange", "onReset" ];

        D.CONSTRUCT = function() {
                if (!this.sel)
                        this.sel = {};
        };

        D.DEFAULT_ARGS = {
                multiple : [ "multiple", true ],
                sel      : [ "sel"     , null ]
        };

        P.reset = function(ids, noHooks) {
                var old = this.sel;
                this.sel = ids.toHash(true);
                if (!noHooks)
                        this.applyHooks("onReset", [ old, this.sel ]);
        };

        P.clear = function(noHooks) {
                this.reset([], noHooks);
        };

        P.get = function() {
                return this.sel;
        };

        P.getArray = function() {
                return Array.hashKeys(this.sel);
        };

        P.getFirst = function() {
                for (var i in this.sel)
                        return i;
        };

        P.isSelected = function(id) {
                return this.sel[id];
        };

        P.size = function() {
                var cnt = 0;
                for (var i in this.sel)
                        cnt++;
                return cnt;
        };

        P.filter = function(h) {
                var unsel = [];
                for (var i in this.sel)
                        if (!(i in h))
                                unsel.push(i);
                this.unselect(unsel);
        };

        P.select = function(id, noHooks) {
                var s = this.sel, ret = null, tmp;
                if (id instanceof Array) {
                        // go through onReset, should be faster
                        tmp = {};
                        id.foreach(function(id){
                                if (!s[id]) {
                                        s[id] = tmp[id] = true;
                                        ret = true;
                                }
                        }, this);
                        if (!noHooks && ret != null)
                                this.applyHooks("onReset", [ {}, tmp ]);
                } else {
                        if (!s[id]) {
                                s[id] = true;
                                if (!noHooks)
                                        this.applyHooks("onChange", [ id, true ]);
                                ret = true;
                        }
                }
                return ret;
        };

        P.unselect = function(id, noHooks) {
                var s = this.sel, ret = null, tmp;
                if (id instanceof Array) {
                        // go through onReset, should be faster
                        tmp = {};
                        id.foreach(function(id){
                                if (s[id]) {
                                        delete s[id];
                                        tmp[id] = true;
                                        ret = false;
                                }
                        }, this);
                        if (!noHooks && ret != null)
                                this.applyHooks("onReset", [ tmp, {} ]);
                } else {
                        if (s[id]) {
                                delete s[id];
                                if (!noHooks)
                                        this.applyHooks("onChange", [ id, false ]);
                                ret = false;
                        }
                }
                return ret;
        };

        P.toggle = function(id, noHooks) {
                return this.sel[id] ? this.unselect(id, noHooks) : this.select(id, noHooks);
        };

});

DEFINE_CLASS("DlDataGrid", DlContainer, function(D, P, DOM) {

        var AC = DOM.addClass,
            DC = DOM.delClass,
            CC = DOM.condClass;

        D.DEFAULT_EVENTS = [
                "onBodyDblClick",
                "onBodyScroll",
                "onRowClick",
                "onRowDblClick",
                "onResetIds"
        ];

        D.CONSTRUCT = function() {
                this.__scrollConts = 0;
        };

        var EX = DlException.stopEventBubbling;

        D.DEFAULT_ARGS = {
                _records        : [ "records"            , null ],
                _selection      : [ "selection"          , null ],
                _data           : [ "data"               , null ],
                _page           : [ "page"               , 0 ],
                _rpp            : [ "rpp"                , 60 ],
                _minReqRows     : [ "minReq"             , null ],
                _threshold      : [ "threshold"          , null ],
                _vScroll        : [ "virtualScrolling"   , true ],
                _cols           : [ "cols"               , null ],
                _headType       : [ "headType"           , DlDataGridHeadLabel ],
                _focusable      : [ "focusable"          , true ],
                _rtClickKeepSel : [ "rightClickKeepsSel" , false ],
                _noReselect     : [ "noReselect"         , false ],
                _rarify         : [ "rarifyScroll"       , null ]
        };

        var HTML = String.buffer(
                "<div class='DlDataGrid-Headers'>",
                "<table class='DlDataGrid-rowTable' cellspacing='0' cellpadding='0'>",
                "<tbody><tr></tr></tbody>",
                "</table></div>",
                "<div class='DlDataGrid-Body'>",
                "<div class='DlDataGrid-VSHeight'>",
                "<div class='DlDataGrid-VSHeight-before'></div>",
                "<div class='DlDataGrid-RowsCont'></div>",
                "</div>",
                "</div>"
        ).get();

        P.getHeaderDiv = function() {
                return this.getElement().firstChild;
        };

        P.getHeaderTable = function() {
                return this.getHeaderDiv().firstChild;
        };

        P.getHeaderRow = function() {
                return this.getHeaderDiv().firstChild.rows[0];
        };

        P.getBodyDiv = function() {
                return this.getElement().childNodes[1];
        };

        P._getVSHeightDiv = function() {
                return this.getBodyDiv().firstChild;
        };

        P._getVSScrollDiv = function() {
                return this._getVSHeightDiv().firstChild;
        };

        P.getRowsContainer = function() {
                return this._getVSHeightDiv().childNodes[1];
        };

        P.resetIDS = function(ids) {
                var h = {}, sel = this._selection;
                ids.foreach(function(id, i){
                        h[id] = i;
                });
                this._records = { array: ids, id_to_pos: h };
                sel.filter(h);
                if (sel.getArray().length == 0)
                        sel._last = null;
                this.callHooks("onResetIds");
        };

        P._fetch_data = function(ids, dir, callback) {
                var min = this._minReqRows, n = ids.length, d = this._data;
                if (min == null || min <= n) {
                        d.getRecords(ids, callback, this);
                } else {
                        var more = ids.slice(0); // copy
                        var a = this._records.array, i;
                        var threshold = this._threshold || Math.ceil(this._rpp / 2);
                        if (dir <= 0) {
                                var start = this._records.id_to_pos[ids[0]], k = threshold;
                                while (k-- > 0)
                                        if (!d.hasRecord(a[--start]))
                                                break;
                                if (k > 0) {
                                        for (i = start; i >= 0 && more.length < min; i--) {
                                                var id = a[i];
                                                if (!d.hasRecord(id))
                                                        more.push(id);
                                        }
                                }
                        }
                        if (dir >= 0) {
                                var start = this._records.id_to_pos[ids.peek()], k = threshold;
                                while (k-- > 0)
                                        if (!d.hasRecord(a[++start]))
                                                break;
                                if (k > 0) {
                                        for (i = start; i < a.length && more.length < min; i++) {
                                                var id = a[i];
                                                if (!d.hasRecord(id))
                                                        more.push(id);
                                        }
                                }
                        }
                        // console.log("Requesting: %d records, need %d", more.length, min);
                        d.getRecords(more, function(records) {
                                callback.call(this, records.slice(0, n));
                        }, this);
                }
        };

        P._display_ids = function(ids, vscroll) {
                this._info_display = {
                        length          : ids.length,
                        first_row_index : this._records.id_to_pos[ids[0]],
                        last_row_index  : this._records.id_to_pos[ids.peek()]
                };
                this._fetch_data(ids, 0, function(records) {
                        var buf = String.buffer();
                        records.foreach(this._fetchRowHTML.$(this, buf));
                        this.getRowsContainer().innerHTML = buf.get();
                        if (vscroll != null)
                                this._setVScroll(vscroll);
                        this._resetVSHeight();
                        if (records.length > 1)
                                this.scrollToRecord(records[1].id());
                        else
                                this._setVScroll(this.getBodyDiv().scrollTop = 0);
                        this.getBoundRecords();
                });
        };

        P.displayPage = function(page) {
                if (page == null)
                        page = 0;
                this._page = page;
                var ids = this._records.array;
                if (this._rpp) {
                        var start = page * this._rpp;
                        ids = ids.slice(start, start + this._rpp);
                }
                this._display_ids(ids);
        };

        P._resetVSHeight = function() {
                if (this._vScroll && this._info_display) {
                        var h = Math.floor(this.getRowsContainer().offsetHeight *
                                           this.getNRecords() /
                                           this._info_display.length);
                        this._getVSHeightDiv().style.height = isNaN(h) ? "" : h + "px";
                }
        };

        // SOMETHING STINKS HERE!
        P._setVScroll = function(pos) {
                var v1 = this._getVSScrollDiv();
                if (pos) {
                        v1.style.height = pos + "px";
                        v1.style.display = "block";
                } else {
                        v1.style.display = "none";
                }
        };

        P.initWidths = function() {
                var maxes = {};
                this._cols.foreach(function(col){
                        maxes[col.id()] = this.getColWidth(col);
                }, this);
                var body = this.getRowsContainer();
                // iterate rows
                for (var i = body.firstChild; i; i = i.nextSibling) {
                        var cells = i.firstChild.rows[0].cells;
                        for (var j = cells.length; --j >= 0;) {
                                var td = cells[j];
                                var colid = td.getAttribute("colid");
                                maxes[colid] = Math.max(maxes[colid] || 0, td.offsetWidth);
                        }
                }
                this._cols.foreach(function(col){
                        this.setColWidth(col, maxes[col.id()]);
                }, this);
        };

        P.resetColumns = function(cols) {
                var header_row = this.getHeaderRow();
                var header_cells = header_row.cells;
                var new_headers = [];
                this._cols = cols.map(function(el, i){
                        var col = this._colsById[el.id];
                        new_headers.push(col._cell);
                        col.index = i;
                        col._width = el.width;
                        col._isVisible = el.visible;
                        return col;
                }, this);
                var df = document.createDocumentFragment();
                new_headers.foreach(function(el){
                        df.appendChild(el);
                });
                header_row.appendChild(df);
                this.refreshDisplay();
                this._cols.foreach(function(col){
                        this.setColVisible(col, col.isVisible());
                        this.setColWidth(col, col.getWidth());
                }, this);
        };

        P.reorderColumn = function(src, dest, after) {

                // remember what we're doing
                var si = src.index, di = dest.index;

                if (after)
                        di++;

                // 1. update the _cols array
                var a = this._cols;
                a.splice(si, 1);
                a.splice(si < di ? di - 1 : di, 0, src);

                // 2. recompute indexes
                for (var i = 0; i < a.length; ++i)
                        a[i].index = i;

                // 3. update the display
                for (var i = this.getRowsContainer().firstChild; i; i = i.nextSibling) {
                        var cells = i.firstChild.rows[0].cells;
                        var src = cells[si], dest = cells[di];
                        src.parentNode.insertBefore(src, dest || null);
                }

                var cells = this.getHeaderRow().cells;
                var src = cells[si], dest = cells[di];
                src.parentNode.insertBefore(src, dest || null);

                this._computeColPos();

        };

        P.getNRecords = function() {
                return this._records ? this._records.array.length : 0;
        };

        P.getNPages = function() {
                if (!this._rpp)
                        return 1;
                return Math.ceil(this.getNRecords() / this._rpp);
        };

        P.rec_isSelected = function(rec) {
                return this._selection.isSelected(rec.id());
        };

        P._computeColPos = function() {
                var pos = -1;
                this._headCont._colPos = this._cols.map(function(col){
                        pos += this.getColWidth(col);
                        return { pos: pos, col: col };
                }, this);
        };

        P._createElement = function() {
                D.BASE._createElement.call(this);
                this.getElement().id = this.id; // assign ID for unique CSS rules
                this._ss = new DlStyleSheet();
                this._cssPrefix = "#" + this.id;
                this.setContent(HTML);
                this._initHeaders();
                // this.getBodyDiv().onscroll = onBodyScroll.clearingTimeout(300, this); // @leak?
                // this.getBodyDiv().onscroll = onBodyScroll.rarify(10, 200, this);
                // this.getBodyDiv().onscroll = onBodyScroll.$(this);

                this.getBodyDiv().onscroll = this._rarify
                ? onBodyScroll.rarify(this._rarify.calls, this._rarify.timeout, this)
                : onBodyScroll.$(this);

                var h = this._headCont = new DlContainer({ parent: this, element: this.getHeaderDiv() });
                h.addEventListener({ onMouseMove  : DlDataGridHeadLabel._on_headMouseMove,
                                     onMouseLeave : DlDataGridHeadLabel._on_headMouseLeave,
                                     onMouseEnter : this._computeColPos.$(this) });

                this._bodyCont = new DlContainer({ parent: this, element: this.getBodyDiv(), drag: this._dragArgs });
                this._dragArgs = null;
                "onMouseOver onMouseOut onMouseDown onMouseUp onMouseLeave onDblClick".qw().foreach(function(ev){
                        this.addEventListener(ev, this["_body_" + ev]);
                }, this);

                this._cacheEvents = {
                        onChange  : this._data_onChange.$(this),
                        onInsert  : this._data_onInsert.$(this),
                        onDelete  : this._data_onDelete.$(this),
                        onRefresh : this._data_onRefresh.$(this)
                };

                this.setCache(this._data);
                this.addEventListener("onDestroy", this._onDestroy);

                if (this._records)
                        this.resetIDS(this._records);

                this._sel_events = { onChange : this._sel_onChange.$(this),
                                     onReset  : this._sel_onReset.$(this) };
                if (!this._selection)
                        this._selection = new DlSelectionModel({});
                this.setSelectionModel(this._selection);
        };

        P._onDestroy = function() {
                this._ss.destroy();
                this.setCache(null);
        };

        P.setCache = function(cache) {
                if (this._data)
                        this._data.removeEventListener(this._cacheEvents);
                this._data = cache;
                if (cache)
                        cache.addEventListener(this._cacheEvents);
        };

        P._data_onChange = function(rec /*, key, val, old */) {
                var el = this.getRowElement(rec.id());
                if (el) {
                        var buf = String.buffer();
                        this._fetchRowHTML(buf, rec);
                        buf = buf.get();
                        if (is_ie)
                                el.outerHTML = buf;
                        else {
                                var div = DOM.createFromHtml(buf);
                                DOM.trash(el.parentNode.replaceChild(div, el));
                        }
                }
        };

        // P._data_onChange = function(rec /*, key, val, old */) {
        //         this._fetch_data([ rec.id() ], 0, function(rec){
        //                 rec = rec[0];
        //                 var el = this.getRowElement(rec.id());
        //                 if (el) {
        //                         var buf = String.buffer();
        //                         this._fetchRowHTML(buf, rec);
        //                         buf = buf.get();
        //                         if (is_ie)
        //                                 el.outerHTML = buf;
        //                         else {
        //                                 var div = DOM.createFromHtml(buf);
        //                                 DOM.trash(el.parentNode.replaceChild(div, el));
        //                         }
        //                 }
        //         }.$(this));
        // };

        P._data_onInsert = function(rec, where) {
                var a = this._records.array;
                if (where == null)
                        where = a.length;
                a.splice(where, 0, rec.id());
                this.resetIDS(a);
                this.refreshDisplay();
        };

        P._data_onDelete = function(id) {
                var a = this._records.array;
                if (id instanceof Array) {
                        id.foreach(function(id){
                                this.remove(id);
                        }, a);
                } else
                        a.remove(id);
                this.resetIDS(a);
                this.refreshDisplay();
        };

        P._data_onRefresh = function() {};

        P._recompDynamicWidths = function() {
                var width = this.getBodyDiv().clientWidth;
                var pc = [];
                this._cols.foreach(function(col){
                        if (col.getFill() == null)
                                width -= this.getColWidth(col);
                        else
                                pc.push(col);
                }, this);
                width -= 1;
                pc.foreach(function(col){
                        this.setColWidth(col, width * col.getFill());
                }, this);
        };

        P._initHeaders = function() {
                this._colsById = {};
                this._cols.foreach(function(col, i) {
                        if (!(col instanceof DlGridCol))
                                col = this._cols[i] = new DlGridCol(col);

                        col.addEventListener("onVisibility", this.setColVisible.$(this, col));

                        col.index = i;
                        this._colsById[col.id()] = col;

                        // create CSS rule for this column
                        var cls = "DlDataGrid-col-" + col.id();
                        var sel = this._cssPrefix + " ." + cls;
                        sel = sel + "," + sel + " .DlDataGrid-cellData";
                        // var css = [ "text-align:" + col.getStyle("textAlign", "left") ];
                        var css = [];
                        var width = col.getWidth();
                        if (typeof width == "number") {
                                css.push("width:" + width + "px");
                        }
                        css = css.join(";");
                        col._cssRule = this._ss.insertRule(sel, css);

                        if (!col.isVisible())
                                this._ss.modifyRule(col._cssRule, { display: "none" });

                        // create the header button
                        var td = col._cell = document.createElement("td");
                        td.innerHTML = "<div class='DlDataGrid-cellData'></div>";
                        td.className = cls;
                        this.getHeaderRow().appendChild(td);
                        var btn = this._makeHeadLabel(
                                { parent     : this,
                                  appendArgs : td.firstChild,
                                  iconClass  : col.getIconClass(),
                                  label      : col.getLabel(),
                                  col        : col,
                                  className  : "DlGrid-align-" + col.getStyle("textAlign", "left"),
                                  tooltip    : col.getTooltip.$(col),
                                  drag       : this._getDragObject()
                                }
                        );
                        // btn.setWidth(col.getWidth());
                        col._button = btn;
                }, this);
        };

        P.findRowFromEvent = function(ev) {
                return ev_find_row(ev);
        };

        function ev_find_row(ev) {
                var p = ev.target, row, col, row_id, col_id, tn;
                try {
                        while (p && p.tagName) {
                                tn = p.tagName.toLowerCase();
                                if (tn == "div" && (row_id = p.getAttribute("recid")) != null) {
                                        row = p;
                                        break;
                                }
                                if (!col_id && tn == "td") {
                                        col = p;
                                        col_id = p.getAttribute("colid");
                                }
                                p = p.parentNode;
                        }
                } catch(ex) {}
                return row ? { row: row, col: col, id: row_id, col_id: col_id } : null;
        };

        P._sel_onChange = function(id, selected) {
                var div = this.getRowElement(id);
                if (div)
                        CC(div, selected, "DlDataGridRow-selected");
        };

        P._sel_onReset = function(oldSel, newSel) {
                var i, div;
                for (i in oldSel) {
                        if (!newSel[i]) {
                                div = this.getRowElement(i);
                                if (div)
                                        DC(div, "DlDataGridRow-selected");
                        }
                }
                for (i in newSel) {
                        if (!oldSel[i]) {
                                div = this.getRowElement(i);
                                if (div)
                                        AC(div, "DlDataGridRow-selected");
                        }
                }
        };

        P.setSelectionModel = function(sel) {
                if (this._selection)
                        this._selection.removeEventListener(this._sel_events);
                this._selection = sel;
                sel.addEventListener(this._sel_events);
        };

        P._body_onDblClick = function(ev) {
                this.callHooks("onBodyDblClick");
                var r = ev_find_row(ev);
                if (r)
                        this.callHooks("onRowDblClick", r);
        };

        P._body_onMouseOver = function(ev) {
                var r = ev_find_row(ev);
                if (r && (this.__tooltip instanceof Function)) {
                        this._tooltipRow = r;
                        DlWidget.getTooltip().popup({ timeout : this.__tooltipTimeout,
                                                      content : this.__tooltip.$(this, r),
                                                      anchor  : this.getElement(),
                                                      align   : "mouse",
                                                      onPopup : this.__onTooltipShow,
                                                      onHide  : this.__onTooltipHide,
                                                      widget  : this
                                                    });
                };
        };

        P._body_onMouseOut = function(ev) {
                var r = ev_find_row(ev);
                if (r) {
                        DlWidget.getTooltip().hide();
                        this._tooltipRow = null;
                }
        };

        P._body_onMouseLeave = function(ev) {};

        P.__handleSelectClick = function(r, ev) {
                var sel = this._selection, rs = this._records;
                if (sel.multiple) {
                        if (ev.button == 2) { // right click
                                if (!this._rtClickKeepSel) {
                                        if (ev.ctrlKey) {
                                                this.callHooks("onRowClick", r, ev, {
                                                        rtc: true,
                                                        ctrl: true,
                                                        type: "select",
                                                        ids: [ r.id ]
                                                });
                                                sel.select([ r.id ]);
                                        } else if (!sel.isSelected(r.id)) {
                                                this.callHooks("onRowClick", r, ev, {
                                                        rtc: true,
                                                        type: "reset",
                                                        ids: [ r.id ]
                                                });
                                                sel.reset([ r.id ]);
                                        }
                                }
                        } else {
                                if (ev.ctrlKey) {
                                        this.callHooks("onRowClick", r, ev, {
                                                ctrl: true,
                                                type: "toggle",
                                                ids: [ r.id ]
                                        });
                                        sel.toggle(r.id);
                                        sel._last = r.id;
                                } else if (ev.shiftKey) {
                                        if (sel._last != null) {
                                                var from = rs.id_to_pos[sel._last];
                                                var to = rs.id_to_pos[r.id];
                                                var ids = rs.array.slice(Math.min(from, to), Math.max(from, to) + 1);
                                                this.callHooks("onRowClick", r, ev, {
                                                        shift: true,
                                                        type: "reset",
                                                        ids: ids
                                                });
                                                sel.reset(ids);
                                        } else {
                                                this.callHooks("onRowClick", r, ev, {
                                                        shift: true,
                                                        type: "toggle",
                                                        ids: [ r.id ]
                                                });
                                                sel.toggle(r.id);
                                                sel._last = r.id;
                                        }
                                } else {
                                        this.callHooks("onRowClick", r, ev, {
                                                type: "reset",
                                                ids: [ r.id ]
                                        });
                                        sel.reset([ r.id ]);
                                        sel._last = r.id;
                                }
                        }
                }
                else if (!this._noReselect || !sel.isSelected(r.id)) {
                        this.callHooks("onRowClick", r, ev, {
                                type: "reset",
                                ids: [ r.id ]
                        });
                        sel.reset([ r.id ]);
                        sel._last = r.id;
                }
        };

        P._body_onMouseUp = function(ev) {
                var r1 = ev_find_row(ev), r2 = this.__handleOnMouseUp;
                if (r1 && r2 && r1.id == r2.id)
                        this.__handleSelectClick(r1, ev);
        };

        P._body_onMouseDown = function(ev) {
                var r = ev_find_row(ev), sel = this._selection;
                if (r) {
                        this.__handleOnMouseUp = !sel.isSelected(r.id) || !this._bodyCont._dragArgs || ev.ctrlKey || ev.shiftKey
                                ? null : r;
                        if (!this.__handleOnMouseUp) {
                                this.__handleSelectClick(r, ev);
                        }
                        if (ev.button != 2) {
                                // seems that stopping the event
                                // prevents the context menu from
                                // showing up on FF/Mac.
                                EX();
                        }
                }
        };

        P.scrollToRecord = function(rec_id, where) {
                var rc = this.getRowsContainer();
                var h = Math.floor(rc.offsetHeight / rc.childNodes.length);
                var pos = h * this._records.id_to_pos[rec_id || this._selection._last];
                var body = this.getBodyDiv(), st = body.scrollTop, bh = body.clientHeight;
                if (where == null) {
                        if (pos < st) {
                                body.scrollTop = pos;
                                this._setVScroll(h * this._info_display.first_row_index);
                        } else if (pos + h > st + bh) {
                                body.scrollTop = pos + h - bh;
                                this._setVScroll(h * this._info_display.first_row_index);
                        }
                } else {
                        switch (where) {
                            case "top"    : body.scrollTop = pos                    ; break;
                            case "bottom" : body.scrollTop = pos + h - bh           ; break;
                            case "center" : body.scrollTop = (2 * pos + h - bh) / 2 ; break;
                        }
                }
        };

        P.scrollHome = function() {
                this.getBodyDiv().scrollTop = 0;
        };

        P.scrollEnd = function() {
                this.getBodyDiv().scrollTop = this._getVSHeightDiv().offsetHeight;
        };

        P.scrollPage = function(page) {
                var b = this.getBodyDiv();
                b.scrollTop += page * b.clientHeight - 20;
        };

        P._handle_focusKeys = function(ev) {
                var sel = this._selection, k = ev.keyCode, c = ev.charCode, rs = this._records, index;
                switch (k) {

                    case DlKeyboard.ARROW_DOWN:
                        index = -1;
                        if (sel._last != null)
                                index = rs.id_to_pos[sel._last];
                        if (ev.shiftKey && sel.multiple) {
                                var ids = rs.array.slice(index, index + 2);
                                sel.select(ids);
                                sel._last = ids.peek();
                        } else {
                                index = rs.array.limitIndex(index + 1);
                                var id = rs.array[index];
                                sel.reset([ id ]);
                                sel._last = id;
                        }
                        this.scrollToRecord();
                        EX();
                        break;

                    case DlKeyboard.ARROW_UP:
                        index = rs.array.length;
                        if (sel._last != null)
                                index = rs.id_to_pos[sel._last];
                        if (ev.shiftKey && sel.multiple) {
                                var ids = rs.array.slice(index - 1, index);
                                sel.select(ids);
                                sel._last = ids.peek();
                        } else {
                                index = rs.array.limitIndex(index - 1);
                                var id = rs.array[index];
                                sel.reset([ id ]);
                                sel._last = id;
                        }
                        this.scrollToRecord();
                        EX();
                        break;

                    case DlKeyboard.HOME:
                        this.scrollHome();
                        EX();
                        break;

                    case DlKeyboard.END:
                        this.scrollEnd();
                        EX();
                        break;

                    case DlKeyboard.PAGE_UP:
                        this.scrollPage(-1);
                        EX();
                        break;

                    case DlKeyboard.PAGE_DOWN:
                        this.scrollPage(1);
                        EX();
                        break;
                }

                D.BASE._handle_focusKeys.call(this, ev);
        };

        P._makeHeadLabel = function(args) {
                return new this._headType(args);
        };

        P._onHeadClick = function(col, btn) {
                if (col.isSortable()){
                        col = col.id();
                        var prev = this.__sortCol || null;
                        var rev = null;
                        if (col == prev) {
                                rev = true;
                                if (this.__sortRev)
                                        rev = !rev;
                        }
                        this.__sortRev = rev;
                        this.sort(this._records.array, col, prev, rev, this._handleSort.$(this, col, rev));
                }
        };

        P.sort = function() {
                this._data.sort.apply(this._data, arguments);
        };

        P._handleSort = function(col, rev, ids) {
                this.resetIDS(ids);
                this.refreshDisplay();
                this.setSortColumn(col, rev);
        };

        P.setSortColumn = function(col, rev) {
                var prev = this.__sortCol;
                if (prev) {
                        prev = this._colsById[prev];
                        prev._button.delClass(/DlDataGridHeadLabel-sort-[^\s]+/g);
                }
                this.__sortCol = col;
                if (col) this._colsById[col]._button.condClass(
                        rev, "DlDataGridHeadLabel-sort-down", "DlDataGridHeadLabel-sort-up"
                );
        };

        P.getSortColumn = function() {
                return this.__sortCol;
        };

        P.getSortReverse = function() {
                return this.__sortRev;
        };

        P.getCol = function(col) {
                if (!(col instanceof DlGridCol))
                        col = this._colsById[col];
                return col;
        };

        P.getRec = function(rec) {
                if (!(rec instanceof DlRecord))
                        rec = this._data.get(rec);
                return rec;
        };

        P.setColWidth = function(col, w) {
                col = this.getCol(col);
                col._width = w;
                this._ss.modifyRule(col._cssRule, { width: w + "px" });
        };

        P.setColVisible = function(col, v) {
                col = this.getCol(col);
                this._ss.modifyRule(col._cssRule, { display: v ? "" : "none" });
                col._isVisible = !!v;
        };

        P.getColWidth = function(col) {
                col = this.getCol(col);
                return this.getHeaderRow().cells[col.index].offsetWidth;
        };

        P._getDragObject = function() {
                if (!this.__drag) {
                        this.__drag = new DlGridDragCol({});
                }
                return this.__drag;
        };

        P._fetchRowContentHTML = function(buf, rec) {
                buf("<table class='DlDataGrid-rowTable' cellspacing='0' cellpadding='0'><tr>");
                var cols = this._cols, n = cols.length, d = this._data, col, id, cn, i;
                for (i = 0; i < n; ++i) {
                        col = cols[i];
                        id = col.id();
                        buf("<td colid='", id, "' class='DlDataGrid-col-", id);
                        cn = d.getCellClass(rec, col.id());
                        if (cn)
                                buf(" ", cn);
                        buf("'>");
                        if (is_ie)
                                buf("<div class='DlDataGrid-cellData'>");
                        d.formatHTML(rec, col.id(), buf, col);
                        if (is_ie)
                                buf("</div>");
                        buf("</td>");
                }
                buf("</tr></table>");
        };

        P._fetchRowHTML = function(buf, rec) {
                var cls = 'DlDataGrid-row', tmp = this._data.getRecClass(rec);
                if (tmp)
                        cls += ' ' + tmp;
                if (this.rec_isSelected(rec))
                        cls += ' DlDataGridRow-selected';
                buf("<div id='", this.id, ':', rec.id(), "' class='", cls, "' recid='", rec.id(), "'>");
                this._fetchRowContentHTML(buf, rec);
                buf("</div>");
        };

        P.getRowElement = function(rec_id) {
                return document.getElementById(this.id + ":" + rec_id);
        };

        P.refreshDisplay = function() {
                this._oldScroll = null;
                var body = this.getBodyDiv(), st = body.scrollTop;
                var rc = this.getRowsContainer();
                var a = this._records.array;
                var info = this._info_display;

                if (this._rpp && a.length < this._rpp)
                        this.displayPage(0);

                if (this._rpp) {
                        // how much for one row?
                        var h = Math.floor(rc.offsetHeight / rc.childNodes.length);

                        // compute first and last rows actually visible on-screen
                        var frv = Math.ceil(st / h) - 1;
                        if (frv < 0)
                                frv = 0;
                        var lrv = Math.floor((st + body.clientHeight) / h);
                        if (lrv >= a.length)
                                lrv = a.length - 1;
                        var ids = a.slice(frv, frv + this._rpp);
                        this._display_ids(ids, h * frv);
                }
        };

        P.__doLayout = function() {
                var size = this.getInnerSize();
                var body = this.getBodyDiv();
                var header = this.getHeaderDiv();
                DOM.setOuterSize(body, size.x, size.y - header.offsetHeight);
                DOM.setOuterSize(header, size.x, null);
                //header.style.marginRight = -DOM.getScrollbarSize(body).x + "px";
                this._resetVSHeight();

                if (this._records && this._records.array.length > 0) {
                        this._oldScroll = null;
                        onBodyScroll.call(this);
                        // OR: (slower)
                        // this.refreshDisplay();
                }

                this._recompDynamicWidths();
        };

        P.getBoundRecords = function() {
                var body = this.getBodyDiv(), st = body.scrollTop;
                var rc = this.getRowsContainer();
                var a = this._records.array;
                var rh = rc.offsetHeight;

                if (rh == 0)
                        return this.__boundRecords;

                // how much for one row?
                var h = Math.floor(rh / rc.childNodes.length);

                // compute first and last rows actually visible on-screen
                var frv = Math.ceil(st / h) - 1;
                if (frv < 0)
                        frv = 0;
                var lrv = Math.floor((st + body.clientHeight) / h);
                if (lrv >= a.length)
                        lrv = a.length - 1;

                return this.__boundRecords = { first: frv, last: lrv, count: lrv - frv + 1, h: h };
        };

        function onBodyScroll() {
                if (this._processing_scroll)
                        return;
                this._processing_scroll = true;

                // 1. keep header in sync:
                var body = this.getBodyDiv(), st = body.scrollTop;
                this.getHeaderTable().style.marginLeft = -body.scrollLeft + "px";

                // virtual scrolling
                if (this._vScroll && this._records && st != this._oldScroll) {
                        var rc = this.getRowsContainer();
                        var a = this._records.array;
                        var info = this._info_display;

                        // how much for one row?
                        var h = this.getBoundRecords();

                        var frv = h.first;
                        var lrv = h.last;
                        h = h.h;

                        // console.log("frv: %d, lrv: %d", frv, lrv);

                        // how do they relate to the currently rendered data?

                        // 1. are we in the rendered frame?
                        if (frv >= info.first_row_index && lrv <= info.last_row_index) {

                                // do nothing
                                // console.log("in view");

                        } else if (lrv < info.first_row_index || frv > info.last_row_index) {

                                // completely out of view
                                var ids = a.slice(frv, frv + this._rpp);
                                this._display_ids(ids, h * frv);

                        } else if (frv < info.first_row_index) {

                                // console.log("before view by %d", info.first_row_index - frv);
                                var ids = a.slice(frv, info.first_row_index);
                                // console.log(ids);

                                this.__scrollConts++;
                                this.__cont = function(records) {
                                        var buf = String.buffer("<div>"), n = records.length;
                                        records.foreach(this._fetchRowHTML.$(this, buf));
                                        buf("</div>");
                                        var html = buf.get();
                                        var div = DOM.createFromHtml(html), df;
                                        try {
                                                var r = document.createRange(), c = rc.childNodes;
                                                r.selectNodeContents(div);
                                                df = r.extractContents();
                                                r.detach();
                                                r = document.createRange();
                                                r.setStartBefore(c[c.length - n]);
                                                r.setEndAfter(c[c.length - 1]);
                                                r.deleteContents();
                                        } catch(ex) {
                                                // console.log(ex);
                                                if (!df)
                                                        df = document.createDocumentFragment();
                                                while (div.firstChild) {
                                                        rc.removeChild(rc.lastChild);
                                                        df.appendChild(div.firstChild);
                                                }
                                        }
                                        rc.insertBefore(df, rc.firstChild);

                                        this._setVScroll(h * frv);
                                        info.first_row_index = frv;
                                        info.last_row_index -= n;
                                };
                                this._fetch_data(ids, -1, function(records) {
                                        this.__scrollConts--;
                                        if (this.__scrollConts == 0)
                                                this.__cont(records);
                                });

                        } else if (lrv > info.last_row_index) {

                                // console.log("after view by %d", lrv - info.last_row_index);
                                var ids = a.slice(info.last_row_index + 1, lrv + 1);
                                // console.log(ids);

                                this.__scrollConts++;
                                this.__cont = function(records) {
                                        var buf = String.buffer("<div>"), n = records.length;
                                        records.foreach(this._fetchRowHTML.$(this, buf));
                                        buf("</div>");
                                        var html = buf.get();
                                        var div = DOM.createFromHtml(html), df;
                                        try {
                                                var r = document.createRange();
                                                r.selectNodeContents(div);
                                                df = r.extractContents();
                                                r.detach();
                                                r = document.createRange();
                                                r.setStartBefore(rc.firstChild);
                                                r.setEndBefore(rc.childNodes[n]);
                                                r.deleteContents();
                                        } catch(ex) {
                                                // console.log(ex);
                                                if (!df)
                                                        df = document.createDocumentFragment();
                                                while (div.firstChild) {
                                                        rc.removeChild(rc.firstChild);
                                                        df.appendChild(div.firstChild);
                                                }
                                        }
                                        rc.appendChild(df);

                                        this._setVScroll(this._getVSScrollDiv().offsetHeight + (h * n));
                                        info.first_row_index += n;
                                        info.last_row_index = lrv;
                                };
                                this._fetch_data(ids, 1, function(records) {
                                        this.__scrollConts--;
                                        if (this.__scrollConts == 0)
                                                this.__cont(records);
                                });

                        }

                        this._oldScroll = st;
                }

                this.callHooks("onBodyScroll");

                this._processing_scroll = false;
        };

});

DEFINE_CLASS("DlDragDataGrid", DlDrag, function(D, P) {

        P.startOK = function(body, ev) {
                var grid = body.parent, found = false, el = ev.target;
                while (el && el != body.getElement()) {
                        if (el == grid._getVSHeightDiv()) {
                                found = true;
                                break;
                        }
                        el = el.parentNode;
                }
                if (found && grid._selection.getArray().length > 0)
                        this.grid = grid;
                else
                        found = false;
                return found;
        };

        P.reset = function() {
                this.grid = null;
                D.BASE.reset.apply(this, arguments);
        };

});
