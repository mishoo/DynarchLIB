// @require abstractbutton.js

DEFINE_CLASS("DlLabel", DlAbstractButton, function(D, P){

        D.DEFAULT_ARGS = {
		_activateWidget  : [ "widget"  , null ],

                // override in DlWidget
                _tagName         : [ "tagName" , "span" ]
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

});
