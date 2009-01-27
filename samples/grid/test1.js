function test1() {

        var dialog = new DlDialog({ title: "Grid sample", resizable: true, quitBtn: "destroy" });

        // this array is passed to DlRecordCache in order to initialize the data
        var data = [
                new DlRecord({ data: { id: "john" , first_name: "John" , last_name: "Doe", phone: "555-6789", employer: "Nowhere" }}),
                new DlRecord({ data: { id: "foo"  , first_name: "Foo"  , last_name: "Bar", phone: "123-4567", employer: "Somewhere" }}),
                new DlRecord({ data: { id: "dave" , first_name: "David", last_name: "Beckham", phone: "n/a", employer: "Real Madrid" }})
        ];

        var cache = new DlRecordCache({ data: data });

        var columns = [
                { id: "first_name" , label: "First Name" , width: 100 },
                { id: "last_name"  , label: "Last Name"  , width: 100 },
                { id: "phone"      , label: "Phone"      , width: 150 }
        ];

        // create the grid now

        var grid = new DlDataGrid({ parent: dialog, cols: columns, data: cache, fillParent: true });
        grid.resetIDS([ "john", "foo", "dave" ]);
        grid.displayPage(0);    // we'll discuss this later

        // must size the dialog
        dialog.setSize({ x: 600, y: 400 });
        dialog.show(true);
}
