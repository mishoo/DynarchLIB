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

// @require box.js

DEFINE_CLASS("DlHbox", DlBox, function(D, P, DOM) {

        var CE = DOM.createElement;

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

});
