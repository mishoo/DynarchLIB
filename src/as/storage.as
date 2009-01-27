// -*- javascript -*-
//
// (c) Dynarch.com 2007
// All rights reserved.

import SharedObject;
import flash.external.ExternalInterface;

class DlStorage {

        private static var so;

        public static function init() {
                so = SharedObject.getLocal("DlStorage");
                so.onStatus = function(info) {
                        ExternalInterface.call("DlFlashStore._onStatus", info);
                };
        }

        public static function set(key, val) {
                so.data[key] = val;
        }

        public static function get(key) {
                return DL.encodeObject(so.data[key]);
        }

        public static function remove(key) {
                delete so.data[key];
        }

        public static function getAllKeys() {
                var a = [];
                for (var i in so.data)
                        a.push(DL.encodeString(i));
                return a;
        }

        public static function clear() {
                return so.clear();
        }

        public static function flush() {
                return so.flush();
        }

}
