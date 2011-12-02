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

// @require jslib.js

DEFINE_CLASS("DlException", null, function(D, P) {

        D.CONSTRUCT = function(message, code) {
	        this.error = this.constructor.name;
	        if (!message)
		        message = "*** no error message given ***";
	        this.message = this.constructor.name + ": " + message;
	        if (code != null)
		        this.code = code;
        };

        P.toString = function() {
	        var str = this.message;
	        if (this.code)
		        str += " / code: " + this.code;
	        return str;
        };

}).stopEventBubbling = function() { throw new DlExStopEventBubbling; };

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
