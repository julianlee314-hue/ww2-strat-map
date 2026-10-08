#!/usr/bin/env python3
"""Fetch a few Commons photographs of real WW2 map and operations rooms for the 'About the war room' panel -> data/warroom.json, img/wr_*.jpg"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fetch_week_photos as F
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLATES = [
  ("wr_cwr", "The Map Room, Cabinet War Rooms, London", ["s:Churchill War Rooms Map Room", "s:Cabinet War Rooms map room"]),
  ("wr_bbb", "No. 11 Group operations room, Uxbridge (Battle of Britain Bunker)", ["s:Battle of Britain Bunker Uxbridge plotting table", "s:Uxbridge bunker operations room"]),
  ("wr_waaf", "WAAF plotters in a Fighter Command operations room", ["s:WAAF plotters operations room", "s:Bentley Priory operations room"]),
  ("wr_wa", "Western Approaches Command, Derby House, Liverpool", ["s:Western Approaches Liverpool operations room", "s:Western Approaches Museum Liverpool"]),
  ("wr_shaef", "Allied map room at Supreme HQ (SHAEF)", ["s:SHAEF map room 1944", "s:SHAEF war room"]),
  ("wr_fdr", "The Map Room in the White House", ["w:Map Room (White House)", "s:White House Map Room 1943"]),
]
out = {}
p = os.path.join(ROOT, "data/warroom.json")
if os.path.exists(p): out = json.load(open(p))
for key, cap, srcs in PLATES:
    if key in out: continue
    hit = None
    for s in srcs:
        how, q = s.split(":", 1)
        c = F.cands_wiki(q) if how == "w" else [u for u in (F.usable(pg, strict=False) for pg in F.get(F.CM, {"action": "query", "generator": "search", "gsrsearch": q + " filetype:bitmap", "gsrnamespace": 6, "gsrlimit": 12, "prop": "imageinfo", "iiprop": "url|mime|size|extmetadata", "iiurlwidth": 1920}).get("query", {}).get("pages", [])) if u]
        c = [x for x in c if x["src_width"] >= 900 and x["mime"] == "image/jpeg" and not F.re.search(r"\bmap\b.*\.(png|svg)", x["commons"], F.re.I)]
        if c: hit = c[0]; break
    if not hit: print(key, "MISS"); continue
    fn = f"{key}.jpg"
    if F.download(hit, os.path.join(ROOT, "img", fn)):
        hit.update(file=fn, caption=cap); hit.pop("url", None); hit.pop("thumb", None); out[key] = hit
        print(key, "OK", hit["commons"], hit["license"])
    json.dump(out, open(p, "w"), indent=1, ensure_ascii=False)
