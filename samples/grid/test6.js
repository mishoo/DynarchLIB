(function(){

        MyRecord.inherits(DlRecord);
        function MyRecord(args) {
                DlRecord.call(this, args);
        };

        eval(Dynarch.EXPORT("MyRecord"));

        P.get = function(col) {

                if (this._loading && col != "id")  // "fake" record?
                        return "...";              // show that we're loading it

                return D.BASE.get.call(this, col); // cached record, call superclass
        };

})();

(function(){

        MyCache.inherits(DlRecordCache);
        function MyCache(args) {
                DlRecordCache.call(this, args);
        };

        eval(Dynarch.EXPORT("MyCache"));

        P.getRecords = function(ids, callback, obj) {
                var a = [];     // records to be displayed (can contain fake records)

                // create an array of records that are not in the cache
                var uncached = [];
                ids.foreach(function(id){
                        var rec = this.get(id);
                        if (rec) {
                                a.push(rec); // all fine, we have it already
                        } else {
                                rec = new MyRecord({ recordSet : this,         // specify the record set (cache)
                                                     data      : { id: id }}); // it still has a known ID
                                rec._loading = true; // remember that data wasn't loaded yet
                                a.push(rec);         // we still put it into the array, but it's fake
                                uncached.push(rec);  // not cached
                        }
                }, this);

                // now call the given callback!
                callback.call(obj, a);

                // if all the objects were in the cache, then the data is
                // displayed fine already.  IF uncached objects exist, we need
                // to fetch data for them and do some manual tricks to get them
                // displayed.

                if (uncached.length > 0) {
                        // normally you'd request uncached data from server now, using DlRPC or DlSocket;
                        // in this sample, to emulate the time spent, I'm using setTimeout
                        setTimeout(function() {
                                uncached.foreach(function(rec){
                                        delete rec._loading; // remember that it was loaded
                                        // initialize data
                                        rec._data.random = Math.floor(Math.random() * 100000);
                                        this._data[rec.id()] = rec; // cache this record
                                        this.callHooks("onChange", rec); // essential to update the grid
                                }, this);
                        }.$(this), 500); // let's say it takes half a second
                }
        };

})();

function test6() {

        var dialog = new DlDialog({ title: "Grid sample", resizable: true, quitBtn: "destroy" });

        var cache = new MyCache({}); // initially empty cache!

        var columns = [
                { id: "id"     , label: "ID"     , width: 50 }, // let's display the ID too
                { id: "random" , label: "Random" , width: 150 }
        ];

        var grid = new DlDataGrid({ parent: dialog, fillParent: true, cols: columns, data: cache });

        // generate an array of 1000 ids
        var ids = [];
        (1000).times(function(i){
                ids.push(i);
        });

        // Even though our cache is empty, we do initialize the grid with these
        // ID-s.  When it needs to display data, our grid will call
        // cache.getRecords which we implemented above.
        grid.resetIDS(ids);
        grid.displayPage(0);

        dialog.setSize({ x: 600, y: 400 });
        dialog.show(true);
}
