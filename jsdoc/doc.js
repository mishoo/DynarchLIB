var App = {};

(function() {

        var $ = function(el) {
                return typeof el == "string" ? document.getElementById(el) : el;
        };

	var desktop;

	function $url(url) {
		return "jsdoc/" + url + "?killCache=" + new Date().getTime();
	};

	function $urlSample(url) {

                // unbelievable, the following causes a syntax error in Opera!!
//                 if (/^api:\x2f\x2f(.*)/.test(url)) {
//                         return $url("genapi/" + RegExp.$1);
//                 } else if (/^sample:\x2f\x2f(.*)/.test(url)) {
//                         return $url("samples/" + RegExp.$1);
//                 }

                if (url.indexOf("api://") == 0)
                        return $url("genapi/" + url.substr(6));
                if (url.indexOf("sample://") == 0)
                        return $url("samples/" + url.substr(9));
	};

        function parseURL(hash) {
                var a = hash.split(/:\x2f\x2f/);
                var proto = a[0];
                var url = a[1];
                a = url.split(/[:=]/);
                var page = a.shift();
                return {
                        proto : proto,
                        page  : proto + "://" + page,
                        args  : a.toHash2(),
                        url   : proto + "://" + url
                };
        };

	function initTree() {
                var gotTrees = 0;
                function finalize() {
                        if (++gotTrees == 2) {
                                var hash = window.location.hash.toString().indexOf("#");
                                if (hash >= 0) {
                                        hash = window.location.hash.toString().substr(hash + 1);
                                        goToLocalUrl(hash);
                                }
                        }
                };
		new DlRPC({ url: $urlSample("sample://outline.xml"),
			    callback: function(res) {
				    initTree.dataIn(res.xml.documentElement, SAMPLES_TREE, true);
                                    finalize();
			    }}).call();
                new DlRPC({ url: $urlSample("api://outline.xml"),
			    callback: function(res) {
				    initTree.dataIn(res.xml.documentElement, API_TREE, true);
                                    finalize();
			    }}).call();
	};

	var SAMPLES_GROUP;
	var SAMPLES_TREE;
        var API_TREE;
	var PAGE_CONTENT;
	var BUTTONS_BY_PAGE = {};
        var TABS;

        var GO_TO_ELEMENT_ID;
        var GO_TO_SCROLL;
        var FINAL_URL;

	eval(DynarchDomUtils.importCommonVars());

	initTree.dataIn = function(root, tree, isRoot) {
		Array.$(root.childNodes).foreach(function(item){
			if (item.tagName == "item") {
				if (isRoot)
					// add a spacer before each root item
					new DlWidget({ parent: tree, className: "Spacer" });
                                var label = item.getAttribute("label"), src = item.getAttribute("src"), rb, ti;
				ti = new DlTreeItem({ parent    : tree,
                                                      className : "DlTreeItem-withRadio" });
                                if (src) {
				        rb = new DlRadioButton({ label: label,
							         checked: false,
							         parent: ti,
							         group: SAMPLES_GROUP,
							         data: src });
                                        BUTTONS_BY_PAGE[src] = rb;
                                        ti.button = rb;
                                } else {
                                        rb = new DlLabel({ parent: ti, label: label });
                                }
				if (isRoot) {
					rb.addClass("DocTreeItem-Root");
					ti.setIconClass("IconBooks");
				} else {
					ti.setIconClass(src ? "IconPage" : "IconBooks");
				}
				var hasSubitems = item.getElementsByTagName("item").length > 0;
				if (hasSubitems) {
					var tmp = new DlTree({});
					ti.setTree(tmp);
					if (isRoot) {
						ti.expand();
					}
					initTree.dataIn(item, tmp, false);
				}
			} else if (item.tagName == "sep") {
				tree.addSeparator();
			}
		});
	};

        function localLinkClicked(url) {
                this.blur();
                goToLocalUrl(url);
                return false;
        };

        function saveCurrentScroll() {
                if (HISTORY.length > 0) {
                        var uh = HISTORY.isMoving
                                ? HISTORY[HISTORY.prev_pointer]
                                : HISTORY[HISTORY.pointer];
                        if (uh)
                                uh.scroll = PAGE_CONTENT.getScroll();
                }
        };

        function goToLocalUrl(url) {
                url = url.replace(/^#+/, "");
                var a = parseURL(url);
                if (a.proto == "api") {
                        var type = a.args.type;
                        var method = a.args.func;
                        if (method) {
                                GO_TO_ELEMENT_ID = method + ":" + type;
                                FINAL_URL = url;
                        }
                }
                var rb = BUTTONS_BY_PAGE[a.page];
		if (rb) {
                        saveCurrentScroll();
                        if (!rb.checked()) {
			        rb.checked(true); // this automatically calls hooks and updates the page content
                        } else {
                                updateScroll(rb, a.url);
                                updateHistory(rb);
                        }
		} else {
			alert("Sorry, this page doesn't seem to exist: " + a.url);
                }
        };

        function goToHistoryLocation(h) {
                GO_TO_SCROLL = h.scroll;
                goToLocalUrl(h.url);
        };

	function processContent(data, rb) {
		DlHighlight.HELPERS.highlightByName("dlhl", "pre");
		Array.$(PAGE_CONTENT.getElement().getElementsByTagName("div")).r_foreach(function(el){
			var sample = el.getAttribute("sample");
			if (sample) {
				var c = data.code.split[sample];
				var div = document.createElement("div");
				var code = c.text;
				try {
                                        var type = c.type == "js" ? "dljs" : c.type;
					var hl = new DlHighlight({ lang: type });
					code = DlHighlight.removeIndentation(code);
					code = hl.doItNow(code.replace(/\x2f\x2f@include ([^\s]+)/g, ""));
				} catch(ex) {}
				div.className = "CodeSample";
				div.innerHTML = [ "<div class='CodeSample-padding'><pre class='DlHighlight ", c.type, "'>",
						  code, "</pre></div>" ].join("");
				if (c.canrun) {
					var controls = document.createElement("div");
					controls.className = "Controls";
					var tb = new DlHbox({ parent      : PAGE_CONTENT,
							      appendArgs  : controls });

					var label = new DlLabel({ parent: tb, label: sample });
					// div.appendChild(controls);
					div.insertBefore(controls, div.firstChild);
                                        tb.addFiller();
					var runBtn = new DlButton({ parent: tb, label : "Run it!" });
					runBtn.addEventListener("onClick", runSample.$C(c, data.code, div));
				} else if (c.autorun) {
                                        eval(c.text);
                                }
				el.parentNode.replaceChild(div, el);
			}
                        var list = el.getAttribute("list");
                        if (list) {
                                var html = String.buffer();
                                function listItem(it) {
                                        var tree = it.getSubtreeWidget();
                                        if (tree) {
                                                html("<ul>");
                                                var items = tree.getItems();
                                                items.foreach(function(ti) {
                                                        var src = ti.button.userData;
                                                        var label = ti.button.label();
                                                        html("<li><a href='", src, "'>", label, "</a>");
                                                        listItem(ti);
                                                        html("</li>");
                                                });
                                                html("</ul>");
                                        }
                                };
                                listItem(rb.parent);
                                el.innerHTML = html.get();
                        }
		});
		// add navigation bar (prev / next page)

		var tr = CE("tr", null, null,
			    CE("tbody", null, null,
			       CE("table", null, { className: "NavLinks" }, PAGE_CONTENT.getElement().firstChild)));

		var prev = SAMPLES_GROUP.getPrevButton();
 		var td = CE("td", null, { className: "Prev" }, tr);
		if (prev) {
			td.innerHTML = "<a href='" + prev.userData + "'>« " + prev.label() + "</a>";
		}

		var next = SAMPLES_GROUP.getNextButton();
 		td = CE("td", null, { className: "Next" }, tr);
		if (next) {
			td.innerHTML = "<a href='" + next.userData + "'>" + next.label() + " »</a>";
		}

		Array.$(PAGE_CONTENT.getElement().getElementsByTagName("a")).r_foreach(function(link){
			var href = link.getAttribute("href").replace(/\x2f+$/, "");
			if (/^(sample|api):\x2f\x2f(.*)$/.test(href)) {
				link.onclick = localLinkClicked.$(link, RegExp.$1 + "://" + RegExp.$2);
			}
		});

// 		try {
// 			var tree = rb.parent.getSubtreeWidget();
// 			if (tree)
// 				tree.destroy();
// 		} catch(ex) {};
//
//  		Array.$(PAGE_CONTENT.getElement().getElementsByTagName("h2")).foreach(function(el){
//  			var ti = rb.parent;
//  			var subitem = new DlTreeItem({ label: DlHtmlUtils.getInnerText(el) });
//  			ti.addSubItem(subitem);
//  			subitem.addEventListener("onClick", function() {
// 				rb.checked(true);
//  				el.scrollIntoView();
//  			});
//  		});
	};

	var SAMPLE_DLG = null;
	function runSample(part, allCode, el) {
		var d = SAMPLE_DLG;
		var text = part.text;
		if (part.sample)
			text = allCode.samples[part.sample];
		(4).times(function(){
			text = text.replace(/^\s*\x2f\x2f@include ([^\s]+)/g, function(a, b) {
				var s = allCode.split[b];
                                if (s)
                                        return s.text;
                                return allCode.samples[b];
			});
		});
                text = DlHighlight.removeIndentation(text);
		if (part.canrun == "inline") {
			if (!part.canvas) {
				part.canvas = new DlContainer({ parent: PAGE_CONTENT, className: "CodeInlineCanvas" });
				el.parentNode.insertBefore(part.canvas.getElement(), el.nextSibling);
			} else
				part.canvas.destroyChildWidgets();
			function getDocCanvas() {
				return part.canvas;
			};
			eval(text);
		} else {
			if (!d) {
				d = SAMPLE_DLG = new DlDialog({ title	  : "Run code samples",
								resizable : true,
								quitBtn	  : "hide" });
				var layout = new DlLayout({ parent: SAMPLE_DLG, outerSpace: 2 });
				d.entry = new DlEntry({ type: "textarea", noWrap: true, className: "CodeEditor" });
				d.output = new DlContainer({ className: "CodeOutput", scroll: true });
				var box = new DlHbox({ borderSpacing: 2 });
				var runBtn = new DlButton({ parent: box, label: "Execute".fixedWidth("5em"), focusable: true });
                                box.addFiller();
				var close = new DlButton({ parent: box, label: "Close".fixedWidth("5em"), focusable: true });

				close.addEventListener("onClick", function(){
					d.output.destroyChildWidgets();
					d.output.setContent($("c-runSampleInfo").cloneNode(true));
					d.hide();
				});
				runBtn.addEventListener("onClick", _executeSample.$C(SAMPLE_DLG));

				d.output.setContent($("c-runSampleInfo").cloneNode(true));

				layout.packWidget(box, { pos: "bottom", after: 2 });
				layout.packWidget(d.entry, { pos: "left", fill: "60%" });
				layout.packWidget(new DlResizeBar({ widget: d.entry }), { pos: "left" });
				layout.packWidget(d.output, { pos: "right", fill: "*" });

				layout.setSize({ x: 600, y: 400 });
				d.centerOnParent();
			}
			d.sample = part;
			d.entry.setValue(text);
			d.show();
			_executeSample(SAMPLE_DLG);
		}
	};

        var HISTORY = window.H = [];
        HISTORY.pointer = -1;

        function _conv_one_api_link(l) {
                var a = l.split(/\s*\|\s*/)
                , text = a[1] || l;
                l = a[0];

                if (/\.xml$/.test(l)) {
                        return "<a href='sample://" + l + "'>" + text + "</a>";
                }

                if (/^[a-z0-9_\$]+$/i.test(l)) {
                        return "<a href='api://" + l + ".xml'>" + text + "</a>";
                }

                if (/^[a-z0-9_\$]+\.js$/i.test(l)) {
                        return "<a href='" + Dynarch.getFileURL("[% GET '../full-source/' IF final %]js/" + l) + "' target='_blank'>" + text + "</a>";
                }

                if (/^([a-z0-9_\$]+)(\.|::)([a-z0-9_\$]+)\(\)$/i.test(l)) {
                        var oname = RegExp.$1
                        , type = RegExp.$2 == "::" ?
                                "object_method" : "static_method"
                        , mname = RegExp.$3;
                        return "<a href='api://" + oname + ".xml:type=" + type + ":func=" + mname + "'>" + text + "</a>";
                }
        };

        function convertAPILinks(s, p) {
                var a = p.split(/\s*,\s*/);
                a = a.map(_conv_one_api_link);
                return a.join(", ");
        };

        function updateHistory(rb) {
                if (!rb)
                        rb = SAMPLES_GROUP.getSelected()[0];
                if (rb && rb.getValue()) {
                        // save history location
                        var h = {
                                url     : window.location.hash.toString().replace(/^#+/, ""),
                                label   : rb.getValue().title,
                                scroll  : { x: PAGE_CONTENT.getElement().scrollLeft,
                                            y: PAGE_CONTENT.getElement().scrollTop }
                        };
                        if (!HISTORY.isMoving) {
                                if (HISTORY.pointer >= 0) {
                                        var tmp = HISTORY.splice(HISTORY.pointer, HISTORY.length - HISTORY.pointer);
                                        tmp.reverse();
                                        HISTORY.push.apply(HISTORY, tmp);
                                }
                                // HISTORY.remove(data.file);
                                HISTORY.push(h);
                                if (HISTORY.length > 20)
                                        HISTORY.splice(0, 1);
                                HISTORY.pointer = HISTORY.length - 1;
                        }
                        HISTORY.BACK.disabled(HISTORY.pointer <= 0);
                        HISTORY.FORWARD.disabled(HISTORY.pointer >= HISTORY.length - 1);
                        HISTORY.HIST.disabled(HISTORY.length < 1);
                        // HISTORY.HIST.getButton().label(data.title);
                        HISTORY.isMoving = false;
                }
        };

        function updateScroll(rb, url) {
                var pos = GO_TO_SCROLL || { x: 0, y: 0 };
                if (GO_TO_ELEMENT_ID)
                        pos = { x: 0, y: document.getElementById(GO_TO_ELEMENT_ID).offsetTop };
		var el = PAGE_CONTENT.getElement();
		el.scrollLeft = pos.x;
		el.scrollTop = pos.y;
                GO_TO_ELEMENT_ID = GO_TO_SCROLL = null;
                url = FINAL_URL || url;
                FINAL_URL = null;
		window.location.replace("#" + (url || rb.getValue().file));
        };

        var TMPL_TITLE = String.template("DynarchLIB Documentation ($title)");

	function displayPage(rb) {
                if (!rb.userData)
                        return;
                saveCurrentScroll();
		var data = rb.getValue();
		rb.parent.expandParents(true);
		function display() {
			var content = data.content;
			if (!content) {
                                var text = data.text.replace(/〈(.*?)〉/g, convertAPILinks);
                                var title = data.title.replace(/〈(.*?)〉/g, convertAPILinks);
 				PAGE_CONTENT.setContent([ "<div>", "<h1>", title, "</h1>",
 							  text, "</div>" ]);
				processContent(data, rb);
				data.content = PAGE_CONTENT.getElement().firstChild;
			} else {
				PAGE_CONTENT.setContent(content);
			}
                        document.title = TMPL_TITLE(data);
                        updateScroll(rb);
                        updateHistory();
		};
                if (/^api:/.test(rb.userData)) {
                        TABS.showPane(1);
                } else if (/^sample:/.test(rb.userData)) {
                        TABS.showPane(0);
                }
		if (!data) {
			rb.oldIconClass = rb.parent.iconClass;
			rb.parent.setIconClass("IconAjaxLoader");
			new DlRPC({ url: $urlSample(rb.userData),
				    callback: function(res) {
					    if (!res.success) {
						    alert("ERROR loading sample:\n\nCode:" + res.status + "\n\n" + res.statusText);
						    return false;
					    }
					    var xml = res.xml.documentElement;
					    var title = DlHtmlUtils.getHTML(xml.getElementsByTagName("title")[0]);
					    var label = xml.getElementsByTagName("label");
					    if (label.length > 0) {
						    label = DlHtmlUtils.getHTML(label[0]);
						    rb.setLabel(label);
					    } else {
						    label = title;
					    }
					    var text = Array.$(xml.getElementsByTagName("text")).map(DlHtmlUtils.getHTML).join("\n\n");
					    // var code = Array.$(xml.getElementsByTagName("code")).map(DlHtmlUtils.getHTML).join("\n\n");
					    var code = {
						    split : {},
						    samples : {}
					    };
					    Array.$(xml.getElementsByTagName("code")).foreach(function(el) {
						    var c = el.firstChild.data.replace(/^\n+/, "").replace(/\s+$/, "");
						    var sample = el.getAttribute("sample");
						    if (sample) {
							    if (!code.samples[sample])
								    code.samples[sample] = "";
							    else
								    code.samples[sample] += "\n\n";
							    code.samples[sample] += c;
						    }
						    var id = el.getAttribute("id");
						    if (id)
							    code.split[id] = { text    : c,
									       type    : el.getAttribute("type"),
									       canrun  : el.getAttribute("canrun"),
                                                                               autorun : el.getAttribute("autorun"),
									       sample  : sample
									     };
					    });
					    data = {
						    label : label,
						    title : title,
						    text  : text,
						    code  : code,
						    file  : rb.userData
					    };
					    rb.setValue(data);
					    display();
					    rb.parent.setIconClass(rb.oldIconClass);
				    }}).call();
		} else {
			display();
		}
	};

        DlDesktop.prototype._handle_focusKeys = function(ev) {
                if (ev.altKey || ev.ctrlKey) {
                        this._handleKeybinding(ev);
                }
        };

	App.init = function() {

		desktop = new DlDesktop({ className: "DlWidget-3D", focusable: true });
		desktop.fullScreen();

		var layout = new DlLayout({ parent: desktop,
					    outerSpace: 2 });

		var top = new DlContainer({});
		var left = TABS = new DlTabs({ tabPos: "top" });
                left.setTabAlign("center");
		var right = PAGE_CONTENT = new DlContainer({ scroll: true, className: "DocCont DocText" });
		var resizeBar = new DlResizeBar({ widget: left, continuous: false });
		var bottom = new DlContainer({});

 		layout.packWidget(top, { pos: "top", after: 2 });
		layout.packWidget(bottom, { pos: "bottom", after: 2 });
		layout.packWidget(left, { pos: "left", fill: 250, min: 50, max: 600 });
		layout.packWidget(resizeBar, { pos: "left" });

		layout.packWidget(right, { pos: "left", fill: "*" });

		PAGE_CONTENT.setContent($("c-initPage"));
		bottom.setContent($("c-statusBar"));

		initToolbar(top, left);

                var tree_cont = new DlContainer({ scroll: true, className: "DocTree" });
                left.addTab(tree_cont, "Intro");

                var api_cont = new DlContainer({ scroll: true, className: "DocTree" });
                left.addTab(api_cont, "API");

                // var index_cont = new DlContainer({ scroll: true, className: "DocTree" });
                // left.addTab(index_cont, "Index");

                left.getTabBar().addClass("DocTabBar");

                left.showPane(0);

		desktop.callHooks("onResize");

                var LAST_SELECTED = null;

                SAMPLES_GROUP = DlRadioGroup.get();
		SAMPLES_GROUP.addEventListener("onChange", displayPage);
		SAMPLES_TREE = new DlTree({ parent: tree_cont });
                API_TREE = new DlTree({ parent: api_cont });

		initTree();
	};

        function printPage() {
                window.open("jsdoc/print.html", "DYNARCHLIBPRINT");
        };

        App.printReady = function(win) {
                win.document.getElementById("doc").innerHTML = PAGE_CONTENT.getElement().innerHTML;
                win.focus();
        };

	function initToolbar(cont, left) {
		var tb = new DlHbox({ parent: cont, borderSpacing: 1 });

		var link = new DlWidget({ parent: tb });
		link.setContent($("c-leftLink"));

                var back = HISTORY.BACK = new DlButton({ parent: tb, label: "Back", iconClass: "IconBack", disabled: true });
                var forward = HISTORY.FORWARD = new DlButton({ parent: tb, label: "Next", iconClass: "IconForward", disabled: true });

                tb.addSeparator("wide-separator");

                var hist = HISTORY.HIST = new DlButtonMenu({ parent: tb, label: "History", iconClass: "IconHistory", connected: true, disabled: true });
                var histMenu = null;
                hist.setMenu(function() {
                        if (histMenu)
                                histMenu.destroy();
                        histMenu = new DlVMenu({});
                        HISTORY.r_foreach(function(h, i){
                                var label = h.label;
                                var args = { parent: histMenu, label: label, data: h };
                                if (i == HISTORY.pointer) {
                                        args.label = label.bold();
                                } else {
                                        args.name = h.url;
                                }
                                var item = new DlMenuItem(args);
                        });
                        histMenu.addEventListener("onSelect", function(page, item){
                                HISTORY.isMoving = true;
                                HISTORY.prev_pointer = HISTORY.pointer;
                                HISTORY.pointer = HISTORY.find(item.userData);
                                goToHistoryLocation(item.userData);
                        });
                        return histMenu;
                });

                back.addEventListener("onClick", function() {
                        if (!HISTORY.isMoving) {
                                HISTORY.isMoving = true;
                                HISTORY.prev_pointer = HISTORY.pointer--;
                                var page = HISTORY[HISTORY.pointer];
                                goToHistoryLocation(page);
                        }
                });

                forward.addEventListener("onClick", function() {
                        if (!HISTORY.isMoving) {
                                HISTORY.isMoving = true;
                                HISTORY.prev_pointer = HISTORY.pointer++;
                                var page = HISTORY[HISTORY.pointer];
                                goToHistoryLocation(page);
                        }
                });

                tb.addSeparator("wide-separator");

                var print = new DlButton({ parent: tb, label: "Print", iconClass: "IconFilePrint" });
                print.addEventListener("onClick", printPage);

                tb.addFiller();

                var search = new DlCompletionEntry({ parent: tb, size: 30, emptyText: "Search API", smart: false, accessKey: "ALT 's'" });
                search.addEventListener({ onCompletion : search_API_completion,
                                          onSelect     : search_API_select });

                tb.addSeparator("wide-separator");

		var refresh = new DlButton({ parent    : tb,
					     label     : "Reload page",
					     iconClass : "IconReload"
					   });
		refresh.addEventListener("onClick", function() {
                        HISTORY.isMoving = true;
			var rb = SAMPLES_GROUP.getSelected()[0];
			if (rb) {
				rb.setValue(null); // clear value so that it's loaded again
				displayPage(rb);
			}
		});

                left.addEventListener("onResize", function() {
                        var sz = this.getSize();
                        link.setInnerSize({ x: sz.x + 3 });
                });
	};

        var API_INDEX = null;
        function search_API_completion() {
                if (!API_INDEX) {
                        new DlRPC({ url: $urlSample("api://index.js"),
                                    callback: function(res) {
                                            eval("API_INDEX=" + res.text);
                                            _doSearch_API_completion.call(this);
                                    }.$(this)
                                  }).call();
                } else {
                        _doSearch_API_completion.delayed(5, this);
                }
        };

        function search_API_select(data) {
                var url = "api://";
                url += data.object + ".xml";
                if (data.type == "static_method") {
                        url += ":type=static_method:func=" + data.method;
                } else if (data.type == "object_method") {
                        url += ":type=object_method:func=" + data.method;
                }
                try {
                        PAGE_CONTENT.getElement().focus();
                        this.clear();
                } catch(ex) {
                        this.select();
                }
                goToLocalUrl(url);
        };

        function _doSearch_API_completion() {
                var comp = [], str = this.getValue().toLowerCase();
                var str_re = new RegExp(this.getValue(), "ig");

                function be_smart(a, b) {
                        if (a.n)
                                a = a.n;
                        if (b.n)
                                b = b.n;
                        var diff = a.toLowerCase().indexOf(str) - b.toLowerCase().indexOf(str);
                        if (diff == 0)
                                diff = a.length - b.length;
                        return diff;
                };

                // objects
                comp.push.apply(comp,
                                API_INDEX.objects.grep(function(el) {
                                        return el.toLowerCase().indexOf(str) >= 0;
                                }).mergeSort(be_smart).map(function(el) {
                                        var comp = el;
                                        var label = el.replace(str_re, function(s) {
                                                return s.bold();
                                        });
                                        return { label      : label,
                                                 start      : 0,
                                                 completion : comp,
                                                 object     : comp,
                                                 type       : "object" };
                                })
                               );

                // methods
                comp.push.apply(comp,
                                API_INDEX.object_methods.grep(function(el) {
                                        return el.n.toLowerCase().indexOf(str) >= 0;
                                }).mergeSort(be_smart).map(function(el) {
                                        var comp = el.o + "::" + el.n + "()";
                                        var label = el.n.replace(str_re, function(s) {
                                                return s.bold();
                                        });
                                        label = el.o + "." + label + "()";
                                        return { label       : label,
                                                 start       : 0,
                                                 completion  : comp,
                                                 object      : el.o,
                                                 method      : el.n,
                                                 type        : "object_method" };
                                })
                               );

                // functions
                comp.push.apply(comp,
                                API_INDEX.static_methods.grep(function(el) {
                                        return el.n.toLowerCase().indexOf(str) >= 0;
                                }).mergeSort(be_smart).map(function(el) {
                                        var comp = el.o + "." + el.n + "()";
                                        var label = el.n.replace(str_re, function(s) {
                                                return s.bold();
                                        });
                                        label = el.o + "::" + label + "()";
                                        return { label       : label,
                                                 start       : 0,
                                                 completion  : comp,
                                                 object      : el.o,
                                                 method      : el.n,
                                                 type        : "static_method" };
                                })
                               );

                if (comp.length > 0)
                        this.completionReady(comp);
                else
                        this.cancelCompletion();
        };

})();

function _executeSample(__dlg) {
	var __code = __dlg.entry.getValue();
	var __line = 0;
	var __error = false;
	function getDocCanvas() {
		return __dlg.output;
	};
	function print() {
		var txt = "";
		for (var i = 0; i < arguments.length; ++i)
			txt += arguments[i];
		__line++;
		var div = document.createElement("div");
		div.className = "PrintLine " + (__line & 1 ? "PrintLine-odd" : "PrintLine-even");
		if (__error)
			div.className += " Error";
		div.appendChild(document.createTextNode(txt));
		__dlg.output.getElement().appendChild(div);
	};
        function printHTML() {
		var txt = "";
		for (var i = 0; i < arguments.length; ++i)
			txt += arguments[i];
		__line++;
		var div = document.createElement("div");
		div.className = "PrintLine " + (__line & 1 ? "PrintLine-odd" : "PrintLine-even");
		if (__error)
			div.className += " Error";
		div.innerHTML = txt;
		__dlg.output.getElement().appendChild(div);
	};
	__dlg.output.destroyChildWidgets();
	try {
		eval(__code);
 	} catch(ex) {
 		__error = true;
 		print("You have an error in your code:");
 		print (ex);
 	}
};
