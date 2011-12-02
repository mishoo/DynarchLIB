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

// @require entry.js

DEFINE_CLASS("DlCompletionEntry", DlEntry, function(D, P, DOM) {

        D.DEFAULT_EVENTS = [ "onCompletion", "onSelect" ];

	D.DEFAULT_ARGS = {
                __timeout  : [ "timeout"   , 500    ],
                _shiftMenu : [ "shift"     , null   ],
                __smart    : [ "smart"     , true   ],
                __noTab    : [ "noTab"     , false  ],
                _noSelect  : [ "noSelect"  , true   ],
                _sizeToFit : [ "sizeToFit" , false  ],
                _electric  : [ "electric"  , true   ]
	};

	P.ALIGN = {
		prefer: "Br",
		fallX1: "_r",
		fallX2: "_L",
		fallY1: "B_",
		fallY2: "T_"
	};

	P._setListeners = function() {
		this.__on_itemHover = on_itemHover.$(null, this);
		this.__on_itemSelect = on_itemSelect.$(null, this);
		D.BASE._setListeners.call(this);
		this.addEventListener({
                        onKeyDown  : onKeyDown,
			onBlur     : onBlur,
			onDestroy  : this.__clearTimer // XXX: not working fine.
		});
	};

	P._hideMenu = function() {
		_getPopup().hide(50);
		this.__clearTimer();
	};

	P.__clearTimer = function() {
		if (this.__timer)
			clearTimeout(this.__timer);
		this.__timer = null;
	};

	var POPUP = null;
	function _getPopup() {
		if (!POPUP) {
			POPUP = DlCompletionPopup.get();
		}
		return POPUP;
	};

	var MENU = null;
	var ITEM = null;
	function _getMenu() {
		if (MENU) {
			ITEM = null;
			MENU.destroy();
		}
		return MENU = new DlVMenu({});
	};

	function _menuVisible() {
		return MENU && MENU.parent.visible;
	};

	function on_itemHover(obj, ev) {
		var newitem = MENU.children().find(this);
		if (newitem != ITEM && ITEM != null)
			MENU.children(ITEM).callHooks("onMouseLeave");
		ITEM = newitem;
                if (obj._electric || !ev)
                        obj._applyCompletion(this.userData);
	};

	function on_itemSelect(obj) {
		obj._hideMenu();
		obj._applyCompletion(this.userData, true);
		obj.applyHooks("onSelect", [ this.userData ]);
                obj.focus.delayed(0, obj);
	};

	P._applyCompletion = function(c, finish) {
		if (!c.nomodify || finish) {
			var r = this.getSelectionRange();
			var str = c.completion || c.label;
			if (finish && c.after)
				str += c.after;
			var val = this.getValue();
			var start = c.start != null ? c.start : r.start;
			val = val.substr(0, start) + str + val.substr(r.end);
			this.setValue(val);
			r.end = start + str.length;
			if (c.rstart != null)
				r.start = c.rstart;
			if (c.noselect || finish)
				r.start = r.end;
			this.setSelectionRange(r);
		}
	};

        P._on_menuHide = function() {
                if (MENU) {
                        MENU.destroy();
                        MENU = null;
                        ITEM = null;
                }
        };

	P.completionReady = function(data) {
		if (this.__timer || this.__forced) {
			if (data != null && data.length > 0) {
				if (this.__smart && data.length == 1) {
					this._applyCompletion(data[0], true);
					this.applyHooks("onSelect", [ data[0] ]);
				} else {
					var mnu = _getMenu();
                                        var sel_item = null;
					data.foreach(function(c) {
						var w = new DlMenuItem({ parent	: mnu,
									 label	: c.label,
									 data	: c });
						w.addEventListener({ onSelect	  : this.__on_itemSelect,
								     onMouseEnter : this.__on_itemHover });
                                                if (c.selected)
                                                        sel_item = w;
					}, this);
					_getPopup().popup({ timeout    : 0,
							    content    : mnu,
							    align      : this.ALIGN,
							    anchor     : this.getElement(),
							    isContext  : true,
							    widget     : this,
                                                            onHide     : this._on_menuHide.$(this),
							    shift      : this._shiftMenu });
                                        if (this._sizeToFit) {
                                                var w = this.getSize().x;
                                                if (mnu.getSize().x < w)
                                                        mnu.setSize({ x: w - DOM.getPaddingAndBorder(_getPopup().getElement()).x });
                                        }
                                        if (sel_item)
                                                sel_item.callHooks("onMouseEnter");
					//mnu.children(0).callHooks("onMouseEnter");
				}
			}
		}
		this.cancelCompletion();
	};

	P.cancelCompletion = function() {
		this.delClass("DlCompletionEntry-busy");
		this.__clearTimer();
		this.__forced = null;
	};

	function __triggerCompletion(ev, forced) {
		this.__origData = { value: this.getValue(),
				    range: this.getSelectionRange() };
		this.__forced = forced;
		this.addClass("DlCompletionEntry-busy");
		this.applyHooks("onCompletion", [ this.getSelectionRange(), ev, forced ]);
	};

	function handleMenuKey(ev) {
		if (!_menuVisible())
			return false;
		var old_item = ITEM, w;
		switch (ev.keyCode) {

		    case DlKeyboard.ARROW_UP:
			if (ITEM == null)
				ITEM = 0;
			ITEM = MENU.children().rotateIndex(--ITEM);
			break;

		    case DlKeyboard.ARROW_DOWN:
		    case DlKeyboard.TAB:
			if (ITEM == null)
				ITEM = -1;
			ITEM = MENU.children().rotateIndex(++ITEM);
			break;

		    case DlKeyboard.ENTER:
                        if (ITEM != null) {
                                this.collapse(false);
                                MENU.children(ITEM).callHooks("onSelect");
                        }
			DlException.stopEventBubbling();

		    case DlKeyboard.ESCAPE:
			this._hideMenu();
			var d = this.__origData;
			if (d) {
				this.setValue(d.value);
				this.setSelectionRange(d.range);
			}
			DlException.stopEventBubbling();
		}

		if (old_item != ITEM) {
			if (old_item != null) {
				w = MENU.children(old_item);
				w.callHooks("onMouseLeave");
			}
			w = MENU.children(ITEM);
			w.callHooks("onMouseEnter");
			DlException.stopEventBubbling();
		} else {
			this._hideMenu();
		}
	};

	function onKeyDown(ev) {
		if (is_ie)
			return handleMenuKey.call(this, ev);
	};

        P._handle_focusKeys = function(ev) {
		if (!DlKeyboard.KEYS_CONTROL[ev.keyCode]) {
			this._hideMenu();
			if (this.__timeout != null)
				this.__timer = __triggerCompletion.delayed(this.__timeout, this, ev, false);
		} else if (!is_ie) {
			if (!this.__noTab && ev.keyCode == DlKeyboard.TAB && !_menuVisible() && !this.isEmpty()) {
				__triggerCompletion.call(this, ev, true);
                                ev.domStop = true;
                                DlException.stopEventBubbling();
			} else {
				return handleMenuKey.call(this, ev);
                        }
		}
                return D.BASE._handle_focusKeys.call(this, ev);
	};

	function onBlur() {
		this.cancelCompletion();
	};

	// helper completion handlers

	P.completeFromWords = function(words, args) {
		return D.completeFromWords.call(D, this, words, args);
	};

	D.completeFromWords = function(entry, words, args) {
		if (args == null)
			args = {};
		if (args.sep == null)
			args.sep = /\s+/g;
		return function(range) {
			var comp = [], val = entry.getValue(), pos = val.lastIndexOfRegexp(args.sep, range.start);
			val = val.substring(pos, range.start);
			if (val) {
				for (var i = 0; i < words.length; ++i)
					if (words[i].indexOf(val) == 0)
						comp.push({ label    : words[i],
							    noselect : args.noselect,
							    after    : args.addSep,
							    start    : pos });
			}
			if (comp.length > 0)
				entry.completionReady(comp);
			else
				entry.cancelCompletion();
		};
	};

});

DEFINE_CLASS("DlCompletionPopup", DlPopup, function(D, P) {
        D.FIXARGS = function(args) {
                args.zIndex = 1000;
                args.focusable = false;
        };
});
