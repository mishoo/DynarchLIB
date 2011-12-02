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

// @require abstractbutton.js

// @deprecate?

DEFINE_CLASS("DlIconListView", DlContainer);

DEFINE_CLASS("DlIconListItem", DlAbstractButton, function(D, P) {

	D.DEFAULT_ARGS = {
		__itemSize     : [ "itemSize"    , { x: 100, y: null } ],
		__itemSpacing  : [ "itemSpacing" , 0 ],
		__spaceEvenly  : [ "spaceEvenly" , false ],
		__iconSize     : [ "iconSize"	 , { x: 40, y: 40 } ],
		__iconAbove    : [ "iconAbove"	 , true ],
		_btnType       : [ "type"        , DlAbstractButton.TYPE.TWOSTATE ],
		_tagName       : [ "tagName"	 , "table" ],
		_classes       : [ "classes"	 , { active    : "DlIconListItem-active",
		                                     hover     : "DlIconListItem-hover",
		                                     checked   : "DlIconListItem-1",
		                                     unchecked : "DlIconListItem-0",
		                                     empty     : "DlIconListItem-empty",
		                                     disabled  : "DlIconListItem-disabled"
		                                   } ],
		_iconClass     : [ "iconClass"   , null ]
	};

        var ICON_LABEL_CLASSES = [ "DlIconListItem-iconCell", "DlIconListItem-labelCell" ];

	P._createElement = function() {

                // DlAbstractButton's createElement is not suitable!
		DlWidget.prototype._createElement.call(this);

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

});
