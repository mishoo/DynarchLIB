// @require buttonmenu.js
// @require radiobutton.js

DEFINE_CLASS("DlRadioSelect", DlButtonMenu, function(D, P){

	D.CONSTRUCT = function() {
		if (this._options.length)
			this.setOptions(this._options);
		this.value(this._value, true);
                this.addEventListener("onDestroy", function(){
                        this._radioGroup.reset();
                });
	};

        var DEFAULT_EVENTS = [ "onChange" ];

	D.DEFAULT_ARGS = {
		_options    : [ "options"   , [] ],
		_value	    : [ "value"	    , null ],
		_connected  : [ "connected" , true ]
	};

	// TODO: get rid of the value() function, use set* and get* methods

	P.value = function(value, force, nocalls) {
		var oldval = this._value;
		if (force || typeof value != "undefined" && value !== oldval) {
			this._value = value;
			this._updateLabel();
			if (!nocalls)
				this.applyHooks("onChange", [ oldval, value ]);
		}
		return oldval;
	};

	P.getValue = function() { return this.value(); };

	P.setValue = P.value;

	function radioGroup_onChange(cb) {
		if (cb.checked()) {
			this.value(cb.userData);
			DlPopup.clearAllPopups();
		}
		cb._onMouseLeave();
	};

	P._updateLabel = function() {
		var label = null, a = this._options, i, o;
		for (i = a.length; --i >= 0;) {
			o = a[i];
			if (o == null)
				continue;
			if (this._value == o.value) {
				this.getButton().label(o.label);
				o.widget.checked(true);
			}
		}
	};

	P._setListeners = function() {
		this.registerEvents(DEFAULT_EVENTS);
		D.BASE._setListeners.call(this);
		this._radioGroup = new DlRadioGroup(this.id);
	};

	P.setOptions = function(options) {
                var g = this._radioGroup, menu, args;
		g.reset();
		g.addEventListener("onChange", radioGroup_onChange.$(this));
		menu = new DlVMenu({ className: "DlSelect-menu" });
		args = {
			parent    : menu,
			group     : g,
			noCapture : true
		};
		options.foreach(function(o) {
			if (o == null)
				menu.addSeparator();
			else {
				args.label = o.label;
				args.data = o.value;
                                args.className = o.className;
				var r = o.widget = new DlRadioButton(args);
				r.connectEvents("onMouseUp", "onClick");
			}
		}, this);

		var el = menu.getElement();
		el.style.position = "absolute";
		menu.zIndex(-100);
		document.body.appendChild(el);
		var width = menu.getOuterSize().x;
		document.body.removeChild(el);
                menu.zIndex("");
		el.style.position = "";

		(function() {
			this.getButton().setOuterSize({ x: width - this.getArrow().getOuterSize().x + 2 });
		}).$(this).delayed(10);

		this.setMenu(menu);
		this._options = options;
	};

	P.addOption = function(opt, index) {
                if (index == null)
                        index = this._options.length;
		var item = opt.widget = new DlRadioButton({ parent     : this._menu,
					                    group      : this._radioGroup,
					                    noCapture  : true,
					                    label      : opt.label,
					                    data       : opt.value,
                                                            className  : opt.className
					                  });
		item.connectEvents("onMouseUp", "onClick");
                this._options.splice(index, 0, opt);
		return item;
	};

	P.initDOM = function() {
		D.BASE.initDOM.call(this);
	};

});
