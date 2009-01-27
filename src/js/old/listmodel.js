// @require gridmodel.js

DlListModel.inherits(DlGridModel);
function DlListModel(args) {
	if (arguments.length > 0) {
		DlListModel.setDefaults(this, args);
		DlGridModel.call(this, args);
		var a = this._colProps = new Array(this.cols)
			.r_assign_each(Dynarch.makeCopy.$C(DlListModel.DEFAULT_COL_PROPS));
	}
};

DlListModel.DEFAULT_ARGS = {
	_cellType : [ "cellType", DlListCellModel ]
};

DlListModel.DEFAULT_COL_PROPS = {
	align : null,
	width : null,
	label : "Col",
	type : "istring"
};

DlListModel.OBJECT_EXTENSIONS = {
	getColProps : function(col) {
		return col == null
			? this._colProps
			: this._colProps[col];
	},
	setColProps : function(props) {
		this._colProps = props;
	},
	writeHeader : function(col, td, b) {
		var prop = this.getColProps(col);
		if (b)
			b.label(prop.label);
		else
			td.firstChild.innerHTML = prop.label;
		var align = prop.align;
		DynarchDomUtils.delClass(td, DlListView.RE_ALIGN_CLASS);
		if (align != null)
			DynarchDomUtils.addClass(td, "DlListView-align-" + align);
	}
};
DlListModel.inject();


// CELLS

DlListCellModel.inherits(DlCellModel);
function DlListCellModel(args) {
	if (arguments.length > 0) {
		DlCellModel.call(this, args);
	}
};

DlListCellModel.OBJECT_EXTENSIONS = {
	// el will usually be a <td> that contains a <div> which holds the content
	write : function(w, td) {
		td.firstChild.innerHTML = this.getValue();
		var align = this.getProp("align");
		td.style.textAlign = align != null ? align : "";
	},
	getProp : function(name) {
		var ret = DlCellModel.prototype.getProp.call(this, name);
		if (typeof ret == "undefined")
			ret = this._model.getColProps(this._col)[name];
		return ret;
	}
};
DlListCellModel.inject();


// WIDGET CELLS

DlListCellModel_Widget.inherits(DlListCellModel);
function DlListCellModel_Widget(args) {
	if (arguments.length > 0) {
		DlListCellModel.call(this, args);
	}
};

DlListCellModel_Widget.OBJECT_EXTENSIONS = {
    write : function(parent, td) {
		parent.appendWidget(this.getValue(), td.firstChild);
	},

    compare : function(other) {
		var val = this.getValue();
		other = other.getValue();
		if (val instanceof DlCheckbox ||
		    val instanceof DlRadioButton)
			return (other.checked() ? 1 : 0) - (val.checked() ? 1 : 0);
	}
};
DlListCellModel_Widget.inject();
