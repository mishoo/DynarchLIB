// @require flashutils.js

(function(){

        DlSound.inherits(DlEventProxy);
        function DlSound(args) {
                if (args) {
                        D.setDefaults(this, args);
                        DlEventProxy.call(this);
                        this.registerEvents(DEFAULT_EVENTS);
                        this.addEventListener({ onDestroy : onDestroy,
                                                onLoad    : onLoad });
                        this.id = DlFlashUtils().getObject().DlSound_create();
                        if (this._volume != null)
                                this.setVolume(this._volume);
                        if (this._pan != null)
                                this.setPan(this._pan);
                        SOUNDS[this.id] = this;
                }
        };

        eval(Dynarch.EXPORT("DlSound"));

        D.DEFAULT_ARGS = {
                _volume : [ "volume" , null ],
                _pan    : [ "pan"    , null ],
                _url    : [ "url"    , null ],
                _stream : [ "stream" , false ]
        };

        P.load = function(url, stream) {
                if (url == null)
                        url = this._url;
                if (stream == null)
                        stream = this._stream;
                this.__fileLoaded = false;
                this.__loadCalled = true;
                DlFlashUtils().getObject().DlSound_load(this.id, this._url = url, this._stream = stream);
        };

        P.play = function(offset, loop) {
                if (this.__fileLoaded) {
                        DlFlashUtils().getObject().DlSound_play(this.id, offset, loop);
                } else if (!this.__loadCalled) {
                        this.__shouldPlay = [ offset, loop ];
                        this.load();
                }
        };

        P.stop = function() {
                DlFlashUtils().getObject().DlSound_stop(this.id);
        };

        P.getBytesLoaded = function() {
                return DlFlashUtils().getObject().DlSound_getBytesLoaded(this.id);
        };

        P.getBytesTotal = function() {
                return DlFlashUtils().getObject().DlSound_getBytesTotal(this.id);
        };

        P.getDuration = function() {
                return DlFlashUtils().getObject().DlSound_getDuration(this.id);
        };

        P.getPosition = function() {
                return DlFlashUtils().getObject().DlSound_getPosition(this.id);
        };

        P.setPan = function(pan) {
                DlFlashUtils().getObject().DlSound_setPan(this.id, this._pan = pan);
        };

        P.setVolume = function(volume) {
                DlFlashUtils().getObject().DlSound_setVolume(this.id, this._volume = volume);
        };

        P.getPan = function() {
                return this._pan;
        };

        P.getVolume = function() {
                return this._volume;
        };

        P.getURL = function() {
                return this._url;
        };

        var DEFAULT_EVENTS = [ "onLoad", "onComplete" ];

        var SOUNDS = {};

        function onDestroy() {
                delete SOUNDS[this.id];
        };

        function onLoad(success) {
                this.__fileLoaded = success;
                if (success && this.__shouldPlay) {
                        this.play.apply(this, this.__shouldPlay);
                        this.__shouldPlay = null;
                }
        };

        window.DlSound_onLoad = function(id, success) {
                SOUNDS[id].applyHooks("onLoad", [ success ]);
        };

        window.DlSound_onSoundComplete = function(id) {
                SOUNDS[id].callHooks("onComplete");
        };

})();
