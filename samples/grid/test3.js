function test3() {

        var dialog = new DlDialog({ title: "Grid sample", resizable: true, quitBtn: "destroy" });

        var data = [
                new DlRecord({ data: { id: "john" , first_name: "John" , last_name: "Doe", phone: "555-6789", employer: "Nowhere" }}),
                new DlRecord({ data: { id: "foo"  , first_name: "Foo"  , last_name: "Bar", phone: "123-4567", employer: "Somewhere" }}),
                new DlRecord({ data: { id: "dave" , first_name: "David", last_name: "Beckham", phone: "n/a", employer: "Real Madrid" }})
        ];

        var cache = new DlRecordCache({ data: data });

        var columns = [
                { id: "first_name" , label: "First Name" , width: 100 },
                { id: "last_name"  , label: "Last Name"  , width: 100 },
                { id: "phone"      , label: "Phone"      , width: 150 },
                { id: "employer"   , label: "Employer"   , width: 150, visible: false }
        ];

        // use a layout this time
        var layout = new DlLayout({ parent: dialog });

        var output = new DlContainer({ scroll: true });

        var sel = new DlSelectionModel({});

        var grid = new DlDataGrid({ cols: columns, data: cache, fillParent: true, selection: sel });
        grid.resetIDS([ "john", "foo", "dave" ]);
        grid.displayPage(0);

        layout.packWidget(grid, { pos: "top", fill: "50%" });
        layout.packWidget(output, { pos: "bottom", fill: "*" });

        sel.addEventListener([ "onChange", "onReset" ], function() {
                var array = sel.getArray(); // array of selected IDs
                var hash = sel.get();       // hash of selected IDs
                var html = [];
                if (array.length == 0)
                        html.push("None selected");
                else {
                        // some nice wizardry to quickly retrieve the last name;
                        // it's based on these methods:
                        //    cache.get(id) -- returns the record with that ID
                        //    record.get(propName) -- returns the value of that property
                        // chaining some map calls transforms the array of Id-s into array of last_name-s
                        html.push("Selected: " + array.map(cache.get, cache).map("get", "last_name"));
                }
                if (hash["john"]) {
                        html.push("John is selected");
                }
                output.setContent(html.join("<br />"));
        });

        dialog.setSize({ x: 600, y: 400 });
        dialog.show(true);
}
