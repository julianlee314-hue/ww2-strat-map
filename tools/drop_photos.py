#!/usr/bin/env python3
"""Remove week photos from data/artefacts.json (and img/) so they get re-fetched; optionally add them to the block list."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
block = '--block' in sys.argv
ids = [a for a in sys.argv[1:] if not a.startswith('--')]
p = os.path.join(ROOT, 'data/artefacts.json'); m = json.load(open(p))
with open(os.path.join(ROOT, 'tools/photo_block.txt'), 'a') as bf:
    for k in ids:
        r = m.pop(k, None)
        if not r: continue
        f = os.path.join(ROOT, 'img', r['file'])
        if os.path.exists(f): os.remove(f)
        if block: bf.write(r['commons'] + '\n')
        print('dropped', k, r['commons'])
json.dump(m, open(p, 'w'), indent=1, ensure_ascii=False)
