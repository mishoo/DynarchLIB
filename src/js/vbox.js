// @require box.js

(function() {

	DlVbox.inherits(DlBox);
	function DlVbox(args) {
		if (args)
			DlBox.call(this, args);
	};

	eval(Dynarch.EXPORT("DlVbox", true));

	P.createCellElement = function() {
		return CE("td", null, { className : "cell" },
			  CE("tr", null, { className : "row" }, this._tbody));
	};

	P._removeWidgetElement = function(w) {
		if (this._widgets.contains(w)) {
			var el = w.getElement();
			el.parentNode.parentNode.parentNode.removeChild(el.parentNode.parentNode);
		}
	};

})();
