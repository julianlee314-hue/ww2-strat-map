# The War, week by week — a Chronograph

**Europe on the map, the world in the margins.** One entry for every week of the Second World War in Europe (1 Sep 1939 – 8 May 1945, 305 weeks), on a paper atlas you can scrub through week by week.

**Live:** https://julianlee314-hue.github.io/ww2-strat-map/

Part of **Chronographs**, a series of long-run "living graphs": one picture of a period you can scrub through, with an event card, an archive plate and a lane of leaders. Series home: https://julianlee314-hue.github.io/chronographs/ (the "A Chronograph" kicker in the header links there). Siblings: [The Dow, 1896–2026](https://julianlee314-hue.github.io/dow-timeline/v0.2/) · [The Bank, 1694–1994](https://julianlee314-hue.github.io/the-bank-1694/).

## The week spine and TimeGhost

The spine follows a week-by-week guide to **TimeGhost History's _World War Two_** series, presented by Indy Neidell: <https://www.youtube.com/@WorldWarTwo>. The guide lists 305 rows (weekly episodes plus a few mid-week specials; week 261 is not in any playlist). Each card ends with a small "TimeGhost episode: …" reference and a **Watch the episode** link to that episode on YouTube.

The headlines and the 100–180-word articles are **our own**, written from general historical knowledge. They are not transcripts or paraphrases of the episodes. This site is not affiliated with TimeGhost; go and watch the series.

## What is on the page

- **Map (top).** A D3 paper atlas on a conic projection: Europe, the Mediterranean, North Africa and the Middle East. Ink coastlines, muted fills, hatching for occupied ground, stipple for Axis clients, an ink front line where we have one. Zoom and pan; click a pin to fly to it.
  - **Three views:** *Theatre* (the atlas), *World* (a global Natural Earth view for the Pacific, China and Burma weeks) and *War room* (wall-map styling with a grid, pin-and-string fronts, typed tags, clocks for London, Washington, Moscow and Berlin, a teletype ticker, a Battle of Britain plotting inset and a convoy plot).
  - **Four palettes:** Paper, Ink, Atlas, Map Room. War room switches to Map Room unless you have picked a palette.
  - Weeks set off the map get an edge callout; clicking it opens the World view.
  - The 24 weeks the guide tags "On the Big Board" get a heavier ring, a tag and pins at the places named.
- **Strip.** Heads of government (UK, US, France, Italy, Japan) as lanes, plus a monthly line of Allied merchant shipping sunk (a rounded teaching series).
- **Card.** A SITREP line, our headline and article, an archive photograph with its credit, and from D-Day on the **US 12th Army Group situation map** for that week ("What the Allied map room saw this week").
- **Bottom panel.** *Logbook*: a table of all 305 rows (week, dates covered, headline and episode), with Big Board weeks in red. *Ruler*: a number line with year, month and week ticks and a draggable marker that snaps to weeks. The choice is remembered. Logbook, ruler, map and card all share one selected week; ← → step through weeks, and the URL hash (`#w250`) links to a week.
- **Home front & culture.** The 131 monthly war and culture events from v1 remain as an optional layer of small markers.

Holocaust and atrocity weeks (and Dresden) are handled soberly: plain articles, no shock imagery, the map greyed out and no Big Board styling.

## Honest limits

- Country fills and front lines are **teaching approximations** on modern Natural Earth borders, stepped between 18 curated monthly snapshots. Each week uses the latest snapshot dated (mid-month) on or before its last day, so shading can lag events. Nothing here is day-accurate GIS.
- **Situation maps.** From 6 June 1944 the card shows the dated HQ Twelfth Army Group situation map nearest the week. These come from the Library of Congress collection [World War II Military Situation Maps](https://www.loc.gov/collections/world-war-ii-maps-military-situation-maps-from-1944-to-1945/), US Army, public domain, using the Wikimedia Commons mirror because loc.gov blocks automated downloads. We show them as documents. We have **not** re-drawn our own front from them, and we do not reconstruct any German or Allied "big board". Weeks without a dated map say so.
- The war-room look is a visual language borrowed from the Cabinet War Rooms Map Room, Fighter Command's plotting rooms, Western Approaches and the White House Map Room. It is not a claim about what those boards showed on a given day.
  - The Battle of Britain plotting inset is **illustrative**.
  - The clocks use nominal standard-time offsets at 12:00 GMT on the week's last day, with no wartime summer time.
- The guide's introduction mentions 31 "Big Board" moments, but only 24 rows carry the tag; those 24 are the ones marked here.
- The leader notes are our own one-line judgements.
- The shipping series is rounded from published summaries for shape. It is not a primary statistic.
- Photographs are public domain or Creative Commons only, from Wikimedia Commons, which mirrors NARA, the Bundesarchiv, IWM, AWM, NHHC and the Library of Congress. A few weeks may have no photo, or a photo that illustrates the setting rather than the exact event. See `CREDITS.md`.

## Local preview

```bash
cd ww2-strat-map
python3 -m http.server 8766   # open http://localhost:8766/
```

## Data and tools

| File | Role |
|------|------|
| `data/guide.json` | The 305 guide rows (id, dates, episode title, YouTube link, Big Board tag), parsed from the guide PDF by `tools/parse_guide.py` |
| `tools/articles/*.txt` | Our articles: place, pin, region, headline, photo search hints |
| `data/weeks.json` | Guide and articles merged by `tools/build_weeks.py` |
| `data/artefacts.json` | One photograph per week with full credit, from `tools/fetch_week_photos.py` |
| `data/sitmaps.json`, `img/sitmap/` | Dated 12th Army Group situation maps from `tools/fetch_sitmaps.py` |
| `data/atlas.geojson` | Natural Earth 1:50m admin-0, clipped and simplified (`tools/build_geo.py`) |
| `data/world-110m.json` | Natural Earth 1:110m (world-atlas TopoJSON) for the World view |
| `data/snapshots.json`, `data/fronts.json` | Control snapshots and schematic front polygons |
| `data/atlantic.json` | Monthly shipping-sunk teaching series |
| `data/events.json` | 131 monthly war and culture events (secondary layer) |

## License

Code: MIT. Our text: CC BY 4.0. Map geometries: Natural Earth (public domain). Situation maps: public domain (US Army, via the Library of Congress). Photographs: under each file's own licence, credited on the card and in `CREDITS.md`.
