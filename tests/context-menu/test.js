function RUN() {
        var hbox = new DlHbox({ parent: desktop });
        var btn = new DlButton({ parent: hbox, label: "Right click me" });
        var menu = new DlVMenu();
        (5).times(function(i){
                new DlMenuItem({ label: "Item " + (i + 1), parent: menu });
        });
        btn.setContextMenu(menu);
};
