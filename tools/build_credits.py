#!/usr/bin/env python3
"""Write CREDITS.md from data/artefacts.json and data/sitmaps.json."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p, d=None: json.load(open(os.path.join(ROOT, p))) if os.path.exists(os.path.join(ROOT, p)) else d
arts = {} if os.environ.get('NOPHOTOS') else J('data/artefacts.json', {}); sm = {} if os.environ.get('NOMAPS') else J('data/sitmaps.json', {}); weeks = J('data/weeks.json', [])
order = {w['id']: i for i, w in enumerate(weeks)}
L = ["# Credits — The War, week by week (a Chronograph)", "",
     "Country geometries: [Natural Earth](https://www.naturalearthdata.com/) 1:50m and 1:110m (public domain); world-atlas TopoJSON by Mike Bostock (ISC).", "",
     "Week guide: TimeGhost History, *World War Two* (YouTube, https://www.youtube.com/@WorldWarTwo). Episode titles are quoted only as references, with links. Headlines and articles are our own.", "",
     "Photographs: Wikimedia Commons, public domain or Creative Commons only. The author, licence and source page for each file are listed below and on each card.", "",
     "## Week photographs", ""]
for k in sorted([k for k in arts if k in order], key=lambda k: order[k]):
    a = arts[k]
    L.append(f"- **Week {k}** — [{a['commons'].replace('File:', '')}]({a['page']}) — {a.get('artist') or 'unknown'} — {a.get('license') or ''}" + (f" ([licence]({a['license_url']}))" if a.get('license_url') else "") + (f" — {a['date']}" if a.get('date') else ""))
wr = {} if os.environ.get("NOMAPS") else J("data/warroom.json", {})
if wr:
    L += ["", "## War-room plates (About the war room)", ""]
    for k in wr:
        a = wr[k]; L.append(f"- **{a.get('caption', k)}** — [{a['commons'].replace('File:', '')}]({a['page']}) — {a.get('artist') or 'unknown'} — {a.get('license') or ''}")
L += ["", "## Situation maps", "", "HQ Twelfth Army Group situation maps, US Army, 1944–45: public domain. Library of Congress, Geography and Map Division, [World War II Military Situation Maps](https://www.loc.gov/collections/world-war-ii-maps-military-situation-maps-from-1944-to-1945/); the images were downloaded from the Wikimedia Commons mirror.", ""]
for k in sorted(sm, key=lambda k: order.get(k, 0)):
    m = sm[k]; L.append(f"- **Week {k}** — situation of {m['date']} — [LoC item]({m['loc_item']}) · [Commons]({m['page']})")
L += ["", "## Legacy", "", "`data/artefacts_events.json` and `img/e*.jpg` are the v1 event plates. The v1 credits were incomplete, so the current site does not show these images; the culture events are shown as text only.", ""]
open(os.path.join(ROOT, 'CREDITS.md'), 'w').write('\n'.join(L))
print('credits:', len([k for k in arts if k in order]), 'photos,', len(sm), 'maps')
