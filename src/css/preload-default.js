function DynarhLIB_preload_images() {
        DynarchDomUtils.createElement("div", { display: "none" }, null, document.body)
                .innerHTML = "[% images %]".qw().map(function(img){
                        return "<img src='" + Dynarch.getFileURL("css/" + img) + "' />";
                }).join("");
};
