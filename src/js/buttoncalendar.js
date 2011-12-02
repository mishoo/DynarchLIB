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

// @require buttonmenu.js
// @require calendar.js

DEFINE_CLASS("DlButtonCalendar", DlButtonMenu, function(D, P){

	D.DEFAULT_ARGS = {
		dateFormat     : [ "dateFormat"   , "%Y/%m/%d" ],
		_calendarArgs  : [ "calendar"     , {} ],
                _iconClass     : [ "iconClass"    , "IconCalendar" ],
		date           : [ "date"         , "Select date..." ]
	};

        D.DEFAULT_EVENTS = [ "onSelect", "onCalendarRendered" ];

	function calendar_onSelect(cal, cleared, otherMonth) {
		if (!cleared) {
			this.getButton().setContent(cal.date.print(this.dateFormat));
			DlPopup.clearAllPopups();
			this.date = new Date(cal.date);
			this.applyHooks("onSelect", [ this.date ]);
		}
	};

	function button_onClick(ev) {
		if (this.date instanceof Date) {
			var cal = this.getCalendar();
			if (!cal.date.dateEqualsTo(this.date)) {
				cal.date = new Date(this.date);
				cal._selectedDate = this.date.getDate();
				cal.init();
			}
		}
		this.getArrow().applyHooks("onMouseDown", [ ev ]);
	};

	P.getCalendar = function() {
		var cal = this._calendar;
		if (!cal) {
			this._calendarArgs.noinit = true;
			cal = this._calendar = new DlCalendar(this._calendarArgs);
			this.addEventListener("onDestroy", cal.destroy.$(cal));
			cal.addEventListener("onSelect", calendar_onSelect.$(this, cal));
                        cal.connectEvents("onRendered", this, "onCalendarRendered");
			if (this.date instanceof Date)
				cal.date = new Date(this.date);
			cal.init();
		}
		return this._calendar;
	};

	P.initDOM = function() {
		D.BASE.initDOM.call(this);
		var b = this.getButton();
		if (this.date instanceof Date)
			b.label(this.date.print(this.dateFormat));
		else
			b.label(this.date);
		this.setMenu(this.getCalendar.$(this));
		b.addEventListener("onClick", button_onClick.$(this));
	};

        P.getValue = function() {
                return this.date instanceof Date ? this.date : null;
        };

});
