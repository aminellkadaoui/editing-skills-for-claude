// 01 — import the calligraphy .ai into a comp, convert it to shapes, split every
// top-level group into its own layer "Part N", and export all paths to parts.json.
// CFG: { ai, comp, work, scale (default 200), textLayers: ["HIDAYAT"] }
(function () {
    var LOG = []; function log(x) { LOG.push(x); }
    try {
        var proj = app.project, comp = null, i, k;
        for (i = 1; i <= proj.numItems; i++) if (proj.item(i) instanceof CompItem && proj.item(i).name == CFG.comp) comp = proj.item(i);
        if (!comp) throw "comp not found: " + CFG.comp;
        var SC = CFG.scale || 200;
        // safety copy of the project
        if (proj.file) { proj.save(); proj.file.copy(proj.file.fsName.replace(/\.aep$/i, "") + " (before calligraphy).aep"); }

        var io = new ImportOptions(new File(CFG.ai)); io.importAs = ImportAsType.COMP_CROPPED_LAYERS;
        var src = proj.importFile(io);
        for (k = src.numLayers; k >= 1; k--) src.layer(k).copyToComp(comp);
        // centre the artboard in the comp at SC%
        for (k = 1; k <= src.numLayers; k++) {
            var L = comp.layer(src.layer(k).name), T = L.property("ADBE Transform Group"), p = T.property("ADBE Position").value;
            T.property("ADBE Position").setValue([comp.width / 2 + (p[0] - src.width / 2) * SC / 100, comp.height / 2 + (p[1] - src.height / 2) * SC / 100]);
            T.property("ADBE Scale").setValue([SC, SC]);
        }
        // convert every non-text layer to shapes
        comp.openInViewer();
        var text = CFG.textLayers || [];
        var vec = [];
        for (k = 1; k <= comp.numLayers; k++) { var l = comp.layer(k); if (l.source && l.source === src.layer(1).source || false) {} }
        for (k = 1; k <= src.numLayers; k++) { var nm = src.layer(k).name, isText = false; for (i = 0; i < text.length; i++) if (text[i] == nm) isText = true; if (!isText) vec.push(nm); }
        var n = 0, out = [];
        for (var v = 0; v < vec.length; v++) {
            for (k = 1; k <= comp.numLayers; k++) comp.layer(k).selected = false;
            var VL = comp.layer(vec[v]); VL.selected = true;
            app.executeCommand(app.findMenuCommandId("Create Shapes from Vector Layer"));
            var SL = comp.layer(vec[v] + " Outlines");
            var N = SL.property("ADBE Root Vectors Group").numProperties;
            for (var g = 1; g <= N; g++) {
                var D = SL.duplicate(); n++; D.name = "Part " + n;
                var R = D.property("ADBE Root Vectors Group");
                for (i = R.numProperties; i >= 1; i--) if (i != g) R.property(i).remove();
                // export paths in layer space (group position applied)
                var G = D.property("ADBE Root Vectors Group").property(1), gp = G.property("ADBE Vector Transform Group").property("ADBE Vector Position").value;
                var VG = G.property("ADBE Vectors Group"), paths = [];
                for (i = 1; i <= VG.numProperties; i++) {
                    var q = VG.property(i); if (q.matchName != "ADBE Vector Shape - Group") continue;
                    var sh = q.property("ADBE Vector Shape").value, vs = [], it = [], ot = [];
                    for (var j = 0; j < sh.vertices.length; j++) { vs.push("[" + sh.vertices[j].join(",") + "]"); it.push("[" + sh.inTangents[j].join(",") + "]"); ot.push("[" + sh.outTangents[j].join(",") + "]"); }
                    paths.push('{"v":[' + vs.join(",") + '],"i":[' + it.join(",") + '],"o":[' + ot.join(",") + '],"c":' + sh.closed + '}');
                }
                var hasGrad = false; for (i = 1; i <= VG.numProperties; i++) if (VG.property(i).matchName == "ADBE Vector Graphic - G-Fill") hasGrad = true;
                var r = D.sourceRectAtTime(0, false), T2 = D.property("ADBE Transform Group");
                out.push('"Part ' + n + '":{"gp":[' + gp.join(",") + '],"rect":[' + [r.left, r.top, r.width, r.height].join(",") + '],"grad":' + hasGrad +
                    ',"a":[' + T2.property("ADBE Anchor Point").value.join(",") + '],"p":[' + T2.property("ADBE Position").value.join(",") + '],"s":[' + T2.property("ADBE Scale").value.join(",") + '],"paths":[' + paths.join(",") + ']}');
                log("Part " + n + " from " + vec[v] + " rect " + Math.round(r.left) + "," + Math.round(r.top) + " " + Math.round(r.width) + "x" + Math.round(r.height) + (hasGrad ? " (gradient)" : ""));
            }
            SL.enabled = false; VL.enabled = false;
        }
        var f = new File(CFG.work + "/parts.json"); f.encoding = "UTF-8"; f.open("w"); f.write("{" + out.join(",") + "}"); f.close();
        proj.save(); log("parts: " + n);
    } catch (e) { log("ERR " + (e.line || "") + " " + e); }
    var lf = new File(CFG.work + "/log_01.txt"); lf.encoding = "UTF-8"; lf.open("w"); lf.write(LOG.join("\n")); lf.close();
})();
