// @require checkbox.js

DlRadioButton.inherits(DlCheckbox);
function DlRadioButton(args) {
	if (args) {
		args.alwaysCheck = true;
		DlRadioButton.setDefaults(this, args);
		DlCheckbox.call(this, args);
	}
};

DlRadioButton.DEFAULT_ARGS = {
	_groupId   : [ "group"     , 0 ],
	_classes   : [ "classes"   , {
			       active    : "DlRadioButton-active",
			       hover     : "DlRadioButton-hover",
			       checked   : "DlRadioButton-1",
			       unchecked : "DlRadioButton-0",
			       empty     : "DlRadioButton-empty",
			       disabled  : "DlRadioButton-disabled"
		       }
		     ]
};

DlRadioButton.prototype._className.remove("DlCheckbox");
