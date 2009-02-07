// @require jslib.js

DlTextUtils = (function(){

        var D, DOM = DynarchDomUtils, START_REGEXPS = [

                /^(\s*[-*]+\s+)/, function(m) {
                        return [ m[0], " ".x(m[0].length), m[0].length ];
                },

                /^(\s*[0-9]+\.\s+)/, function(m) {
                        return [ m[0], " ".x(m[0].length), m[0].length ];
                },

                /^\s*([>|]\s*)*/, function(m) {
                        return [ m[0], m[0], m[0].length, /\n\s*([>|]\s*)*/g, "\n" ];
                },

                /^\s+/, function(m) {
                        return [ m[0], m[0], m[0].length ];
                }

        ];

        function taKeyPress(ev) {
                if (!ev)
                        ev = window.event;

                // M-Q (fill-paragraph)
                if (ev.altKey && ev.charCode == 113) {
                        var val = D.fillText(this.value, 72, DOM.getSelectionRange(this).start);
                        this.value = val.text;
                        DOM.setSelectionRange(this, val.pos, val.pos);
                        return false;
                }
        };

        return D = {

                getParagraph: function(text, pos) {
                        var start = text.lastIndexOf("\n\n", pos - 1), end = text.indexOf("\n\n", pos);
                        if (start == -1)
                                start = 0;
                        else
                                start += 2;
                        if (end == -1)
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
                        if (a[3])
                                para = para.replace(a[3], a[4] || "");
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
                                        posDiff++;
                                if (!/\S/.test(line))
                                        break;
                                buf.push(line.trim(true));
                        }
                        // XXX: should compute the point (pos) difference
                        return { text: before + buf.join("\n" + prefix), posDiff: posDiff * prefix.length };
                },

                fillText: function(text, width, pos) {
                        var p = D.getParagraph(text, pos);
                        var before = text.substr(0, p.start), after = text.substr(p.end);
                        var posInPara = pos - p.start;
                        var ret = D.fillParagraph(p.text, width, posInPara);
                        return { text: before + ret.text + after, pos: pos };
                },

                emacsipateTextarea: function(ta) {
                        DOM.addEvent(ta, is_ie ? "keydown" : "keypress", taKeyPress);
                }

        }

})();
