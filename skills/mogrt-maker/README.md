# mogrt-maker — قوالب MOGRT متجاوبة لبريمير

A Claude Code skill for building **responsive Motion Graphics Templates** in After Effects that behave
well in Premiere Pro: type any name and the box, logo and lights follow — with a liquid-glass box that
really blurs the video underneath.

![result](examples/sheikh-name-lowerthird.gif)

Full quality: [`examples/sheikh-name-lowerthird.mp4`](examples/sheikh-name-lowerthird.mp4)

## What the template does
| Feature | How |
|---|---|
| One place to edit | a `CONTROL` null holds every setting; `NAME TEXT` is the one text input |
| Box follows the text | box = measured text bounds + padding; **right edge fixed** (Arabic), grows **left only** |
| Even grid | Pad Right / Left / Top / Bottom + true visual centring (`Text Y Fix`, measured on a render) |
| Liquid glass in Premiere | the video sits **inside** the template as a Media Replacement slot, the glass blurs it |
| Light sweeps | CC Light Sweep locked to each layer's anchor point (`toComp(anchorPoint)`) |
| In / Out | Out = the In keyframes reversed; text animation reversed with Time Remap |
| Logo parts | diamonds and their cut-outs stick to the box corners |
| Essential Graphics | Name, Extra Width, the four paddings, Position, the video slot |

## Workflow
1. Build or open the design in AE. Name everything in English, one `CONTROL` layer.
2. Wire the box to the text (expressions in [`references/expressions.md`](references/expressions.md)).
3. `scripts/mirror_out.jsx` → Out = reversed In. Render, check with `scripts/measure_ink.py`.
4. `scripts/make_export_copy.jsx` → export copy without Dynamic-Link-only effects, with a light
   placeholder instead of the footage (never touches an existing copy).
5. **Export by hand** from the Essential Graphics panel. `scripts/audit_mogrt.jsx` to check.
6. Premiere: Match Frame → Make Subclip → drag the subclip onto the template's video slot.

All the rules and the mistakes that taught them: [`SKILL.md`](SKILL.md).

## Requirements
- Adobe After Effects + an AE-MCP command-folder bridge (`~/Documents/ae-mcp-commands`) for the scripts.
- Python 3 with `numpy`, `Pillow` for `measure_ink.py`; ffmpeg for render checks.

## Credits
Design and direction: Amine — built together with Claude Code.
MIT License (code only). Footage and logos in `examples/` belong to their owners and are shown as a demo.
