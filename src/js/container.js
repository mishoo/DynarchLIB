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
