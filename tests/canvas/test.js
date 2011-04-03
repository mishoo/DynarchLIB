function RUN() {
        var dlg = new DlDialog({
                title: "Canvas test",
                quitBtn: "destroy",
                resizable: true
        });
        var cw = new DlCanvas({
                parent: dlg,
                fillParent: true,
                width: 800,
                height: 600
        });
        cw.setMouseListeners();

        // cw.addEventListener("onResize", function(){
        //         this.withSavedContext(function(ctx){
        //                 ctx.strokeStyle = "#FF0000";
        //                 ctx.fillStyle = "#FFEE00";
        //                 ctx.lineWidth = 2;
        //                 ctx.fillRect(10, 10, 20, 30);
        //                 ctx.strokeRect(10, 10, 20, 30);
        //         });
        // });

        cw.withNoUpdates(function(){
                for (var i = 0; i < 3; ++i) {
                        for (var j = 0; j < 3; ++j) {
                                cw.add(new DlCanvas.ActiveRect(i * 55 + 50, j * 55 + 50, 40, 40));
                        }
                }
        });

        dlg.setSize({ x: 800, y: 600 });
        dlg.show(true);
};