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
// @require geometry.js

DEFINE_CLASS("DlDesktop", DlContainer, function(D, P){

	D.DEFAULT_ARGS = {
		_bounds : [ "bounds", new DlRect(50, 30, 800, 600) ]
	};

	P._createElement = function() {
		D.BASE._createElement.call(this);
		var div = this.getElement();
		this._bounds.positionDiv(div);
		document.body.appendChild(div);
	};

        if (is_ie)
                var resizeDivID = Dynarch.ID("IEsux"), IEresize = function() {
		        var tmp = document.getElementById(resizeDivID);
		        if (!tmp) {
			        tmp = document.createElement("div");
			        tmp.style.position = "absolute";
			        tmp.style.right =
				        tmp.style.bottom =
				        tmp.style.width =
				        tmp.style.height = "0px";
			        tmp.style.zIndex = "-100";
			        document.body.appendChild(tmp);
		        }
		        this.setSize({ x: tmp.offsetLeft,
                                       y: tmp.offsetTop + tmp.offsetHeight });
	        };

	P.fullScreen = function() {
		var s = this.getElement().style;
		s.top = "0px";
		s.left = "0px";
		s.width = "100%";
		s.height = "100%";
		var handler;
		if (!is_ie)
			handler = this.callHooks.$(this, "onResize");
		else
			handler = IEresize.$(this);
		DynarchDomUtils.addEvent(window, "resize", handler.clearingTimeout(25));
	};

});
