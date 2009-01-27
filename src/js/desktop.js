// @require container.js
// @require geometry.js

(function(){

	var BASE = DlDesktop.inherits(DlContainer);
	function DlDesktop(args) {
		if (args) {
			D.setDefaults(this, args);
			DlContainer.call(this, args);
		}
	};

	eval(Dynarch.EXPORT("DlDesktop"));

	D.DEFAULT_ARGS = {
		_bounds : [ "bounds", new DlRect(50, 30, 800, 600) ]
	};

	P._createElement = function() {
		BASE._createElement.call(this);
		var div = this.getElement();
		this._bounds.positionDiv(div);
		document.body.appendChild(div);
	};

	var resizeDivID = Dynarch.ID("IEsux");
	IEresize = function() {
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
		this.setSize({ x: tmp.offsetLeft, y: tmp.offsetTop + tmp.offsetHeight });
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

})();
