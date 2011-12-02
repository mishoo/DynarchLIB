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

DEFINE_CLASS("DlButtonColorPicker", DlButtonMenu, function(D, P, DOM) {

	D.CONSTRUCT = function() {
		this._events_cp = {
			onSelect     : onSelect.$(null, this),
			onHueChange  : onHueChange.$(null, this),
			onHover      : onHover.$(null, this),
			onHoverOut   : onLeave.$(null, this)
		};
		this._updateValues();
	};

	D.DEFAULT_ARGS = {
		rgb   : [ "rgb", null ],
		hsv   : [ "hsv", null ],
		color : [ "color", null ]
	};

	function onSelect(btn, rgb, hsv, color, brightness) {
		var div = btn.getColorElement();
		div.style.backgroundColor = color;
		btn.hsv = Array.$(hsv);
		btn._updateValues();
		DlPopup.clearAllPopups();
// 		var dark = DlColor.RGB2color(DlColor.HSV2RGB(DlColor.darker(hsv)));
// 		var lite = DlColor.RGB2color(DlColor.HSV2RGB(DlColor.brighter(hsv)));
// 		div.style.borderTopColor = div.style.borderLeftColor = dark;
// 		div.style.borderBottomColor = div.style.borderRightColor = lite;
		btn.applyHooks("onSelect", [ rgb, hsv, color, brightness ]);
	};

	function onHover(btn, rgb, hsv, color, brightness) {
		btn.getColorElement().style.backgroundColor = color;
	};

	function onHueChange(btn, hue) {
		if (btn.hsv) {
			var hsv = [ hue, btn.hsv[1], btn.hsv[2] ];
			var color = DlColor.RGB2color(DlColor.HSV2RGB(hsv));
			btn.getColorElement().style.backgroundColor = color;
			btn.hsv = hsv;
			btn._updateValues();
		}
	};

	function onLeave(btn) {
		var div = btn.getColorElement();
		div.style.backgroundColor = btn.rgb ? DlColor.RGB2color(btn.rgb) : "";
	};

	P._updateValues = function() {
		if (this.hsv) {
			this.rgb = DlColor.HSV2RGB(this.hsv);
			this.color = DlColor.RGB2color(this.rgb);
		} else if (this.rgb) {
			this.hsv = DlColor.RGB2HSV(this.rgb);
			this.color = DlColor.RGB2color(this.rgb);
		} else if (this.color) {
			this.rgb = DlColor.color2RGB(this.color);
			this.hsv = DlColor.RGB2HSV(this.rgb);
		}
	};

	function _popupCP() {
		this._cp.addEventListener(this._events_cp);
		if (this.hsv)
			this._cp.setHSV(this.hsv);
	};
	function _hideCP() {
		this._cp.removeEventListener(this._events_cp);
	};

	P.setColorPicker = function(cp) {
		this._cp = cp;
		this.setMenu(cp);
		if (this.hsv) {
			cp.setHSV(this.hsv);
			onSelect.call(cp, this, this.rgb, this.hsv,
				      DlColor.RGB2color(this.rgb),
				      DlColor.RGBrightness(this.rgb));
		}
	};

	P._createElement = function() {
		D.BASE._createElement.call(this);
		var el = this.getButton().setContent([
                        "<table cellspacing='0' cellpadding='0'><tr><td>",
			"<div unselectable='on' class='ColorPart'>&nbsp;</div>",
			"</td><td></td></tr></table>"
                ].join(""));
		this.setLabel(this.label);
	};

	P.setLabel = function(label) {
		var div = this.getLabelElement();
		div.innerHTML = label || "";
		DOM.condClass(div, label, "Label", "EmptyLabel");
	};

	P.getColorElement = function() {
		return this.getButton().getContentElement().firstChild.rows[0].cells[0].firstChild;
	};

	P.getLabelElement = function() {
		return this.getButton().getContentElement().firstChild.rows[0].cells[1];
	};

	P._setListeners = function() {
		D.BASE._setListeners.call(this);
		this.addEventListener({
                        onPopup : _popupCP,
			onHide  : _hideCP
		});
	};

});
