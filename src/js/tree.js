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

// @require container.js

DEFINE_CLASS("DlTree", DlContainer, function(D, P, DOM) {

        D.CONSTRUCT = function() {
                this.__treeItems = [];
        };

	P.getItem = function(idx) {
		return this.__treeItems[idx];
	};

        P.getItems = function() {
                return this.__treeItems;
        };

	P.appendWidget = function(w, pos) {
		if (w instanceof DlTreeItem &&
		    w.parent === this &&
		    pos > w.getIndex()) {
			--pos;
		}
		D.BASE.appendWidget.call(this, w, pos);
	};

	P.removeWidget = function(w) {
		D.BASE.removeWidget.call(this, w);
		if (w instanceof DlTreeItem) {
			var i = this.__treeItems.find(w);
			this.__treeItems.splice(i, 1);
			var l = this.__treeItems.length;
			if (l == 0) {
				if (this.parent instanceof DlTreeItem)
					this.destroy();
			} else {
				if (i == 0)
					this.__treeItems[i]._setFirstLast(true, null);
				if (i == l)
					this.__treeItems[i-1]._setFirstLast(null, true);
			}
		}
	};

	P._appendWidgetElement = function(w, pos) {
		var a = this.__treeItems;
		var parent = this.getContentElement();
		if (pos == null) {
			if (w instanceof DlTreeItem) {
				var last = a.peek();
				last
					? last._setFirstLast(null, false)
					: w._setFirstLast(true, null);
				a.push(w);
				w._setFirstLast(null, true);
			}
			parent.appendChild(w.getElement());
		} else {
			if (pos == a.length)
				return this._appendWidgetElement(w, null);
			var prev = a[pos];
			if (prev)
				prev._setFirstLast(false, pos == a.length - 1);
			w._setFirstLast(pos == 0, false);
			a.splice(pos, 0, w);
			parent.insertBefore(w.getElement(),
					    parent.childNodes[pos]);
		}
	};

	P.addSeparator = function(cls) {
		DOM.createElement("div", null,
		                  { className: cls || "DlTree-separator",
		                    innerHTML: "&nbsp;" },
		                  this.getElement());
	};

});

DEFINE_CLASS("DlTreeItem", DlContainer, function(D, P, DOM) {

        var CE = DOM.createElement,
            AC = DOM.addClass,
            DC = DOM.delClass,
            CC = DOM.condClass;

        D.CONSTRUCT = function() {
		this.setIconClass(this.__iconClass);
		this.__iconClass = null;
        };

	D.DEFAULT_ARGS = {
		__label     : [ "label"		 , null ],
		__iconClass : [ "iconClass"	 , null ],
		__itemClass : [ "itemClassName"	 , null ]
	};

	D.DEFAULT_EVENTS = [ "onExpand", "onCollapse", "onLabelMouseDown" ];

        var HTML = ( "<div class='DlTreeItem-div'>" +
                     "<table cellspacing='0' cellpadding='0' class='DlTreeItem-Table'>" +
                     "<tbody><tr>" +
                     "<td class='DlTreeItem-Expander'><div class='DlTree-IconWidth'>&nbsp;</div></td>" +
                     "<td></td>" +
                     "<td class='DlTreeItem-Label'></td>" +
                     "</tr></tbody></table>" +
                     "</div>" +
                     "<div class='DlTreeItem-Subtree'></div>" );

	function getTD(ev) {
		var el = ev.target;
		try {
			while (el && el.tagName.toLowerCase() != "td")
				el = el.parentNode;
		} catch(ex) {
			el = null;
		}
		return el;
	};

	function onClick(ev) {
		var td = getTD(ev);
		if (td && /DlTreeItem-(Expander|Icon)/.test(td.className)) {
			this.toggle();
			throw new DlExStopEventBubbling;
		}
	};

	function onDestroy() {
		var div = this.getSubtreeDiv();
                if (!window.DL_CLOSING)
                        DOM.trash(div);
                DOM.removeEvent(this.getDivElement(), "mousedown", this.__onLabelMouseDown);
	};

	P._setFirstLast = function(isFirst, isLast) {
		if (isFirst != null) {
			this.condClass(isFirst, "DlTreeItem-First");
			CC(this.getTableElement(), isFirst, "DlTreeItem-First");
		}
		if (isLast != null) {
			this.condClass(isLast, "DlTreeItem-Last");
			CC(this.getTableElement(), isLast, "DlTreeItem-Last");
		}
	};

	P._setListeners = function() {
		D.BASE._setListeners.call(this);
		this.addEventListener({ onMouseDown : onClick,
					onDestroy   : onDestroy
                                      });
	};

	P._createElement = function() {
		D.BASE._createElement.call(this);
		this.getElement().innerHTML = HTML;
		if (this.__label)
			this.setContent(this.__label);
		this.setUnselectable();

		this.__onLabelMouseDown = this._onLabelMouseDown.$(this);
		DOM.addEvent(this.getDivElement(), "mousedown", this.__onLabelMouseDown);
		if (this.__itemClass)
			AC(this.getDivElement(), this.__itemClass);
	};

	P._onLabelMouseDown = function(ev) {
		this.callHooks("onLabelMouseDown");
	};

	P.getDivElement = function() {
		return this.getElement().firstChild;
	};

	P.getTableElement = function() {
		return this.getElement().firstChild.firstChild;
	};

	P.getExpanderElement = function() {
		return this.getTableElement().rows[0].cells[0];
	};

	P.getIconElement = function() {
		return this.getTableElement().rows[0].cells[1];
	};

	P.getContentElement = function() {
		return this.getTableElement().rows[0].cells[2];
	};

	P.getSubtreeDiv = function() {
		return this.getElement().childNodes[1];
	};

	P.getSubtreeWidget = function() {
		return this._subtree;
	};

	P.getIndex = function() {
		return this.parent.__treeItems.find(this);
	};

	P.getParentItem = function() {
		return this.parent.parent;
	};

	// automagically creates a subtree IF no subtree widget exists
	// AND no _tree exists (such as a function ref.)
	P.addSubItem = function(item, pos) {
		var tree = this.getSubtreeWidget();
		if (!tree && !this._tree) {
			tree = new DlTree({});
			this.setTree(tree);
			this.expand();
		}
		tree.appendWidget(item, pos);
	};

	P.setTree = function(tree, expand, timeout) {
		if (this._tree && (typeof this._tree != "function"))
			this.removeWidget(this._tree);
		this._tree = tree;
		if (tree != null) {
			if (typeof tree != "function") {
				this.appendWidget(tree, true);
			} else if (expand == null)
				expand = false;
			if (expand)
				this.expand(expand);
			else {
				this.getSubtreeDiv().style.display = "none";
				this.updateExpanderState();
			}
		}
		if (timeout == null) {
			this._subtreeNeverExpires = true;
			this._subtreeExpires = null;
		} else {
			this._subtreeNeverExpires = false;
			this._subtreeExpires = new Date().getTime() + timeout;
		}
		this.condClass(tree, "DlTreeItem-hasSubtree");
		this.updateExpanderState();
	};

	P.isExpanded = function() {
		return this.getSubtreeDiv().style.display !== "none";
	};

	P.toggle = function() {
		this.expand(!this.isExpanded());
	};

	P.getPath = function() {
		var path = [];
		var item = this.getParentItem();
		while (item instanceof DlTreeItem) {
			path.push(item);
			item = item.getParentItem();
		}
		return path;
	};

	P.expandParents = function(expand) {
		var item = this.getParentItem();
		while (item instanceof DlTreeItem) {
			item.expand(expand);
			item = item.getParentItem();
		}
	};

	// hairy stuff
	P.expand = function(expand, nohooks) {
		if (expand == null)
			expand = true;
		var self = this;
		function cont() {
			self.getSubtreeDiv().style.display = expand ? "block" : "none";
			self.updateExpanderState();
			if (!nohooks)
				self.callHooks(expand ? "onExpand" : "onCollapse");
		};
		function cont2(tree, timeout) {
			var tmp = self._tree;
			if (self._subtree) try {
				self._subtree.destroy();
			} catch(ex) {}
			self._tree = tmp;
			if (timeout == null) {
				self._subtreeNeverExpires = true;
				self._subtreeExpires = null;
			} else {
				self._subtreeNeverExpires = false;
				self._subtreeExpires = new Date().getTime() + timeout;
			}
			self.appendWidget(tree, true);
			cont();
		};
		if (expand !== this.isExpanded()) {
			if (expand && typeof this._tree == "function") {
				if (this._subtree) {
					if (this._subtreeNeverExpires)
						cont();
					else {
						var time = new Date().getTime();
						if (this._subtreeExpires && time <= this._subtreeExpires)
							cont();
						else
							this._tree(cont2, this);
					}
				} else
					this._tree(cont2, this);
			} else
				cont();
		}
	};

	P.setIconClass = function(iconClass) {
		var e2 = this.getIconElement();
		// CC(e2, iconClass != null, this._className.peek() + "-Icon");
                CC(e2, iconClass != null, "DlTreeItem-Icon");
		if (this.iconClass) {
			e2.innerHTML = "";
			DC(e2, this.iconClass);
		}
		if (iconClass) {
			e2.innerHTML = "<div class='DlTree-IconWidth'>&nbsp;</div>";
			AC(e2, iconClass);
		}
		this.iconClass = iconClass;
	};

	P.updateExpanderState = function() {
		var div = this.getExpanderElement().firstChild;
		if (this._tree) {
// 			if (!div) {
// 				div = CE("div", null, { innerHTML: "&nbsp;" },
// 					 this.getExpanderElement());
// 			}
			var expanded = this.isExpanded();
			CC(div, expanded,
			   "DlTreeItem-Arrow-Expanded", "DlTreeItem-Arrow-Collapsed");
			CC(this.getTableElement(), expanded,
			   "DlTreeItem-Table-Expanded", "DlTreeItem-Table-Collapsed");
		} else {
			DC(div, "DlTreeItem-Arrow-Expanded");
			DC(div, "DlTreeItem-Arrow-Collapsed");
			this.delClass("DlTreeItem-hasSubtree");
		}



// else if (div) {
// 			DC(div, "DlTreeItem-Arrow-Expanded");
// 			DC(div, "DlTreeItem-Arrow-Collapsed");
// 			div.parentNode.removeChild(div);
// 			div = this.getTableElement();
// 			DC(div, "DlTreeItem-Table-Expanded");
// 			DC(div, "DlTreeItem-Table-Collapsed");
// 			this.delClass("DlTreeItem-hasSubtree");
// 		}
	};

// 	P.getTree = function() {
// 		if (typeof this._tree == "function") {
// 			this._tree = this._tree();
// 			if (this._tree)
// 				this.appendWidget(this._tree, true);
// 		}
// 		return this._tree;
// 	};

	P._appendWidgetElement = function(w, subtree) {
		var el = w.getElement(), t;
		if (w instanceof DlTreeItem) {
			this.addSubItem(w, subtree);
		} else {
			t = (subtree || w instanceof DlTree) ? this.getSubtreeDiv() : this.getContentElement();
 			if (subtree) {
				this._subtree = w;
				AC(el, "DlTree-withLines");
				this.addClass("DlTreeItem-hasSubtree");
			}
			t.appendChild(el);
		}
	};

	P._removeWidgetElement = function(w) {
		D.BASE._removeWidgetElement.call(this, w);
		if (!this.getSubtreeDiv().firstChild) {
			this._tree = null;
			this._subtree = null;
		}
		this.updateExpanderState();
	};

        P._setFocusedStyle = function(focused) {
                CC(this.getDivElement(), focused, "DlTreeItem-div-focus");
        };

});
