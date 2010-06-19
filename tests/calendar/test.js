function RUN() {
        var vbox = new DlVbox({ parent: desktop, borderSpacing: 10 });
        var cal = new DlCalendar({ parent: vbox });
        cal.addEventListener("onSelect", function(){
                dlconsole.log("Selected: %o", this.date);
        });
};
