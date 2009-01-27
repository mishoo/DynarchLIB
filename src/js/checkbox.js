// @require button.js

DlCheckbox.inherits(DlAbstractButton);
function DlCheckbox(args) {
	if (args) {
		args.type = DlButton.TYPE.TWOSTATE;
		DlCheckbox.setDefaults(this, args);
		DlAbstractButton.call(this, args);
	}
};

DlCheckbox.DEFAULT_ARGS = {
	_classes : [ "classes", { active    : "DlCheckbox-active",
				  hover     : "DlCheckbox-hover",
				  checked   : "DlCheckbox-1",
				  unchecked : "DlCheckbox-0",
				  empty     : "DlCheckbox-empty",
				  disabled  : "DlCheckbox-disabled"
				} ]
};
