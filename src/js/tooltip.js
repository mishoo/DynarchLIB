// @require popup.js

DEFINE_CLASS("DlTooltip", DlPopup, function(D, P) {
        D.FIXARGS = function(args) {
                args.zIndex = 2000;
                args.focusable = false;
                this._mouseDiff = { x: 8, y: 12 };
        };
});
