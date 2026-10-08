#!/usr/bin/env python3
"""Parse the design team's TimeGhost week-by-week guide (pdftohtml -xml output) into data/guide.json."""
import re, json, sys, html, datetime as dt
src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ww2/guide.xml'
out = sys.argv[2] if len(sys.argv) > 2 else 'data/guide.json'
xml = open(src, encoding='utf-8').read()
MON = {m: i+1 for i, m in enumerate('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split())}
rows = []
for pnum, page in re.findall(r'<page number="(\d+)"(.*?)</page>', xml, re.S):
    items = []
    for top, left, font, body in re.findall(r'<text top="(\d+)" left="(\d+)"[^>]*font="(\d+)">(.*?)</text>', page, re.S):
        items.append((int(top), int(left), font, body))
    for top, left, font, body in items:
        txt = html.unescape(re.sub(r'<[^>]+>', '', body)).strip()
        if left < 120 and re.fullmatch(r'\d{1,3}[a-z]?', txt):
            rows.append({'week': txt, 'top': top, 'page': int(pnum), 'dates': None, 'title': None, 'url': None, 'bigboard': None})
        elif 120 <= left < 300 and rows and rows[-1]['page'] == int(pnum) and abs(rows[-1]['top'] - top) <= 4 and re.search(r'\d{4}', txt):
            rows[-1]['dates'] = txt
        elif left >= 300 and rows and rows[-1]['page'] == int(pnum):
            r = rows[-1]
            if txt.startswith('On the Big Board:'):
                r['bigboard'] = (r['bigboard'] + '; ' if r['bigboard'] else '') + txt.split(':', 1)[1].strip()
            elif abs(r['top'] - top) <= 4:
                m = re.search(r'href="([^"]+)"', body)
                r['url'] = m.group(1) if m else None
                r['title'] = re.sub(r'\s+', ' ', txt)
            elif r['title'] and top - r['top'] < 25 and not txt.startswith('World War Two Week'):
                r['title'] += ' ' + txt  # wrapped title
def parse_dates(s):
    s = s.replace('–', '-')
    m = re.fullmatch(r'(\d+) (\w{3}) (\d{4})', s.strip())
    if m:
        d = dt.date(int(m[3]), MON[m[2]], int(m[1])); return d, d
    m = re.fullmatch(r'(\d+) (\w{3}) - (\d+) (\w{3}) (\d{4})', s.strip())
    y = int(m[5]); e = dt.date(y, MON[m[4]], int(m[3]))
    st = dt.date(y if MON[m[2]] <= MON[m[4]] else y - 1, MON[m[2]], int(m[1]))
    return st, e
out_rows = []
for r in rows:
    st, en = parse_dates(r['dates'])
    out_rows.append({'id': r['week'], 'start': st.isoformat(), 'end': en.isoformat(), 'dates_label': r['dates'],
                     'episode': r['title'], 'url': r['url'], 'bigboard': r['bigboard']})
json.dump(out_rows, open(out, 'w'), indent=1, ensure_ascii=False)
print(len(out_rows), 'rows;', sum(1 for r in out_rows if r['url']), 'links;', sum(1 for r in out_rows if r['bigboard']), 'big board')
