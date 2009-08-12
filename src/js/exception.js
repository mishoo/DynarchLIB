// @require jslib.js

function DlException(message, code) {
	this.error = this.constructor.name;
	if (!message)
		message = "*** no error message given ***";
	this.message = this.constructor.name + ": " + message;
	if (code != null)
		this.code = code;
};

DlException.prototype.toString = function() {
	var str = this.message;
	if (this.code)
		str += " / code: " + this.code;
	return str;
};

function DEFINE_EXCEPTION(className, base) {
        return DEFINE_CLASS(className, base || DlException);
};

DEFINE_EXCEPTION("DlExInvalidOperation");
DEFINE_EXCEPTION("DlExAbstractBaseClass");
DEFINE_EXCEPTION("DlExStopEventProcessing");
DEFINE_EXCEPTION("DlExStopFrameEvent");
DEFINE_EXCEPTION("DlExStopEventBubbling");
DEFINE_EXCEPTION("DlDataException");
DEFINE_EXCEPTION("DlSecurityException");

DlException.stopEventBubbling = function() { throw new DlExStopEventBubbling; };
