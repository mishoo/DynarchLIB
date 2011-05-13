function RUN() {
        var dlg = new DlDialog();
        var box = new DlVbox({ parent: dlg, borderSpacing: 10 });
        var e1 = new DlEntry({ parent: box });
        var e2 = new DlEntry({ parent: box });
        var button = new DlButton({ parent: box, focusable: true, label: "Check This" });
        dlg._focusedWidget = e1;
        dlg.show(true);
}
