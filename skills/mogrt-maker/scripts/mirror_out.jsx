// mirror_out.jsx — make the Out the exact reverse of the In.
// CFG = {
//   "comps": ["Sheikh Name", "Box Matte", "Tarteel Diamonds"],   // comps to scan
//   "end": 240,            // last frame of the template (comp duration in frames)
//   "inMax": 60,           // keys at or before this frame are "In" keys
//   "clearAfter": 150,     // existing keys after this frame are old Out keys -> removed
//   "skip": ["CONTROL", "NAME TEXT", "Sheikh Footage"],          // layers to leave alone
//   "remap": [{"comp":"Sheikh Name","layer":"Name","len":82}],  // text anim reversed by Time Remap
//   "log": "/path/log_mirror.txt"
// }
(function () {
    var P = app.project, out = [];
    function comp(n) { for (var i = 1; i <= P.numItems; i++) { var it = P.item(i); if (it instanceof CompItem && it.name == n) return it; } return null; }
    function find(C, n) { for (var j = 1; j <= C.numLayers; j++) if (C.layer(j).name == n) return C.layer(j); return null; }
    function skip(n) { for (var i = 0; i < (CFG.skip || []).length; i++) if (CFG.skip[i] == n) return true; return false; }
    P.save();
    P.file.copy(new File(P.file.parent.fsName + "/Backups/" + P.file.name.replace(/\.aep$/, "") + " - before mirror " + (new Date().getTime()) + ".aep"));
    for (var c = 0; c < CFG.comps.length; c++) {
        var C = comp(CFG.comps[c]); if (!C) { out.push("missing comp " + CFG.comps[c]); continue; }
        var F = C.frameDuration, END = CFG.end * F;
        for (var j = 1; j <= C.numLayers; j++) { var L = C.layer(j); if (skip(L.name)) continue;
            var list = []; (function walk(g) { for (var i = 1; i <= g.numProperties; i++) { var p = g.property(i); if (!p) continue;
                if (p.propertyType == PropertyType.PROPERTY) { if (p.numKeys > 0 && p.matchName != "ADBE Time Remapping") list.push(p); } else walk(p); } })(L);
            for (var q = 0; q < list.length; q++) {
                var p = list[q], ins = [];
                for (var k = p.numKeys; k >= 1; k--) if (p.keyTime(k) > CFG.clearAfter * F) p.removeKey(k);
                for (var k = 1; k <= p.numKeys; k++) if (p.keyTime(k) <= CFG.inMax * F)
                    ins.push({ t: p.keyTime(k), v: p.keyValue(k), ii: p.keyInInterpolationType(k), oi: p.keyOutInterpolationType(k), ie: p.keyInTemporalEase(k), oe: p.keyOutTemporalEase(k) });
                for (var i = 0; i < ins.length; i++) { var x = p.addKey(END - ins[i].t); p.setValueAtKey(x, ins[i].v); }
                for (var i = 0; i < ins.length; i++) { var x = p.nearestKeyIndex(END - ins[i].t);
                    try { p.setInterpolationTypeAtKey(x, ins[i].oi, ins[i].ii); p.setTemporalEaseAtKey(x, ins[i].oe, ins[i].ie); } catch (e) {} }
                if (ins.length) out.push(C.name + " / " + L.name + " / " + p.name + ": " + ins.length + " keys mirrored");
            }
        }
    }
    var R = CFG.remap || [];
    for (var r = 0; r < R.length; r++) {
        var C = comp(R[r].comp), F = C.frameDuration, END = CFG.end * F;
        var L = find(C, R[r].layer); L.timeRemapEnabled = true; L = find(C, R[r].layer);
        var st = L.startTime, len = R[r].len * F;
        var keys = [[st, 0], [st + len, len], [END - len - st, len], [END - st, 0]];
        for (var i = 0; i < keys.length; i++) { var x = find(C, R[r].layer).property("ADBE Time Remapping").addKey(keys[i][0]); find(C, R[r].layer).property("ADBE Time Remapping").setValueAtKey(x, keys[i][1]); }
        var tr = find(C, R[r].layer).property("ADBE Time Remapping");
        for (var k = tr.numKeys; k >= 1; k--) { var ours = false; for (var i = 0; i < keys.length; i++) if (Math.abs(tr.keyTime(k) - keys[i][0]) < 0.001) ours = true; if (!ours) tr.removeKey(k); }
        for (var k = 1; k <= tr.numKeys; k++) tr.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
        out.push(C.name + " / " + R[r].layer + ": time remap in 0-" + R[r].len + "f, reversed at the end");
    }
    app.purge(PurgeTarget.UNDO_CACHES); P.save();
    if (CFG.log) { var f = new File(CFG.log); f.encoding = "UTF-8"; f.open("w"); f.write(out.join("\n")); f.close(); }
})();
