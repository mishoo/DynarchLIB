// @require widget.js

DEFINE_CLASS("DlProgressBar", DlWidget, function(D, P){

        var CE = DynarchDomUtils.createElement;

	D.DEFAULT_ARGS = {
		__progress_minVal : [ "min", 0 ],
		__progress_maxVal : [ "max", 100 ],
		__progress_val    : [ "val", 0 ],
		__label           : [ "label", null ]
	};

	P._createElement = function() {
		D.BASE._createElement.call(this);
		var el = this.getElement();
		CE("div", null, { className: "DlProgressBar-fill" }, el);
		CE("div", null, { className: "DlProgressBar-label", innerHTML: "&nbsp;" }, el);
                this.setLabel(this.__label);
		this.setValue(this.__progress_val);
	};

	P._getLabelElement = function() {
		return this.getElement().lastChild;
	};

	P._getFillElement = function() {
		return this.getElement().firstChild;
	};

        P.getValue = function() {
                return this.__progress_val;
        };

        P.getMaxVal = function() {
                return this.__progress_maxVal;
        };

        P.getMinVal = function() {
                return this.__progress_minVal;
        };

	P.setValue = function(val) {
		this.__progress_val = val;
                if (val > this.__progress_maxVal)
                        val = this.__progress_maxVal;
		var diff = this.__progress_maxVal - this.__progress_minVal;
		var pos = val - this.__progress_minVal;
		var percent = 100 * pos / diff;
		if (!isNaN(percent) && percent >= 0) {
			this._getFillElement().style.width = percent + "%";
			this._updateLabel(percent);
		}
	};

	P.setLabel = function(label) {
		this.__label = label;
		this._updateLabel();
	};

	P._updateLabel = function(percent) {
		var label = this.__label;
                if (percent == null)
                        percent = 0;
		if (label != null) {
			if (typeof label == "function")
				label = label(this, percent, this.__progress_val);
			else {
				label = label.replace(/%d/g, Math.round(percent))
					.replace(/%f/g, percent.toFixed(2))
                                        .replace(/%v/g, this.__progress_val);
			}
			if (!/\S/.test(label))
				label = "&nbsp;";
			this._getLabelElement().innerHTML = label;
		}
	};

	P.reset = function(min, max, val, label) {
		if (val == null)
			val = min;
		this.__progress_minVal = min;
		this.__progress_maxVal = max;
		if (arguments.length > 3)
			this.__label = label;
		this.setValue(val);
	};

});
