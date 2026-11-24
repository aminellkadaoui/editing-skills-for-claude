// 04 — put caption.json (from pdf_text_shapes.py) into the comp as a shape layer in the
// exact PDF font, copy the old text layer's reveal keys, and switch the old layer off.
// CFG: { comp, work, textLayer: "HIDAYAT", refPart: "Part 10" }
(function () {
    var LOG = []; function log(x) { LOG.push(x); }
    try {
        var jf = new File(CFG.work + "/caption.json"); jf.encoding = "UTF-8"; jf.open("r"); var G = eval("(" + jf.read() + ")"); jf.close();
        var C = null, i, k; for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name == CFG.comp) C = app.project.item(i);
        var name = CFG.textLayer + " (font)";
        for (k = C.numLayers; k >= 1; k--) if (C.layer(k).name == name) C.layer(k).remove();
        var RT = C.layer(CFG.refPart).property("ADBE Transform Group");
        var old = C.layer(CFG.textLayer);
        var L = C.layers.addShape(); L.name = name; L.moveBefore(old);
        var X = L.property("ADBE Transform Group");
        // same space as the Part layers: copy their (un-animated) anchor/position/scale from the source .ai placement
        var base = C.layer("Pen Line") || C.layer(CFG.refPart); var BT = base.property("ADBE Transform Group");
        X.property("ADBE Anchor Point").setValue(BT.property("ADBE Anchor Point").value); X.property("ADBE Position").setValue(BT.property("ADBE Position").value); X.property("ADBE Scale").setValue(BT.property("ADBE Scale").value);
        for (var g = 0; g < G.length; g++) {
            L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            L.property("ADBE Root Vectors Group").property(g + 1).name = G[g].ch;
            for (var c = 0; c < G[g].contours.length; c++) {
                var ct = G[g].contours[c], sh = new Shape(); sh.vertices = ct.v; sh.inTangents = ct.i; sh.outTangents = ct.o; sh.closed = true;
                L.property("ADBE Root Vectors Group").property(g + 1).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Group");
                L.property("ADBE Root Vectors Group").property(g + 1).property("ADBE Vectors Group").property(c + 1).property("ADBE Vector Shape").setValue(sh);
            }
            L.property("ADBE Root Vectors Group").property(g + 1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
            L.property("ADBE Root Vectors Group").property(g + 1).property("ADBE Vectors Group").property(G[g].contours.length + 1).property("ADBE Vector Fill Color").setValue([0.98, 0.98, 0.98, 1]);
        }
        var oo = old.property("ADBE Transform Group").property("ADBE Opacity");
        if (oo.numKeys >= 2) {
            var t0 = oo.keyTime(1), t1 = oo.keyTime(2), P = X.property("ADBE Position").value;
            var op = X.property("ADBE Opacity"), ps = X.property("ADBE Position"), e = [new KeyframeEase(0, 75)];
            op.setValueAtTime(t0, 0); op.setValueAtTime(t1, 100); ps.setValueAtTime(t0, [P[0], P[1] + 30]); ps.setValueAtTime(t1, [P[0], P[1]]);
            for (var q = 1; q <= 2; q++) { op.setInterpolationTypeAtKey(q, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); op.setTemporalEaseAtKey(q, e, e); ps.setInterpolationTypeAtKey(q, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); ps.setTemporalEaseAtKey(q, e, e); }
        }
        old.enabled = false; app.project.save(); log("caption layer: " + name + " (" + G.length + " glyphs); old text layer switched off");
    } catch (e) { log("ERR " + (e.line || "") + " " + e); }
    var lf = new File(CFG.work + "/log_04.txt"); lf.encoding = "UTF-8"; lf.open("w"); lf.write(LOG.join("\n")); lf.close();
})();
