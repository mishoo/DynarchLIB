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

DlException.defineException = function(className, base) {
	if (base == null)
		base = "DlException";
	// the power of eval: write less code.
	return eval([ "window.", className, "=function ", className, "(message){",
		      base, ".call(this, message);};",
		      className, ".inherits(", base, ");" ].join(""));
};

DlException.defineException("DlExInvalidOperation");
DlException.defineException("DlExAbstractBaseClass");
DlException.defineException("DlExStopEventProcessing");
DlException.defineException("DlExStopFrameEvent");
DlException.defineException("DlExStopEventBubbling");
DlException.defineException("DlDataException");
DlException.defineException("DlSecurityException");

DlException.stopEventBubbling   = function() { throw new DlExStopEventBubbling; };
