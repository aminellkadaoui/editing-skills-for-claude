// 02 — build the write-on from build.json:
//  * "Matte - Part N" above each letter: thick stroke(s) along its centre line with Trim Paths End 0→100,
//    the letter uses it as Alpha Matte
//  * "Pen Line": one white tapered stroke over the whole word; Trim End + Start (Start = End + tail frames)
//  * dots pop (0 → 115% → 100%), text layer fades + rises, particle bursts at the pen's start and end
//  Easing: user's house style "mountain" graph = 75% influence, 0 speed (Bezier) on first/last keys;
//  keys inside one continuous move stay linear so the pen never stops.
// CFG: { comp, work, textLayer (optional), penWidth (default 20), particles (default true) }
(function () {
    var LOG = []; function log(x) { LOG.push(x); }
    function F(f) { return f / 30; }
    try {
        var jf = new File(CFG.work + "/build.json"); jf.encoding = "UTF-8"; jf.open("r"); var B = eval("(" + jf.read() + ")"); jf.close();
        var C = null, i, k; for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name == CFG.comp) C = app.project.item(i);
        if (!C) throw "comp not found";
        // remove a previous build (re-runnable)
        for (k = C.numLayers; k >= 1; k--) { var n0 = C.layer(k).name; if (n0.indexOf("Matte - ") == 0 || n0 == "Pen Line" || n0.indexOf("Particles") == 0) C.layer(k).remove(); }
        var RT = C.layer(B.strokes[0].part).property("ADBE Transform Group");
        var A = RT.property("ADBE Anchor Point").value, P = RT.property("ADBE Position").value, SC = RT.property("ADBE Scale").value;
        function xf(L) { var t = L.property("ADBE Transform Group"); t.property("ADBE Anchor Point").setValue(A); t.property("ADBE Position").setValue(P); t.property("ADBE Scale").setValue(SC); }
        function shape(pts) {
            var sh = new Shape(), v = [], it = [], ot = [];
            for (var q = 0; q < pts.length; q++) {
                var a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)], tx = (b[0] - a[0]) / 6, ty = (b[1] - a[1]) / 6;
                if (q == 0 || q == pts.length - 1) { tx = 0; ty = 0; }
                v.push(pts[q]); it.push([-tx, -ty]); ot.push([tx, ty]);
            }
            sh.vertices = v; sh.inTangents = it; sh.outTangents = ot; sh.closed = false; return sh;
        }
        function strokeGroup(L, name, pts, w) {      // always re-fetch: addProperty invalidates references
            L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            var gi = L.property("ADBE Root Vectors Group").numProperties;
            function V() { return L.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group"); }
            L.property("ADBE Root Vectors Group").property(gi).name = name;
            V().addProperty("ADBE Vector Shape - Group"); V().property(1).property("ADBE Vector Shape").setValue(shape(pts));
            V().addProperty("ADBE Vector Graphic - Stroke");
            var st = V().property(2); st.property("ADBE Vector Stroke Color").setValue([1, 1, 1, 1]); st.property("ADBE Vector Stroke Width").setValue(w);
            st.property("ADBE Vector Stroke Line Cap").setValue(2); st.property("ADBE Vector Stroke Line Join").setValue(2);
            V().addProperty("ADBE Vector Filter - Trim");
            return gi;
        }
        function trim(L, gi) { return L.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim"); }
        function ease(prop, dims, first, last) {
            var e = []; for (var d = 0; d < dims; d++) e.push(new KeyframeEase(0, 75));
            for (var q = 1; q <= prop.numKeys; q++) {
                if ((q == 1 && first) || (q == prop.numKeys && last)) { prop.setInterpolationTypeAtKey(q, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); prop.setTemporalEaseAtKey(q, e, e); }
                else prop.setInterpolationTypeAtKey(q, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
            }
        }
        // 1) mattes
        var S = B.strokes, made = [], mname = [];
        for (i = 0; i < S.length; i++) {
            var s = S[i], M = null;
            for (k = 0; k < mname.length; k++) if (mname[k] == s.part) M = made[k];
            if (!M) { M = C.layers.addShape(); M.name = "Matte - " + s.part; xf(M); M.moveBefore(C.layer(s.part)); made.push(M); mname.push(s.part); }
            var gi = strokeGroup(M, "stroke " + (s.idx + 1), s.pts, s.w);
            var E = trim(M, gi).property("ADBE Vector Trim End"); E.setValueAtTime(F(s.t0), 0); E.setValueAtTime(F(s.t1), 100); ease(E, 1, i == 0, i == S.length - 1);
        }
        for (k = 0; k < made.length; k++) {
            var part = C.layer(mname[k]); made[k].moveBefore(part);
            try { part.setTrackMatte(made[k], TrackMatteType.ALPHA); } catch (e1) { part.trackMatteType = TrackMatteType.ALPHA; }
        }
        log("mattes: " + made.length);
        // 2) pen line
        var PL = C.layers.addShape(); PL.name = "Pen Line"; xf(PL); PL.moveToBeginning();
        var pg = strokeGroup(PL, "line", B.line, CFG.penWidth || 20);
        var E2 = trim(PL, pg).property("ADBE Vector Trim End");
        for (k = 0; k < B.lineKeys.length; k++) E2.setValueAtTime(F(B.lineKeys[k][0]), B.lineKeys[k][1]);
        var S2 = trim(PL, pg).property("ADBE Vector Trim Start");
        for (k = 0; k < B.lineKeys.length; k++) S2.setValueAtTime(F(B.lineKeys[k][0] + B.tail), B.lineKeys[k][1]);
        ease(trim(PL, pg).property("ADBE Vector Trim End"), 1, true, true); ease(trim(PL, pg).property("ADBE Vector Trim Start"), 1, true, true);
        try { PL.property("ADBE Root Vectors Group").property(pg).property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Taper").property("ADBE Vector Taper Start Length").setValue(100); } catch (e2) { log("taper n/a"); }
        log("pen line keys: " + B.lineKeys.length);
        // 3) dots pop, pivot at their own centre
        for (k = 0; k < B.dots.length; k++) {
            var D = C.layer(B.dots[k].part), X = D.property("ADBE Transform Group"), t0 = B.dots[k].t;
            var r = D.sourceRectAtTime(0, false), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            X.property("ADBE Anchor Point").setValue([cx, cy]); X.property("ADBE Position").setValue([P[0] + (cx - A[0]) * SC[0] / 100, P[1] + (cy - A[1]) * SC[1] / 100]);
            var sc = X.property("ADBE Scale"); while (sc.numKeys) sc.removeKey(1);
            sc.setValueAtTime(F(t0), [0, 0, 100]); sc.setValueAtTime(F(t0 + 7), [SC[0] * 1.15, SC[1] * 1.15, 100]); sc.setValueAtTime(F(t0 + 12), [SC[0], SC[1], 100]);
            ease(sc, 3, true, true); var e3 = [new KeyframeEase(0, 75), new KeyframeEase(0, 75), new KeyframeEase(0, 75)];
            sc.setInterpolationTypeAtKey(2, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); sc.setTemporalEaseAtKey(2, e3, e3);
        }
        // 4) text reveal
        if (CFG.textLayer) {
            var TL = C.layer(CFG.textLayer), TX = TL.property("ADBE Transform Group"), op = TX.property("ADBE Opacity"), tp = TX.property("ADBE Position"), p0 = tp.value, tt = B.text.t;
            while (op.numKeys) op.removeKey(1); while (tp.numKeys) tp.removeKey(1);
            op.setValueAtTime(F(tt), 0); op.setValueAtTime(F(tt + 15), 100); tp.setValueAtTime(F(tt), [p0[0], p0[1] + 30]); tp.setValueAtTime(F(tt + 15), [p0[0], p0[1]]);
            ease(op, 1, true, true); ease(tp, 1, true, true);
        }
        // 5) particle bursts at the start and end of the pen
        if (CFG.particles !== false) {
            var spots = [["Particles - start", B.line[0], B.lineKeys[0][0]], ["Particles - end", B.line[B.line.length - 1], B.lineKeys[B.lineKeys.length - 1][0]]];
            var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
            for (var s2 = 0; s2 < 2; s2++) {
                var PP = C.layers.addShape(); PP.name = spots[s2][0]; xf(PP); PP.moveToBeginning();
                var pt = spots[s2][1], tz = spots[s2][2];
                for (var n = 1; n <= 9; n++) {
                    PP.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
                    var G = function () { return PP.property("ADBE Root Vectors Group").property(n); };
                    G().name = "dot " + n;
                    G().property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");
                    var sz = 3 + rnd() * 4; G().property("ADBE Vectors Group").property(1).property("ADBE Vector Ellipse Size").setValue([sz, sz]);
                    G().property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill"); G().property("ADBE Vectors Group").property(2).property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);
                    var ang = (n / 9) * Math.PI * 2 + rnd() * 0.5, dist = 22 + rnd() * 26, dl = Math.round(rnd() * 3), du = 12 + Math.round(rnd() * 6);
                    var gp = G().property("ADBE Vector Transform Group").property("ADBE Vector Position"), gs = G().property("ADBE Vector Transform Group").property("ADBE Vector Scale");
                    gp.setValueAtTime(F(tz + dl), pt); gp.setValueAtTime(F(tz + dl + du), [pt[0] + Math.cos(ang) * dist, pt[1] + Math.sin(ang) * dist]);
                    gs.setValueAtTime(F(tz + dl), [0, 0]); gs.setValueAtTime(F(tz + dl + 4), [100, 100]); gs.setValueAtTime(F(tz + dl + du), [0, 0]);
                    var a1 = [new KeyframeEase(0, 75)], a2 = [new KeyframeEase(0, 75), new KeyframeEase(0, 75)];
                    for (var q = 1; q <= gp.numKeys; q++) { gp.setInterpolationTypeAtKey(q, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); gp.setTemporalEaseAtKey(q, a1, a1); }
                    for (q = 1; q <= gs.numKeys; q++) { gs.setInterpolationTypeAtKey(q, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); gs.setTemporalEaseAtKey(q, a2, a2); }
                }
            }
            log("particles: 2 bursts");
        }
        app.project.save(); log("saved");
    } catch (e) { log("ERR " + (e.line || "") + " " + e); }
    var lf = new File(CFG.work + "/log_02.txt"); lf.encoding = "UTF-8"; lf.open("w"); lf.write(LOG.join("\n")); lf.close();
})();
