---
name: calligraphy-writeon
description: تحريك المخطوطات والشعارات الخطية العربية (كتابة بالريشة) في After Effects — Animate an Arabic calligraphy / lettering logo (.ai) in After Effects as if it is being written with a pen: per-letter matte strokes computed automatically from the letter shapes (skeleton → centre line → Trim Paths + Alpha Matte), a tapered leading pen line, landing bounce with real keyframes, dot pops, particle bursts, caption rebuilt in the exact PDF font, H.264 render. Use when someone says «حرك المخطوطة»، «تحريك مخطوطة»، «تحريك الشعار كأنه ينكتب»، «write-on للخط»، «lettering animation», «calligraphy reveal», or gives an .ai calligraphy logo + an AE comp.
---

# Calligraphy write-on (After Effects)

Method from the lettering-animation tutorial (each letter = its own shape layer revealed by a thick
stroke drawn along its centre with Trim Paths, used as Alpha Matte; one tapered pen line runs ahead),
automated: the centre lines are **computed from the letter outlines**, not drawn by hand.

## Needs
- After Effects open with the **AE-MCP panel** (command folder `~/Documents/ae-mcp-commands`). All AE
  steps go through `scripts/ae_run.py script.jsx config.json` (config becomes global `CFG`).
- Python 3 with `numpy`, `opencv-python`; for captions also `pymupdf`, `fontTools`.
- The calligraphy as an **.ai** (each stroke/dot a separate path or group — one group per piece).

## Steps
Make a work folder (scratch) and a `config.json`:
```json
{"ai": "/path/logo.ai", "comp": "المخطوطة", "work": "/scratch/cw", "scale": 200,
 "textLayers": ["HIDAYAT"], "textLayer": "HIDAYAT", "penWidth": 20}
```
1. `ae_run.py scripts/01_import_split.jsx config.json` → imports the .ai with layers, centres it at
   `scale`%, converts to shapes, splits every group into `Part N`, writes `parts.json` (+ a safety copy
   of the .aep). Read `log_01.txt`.
2. `python3 scripts/strokes.py WORK` → first run writes `plan.json` (a guess) and `strokes_preview.png`.
   **Look at the preview** (red dot = where each line starts) and fix `plan.json`:
   - `order`: letters in writing order (Arabic: right → left, as a calligrapher writes the word).
   - `reverse`: parts whose line runs the wrong way (e.g. a big ت sweep must start at its right end).
   - `dots`: diamond dots / small marks that pop instead of being written.
   - `speed` (layer px/frame, 22 ≈ 3.5 s for a 6-letter word), `start`, `gap`, `tail`.
   Re-run until every letter shows `uncovered < 1%` (extra lines are added automatically for
   inner loops such as the eye of هـ).
3. `ae_run.py scripts/02_build_writeon.jsx config.json` → mattes + Alpha Matte, Pen Line (Trim End,
   Start = End + `tail` frames, Taper start 100 %), dot pops (0 → 115 → 100), caption fade+rise,
   particle bursts at the pen's start and end. Re-runnable (removes its own layers first).
4. `ae_run.py scripts/03_bounce_keys.jsx` with `{"mode":"init","letters":[...]}` → soft landing bounce
   as **keyframes** on each letter (matte parented to the letter). The user reshapes the keys on ONE
   letter; then run again with `{"mode":"copy","master":"Part 10"}` to copy that bounce to the rest.
5. Caption font: AE shows the .ai's live text in a fallback font if the font isn't installed. If the
   client gave a PDF of the logo: `python3 scripts/pdf_text_shapes.py logo.pdf WORK "Part 10"` then
   `ae_run.py scripts/04_text_shapes.jsx` (`{"textLayer":"HIDAYAT","refPart":"Part 10"}`) → the caption
   becomes shapes in the **exact embedded font**; the old layer is switched off, its reveal copied.
6. Render: `scripts/render_mp4.sh project.aep "COMP" out.mp4 195` → plain **H.264 MP4** (never ProRes/.mov).
   Check frames with ffmpeg (the AE-MCP `render_frame` can return stale frames — trust aerender).

## House rules (Amine)
- Every move: **mountain graph** — Bezier, 75 % influence, 0 speed on start/end keys; keys inside one
  continuous pen move stay linear so the pen never stops.
- Bounce = **real keyframes**, not expressions; one soft overshoot that settles (~22 f), pivot on the
  letter's baseline. No ringing sine (it snaps at frame 0).
- Don't add controls/systems he didn't ask for; keep AE behaving normally. Save + backup before edits.

## Gotchas (learned)
- AE-MCP scripts: `addProperty` invalidates earlier references → re-fetch by index every time.
- Expressions: `var c = layer.effect; c("x")` breaks (`this` lost) → call `layer.effect("x")` directly.
- `for…in` over objects and `valueAtTime` on a property whose expression errors can kill the script
  with "Object of type Error found where a Number…" → use arrays, check `expressionError` instead.
- Comp background black + white logo: render frames over black to judge it, white bg hides the pen line.
