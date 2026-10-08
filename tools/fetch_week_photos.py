#!/usr/bin/env python3
"""Fetch one freely licensed photo per week from Wikimedia Commons.

Adapted from the Bank site's tools/fetch_artefacts.py (same 429 backoff, file reuse, free-licence filter).
Reads data/weeks.json (each week has a "photo" list of candidate sources), writes img/w<ID>.jpg and
data/artefacts.json. Candidate syntax: "f:File name.jpg" (exact Commons file), "w:Wikipedia article"
(page image, then other Commons images used on the article), "s:search terms" (Commons search).
Prefers sources >= 1100px wide; stores JPEG resized to <= 1400px. Safe to re-run; skips weeks already done.
Usage: fetch_week_photos.py [week ids...]
"""
import json, os, re, sys, time, urllib.parse, urllib.request, html

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG = os.path.join(ROOT, "img")
WEEKS = os.path.join(ROOT, "data", "weeks.json")
OUT = os.environ.get("OUT") or os.path.join(ROOT, "data", "artefacts.json")
os.makedirs(IMG, exist_ok=True)

UA = "WW2StratMapPlates/1.0 (personal learning project; github.com/julianlee314-hue/ww2-strat-map)"
WP = "https://en.wikipedia.org/w/api.php"
CM = "https://commons.wikimedia.org/w/api.php"
FREE = re.compile(r"public domain|^pd|cc0|cc[- ]by|no restrictions|attribution|copyrighted free use|bundesarchiv|crown copyright|iwm", re.I)
BAD_LIC = re.compile(r"fair use|non-free|nc|nd\b", re.I)
OK_MIME = {"image/jpeg", "image/png", "image/tiff"}
SKIP_NAME = re.compile(r"(flag|coat_of_arms|coat of arms|seal_of|logo|icon|symbol|signature|locator|blank|map|karte|carte|diagram|plan_of|"
                       r"ribbon|medal|insignia|emblem|badge|stamp|banknote|coin|order_of|cross_of|chart|graph|\.svg|"
                       r"corpse|bodies|dead_|_dead|leichen|massacre_victims|mass_grave)", re.I)
PAUSE = float(os.environ.get("PAUSE", "1.5"))


def get(url, params, tries=7):
    q = url + "?" + urllib.parse.urlencode({**params, "format": "json", "formatversion": "2"})
    err = None
    for i in range(tries):
        try:
            req = urllib.request.Request(q, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                time.sleep(PAUSE)
                return json.load(r)
        except Exception as e:
            err = e
            msg = str(e).lower()
            wait = 60 if ("429" in msg or "rate" in msg) else (3 + 2 ** i)
            print(f"  API wait {wait}s: {e}", file=sys.stderr, flush=True)
            time.sleep(wait)
    print("  API failed:", err, file=sys.stderr)
    return {}


def strip(s, n=320):
    s = html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()
    s = re.sub(r"\s+", " ", s)
    return (s[: n - 1] + "…") if len(s) > n else s


def info_for(titles):
    res = []
    for i in range(0, len(titles), 40):
        d = get(CM, {"action": "query", "titles": "|".join(titles[i:i + 40]), "prop": "imageinfo",
                     "iiprop": "url|mime|size|extmetadata", "iiurlwidth": 1920})
        pages = d.get("query", {}).get("pages", [])
        order = {t: k for k, t in enumerate(titles)}
        # normalise mapping
        norm = {n["to"]: n["from"] for n in d.get("query", {}).get("normalized", [])}
        pages.sort(key=lambda p: order.get(norm.get(p.get("title"), p.get("title")), 999))
        res += pages
    return res


BLOCK = set()
_bf = os.path.join(HERE, "photo_block.txt")
if os.path.exists(_bf):
    BLOCK = {l.strip().replace("_", " ") for l in open(_bf) if l.strip() and not l.startswith("#")}
GRIM = re.compile(r"corpse|bodies|\bbody\b|\bdead\b|killed|victim|massacre|execution|executed|hanged|hanging|leichen|\btote|zwłoki|mass grave|"
                  r"atrocit|murder|skeleton|starved|emaciat|burnt alive|cadaver|wounded|injured", re.I)
MAPWORD = re.compile(r"\bmap\b|\bmaps\b|karte|\bmapa\b|carte|diagram|languages|census|positions|front line|situation", re.I)


def usable(p, strict=True):
    if p.get("missing") or not p.get("imageinfo"):
        return None
    if p["title"].replace("_", " ") in BLOCK:
        return None
    ii = p["imageinfo"][0]
    md = ii.get("extmetadata", {})
    lic = md.get("LicenseShortName", {}).get("value", "")
    if ii.get("mime") not in OK_MIME or not FREE.search(lic) or BAD_LIC.search(lic):
        return None
    if SKIP_NAME.search(p["title"]):
        return None
    w = ii.get("width", 0)
    if w < 600:
        return None
    desc_all = " ".join(strip(md.get(k, {}).get("value", ""), 2000) for k in ("ImageDescription", "ObjectName", "Categories"))
    if strict:
        if ii.get("mime") == "image/png":
            return None
        if GRIM.search(p["title"] + " " + desc_all) or MAPWORD.search(p["title"] + " " + desc_all):
            return None
    return {
        "commons": p["title"],
        "url": ii["url"], "thumb": ii.get("thumburl"), "mime": ii.get("mime"),
        "src_width": w, "src_height": ii.get("height", 0),
        "page": ii.get("descriptionurl"),
        "license": strip(lic, 60),
        "license_url": strip(md.get("LicenseUrl", {}).get("value", ""), 160),
        "artist": strip(md.get("Artist", {}).get("value", ""), 140) or "Unknown",
        "credit": strip(md.get("Credit", {}).get("value", ""), 160),
        "date": strip(md.get("DateTimeOriginal", {}).get("value", ""), 40),
        "desc": strip(md.get("ImageDescription", {}).get("value", ""), 300),
    }


def cands_file(title):
    if not title.startswith("File:"):
        title = "File:" + title
    return [u for u in (usable(p, strict=False) for p in info_for([title])) if u]


def cands_wiki(title):
    d = get(WP, {"action": "query", "titles": title, "prop": "pageimages|images", "piprop": "name",
                 "imlimit": 80, "redirects": 1})
    pages = d.get("query", {}).get("pages", [])
    if not pages:
        return []
    pg = pages[0]
    names = []
    if pg.get("pageimage"):
        names.append("File:" + pg["pageimage"].replace("_", " "))
    for im in pg.get("images", []):
        t = im["title"]
        if t not in names and not SKIP_NAME.search(t) and re.search(r"\.(jpe?g|png|tiff?)$", t, re.I):
            names.append(t)
    names = names[:45]
    return [u for u in (usable(p) for p in info_for(names)) if u]


def cands_search(q):
    d = get(CM, {"action": "query", "generator": "search", "gsrsearch": q + " filetype:bitmap",
                 "gsrnamespace": 6, "gsrlimit": 15, "prop": "imageinfo",
                 "iiprop": "url|mime|size|extmetadata", "iiurlwidth": 1920})
    pages = sorted(d.get("query", {}).get("pages", []), key=lambda p: p.get("index", 99))
    return [u for u in (usable(p) for p in pages) if u]


def download(hit, path):
    if os.path.exists(path) and os.path.getsize(path) > 5000:
        return True
    url = hit["url"] if (hit["src_width"] <= 2600 and hit["mime"] == "image/jpeg") or not hit.get("thumb") else hit["thumb"]
    tmp = path + ".src"
    err = None
    for i in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as f:
                f.write(r.read())
            break
        except Exception as e:
            err = e
            wait = 60 if "429" in str(e) else (4 + 2 ** i)
            print(f"  dl wait {wait}s: {e}", file=sys.stderr, flush=True)
            time.sleep(wait)
    else:
        print("  download fail", err, file=sys.stderr)
        return False
    time.sleep(PAUSE)
    try:
        from PIL import Image
        Image.MAX_IMAGE_PIXELS = None
        im = Image.open(tmp)
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); im = bg
        else:
            im = im.convert("RGB")
        im.thumbnail((1400, 1400))
        im.save(path, "JPEG", quality=80, optimize=True, progressive=True)
        hit["width"], hit["height"] = im.size
    except Exception as e:
        print("  PIL fail", e, file=sys.stderr)
        return False
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)
    return os.path.exists(path) and os.path.getsize(path) > 2000


def resolve(src):
    how, q = src.split(":", 1)
    if how == "f":
        return cands_file(q)
    if how == "w":
        return cands_wiki(q)
    return cands_search(q)


STOP = set("the and for with from that this into over under after before their there were was are its his her week".split())
ARCH = re.compile(r"bundesarchiv|imperial war museum|\biwm\b|nara|national archives|ria novosti|rian|library of congress|us navy|"
                  r"u\.s\. navy|usmc|marine corps|army signal corps|australian war memorial|awm|nhhc|naval history|"
                  r"national archief|nationaal archief|narodowe archiwum|nac\b|sa-kuva", re.I)


def score(g, wk):
    text = (g["commons"] + " " + g["desc"] + " " + g.get("credit", "") + " " + g.get("artist", "")).lower()
    when = g.get("date", "") + " " + g["commons"]
    sc = 0.0
    years = [int(y) for y in re.findall(r"\b(19[0-9]{2}|20[0-9]{2})\b", when)]
    if any(1936 <= y <= 1946 for y in years):
        sc += 3
    elif any(y >= 1950 for y in years):
        sc -= 4
    if ARCH.search(text):
        sc += 2
    words = {w for w in re.findall(r"[a-zà-ž]{4,}", (wk.get("headline", "") + " " + wk.get("place", "")).lower()) if w not in STOP}
    sc += 1.2 * sum(1 for w in words if w in text)
    if g["src_width"] >= 1100:
        sc += 2
    elif g["src_width"] < 800:
        sc -= 2
    if re.search(r"portrait|monument|memorial|grave|statue|museum|cemetery", text) and not wk.get("sober"):
        sc -= 2
    return sc


def main():
    weeks = json.load(open(WEEKS))
    only = set(sys.argv[1:])
    import glob
    manifest = json.load(open(OUT)) if os.path.exists(OUT) else {}
    start = os.environ.get("START")
    if start:
        ids = [w["id"] for w in weeks]
        weeks = weeks[ids.index(start):]
    def others():
        done, usedx = set(), set()
        for fn in glob.glob(os.path.join(ROOT, "data", "artefacts*.json")):
            if fn.endswith("artefacts_events.json") or os.path.abspath(fn) == os.path.abspath(OUT):
                continue
            try:
                m = json.load(open(fn))
            except Exception:
                continue
            done |= set(m); usedx |= {v.get("commons") for v in m.values()}
        return done, usedx
    for wk in weeks:
        wid = wk["id"]
        if only and wid not in only:
            continue
        done_o, used_o = others()
        used = {v.get("commons") for v in manifest.values()} | used_o
        if (wid in manifest or wid in done_o) and not only:
            continue
        srcs = wk.get("photo") or []
        pool, pick = [], None
        for src in srcs:
            got = resolve(src)
            fresh = [g for g in got if g["commons"] not in used and g["commons"] not in {p["commons"] for p in pool}]
            if src.startswith("f:") and fresh and fresh[0]["src_width"] >= 700:
                pick = fresh[0]  # explicit, hand-chosen file wins
                break
            pool += fresh
            if sum(1 for g in pool if score(g, wk) >= 6) >= 1:
                break
        if not pick and pool:
            pick = max(pool, key=lambda g: score(g, wk))
        if not pick:
            print(wid, "MISS", srcs, flush=True)
            continue
        fn = f"w{wid}.jpg"
        path = os.path.join(IMG, fn)
        if os.path.exists(path):
            os.remove(path)
        if not download(pick, path):
            print(wid, "DLFAIL", pick["commons"], flush=True)
            continue
        rec = {k: pick[k] for k in ("commons", "page", "artist", "credit", "license", "license_url", "date", "desc", "src_width", "src_height")}
        rec.update({"file": fn, "width": pick.get("width"), "height": pick.get("height"), "source": srcs})
        manifest[wid] = rec
        json.dump(manifest, open(OUT, "w"), indent=1, ensure_ascii=False)
        print(wid, "OK", pick["src_width"], pick["commons"][:90], "|", pick["license"], flush=True)
    print("DONE", len(manifest), "weeks with photos")


if __name__ == "__main__":
    main()
