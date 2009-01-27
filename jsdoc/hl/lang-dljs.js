/**************\
 *                                                                ____   _____
 * DlHighlight -- a JavaScript-based syntax highlighting engine.  \  /_  /   /
 *                                                                 \  / /   /
 *        Author: Mihai Bazon, http://mihai.bazon.net/blog          \/ /_  /
 *     Copyright: (c) Dynarch.com 2007.  All rights reserved.        \  / /
 *                http://www.dynarch.com/                              / /
 *                                                                     \/
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
\******************************************************************************/

// Inherits most parsers from JS, but hyperlinks Dl objects

(function(){

        var H = DlHighlight, js = H.LANG.js;
        var lang = H.cloneLang("js", "dljs");
        lang.start = js.start;

        function WORD(txt) {
                var out = js.T.WORD.call(this, txt);
                if (out && out.style == "operand") {
                        if (/^Dl/.test(out.content)) {
                                out.content = { escaped: "<a href='api://" + out.content + ".xml'>" + out.content + "</a>" };
                        }
                }
                return out;
        };

        lang.tokens[3] = WORD;

})();
