// @require eventproxy.js

(function() {

	var BASE = DlRadioGroup.inherits(DlEventProxy);
	function DlRadioGroup(id) {
		if (id != null) {
			DlEventProxy.call(this);

			this._maxChecked = 1;
			this._minChecked = null;
			this.id = id;

			this.registerEvents(DEFAULT_EVENTS);
			this.reset();
			this.addEventListener("onDestroy", onDestroy);
		}
	};

	var GROUPS = {};

	eval(Dynarch.EXPORT("DlRadioGroup"));

        var DEFAULT_EVENTS = [ "onChange" ];

	D.getById = D.get = function(id) {
		if (!id)
			id = Dynarch.ID("group");
		var g = GROUPS[id];
		if (!g)
			g = GROUPS[id] = new this(id);
		return g;
	};

	function onDestroy() {
		if (GROUPS[this.id]) {
			this._buttons = null;
			this._buttonsById = null;
			this._buttonsByValue = null;
			this._history = null;
			delete GROUPS[this.id];
		}
	};

	function onChange(w) {
		if (w != null) {
			this._changed = true;
			if (w.checked()) {
				if (this._maxChecked != null) {
					while (this._history.length >= this._maxChecked) {
						var o = this._history[0];
						o.checked(false, true);
						//o.callHooks("onMouseLeave");
						this._history.splice(0, 1);
					}
				}
				this._history.push(w);
			} else if (this._minChecked != null && this._history.length <= this._minChecked) {
                                w.checked(true, true);
                                throw new DlExStopEventProcessing();
			} else {
				this._history.remove(w);
                        }
		}
	};

	P.reset = function() {
                if (this._buttons)
                        this._buttons.r_foreach(function(b){
                                b.__group = b.__groupId = null;
                        });
		this._changed = false;
		this._buttons = [];
		this._buttonsById = {};
		this._buttonsByValue = {};
		this._history = [];
		this.removeAllListeners("onChange");
		this.addEventListener("onChange", onChange);
	};

	P.changed = function(c) {
		var r = this._changed;
		if (c != null)
			this._changed = c;
		return r;
	};

	P.getSelected = function() {
		return this._history;
	};

	P.getButtons = function() {
		return this._buttons;
	};

	P.getNextButton = function(btn) {
		if (btn == null)
			btn = this.getSelected()[0];
		var a = this._buttons, idx = a.nullLimitIndex(a.find(btn) + 1);
		if (idx != null)
			return a[idx];
	};

	P.getPrevButton = function(btn) {
		if (btn == null)
			btn = this.getSelected()[0];
		var a = this._buttons, idx = a.nullLimitIndex(a.find(btn) - 1);
		if (idx != null)
			return a[idx];
	};

	P.getValue = function() {
		return this._history.map("value");
	};

	P.setValue = function(val, hooks) {
		var h = this._buttonsByValue;
		if (!(val instanceof Array))
			val = [ val ];
		val = val.toHash(true);
		this._history = [];
		for (var i in h) {
			h[i].checked(val[i], true);
			if (val[i])
				this._history.push(h[i]);
		}
		if (hooks)
			this.callHooks("onChange");
	};

	P.getByValue = function(val) {
		return this._buttonsByValue[val];
	};

	P.addWidget = function(w, pos) {
		if (!this._buttonsById[w.id]) {
                        if (pos == null)
                                pos = this._buttons.length;
			this._buttonsById[w.id] = w;
			this._buttons.splice(pos, 0, w);
 			if (w.checked())
				this._history.push(w);
			var val = w.value();
			if (typeof val != "undefined")
				this._buttonsByValue[val] = w;
			w.addEventListener("onDestroy", this.removeWidget.$(this, w));
		}
	};

	P.removeWidget = function(w) {
		if (this._buttonsById[w.id]) {
			this._changed = true;
			delete this._buttonsById[w.id];
			var val = w.value();
			if (typeof val != "undefined")
				delete this._buttonsByValue[w.value()];
			this._buttons.remove(w);
			this._history.remove(w);
		}
	};

	P.minChecked = function(minChecked) {
		if (arguments.length > 0)
			this._minChecked = minChecked;
		return this._minChecked;
	};

	P.maxChecked = function(maxChecked) {
		if (arguments.length > 0)
			this._maxChecked = maxChecked;
		return this._maxChecked;
	};

	// This really checks all.  Doesn't make too much sense when
	// _maxChecked restricts selection.
	P.checkAll = function(val, hooks) {
		if (val == null)
			val = true;
                if (hooks == null)
                        hooks = false;
		this._buttons.foreach(function(w) {
			w.checked(val, !hooks);
		});
		this._history = val ? Array.$(this._buttons) : [];
	};

	P.unCheckAll = function() {
		this._history.r_foreach(function(w) { w.checked(false); });
	};

})();
