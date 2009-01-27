function RUN() {

        DlFlashUtils().addEventListener("onStorageStatus", function(info) {
                alert("Flash status: <" + info.level + "> code: <" + info.code + ">");
        });

        var cont = new DlHbox({ parent: desktop, borderSpacing: 20 });

        var valentry = new DlEntry({ type: "textarea", size: 30, rows: 10 });
        var setBtn = new DlButton({ label: "Set" });
        var testObjBtn = new DlButton({ label: "Test JS object" });
        var bigTextBtn = new DlButton({ label: "make big text" });

        var fg = new DlFieldGrid({ parent: cont });
        fg.addField({ label: "Key:", name: "key" });
        fg.addField({ label: "Value:", name: "value", widget: valentry, valign: "top" });
        fg.addField({ widget: setBtn });
        fg.addField({ widget: testObjBtn });
        fg.addField({ widget: bigTextBtn });

        var grp = DlRadioGroup.get();

        var select = new DlVbox({ parent: cont });
        var keys = DlFlashStore.getAllKeys();
        keys.foreach(function(key){
                var btn = new DlRadioButton({ parent: select, label: key, group: grp, value: key });
        });

        setBtn.addEventListener("onClick", function() {
                var v = fg.getValue();
                var key = v.key;
                if (!/\S/.test(key))
                        return alert("You must enter the key name");
                var val = v.value.replace(/^\s+/, "").replace(/\s+$/, "");
                var btn = grp.getByValue(key);
                if (!/\S/.test(val)) {
                        DlFlashStore.remove(key);
                        if (btn)
                                btn.destroy();
                } else {
                        DlFlashStore.set(key, val);
                        if (!btn)
                                new DlRadioButton({ parent: select, label: key, group: grp, value: key });
                }
        });

        grp.addEventListener("onChange", function() {
                var v = this.getValue()[0];
                var val = DlFlashStore.get(v);
                if (typeof val != "string") {
                        val = DlJSON.encode(val);
                }
                fg.setValue({ key: v, value: val });
        });

        testObjBtn.addEventListener("onClick", function() {
                var v = fg.getValue();
                try {
                        var obj = DlJSON.decode(v.value);
                } catch(ex) {
                        return alert(ex);
                }
                DlFlashStore.set(v.key, obj);
        });

        bigTextBtn.addEventListener("onClick", function() {
                console.time("generate");
                var txt = "This is a really big text\n".repeat(10000);
                console.timeEnd("generate");
                var key = "bigText";

                console.time("set");
                DlFlashStore.set(key, txt);
                console.timeEnd("set");

                alert(DlFlashStore.flush(true));

                console.time("get");
                var val = DlFlashStore.get(key);
                console.timeEnd("get");

                console.log(DlFlashStore.getAllKeys());

                if (val == null)
                        console.log("Failed");
                else
                        console.log("Got %d characters", val.length);
        });

};
