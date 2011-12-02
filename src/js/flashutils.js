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

// @require singleton.js
// @require eventproxy.js

DEFINE_SINGLETON("DlFlashUtils", DlEventProxy, function(D, P) {

        D.DEFAULT_EVENTS = [ "onLoad", "onStorageStatus" ];

        var HTML = is_ie
                ? String.template(
                        '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,0,0" width="215" height="138" id="DlFlashUtils-MOVIE" align="middle">',
                        '<param name="allowScriptAccess" value="always" />',
                        '<param name="movie" value="$url" />',
                        '<param name="quality" value="high" />',
                        '</object>'
                ) : String.template(
                        '<embed id="DlFlashUtils-MOVIE" src="$url" quality="high" bgcolor="#ffffff" width="215" height="138" ',
                        'allowScriptAccess="always" ',
                        'type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />'
                );

        var OBJ = null;

        window.DlFlashUtils_init = function(o) {
                DlFlashUtils().callHooks("onLoad");
        };

        P.init = function() {
                if (!OBJ) {
                        var html = HTML({ url: Dynarch.getFileURL("swf/flash.swf") });
                        document.write("<div style='position: absolute; z-index: 31000; left: -256px; top: 50%; margin-left: -108px; margin-top: -69px; width: 216px; height: 138px;'>" + html + "</div>");
                        OBJ = document.getElementById('DlFlashUtils-MOVIE');
                }
        };

        P.getObject = function() {
                return OBJ;
        };

        P.display = function(disp) {
                OBJ.parentNode.style.left = disp ? "50%" : "-256px";
        };

        {
                // IE Flash detection
                // adapted after http://www.featureblend.com/flash_detect_1-0-3/flash_detect.js

                function getAXVersion(obj) {
                        var v = null;
                        try {
                                v = obj.GetVariable("$version");
                        } catch(ex) {}
                        return v;
                };

                var IE_DETECT = {
                        "ShockwaveFlash.ShockwaveFlash.7" : getAXVersion,
                        "ShockwaveFlash.ShockwaveFlash.6" : function(obj) {
                                var version = "Win 6,0,21";
                                try{
                                        obj.AllowScriptAccess = "always";
                                        version = getAXVersion(obj);
                                } catch(ex) {}
                                return version;
                        },
                        "ShockwaveFlash.ShockwaveFlash" : getAXVersion
                };
        }

        P.isSupported = function() {
                var p = navigator.plugins;
                if (p && p.length) {
                        p = p["Shockwave Flash"];
                        if (p && p.description && /^Shockwave Flash\s+([^\s]+)/i.test(p.description))
                                return parseFloat(RegExp.$1) >= 8;
                } else if (is_ie) {
                        for (var i in IE_DETECT) {
                                try {
                                        var obj = new ActiveXObject(i);
                                        if (obj) {
                                                var v = IE_DETECT[i](obj);
                                                if (v != null) {
                                                        v = v.split(/\s+/)[1];
                                                        return parseFloat(v) >= 8; // supported!
                                                }
                                        }
                                } catch(ex) {}
                        }
                }
                return false;
        };

        P.loadPolicyFile = function(addr) {
                return this.getObject().DlSocket_loadPolicyFile(addr);
        };

        // we need the following because Flash developers
        // were unbelievably stupid.

        var decodeString = P.decodeString = function(str) {
                return str.replace(/%22/g, "\"").replace(/%5c/g, "\\").replace(/%26/g, "&").replace(/%25/g, "%");
        };

        var decodeObject = P.decodeObject = function(obj) {
                var i, tmp;
                if (obj instanceof Array) {
                        for (i = obj.length; --i >= 0;)
                                obj[i] = decodeObject(obj[i]);
                } else if (typeof obj == "object") {
                        if (obj == null)
                                return obj;
                        tmp = {};
                        for (i in obj)
                                tmp[decodeString(i)] = decodeObject(obj[i]);
                        obj = tmp;
                } else if (typeof obj == "string") {
                        obj = decodeString(obj);
                }
                return obj;
        };

});

DlFlashStore = {

        set : function(key, val) {
                DlFlashUtils().getObject().DlStorage_set(key, val);
        },

        get : function(key) {
                return DlFlashUtils().decodeObject(DlFlashUtils().getObject().DlStorage_get(key));
        },

        getAllKeys : function() {
                return DlFlashUtils().decodeObject(DlFlashUtils().getObject().DlStorage_getAllKeys());
        },

        remove : function(key) {
                DlFlashUtils().getObject().DlStorage_remove(key);
        },

        clear : function() {
                DlFlashUtils().getObject().DlStorage_clear();
        },

        flush : function(showUI) {
                var val = DlFlashUtils().getObject().DlStorage_flush();
                if (showUI && val == "pending") {
                        DlFlashUtils().display(true);
                }
                return val;
        },

        _onStatus : function(info) {
                DlFlashUtils().display(false);
                DlFlashUtils().applyHooks("onStorageStatus", [ info ]);
        }

};
