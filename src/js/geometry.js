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

function DlPoint(x, y) {
	if (typeof x == "object") {
		this.x = x.x;
		this.y = x.y;
	} else {
		this.x = x;
		this.y = y;
	}
};

DlPoint.prototype = {
	clone : function() {
		return new DlPoint(this.x, this.y);
	},
	normalize : function(p) {
		var tmp;
		if (this.x > p.x) { tmp = this.x; this.x = p.x; p.x = tmp; }
		if (this.y > p.y) { tmp = this.y; this.y = p.y; p.y = tmp; }
		return this;
	},
        distanceTo : function(p) {
                var a = Math.abs(p.x - this.x), b = Math.abs(p.y - this.y);
                return Math.sqrt(a * a + b * b);
        }
};

function DlRect(x, y, w, h) {
	if (x instanceof DlRect) {
		this.setFromRect(x);
	} else if (typeof x == "object") {
		if (typeof y == "object") {
			if (y instanceof DlPoint) {
				this.setFromPoints(x, y);
			} else {
				this.setFromValues(x.x, x.y, y.x, y.y);
			}
		} else {
			this.setFromValues(x.x, x.y, w, h);
		}
	} else {
		this.setFromValues(x, y, w, h);
	}
};

DlRect.prototype = {
	// SET functions
	setFromRect : function(r) {
		this.x = r.x;
		this.y = r.y;
		this.w = r.w;
		this.h = r.h;
		return this;
	},
	setFromPoints : function(p1, p2) {
		p1 = p1.clone().normalize(p2 = p2.clone());
		this.x = p1.x;
		this.y = p1.y;
		this.w = p2.x - p1.x + 1;
		this.h = p2.y - p1.y + 1;
		return this;
	},
	setFromValues : function(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		return this;
	},
	getTL : function() {
		return new DlPoint(this.x, this.y);
	},
	getBR : function() {
		return new DlPoint(this.x + this.w - 1, this.y + this.h - 1);
	},
	getPoints : function() {
		return [ getTL(), getBR() ];
	},
	height : function(h) {
		if (h != null)
			this.h = h;
		return this.h;
	},
	width : function(w) {
		if (w != null)
			this.w = w;
		return this.w;
	},
	containsPoint : function(p) {
		return this.x          <= p.x &&
			this.x + this.w  > p.x &&
			this.y          <= p.y &&
			this.y + this.h  > p.y;
	},
	intersect : function(r) {
		var ret = null,
			M = Math,
			dx = M.max(this.x, r.x),
			dy = M.max(this.y, r.y),
			dw = M.min(this.x + this.w, r.x + r.w) - dx,
			dh = M.min(this.y + this.h, r.y + r.h) - dy;
		if (dw > 0 && dh > 0)
			ret = new DlRect(dx, dy, dw, dh);
		return ret;
	},
	area : function() {
		return this.w * this.h;
	},
	makeDiv : function(bw, bc) {
		bc || (bc = "#000");
		bw == null && (bw = 0);
		var s = {
			position    : "absolute",
			left        : this.x + "px",
			top         : this.y + "px",
			width       : this.w - bw*2 + "px",
			height      : this.h - bw*2 + "px",
			overflow    : "hidden",
			lineHeight  : "1px",
			fontSize    : "1px",
			border      : bw + "px solid " + bc
		};
		s = DynarchDomUtils.createElement("div", s, { innerHTML: "&nbsp;" });
		// s.innerHTML = "<table align='center' style='height:100%'><tr><td>" + this.area();
		return s;
	},
	positionDiv : function(div) {
		div.style.left = this.x + "px";
		div.style.top = this.y + "px";
		div.style.height = this.h + "px";
		div.style.width = this.w + "px";
	},
	toString : function() {
		return this.w + "x" + this.h + "@" + this.x + "," + this.y;
	}
};
