// @require button.js

DEFINE_CLASS("DlCheckbox", DlAbstractButton, function(D, P) {

        D.DEFAULT_ARGS = {
	        _classes : [ "classes", { active    : "DlCheckbox-active",
				          hover     : "DlCheckbox-hover",
				          checked   : "DlCheckbox-1",
				          unchecked : "DlCheckbox-0",
				          empty     : "DlCheckbox-empty",
				          disabled  : "DlCheckbox-disabled"
				        } ]
        };

        D.FIXARGS = function(args) {
                args.type = DlButton.TYPE.TWOSTATE;
        };

});
