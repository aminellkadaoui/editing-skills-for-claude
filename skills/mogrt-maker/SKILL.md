---
name: mogrt-maker
description: صناعة قوالب MOGRT متجاوبة لبريمير من After Effects — Build responsive Motion Graphics Templates (.mogrt) in After Effects for Premiere Pro: a single CONTROL layer, a box that follows the text (right edge fixed for Arabic, grows left only), an even padding grid, true visual centering, liquid glass that really blurs the video in Premiere (Media Replacement), light sweeps locked to anchor points, In animation mirrored as Out, Essential Graphics panel, safe export copy. Use when someone says «سوّ مورجريت»، «مورجريت»، «MOGRT»، «قالب لبريمير»، «لوور ثيرد متجاوب»، «اسم الشيخ»، «Essential Graphics»، «liquid glass في بريمير», "make a mogrt", "responsive lower third", "template for Premiere".
---

# MOGRT Maker (After Effects → Premiere)

Built and battle-tested on the «Sheikh Name» lower third for the Tarteel program (Nov 2026).
The rules below are the lessons — most of them were learned by breaking something first.

## 0. Before you touch anything
- Ask which comp is THE template, and whether the user already has an export copy he edited
  (Essential Graphics names/order, extra layers). **Never rebuild, delete or overwrite a comp or a
  .mogrt the user touched** — duplicate, or edit in place. Read the comp first (layers, EG list).
- Save + timestamped backup into `Backups/` before every scripted change; `app.purge(UNDO_CACHES)`
  after (else his Cmd+Z deletes your work). Tell him undo history was cleared.
- Don't move his positions or change values he set. Add only what he asked for.
- English layer and comp names (`CONTROL`, `NAME TEXT`, `Name`, `Box Matte`, `Box`, `Glass`,
  `Inner Light Green`, `Box Light Sweep`, `Tarteel Diamonds`, `Sheikh Footage`…). When renaming,
  rewrite every `comp("old")` / `layer("old")` in all expressions of the project (`scripts/rename_refs.jsx`).

## 1. Architecture (one flat main comp + small precomps)
```
Main comp «Sheikh Name»
  CONTROL            null — every setting lives here (sliders/points), parent of the texts
  NAME TEXT          hidden text layer = the ONE input; inner text layers read it as a string
  Tarteel Diamonds   precomp — logo parts, positions = box corners
  Inner Light *      solids + Gradient Ramp (radial), Screen, matte = Box Matte
  Name               precomp of the styled text (Collapse ON), anchor = right edge, parent CONTROL
  Box Light Sweep    shape = same box, CC Light Sweep on its anchor, matte = Box Matte
  Box Matte          precomp (hidden): Box shape + cut shapes (Silhouette Alpha)  ← single source of the shape
  Glass              adjustment solid: Gaussian Blur + Exposure, matte = Box Matte
  Sheikh Footage     the video — Media Replacement in Essential Graphics
```
Everything that draws the box takes its matte from ONE precomp (`Box Matte`). Mattes go on the
layers themselves; avoid matte-of-a-matte chains and track mattes on precomps that must collapse.

## 2. The box follows the text (RTL)
- CONTROL effects: `Extra Width`, `Pad Right`, `Pad Left`, `Pad Top`, `Pad Bottom`, `Text Y Fix`,
  and computed points `Text TL`, `Text BR`, `Box TL`, `Box BR` (expressions in references/expressions.md).
- Text bounds are measured through the precomp chain (`L.toComp(T.toComp(...))`) including the
  final offset of a Transform effect if the text template has one.
- **Right edge fixed** (where Arabic text starts); width grows to the left only. `Extra Width` adds on the left.
- Even grid: same padding left/right, same top/bottom. Measure the current look first, keep it.
- **Visual centering:** sourceRectAtTime of Arabic text sits lower than the real ink. Render a frame,
  measure the white pixel rows inside the box (scripts/measure_ink.py) and set `Text Y Fix`
  (−19 px for thmanyah Medium at that size) so the gap above = gap below.
- Never tie the box to a layer's **Scale** value (user: «شيل ربط السكيل»). Measuring visual bounds is fine.
- Optional rows (e.g. a role line): hide when the checkbox is off OR the text is empty, and exclude it
  from the bounds. Ask whether the row is needed at all — the user removed it in the end.

## 3. Animation
- Keep the user's keyframes. When a property is driven by an expression, apply his keys as a ratio:
  `value / maxKeyValue` (NOT the last key — after mirroring the last key is the closed one).
- **Out = In reversed** (scripts/mirror_out.jsx): remove old out keys, copy every In key to
  `end − t` with in/out ease swapped. Text animation inside a precomp: Time Remap
  `[start→0, start+len→len, end−len−start→len, end−start→0]`, linear.
- Mountain ease (75 %) for anything new.

## 4. Light sweeps, effects on shapes
- CC Light Sweep center = the layer's anchor, always: `toComp(anchorPoint)` on collapsed
  (continuously rasterized) shape layers — their effect points are in comp space.
  Shape layer anchor = centre of its shape: `var r=sourceRectAtTime(time,false);[r.left+r.width/2,r.top+r.height/2]`.
- Effects (Fill, Fast Box Blur, Gradient Ramp) on collapsed shape layers draw OFFSET → use comp-size
  solids with a radial Gradient Ramp whose points are `fromComp(BOX.toComp([...]))`.

## 5. Liquid glass that works in Premiere
- A MOGRT cannot see the video under it in Premiere, so an adjustment layer in the template blurs
  nothing. Put the video **inside** the template: footage layer → Essential Graphics (Media Replacement).
- In Premiere: Match Frame (F) → set In/Out → Make Subclip (Cmd+U) → drag the subclip from the
  Project panel onto the media slot. (The slot does not accept clips from the timeline.)
- Before export swap the footage for a light still (`Placeholders/…placeholder.jpg`) — every media file
  in the comp gets packed into the .mogrt (6 GB footage = 6 GB mogrt). Restore the video after.
- Adjustment switch can't be set on a layer used as a track-matte source → separate `Glass` layer.

## 6. Export (manual!)
- Third-party effects (Deep Glow…) make the template "Dynamic Link only", and Dynamic Link templates
  can't have Media Replacement. Keep them in the originals; export from a copy without them
  (scripts/make_export_copy.jsx — refuses to overwrite an existing copy).
- **Export from the Essential Graphics panel by hand.** Scripted `exportAsMotionGraphicsTemplate`
  (path must be a FOLDER) wrote empty defaults (Name empty, sliders 0, Position 0) and crashed AE once.
  Never overwrite the user's .mogrt with a scripted export.
- Sliders in EG default to 0–100; if a default is larger (Pad 186) set the range in EG (Edit Properties).
- After export: scripts/audit_mogrt.jsx — EG list, expression errors, third-party effects, big media.

## 7. Text templates reused from other comps (e.g. «09 - يؤثر» style)
- Duplicate the style comp, link every text layer to one MAIN TEXT, MAIN TEXT reads `NAME TEXT`.
- Don't widen a text comp: AE rescales effect points (sweep paths, Transform) with comp width.
  Turn **Collapse Transformations** on for the precomp layer instead.
- Masks drawn for one short word → mask path expression that stretches with sourceRectAtTime,
  keeping the keyframed wipe (references/expressions.md).

## 8. AE scripting gotchas (AE-MCP command folder)
- Reading `.value` of a property whose expression errors kills the script with an uncatchable
  "Object of type Error…" → check `expressionError`, set expressions in dependency order.
- `addProperty` invalidates references → re-fetch by name. `toComp` exists only in expressions.
- `copyToComp` doesn't put the copy at index 1 → find it by name.
- Log progress to a file; the panel's return value isn't reliable on errors.
- Render checks with aerender (H.264) + ffmpeg crops; AE-MCP render_frame can be stale.
- Never `rm` a variable path in shell commands — write new filenames instead.

Files: `references/expressions.md` (all expressions), `scripts/` (ae_run.py, mirror_out.jsx,
make_export_copy.jsx, audit_mogrt.jsx, rename_refs.jsx, measure_ink.py), `examples/`.
