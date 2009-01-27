// @require flashutils.js

(function(){

        DlSocket.inherits(DlEventProxy);
        function DlSocket(args) {
                if (args) {
                        if (!args.host)
                                args.host = document.domain;
                        D.setDefaults(this, args);
                        DlEventProxy.call(this);
                        this.registerEvents(DEFAULT_EVENTS);
                        this.addEventListener("onDestroy", onDestroy);
                        DlEvent.atUnload(this.destroy.$(this));
                }
        };

        eval(Dynarch.EXPORT("DlSocket"));

        var DEFAULT_EVENTS = [ "onConnect", "onRelease", "onData" ];

        var SOCKETS = {};

        function onDestroy() {
                DlFlashUtils().getObject().DlSocket_destroy(this.id);
                delete SOCKETS[this.id];
        };

        D.DEFAULT_ARGS = {
                _host : [ "host", null ],
                _port : [ "port", null ],
                _json : [ "json", false ]
        };

        P.send = function(data) {
                DlFlashUtils().getObject().DlSocket_send(this.id, data);
        };

        P.sendJSON = function(data) {
                DlFlashUtils().getObject().DlSocket_send(this.id, DlJSON.encode(data));
        };

        P.connect = function() {
                this.id = DlFlashUtils().getObject().DlSocket_connect(this._host, this._port);
                SOCKETS[this.id] = this;
        };

        P.reconnect = function() {
                DlFlashUtils().getObject().DlSocket_reconnect(this.id);
        };

        P.disconnect = function() {
                DlFlashUtils().getObject().DlSocket_disconnect(this.id);
        };

        window.DlSocket_onConnect = function(id, status) {
                SOCKETS[id].applyHooks("onConnect", [ status ]);
        };

        window.DlSocket_onData = function(id, data) {
                data = DlFlashUtils.decodeString(data);
                var sok = SOCKETS[id];
                if (sok._json)
                        data = DlJSON.decode(data);
                sok.applyHooks("onData", [ data ]);
        };

        window.DlSocket_onDisconnect = function(id, reason) {
                SOCKETS[id].applyHooks("onRelease", [ reason ]);
        };

})();
