# WW2 Europe — Strategic Map (1939–1945)

A **map-first** teaching sketch of the Second World War in continental Europe: scrub through curated monthly control frames, open major campaigns on the map, and read short archive-backed blurbs.

**Live:** https://julianlee314-hue.github.io/ww2-strat-map/

Companion timelines: [The Dow, 1896–2026](https://julianlee314-hue.github.io/dow-timeline/v0.2/) · [The Bank, 1694–1994](https://julianlee314-hue.github.io/the-bank-1694/)

## What’s in v1

- Full-bleed dark Europe map (Leaflet + CARTO basemap)
- **18** control / front-line snapshots (Aug 1939 → May 1945)
- **55** curated big events (Poland → VE Day), with Commons plates where fetched
- Month scrubber, era jumps, ← → keys
- Optional Battle of the Atlantic tonnage sparkline (approximate teaching series)
- Light **perspective** toggle (what we know now vs a 1940s-framing note in copy)
- Credits discipline for images (`CREDITS.md`, per-plate Commons links)

## How to scrub

1. Open the live site (or serve locally — below).
2. Drag the bottom scrubber, tap era pills, or use arrow keys.
3. Click gold markers (or the Register tab) for event cards + archive plates.
4. Zoom the map to inspect a theatre; control colours update with the scrubber.

## Local preview

```bash
cd ww2-strat-map
python3 -m http.server 8766
# open http://localhost:8766/
```

Same-origin `fetch` loads `data/*.json` and `data/europe.geojson`.

## Honest limitations

- **Front lines are curated approximations**, not traced day-accurate GIS. Country fills use modern Natural Earth geometries as stand-ins for 1939–45 political geography (Yugoslavia, Czechoslovakia, western USSR, etc.).
- Schematic Eastern Front / Bulge overlays are teaching polygons, not operational overlays from a war-room board.
- **Fog of war** is not reconstructed from classified situation maps; the perspective toggle only changes framing copy.
- Pacific war, strategic bombing density, and deeper Holocaust geography are deliberately out of scope or sober-only for v1.
- Atlantic tonnage series is rounded from published historical summaries for shape, not a primary FRED-style series.

## Data files

| File | Role |
|------|------|
| `data/europe.geojson` | Natural Earth countries (theatre crop) |
| `data/snapshots.json` | Control state per map frame |
| `data/fronts.json` | Optional schematic overlays |
| `data/events.json` | Event register |
| `data/artefacts.json` | Image credits + filenames |
| `data/atlantic.json` | Optional metric sparkline |

## License

Code: MIT. Text blurbs: CC BY 4.0. Map geometries: Natural Earth (public domain). Photographs: see each Commons license in `CREDITS.md` / on-card credits.
