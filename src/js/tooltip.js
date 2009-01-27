// @require popup.js

DlTooltip.inherits(DlPopup);
function DlTooltip(args) {
	if (args) {
		args.zIndex = 2000;
                args.focusable = false;
		DlPopup.call(this, args);
		this._mouseDiff = { x: 8, y: 12 };
	}
};
