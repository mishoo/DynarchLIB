// @require buttonmenu.js

(function() {

	var BASE = DlButtonColorPicker.inherits(DlButtonMenu);
	function DlButtonColorPicker(args) {
		if (args) {
			D.setDefaults(this, args);
			DlButtonMenu.call(this, args);
			this._events_cp = {
				onSelect     : onSelect.$(null, this),
				onHueChange  : onHueChange.$(null, this),
				onHover      : onHover.$(null, this),
				onHoverOut   : onLeave.$(null, this)
			};
			this._updateValues();
		}
	};

	eval(Dynarch.EXPORT("DlButtonColorPicker", true));

	D.DEFAULT_ARGS = {
		rgb   : [ "rgb", null ],
		hsv   : [ "hsv", null ],
		color : [ "color", null ]
	};

	function onSelect(btn, rgb, hsv, color, brightness) {
		var div = btn.getColorElement();
		div.style.backgroundColor = color;
		btn.hsv = Dynarch.makeArray(hsv);
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
		BASE._createElement.call(this);
		var el = this.getButton().setContent([ "<table cellspacing='0' cellpadding='0'><tr><td>",
						       "<div unselectable='on' class='ColorPart'>&nbsp;</div>",
						       "</td><td></td></tr></table>" ].join(""));
		this.setLabel(this.label);
	};

	P.setLabel = function(label) {
		var div = this.getLabelElement();
		div.innerHTML = label || "";
		CC(div, label, "Label", "EmptyLabel");
	};

	P.getColorElement = function() {
		return this.getButton().getContentElement().firstChild.rows[0].cells[0].firstChild;
	};

	P.getLabelElement = function() {
		return this.getButton().getContentElement().firstChild.rows[0].cells[1];
	};

	P._setListeners = function() {
		BASE._setListeners.call(this);
		this.addEventListener({ onPopup : _popupCP,
					onHide  : _hideCP
				      });
	};

})();
