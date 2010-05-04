function RUN() {

        // test for DlEntry's emptyText

        var dlg = new DlDialog({
                title: "Test",
                quitBtn: "destroy"
        });

        var cont = new DlContainer({ parent: dlg });
        cont.setStyle({ padding: "5em" });

        var entry = new DlEntry({
                parent: cont,
                emptyText: "Check this out"
        });

        dlg.show(true);

};
