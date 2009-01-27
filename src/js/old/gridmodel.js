// @require eventproxy.js
// @require cellmodel.js

DlGridModel.inherits(DlEventProxy);
function DlGridModel(args) {
	if (arguments.length > 0) {
		DlEventProxy.call(this);
		this.registerEvents(DlGridModel.DEFAULT_EVENTS);
		Dynarch.setDefaults.call(this, DlGridModel.DEFAULT_ARGS, args);
		this.data = new Array(args.rows);
		this.data.r_assign_each(this.createRow, this);
	}
};

DlGridModel.DEFAULT_ARGS = {
	rows      : [ "rows"       , 0 ],
	cols      : [ "cols"       , 0 ],
	_cellType : [ "cellType"   , DlCellModel ]
};

DlGridModel.DEFAULT_EVENTS = [ "onInsertRow", "onRemoveRow",
			       "onInsertCol", "onRemoveCol",
			       "onChange", "onSort", "onReset" ];

DlGridModel.OBJECT_EXTENSIONS = {
	createCell : function(row, col) {
		var cell = new this._cellType({ model: this, row: row, col: col });
		cell.connectEvents("onChange", this);
		return cell;
	},
	createRow : function(row) {
		return new Array(this.cols).r_assign_each(this.createCell.$(this, row));
	},

	compare : function(col, r1, r2) {
		return r1[col].compare(r2[col]);
	},
	qsort : function(col, reverse) {
		this.data.qsort(this.compare.$(this, col), reverse);
		this._resetIndexes(0, 0);
	},
	sort : function(col) {
		this.data.sort(this.compare.$(this, col));
		this._resetIndexes(0, 0);
	},

	insertRow : function(row) {
		if (row == null)
			row = this.data.length;
		var new_row = this.createRow(row);
		this.data.splice(row, 0, new_row);
		++this.rows;
		this._resetIndexes(row + 1, 0);
		this.callHooks("onInsertRow", row, new_row);
		return new_row;
	},

	insertCol : function(col) {
		if (col == null)
			col = this.data.length;
		var new_col = new Array(this.rows);
		new_col.r_assign_each(function(row){
			var cell = this.createCell(row, col);
			this.data[row].splice(col, 0, cell);
			return cell;
		}, this);
		++this.cols;
		this._resetIndexes(0, col + 1);
		this.callHooks("onInsertCol", col, new_col);
		return new_col;
	},

	deleteRow : function(row) {
		var row_data = this.data[row];
		this.data.splice(row, 1);
		--this.rows;
		this._resetIndexes(row, 0);
		this.callHooks("onRemoveRow", row, row_data);
		return row_data;
	},

	deleteCol : function(col) {
		var col_data = new Array(this.rows);
		col_data.r_assign_each(function(row){
			var r = this.data[row];
			var cell = r[col];
			r.splice(col, 1);
			return cell;
		}, this);
		--this.cols;
		this._resetIndexes(0, col);
		this.callHooks("onRemoveCol", col, col_data);
		return col_data;
	},

	_resetIndexes : function(i, start_col) {
		var d = this.data, cell;
		while (i < this.rows) {
			for (var j = start_col; j < this.cols; ++j) {
				cell = d[i][j];
				cell._row = i;
				cell._col = j;
			}
			++i;
		}
	},

	dumpHTML : function() {
		var html = [ "<table style='border-collapse: collapse'>" ];
		for (var i = 0; i < this.rows; ++i) {
			html.push("<tr>");
			for (var j = 0; j < this.cols; ++j) {
				var cell = this.data[i][j];
				html.push(cell.dumpHTML());
			}
			html.push("</tr>");
		}
		html.push("</table>");
		return html.join("");
	}
};
DlGridModel.inject();
