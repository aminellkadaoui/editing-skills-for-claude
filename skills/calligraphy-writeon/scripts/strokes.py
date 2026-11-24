#!/usr/bin/env python3
"""Turn parts.json (from 01_import_split.jsx) into build.json for the write-on.

For every letter part: rasterise it, thin it to a skeleton, take the longest
path as the pen's centre line, and add extra lines until the matte strokes
cover >98% of the letter (e.g. the inner eye of a هـ). Then lay out the timing:
the pen moves at a constant speed along the strokes in writing order.

usage: strokes.py WORK_DIR [plan.json]
  plan.json (optional; written with defaults on first run, edit and re-run):
    order   : part names in writing order (letters only)
    reverse : parts whose centre line must run the other way
    dots    : parts that pop in after the writing (diamond dots, marks)
    start   : first frame (30 fps)      speed : layer px per frame
    gap     : frames between strokes    tail  : pen-line tail length (frames)
outputs: WORK/build.json and WORK/strokes_preview.png (red dot = start of a line)
"""
import json, os, sys
import numpy as np, cv2

K = 4.0  # raster px per layer px


def bez(p0, c1, c2, p1, n=40):
    t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * c1 + 3 * (1 - t) * t ** 2 * c2 + t ** 3 * p1


def poly(path, off):
    v, i, o = np.array(path['v']), np.array(path['i']), np.array(path['o'])
    n = len(v); m = n if path['c'] else n - 1
    pts = [bez(v[k], v[k] + o[k], v[(k + 1) % n] + i[(k + 1) % n], v[(k + 1) % n]) for k in range(m)]
    return np.vstack(pts) + off


def thin(img):  # Zhang-Suen
    img = img.copy().astype(np.uint8)
    while True:
        changed = False
        for step in (0, 1):
            P = np.pad(img, 1)
            p2, p3, p4, p5 = P[:-2, 1:-1], P[:-2, 2:], P[1:-1, 2:], P[2:, 2:]
            p6, p7, p8, p9 = P[2:, 1:-1], P[2:, :-2], P[1:-1, :-2], P[:-2, :-2]
            nb = [p2, p3, p4, p5, p6, p7, p8, p9]; B = sum(nb)
            A = sum(((nb[k] == 0) & (nb[(k + 1) % 8] == 1)).astype(int) for k in range(8))
            c = ((p2 * p4 * p6 == 0) & (p4 * p6 * p8 == 0)) if step == 0 else ((p2 * p4 * p8 == 0) & (p2 * p6 * p8 == 0))
            m = (img == 1) & (B >= 2) & (B <= 6) & (A == 1) & c
            if m.any():
                img[m] = 0; changed = True
        if not changed:
            return img


def longest(sk):
    ys, xs = np.nonzero(sk); idx = {(y, x): k for k, (y, x) in enumerate(zip(ys, xs))}
    nbr = [[idx[(y + dy, x + dx)] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (y + dy, x + dx) in idx]
           for y, x in zip(ys, xs)]

    def bfs(s):
        dist = [-1] * len(ys); prev = [-1] * len(ys); dist[s] = 0; q = [s]
        for u in q:
            for w in nbr[u]:
                if dist[w] < 0:
                    dist[w] = dist[u] + 1; prev[w] = u; q.append(w)
        return int(np.argmax(dist)), prev
    a, _ = bfs(0); b, prev = bfs(a); path = []; u = b
    while u != -1:
        path.append(u); u = prev[u]
    return np.array([[xs[k], ys[k]] for k in path], float)


def main():
    work = sys.argv[1]
    parts = json.load(open(os.path.join(work, 'parts.json'), encoding='utf-8'))
    plan_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(work, 'plan.json')
    if os.path.exists(plan_path):
        plan = json.load(open(plan_path, encoding='utf-8'))
    else:
        # default guess: gradient/small square parts = dots, the rest = letters right-to-left
        dots = [k for k, v in parts.items() if v.get('grad') or (abs(v['rect'][2] - v['rect'][3]) < 0.25 * max(v['rect'][2:]) and max(v['rect'][2:]) < 70)]
        letters = sorted([k for k in parts if k not in dots], key=lambda k: -(parts[k]['rect'][0] + parts[k]['rect'][2]))
        plan = {'order': letters, 'reverse': [], 'dots': dots, 'start': 15, 'speed': 22.0, 'gap': 3, 'tail': 6}
        json.dump(plan, open(plan_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('wrote default', plan_path, '- check order/reverse/dots against strokes_preview.png and re-run')

    W = int(max(v['rect'][0] + v['rect'][2] for v in parts.values()) + 20)
    H = int(max(v['rect'][1] + v['rect'][3] for v in parts.values()) + 20)
    viz = np.zeros((int(H * K), int(W * K), 3), np.uint8)
    strokes_by_part = {}
    for name in plan['order']:
        v = parts[name]
        m = np.zeros((int(H * K), int(W * K)), np.uint8)
        for p in v['paths']:
            cv2.fillPoly(m, [(poly(p, np.array(v['gp'])) * K).astype(np.int32)], 1)
        dt = cv2.distanceTransform(m, cv2.DIST_L2, 5)
        cover = np.zeros_like(m); rem = m.copy(); strokes = []
        for it in range(3):
            sk = thin(rem)
            if sk.sum() < 20:
                break
            n, lab = cv2.connectedComponents(sk, connectivity=8)
            big = max(range(1, n), key=lambda c: (lab == c).sum())
            comp = (lab == big).astype(np.uint8)
            line = longest(comp)
            ap = cv2.approxPolyDP(line.astype(np.float32).reshape(-1, 1, 2), 2.0, False).reshape(-1, 2).astype(float)
            w = float(np.percentile(dt[comp > 0], 97)) * 2
            if it == 0 and name in plan['reverse']:
                ap = ap[::-1]
            strokes.append({'pts': (ap / K).round(2).tolist(), 'w': round(w / K * 1.25 + 2, 1)})
            cv2.polylines(cover, [ap.astype(np.int32)], False, 1, int(w * 1.25 + 2 * K))
            rem = cv2.morphologyEx((m & (1 - cover)).astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
            if rem.sum() / m.sum() < 0.02:
                break
        strokes_by_part[name] = strokes
        unc = ((m > 0) & (cover == 0)).sum() / m.sum()
        print('%-9s lines %d  uncovered %.1f%%' % (name, len(strokes), unc * 100))
        viz[m > 0] = (70, 70, 70); viz[(cover > 0) & (m > 0)] = (90, 160, 90)
        for s in strokes:
            a = np.array(s['pts']) * K
            cv2.polylines(viz, [a.astype(np.int32)], False, (255, 255, 255), 2)
            cv2.circle(viz, tuple(a[0].astype(int)), 9, (0, 0, 255), -1)
        c = np.array(strokes[0]['pts'][len(strokes[0]['pts']) // 2]) * K
        cv2.putText(viz, name.replace('Part ', ''), tuple(c.astype(int)), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (0, 255, 255), 3)
    cv2.imwrite(os.path.join(work, 'strokes_preview.png'), viz)

    # timing: constant pen speed along the strokes, small lift between strokes
    t = plan['start']; seq = []; line = []; cum = 0.0; keys = []
    for name in plan['order']:
        for si, s in enumerate(strokes_by_part[name]):
            pts = s['pts']
            if line:
                cum += float(np.linalg.norm(np.array(pts[0]) - np.array(line[-1]))); t += plan['gap']
            ln = float(np.linalg.norm(np.diff(np.array(pts), axis=0), axis=1).sum())
            dur = max(6, round(ln / plan['speed']))
            keys.append((t, cum))
            seq.append({'part': name, 'idx': si, 'pts': pts, 'w': s['w'], 't0': t, 't1': t + dur})
            line += pts; cum += ln; t += dur; keys.append((t, cum))
    lk = []
    for f, c in keys:
        if not lk or lk[-1][0] != f:
            lk.append((f, round(c / cum * 100, 3)))
    dots = [{'part': d, 't': t + 2 + 3 * i} for i, d in enumerate(plan['dots'])]
    build = {'strokes': seq, 'line': line, 'lineKeys': lk, 'tail': plan['tail'], 'end': t,
             'dots': dots, 'text': {'t': t + 2 + 3 * len(dots)}}
    json.dump(build, open(os.path.join(work, 'build.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print('writing %d -> %d frames (%.2f s), %d lines; build.json written' % (plan['start'], t, (t - plan['start']) / 30, len(seq)))


if __name__ == '__main__':
    main()
