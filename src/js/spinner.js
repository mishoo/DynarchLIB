// @require entry.js
// @require button.js
// @require keyboard.js

DEFINE_CLASS("DlSpinner", DlEntry, function(D, P, DOM) {

        var CE = DOM.createElement;

        D.FIXARGS = function(args) {
                args.validators = [ new DlValidator(DlValidator.Number,
						    args.minVal,
						    args.maxVal,
						    args.integer,
						    args.decimals) ];
                args.type = "text";
        };

        D.CONSTRUCT = function() {
		this._timer = null;
		this._timerStep = null;
		this._timerState = null;
		this._timerPos = null;
        };

        // XXX: can we use D.DEFAULT_EVENTS?
        var DEFAULT_EVENTS = [ "onSpin" ];

	D.DEFAULT_ARGS = {
		_step        : [ "step"      , 1 ],
		_size        : [ "size"      , 4 ],
		_value       : [ "value"     , 0 ],
		_minVal      : [ "minVal"    , null ],
		_maxVal      : [ "maxVal"    , null ],
		_decimals    : [ "decimals"  , null ],
		_integer     : [ "integer"   , false ]
	};

	P.intervals = [
		{ pos:   1 , step: 1  , speed: 125 },
		{ pos:  10 , step: 1  , speed: 70 },
		{ pos:  20 , step: 1  , speed: 35 },
		{ pos:  50 , step: 1  , speed: 20 },
		{ pos: 100 , step: 1  , speed: 10 },
		{ pos: 200 , step: 2  , speed: 10 }
	];

	P._createElement = function() {
                this._no_gecko_bug = true;
		D.BASE._createElement.call(this);
		var table = this.getElement();
		var r1 = table.rows[0].cells[0];
		r1.rowSpan = 2;
		r1 = r1.parentNode;
		var r2 = CE("tr", null, null, r1.parentNode);
		var c1 = CE("td", null, { className: "DlSpinner-Button DlSpinner-Button-Up" }, r1);
		var c2 = CE("td", null, { className: "DlSpinner-Button DlSpinner-Button-Down" }, r2);
		this._buttonUp = new DlButton({ parent: this, appendArgs: c1 });
		this._buttonDown = new DlButton({ parent: this, appendArgs: c2 });
                this._btn = this._buttonUp;
	};

	function onFocus() {
		this.select();
	};

	function onBlur() {
		this._clearTimer();
	};

        function onMouseWheel(ev) {
                this._spinnerUpdateVal(ev.wheelDelta > 0);
                throw new DlExStopEventBubbling;
        };

	function onKeyDown(ev) {
		switch (ev.keyCode) {
		    case DlKeyboard.ARROW_DOWN:
			spinnerAct.call(this, { _direction: false });
			throw new DlExStopEventBubbling;
			break;
		    case DlKeyboard.ARROW_UP:
			spinnerAct.call(this, { _direction: true });
			throw new DlExStopEventBubbling;
			break;
		}
	};

	function onKeyUp(ev) {
		this._clearTimer();
	};

	function onChange() {
		var val = this.getValue();
                var min = val == this._maxVal;
                var max = val == this._minVal;
                this._buttonUp.disabled(min || !!this.readonly());
                this._buttonDown.disabled(max || !!this.readonly());
                if (min || max)
                        this._clearTimer();
	};

	P._setListeners = function() {
		D.BASE._setListeners.call(this);
		this.registerEvents(DEFAULT_EVENTS);
		this.addEventListener({ onFocus       : onFocus,
					onBlur        : onBlur,
                                        onMouseWheel  : onMouseWheel,
					onKeyDown     : onKeyDown,
					onKeyUp       : onKeyUp,
					onChange      : onChange });
	};

	P.initDOM = function() {
		D.BASE.initDOM.call(this);
		this._setupSpinnerBtn(this._buttonUp, true);
		this._setupSpinnerBtn(this._buttonDown, false);
	};

        P.readonly = function(readonly) {
                if (readonly != null) {
                        this._buttonUp.disabled(readonly);
                        this._buttonDown.disabled(readonly);
                }
                return D.BASE.readonly.apply(this, arguments);
        };

	P._spinnerUpdateVal = function(dir) {
                if (!this._readonly) {
                        var val = new Number(this.getValue());
                        var step = this._timerStep || this._step;
                        val = dir
			? (val + step)
			: (val - step);
                        if (this._minVal != null && val < this._minVal)
                                val = this._minVal;
                        if (this._maxVal != null && val > this._maxVal)
                                val = this._maxVal;
                        this.setValue(val);
                        this.applyHooks("onSpin", [ val ]);
                        this.focus();
                        this.select();
                        if (this._timer) {
                                var p = ++this._timerPos;
                                if (this._timerState.length && p == this._timerState[0].pos) {
                                        var o = this._timerState.shift();
                                        this._clearTimer(true);
                                        this._timerStep = o.step;
                                        this._startTimer(dir, o.speed);
                                }
                        }
                }
	};

	function spinnerAct(b) {
		this._spinnerUpdateVal(b._direction);
		(this._timerState = Dynarch.makeArray(this.intervals))
			.r_foreach(function(e){
				e.step *= this.step;
			}, this);
		this._timerPos = 0;
		this._startTimer(b._direction, 250);
		throw new DlExStopEventBubbling;
	};

	function spinnerMouseUp(b) {
//		this.select();
//		this.focus();
		this._clearTimer();
	};

	P._clearTimer = function(restart) {
		if (this._timer)
			clearInterval(this._timer);
		if (!restart) {
			this._timerState = null;
			this._timerStep = null;
			this._timerPos = null;
		}
		this._timer = null;
	};

	P._startTimer = function(dir, timeout) {
		if (this._timer)
			clearInterval(this._timer);
		this._timer = setInterval(this._spinnerUpdateVal.$(this, dir), timeout);
	};

	P._setupSpinnerBtn = function(b, up) {
		b._direction = up;
		var mouseUp = spinnerMouseUp.$(this, b);
		b.addEventListener({ onMouseDown : spinnerAct.$(this, b),
				     onMouseUp   : mouseUp });
		// this.addEventListener("onMouseUp", mouseUp);
	};

});
