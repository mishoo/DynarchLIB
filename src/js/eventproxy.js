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
// @require exception.js

DEFINE_CLASS("DlEventProxy", null, function(D, P) {

        D.CONSTRUCT = function() {
                this.__eventHooks = {};
                this.__disHooks = {};
                this.registerEvents(this.DEFAULT_EVENTS);
                this.addEventListener("onDestroy", this.__onDestroy);
        };

        P.DEFAULT_EVENTS = [ "onDestroy" ];

        P.FINISH_OBJECT_DEF = function() {
                var moreEvents = this.constructor.DEFAULT_EVENTS;
                if (moreEvents)
                        this.DEFAULT_EVENTS = this.DEFAULT_EVENTS.concat(moreEvents);
        };

        // FIXME: not sure this is of any use to prevent leaks
        P.__onDestroy = function() {
                [ "__eventHooks", "__disHooks" ].foreach(function(hooks) {
                        for (var i in this[hooks]) {
                                var h = this[hooks][i];
                                if (h) {
                                        h.foreach(function(h, i) {
                                                this[i] = null;
                                        });
                                }
                                this[hooks][i] = null;
                        }
                        this[hooks] = null;
                }, this);
        };

        // private stuff
        P.__getEventHooks = function(ev, copy) {
                // FIXME (investigate): this could be bad.  When we
                // destroy widgets upon, say, an "onClick" event,
                // there might be events that still trigger *after*
                // the widget has been destroyed--such as onMouseUp;
                // this.__eventHooks will be null already, so we throw
                // StopEventBubbling here, which generally does The
                // Right Thing.
                if (!this.__eventHooks)
                        throw new DlExStopEventBubbling;
                var a = this.__eventHooks[ev.toLowerCase()];
                if (!a) return [];
                // if (!a)
                //         throw new DlException("Event [" + ev + "] not registered.");
                if (copy)
                        a = a.slice(0);
                return a;
        };

        function _connect_callback(w2, e2) {
                return w2.applyHooks(e2, Array.$(arguments, 2));
        };

        // public

        P.registerEvents = function(evs) {
                var h = this.__eventHooks, i = 0, e;
                while ((e = evs[i++])) {
                        e = e.toLowerCase();
                        if (!h[e])
                                h[e] = [];
                }
        };

        P.condEventListener = function(cond) {
                cond = cond ? this.addEventListener : this.removeEventListener;
                return cond.apply(this, Array.$(arguments, 1));
        };

        P.addEventListener = function(ev, handler, phase, object) {
                if (ev instanceof Array) {
                        var i = 0, e;
                        while ((e = ev[i++]))
                                this.addEventListener(e, handler, phase, object);
                } else if (typeof ev == "object") {
                        for (var i in ev)
                                this.addEventListener(i, ev[i], handler, phase);
                } else {
                        var a = this.__getEventHooks(ev);
                        a.remove(handler);
                        if (phase == null && ev.toLowerCase() == "ondestroy")
                                phase = true;
                        phase
                                ? a.unshift(handler)
                                : a.push(handler);
                        if (object)
                                object.addEventListener("onDestroy", this.removeEventListener.$(this, ev, handler));
                }
                return this;
        };

        P.listenOnce = function(ev, handler, times) {
                if (times == null)
                        times = 1;
                var f = function() {
                        if (--times == 0)
                                this.removeEventListener(ev, f);
                        handler.apply(this, arguments);
                };
                return this.addEventListener(ev, f);
        };

        P.connectEvents = function(e1, w2, e2) {
                if (typeof w2 == "string") {
                        e2 = w2;
                        w2 = this;
                } else if (!e2) {
                        e2 = e1;
                }
                if (e1 instanceof Array) {
                        for (var i = 0; i < e1.length; ++i)
                                this.connectEvents(e1[i], w2, e2[i]);
                } else {
                        this.addEventListener(e1, _connect_callback.$(null, w2, e2));
                }
                return this;
        };

        P.removeEventListener = function(ev, handler) {
                var i = 0, e;
                if (ev instanceof Array) {
                        while ((e = ev[i++]))
                                this.removeEventListener(e, handler);
                } else if (typeof ev == "object") {
                        for (i in ev)
                                this.removeEventListener(i, ev[i]);
                } else {
                        this.__getEventHooks(ev).remove(handler);
                }
                return this;
        };

        P.removeAllListeners = function(ev) {
                if (ev instanceof Array) {
                        ev.foreach(this.removeAllListeners, this);
                } else if (typeof ev == "object") {
                        for (var i in ev)
                                this.removeAllListeners(i);
                } else {
                        this.__getEventHooks(ev).length = 0;
                }
                return this;
        };

        P.disableHooks = function(ev) {
                if (ev instanceof Array)
                        ev.r_foreach(this.disableHooks, this);
                else {
                        ev = ev.toLowerCase();
                        this.__disHooks[ev] = this.__eventHooks[ev];
                        this.__eventHooks[ev] = [];
                }
                return this;
        };

        P.enableHooks = function(ev) {
                if (ev instanceof Array)
                        ev.r_foreach(this.enableHooks, this);
                else {
                        ev = ev.toLowerCase();
                        this.__eventHooks[ev] = this.__disHooks[ev];
                        this.__disHooks[ev] = null;
                }
                return this;
        };

        P.callHooks = function(ev) {
                var args = arguments.length > 1
                        ? Array.$(arguments, 1)
                        : [];
                return this.applyHooks(ev, args);
        };

        P.hasHooks = function(ev) {
                var a = this.__eventHooks[ev.toLowerCase()];
                return a && a.length > 0;
        };

        P.withHooks = function(args, cont) {
                this.addEventListener.apply(this, args);
                try {
                        return cont();
                } finally {
                        this.removeEventListener.apply(this, args);
                }
        };

        P.withDisabledHooks = function(args, cont) {
                this.disableHooks.apply(this, args);
                try {
                        return cont();
                } finally {
                        this.enableHooks.apply(this, args);
                }
        };

        P.applyHooks = function(ev, args) {
                var ret = [], a, i = 0, f;
                try {
                        a = this.__getEventHooks(ev, true);
                        while ((f = a[i++]))
                                ret.push(f.apply(this, args));
                } catch(ex) {
                        if (!(ex instanceof DlExStopEventProcessing))
                                throw ex;
                }
                return ret;
        };

        P.debug_countHooks = function() {
                var a = {}, i;
                for (i in this.__eventHooks)
                        a[i] = this.__eventHooks[i].length;
                return a;
        };

        P.invoke = function(method) {
                var args = Array.$(arguments, 1);
                return function(){
                        this[method].apply(this, args.concat(Array.$(arguments)));
                }.$(this);
        };

//      // note that both of the following could be dangerous
//      // if we traversing the container and destroy()
//      // objects
//
//      P.maintainArray = function(arr, ev) {
//              ev || (ev = "onDestroy");
//              this.addEventListener(ev, arr.remove.$(arr, this));
//      };
//
//      P.maintainHash = function(hash, id, ev) {
//              ev || (ev = "onDestroy");
//              id || (id = this.id); // WARNING! this.id is ASSUMED!
//              this.addEventListener(ev, function() {
//                      delete hash[id];
//              });
//      };

        // this SHOULD NOT be overridden.  Register an onDestroy event
        // handler if you wish to be able to do stuff when this happens
        P.destroy = function() {
                if (!this.destroyed) {
                        this.destroying = true;
                        this.callHooks("onDestroy");
                        this.__eventHooks = null;
                        this.destroying = false;
                        this.destroyed = true;
                        // throw new DlExStopEventBubbling;
                }
        };

});
