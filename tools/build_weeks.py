#!/usr/bin/env python3
"""Merge data/guide.json (TimeGhost episode guide rows) with tools/articles/*.txt (our own week articles) -> data/weeks.json."""
import json, re, glob, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
guide = json.load(open(os.path.join(ROOT, 'data/guide.json')))
arts = {}
for fn in sorted(glob.glob(os.path.join(ROOT, 'tools/articles/*.txt'))):
    txt = open(fn, encoding='utf-8').read()
    for block in re.split(r'^@@ ', txt, flags=re.M)[1:]:
        lines = block.strip().split('\n')
        head = [h.strip() for h in lines[0].split('|')]
        wid = head[0]; lat, lon = map(float, head[1].split(','))
        rec = {'lat': lat, 'lon': lon, 'place': head[2], 'region': head[3], 'sober': 'sober' in ' '.join(head[4:]).split()}
        for ln in lines[1:]:
            if ln.startswith('H: '): rec['headline'] = ln[3:].strip()
            elif ln.startswith('P: '): rec['photo'] = [s.strip() for s in ln[3:].split(' ; ') if s.strip()]
            elif ln.startswith('A: '): rec['article'] = ln[3:].strip()
            elif ln.strip() and 'article' in rec: rec['article'] += ' ' + ln.strip()
        if wid in arts: print('DUP', wid, file=sys.stderr)
        arts[wid] = rec
out, missing = [], []
for g in guide:
    a = arts.get(g['id'])
    if not a: missing.append(g['id']); continue
    w = dict(g); w.update(a)
    w['words'] = len(a.get('article', '').split())
    out.append(w)
extra = set(arts) - {g['id'] for g in guide}
json.dump(out, open(os.path.join(ROOT, 'data/weeks.json'), 'w'), indent=1, ensure_ascii=False)
wc = [w['words'] for w in out]
print(len(out), 'weeks written; missing', len(missing), (missing[:5], missing[-3:]) if missing else '', '; extra', sorted(extra),
      '; words min/max', min(wc) if wc else 0, max(wc) if wc else 0)
short = [(w['id'], w['words']) for w in out if w['words'] < 100 or w['words'] > 180]
if short: print('out of range:', short)
