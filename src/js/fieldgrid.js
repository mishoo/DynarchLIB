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

// @require table.js

DEFINE_CLASS("DlFieldGrid", DlTable, function(D, P) {

        D.CONSTRUCT = function() {
                this.__fields = {};
        };

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
                c1.addClass("DlFieldGrid-labelCell");
		if (args.valign == "top" && (label instanceof DlLabel))
			c1.getElement().style.paddingTop = args.vtop || "4px";
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
			var w = this.getField(name), f = w.getFormValue || w.getValue;
			if (f instanceof Function) {
                                if (w instanceof DlAbstractButton && w._checkTwoState(true)) {
                                        var v = f.call(w);
                                        if (typeof v == "boolean") {
                                                val[name] = v;
                                        } else if (v == null) {
                                                val[name] = w.checked();
                                        } else if (w.checked()) {
                                                val[name] = v;
                                        }
                                } else {
				        val[name] = f.call(w);
                                }
                        }
		}
                return val;
	};

        P.getValues = P.getValue;

        P.setValue = function(hash) {
                for (var name in hash) {
                        var w = this.getField(name), v = hash[name], f;
                        if (w) {
                                f = w.setFormValue || w.setValue;
                                if (f instanceof Function) {
                                        if (w instanceof DlAbstractButton && w._checkTwoState(true)) {
                                                w.checked(typeof v == "string"
                                                          ? v != "0"
                                                          : !!v);
                                        } else {
                                                f.call(w, v);
                                        }
                                }
                        }
                }
        };

        P.setValues = P.setValue;

});
