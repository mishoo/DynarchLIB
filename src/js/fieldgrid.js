// @require table.js

(function(){

	var BASE = DlFieldGrid.inherits(DlTable);
	function DlFieldGrid(args) {
		if (args) {
			DlTable.call(this, args);
			this.__fields = {};
		}
	};

	eval(Dynarch.EXPORT("DlFieldGrid"));

	P.addField = function(args, opts, ret) {
		var entry = args.widget || new DlEntry(args);
		var label = args.label;
                if (!opts)
                        opts = {};
                if (label) {
		        if (!(label instanceof DlWidget)) {
			        label = new DlLabel({ label  : args.label.makeLabel(),
					              widget : entry });
                        } else if (label instanceof DlLabel) {
                                label.setWidget(entry);
                        }
                }
		var row = this.addRow();
		var c1 = this.addCell(row, "right", args.valign);
		if (args.valign == "top" && (label instanceof DlLabel))
			c1.getElement().style.paddingTop = "4px";
                if (label)
		        c1.appendWidget(label);
		if (opts.middleText) {
			var tmp = this.addCell(row);
			tmp.setContent(opts.middleText);
		}
		var c2 = this.addCell(row);
		c2.appendWidget(entry);
                var id = args.id || args.name;
		if (id != null) {
			this.__fields[id] = entry.getWidgetId();
                        delete args["id"];
                }
		if (opts) {
			var el = c2.getElement();
			if (opts.colSpan)
				el.colSpan = opts.colSpan;
			if (opts.rowSpan)
				el.rowSpan = opts.rowSpan;
		}
		if (ret) {
			ret.row = row;
			ret.c1 = c1;
			ret.c2 = c2;
			ret.label = label;
			ret.entry = entry;
		}
		return entry;
	};

	P.getField = function(id) {
		return id ? DlWidget.getById(this.__fields[id]) : this.__fields;
	};

        P.setField = function(name, widget) {
                this.__fields[name] = widget.getWidgetId();
        };

	P.getValue = function() {
		var val = {};
		for (var name in this.__fields) {
			var w = this.getField(name);
			if (w.getValue instanceof Function) {
                                if (w instanceof DlAbstractButton && w._checkTwoState(true)) {
                                        var v = w.getValue();
                                        if (v == null) {
                                                val[name] = w.checked();
                                        } else if (w.checked()) {
                                                val[name] = v;
                                        }
                                } else {
				        val[name] = w.getValue();
                                }
                        }
		}
                return val;
	};

        P.getValues = P.getValue;

        P.setValue = function(hash) {
                for (var name in hash) {
                        var w = this.getField(name), v = hash[name];
                        if (w && w.setValue instanceof Function) {
                                if (w instanceof DlAbstractButton && w._checkTwoState(true)) {
                                        w.checked(typeof v == "string"
                                                  ? v != "0"
                                                  : !!v);
                                } else {
                                        w.setValue(v);
                                }
                        }
                }
        };

        P.setValues = P.setValue;

})();
