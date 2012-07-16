function RUN() {
        var outer = new DlDialog({
                title: "Foo bar",
                resizable: true
        });
        var dlg = new DlDialog({
                title: "Test buttons",
                parent: outer
        });

        var vbox = new DlVbox({ parent: dlg, borderSpacing: 20 });
        vbox.setStyle({ width: "100%" });

        var tb = new DlContainer({ parent: vbox, className: "DlToolbar" });
        mkSamples(tb);

        var tb = new DlContainer({ parent: vbox });
        mkSamples(tb);

        outer.setSize({ x: 800, y: 600 });
        outer.show(true);

        dlg.show(true);

        function mkSamples(tb) {
                var box = new DlHbox({ parent: tb, borderSpacing: 2, align: "center" });
                new DlButton({ parent: box, iconClass: "IconChardev", type: DlButton.TYPE.TWOSTATE });
                new DlButton({ parent: box, iconClass: "IconChardev" });
                box.addSeparator("wide-separator");
                new DlButton({ parent: box, label: "No icon", type: DlButton.TYPE.TWOSTATE });
                new DlButton({ parent: box, label: "Dynarch", iconClass: "IconDynarch", type: DlButton.TYPE.TWOSTATE });
                new DlButton({ parent: box, label: "Calendar", iconClass: "IconCalendar", type: DlButton.TYPE.TWOSTATE }).checked(true);
                new DlButton({ parent: box, label: "Palette", iconClass: "IconColors", type: DlButton.TYPE.TWOSTATE });

                var box = new DlHbox({ parent: tb, borderSpacing: 2, align: "center" });
                new DlCheckbox({ parent: box, label: "Foo", checked: true });
                new DlCheckbox({ parent: box, label: "Bar" });
                new DlCheckbox({ parent: box, label: "Baz" });

                var box = new DlHbox({ parent: tb, borderSpacing: 2, align: "center" });
                var g = DlRadioGroup.get();
                new DlRadioButton({ parent: box, group: g, label: "Foo" });
                new DlRadioButton({ parent: box, group: g, label: "Bar", checked: true });
                new DlRadioButton({ parent: box, group: g, label: "Baz" });
        }
}
