// @require container.js
// @require button.js

(function(){

	var BASE = DlNotebook.inherits(DlContainer);
	function DlNotebook(args) {
		if (args) {
			DlContainer.call(this, args);
			this._panes = [];
			this._currentPane = null;
		}
	};

	eval(Dynarch.EXPORT("DlNotebook"));

        var DEFAULT_EVENTS = [ "onChange" ];

	P._createElement = function() {
		BASE._createElement.call(this);
		this.getElement().innerHTML = "<div class='TabContent-inner'></div>";
	};

	P.appendWidget = function(w, pos) {
                w.registerEvents([ "onNotebookShow" ]);
		BASE.appendWidget.call(this, w);
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
		this.registerEvents(DEFAULT_EVENTS);
		BASE.initDOM.call(this);
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
		pane.setPos(this.__widgetsPosition, this.__widgetsPosition);
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
		BASE.setOuterSize.call(this, size);
		var el = this.getElement();
		size = DynarchDomUtils.getInnerSize(el);
		DynarchDomUtils.setOuterSize(this.getContentElement(), size.x, size.y);
		el.style.width = el.style.height = "";
		size = DynarchDomUtils.getInnerSize(this.getContentElement());
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

})();
