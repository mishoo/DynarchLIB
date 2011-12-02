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

// @deprecate?

DEFINE_CLASS("DlTable", DlContainer, function(D, P, DOM){

        var CE = DOM.createElement;

	D.FIXARGS = function(args) {
		args.tagName = "table";
		this._colSpan = 0;
	};

	D.DEFAULT_ARGS = {
		__cellSpacing : [ "cellSpacing", null ],
		__cellPadding : [ "cellPadding", null ],
		__align       : [ "align"      , null ]
	};

	P._createElement = function() {
		D.BASE._createElement.call(this);
		var el = this.getElement();
		if (this.__cellPadding != null)
			el.cellPadding = this.__cellPadding;
		if (this.__cellSpacing != null)
			el.cellSpacing = this.__cellSpacing;
		if (this.__align != null)
			el.align = this.__align;
		CE("tbody", null, null, el);
	};

	P.getContentElement = function() {
		return this.getElement().firstChild;
	};

	P.addRow = function() {
		return new DlTableRow({ parent: this });
	};

	P.getRow = function(index) {
		return this.children(index);
	};

	P.addCell = function(row, align, valign) {
		var cell = new DlTableCell({ parent: row });
		if (align != null)
			cell.addClass("DlAlign-" + align);
		if (valign != null) {
			var s = cell.getElement().style;
			s.verticalAlign = valign;
		}
		var index = cell.getElement().cellIndex + 1;
		if (index > this._colSpan)
			this._colSpan = index;
		return cell;
	};

	P.getColSpan = function() {
		return this._colSpan;
	};

	P.setColSpan = function(colSpan) {
		this._colSpan = colSpan;
	};

	P.addSeparator = function(span) {
		if (span == null)
			span = this.getColSpan();
		CE("div", null, { innerHTML: "&nbsp;" },
		   CE("td", null, { colSpan: span },
		      CE("tr", null, { className: "DlTable-RowSeparator" },
			 this.getContentElement())));
	};

});

DEFINE_CLASS("DlTableRow", DlContainer, function(D, P){
        D.DEFAULT_ARGS = {
                // override in DlWidget
                _tagName: [ "tagName", "tr" ]
        };
});

DEFINE_CLASS("DlTableCell", DlContainer, function(D, P){
        D.DEFAULT_ARGS = {
                // override in DlWidget
                _tagName: [ "tagName", "td" ]
        };
});
