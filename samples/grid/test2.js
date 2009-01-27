function test2() {

        var dialog = new DlDialog({ title: "Grid sample", resizable: true, quitBtn: "destroy" });

        // this array is passed to DlRecordCache in order to initialize the data
        var data = [];

        var inheritance = Function.getInheritanceGraph();
        for (var i in inheritance) {
                var cells = { id: i, object: i, base: inheritance[i] };
                var methods = 0;
                var overrides = 0;
                try {
                        var p1, p2;
                        eval("p1=" + i + ".prototype");
                        eval("p2=" + inheritance[i] + ".prototype");
                        for (var j in p1) {
                                if (typeof p1[j] == "function") {
                                        methods++;
                                        if (typeof p2[j] == "function")
                                                overrides++;
                                }
                        }
                        cells.no_methods = methods;
                        cells.no_overrides = overrides;
                        data.push(new DlRecord({ data: cells }));
                } catch(ex) {}
        }

        var all_ids = data.map("id"); // fetch all ID-s

        var cache = new DlRecordCache({ data: data });

        var columns = [
                { id: "object", label: "Object", width: 100 },
                { id: "base", label: "Base", width: 100 },
                { id: "no_methods", label: "M", width: 40, tooltip: "Number of methods" },
                { id: "no_overrides", label: "O", width: 40, tooltip: "Number of overriden methods" }
        ];

        // create the grid now

        var grid = new DlDataGrid({ parent: dialog,
                                    cols: columns,
                                    data: cache,
                                    fillParent: true
                                    // virtualScrolling: false,
                                    // rpp: null
                                  });
        grid.resetIDS(all_ids);
        grid.displayPage(0);

        // must size the dialog
        dialog.setSize({ x: 600, y: 400 });
        dialog.show(true);
}
