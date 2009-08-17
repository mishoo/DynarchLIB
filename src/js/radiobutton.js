// @require checkbox.js

DEFINE_CLASS("DlRadioButton", DlCheckbox, function(D, P) {

        D.FIXARGS = function(args) {
                args.alwaysCheck = true;
        };

        D.DEFAULT_ARGS = {
	        _groupId   : [ "group"     , 0 ],
	        _classes   : [ "classes"   , {
			active    : "DlRadioButton-active",
			hover     : "DlRadioButton-hover",
			checked   : "DlRadioButton-1",
			unchecked : "DlRadioButton-0",
			empty     : "DlRadioButton-empty",
			disabled  : "DlRadioButton-disabled"
		} ]
        };

        P.FINISH_OBJECT_DEF = function() {
                D.BASE.FINISH_OBJECT_DEF.call(this);
                this._className.remove("DlCheckbox");
        };

});
