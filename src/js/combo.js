// @require completionentry.js

(function(){

        DlComboBox.inherits(DlCompletionEntry);
        function DlComboBox(args) {
                if (args) {
                        D.setDefaults(this, args);
                        DlCompletionEntry.call(this, args);
                }
        };
        eval(Dynarch.EXPORT("DlComboBox", true));

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
                var td = CE("td", null, null, this.getElement().rows[0]);
                (this._btn = new DlWidget({ parent: this, className: "DlComboBox-dropDownBtn", appendArgs: td }))
                .addEventListener("onMouseEnter onMouseLeave onMouseDown".qw(), btnEvent.$(null, this));
                this.addEventListener("onCompletion", this.doCompletion);
        };

        P._on_menuHide = function() {
                D.BASE._on_menuHide.call(this);
                this._btn.delClass("DlComboBox-dropDownBtn-active");
        };

        P.setSize = P.setOuterSize = function(size) {
                var input = this.getInputElement()
                , tpb = DOM.getPaddingAndBorder(this.getElement())
                , ipb = DOM.getPaddingAndBorder(input)
                , sb = this._btn.getSize().x;
                DOM.setOuterSize(input, size.x - tpb.x - ipb.x - sb + 2); // XXX: fuzz factor = 2
	};

        function btnEvent(self, ev) {
                switch (ev.dl_type) {
                    case "onMouseEnter":
                        this.addClass("DlComboBox-dropDownBtn-hover");
                        break;
                    case "onMouseLeave":
                        this.delClass("DlComboBox-dropDownBtn-hover");
                        break;
                    case "onMouseDown":
                        if (ev.button == 0) {
                                self._forcePopup();
                                DlException.stopEventBubbling();
                        }
                        break;
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

})();
