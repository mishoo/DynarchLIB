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

(function(){

	DlSystem.inherits(DlEventProxy);
	function DlSystem() {
		DlEventProxy.call(this);
		this.registerEvents(DEFAULT_EVENTS);
	};

        var DEFAULT_EVENTS = [ "on-dialog-create",
			       "on-dialog-show",
			       "on-dialog-hide",
			       "on-dialog-minimize",
			       "on-dialog-restore",

			       "on-rpc-start",
			       "on-rpc-stop",
			       "on-rpc-timeout"
			     ];

	DlSingleton.register("DlSystem", DlSystem, true);

})();
