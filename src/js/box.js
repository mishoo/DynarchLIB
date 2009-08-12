// @require container.js

DEFINE_CLASS("DlBox", DlContainer, function(D, P, DOM) {

	D.DEFAULT_ARGS = {
		_borderSpacing  : [ "borderSpacing"  , 0 ],
		_align          : [ "align"          , null ],

                // override in DlWidget
                _tagName        : [ "tagName"        , "table" ]
	};

	P._createElement = function() {
		D.BASE._createElement.call(this);
		var table = this.getElement();
		table.cellSpacing = this._borderSpacing;
		table.cellPadding = 0;
		if (this._align)
			table.align = this._align;
		this.refNode("_tbody", DOM.createElement("tbody", null, null, table));
	};

	//P.getTableElement = function() { return this.getElement().firstChild; };
	P.getTableElement = P.getElement;

	P._appendWidgetElement = function(widget, where) {
		if (where == null)
			this.createCellElement().appendChild(widget.getElement());
		else
			where.appendChild(widget.getElement());
	};

	// FIXME: this shouldn't be here.
	P.destroyChildWidgets = function() {
		var a = Array.$(this._widgets);
		a.r_foreach(function(w) {
				    try {
					    w.destroy();
				    } catch(ex) {};
			    });
	};

	// <PURE VIRTUAL> -- we mean it.  DO Define this in subclasses.
	// P.createCellElement = function() {};
	// </PURE VIRTUAL>

	P.__addSep = function(sep_cls, cls, td) {
		if (!td)
			td = this.createCellElement();
		td.separator = true;
		var cn = this._objectType + "-" + sep_cls;
		if (cls)
			cn += " " + cls;
		td.className = cn;
		td.innerHTML = "<div class='" + cn + "'>&nbsp;</div>";
		DOM.setUnselectable(td);
		return td;
	};

	P.addSeparator = function(cls, td) {
		return this.__addSep("separator", cls, td);
	};

	P.addSpace = function(cls, td) {
		return this.__addSep("spacer", cls, td);
	};

});
