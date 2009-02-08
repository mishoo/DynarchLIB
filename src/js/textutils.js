// @require jslib.js

DlTextUtils = (function(){

        var D, DOM = DynarchDomUtils, START_REGEXPS = [

                (/^(\s*[-*]+\s+)/), function(m) {
                        return [ m[0], " ".x(m[0].length), m[0].length ];
                },

                (/^(\s*[0-9]+\.\s+)/), function(m) {
                        return [ m[0], " ".x(m[0].length), m[0].length ];
                },

                (/^\s*([>|]\s*)*/), function(m) {
                        return [ m[0], m[0], m[0].length, /\n\s*([>|]\s*)*/g, "\n" ];
                },

                (/^\s+/), function(m) {
                        return [ m[0], m[0], m[0].length ];
                }

        ];

        function taKeyPress(ev) {
                if (!ev)
                        ev = window.event;

                // M-Q (fill-paragraph)
                if (ev.altKey && ev.charCode == 113) {
                        var val = D.fillText(this.value, 72, DOM.getSelectionRange(this).start),
                                scroll = { x: this.scrollLeft, y: this.scrollTop };
                        this.value = val.text;
                        DOM.setSelectionRange(this, val.pos, val.pos);
                        this.scrollLeft = scroll.x;
                        this.scrollTop = scroll.y;
                        return false;
                }
        };

        var RE_PARA = /\n([>|\s]*\n)+/g;
        function lastIndexOfRegexp(str, re, caret) {
                var m, pos = -1;
                re.lastIndex = 0;
                re.global = true;
                var last_post = -1;
                while (m = re.exec(str)) {
                        if (re.lastIndex >= caret)
                                break;
                        pos = re.lastIndex;
                        if (pos == last_post) {
                                throw "Repeated! " + pos;
                        }
                        last_post = pos;
                }
                return pos;
        };

        function nextIndexOfRegexp(str, re, caret) {
                re.lastIndex = caret;
                re.global = true;
                var m = re.exec(str);
                return m ? m.index : null;
        };

        return D = {

                getParagraph: function(text, pos) {
                        var start = lastIndexOfRegexp(text, RE_PARA, pos + 1), end = nextIndexOfRegexp(text, RE_PARA, pos);
                        if (start == -1)
                                start = 0;
                        if (end == null)
                                end = text.length;
                        return { start: start, end: end, text: text.substring(start, end) };
                },

                getFillPrefix: function(para) {
                        var i = 0, re, f, m;
                        while (i < START_REGEXPS.length) {
                                re = START_REGEXPS[i++];
                                f = START_REGEXPS[i++];
                                re.lastIndex = 0;
                                if (m = re.exec(para))
                                        return f(m);
                        }
                },

                fillParagraph: function(para, width, pos) {
                        var a = D.getFillPrefix(para), prefix = a[1], restPos = a[2];
                        var before = para.substr(0, restPos);
                        para = para.substr(restPos);
                        var d = 0;
                        if (a[3]) {
                                para = para.replace(a[3], function(s) {
                                        var r = a[4] || "";
                                        d = s.length - r.length;
                                        return r;
                                });
                        }
                        d = prefix.length - d;
                        para = para.replace(/\n/g, " ").replace(/([^.])\s\s+/g, "$1 ");
                        var re = new RegExp("(.{0," + (width - prefix.length) + "})(\\s+|$)", "g");
                        var m, buf = [], lastPos = 0, line, posDiff = 0;
                        while (m = re.exec(para)) {
                                if (re.index != lastPos)
                                        line = para.substring(lastPos, re.lastIndex);
                                else
                                        line = m[1];
                                lastPos = re.lastIndex;
                                if (lastPos < pos)
                                        posDiff += d;
                                if (!/\S/.test(line))
                                        break;
                                buf.push(line.trim(true));
                        }
                        return { text: before + buf.join("\n" + prefix), posDiff: posDiff };
                },

                fillText: function(text, width, pos) {
                        var p = D.getParagraph(text, pos);
                        var before = text.substr(0, p.start), after = text.substr(p.end);
                        var posInPara = pos - p.start;
                        var ret = D.fillParagraph(p.text, width, posInPara);
                        return { text: before + ret.text + after, pos: pos + ret.posDiff };
                },

                emacsipateTextarea: function(ta) {
                        DOM.addEvent(ta, is_ie ? "keydown" : "keypress", taKeyPress);
                }

        }

})();
