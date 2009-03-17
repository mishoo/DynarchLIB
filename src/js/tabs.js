// @require container.js
// @require button.js
// @require hbox.js

(function(){

	var BASE = DlTabs.inherits(DlContainer);
	function DlTabs(args) {
		if (args) {
			D.setDefaults(this, args);
			DlContainer.call(this, args);
		}
	};

	eval(Dynarch.EXPORT("DlTabs", true));

        var DEFAULT_EVENTS = [ "onChange" ];

	D.DEFAULT_ARGS = {
		_tabPos       : [ "tabPos"        , "top" ]
	};

	function onNotebookChange(tabs, newIndex, oldIndex) {
		var w = newIndex != null ? this._panes[newIndex] : null;
		w && w._tab.checked(true);
		tabs.applyHooks("onChange", [ newIndex, oldIndex ]);
	};

	function onTabChange(btn) {
		if (btn.checked())
			this._tabContent.showPane(btn.userData);
	};

	function onTabClick(ev) {
		this.checked(true);
		throw new DlExStopEventProcessing();
	};

	P.addTab = function(w, title, pos) {
		this._tabContent.appendWidget(w, pos);
		w._tab = new DlButton({ label  : title,
					parent : this._tabBar,
					group  : this._tabGroup,
					type   : DlButton.TYPE.TWOSTATE,
					data   : this._tabContent.length() - 1
				      });
		w._tab.addEventListener("onClick", onTabClick, true);
                w.addEventListener("onDestroy", w._tab.destroy.$(w._tab));
	};

	P.getTabBar = function() { return this._tabBar; };
	P.getNotebook = function() { return this._tabContent; };
	P.getTabButton = function(index) { return this.getNotebook().getPane(index)._tab; };
	P.getTabContent = P.getNotebook;

	P.initDOM = function() {
		BASE.initDOM.call(this);
		this._tabGroup = DlRadioGroup.get(this.id);
		this._tabBar = new DlHbox({ className: "TabBar" });
		this._tabContent = new DlNotebook({ className: "TabContent" });
		switch (this._tabPos) {
		    case "top":
		    case "left":
			this.appendWidget(this._tabBar);
			this.appendWidget(this._tabContent);
			break;
		    case "bottom":
		    case "right":
			this.appendWidget(this._tabContent);
			this.appendWidget(this._tabBar);
			break;
		}
		// CE("div", { clear: "both" }, null, this._tabBar.getElement());
		this.registerEvents(DEFAULT_EVENTS);
		this._tabContent.addEventListener("onChange", onNotebookChange.$(this._tabContent, this));
		this._tabGroup.addEventListener("onChange", onTabChange.$(this));
		AC(this.getElement(), "DlTabs-" + this._tabPos);
	};

	P.setTabPos = function(tabPos) {
		var bar = this._tabBar.getElement();
		var content = this._tabContent.getElement();
		if (bar.parentNode)
			bar.parentNode.removeChild(bar);
		var pos = (tabPos == "top" || tabPos == "left")
			? pos = content
			: null;
		content.parentNode.insertBefore(bar, pos);
		AC(this.getElement(), "DlTabs-" + tabPos, "DlTabs-" + this._tabPos);
		this._tabPos = tabPos;
	};

	P.setTabAlign = function(tabAlign) {
		return this._tabBar.setAlign(tabAlign);
	};

	P.setOuterSize = P.setSize = function(size) {
		BASE.setSize.call(this, size);
		size = this.getInnerSize();
		var bar = this._tabBar.getSize();
		// alert(size.x + "x" + size.y + " - " + bar.x + "x" + bar.y);
		switch (this._tabPos) {
		    case "top":
		    case "bottom":
			size.y -= bar.y;
			break;
		    case "left":
		    case "right":
			size.x -= bar.x;
			break;
		}
		this._tabContent.setSize(size);
	};

	P.showPane = function(index) { return this._tabContent.showPane(index); };
	P.nextPane = function() { return this._tabContent.nextPane(); };
	P.prevPane = function() { return this._tabContent.prevPane(); };
	P.isFirstPane = function() { return this._tabContent.isFirstPane(); };
	P.isLastPane = function() { return this._tabContent.isLastPane(); };
	P.getCurrentPane = function() { return this._tabContent.getCurrentPane(); };
	P.getCurrentPaneIndex = function() { return this._tabContent.getCurrentPaneIndex(); };

        P._handle_focusKeys = function(ev) {
                if (ev.shiftKey) {
                        if (ev.keyCode == DlKeyboard.PAGE_UP) {
                                this.prevPane();
                                this.getCurrentPane()._tab.focus();
                                DlException.stopEventBubbling();
                        } else if (ev.keyCode == DlKeyboard.PAGE_DOWN) {
                                this.nextPane();
                                this.getCurrentPane()._tab.focus();
                                DlException.stopEventBubbling();
                        }
                } else if (ev.keyCode == DlKeyboard.TAB && this._tabBar.focusInside()) {
                        var w = this.getCurrentPane().getFirstFocusWidget();
                        if (w) {
                                w.focus();
                                DlException.stopEventBubbling();
                        }
                }
        };

})();
