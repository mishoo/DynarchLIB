// @require eventproxy.js

DlCellModel.inherits(DlEventProxy);
function DlCellModel(args) {
	if (args) {
		DlEventProxy.call(this);
		this.registerEvents(DlCellModel.DEFAULT_EVENTS);
		Dynarch.setDefaults.call(this, DlCellModel.DEFAULT_ARGS, args);
		this._props = {};
	}
};

DlCellModel.DEFAULT_EVENTS = [ "onChange" ];

DlCellModel.DEFAULT_ARGS = {
	_model    : [ "model", null ],
	_row      : [ "row", 0 ],
	_col      : [ "col", 0 ]
};

DlCellModel.OBJECT_EXTENSIONS = {
	setType : function(type) { return this.setProp("type", type); },

	getType : function() { return this.getProp("type"); },

	setValue : function(value) { return this.setProp("value", value); },

	getValue : function() { return this.getProp("value"); },

	getProp : function(name) {
		return this._props[name];
	},
	setProp : function(name, val) {
		var old_val = this.getProp(name);
		this._props[name] = val;
		this.callHooks("onChange", this, "prop", name, old_val, val);
	},
	compare : function(o) {
		return DlCellModel.COMPARATORS[this.getType()](this.getValue(), o.getValue());
	},

	row : function() { return this._row; },
	col : function() { return this._col; },

	dumpHTML : function() {
		var val = this.getValue();
		val += ":" + this._row + "," + this._col;
		return [ "<td style='border: 1px solid #f00'>", val, "</td>" ].join("");
	}
};

DlCellModel.COMPARATORS = {
	"istring" : function(a, b) {
		return DlCellModel.COMPARATORS.string(a.toLowerCase(),
						      b.toLowerCase());
	},
	"string" : function(a, b) {
		return a <= b
			? (a == b ? 0 : -1)
			: 1;
	},
	"number" : function(a, b) {
		return a - b;
	},
	"size_unit_after" : function(a, b) {
		return parseFloat(a) - parseFloat(b);
	}
};

DlCellModel.COMPARE = function(a, b) { return a.compare(b); };

DlCellModel.inject();
