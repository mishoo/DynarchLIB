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

// @require eventproxy.js

DEFINE_CLASS("DlRadioGroup", DlEventProxy, function(D, P){

	D.CONSTRUCT = function(id) {
		if (id != null) {
			this._maxChecked = 1;
			this._minChecked = null;
			this.id = id;
			this.reset();
			this.addEventListener("onDestroy", onDestroy);
		}
	};

	var GROUPS = {};

        D.DEFAULT_EVENTS = [ "onChange" ];

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
                        if (this._history.length != this._history.remove(w).length)
                                this.callHooks("onChange");
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

});
