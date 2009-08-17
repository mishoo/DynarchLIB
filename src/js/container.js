// @require widget.js

DEFINE_CLASS("DlContainer", DlWidget, function(D, P) {

        D.BEFORE_BASE = function() {
                this._widgets = [];
        };

	D.DEFAULT_ARGS = {
		_scrollBars           : [ "scroll"     , false ],
                __noParentKeyBindings : [ "noParentKB" , false ]
	};

	P._createElement = function() {
		D.BASE._createElement.apply(this, arguments);
		if (this._scrollBars)
			this.setStyle("overflow", "auto");
	};

	//	FIXME: do we need this?  causes problems with DlPopup
	//	(since it's frequent to cache the popups' content)

// 	P.setContent = function() {
// 		this.destroyChildWidgets();
// 		D.BASE.setContent.apply(this, Array.$(arguments));
// 	};

	P.appendWidget = function(w) {
		// alert("Appending " + w._objectType + " to " + this._objectType);
		if (w.parent)
			w.parent.removeWidget(w);
		this._widgets.push(w);
		w.parent = this;
                if (!w.__alreadyInDom)
                        this._appendWidgetElement.apply(this, arguments);
                delete w.__alreadyInDom;
	};

	P._appendWidgetElement = function(w, p) {
		var el = w.getElement();
		if (typeof p == "number") {
			var parent = this.getContentElement();
			try {
				p = parent.childNodes[p];
				parent.insertBefore(el, p);
			} catch(ex) {
				parent.appendChild(el);
			}
		} else {
			if (p == null)
				p = this.getContentElement();
			else if (typeof p == "string")
				p = document.getElementById(p);
			if (el.parentNode !== p)
				p.appendChild(el);
		}
	};

	P.removeWidget = function(w) {
		if (w.parent === this) {
			this._removeWidgetElement(w);
			this._widgets.remove(w);
			w.parent = null;
		}
	};

	P._removeWidgetElement = function(w) {
		if (this._widgets.contains(w)) {
			var el = w.getElement();
			if (el.parentNode)
				el.parentNode.removeChild(el);
		}
	};

	P.destroyChildWidgets = function() {
		var a = Array.$(this._widgets);
                for (var i = 0; i < a.length; ++i)
                        if (a[i] instanceof D)
                                a.push.apply(a, a[i]._widgets);
		a.r_foreach(function(w) {
			try {
				w.destroy();
			} catch(ex) {};
		});
		var el = this.getContentElement();
		if (el)
			el.innerHTML = "";
		return el;
	};

	P._setListeners = function() {
		D.BASE._setListeners.call(this);
		this.addEventListener("onDestroy", this.destroyChildWidgets);
		this.addEventListener("onResize", this.__doLayout);
	};

	P.disabled = function(v, force) {
		var isDisabled = D.BASE.disabled.call(this, v, force);
		if (v != null)
			this._widgets.r_foreach(function(w) {
				w.disabled(v, force);
			});
		return isDisabled;
	};

	P.children = function(idx) {
		return idx != null ? this._widgets[idx] : this._widgets;
	};

	P.__doLayout = function() {
		// XXX: this definitely sucks.
		var w = this.children().grep_first(function(w) {
			return w._fillParent;
		});
		if (w)
			w.setSize(this.getInnerSize());
	};

        function getAllFocusableWidgets(sub, all) {
                sub = sub ? Array.$(sub.getElement().getElementsByTagName("*")) : [];
                return Array.$(this.getElement().getElementsByTagName("*"))
                        .grep(all ? "_dynarch_object" : "_dynarch_focusable")
                        .grep(DynarchDomUtils.elementIsVisible)
                        .grep(sub.contains.$(sub).inverse())
                        .map(DlWidget.getFromElement)
                        .grep("enabled")
                        .mergeSort(function(a, b) {
                                return a._tabIndex - b._tabIndex;
                        });
        };

        function getFocusableWidget(w, d) {
                var a = getAllFocusableWidgets.call(this, w);

                // now see where we are and return the next/prev widget.
                var i = a.find(w);
                i = a.rotateIndex(i + d);
                if (i != null)
                        return a[i];
        };

        P.getNextFocusWidget = function(w) {
                return getFocusableWidget.call(this, w, 1);
        };

        P.getPrevFocusWidget = function(w) {
                return getFocusableWidget.call(this, w, -1);
        };

        P.getFirstFocusWidget = function() {
                // FIXME: optimize.
                return this.getNextFocusWidget(null);
        };

        P.getLastFocusWidget = function() {
                // FIXME: optimize.
                return this.getPrevFocusWidget(null);
        };

        P._handleKeybinding = function(ev, w) {
                if (ev.altKey || ev.ctrlKey) {
                        var a = getAllFocusableWidgets.call(this, w, true);
                        a.foreach(function(w) {
                                if (w._check_accessKey(ev)) {
                                        w._handle_accessKey(ev);
                                        ev.domStop = true;
                                        throw new DlExStopEventBubbling;
                                }
                        });
                        if (this.parent && !this.__noParentKeyBindings)
                                this.parent._handleKeybinding(ev, this);
                }
        };

	var HIDDEN;
	D.getHiddenContainer = function() {
		if (!HIDDEN) {
			HIDDEN = new this({ className: "DlContainer-Hidden" });
			document.body.appendChild(HIDDEN.getElement());
		}
		return HIDDEN;
	};

});
