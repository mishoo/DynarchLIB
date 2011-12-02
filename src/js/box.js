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
