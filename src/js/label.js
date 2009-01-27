// @require abstractbutton.js

(function(){

	var BASE = DlLabel.inherits(DlAbstractButton);
	function DlLabel(args) {
		if (args) {
			args.tagName = args.tagName || "span";
			D.setDefaults(this, args);
			DlAbstractButton.call(this, args);
		}
	};

	eval(Dynarch.EXPORT("DlLabel"));

        D.DEFAULT_ARGS = {
		_activateWidget : [ "widget", null ]
	};

	P._onMouseDown = function(ev) {
		var w = this._activateWidget;
		if (w) {
			w.focus();
                        ev.domStop = true;
                        DlException.stopEventBubbling();
		}
	};

	P.setWidget = function(widget) {
		this._activateWidget = widget;
	};

	P.getWidget = function() {
		return this._activateWidget;
	};

        P._handle_accessKey = function(ev) {
                this._onMouseDown(ev);
        };

})();
