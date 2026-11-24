// 03 — landing bounce with REAL KEYFRAMES (no expressions — the user wants keys he can grab).
// Mode "init": put a soft single-overshoot bounce (measured from a reference) on every letter,
//              at the moment its main matte stroke finishes; parent each matte to its letter so
//              only the letter carries keys.
// Mode "copy": the user reshapes the keys on ONE letter (CFG.master); copy that bounce
//              (times relative to its landing, values relative to rest) onto all other letters.
// CFG: { comp, work, mode: "init"|"copy", master: "Part 10", letters: ["Part 10", ...] }
(function () {
    var LOG = []; function log(x) { LOG.push(x); }
    try {
        var C = null, i, k; for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name == CFG.comp) C = app.project.item(i);
        function landing(part) {
            var g = C.layer("Matte - " + part).property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End");
            return g.keyTime(g.numKeys);
        }
        function ease(p, dims) { var e = []; for (var d = 0; d < dims; d++) e.push(new KeyframeEase(0, 75)); for (var q = 1; q <= p.numKeys; q++) { p.setInterpolationTypeAtKey(q, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); p.setTemporalEaseAtKey(q, e, e); } }
        var L = CFG.letters, curve;
        if (CFG.mode == "copy") {
            var MX = C.layer(CFG.master).property("ADBE Transform Group"), ms = MX.property("ADBE Scale"), mr = MX.property("ADBE Rotate Z"), t0 = landing(CFG.master);
            var rest = ms.keyValue(ms.numKeys);
            curve = { s: [], r: [] };
            for (k = 1; k <= ms.numKeys; k++) curve.s.push([ms.keyTime(k) - t0, ms.keyValue(k)[0] / rest[0], ms.keyValue(k)[1] / rest[1], ms.keyInTemporalEase(k), ms.keyOutTemporalEase(k)]);
            for (k = 1; k <= mr.numKeys; k++) curve.r.push([mr.keyTime(k) - t0, mr.keyValue(k), mr.keyInTemporalEase(k), mr.keyOutTemporalEase(k)]);
        } else {
            // soft bounce: one overshoot, settles in ~22 frames, arrives/leaves with 75% ease
            var F = [0, 5, 13, 22], Y = [0, -4, 1.2, 0], X = [0, 1.5, -0.4, 0], R = [0, -1.2, 0.3, 0];
            curve = { s: [], r: [] };
            for (k = 0; k < F.length; k++) { curve.s.push([F[k] / 30, 1 + X[k] / 100, 1 + Y[k] / 100]); curve.r.push([F[k] / 30, R[k]]); }
        }
        for (i = 0; i < L.length; i++) {
            if (CFG.mode == "copy" && L[i] == CFG.master) continue;
            var P = C.layer(L[i]), M = C.layer("Matte - " + L[i]), X2 = P.property("ADBE Transform Group"), t = landing(L[i]);
            // pivot on the letter's baseline centre, keep it in place
            if (CFG.mode != "copy") {
                var r = P.sourceRectAtTime(t, false), A = X2.property("ADBE Anchor Point").value, Pp = X2.property("ADBE Position").value, S0 = X2.property("ADBE Scale").value;
                var cx = r.left + r.width / 2, cy = r.top + r.height;
                X2.property("ADBE Anchor Point").setValue([cx, cy]); X2.property("ADBE Position").setValue([Pp[0] + (cx - A[0]) * S0[0] / 100, Pp[1] + (cy - A[1]) * S0[1] / 100]);
                M.parent = P; var MX2 = M.property("ADBE Transform Group");   // matte shares the letter's layer space
                MX2.property("ADBE Anchor Point").setValue([0, 0]); MX2.property("ADBE Position").setValue([0, 0]); MX2.property("ADBE Scale").setValue([100, 100]); MX2.property("ADBE Rotate Z").setValue(0);
            }
            var sc = X2.property("ADBE Scale"), ro = X2.property("ADBE Rotate Z"), base = sc.numKeys ? sc.keyValue(sc.numKeys) : sc.value;
            while (sc.numKeys) sc.removeKey(1); while (ro.numKeys) ro.removeKey(1);
            for (k = 0; k < curve.s.length; k++) sc.setValueAtTime(t + curve.s[k][0], [base[0] * curve.s[k][1], base[1] * curve.s[k][2], 100]);
            for (k = 0; k < curve.r.length; k++) ro.setValueAtTime(t + curve.r[k][0], curve.r[k][1]);
            if (CFG.mode == "copy") {
                for (k = 1; k <= sc.numKeys; k++) { sc.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); sc.setTemporalEaseAtKey(k, curve.s[k - 1][3], curve.s[k - 1][4]); }
                for (k = 1; k <= ro.numKeys; k++) { ro.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); ro.setTemporalEaseAtKey(k, curve.r[k - 1][2], curve.r[k - 1][3]); }
            } else { ease(sc, 3); ease(ro, 1); }
            log(L[i] + " bounce at " + Math.round(t * 30) + "f");
        }
        app.project.save(); log("saved (" + CFG.mode + ")");
    } catch (e) { log("ERR " + (e.line || "") + " " + e); }
    var lf = new File(CFG.work + "/log_03.txt"); lf.encoding = "UTF-8"; lf.open("w"); lf.write(LOG.join("\n")); lf.close();
})();
