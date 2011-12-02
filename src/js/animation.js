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

// @require eventproxy.js

DEFINE_CLASS("DlAnimation", DlEventProxy, function(D, P){

        D.DEFAULT_EVENTS = [ "onStart", "onStop", "onPause", "onUpdate" ];

	D.CONSTRUCT = function(length, fps) {
                this.addEventListener("onDestroy", this.stop.$(this));
                if (length != null)
                        this.length = length;
                if (fps != null)
                        this._speed = 1000 / fps;
                this._update = update.$(this);
	};

	P.start = function(length, fps, func) {
                this.stop();
                if (length != null)
                        this.length = length;
                if (fps != null)
                        this._speed = 1000 / fps;
                if (func != null) {
                        if (!(func instanceof Function))
                                func = DlAnimation.easing[func];
                        this.func = func;
                }
                this.t = 0;
                this.i = 0;
                this.callHooks("onStart");
                this._timer = setInterval(this._update, this._speed);
	};

        P.running = function() {
                return this._timer;
        };

	P.stop = function(finished) {
		if (this._timer) {
			clearInterval(this._timer);
			this._timer = null;
			this.applyHooks("onStop", [ finished ]);
		}
	};

        P.getPos = function(f) {
                if (f == null)
                        f = this.func;
                return f.call(this, this.t);
        };

	function update() {
                this.t = this.i / this.length;
                try {
                        this.applyHooks("onUpdate", [ this.t ]);
                        if (++this.i > this.length)
                                this.stop(true);
                } catch(ex) {
                        this.stop();
                        throw ex;
                }
	};

	var PI     = Math.PI,
            abs    = Math.abs,
            asin   = Math.asin,
            pow    = Math.pow,
            sin    = Math.sin,
            cos    = Math.cos,
            exp    = Math.exp,
            round  = Math.round;

	var E = D.easing = {

                elastic_b : function(t) {
                        return 1-cos(-t*5.5*PI)/pow(2,7*t);
                },

                // FIXME: better name?
                elastic_b_custom : function(elasticity, stability, t) {
                        elasticity += 0.5;
                        return 1-cos(-t*elasticity*PI)/pow(2,stability*t);
                },

                magnetic : function(t) {
                        return 1-cos(t*t*t*10.5*PI)/exp(4*t);
                },

                accel_b : function(t) {
                        t = 1-t;
                        return 1 - t*t*t;
                },

                accel_a : function(t) {
                        return t * t * t;
                },

                accel_ab : function(t) {
                        t = 1-t;
                        return 1-sin(t*t*t*PI/2);
                },

                bounce_b : function(t) {
                        return t < 1/2.75
                                ? 7.5625 * t * t
                                : (t < 2/2.75
                                   ? (7.5625 * (t -= 1.5/2.75) * t + .75)
                                   : (t < 2.5/2.75
                                      ? (7.5625 * (t -= 2.25/2.75) * t + .9375)
                                      : (7.5625 * (t -= 2.625 / 2.75) * t + .984375)));
                },

                shake : function(t) {
                        return t < 0.5
                                ? -cos(t*11*PI)*t*t
                                : (t = 1-t, cos(t*11*PI)*t*t);
                }

	};

});
