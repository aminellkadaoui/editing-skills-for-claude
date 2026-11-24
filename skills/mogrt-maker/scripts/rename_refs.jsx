// rename_refs.jsx — rename comps/layers and rewrite every expression that points to the old names.
// CFG = {
//   "comps":  [["اسم الشيخ", "Sheikh Name"], ["ماسك البوكس", "Box Matte"]],
//   "layers": [["NAME - الاسم", "Name"]],     // renamed in every comp where they exist
//   "log": "/path/log_rename.txt"
// }
(function () {
    var P = app.project, out = [], fixed = 0;
    P.save();
    P.file.copy(new File(P.file.parent.fsName + "/Backups/" + P.file.name.replace(/\.aep$/, "") + " - before rename " + (new Date().getTime()) + ".aep"));
    var reps = [];
    for (var i = 0; i < (CFG.comps || []).length; i++) reps.push(['comp("' + CFG.comps[i][0] + '")', 'comp("' + CFG.comps[i][1] + '")']);
    for (var i = 0; i < (CFG.layers || []).length; i++) reps.push(['layer("' + CFG.layers[i][0] + '")', 'layer("' + CFG.layers[i][1] + '")']);
    for (var i = 1; i <= P.numItems; i++) { var it = P.item(i); if (!(it instanceof CompItem)) continue;
        for (var c = 0; c < (CFG.comps || []).length; c++) if (it.name == CFG.comps[c][0]) { it.name = CFG.comps[c][1]; out.push("comp " + CFG.comps[c][0] + " -> " + CFG.comps[c][1]); }
        for (var j = 1; j <= it.numLayers; j++) for (var l = 0; l < (CFG.layers || []).length; l++) if (it.layer(j).name == CFG.layers[l][0]) it.layer(j).name = CFG.layers[l][1]; }
    function walk(g) { for (var i = 1; i <= g.numProperties; i++) { var p = g.property(i); if (!p) continue;
        if (p.propertyType == PropertyType.PROPERTY) { if (p.canSetExpression && p.expression != "") { var e = p.expression, x = e; for (var r = 0; r < reps.length; r++) x = x.split(reps[r][0]).join(reps[r][1]); if (x != e) { p.expression = x; fixed++; } } }
        else walk(p); } }
    for (var i = 1; i <= P.numItems; i++) { var C = P.item(i); if (C instanceof CompItem) for (var j = 1; j <= C.numLayers; j++) walk(C.layer(j)); }
    out.push("expressions rewritten: " + fixed);
    app.purge(PurgeTarget.UNDO_CACHES); P.save();
    var f = new File(CFG.log); f.encoding = "UTF-8"; f.open("w"); f.write(out.join("\n")); f.close();
})();
