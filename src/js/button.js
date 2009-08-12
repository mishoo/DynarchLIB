// @require abstractbutton.js

DEFINE_CLASS("DlButton", DlAbstractButton, function(D, P, DOM){

	D.CONSTRUCT = function() {
		this.setIconClass(this._iconClass);
		this._iconClass = null;
	};

	D.TYPE = DlAbstractButton.TYPE;

	D.DEFAULT_ARGS = {
		_classes    : [ "classes"   , {
                        active    : "DlButton-active",
                        hover     : "DlButton-hover",
                        checked   : "DlButton-1",
                        unchecked : "DlButton-0",
                        empty     : "DlButton-empty",
                        disabled  : "DlButton-disabled"
                } ],
		_iconClass  : [ "iconClass" , null ]
	};

	P._createElement = function() {
		D.BASE._createElement.call(this);
		this.addClass("DlWidget-3D");
	};

	P._createLabelElement = function() {
		this.getElement().innerHTML = "<div class='DlButton-inner'><div></div></div>";
	};

	P.getContentElement = function() {
		return this.getElement().firstChild.firstChild;
	};

	P.setSize = P.setOuterSize = function(size) {
		var d1 = DOM.getPaddingAndBorder(this.getElement());
		if (size.x != null)
			size.x -= d1.x;
		if (size.y != null)
			size.y -= d1.y;
		d1 = DOM.getPaddingAndBorder(this.getElement().firstChild);
		if (size.x != null)
			size.x -= d1.x;
		if (size.y != null)
			size.y -= d1.y;
		DOM.setOuterSize(this.getContentElement(), size.x, size.y);

// 		D.BASE.setOuterSize.call(this, size);
// 		var el = this.getElement();
// 		size = DOM.getInnerSize(el);
// 		//size.x -= 8;
// 		//size.y -= 4;
// 		DOM.setOuterSize(this.getContentElement(), size.x, size.y);
// 		el.style.width = el.style.height = "";
	};

});
