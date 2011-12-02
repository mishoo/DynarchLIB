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

DEFINE_CLASS("DlSound", DlEventProxy, function(D, P){

        var SOUNDS = {};

        function FLASH() { return DlFlashUtils().getObject(); };

        D.DEFAULT_EVENTS = [ "onLoad", "onComplete" ];

        D.DEFAULT_ARGS = {
                _volume : [ "volume" , null ],
                _pan    : [ "pan"    , null ],
                _url    : [ "url"    , null ],
                _stream : [ "stream" , false ]
        };

        D.CONSTRUCT = function(args) {
                this.addEventListener({ onDestroy : onDestroy,
                                        onLoad    : onLoad });
                this.id = FLASH().DlSound_create();
                if (this._volume != null)
                        this.setVolume(this._volume);
                if (this._pan != null)
                        this.setPan(this._pan);
                SOUNDS[this.id] = this;
        };

        P.load = function(url, stream) {
                if (url == null)
                        url = this._url;
                if (stream == null)
                        stream = this._stream;
                this.__fileLoaded = false;
                this.__loadCalled = true;
                FLASH().DlSound_load(this.id, this._url = url, this._stream = stream);
        };

        P.play = function(offset, loop) {
                if (this.__fileLoaded) {
                        FLASH().DlSound_play(this.id, offset, loop);
                } else if (!this.__loadCalled) {
                        this.__shouldPlay = [ offset, loop ];
                        this.load();
                }
        };

        P.stop = function() {
                FLASH().DlSound_stop(this.id);
        };

        P.getBytesLoaded = function() {
                return FLASH().DlSound_getBytesLoaded(this.id);
        };

        P.getBytesTotal = function() {
                return FLASH().DlSound_getBytesTotal(this.id);
        };

        P.getDuration = function() {
                return FLASH().DlSound_getDuration(this.id);
        };

        P.getPosition = function() {
                return FLASH().DlSound_getPosition(this.id);
        };

        P.setPan = function(pan) {
                FLASH().DlSound_setPan(this.id, this._pan = pan);
        };

        P.setVolume = function(volume) {
                FLASH().DlSound_setVolume(this.id, this._volume = volume);
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

});
