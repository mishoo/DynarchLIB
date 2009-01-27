// @require box.js

(function() {

	DlHbox.inherits(DlBox);
	function DlHbox(args) {
		if (args)
			DlBox.call(this, args);
	};

	eval(Dynarch.EXPORT("DlHbox", true));

	P._createElement = function() {
		D.BASE._createElement.call(this);
		this.refNode("_row", CE("tr", null, null, this._tbody));
	};

	P.createCellElement = function(pos) {
		var td = CE("td", null, { className : "cell" });
		pos != null
			? this._row.insertBefore(td, pos)
			: this._row.appendChild(td);
		return td;
	};

	P._removeWidgetElement = function(w) {
		if (this._widgets.contains(w)) {
			var el = w.getElement();
			el.parentNode.parentNode.removeChild(el.parentNode);
		}
	};

	P.addFiller = function() {
		var td = this.createCellElement();
		td.className += " DlHbox-filler";
		this.addClass("DlHbox-hasFiller");
	};

	P.setAlign = function(left, right) {
		var el = this.getElement();
		switch (left) {
		    case "left":
			el.style.marginLeft = "0";
			el.style.marginRight = "auto";
			break;
		    case "center":
			el.style.marginLeft = "auto";
			el.style.marginRight = "auto";
			break;
		    case "right":
			el.style.marginLeft = "auto";
			el.style.marginRight = "0";
			break;
		    default :
			el.style.marginLeft = left != null ? left : "auto";
			el.style.marginRight = right != null ? right : "auto";
		}
	};

	P.setEqualWidths = function(d) {
		var width = this.children().max(function(w) {
			return w.getSize().x;
		});
		if (d)
			width += d;
		this.children().r_foreach(function(w) {
			w.setSize({ x: width });
		});
	};

})();
