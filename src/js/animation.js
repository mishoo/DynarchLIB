(function() {

	DlAnimation.inherits(DlEventProxy);
	function DlAnimation(length, fps) {
		DlEventProxy.call(this);
		this.registerEvents(DEFAULT_EVENTS);
                this.addEventListener("onDestroy", this.stop.$(this));
                if (length != null)
                        this.length = length;
                if (fps != null)
                        this._speed = 1000 / fps;
                this._update = update.$(this);
	};

	eval(Dynarch.EXPORT("DlAnimation"));

        var DEFAULT_EVENTS = [ "onStart", "onStop", "onPause", "onUpdate" ];

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

	var
            PI     = Math.PI,
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

})();
