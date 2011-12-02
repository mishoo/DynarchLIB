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

var DlColor = {

	// thanks http://www.cs.rit.edu/~ncs/color/t_convert.html and google
	// for the following 2 algorithms

	// note that the values must be floating point numbers between 0 and 1
	RGB2HSV : function(rgb) {
		var r = rgb[0], g = rgb[1], b = rgb[2];
		var min, max, delta, h, s, v;
		min = Math.min(r, g, b);
		max = Math.max(r, g, b);
		v = max;
		delta = max - min;
		if (max != 0) {
			s = delta / max;
			if (r == max)
				h = (g - b) / delta;
			else if (g == max)
				h = 2 + (b - r) / delta;
			else
				h = 4 + (r - g) / delta;
			h *= 60;
			if (h < 0)
				h += 360;
		} else {
			s = 0;
			h = -1;
		}
		return [h, s, v];
	},

	HSV2RGB : function(hsv) {
		var h = hsv[0], s = hsv[1], v = hsv[2];
		var i, r, g, b, f, p, q, t;
		if (s == 0)
			r = g = b = v;
		else {
			h /= 60;
			i = Math.floor(h);
			f = h - i;
			p = v * (1 - s);
			q = v * (1 - s * f);
			t = v * (1 - s * (1 - f));
			switch (i) {
			    case 0  : r = v; g = t; b = p; break;
			    case 1  : r = q; g = v; b = p; break;
			    case 2  : r = p; g = v; b = t; break;
			    case 3  : r = p; g = q; b = v; break;
			    case 4  : r = t; g = p; b = v; break;
			    default : r = v; g = p; b = q; break;
			}
		}
		return [r, g, b];
	},

	RGB2bytes : function(rgb) {
		var b = new Array(3);
		b[0] = Math.round(rgb[0] * 255);
		b[1] = Math.round(rgb[1] * 255);
		b[2] = Math.round(rgb[2] * 255);
		return b;
	},

	RGB2color : function(rgb) {
		return String.buffer("rgb(",
				     rgb[0] * 100, "%,",
				     rgb[1] * 100, "%,",
				     rgb[2] * 100, "%)").get();
	},

	RGB2hex : function(rgb) {
		rgb = DlColor.RGB2bytes(rgb);
		return rgb[0].hex(2) + rgb[1].hex(2) + rgb[2].hex(2);
	},

	color2RGB : function(color) {
		var r = 0, g = 0, b = 0;
		if (/^#/.test(color)) {
			if (color.length == 4)
				color = color.replace(/([a-f0-9])/ig, "$1$1");
			r = parseInt(color.substr(1, 2), 16) / 255;
			g = parseInt(color.substr(3, 2), 16) / 255;
			b = parseInt(color.substr(5, 2), 16) / 255;
		} else
			throw new DlException("Can't parse color: " + color);
		return [r, g, b];
	},

	brighter : function(hsv) {
		var a = Array.$(hsv);
		a[1] -= 0.5;
		if (a[1] < 0)
			a[1] = 0;
		return a;
	},

	darker : function(hsv) {
		var a = Array.$(hsv);
		a[2] -= 0.5;
		if (a[2] < 0)
			a[2] = 0;
		return a;
	},

	// And that's from here: http://juicystudio.com/article/luminositycontrastratioalgorithm.php.
	// It returns a float value between 0 and 1 that determines how bright the given color is
	// If the returned value is > 0.6, I would use black to contrast.  White otherwise.
	RGBrightness : function(rgb) {
		return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
	}

};
