// @require widget.js

(function(){

	var BASE = DlMacBarIcon.inherits(DlAbstractButton);
	function DlMacBarIcon(args) {
		if (args) {
			DlMacBarIcon.setDefaults(this, args);
			this.__currentWidth = this.__minWidth;
			this.__currentHeight = this.__minHeight;
                        this.__align = this.__align.split(/\s+/).toHash();
			DlAbstractButton.call(this, args);
		}
	};

	eval(Dynarch.EXPORT("DlMacBarIcon"));

	var CLS = { active    : "DlMacBarIcon-active",
		    hover     : "DlMacBarIcon-hover",
		    checked   : "DlMacBarIcon-1",
		    unchecked : "DlMacBarIcon-0",
		    empty     : "DlMacBarIcon-empty",
		    disabled  : "DlMacBarIcon-disabled"
	};

	D.DEFAULT_ARGS = {
		_classes         : [ "classes"        , CLS ],
		__image          : [ "img"            , null ],
		__minWidth       : [ "minWidth"       , 32 ],
		__minHeight      : [ "minHeight"      , 32 ],
		__maxWidth       : [ "maxWidth"       , 64 ],
		__maxHeight      : [ "maxHeight"      , 64 ],
		__align          : [ "align"          , "bottom" ],
                __tooltipTimeout : [ "tooltipTimeout" , 900 ]
	};

	P._createElement = function() {
		// the one in DlAbstractButton is too complicated
		DlWidget.prototype._createElement.call(this);
		this.setContent(String.buffer("<img src='", this.__image,
					      "' width='", this.__minWidth,
					      "' height='", this.__minHeight,
					      " ' />").get());
	};

	P.getImgElement = function() {
		return this.getElement().firstChild;
	};

        P.flash = function(timeout) {
                this._onMouseEnter();
                this._onMouseLeave.delayed(timeout || 100, this);
        };

	P.initDOM = function() {
		BASE.initDOM.call(this);
		this.addEventListener({ onDestroy : onDestroy });
		this.__anim = new DlAnimation(25, 40);
		this.__anim.addEventListener({ onUpdate : onAnimationUpdate.$(this),
					       onStart  : onAnimationStart.$(this)
					     });
	};

	function onDestroy() {
		this.__anim.destroy();
	};

	P._onMouseEnter = function() {
		BASE._onMouseEnter.apply(this, arguments);
		var a = this.__anim;
		a.ew = this.__maxWidth;
		a.eh = this.__maxHeight;
		a.start(30, 50, DlAnimation.easing.elastic_b);
	};

	P._onMouseLeave = function() {
		BASE._onMouseLeave.apply(this, arguments);
		var a = this.__anim;
		a.ew = this.__minWidth;
		a.eh = this.__minHeight;
		a.start(50, 50, DlAnimation.easing.accel_b);
	};

	function onAnimationStart() {
		this.__anim.sw = this.__currentWidth;
		this.__anim.sh = this.__currentHeight;
	};

	function onAnimationUpdate() {
		var a = this.__anim, img = this.getImgElement(), y = a.getPos(), mt;
                var yy = a.getPos(function(x) {
                        return 1-Math.cos(x*2.5*Math.PI)/Math.exp(5*x);
                });
		img.width = this.__currentWidth = y.mapInt(a.sw, a.ew);
		img.height = this.__currentHeight = yy.mapInt(a.sh, a.eh);
                a = this.__align;
		mt = this.__minWidth - this.__currentWidth;
		if (a.center)
			mt /= 2;
		if (a.left || a.center)
			img.style.marginRight = mt + "px";
                if (a.right || a.center)
			img.style.marginLeft = mt + "px";
		mt = this.__minHeight - this.__currentHeight;
		if (a.middle)
			mt /= 2;
		if (a.top || a.middle)
			img.style.marginBottom = mt + "px";
                if (a.bottom || a.middle)
			img.style.marginTop = mt + "px";
	};

})();
