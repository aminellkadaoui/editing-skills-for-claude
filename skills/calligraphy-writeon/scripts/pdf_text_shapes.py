#!/usr/bin/env python3
"""Rebuild a logo's Latin caption (e.g. "HIDAYAT") as vector shapes in the EXACT font
that is embedded in the client's PDF — no need to have the font installed.

AE renders an imported .ai's live text with a fallback font when the font is missing,
and "Create Shapes from Vector Layer" skips PDF text. This script reads the embedded
font program + glyph positions from the PDF and writes glyph outlines in the logo's
layer space (same space as the "Part N" layers), for 04_text_shapes.jsx.

usage: pdf_text_shapes.py LOGO.pdf WORK_DIR REF_PART
  REF_PART : a "Part N" that also exists in the PDF art, used to map PDF points to
             layer space (scale + offset are solved from its bounding box). The PDF's
             own bbox for that part is measured from the page drawing.
needs: pymupdf (fitz), fontTools
"""
import json, os, sys
import fitz
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen


def main():
    pdf, work, ref = sys.argv[1], sys.argv[2], sys.argv[3]
    parts = json.load(open(os.path.join(work, 'parts.json'), encoding='utf-8'))
    doc = fitz.open(pdf); pg = doc[0]
    # text spans + font
    spans = [s for b in pg.get_text('rawdict')['blocks'] for l in b.get('lines', []) for s in l['spans']]
    chars = [(c['c'], c['origin']) for s in spans for c in s['chars'] if c['c'].strip()]
    xref = doc.get_page_fonts(0)[0][0]
    _, ext, _, buf = doc.extract_font(xref)
    fpath = os.path.join(work, 'caption_font.' + ext); open(fpath, 'wb').write(buf)
    font = TTFont(fpath); upm = font['head'].unitsPerEm; gs = font.getGlyphSet(); cmap = font.getBestCmap()
    # text matrix scale (handles horizontally/vertically squashed text): read from the content stream Tm
    cs = pg.read_contents().decode('latin1'); i = cs.find(' Tm', cs.find('BT'))
    tm = cs[:i].split()[-6:]; SX, SY = abs(float(tm[0])), abs(float(tm[3]))
    # map PDF page coords -> logo layer coords using the reference part's bbox
    paths = [p for p in pg.get_drawings() if p['rect'].width < pg.rect.width * 0.9]
    ref_rect = parts[ref]['rect']
    # pick the drawing whose aspect ratio is closest to the reference part
    best = min(paths, key=lambda p: abs(p['rect'].width / max(p['rect'].height, 1e-6) - ref_rect[2] / ref_rect[3]) + (0 if p['rect'].width > 20 else 9))
    r = best['rect']; K = ref_rect[2] / r.width
    def tl(x, y): return [round((x - r.x0) * K + ref_rect[0], 3), round((y - r.y0) * K + ref_rect[1], 3)]

    class Pen(BasePen):
        def __init__(s, ox, oy): super().__init__(gs); s.c = []; s.ox, s.oy = ox, oy
        def pt(s, p): return tl(s.ox + p[0] / upm * SX, s.oy - p[1] / upm * SY)
        def _moveTo(s, p): s.cur = {'v': [s.pt(p)], 'i': [[0, 0]], 'o': [[0, 0]]}; s.c.append(s.cur)
        def _lineTo(s, p): s.cur['v'].append(s.pt(p)); s.cur['i'].append([0, 0]); s.cur['o'].append([0, 0])
        def _curveToOne(s, p1, p2, p3):
            a = s.cur['v'][-1]; b, c, d = s.pt(p1), s.pt(p2), s.pt(p3)
            s.cur['o'][-1] = [b[0] - a[0], b[1] - a[1]]; s.cur['v'].append(d); s.cur['i'].append([c[0] - d[0], c[1] - d[1]]); s.cur['o'].append([0, 0])
        def _qCurveToOne(s, p1, p2):
            p0 = s._getCurrentPoint()
            s._curveToOne((p0[0] + 2 / 3 * (p1[0] - p0[0]), p0[1] + 2 / 3 * (p1[1] - p0[1])), (p2[0] + 2 / 3 * (p1[0] - p2[0]), p2[1] + 2 / 3 * (p1[1] - p2[1])), p2)
        def _closePath(s):
            v = s.cur
            if len(v['v']) > 1 and abs(v['v'][0][0] - v['v'][-1][0]) < 1e-3 and abs(v['v'][0][1] - v['v'][-1][1]) < 1e-3:
                v['i'][0] = v['i'][-1]; v['v'].pop(); v['i'].pop(); v['o'].pop()
    out = []
    for ch, (ox, oy) in chars:
        p = Pen(ox, oy); gs[cmap[ord(ch)]].draw(p); out.append({'ch': ch, 'contours': p.c})
    json.dump(out, open(os.path.join(work, 'caption.json'), 'w', encoding='utf-8'))
    print('caption', ''.join(c for c, _ in chars), 'font', font['name'].getDebugName(4), 'scale', round(K, 4), '->', os.path.join(work, 'caption.json'))
    print('check: if the caption lands in the wrong place, the reference drawing match failed — pass another REF_PART')


if __name__ == '__main__':
    main()
