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
// @require elementcache.js

DEFINE_CLASS("DlCalendar", DlWidget, function(D, P, DOM) {

        var CE = DOM.createElement,
            AC = DOM.addClass,
            DC = DOM.delClass,
            CC = DOM.condClass;

	/**
	 * EVENT DOCS:
	 *
	 *    onChange -- called when the calendar display has been changed,
	 *    such as when the month/year is changing.  No args.
	 *
	 *    onSelect(cleared, otherMonth, secondClick) -- called when a date
	 *    is selected, but also upon onChange.  Upon onChange the selection
	 *    is cleared, so the "cleared" arg will be true.  "otherMonth" is
	 *    true a date from an adjacent month was clicked.  "secondClick" is
	 *    true when an already selected date was clicked.
	 *
	 */

        D.FIXARGS = function(args) {
                args.tagName = "table";
                this._dayNamesOn = -1;
                this._selectedDate = args.date && args.selected ? args.date.getDate() : 0;
        };

        D.CONSTRUCT = function() {
                if (!this._noinit)
			this.init();
        };

        D.DEFAULT_EVENTS = [ "onSelect", "onChange", "onRendered" ];

	D.DEFAULT_ARGS = {
		firstDay        : [ "firstDay"       , Date.getFirstDayOfWeek() ],
		fixedFirstDay   : [ "fixedFirstDay"  , true ],
		_weekNumbers    : [ "weekNumbers"    , false ],
		date            : [ "date"           , null ],
		selected        : [ "selected"       , true ],
		_navigation     : [ "navigation"     , 2 ],
		_navDisabled    : [ "navDisabled"    , false ],
		_omDisabled     : [ "omDisabled"     , false ],
		_noinit         : [ "noinit"         , false ],
		_withMenu       : [ "withMenu"       , false ],
                _disableHandler : [ "disableHandler" , Function.returnFalse ],
                _cal_tooltip    : [ "dayTooltip"     , null ],
                _infoDates      : [ "infoDates"      , null ],
                __tooltip       : [ "tooltip"        , getTooltip ]
	};

	P._createElement = function() {
		D.BASE._createElement.call(this);
		var trs, i, tr, td,
			table = this.getElement(),
                	tbody = DlElementCache.get("CAL_BODY");
		table.cellSpacing = table.cellPadding = table.border = 0;
		table.appendChild(DlElementCache.get("CAL_HEAD"));
		table.appendChild(tbody);
		if (this._weekNumbers) {
			trs = table.getElementsByTagName("tr");
			for (i = trs.length; --i >= 0;) {
				tr = trs[i];
				td = CE("td", null, { className: "DlCalendar-WeekNumber" });
				tr.insertBefore(td, tr.firstChild);
			}
		}
		tr = CE("tr");
		td = CE("td", null, null, tr);
		tr.className = "DlCalendar-Navigation";
		if (this._navigation == 0) {
			td.colSpan = this.getNCols();
			this._makeNavPart(td, 0);
		} else {
			var td1 = CE("td", null, null, tr);
			var td2 = CE("td", null, null, tr);
			if (this._navigation == 1) {
				td1.colSpan = this.getNCols() - 2;
				this._makeNavPart(td1, 0,
						  td, -1,
						  td2, 1);
			} else if (this._navigation == 2) {
				var td3 = CE("td", null, null, tr);
				var td4 = CE("td", null, null, tr);
				td2.colSpan = this.getNCols() - 4;
				this._makeNavPart(td2, 0,
						  td, -2,
						  td1, -1,
						  td3, 1,
						  td4, 2);
			}
		}
		i = table.rows[0];
		i.parentNode.insertBefore(tr, i);
		this.setUnselectable();

		if (this._withMenu)
			this._createQuickNavMenu();
	};

	var MENU = null;
	function getMenu() {
		if (!MENU) {
			MENU = new DlVMenu({});
			MENU.setStyle("textAlign", "center");
			new DlMenuItem({ parent: MENU, label: DlTEXTS.goToday, name: "today", noClose: true });
			MENU.addSeparator();

			var year = new DlSpinner({ parent: MENU, size: 4 });
 			year.addEventListener("onChange",
					      function() {
						      if (!year.validationError)
							      MENU.calendar.setYear(year.getValue());
					      });

			year.getElement().align = "center";
			MENU.addSeparator();
			(12).times(function(i){
				new DlMenuItem({ parent  : MENU,
						 label   : Date.getMonthName(i),
						 name    : i,
						 noClose : true });
			});

			MENU.addEventListener("onPopup",
					      function(args) {
						      this.calendar = args.widget;
						      year.setValue(this.calendar.date.getFullYear());
						      year.focus.$(year).delayed(5);
					      });

			MENU.addEventListener("onSelect",
					      function(mon) {
						      if (mon == "today") {
							      this.calendar.setToday();
						      } else {
							      this.calendar.setMonth(mon);
							      this.calendar.setYear(year.getValue());
						      }
						      MENU.getParent(DlPopup).hide();
					      });
		}
		return MENU;
	};

	P._createQuickNavMenu = function() {
		this.setContextMenu(getMenu);
	};

	P._makeNavPart = function() {
		for (var td, type, i = 0; i < arguments.length; ++i) {
			td = arguments[i++];
			type = arguments[i];
			td._navType = type;
			switch (type) {
			    case -2:
				//td.innerHTML = "«";
				td.className = "PrevYear";
				break;
			    case -1:
				//td.innerHTML = "‹";
				td.className = "PrevMonth";
				break;
			    case 0:
				td.className = "Month";
                                this.refNode("_monthTD", td);
				break;
			    case 1:
				//td.innerHTML = "›";
				td.className = "NextMonth";
				break;
			    case 2:
				//td.innerHTML = "»";
				td.className = "NextYear";
				break;
			}
		}
	};

	P.getNCols = function() {
		return this._weekNumbers ? 8 : 7;
	};

	P.getTableElement = function() {
		return this.getElement();
	};

	P._displayDayNames = function() {
		var td, today = new Date(), todayWD = today.getDay(),
			dnrow = this.getTableElement().getElementsByTagName("tr")[1],
			i = this._weekNumbers ? 1 : 0,
			j = this.firstDay;
		dnrow.className = "DlCalendar-DayNames";
		while (td = dnrow.cells[i++]) {
			td._firstDay = j % 7;
			CC(td, j == todayWD, "Today");
			td.innerHTML = Date.getDayName(j++, true);
			CC(td, Date.isWeekend(td._firstDay), "WeekEnd");
		}
		this._dayNamesOn = this.firstDay;
		if (this._weekNumbers) {
			td = dnrow.cells[0];
			td.innerHTML = "w";
			td._week = -1;
			td.className = "WeekNumber";
		}
	};

	P._displayCalendar = function() {
		var today = new Date(),
			TY = today.getFullYear(),
			TM = today.getMonth(),
			TD = today.getDate();

		this._selectedTD = null;

		if (this._dayNamesOn != this.firstDay)
			this._displayDayNames();
		var date = new Date(this.date);
		date.setHours(12);
		var month = date.getMonth();
		var mday = date.getDate();
		var year = date.getFullYear();
		var no_days = date.getMonthDays();

		this._monthTD.innerHTML = String.buffer(
			"<b>",
			Date.getMonthName(month, this._navigation == 2),
			"</b> ", year
		).get();

		// calendar voodoo for computing the first day that would actually be
		// displayed in the calendar, even if it's from the previous month.
		// WARNING: this is magic. ;-)
		date.setDate(1);
		var day1 = (date.getDay() - this.firstDay) % 7;
		if (day1 < 0)
			day1 += 7;
		date.setDate(-day1);
		date.setDate(date.getDate() + 1);

		// var row = this.getTableElement().getElementsByTagName("tr")[2];
		var row = this.getTableElement().rows[2];

		var cells = this._cells = [];
                var di = this._displayedInterval = {};
                var tmp;

		for (var i = 0; i < 6; ++i, row = row.nextSibling) {
			row.className = "Dates";
			var cell = row.firstChild;
			if (this._weekNumbers) {
				cell.className = "WeekNumber";
				cell.innerHTML = cell._week = date.getWeekNumber();
				cell = cell.nextSibling;
			}
			var iday;
			for (var j = 0; j < 7; ++j, cell = cell.nextSibling, date.setDate(iday + 1)) {
				var wday = date.getDay();
                                var cn = [];
				cell._iday = iday = date.getDate();
				cell._month = date.getMonth();
				cell._year = date.getFullYear();
                                cell._info = null;
                                tmp = { y: cell._year,
                                        m: cell._month,
                                        d: cell._iday };
                                if (this._infoDates) {
                                        var str = tmp.y + "-" + (1 + tmp.m).zeroPad(2) + "-" + tmp.d.zeroPad(2);
                                        var id = this._infoDates[str];
                                        if (id) {
                                                cell._info = id;
                                                cn.push(id.className || "DlCalendar-infoDay");
                                        }
                                }
                                if (!di.start)
                                        di.start = tmp;
				if ((cell._otherMonth = (month != tmp.m))) {
					cn.push("OtherMonth");
                                        cells[iday + (iday > 15 ? 100 : 200)] = cell;
				} else {
					if (month == TM && iday == TD && TY == tmp.y)
						cn.push("Today");
					if (this._selectedDate == iday) {
						this._selectCell(cell);
                                                cn.push("Selected");
                                        }
					cells[iday] = cell;
				}
				if (wday == 0 || wday == 6)
					cn.push("WeekEnd");
                                cell.disabled = this._disableHandler(date, cn, cell);
				cell.innerHTML = this.getDayHTML(iday);
                                cell.className = cn.join(" ");
			}
		}
                di.end = tmp;

                this.applyHooks("onRendered", [ this ]);
	};

        P.getDayHTML = Function.identity;

	P.getDateCell = function(date) {
		return this._cells[date];
	};

        P.getDisplayedInterval = function() {
                return this._displayedInterval;
        };

	P.selectDate = function(date, nohooks) {
		if (date instanceof Date) {
			if (!date.dateEqualsTo(this.date, true)) {
				this.date = new Date(date);
				this.init();
			}
			date = date.getDate();
		}
		this._selectCell(this.getDateCell(date), !nohooks);
	};

        P.clearSelection = function() {
                this._selectedDate = null;
                if (this._initialized) {
                        this._displayCalendar();
                }
        };

	function onMouseOver(ev) {
		this._clearTimer();
		var cell = ev.getParentElement("td", this);
		if (cell) {
			if (this._currentHover) {
				DC(this._currentHover, "hover");
				DC(this._currentHover, "rolling");
				this._currentHover = null;
                                DlWidget.getTooltip().hide();
			}
			if (cell._navType != null && this._navDisabled)
				return;
			if (cell._otherMonth && this._omDisabled)
				return;
			if ((cell._firstDay != null && this.fixedFirstDay) || cell._week != null)
				return;
                        if (cell.disabled)
                                return;
			AC(cell, "hover");
			this._currentHover = cell;
                        if (this.__tooltip)
                                this._popupTooltip();
		}
	};

	function onMouseLeave(ev) {
		this._clearTimer();
		if (this._currentHover) {
			DC(this._currentHover, "hover");
			DC(this._currentHover, "rolling");
			this._currentHover = null;
		}
	};

	P.setYear = function(y) {
		if (y != this.date.getFullYear()) {
			this.date.setFullYear(y);
			this.init();
		}
	};

	P.setMonth = function(m) {
		if (m != this.date.getMonth()) {
			this.date.setMonth(m);
			this.init();
		}
	};

	P.setToday = function() {
		var today = new Date();
                this._selectedDate = 0;
		this.date = today;
		this.init();
	};

	P._navCellClicked = function(cell, timeout, ev) {
		AC(cell, "rolling");
		this._selectedDate = 0;
		// FIXME: not sure this is good
		var d = this.date;
		if (cell._navType != 0)
			d.setDate(1);
		switch (cell._navType) {
		    case 0:
			if (this._withMenu) {
				this.applyHooks("onContextMenu", [ ev ]);
			} else {
				var today = new Date();
				if (d.dateEqualsTo(today, true))
					return;
				this.date = today;
			}
			break;
		    case -2:
			d.setFullYear(d.getFullYear() - 1);
			break;
		    case -1:
			d.setMonth(d.getMonth() - 1);
			break;
		    case 1:
			d.setMonth(d.getMonth() + 1);
			break;
		    case 2:
			d.setFullYear(d.getFullYear() + 1);
			break;
		}
		// this.init.$(this).delayed(1);
		this.init();
		this.applyHooks("onChange", [ cell._navType ]);
		this.applyHooks("onSelect", [ true, cell._navType, null, d ]);
		if (timeout && cell._navType != 0) {
			++this._timerStep;
			this._timer = setTimeout(
				this._navCellClicked.$(
					this,
					cell,
					this._timerStep > 4 ? 50 : 100),
				timeout);
		}
	};

	P._clearTimer = function() {
		if (this._timer)
			clearTimeout(this._timer);
		this._timer = null;
		this._timerStep = 0;
	};

	function onClick(ev) {
		onMouseOver.call(this, ev);
		var cell = ev.getParentElement("td", this);
		if (!cell)
			return;
		if (ev.button != 0 && (cell._navType != null || cell._otherMonth))
			return;
		if (cell._otherMonth && this._omDisabled || cell.disabled)
			return;
		if (cell._navType != null && ev.dl_type == "onMouseDown") {
			this._navDisabled ||
				this._navCellClicked(cell, cell._navType != 0 ? 350 : 0, ev);
		} else if (cell._year != null && ev.dl_type == "onMouseUp") {
			var d = this.date;
			d.setFullYear(cell._year, cell._month, cell._iday);
			var old_date = this._selectedDate;
			this._selectedDate = cell._iday;
			if (cell._otherMonth) {
				this.init();
				this.applyHooks("onSelect", [ false, true, false, d ]);
			} else if (old_date != this._selectedDate) {
				this._selectCell(cell, true);
			} else {
				this.applyHooks("onSelect", [ false, false, true, d ]);
			}
		} else if (cell._firstDay != null && !this.fixedFirstDay && ev.button == 0 && ev.dl_type == "onMouseDown") {
			this.firstDay = cell._firstDay;
			this._displayCalendar();
		}
	};

	P._selectCell = function(cell, hooks) {
		this._selectedDate = cell._iday;
		if (this._selectedTD) {
			DC(this._selectedTD, "Selected");
			DC(this._selectedTD.parentNode, "Selected");
		}
		this._selectedTD = cell;
		AC(cell, "Selected");
		AC(cell.parentNode, "Selected");
		DC(cell, "hover");
		if (hooks)
			this.applyHooks("onSelect", [ false, false, false, this.date ]);
	};

	P._setListeners = function() {
		D.BASE._setListeners.call(this);
		this.addEventListener({ onMouseOver  : onMouseOver,
					onMouseLeave : onMouseLeave,
					onMouseUp    : onClick,
					onMouseDown  : onClick });
	};

        P.setInfoDates = function(a) {
                this._infoDates = a;
                if (this._initialized)
                        this._displayCalendar();
        };

        // called in the context of the DlTooltip object
        function getTooltip() {
                var cal = this.args.widget, di, td;
                td = cal._currentHover;
                if (td)
                        di = td._info;
                td = cal._cal_tooltip;
                return td ?
                        td.call(cal, di)
                        : di
                        ? di.tooltip
                        : null;
        };

	P.init = function() {
		if (!this.date)
			this.date = new Date();
		this._displayCalendar();
                this._initialized = true;
	};

        P.setSize = P.setOuterSize = function(sz) {
                D.BASE.setOuterSize.call(this, { x: sz.x != null ? sz.x + 2 : null,
                                                 y: sz.y });
        };

});
