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
// @require button.js

DEFINE_CLASS("DlNotebook", DlContainer, function(D, P) {

        // XXX: can we use D.DEFAULT_EVENTS?
        var DEFAULT_EVENTS = [ "onChange" ];

	P._createElement = function() {
		D.BASE._createElement.call(this);
		this.getElement().innerHTML = "<div class='TabContent-inner'></div>";
	};

	P.appendWidget = function(w, pos) {
                w.registerEvents([ "onNotebookShow" ]);
		D.BASE.appendWidget.call(this, w);
		var el = w.getElement();
		var cont = this.getContentElement();

		if (pos != null)
			pos = this.__widgetsPosition;
		else
			this.__widgetsPosition = pos;

		if (pos == null)
			pos = this.__widgetsPosition = DynarchDomUtils.getPadding(cont).x / 2;

//		w.display(false);
 		el.style.position = "absolute";
 		el.style.visibility = "hidden";
 		el.style.left = el.style.top = pos + "px";
		cont.appendChild(el);
		this._panes.push(w);
	};

	P.initDOM = function() {
                this._panes = [];
		this._currentPane = null;
		this.registerEvents(DEFAULT_EVENTS);
		D.BASE.initDOM.call(this);
	};

	P.getPane = function(index) { return this._panes[index]; };

        P.getAllPanes = function() { return this._panes };

	P.getCurrentPane = function() { return this.getPane(this._currentPane); };

	P.getCurrentPaneIndex = function() { return this._currentPane; };

	P.length = function() { return this._panes.length; };

	P.showPane = function(index) {
		var old = this._currentPane;
		if (old != null) {
			this.getPane(old).visibility(false);
			this.getPane(old).setPos({ x: -30000, y: -30000 });
		}
		this._currentPane = index;
		var pane = this.getPane(index);
		if (!pane._dl_notebook_has_size) {
			pane.setSize(this.getInnerSize());
			pane._dl_notebook_has_size = true;
		}
		//pane.setPos(this.__widgetsPosition, this.__widgetsPosition);
                pane.setStyle({ left: "", top: "" });
		pane.visibility(true);
		if (index !== old)
			this.applyHooks("onChange", [ index, old ]);
                pane.callHooks("onNotebookShow");
		return this;
	};

	P.firstPane = function() {
		this.showPane(0);
	};

	P.lastPane = function() {
		this.showPane(this.length() - 1);
	};

	P.nextPane = function() {
		var i = this._currentPane;
		i == null ? i = 0 : ++i;
		if (i >= this._panes.length)
			i = 0;
		return this.showPane(i);
	};

	P.prevPane = function() {
		var i = this._currentPane;
		i == null ? i = this._panes.length - 1 : --i;
		if (i < 0)
			i = this._panes.length - 1;
		return this.showPane(i);
	};

	P.isFirstPane = function() { return this._currentPane == 0; };
	P.isLastPane = function() { return this._currentPane == this._panes.length - 1; };

	P.getContentElement = function() {
		return this.getElement().firstChild;
	};

	P.setSize = P.setOuterSize = function(size) {
		D.BASE.setOuterSize.call(this, size);
		var el = this.getElement();
		size = DynarchDomUtils.getInnerSize(el);
		DynarchDomUtils.setOuterSize(this.getContentElement(), size.x, size.y);
		el.style.width = el.style.height = "";
		size = DynarchDomUtils.getInnerSize(this.getContentElement());
                if (this._currentPane == null)
                        this.showPane(0);
		var cp = this.getCurrentPane();
 		this._panes.foreach(function(p) {
			p._dl_notebook_has_size = false;
 		});
		cp.setSize(size);
		cp._dl_notebook_has_size = true;
	};

	P.setIdealSize = function() {
		var size = { x: 0, y: 0 };
		this._panes.r_foreach(function(p) {
			// p.display(true);
			var s = p.getOuterSize();
			// p.display(false);
			if (s.x > size.x) size.x = s.x;
			if (s.y > size.y) size.y = s.y;
		});
		this.setInnerSize(size);
		// this.getPane(this._currentPane).display(true);
	};

});
