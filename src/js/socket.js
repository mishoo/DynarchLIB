// @require flashutils.js

DEFINE_CLASS("DlSocket", DlEventProxy, function(D, P){

        function FLASH() { return DlFlashUtils().getObject(); };

        D.DEFAULT_EVENTS = [ "onConnect", "onRelease", "onData" ];

        D.DEFAULT_ARGS = {
                _host : [ "host", null ],
                _port : [ "port", null ],
                _json : [ "json", false ]
        };

        D.FIXARGS = function(args) {
                if (!args.host)
                        args.host = document.domain;
        };

        D.CONSTRUCT = function(args) {
                this.addEventListener("onDestroy", onDestroy);
                DlEvent.atUnload(this.destroy.$(this));
        };

        var SOCKETS = {};

        function onDestroy() {
                FLASH().DlSocket_destroy(this.id);
                delete SOCKETS[this.id];
        };

        P.send = function(data) {
                FLASH().DlSocket_send(this.id, data);
        };

        P.sendJSON = function(data) {
                FLASH().DlSocket_send(this.id, DlJSON.encode(data));
        };

        P.connect = function() {
                this.id = FLASH().DlSocket_connect(this._host, this._port);
                SOCKETS[this.id] = this;
        };

        P.reconnect = function() {
                FLASH().DlSocket_reconnect(this.id);
        };

        P.disconnect = function() {
                FLASH().DlSocket_disconnect(this.id);
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

});
