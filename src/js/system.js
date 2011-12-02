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

// @require eventproxy.js
// @require singleton.js

/*DESCRIPTION

This object is a "singleton" -- only one of this type can be
instantiated at a time.  Singletons are used through DlSingleton
interface.  In order to retrieve the DlSystem object you call:

  var system = DlSingleton.get("System");

This will return the object instance (creates it if it wasn't already
there).

The purpose of DlSystem is, for now, to centralize a set of event
handlers.  For example, you might want to display a "please wait..."
message each time an XMLHttpRequest is called.  To do this you could
say:

  var system = DlSingleton.get("System");

  system.addEventListener("on-rpc-start", function() {
    // display your "please wait" text here
  });

  system.addEventListener("on-rpc-stop", function() {
    // hide the message here.
  });

This would work globally for any XMLHttpRequest created through our
〈DlRPC〉 object--since it takes care to call the appropriate event
handlers in DlSystem.

DESCRIPTION*/

DEFINE_SINGLETON("DlSystem", DlEventProxy, function(D, P) {

        D.DEFAULT_EVENTS = [
                "on-dialog-create",
		"on-dialog-show",
		"on-dialog-hide",
		"on-dialog-minimize",
		"on-dialog-restore",
		"on-rpc-start",
		"on-rpc-stop",
		"on-rpc-timeout"
	];

});
