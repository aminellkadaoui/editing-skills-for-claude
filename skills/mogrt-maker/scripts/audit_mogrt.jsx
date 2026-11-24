// audit_mogrt.jsx — read-only check of a template before/after export.
// CFG = {"comp": "Sheikh Name MOGRT", "log": "/path/log_audit.txt"}
(function () {
    var P = app.project, out = [], seen = {};
    function comp(n) { for (var i = 1; i <= P.numItems; i++) { var it = P.item(i); if (it instanceof CompItem && it.name == n) return it; } return null; }
    var M = comp(CFG.comp); if (!M) { out.push("missing comp " + CFG.comp); }
    else {
        out.push("Template name: " + M.motionGraphicsTemplateName);
        out.push("Essential Graphics controls (" + M.motionGraphicsTemplateControllerCount + "):");
        for (var i = 1; i <= M.motionGraphicsTemplateControllerCount; i++) out.push("  " + M.getMotionGraphicsTemplateControllerName(i));
        var errs = [], third = {}, media = [];
        (function scan(C) {
            if (seen[C.id]) return; seen[C.id] = 1;
            for (var j = 1; j <= C.numLayers; j++) {
                var L = C.layer(j);
                (function walk(g, path) { for (var i = 1; i <= g.numProperties; i++) { var p = g.property(i); if (!p) continue;
                    if (p.propertyType == PropertyType.PROPERTY) { if (p.canSetExpression && p.expressionEnabled && p.expressionError) errs.push(C.name + " / " + L.name + " / " + path + p.name); }
                    else walk(p, path + p.name + "/"); } })(L, "");
                var Fx = L.property("ADBE Effect Parade");
                if (Fx) for (var k = 1; k <= Fx.numProperties; k++) { var mn = Fx.property(k).matchName; if (mn.indexOf("ADBE") != 0 && mn.indexOf("CC ") != 0) third[Fx.property(k).name + " (" + mn + ")"] = 1; }
                try { if (L.source instanceof CompItem) scan(L.source);
                      else if (L.source && L.source.file) { var f = L.source.file; media.push(L.name + ": " + f.name + " " + Math.round(f.length / 1048576) + " MB"); } } catch (e) {}
            }
        })(M);
        out.push("Expression errors: " + errs.length); for (var i = 0; i < errs.length && i < 10; i++) out.push("  " + errs[i]);
        var t = []; for (var k in third) t.push(k);
        out.push("Third-party effects (force Dynamic Link, block Media Replacement): " + (t.length ? t.join(", ") : "none"));
        out.push("Media packed into the .mogrt:"); for (var i = 0; i < media.length; i++) out.push("  " + media[i]);
    }
    var f = new File(CFG.log); f.encoding = "UTF-8"; f.open("w"); f.write(out.join("\n")); f.close();
})();
