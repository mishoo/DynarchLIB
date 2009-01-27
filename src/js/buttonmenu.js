// @require hbox.js
// @require button.js
// @require popupmenu.js

(function() {

        var BASE = DlButtonMenu.inherits(DlHbox);
        function DlButtonMenu(args) {
                if (args) {
                        D.setDefaults(this, args);
                        DlMenuBase.call(this, args);
                        DlHbox.call(this, args);
                }
        };

        eval(Dynarch.EXPORT("DlButtonMenu"));

        var DEFAULT_EVENTS = [ "onSelect", "onPopup", "onHide", "onClick" ];

        D.DEFAULT_ARGS = {
                label      : [ "label", null ],
                _iconClass : [ "iconClass", null ],
                _shiftMenu : [ "shiftMenu", null ],
                _connected : [ "connected", false ]
        };

        P.ALIGN = {
                prefer: "Br",
                fallX1: "_r",
                fallX2: "_l",
                fallY1: "B_",
                fallY2: "T_"
        };

        P.activateSubmenu = function(activate) {
                this._mainBtn.condClass(activate, "DlButton-1");
                this._menuBtn.condClass(activate, "DlButton-1");
        };

        P._createElement = function() {
                BASE._createElement.call(this);
                this._mainBtn = new DlButton({ parent    : this,
                                               focusable : false,
                                               label     : this.label,
                                               className : "LabelPart",
                                               noCapture : this._connected,
                                               iconClass : this._iconClass });
                this._mainBtn.connectEvents("onClick", this);
                this._menuBtn = new DlButton({ parent    : this,
                                               focusable : false,
                                               label     : "&nbsp;",
                                               className : "MenuArrow",
                                               noCapture : true });
                this._menuBtn.getElement().parentNode.style.width = "3px";
                this._menuBtn.getContentElement().className = "MenuArrow-inner";
                if (this._connected)
                        this._mainBtn.connectEvents("onMouseDown", this._menuBtn);

                // err, why did I need that?
//              if (!is_gecko) {
//                      // Gecko has a stupid bug, oh my dear, oh my dear
//                      this._menuBtn.getElement().style.overflow = "hidden";
//              }
                this._mainBtn.connectEvents([ "onMouseEnter", "onMouseLeave" ], this._menuBtn);
        };

        function popupMenu(ev) {
                if (!this._popupVisible) {
                        var p = this._getContextMenuPopup();
                        p.popup({ timeout   : 0,
                                  content   : this.getMenu(),
                                  align     : this.ALIGN,
                                  anchor    : this.getTableElement(),
                                  isContext : true,
                                  widget    : this,
                                  shift     : this._shiftMenu,
                                  onHide    : this.callHooks.$(this, "onHide")
                                });
                        ev._justFocusedWidget = p;
                        this.callHooks("onPopup");
                }
        };

        P.initDOM = function() {
                this.registerEvents(DEFAULT_EVENTS);
                BASE.initDOM.call(this);
                this._menuBtn.addEventListener("onMouseDown", popupMenu.$(this));
                this.addEventListener("onDestroy", function() {
                        if (this._menu instanceof DlWidget)
                                this._menu.destroy();
                });
        };

        P.getMenu = function() {
                return this._menu;
        };

        P.getButton = function() { return this._mainBtn; };
        P.getArrow = function() { return this._menuBtn; };

        P.setMenu = function(menu) {
                if (this._menu instanceof DlWidget)
                        this._menu.destroy();
                if (menu instanceof DlWidget)
                        menu.ref();
                this._menu = menu;
        };

})();
