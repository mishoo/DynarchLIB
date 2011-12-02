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

DEFINE_CLASS("DlFieldset", DlContainer, function(D, P, DOM){

        D.DEFAULT_ARGS = {
	        _label : [ "label", "DlFieldset" ]
        };

        P._createElement = function() {
	        D.BASE._createElement.call(this);
 	        this.getElement().innerHTML = [
                        "<span class='DlFieldset-label'>", this._label, "</span>",
 			"<div class='DlFieldset-content'></div>"
                ].join("");
        };

        P.getContentElement = function() {
	        return this.getElement().childNodes[1];
        };

        P.getLabelElement = function() {
                return this.getElement().firstChild;
        };

        P.setOuterSize = P.setSize = function(sz) {
                var p1 = DOM.getPos(this.getLabelElement()),
                    p2 = DOM.getPos(this.getContentElement()),
                    diff = p2.y - p1.y;
                DOM.setOuterSize(this.getElement(), sz.x, sz.y - diff);
                sz = DOM.getInnerSize(this.getElement());
                DOM.setOuterSize(this.getContentElement(), sz.x, sz.y);
                this.callHooks("onResize");
        };

});
