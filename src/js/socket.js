//> This file is part of DynarchLIB, an AJAX User Interface toolkit
//> http://www.dynarchlib.com/
//>
//> Copyright (c) 2004-2011, Mihai Bazon, Dynarch.com.  All rights reserved.
//>
//> Redistribution and use in source and binary forms, with or without
//> modification, are permitted provided that the following conditions are
//> met:
//>
//>     * Redistributions of source code must retain the above copyright
//>       notice, this list of conditions and the following disclaimer.
//>
//>     * Redistributions in binary form must reproduce the above copyright
//>       notice, this list of conditions and the following disclaimer in
//>       the documentation and/or other materials provided with the
//>       distribution.
//>
//>     * Neither the name of Dynarch.com nor the names of its contributors
//>       may be used to endorse or promote products derived from this
//>       software without specific prior written permission.
//>
//> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
//> EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//> IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
//> PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE
//> FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
//> CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
//> SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//> INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
//> CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//> ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
//> THE POSSIBILITY OF SUCH DAMAGE.

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
