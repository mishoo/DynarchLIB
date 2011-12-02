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

// @require buttonmenu.js
// @require radiobutton.js

DEFINE_CLASS("DlRadioSelect", DlButtonMenu, function(D, P){

	D.DEFAULT_ARGS = {
		_options    : [ "options"   , [] ],
		_value	    : [ "value"	    , null ],
		_connected  : [ "connected" , true ]
	};

        D.DEFAULT_EVENTS = [ "onChange" ];

	D.CONSTRUCT = function() {
                this._radioGroup = DlRadioGroup.get();
		if (this._options.length)
			this.setOptions(this._options);
		this.value(this._value, true);
                this.addEventListener("onDestroy", function(){
                        this._radioGroup.reset();
                });
	};

	// TODO: get rid of the value() function, use set* and get* methods

	P.value = function(value, force, nocalls) {
		var oldval = this._value;
		if (force || typeof value != "undefined" && value !== oldval) {
			this._value = value;
			this._updateLabel();
			if (!nocalls)
				this.applyHooks("onChange", [ oldval, value ]);
		}
		return oldval;
	};

	P.getValue = function() { return this.value(); };

	P.setValue = P.value;

	function radioGroup_onChange(cb) {
		this.value(cb.userData);
		DlPopup.clearAllPopups();
		cb._onMouseLeave();
	};

	P._updateLabel = function() {
		var label = null, a = this._options, i, o;
		for (i = a.length; --i >= 0;) {
			o = a[i];
			if (o == null)
				continue;
			if (this._value == o.value) {
				this.getButton().label(o.label);
				o.widget.checked(true, true);
			} else {
                                o.widget.checked(false, true);
                        }
		}
	};

	P.setOptions = function(options) {
                var g = this._radioGroup, menu, args;
		g.reset();
		g.addEventListener("onChange", radioGroup_onChange.$(this));
		menu = new DlVMenu({ className: "DlSelect-menu" });
		args = {
			parent    : menu,
			group     : g,
			noCapture : true
		};
		options.foreach(function(o) {
			if (o == null)
				menu.addSeparator();
			else {
				args.label = o.label;
				args.data = args.value = o.value;
                                args.className = o.className;
				var r = o.widget = new DlRadioButton(args);
				// XXX: this causes problems, we should find something else.
                                // r.connectEvents("onMouseUp", "onClick");
			}
		}, this);

		var el = menu.getElement();
		el.style.position = "absolute";
		menu.zIndex(-100);
		document.body.appendChild(el);
		var width = menu.getOuterSize().x;
		document.body.removeChild(el);
                menu.zIndex("");
		el.style.position = "";

		(function() {
			this.getButton().setOuterSize({ x: width - this.getArrow().getOuterSize().x });
		}).$(this).delayed(10);

		this.setMenu(menu);
		this._options = options;
	};

	P.addOption = function(opt, index) {
                if (index == null)
                        index = this._options.length;
		var item = opt.widget = new DlRadioButton({
                        parent     : this._menu,
			group      : this._radioGroup,
			noCapture  : true,
			label      : opt.label,
			data       : opt.value,
                        value      : opt.value,
                        className  : opt.className
		});
                // XXX: this causes problems, we should find something else.
		// item.connectEvents("onMouseUp", "onClick");
                this._options.splice(index, 0, opt);
		return item;
	};

});
