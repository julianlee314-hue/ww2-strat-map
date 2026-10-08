#!/usr/bin/env python3
"""Build data/atlas.geojson: Natural Earth 1:50m admin-0 (public domain), clipped by bbox to Europe/Med/N. Africa/Middle East,
simplified (RDP) and rounded. Feature id = ADM0_A3."""
import json, math, sys
src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ww2/ne50.geojson'
BB = (-32, 12, 66, 75)  # lon0 lat0 lon1 lat1
EPS = 0.025
def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0]-a[0], b[1]-a[1]; L = math.hypot(dx, dy) or 1e-12
    dmax, idx = 0, 0
    for i in range(1, len(pts)-1):
        p = pts[i]
        d = abs(dy*p[0] - dx*p[1] + b[0]*a[1] - b[1]*a[0]) / L if (dx or dy) else math.hypot(p[0]-a[0], p[1]-a[1])
        if d > dmax: dmax, idx = d, i
    if dmax > eps:
        return rdp(pts[:idx+1], eps)[:-1] + rdp(pts[idx:], eps)
    return [a, b]
def ring_ok(r):
    xs = [p[0] for p in r]; ys = [p[1] for p in r]
    return not (max(xs) < BB[0] or min(xs) > BB[2] or max(ys) < BB[1] or min(ys) > BB[3])
def simp(r):
    out = rdp(r, EPS)
    out = [[round(x, 2), round(y, 2)] for x, y in out]
    ded = [out[0]] + [p for i, p in enumerate(out[1:], 1) if p != out[i-1]]
    if ded[0] != ded[-1]: ded.append(ded[0])
    return ded if len(ded) >= 4 else None
g = json.load(open(src))
feats = []
for f in g['features']:
    p = f['properties']; geom = f['geometry']
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    keep = []
    for poly in polys:
        if not ring_ok(poly[0]): continue
        rings = [s for s in (simp(r) for r in poly) if s]
        if rings and len(rings[0]) >= 4: keep.append(rings)
    if not keep: continue
    iid = p['ADM0_A3']
    if iid == 'SDS': iid = 'SSD'
    feats.append({'type': 'Feature', 'id': iid, 'properties': {'name': p['NAME']},
                  'geometry': {'type': 'MultiPolygon', 'coordinates': keep}})
json.dump({'type': 'FeatureCollection', 'features': feats}, open('data/atlas.geojson', 'w'), separators=(',', ':'))
print(len(feats), 'features', sorted(f['id'] for f in feats))
