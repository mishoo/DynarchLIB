(function(){

        MyCache2.inherits(DlRecordCache);
        function MyCache2(args) {
                DlRecordCache.call(this, args);
        };

        eval(Dynarch.EXPORT("MyCache2"));

        // rec is a DlRecord
        // col is the column (property) ID
        // buf is a String.buffer()
        P.formatHTML = function(rec, col, buf) {
                if (col == "date") {
                        // format date for display
                        buf(rec.get("date").print("%a, %b %e, %Y"));
                } else if (col == "last_name") {
                        // bold last name
                        buf(rec.get("last_name").htmlEscape().bold());
                } else {
                        // usual stuff
                        buf(rec.get(col).toString().htmlEscape());
                }
        };



})();

function test5() {

        var dialog = new DlDialog({ title: "Grid sample", resizable: true, quitBtn: "destroy" });

        var data = [

                new DlRecord({ data: { id: "john" , first_name: "John" ,
                                       last_name: "Doe", phone: "555-6789",
                                       date: new Date(), employer: "Nowhere" }}),

                new DlRecord({ data: { id: "foo"  , first_name: "Foo"  ,
                                       last_name: "Bar", phone: "123-4567",
                                       date: new Date(2000, 2, 1), employer: "Somewhere" }}),

                new DlRecord({ data: { id: "dave" , first_name: "David",
                                       last_name: "Beckham", phone: "n/a",
                                       date: new Date(2007, 7, 26), employer: "Real Madrid" }})
        ];

        var cache = new MyCache2({ data: data });

        var columns = [
                { id: "first_name" , label: "First Name" , width: 100 },
                { id: "last_name"  , label: "Last Name"  , width: 100 },
                { id: "phone"      , label: "Phone"      , width: 150 },
                { id: "date"       , label: "Date"       , width: 150 },
                { id: "employer"   , label: "Employer"   , width: 150, visible: false }
        ];

        var layout = new DlLayout({ parent: dialog });

        var sel = new DlSelectionModel({});

        var grid = new DlDataGrid({ cols: columns, data: cache, fillParent: true, selection: sel });
        grid.resetIDS(data.map("id"));
        grid.displayPage(0);

        layout.packWidget(grid, { pos: "top", fill: "*" });

        dialog.setSize({ x: 600, y: 400 });
        dialog.show(true);
}
