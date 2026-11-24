#!/usr/bin/env python3
"""Measure how centred the text really is inside the box on a rendered frame.

usage: measure_ink.py frame.png BOX_TOP BOX_BOTTOM TEXT_LEFT TEXT_RIGHT [threshold=225]

Reads the white text pixels between the box edges (15 px in from each edge to skip the rim light)
and prints the gap above and below. Set CONTROL > Text Y Fix so both gaps match:
    Text Y Fix += (gap_top - gap_bottom) / 2   (negative = move the box up relative to the text)
Render the frame with aerender (H.264) + ffmpeg -frames:v 1, at a time where the In is finished.
"""
import sys
import numpy as np
from PIL import Image


def main():
    if len(sys.argv) < 6:
        sys.exit(__doc__)
    path = sys.argv[1]
    bt, bb, xl, xr = (int(v) for v in sys.argv[2:6])
    thr = int(sys.argv[6]) if len(sys.argv) > 6 else 225
    a = np.array(Image.open(path).convert('L')).astype(int)
    sub = a[bt + 15:bb - 15, xl:xr]
    rows = np.where((sub > thr).sum(1) > 2)[0]
    if not len(rows):
        sys.exit('no text pixels found - check the coordinates / threshold')
    top, bot = rows.min() + bt + 15, rows.max() + bt + 15
    gt, gb = top - bt, bb - bot
    print('ink rows %d..%d | gap top %d | gap bottom %d | suggested Text Y Fix change %+.0f' % (top, bot, gt, gb, (gt - gb) / 2.0))


if __name__ == '__main__':
    main()
