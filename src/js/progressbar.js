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
