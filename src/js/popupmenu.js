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

// @require popup.js
// @require hbox.js
// @require vbox.js

// WARNING: this is all hairy stuff.  Don't mess with it.

function DlMenuBase() {
	if (this._isMenuBase)
		return;
	this._isMenuBase = true;
	this._items = [];

	var self = this;
	function onNamedItemSelect(name, item, args) {
		var widget = args ? args.widget : null;
		if (!this._noClose)
			DlPopupMenu.clearAll();
		self.applyHooks.delayed(1, self, "onSelect", [ this.name, this, widget ]);
	};

	// whatever container we are in, we patch the appendWidget function
	// (which will presumably used to append items) in order to keep an
	// array of menu items.
	var orig_appendWidget = this.appendWidget;
	this.appendWidget = function(w) {
		if (w instanceof DlMenuItem) {
			this._items.push(w);
			if (w.name != null)
				w.addEventListener("onSelect", onNamedItemSelect);
		}
		orig_appendWidget.apply(this, Array.$(arguments));
	};

	this.getItemByName = function(name) {
		return this._items.grep_first(function(item) {
			return item.name && item.name == name;
		});
	};

	this.getItemById = function(name) {
		return this._items.grep_first(function(item) {
			return item.__itemId && item.__itemId == name;
		});
	};

	if (this instanceof DlHbox) {
		this._popupAlign = {
			prefer: "Br",
			fallX1: "_r",
			fallX2: "_l",
			fallY1: "B_",
			fallY2: "T_"
		};
	} else {
		this._popupAlign = {
			prefer: "bR",
			fallX1: "_R",
			fallX2: "_L",
			fallY1: "b_",
			fallY2: "t_"
		};
	}

 	this._getDlPopup = function() {
		var p = this.getParent(DlPopupMenu), l = 0, ret;
		if (p)
			l = p._level + 1;
		ret = DlPopupMenu.get(l);
		ret.detachPopup();
		if (p) {
			ret.attachToPopup(p);
		}
		return ret;
 	};

// 	this.getLevel = function() {
// 		var lvl = 0;
// 		var m = this;
// 		while (m.parentMenu) {
// 			lvl++;
// 			m = m.parentMenu;
// 		}
// 		return lvl;
// 	};

	this.getToplevelMenu = function() {
		var m = this;
		while (m.parentMenu)
			m = m.parentMenu;
		return m;
	};

// 	var foo = 0;
// 	this.debug = function() {
// 		var txt = [ foo++ ];
// 		var m = this;
// 		while (m) {
// 			txt.unshift(m.id);
// 			m = m.parentMenu;
// 		}
// 		window.status = txt.join(" => ");
// 	};
};

DEFINE_CLASS("DlPopupMenu", DlPopup, function(D, P) {

        D.CONSTRUCT = function() {
                this._mouseDiff = { x: 2, y: 1 }; // for context menus
        };

	function onMouseEnter() {
		this.cancel();
		var args = this.args;
	};

// 	function onMouseLeave() {
// 		var args = this.args;
// 	};

	D.onBeforePopup = function(args) {
		if (!args.isContext) {
			args.item.currentPopup = this;
			args.item._popupVisible = true;
			args.menu._popupVisible = true;
			args.item.activateSubmenu(true);
		} else {
			//args.widget.currentPopup = this;
			if (args.widget.activateSubmenu)
				args.widget.activateSubmenu(true);
		}
		var content = args.content;
		if (content instanceof Function)
			args.content = content = content.call(this);
		content.parentMenu = args.isContext
			? args.widget
			: args.menu;
		if (content instanceof DlWidget && content.hasHooks("onPopup"))
			content.applyHooks("onPopup", [ args ]);
	};

	D.onHide = function(args, callback) {
		if (!args.isContext) {
			args.item.activateSubmenu(false);
			args.item.currentPopup = null;
			args.item._popupVisible = false;
			args.menu._popupVisible = false;
                        var content = args.content;
                        if (content instanceof DlWidget && content.hasHooks("onHide"))
                                content.applyHooks("onHide", [ args ]);
			content.parentMenu = null;
		} else {
			//args.widget.currentPopup = null;
			if (args.widget.activateSubmenu)
				args.widget.activateSubmenu(false);
		}
		if (callback)
			callback.call(this, args);
	};

	P.popup = function(args) {
		if (!args.onBeforePopup)
			args.onBeforePopup = D.onBeforePopup;
		if (!args.onHide)
			args.onHide = D.onHide;
 		else
 			args.onHide = D.onHide.$(this, args, args.onHide);
		D.BASE.popup.call(this, args);
	};

	P._setListeners = function() {
		D.BASE._setListeners.call(this);
		// tricky, note that we add 2 listeners for onHide
		this.addEventListener({ onMouseEnter  : onMouseEnter
//					onMouseLeave  : onMouseLeave
// 					onHide        : onHide
// 					onBeforePopup : onBeforePopup
				      });
	};

	// this should align a submenu to have the first item (or
	// last, depending on how it's positioned) aligned with its
	// parent item.
	P.correctPos = function(p) {
		var args = this.args;
		try {
			if (!args.isContext && !args.scrollVisible) {
 				var m1 = args.menu;
 				if (m1 && (m1 instanceof DlVMenu)) {
// 					var diff = args.content._widgets[0].getPos().y -
// 						args.content.parent.getPos().y;

					var diff = args.content._widgets[0].getPos().y -
						args.content.parent.getElement().offsetTop;

					// FIXME: just in case we screw up big, let's drop the whole idea.
					if (Math.abs(diff) < 50) {
						if (args.fallY)
							p.y += diff;
						else
							p.y -= diff;
					}
 				}
			}
		} catch(ex) {};
	};

});

/* DlHMenu */

DEFINE_CLASS("DlHMenu", DlHbox, function(D, P) {

        D.CONSTRUCT = DlMenuBase;

        D.DEFAULT_EVENTS = [ "onSelect", "onPopup" ];

});

/* DlVMenu */

DEFINE_CLASS("DlVMenu", DlVbox, function(D, P) {

        D.CONSTRUCT = DlMenuBase;

        D.DEFAULT_EVENTS = [ "onSelect", "onPopup" ];

});

DEFINE_CLASS("DlMenuItem", DlContainer, function(D, P, DOM) {

        D.CONSTRUCT = function() {
                if (!this.parentMenu)
			this.parentMenu = this.parent;
        };

        D.DEFAULT_EVENTS = [ "onSelect" ];

	D.DEFAULT_ARGS = {
		label      : [ "label"	   , "DlMenuItem" ],
		_iconClass : [ "iconClass" , null ],
		_noClose   : [ "noClose"   , false ],
		parentMenu : [ "menu"	   , null ],
		name       : [ "name"	   , null ],
		__itemId   : [ "id"        , null ]
	};

	P._inBaseMenu = function() {
		return !this.parentMenu.parentMenu;
	};

	P._createElement = function() {
		D.BASE._createElement.call(this);
		var el = this.getElement();
		el.innerHTML = '<div class="div1"><div class="div2"></div></div>';
		this.setIconClass(this._iconClass);
		this._iconClass = null;
		this.setUnselectable();
		if (this.label)
			this.setContent(this.label);
	};

	P.getContentElement = function() {
		return this.getElement().firstChild.firstChild;
	};

	P._getDlPopup = function() {
		return this.parentMenu._getDlPopup();
	};

	function onMouseEnter() {
                this.scrollIntoView();
		this.addClass("DlMenuItem-hover", "DlMenuItem-active");
		var base = this._inBaseMenu();
 		if (!base || this.parentMenu._popupVisible) {
			if (this._menu) {
				this._popupMenu(base ? 0 : 250);
			} else if (base) {
				this._getDlPopup().hide(100);
			}
		}
	};

	function onMouseLeave() {
		this.delClass("DlMenuItem-hover");
		this.delClass("DlMenuItem-active");
		var base = this._inBaseMenu();
		if (!base)
			this._getDlPopup().hide(100);
	};

	function onMouseUp() {
		this.delClass("DlMenuItem-active");
		if (this.hasHooks("onSelect")) {
			var args = DlPopupMenu.get(0).args;
			if (!this._noClose)
				DlPopupMenu.clearAll();
			this.applyHooks.delayed(1, this, "onSelect", [ this.name, this, args ]);
		}
	};

	function onMouseDown() {
		this.addClass("DlMenuItem-active");
		this._popupMenu(0);
		DlException.stopEventBubbling();
	};

	function onDestroy() {
		if (this._menu instanceof DlWidget) {
			this._menu.destroy();
			this._menu = null;
		}
	};

	P._popupMenu = function(timeout) {
		if (this._menu && !this._popupVisible) {
			var pm = this.parentMenu;
			var p = this._getDlPopup();
			if (p.visible)
				p.hide();
			p.popup({ timeout	 : timeout,
				  content	 : this.getMenu(),
				  anchor	 : this.getElement(),
				  align		 : pm._popupAlign,
				  item		 : this,
				  menu           : this.parentMenu,
				  onPopup        : this._onPopup,
				  onHide         : this._onHide
				});
// 		} else if (!this._menu) {
// 			this._getDlPopup().hide(100);
		}
	};

	P._setListeners = function() {
		D.BASE._setListeners.call(this);
		this.addEventListener({ onMouseEnter  : onMouseEnter,
					onMouseLeave  : onMouseLeave,
					onMouseDown   : onMouseDown,
					onMouseUp     : onMouseUp,
					onDestroy     : onDestroy
				      });
	};

	P.getMenu = function() {
//		var menu = this._menu;
// 		if (typeof menu == "function")
// 			menu = menu();
//		return menu;
		return this._menu;
	};

	P.setMenu = function(menu, onPopup, onHide) {
		if (this._menu instanceof DlWidget)
			this._menu.destroy();
		if (menu instanceof DlWidget)
			menu.ref();
		this._menu = menu;
		this._onPopup = onPopup;
		this._onHide = onHide;
		DOM.condClass(this.getElement().firstChild, menu, "DlMenuItem-withPopup");
	};

	P.activateSubmenu = function(act) {
		this.condClass(act, "DlMenuItem-popped");
		//this.condClass(act, "DlMenuItem-hover");
	};

});
