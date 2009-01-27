// -*- javascript -*-
//
// (c) Dynarch.com 2007
// All rights reserved.

import XMLSocket;
import flash.external.ExternalInterface;

class DlSocket {

        private static var sockets = {};
        private static var IDS = 0;

        private var sok;
        private var host;
        private var port;
        private var id;

        public static function loadPolicyFile(addr) {
                System.security.loadPolicyFile(addr);
        }

        public static function connect(host, port) {
                var s = new DlSocket(host, port);
                sockets[s.id] = s;
                return s.id;
        }

        public static function reconnect(id) {
                var s = sockets[id];
                s.sok.connect(s.host, s.port);
        }

        public static function disconnect(id) {
                var s = sockets[id];
                s.sok.close();
                s.sok.onClose(1);
        }

        public static function destroy(id) {
                var s = sockets[id];
                s.sok.close();
                delete sockets[id];
                s.sok.onClose(2);
        }

        public static function send(id, data) {
                var s = sockets[id];
                s.sok.send(data);
        }

        private function DlSocket(host, port) {
                this.host = host;
                this.port = port;
                this.id = ++IDS;
                var sok = new XMLSocket();
                this.sok = sok;
                sok.onConnect = DL.bind(this, _onConnect);
                sok.onData = DL.bind(this, _onData);
                sok.onClose = DL.bind(this, _onClose);
                sok.connect(host, port);
        }

        private function _onConnect(result) {
                ExternalInterface.call("DlSocket_onConnect", this.id, result);
        }

        private function _onData(data) {
                ExternalInterface.call("DlSocket_onData", this.id, DL.encodeString(data));
        }

        private function _onClose(result) {
                if (result == null)
                        result = 0;
                ExternalInterface.call("DlSocket_onDisconnect", this.id, result);
        }

}
