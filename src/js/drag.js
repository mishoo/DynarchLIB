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

DEFINE_CLASS("DlDrag", DlEventProxy, function(D, P, DOM){

        D.DEFAULT_EVENTS = [ "onDrop", "onStartDrag" ];

	D.DEFAULT_ARGS = {
		delta	       : [ "delta"	   , 3 ],
		dragging       : [ "_dragging"	   , false ],
		draggingClass  : [ "draggingClass" , "DlWidget-dragging" ],
		_animArgs      : [ "animation"     , { length: 30, fps: 50 } ],
                cursor         : [ "cursor"        , { noDrop: "CURSOR-NO-DROP",
                                                       okDrop: "CURSOR-DROP" } ]
	};

	P.dropOK = function(widget, ev, target, inside) {
		this.target = target;
		return this.canDrop = true;
	};

	P._handleDrop = function(src, dest, pos) {
		this.applyHooks("onDrop", [ src, dest, pos ]);
	};

	P.doDrop = function(widget, ev) {
		throw new DlExAbstractBaseClass();
	};

	P.startOK = function(widget, ev) {
		return true;
	};

	P.moving = function(widget, ev) {};

	P.reset = function(wasCancel) {
		var el = this.elementCopy;
		if (el && el.parentNode) {
			if (wasCancel && this._animArgs) {
				var anim = new DlAnimation(this._animArgs.length, this._animArgs.fps);
				var pos = this.startElPos || this.startPos;
				var cpos = DOM.getPos(el);
				anim.addEventListener(
					{
						onUpdate : function() {
                                                        var y = this.getPos();
							el.style.left = y.mapInt(cpos.x, pos.x) + "px";
							el.style.top = y.mapInt(cpos.y, pos.y) + "px";
							DOM.setOpacity(el, this.t.map(1, 0.2));
						},
						onStop : function() {
                                                        DOM.trash(el);
							el = null;
						}
					}
				);
				anim.start(null, null, "accel_ab");
			} else
				el.parentNode.removeChild(el);
		}
		this.dragging = false;
		this.canDrop = false;
		this.target = null;
		this.elementCopy = null;
		this.startPos = null;
		this.source = null;
	};

	P.makeElementCopy = function(widget, ev) {
		var el = this.elementCopy;
		if (!el) {
			el = this.elementCopy = widget.getElement().cloneNode(true);
			DOM.addClass(el, "DlWidget-dragged-clone");
			el.style.top = ev.pos.y + "px";
			el.style.left = ev.pos.x + "px";
			document.body.appendChild(el);
			el.style.width = el.offsetWidth + "px";
			// el.style.height = el.offsetHeight + "px";
		}
		return el;
	};

});

DEFINE_CLASS("DlDragTreeItem", DlDrag, function(D, P){

	D.DEFAULT_ARGS = {
		_noReparent : [ "noReparent", false ]
	};

	var CLASS        = "DlTreeItem-dropTarget",
            CLASS_UPPER  = "DlTreeItem-dropTarget-upper",
            CLASS_LOWER  = "DlTreeItem-dropTarget-lower",
            CLASS_ALL_RE = /DlTreeItem-dropTarget[^\s]*/g,
            CLASS_POS_RE = /DlTreeItem-dropTarget-[^\s]*/g;

	function onExpander(ev) {
		return /DlTree-IconWidth/.test(ev.target.className);
	};

	P.startOK = function(widget, ev) {
		return !onExpander(ev);
	};

	P.dropOK = function(item, ev, obj, inside) {
 		while (obj && !(obj instanceof DlTreeItem))
 			obj = obj.parent;
		var ok = !inside && obj;
		if (ok)
			ok = !this._noReparent || item.parent === obj.parent;

		this.target = ok ? obj : null;
		this.canDrop = !!ok;

		if (this.oldTarget && this.oldTarget !== this.target)
			this.oldTarget.delClass(CLASS_ALL_RE);
		if (ok)
			this.target.addClass(CLASS);
		this.oldTarget = this.target;

		return ok;
	};

	P.doDrop = function(item, ev) {
		if (this._noReparent || onExpander(ev)) {
			var pos = this.target.getIndex();
			if (!this.dropBefore)
				++pos;
			this.target.parent.appendWidget(item, pos);
			this._handleDrop(item, this.target,
					 this.dropBefore ? "before" : "after");
		} else {
			if (this.target.getSubtreeWidget() !== item.parent) {
				this.target.addSubItem(item);
				this._handleDrop(item, this.target);
			}
		}
	};

	P.moving = function(item, ev) {
		var target = this.target;
		if (this.canDrop && target && (this._noReparent || onExpander(ev))) {
			var relPos = ev.computePos(target);
			var h = target.getDivElement().offsetHeight / 2;
			var upper = relPos.y <= h;
			target.condClass(upper, CLASS_UPPER, CLASS_LOWER);
			this.dropBefore = upper;
		} else if (target) {
			this.dropBefore = null;
			target.delClass(CLASS_POS_RE);
		}
	};

	P.reset = function() {
		if (this.target)
			this.target.delClass(CLASS_ALL_RE);
		if (this.oldTarget)
			this.oldTarget.delClass(CLASS_ALL_RE);
		D.BASE.reset.apply(this, arguments);
		this.oldTarget = null;
	};

});
