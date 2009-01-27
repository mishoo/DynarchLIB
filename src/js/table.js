// @require container.js

// @deprecate?

(function(){

	var BASE = DlTable.inherits(DlContainer);
	function DlTable(args) {
		if (args) {
			D.setDefaults(this, args);
			args.tagName = "table";
			this._colSpan = 0;
			DlContainer.call(this, args);
		}
	};

	eval(Dynarch.EXPORT("DlTable", true));

	D.DEFAULT_ARGS = {
		__cellSpacing : [ "cellSpacing", null ],
		__cellPadding : [ "cellPadding", null ],
		__align       : [ "align"      , null ]
	};

	P._createElement = function() {
		BASE._createElement.call(this);
		var el = this.getElement();
		if (this.__cellPadding != null)
			el.cellPadding = this.__cellPadding;
		if (this.__cellSpacing != null)
			el.cellSpacing = this.__cellSpacing;
		if (this.__align != null)
			el.align = this.__align;
		CE("tbody", null, null, el);
	};

	P.getContentElement = function() {
		return this.getElement().firstChild;
	};

	P.addRow = function() {
		return new DlTableRow({ parent: this });
	};

	P.getRow = function(index) {
		return this.children(index);
	};

	P.addCell = function(row, align, valign) {
		var cell = new DlTableCell({ parent: row });
		if (align != null)
			cell.addClass("DlAlign-" + align);
		if (valign != null) {
			var s = cell.getElement().style;
			s.verticalAlign = valign;
		}
		var index = cell.getElement().cellIndex + 1;
		if (index > this._colSpan)
			this._colSpan = index;
		return cell;
	};

	P.getColSpan = function() {
		return this._colSpan;
	};

	P.setColSpan = function(colSpan) {
		this._colSpan = colSpan;
	};

	P.addSeparator = function(span) {
		if (span == null)
			span = this.getColSpan();
		CE("div", null, { innerHTML: "&nbsp;" },
		   CE("td", null, { colSpan: span },
		      CE("tr", null, { className: "DlTable-RowSeparator" },
			 this.getContentElement())));
	};

})();

DlTableRow.inherits(DlContainer);
function DlTableRow(args) {
	if (args) {
		args.tagName = "tr";
		DlContainer.call(this, args);
	}
};
DlTableCell.inherits(DlContainer);
function DlTableCell(args) {
	if (args) {
		args.tagName = "td";
		DlContainer.call(this, args);
	}
};
