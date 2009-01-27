(function(){

        var CTORS = {}, OBJECTS = {};

        window.DlSingleton = {
                get : function(type, noCreate) {
		        return OBJECTS[type] || !noCreate && (OBJECTS[type] = new CTORS[type]());
	        },
	        register : function(type, ctor, globalize) {
		        CTORS[type] = ctor;
                        if (globalize)
                                window[type] = this.get.$C(type);
	        }
        };

})();
