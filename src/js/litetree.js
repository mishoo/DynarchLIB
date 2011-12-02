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

// @require container.js

DEFINE_CLASS("DlLiteTree", DlContainer, function(D, P, DOM){

        D.DEFAULT_EVENTS = "onItemMouseDown onItemDblClick".qw();

        D.DEFAULT_ARGS = {
                items : [ "items" , null ],
                sort  : [ "sort"  , Function.identity ],

                _opt_toggleSelection : [ "toggleSelection", false ],

                _focusable : [ "focusable", true ]
        };

        D.FIXARGS = function(args) {
                Object.mergeUndefined(args, {
                        fillParent : true
                });
        };

        D.CONSTRUCT = function() {
                this.addEventListener({
                        onMouseDown: this._onMouseDown,
                        onDblClick: this._onDblClick
                });
        };

        P.reset = function(items) {
                this.top_items = this.sort(items);
                this.setContent(this._buildHTML(this.top_items, 0));
                if (this._selection) this._selection.filter(this._itemsById);
        };

        P.setSelectionModel = function(sel) {
                if (this._selection) {
                        this._selection.removeEventListener(this._selListeners);
                } else if (!this._selListeners) {
                        this._selListeners = {
                                onChange: this.$("_on_selChange"),
                                onReset: this.$("_on_selReset")
                        };
                }
                this._selection = sel;
                sel.addEventListener(this._selListeners);
        };

        P.isSelected = function(item_id) {
                return this._selection && this._selection.isSelected(item_id);
        };

        P.refreshItems = function(ids) {
                ids.foreach(function(id){
                        var el = this._getItemElement(id);
                        if (el) {
                                var c = [ 'item-label'], item = this._itemsById[id];
                                if (this.isSelected(id)) c.push("selected");
                                item.addClassNames(c);
                                el.className = c.join(" ");
                                var buf = String.buffer("<span class='expander'></span>");
                                item.formatHTML(buf);
                                el.innerHTML = buf.get();
                        }
                }, this);
        };

        P.getItemById = function(id) {
                return this._itemsById[id];
        };

        P._buildHTML = function(items, level) {
                if (items.length == 0) return "";
                if (level == null) level = 0;
                if (level == 0) this._itemsById = {};
                var html = String.buffer("<ul>");
                items.foreach(function(item){
                        var children = item.children();
                        var has_children = children.length > 0;
                        html("<li>");
                        var c = [ 'item-label' ], id = item.id();
                        item.addClassNames(c);
                        if (this.isSelected(id)) c.push("selected");
                        if (has_children) c.push("expanded");
                        html("<div id='", this._makeId(id), "' lite-tree-item='", id, "' class='", c.join(' '), "'><span class='expander'></span>");
                        item.formatHTML(html);
                        html("</div>", this._buildHTML(children, level + 1), "</li>");
                        this._itemsById[item.id()] = item;
                }, this);
                html("</ul>");
                return html.get();
        };

        P._makeId = function(id) {
                return this.id + ":" + id;
        };

        P._findItemFromEvent = function(ev) {
                var ret = {}, p = ev.target;
                while (p && p.nodeType == 1) {
                        var id = p.getAttribute("lite-tree-item");
                        if (id != null) {
                                ret.el = p;
                                ret.id = id;
                                ret.item = this._itemsById[id];
                                return ret;
                        }
                        if (p.className == "expander") {
                                ret.expander = p;
                        }
                        p = p.parentNode;
                }
        };

        P.scrollToRecord = function(item_id) {
                DOM.scrollIntoView(this._getItemElement(item_id));
        };

        P._getItemElement = function(item_id) {
                return document.getElementById(this._makeId(item_id));
        };

        P.__handleSelectClick = function(clicked, ev, dblClick) {
                var sel = this._selection;
                var item = this._itemsById[clicked.id];
                var hooks_args = [ item, clicked, ev ];
                if (dblClick) {
                        if (sel && !sel.isSelected(clicked.id) && this.canSelectItem(item))
                                sel.reset([ clicked.id ]);
                        this.applyHooks("onItemDblClick", hooks_args);
                        return;
                }
                if (!sel || clicked.expander || !this.canSelectItem(clicked.item)) {
                        var subtree = clicked.el.nextSibling;
                        if (subtree) {
                                var was_hidden = DOM.hasClass(subtree, "hidden");
                                DOM.condClass(subtree, !was_hidden, "hidden");
                                DOM.condClass(clicked.el, was_hidden, "expanded", "collapsed");
                        }
                        this.applyHooks("onItemMouseDown", hooks_args);
                }
                else if (sel && this.canSelectItem(clicked.item)) {
                        if (sel.multiple) {
                                if (ev.ctrlKey) {
                                        sel.toggle(clicked.id);
                                }
                                // else if (ev.shiftKey) {

                                // }
                                else sel.reset([ clicked.id ]);
                        } else {
                                if (this._opt_toggleSelection && sel.isSelected(clicked.id)) {
                                        sel.toggle(clicked.id);
                                } else {
                                        sel.reset([ clicked.id ]);
                                }
                        }
                        this.applyHooks("onItemMouseDown", hooks_args);
                }
        };

        P.canSelectItem = function(item) {
                return item.isSelectable();
        };

        var __prevTime = new Date().getTime();
        var __prevItem = null;
        P._onMouseDown = function(ev) {
                var clicked = this._findItemFromEvent(ev);
                var now = new Date().getTime();
                if (now - __prevTime < Dynarch.dblClickTimeout && clicked && __prevItem && clicked.id == __prevItem.id) {
                        this.__handleSelectClick(clicked, ev, true);
                } else if (clicked) {
                        __prevTime = now;
                        this.__handleSelectClick(clicked, ev, false);
                }
                __prevItem = clicked;
        };

        P._on_selChange = function(id, selected) {
                DOM.condClass(this._getItemElement(id), selected, "selected");
        };

        P._on_selReset = function(oldSel, newSel) {
                Object.foreach(oldSel, function(val, key){
                        DOM.delClass(this._getItemElement(key), "selected");
                }, this);
                Object.foreach(newSel, function(val, key){
                        DOM.addClass(this._getItemElement(key), "selected");
                }, this);
        };

        D.Item = DEFINE_HIDDEN_CLASS(null, DlEventProxy, function(D, P){
                D.DEFAULT_ARGS = {
                        _name     : [ "name"     , null ],
                        _id       : [ "id"       , null ],
                        _children : [ "children" , null ]
                };
                D.CONSTRUCT = function() {
                        if (this._children == null) this._children = [];
                };
                P.formatHTML = function(buf){ buf(String(this._name).htmlEscape()) };
                P.addClassNames = Function.noop;
                P.id = function() { return this._id };
                P.children = function() { return this._children };
                P.isSelectable = Function.returnTrue;
        });

});
