function DlType(name) {
	if (name) {
		this.name = name;
		DlType.TYPES[name] = this;
	}
};

DlType.TYPES = {};

DlType.prototype = {
	getDisplayValue : function(val) { return val; },
	compare : function(a, b) { throw "No comparator for type: " + this.name; }
};
