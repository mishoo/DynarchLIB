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

        P.__withIconClass = "DlButton-withIcon";

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
