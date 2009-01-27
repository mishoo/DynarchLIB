// -*- javascript -*-
//
// (c) Dynarch.com 2007
// All rights reserved.

import Sound;
import flash.external.ExternalInterface;

class DlSound {

        private static var sounds = {};
        private static var IDS = 0;

        private var sound;
        private var id;

        public static function create() {
                var s = new DlSound();
                sounds[s.id] = s;
                return s.id;
        }

        public static function load(id, url, streaming) {
                var snd = sounds[id];
                snd.sound.loadSound(url, !!streaming);
        }

        public static function play(id, offset, loop) {
                var snd = sounds[id];
                snd.sound.start(offset, loop);
        }

        public static function stop(id) {
                var snd = sounds[id];
                snd.sound.stop();
        }

        public static function getBytesLoaded(id) {
                var snd = sounds[id];
                return snd.sound.getBytesLoaded();
        }

        public static function getBytesTotal(id) {
                var snd = sounds[id];
                return snd.sound.getBytesTotal();
        }

        public static function getDuration(id) {
                var snd = sounds[id];
                return snd.sound.duration;
        }

        public static function getPosition(id) {
                var snd = sounds[id];
                return snd.sound.position;
        }

        public static function setPan(id, pan) {
                var snd = sounds[id];
                snd.sound.setPan(pan);
        }

        public static function setVolume(id, vol) {
                var snd = sounds[id];
                snd.sound.setVolume(vol);
        }

        private function DlSound() {
                var snd = this.sound = new Sound();
                this.id = ++IDS;

                snd.onLoad          = DL.bind(this, _onLoad);
                snd.onSoundComplete = DL.bind(this, _onSoundComplete);
        }

        private function _onLoad(success) {
                ExternalInterface.call("DlSound_onLoad", this.id, success);
        }

        private function _onSoundComplete() {
                ExternalInterface.call("DlSound_onSoundComplete", this.id);
        }

}
