// -*- javascript -*-
//
// (c) Dynarch.com 2007
// All rights reserved.

import flash.external.ExternalInterface;

class DL {

        public static function main() {

                ExternalInterface.addCallback("DlSocket_connect", null, DlSocket.connect);
                ExternalInterface.addCallback("DlSocket_reconnect", null, DlSocket.reconnect);
                ExternalInterface.addCallback("DlSocket_disconnect", null, DlSocket.disconnect);
                ExternalInterface.addCallback("DlSocket_destroy", null, DlSocket.destroy);
                ExternalInterface.addCallback("DlSocket_send", null, DlSocket.send);

                ExternalInterface.addCallback("DlSocket_loadPolicyFile", null, DlSocket.loadPolicyFile);

                ExternalInterface.addCallback("DlStorage_set", null, DlStorage.set);
                ExternalInterface.addCallback("DlStorage_get", null, DlStorage.get);
                ExternalInterface.addCallback("DlStorage_getAllKeys", null, DlStorage.getAllKeys);
                ExternalInterface.addCallback("DlStorage_remove", null, DlStorage.remove);
                ExternalInterface.addCallback("DlStorage_clear", null, DlStorage.clear);
                ExternalInterface.addCallback("DlStorage_flush", null, DlStorage.flush);
                DlStorage.init();

                ExternalInterface.addCallback("DlSound_create", null, DlSound.create);
                ExternalInterface.addCallback("DlSound_load", null, DlSound.load);
                ExternalInterface.addCallback("DlSound_play", null, DlSound.play);
                ExternalInterface.addCallback("DlSound_stop", null, DlSound.stop);
                ExternalInterface.addCallback("DlSound_getBytesLoaded", null, DlSound.getBytesLoaded);
                ExternalInterface.addCallback("DlSound_getBytesTotal", null, DlSound.getBytesTotal);
                ExternalInterface.addCallback("DlSound_getDuration", null, DlSound.getDuration);
                ExternalInterface.addCallback("DlSound_getPosition", null, DlSound.getPosition);
                ExternalInterface.addCallback("DlSound_setPan", null, DlSound.setPan);
                ExternalInterface.addCallback("DlSound_setVolume", null, DlSound.setVolume);

                ExternalInterface.call("DlFlashUtils_init");

        }

        public static function bind(obj, func) {
                return function() { func.apply(obj, arguments); }
        }

        public static function encodeString(str) {
                return str.split("%").join("%25").split("\\").join("%5c").split("\"").join("%22").split("&").join("%26");
        }

        public static function encodeObject(obj) {
                var i, tmp;
                if (obj instanceof Array) {
                        tmp = [];
                        for (i = obj.length; --i >= 0;)
                                tmp[i] = encodeObject(obj[i]);
                        obj = tmp;
                } else if (typeof obj == "object") {
                        tmp = {};
                        for (i in obj) {
                                tmp[encodeString(i)] = encodeObject(obj[i]);
                        }
                        obj = tmp;
                } else if (typeof obj == "string") {
                        obj = encodeString(obj);
                }
                return obj;
        }

}
