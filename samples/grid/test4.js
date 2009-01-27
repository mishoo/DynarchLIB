function test4() {

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
                { id: "employer"   , label: "Employer"   , width: 150 }
        ];

        // use a layout this time
        var layout = new DlLayout({ parent: dialog });

        var sel = new DlSelectionModel({});

        var grid = new DlDataGrid({ cols: columns, data: cache, fillParent: true, selection: sel });
        grid.resetIDS([ "john", "foo", "dave" ]);
        grid.displayPage(0);

        var toolbar = new DlContainer({});

        // a generic handler for the onChange events provided by the entry fields
        // *this* in this function is the input field
        function modifyProp(prop_id) {
                var a = sel.getArray();
                if (a.length == 0) {
                        return;
                }
                var record = cache.get(a[0]);
                record.set(prop_id, this.getValue());
        };

        // create some text input fields here
        var hbox = new DlHbox({ parent: toolbar });
        var entries = {};
        [ "first_name", "last_name", "employer", "phone" ].foreach(function(id){
                var f = entries[id] = new DlEntry({ parent: hbox, emptyText: id });
                f.addEventListener("onChange", modifyProp.$(f, id));
        });

        // and some "add/remove" buttons
        var hbox = new DlHbox({ parent: toolbar });

        var add = new DlButton({ parent: hbox, label: "Insert" });
        add.addEventListener("onClick", function() {
                var id = prompt("Enter ID for new record");
                if (!id)
                        return;
                var data = { id: id };
                [ "first_name", "last_name", "employer", "phone" ].foreach(function(id){
                        data[id] = entries[id].getValue();
                });
                var record = new DlRecord({ data: data });
                cache.insert(record);
        });

        var del = new DlButton({ parent: hbox, label: "Delete" });
        del.addEventListener("onClick", function() {
                var a = sel.getArray();
                if (a == 0)
                        return alert("No rows selected");
                a.foreach(cache.remove, cache);
        });

        layout.packWidget(toolbar, { pos: "bottom" });
        layout.packWidget(grid, { pos: "top", fill: "*" });

        sel.addEventListener([ "onChange", "onReset" ], function() {
                var array = sel.getArray();
                if (array.length > 0) {
                        var record = cache.get(array[0]);
                        // update entries
                        [ "first_name", "last_name", "employer", "phone" ].foreach(function(id){
                                var f = entries[id];
                                // pass true to avoid calling onChange hooks
                                f.setValue(record.get(id), true);
                        });
                }
        });

        dialog.setSize({ x: 600, y: 400 });
        dialog.show(true);
}
