// @require completionentry.js

DEFINE_CLASS("DlComboBox", DlCompletionEntry, function(D, P){

        D.DEFAULT_ARGS = {
                _noSelect  : [ "noSelect"  , false  ],
                __smart    : [ "smart"     , false  ],
                __noTab    : [ "noTab"     , true   ],
                _options   : [ "options"   , null   ],
                _sizeToFit : [ "sizeToFit" , true   ],
                _electric  : [ "electric"  , false  ]
        };

        // P.ALIGN = {
	// 	prefer: "Bl",
	// 	fallX1: "_l",
	// 	fallX2: "_L",
	// 	fallY1: "B_",
	// 	fallY2: "T_"
	// };

        P._createElement = function() {
                D.BASE._createElement.apply(this, arguments);
                this._makeButton(null, null, "DlComboBox-dropDownBtn", {
                        hover: "DlComboBox-dropDownBtn-hover"
                }).addEventListener("onMouseDown", btnEvent.$(this));
                this.addEventListener("onCompletion", this.doCompletion);
        };

        P._on_menuHide = function() {
                D.BASE._on_menuHide.call(this);
                this._btn.delClass("DlComboBox-dropDownBtn-active");
        };

        function btnEvent(ev) {
                if (ev.button == 0) {
                        this._forcePopup();
                        DlException.stopEventBubbling();
                }
        };

        P._forcePopup = function() {
                this._btn.addClass("DlComboBox-dropDownBtn-active");
                this.__forced = true;
                this.doCompletion(null);
                this.focus.delayed(0, this);
        };

        P.doCompletion = function(range) {
                var val = "", comp = [];
                if (range) {
                        val = this.getValue().trim().toLowerCase();
                        if (!val)
                                return this.cancelCompletion();
                }
                var a = this._options;
                if (a instanceof Function) {
                        a = a.apply(this, arguments);
                        if (a == null)
                                return;
                }
                a.foreach(function(opt){
                        if (opt.toLowerCase().indexOf(val) == 0) {
                                comp.push({ label      : opt.htmlEscape(),
                                            start      : 0,
                                            completion : opt });
                        }
                });
                if (comp.length > 0)
                        this.completionReady(comp);
                else
                        this.cancelCompletion();
        };

});
