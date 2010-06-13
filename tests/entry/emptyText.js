function RUN() {

        // test for DlEntry's emptyText

        var dlg = new DlDialog({
                title: "Test",
                quitBtn: "destroy"
        });

        var cont = new DlVbox({ parent: dlg, borderSpacing: 10 });

        var entry = new DlEntry({
                parent: cont,
                emptyText: "Check this out"
        });

        var entry2 = new DlEntry({
                parent: cont,
                validators: [ new DlValidator(function(str){
                        throw new DlValidatorException("All wrong dude", DlValidatorException.MISMATCH);
                }) ]
        });

        dlg.show(true);

};
