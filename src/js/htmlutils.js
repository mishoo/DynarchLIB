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

// @require jslib.js

DlHtmlUtils = {

	_blockTags : ("body form textarea fieldset ul ol dl dd dt li div blockquote " +
		      "p h1 h2 h3 h4 h5 h6 quote pre table thead " +
		      "tbody tfoot tr td iframe address").hashWords(),

	_quickTags : "br hr input link meta img".hashWords(),

	_headingTags : "h1 h2 h3 h4 h5 h6".hashWords(),

	_descTags : "p blockquote td div li".hashWords(),

	isBlockElement : function(el) {
		return el && el.nodeType == 1 && (el.tagName.toLowerCase() in DlHtmlUtils._blockTags);
	},

	needsClosingTag : function(el) {
		return el && el.nodeType == 1 && !(el.tagName.toLowerCase() in DlHtmlUtils._quickTags);
	},

	htmlEncode : function(s) {
 		return String(s)
                        .replace(/&/g, "&amp;")
 			.replace(/</g, "&lt;")
 			.replace(/>/g, "&gt;")
 			.replace(/\x22/g, "&quot;")
 			.replace(/\u00A0/g, "&#xa0;");
	},

	getHTML : function(root, outputRoot, withMeta) {
		var D		     = DlHtmlUtils;
		var html	     = [];
		var hi		     = 0;
		var needsClosingTag  = D.needsClosingTag;
		var htmlEncode	     = D.htmlEncode;
		var getText	     = D.getInnerText;
		var title	     = null;
		var description	     = null;
		var content_start    = null;
		var descTags	     = D._descTags;
		var headingTags	     = D._headingTags;
		var newlineMode      = 0;
		function rec(root, outputRoot) {
                        var i;
			switch (root.nodeType) {
			    case 11: // DOCUMENT_FRAGMENT
				outputRoot = false;
			    case 1: // ELEMENT
				var tag = root.tagName.toLowerCase();
                                if (root.className == "DynarchLIB-REMOVE-ME")
                                        break;
				if (outputRoot) {
					var closed = !(root.hasChildNodes() || needsClosingTag(root));
					if (tag == "br") {
						if (root.previousSibling && !root.nextSibling)
							break;
						if (newlineMode) {
							html[hi++] = "\n";
							break;
						}
					}
					if (withMeta) {
						if (title == null && tag in headingTags) {
							title = getText(root);
							content_start = 0; // content starts after this tag!
						} else if (description == null && tag in descTags) {
							description = getText(root);
						}
					}
					html[hi++] = "<";
					html[hi++] = tag;
					var attrs = root.attributes;
					for (i = 0; i < attrs.length; ++i) {
						var a = attrs.item(i);
						if (!a.specified)
							continue;
						var name = a.nodeName.toLowerCase();
						if (/^_moz|^_msh/.test(name))
							continue;
						var value;
						if (name != "style") {
							if (typeof root[a.nodeName] != "undefined"
							    && name != "href"
							    && name != "src"
							    && !/^on/.test(name))
								value = root[a.nodeName];
							else
								// FIXME: IE converts URL-s to absolute
								value = a.nodeValue;
						} else
							value = root.style.cssText;
						if (/(_moz|^$)/.test(value))
							continue;
						html[hi++] = " " + name + '="' + htmlEncode(value) + '"';
					}
					html[hi++] = closed ? " />" : ">";
				}
				if (tag == "pre")
					++newlineMode;
				for (i = root.firstChild; i; i = i.nextSibling)
					rec(i, true);
				if (tag == "pre")
					--newlineMode;
				if (outputRoot && !closed)
					html[hi++] = "</" + tag + ">";
				if (content_start === 0)
					content_start = hi;
				break;
			    case 3: // TEXT
				if (/^(script|style)$/i.test(root.parentNode.tagName)) {
					if (root.data.indexOf("/*<![CDATA[*/") != 0) {
						html[hi++] = "/*<![CDATA[*/";
						html[hi++] = root.data;
						html[hi++] = "/*]]>*/";
					} else {
						html[hi++] = root.data;
					}
				} else
					html[hi++] = root.data.htmlEscape();
				break;

			    case 4: // CDATA_SECTION_NODE -- WARNING! this is technically a mistake
			    case 8: // COMMENT
				html[hi++] = "<!--";
				html[hi++] = root.data;
				html[hi++] = "-->";
				break;
			}
		};
		rec(root, outputRoot);
		var content = html.join("");
		if (withMeta) {
			content = { title	    : title,
				    description	    : description,
				    content	    : content,
				    contentButTitle : "" };
			if (content_start)
				content.contentButTitle = html.slice(content_start).join("");
		}
		return content;
	},

	getInnerText : function(el) {
		if (el.innerText != null)
			return el.innerText;
		if (el.textContent != null)
			return el.textContent;
	},

	getText : function(node) {
		var tmp = node.cloneNode(true);
		var a = tmp.getElementsByTagName("*");
		for (var i = a.length; --i >= 0;) {
			var el = a[i];
			if (DlHtmlUtils.isBlockElement(el)) {
				var sep = el.ownerDocument.createTextNode(" ");
				el.insertBefore(sep, el.firstChild);
				el.appendChild(sep.cloneNode(true));
			}
		}
		var txt = DlHtmlUtils.getInnerText(tmp);
                DynarchDomUtils.trash(tmp);
                return txt;
	},

	_can_t_DeleteFull_tags : "td".hashWords(),

	canDeleteFullNode : function(tag) {
		return !(tag.toLowerCase() in DlHtmlUtils._can_t_DeleteFull_tags);
	},

	_can_t_DeleteContent_tags : "ul ol dd table tr img br hr".hashWords(),

	canDeleteContent : function(tag) {
		return !(tag.toLowerCase() in DlHtmlUtils._can_t_DeleteContent_tags);
	},

	_can_t_StripNode_tags : "ul ol li dd dt dl img br hr table tr td object applet iframe form textarea".hashWords(),

	canStripNode : function(tag) {
		return !(tag.toLowerCase() in DlHtmlUtils._can_t_StripNode_tags);
	}

};
