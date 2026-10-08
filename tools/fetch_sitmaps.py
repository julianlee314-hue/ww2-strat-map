#!/usr/bin/env python3
"""Find the HQ Twelfth Army Group daily situation map (Library of Congress, mirrored on Wikimedia Commons)
for each week from 6 June 1944 and store a 1280px preview in img/sitmap/. Writes data/sitmaps.json.
The maps are US Army works (public domain); LoC lists them with no known restrictions."""
import json, os, re, sys, time, datetime as dt, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_week_photos import get, CM, UA, strip
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTD = os.path.join(ROOT, 'img', 'sitmap'); os.makedirs(OUTD, exist_ok=True)
OUT = os.path.join(ROOT, 'data', 'sitmaps.json')
MON = {m: i + 1 for i, m in enumerate('January February March April May June July August September October November December'.split())}
titles = []
off = 0
while True:
    d = get(CM, {'action': 'query', 'list': 'search', 'srsearch': 'intitle:"Twelfth Army Group situation map"', 'srnamespace': 6,
                 'srlimit': 50, 'sroffset': off})
    hits = d.get('query', {}).get('search', [])
    titles += [h['title'] for h in hits]
    if 'continue' not in d or not hits: break
    off = d['continue']['sroffset']
maps = {}
for t in titles:
    m = re.match(r'File:\((\w+) (\d+), (\d{4})\), HQ Twelfth Army Group situation map\. LOC (\d+)\.(jpg|tif)', t)
    if not m: continue
    date = dt.date(int(m[3]), MON[m[1]], int(m[2]))
    cur = maps.get(date)
    if not cur or (m[5] == 'jpg' and cur['ext'] != 'jpg'):
        maps[date] = {'title': t, 'loc': m[4], 'ext': m[5], 'date': date.isoformat()}
print(len(titles), 'titles;', len(maps), 'dated maps', min(maps), max(maps))
weeks = json.load(open(os.path.join(ROOT, 'data', 'weeks.json')))
res = json.load(open(OUT)) if os.path.exists(OUT) else {}
for w in weeks:
    end = dt.date.fromisoformat(w['end']); start = dt.date.fromisoformat(w['start'])
    if end < dt.date(1944, 6, 6) or w['id'] in res: continue
    cands = [d for d in maps if d <= end and d >= start - dt.timedelta(days=3)]
    if not cands:
        print(w['id'], 'no map in week'); continue
    dsel = max(cands); mp = maps[dsel]
    info = get(CM, {'action': 'query', 'titles': mp['title'], 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1280})
    pages = info.get('query', {}).get('pages', [])
    if not pages or not pages[0].get('imageinfo'): print(w['id'], 'no info'); continue
    ii = pages[0]['imageinfo'][0]
    fn = f"sm{w['id']}.jpg"; path = os.path.join(OUTD, fn)
    if not os.path.exists(path):
        for i in range(4):
            try:
                req = urllib.request.Request(ii['thumburl'], headers={'User-Agent': UA})
                with urllib.request.urlopen(req, timeout=120) as r: data = r.read()
                break
            except Exception as e:
                print('  wait', e, file=sys.stderr); time.sleep(60 if '429' in str(e) else 5)
        else:
            continue
        from PIL import Image; import io
        im = Image.open(io.BytesIO(data)).convert('RGB'); im.thumbnail((1280, 1280)); im.save(path, 'JPEG', quality=78, optimize=True)
        time.sleep(2)
    md = ii.get('extmetadata', {})
    res[w['id']] = {'file': 'img/sitmap/' + fn, 'date': mp['date'], 'commons': mp['title'], 'page': ii['descriptionurl'],
                    'loc_item': f"https://www.loc.gov/item/{mp['loc']}/", 'license': strip(md.get('LicenseShortName', {}).get('value', ''), 60),
                    'src_width': ii['width'], 'src_height': ii['height']}
    json.dump(res, open(OUT, 'w'), indent=1)
    print(w['id'], mp['date'], ii['width'], flush=True)
print('DONE', len(res))
