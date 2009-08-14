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
