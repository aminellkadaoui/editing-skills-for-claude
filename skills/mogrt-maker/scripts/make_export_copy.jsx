// make_export_copy.jsx — duplicate the template tree for export, leaving the originals untouched.
// Refuses to run if a copy already exists (the user may have edited it in Essential Graphics) unless CFG.replace=true.
// CFG = {
//   "root": "Sheikh Name",
//   "subs": ["Name Text", "Box Matte", "Tarteel Diamonds"],   // precomps used by root
//   "suffix": " MOGRT",
//   "removeEffects": ["PEDG"],          // matchNames that force Dynamic Link (Deep Glow…)
//   "mediaLayer": "Sheikh Footage",     // footage layer with Media Replacement
//   "placeholder": "/abs/path/placeholder.jpg",
//   "replace": false,
//   "log": "/path/log_copy.txt"
// }
(function () {
    var P = app.project, out = [];
    function comp(n) { for (var i = 1; i <= P.numItems; i++) { var it = P.item(i); if (it instanceof CompItem && it.name == n) return it; } return null; }
    function find(C, n) { for (var j = 1; j <= C.numLayers; j++) if (C.layer(j).name == n) return C.layer(j); return null; }
    function done() { if (CFG.log) { var f = new File(CFG.log); f.encoding = "UTF-8"; f.open("w"); f.write(out.join("\n")); f.close(); } }
    var names = [CFG.root].concat(CFG.subs || []);
    for (var n = 0; n < names.length; n++) if (comp(names[n] + CFG.suffix) && !CFG.replace) { out.push("STOP: " + names[n] + CFG.suffix + " exists. It may hold the user's edits. Set replace=true only if he said so."); done(); return; }
    P.save();
    P.file.copy(new File(P.file.parent.fsName + "/Backups/" + P.file.name.replace(/\.aep$/, "") + " - before export copy " + (new Date().getTime()) + ".aep"));
    for (var n = 0; n < names.length; n++) { var old = comp(names[n] + CFG.suffix); if (old) old.remove(); }
    var map = {};
    for (var n = 0; n < names.length; n++) { var D = comp(names[n]).duplicate(); D.name = names[n] + CFG.suffix; map[names[n]] = D; }
    var M = map[CFG.root];
    for (var j = 1; j <= M.numLayers; j++) { var L = M.layer(j); try { if (L.source instanceof CompItem && map[L.source.name]) L.replaceSource(map[L.source.name], false); } catch (e) {} }
    var reps = []; for (var n = 0; n < names.length; n++) reps.push(['comp("' + names[n] + '")', 'comp("' + names[n] + CFG.suffix + '")']);
    var fixed = 0, removed = 0;
    function walk(g) { for (var i = 1; i <= g.numProperties; i++) { var p = g.property(i); if (!p) continue;
        if (p.propertyType == PropertyType.PROPERTY) { if (p.canSetExpression && p.expression != "") { var e = p.expression, x = e; for (var r = 0; r < reps.length; r++) x = x.split(reps[r][0]).join(reps[r][1]); if (x != e) { p.expression = x; fixed++; } } }
        else walk(p); } }
    for (var n = 0; n < names.length; n++) { var C = map[names[n]];
        for (var j = 1; j <= C.numLayers; j++) { walk(C.layer(j));
            var Fx = C.layer(j).property("ADBE Effect Parade"); if (!Fx) continue;
            for (var k = Fx.numProperties; k >= 1; k--) for (var q = 0; q < (CFG.removeEffects || []).length; q++)
                if (Fx.property(k).matchName == CFG.removeEffects[q]) { C.layer(j).property("ADBE Effect Parade").property(k).remove(); removed++; break; } } }
    if (CFG.mediaLayer && CFG.placeholder) {
        var ph = null; for (var i = 1; i <= P.numItems; i++) { var it = P.item(i); if (it instanceof FootageItem && it.file && it.file.fsName == new File(CFG.placeholder).fsName) ph = it; }
        if (!ph) ph = P.importFile(new ImportOptions(new File(CFG.placeholder)));
        find(M, CFG.mediaLayer).replaceSource(ph, false); var F2 = find(M, CFG.mediaLayer); F2.startTime = 0; F2.inPoint = 0; F2.outPoint = M.duration;
    }
    out.push("copy: " + M.name + " | expressions relinked " + fixed + " | effects removed " + removed);
    out.push("Essential Graphics: " + M.motionGraphicsTemplateControllerCount + " controls");
    app.purge(PurgeTarget.UNDO_CACHES); P.save();
    M.openInViewer(); M.openInEssentialGraphics();
    out.push("Now export BY HAND: Essential Graphics > Export Motion Graphics Template.");
    done();
})();
