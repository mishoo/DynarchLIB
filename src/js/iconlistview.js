// @require abstractbutton.js

DlIconListView.inherits(DlContainer);
function DlIconListView(args) {
	if (args)
		DlContainer.call(this, args);
};

(function() {

	var CLS = { active    : "DlIconListItem-active",
		    hover     : "DlIconListItem-hover",
		    checked   : "DlIconListItem-1",
		    unchecked : "DlIconListItem-0",
		    empty     : "DlIconListItem-empty",
		    disabled  : "DlIconListItem-disabled"
		  };

	var BASE = DlIconListItem.inherits(DlAbstractButton);
	function DlIconListItem(args) {
		if (args) {
			DlIconListItem.setDefaults(this, args);
			DlAbstractButton.call(this, args);
		}
	};

	eval(Dynarch.EXPORT("DlIconListItem"));

	D.DEFAULT_ARGS = {
		__itemSize     : [ "itemSize"    , { x: 100, y: null } ],
		__itemSpacing  : [ "itemSpacing" , 0 ],
		__spaceEvenly  : [ "spaceEvenly" , false ],
		__iconSize     : [ "iconSize"	 , { x: 40, y: 40 } ],
		__iconAbove    : [ "iconAbove"	 , true ],
		_btnType       : [ "type"        , DlAbstractButton.TYPE.TWOSTATE ],
		_tagName       : [ "tagName"	 , "table" ],
		_classes       : [ "classes"	 , CLS ],
		_iconClass     : [ "iconClass"   , null ]
	};

        var ICON_LABEL_CLASSES = [ "DlIconListItem-iconCell", "DlIconListItem-labelCell" ];

	P._createElement = function() {
		DlWidget.prototype._createElement.call(this); // DlAbstractButton's createElement is not suitable
		var table = this.getElement();
		table.cellSpacing = table.cellPadding = 0;
		if (this.__spaceEvenly)
			table.style.margin = this.__itemSpacing + "px";
		else
			table.style.marginRight = table.style.marginBottom = this.__itemSpacing + "px";
		table.insertRow(-1).insertCell(-1);
		table.insertRow(-1).insertCell(-1);
		table.align = "left";
		this.setIconAbove(this.__iconAbove, true);
		this.setIconClass(this._iconClass);
		this.label(this._label, true);
		this.setIconSize(this.__iconSize);
		this._updateState();
	};

	P.setIconClass = function(className) {
		this.getIconCell().className = ICON_LABEL_CLASSES[0] + " " + className;
	};

	P.getIconCell = function() {
		return this.getElement().rows[this.__iconAbove ? 0 : 1].cells[0];
	};

	P.getLabelCell = function() {
		return this.getElement().rows[this.__iconAbove ? 1 : 0].cells[0];
	};

	P.setIconSize = function(sz) {
		DynarchDomUtils.setInnerSize(this.getIconCell(), sz.x, sz.y);
		this.__iconSize = sz;
	};

	P.getIconSize = function() {
		return this.__iconSize;
	};

	P.setIconAbove = function(ia, init) {
		var rows = this.getElement().rows;
		if (init) {
			rows[0].cells[0].className = ICON_LABEL_CLASSES[ia ? 0 : 1];
			rows[1].cells[0].className = ICON_LABEL_CLASSES[ia ? 1 : 0];
		} else if (ia !== this.__iconAbove) {
			// I think just switching them is in order
			rows[1].parentNode.insertBefore(rows[1], rows[0]);
		}
		this.__iconAbove = ia;
	};

	P.label = function(label, force) {
		if (label != null && (force || label !== this._label)) {
			this._label = label;
			this.getLabelCell().innerHTML = String.buffer(
				"<div class='DlIconListItem-labelDiv' style='width:",
				this.__itemSize.x,
				"px'>", label, '</div>').get();
			this.applyHooks("onUpdateLabel", [ this._label ]);
		}
		return this._label;
	};

})();
