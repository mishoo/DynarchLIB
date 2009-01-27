// @require jslib.js

var DlElementCache = {
	get : function(tag) {
		return this[tag].cloneNode(true);
	}
};

(function(){

	eval(DynarchDomUtils.importCommonVars());

        var C = DlElementCache;

        // generic <tbody><tr><td>
        (function(){
	        var TBODY_RC = document.createDocumentFragment();
	        CE("td", null, null,
	           CE("tr", null, null,
	              CE("tbody", null, null, TBODY_RC)));
	        C.TBODY_RC = TBODY_RC;
        })();

        // dialog shadows (might be useful for other widgets as well)
        (function(){
	        var SHADOWS = document.createDocumentFragment();
	        CE("div", null, { className: "Shadow Shadow-TL" }, SHADOWS);
	        CE("div", null, { className: "Shadow Shadow-T" }, SHADOWS);
	        CE("div", null, { className: "Shadow Shadow-TR" }, SHADOWS);
	        CE("div", null, { className: "Shadow Shadow-L" }, SHADOWS);
	        CE("div", null, { className: "Shadow Shadow-R" }, SHADOWS);
	        CE("div", null, { className: "Shadow Shadow-BL" }, SHADOWS);
	        CE("div", null, { className: "Shadow Shadow-B" }, SHADOWS);
	        CE("div", null, { className: "Shadow Shadow-BR" }, SHADOWS);
	        C.SHADOWS = SHADOWS;
        })();

        // calendar
        (function(){
	        var STATIC_ROW = CE("tr");
                var STATIC_CELL = CE("td", null, null, STATIC_ROW);
	        (6).times(function(){
		        STATIC_ROW.appendChild(STATIC_CELL.cloneNode(true));
	        });
	        C.CAL_HEAD = CE("thead");
	        C.CAL_HEAD.appendChild(STATIC_ROW.cloneNode(true));
	        var STATIC_BODY = C.CAL_BODY = CE("tbody");
	        (6).times(function(){
		        STATIC_BODY.appendChild(STATIC_ROW.cloneNode(true));
	        });
        })();

        // dragbar
        C.DRAGGING_LINE = CE("div", null, { className: "DlResizeBar-DraggingLine" });

        DlEvent.atUnload(function(){
                // cleanup
                var trash = DynarchDomUtils.trash();
                for (var i in C) {
                        var el = C[i];
                        if (!(el instanceof Function)) {
                                trash.appendChild(C[i]);
                                delete C[i];
                                el = C[i] = null;
                        }
                }
                C = DynarchDomUtils.CE_CACHE; // cleanup the createElement cache as well.
                for (var i in C) {
                        var el = C[i];
                        if (el !== trash) {
                                trash.appendChild(C[i]);
                                delete C[i];
                                el = C[i] = null;
                        }
                }
                trash.innerHTML = "";
                if (is_ie)
                        trash.outerHTML = "";
                delete DynarchDomUtils.CE_CACHE["_trash"];
                DynarchDomUtils.CE_CACHE._trash = null;
                C = null;
        });

})();
