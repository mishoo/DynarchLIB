// @require box.js

DEFINE_CLASS("DlVbox", DlBox, function(D, P, DOM){

        var CE = DOM.createElement;

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

});
