// @require container.js

(function(){

        var BASE = DlFieldset.inherits(DlContainer);
        function DlFieldset(args) {
	        if (args) {
		        D.setDefaults(this, args);
		        DlContainer.call(this, args);
	        }
        };

        eval(Dynarch.EXPORT("DlFieldset", true));

        D.DEFAULT_ARGS = {
	        _label : [ "label", "DlFieldset" ]
        };

        P._createElement = function() {
	        BASE._createElement.call(this);
 	        this.getElement().innerHTML = [ "<span class='DlFieldset-label'>", this._label, "</span>",
 					        "<div class='DlFieldset-content'></div>" ].join("");
        };

        P.getContentElement = function() {
	        return this.getElement().childNodes[1];
        };

        P.getLabelElement = function() {
                return this.getElement().firstChild;
        };

        P.setOuterSize = P.setSize = function(sz) {
                var p1 = DOM.getPos(this.getLabelElement())
                , p2 = DOM.getPos(this.getContentElement())
                , diff = p2.y - p1.y;
                DOM.setOuterSize(this.getElement(), sz.x, sz.y - diff);
                sz = DOM.getInnerSize(this.getElement());
                DOM.setOuterSize(this.getContentElement(), sz.x, sz.y);
                this.callHooks("onResize");
        };

})();
