/* The War, week by week — a Chronograph. D3 atlas + week spine. */
(function () {
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const D0 = new Date(Date.UTC(1939, 8, 1)), D1 = new Date(Date.UTC(1945, 4, 9));
const pd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const fmtD = d => `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const store = { get: (k, v) => { try { return localStorage.getItem(k) ?? v; } catch (e) { return v; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

const REGION_LABEL = { pacific: "Pacific", china: "China", asia: "Asia", usa: "United States", africa: "East Africa", atlantic: "Atlantic", mideast: "Middle East", europe: "Europe", east: "Eastern Front", med: "Mediterranean" };
const LEGEND = [["allied", "Allied / liberated"], ["soviet", "Soviet"], ["axis", "Axis"], ["axis_occ", "Axis-occupied"], ["co_bell", "Axis ally / client"], ["contested", "Contested"], ["neutral", "Neutral"]];

// Heads of government lanes (dates inclusive start, exclusive end). Notes: blunt but fair.
const LANES = [
  { k: "UK", rows: [
    ["Neville Chamberlain", "1939-09-01", "1940-05-10", "Prime Minister 1937–40", "Took Britain into the war he had tried to buy off at Munich. The Norway fiasco ended him; he was dead of cancer by November 1940."],
    ["Winston Churchill", "1940-05-10", "1945-05-09", "Prime Minister 1940–45", "Refused to negotiate in 1940 when that was a live option, and made the speeches people remember. Also meddled in operations, from Norway to Greece to Anzio."]] },
  { k: "US", rows: [
    ["Franklin D. Roosevelt", "1939-09-01", "1945-04-12", "President 1933–45", "Moved a neutral country step by step toward Britain, then ran the arsenal of democracy. Died 26 days before VE Day."],
    ["Harry S. Truman", "1945-04-12", "1945-05-09", "President 1945–53", "Vice-president for 82 days, barely briefed, inherited the end of the war and the atomic bomb."]] },
  { k: "France", rows: [
    ["Édouard Daladier", "1939-09-01", "1940-03-21", "Premier 1938–40", "Signed Munich, declared war, then fell for failing to help Finland."],
    ["Paul Reynaud", "1940-03-21", "1940-06-16", "Premier 1940", "Wanted to fight on from Africa. His own cabinet would not."],
    ["Philippe Pétain", "1940-06-16", "1944-08-20", "Head of the French State (Vichy)", "Hero of Verdun who signed the armistice, ended the Republic and collaborated, including in the deportation of Jews. Death sentence commuted in 1945."],
    ["Charles de Gaulle", "1944-08-20", "1945-05-09", "Provisional Government", "A junior general in 1940 who made himself the voice of Free France, and then its government."]] },
  { k: "Italy", rows: [
    ["Benito Mussolini", "1939-09-01", "1943-07-25", "Duce 1922–43", "Joined the war in June 1940 to share the spoils and lost almost every campaign he started. Shot by partisans in April 1945."],
    ["Pietro Badoglio", "1943-07-25", "1944-06-09", "Prime Minister 1943–44", "Marshal who signed the armistice and then fled Rome, leaving the army without orders."],
    ["Ivanoe Bonomi", "1944-06-09", "1945-05-09", "Prime Minister 1944–45", "Anti-fascist veteran who led the liberated south's coalition."]] },
  { k: "Japan", rows: [
    ["Nobuyuki Abe", "1939-09-01", "1940-01-16", "Prime Minister 1939–40", "A caretaker general; lasted four months."],
    ["Mitsumasa Yonai", "1940-01-16", "1940-07-22", "Prime Minister 1940", "Admiral who opposed the German alliance; the army brought him down."],
    ["Fumimaro Konoe", "1940-07-22", "1941-10-18", "Prime Minister 1940–41", "Signed the Tripartite Pact and occupied Indochina, then could not stop the drift to war he had started."],
    ["Hideki Tojo", "1941-10-18", "1944-07-22", "Prime Minister 1941–44", "Army general who led Japan into war with the US. Fell after Saipan; hanged in 1948."],
    ["Kuniaki Koiso", "1944-07-22", "1945-04-07", "Prime Minister 1944–45", "Presided over Leyte, Iwo Jima and the firebombing of Tokyo."],
    ["Kantarō Suzuki", "1945-04-07", "1945-05-09", "Prime Minister 1945", "Elderly admiral installed to find a way out of the war."]] },
];
const FIXED_HEADS = "Germany: Hitler (to 30 Apr 1945) · USSR: Stalin · China: Chiang Kai-shek";

// "On the Big Board" moments with a place, from the guide's cross-references.
const BB_PINS = {
  "250": [["Rome liberated", 12.49, 41.90], ["D-Day landings", -0.6, 49.35]],
  "251": [["First V-1s hit London", -0.13, 51.5]], "252": [["Bagration begins", 30.2, 55.2]], "253": [["Cherbourg falls", -1.62, 49.64]],
  "256": [["20 July plot", 21.49, 54.08]], "257": [["Cobra breaks out", -1.09, 49.12]], "258": [["Warsaw Uprising", 21.01, 52.23]],
  "260": [["Dragoon lands", 6.6, 43.3]], "263": [["Brussels liberated", 4.35, 50.85]], "265": [["Market Garden", 5.91, 51.98]],
  "269": [["Belgrade liberated", 20.46, 44.82], ["Aachen falls", 6.08, 50.78]], "271": [["Hürtgen Forest", 6.4, 50.7]],
  "275": [["Antwerp opens", 4.40, 51.22]], "277": [["Battle of the Bulge", 5.9, 50.25]], "279": [["Bastogne relieved", 5.72, 50.0]],
  "281": [["Vistula–Oder offensive", 21.0, 50.8]], "283": [["Auschwitz liberated", 19.18, 50.03]], "285": [["Yalta Conference", 34.17, 44.5]],
  "286": [["Dresden bombed", 13.74, 51.05]], "289": [["Remagen bridge", 7.24, 50.58]], "292": [["Crossing the Rhine", 6.62, 51.66]],
  "295": [["Ruhr Pocket surrenders", 7.01, 51.45]], "296": [["Elbe Day, Torgau", 13.0, 51.56]],
  "296b": [["Elbe Day, Torgau", 13.0, 51.56], ["Mussolini killed", 9.2, 46.0], ["Italy: surrender at Caserta", 14.33, 41.07], ["Fall of Berlin", 13.38, 52.51]],
};
// Map labels (atlas style)
const C_LABELS = [["Germany", 10.4, 51.2, 1], ["France", 2.4, 46.6, 1], ["Soviet Union", 40, 56.5, 1], ["Poland", 19.3, 52.1, 0.8], ["Italy", 12.8, 42.6, 0.8], ["Spain", -3.7, 40.0, 0.9], ["Britain", -1.8, 52.8, 0.8], ["Turkey", 34, 39.2, 0.9], ["Sweden", 15.2, 62.6, 0.8], ["Norway", 9, 61.4, 0.7], ["Finland", 26.5, 63.2, 0.75], ["Romania", 25, 45.9, 0.7], ["Hungary", 19.3, 47.1, 0.6], ["Yugoslavia", 19.6, 44, 0.6], ["Greece", 22.2, 39.4, 0.6], ["Egypt", 30, 26.6, 0.8], ["Libya", 17, 28.2, 0.8], ["Algeria", 3, 29.5, 0.8], ["Morocco", -6.2, 32, 0.7], ["Iran", 54, 32.5, 0.8], ["Iraq", 43.6, 33.2, 0.7], ["Syria", 38.5, 35.2, 0.55], ["Ukraine", 31.5, 49, 0.7], ["Saudi Arabia", 45, 24.5, 0.7]];
const S_LABELS = [["Atlantic Ocean", -19, 45], ["North Sea", 3.5, 56], ["Mediterranean Sea", 18, 34.6], ["Black Sea", 34.5, 43.1], ["Baltic", 19.3, 57.4], ["Norwegian Sea", 2, 67]];

const DEF_CTRL = (id, t) => {
  const after = s => t >= pd(s);
  switch (id) {
    case "SYR": case "LBN": return after("1941-07-14") ? "allied" : after("1940-06-25") ? "co_bell" : "allied";
    case "IRQ": return (after("1941-04-01") && !after("1941-06-01")) ? "contested" : "allied";
    case "IRN": return after("1941-08-25") ? "allied" : "neutral";
    case "ISR": case "PSX": case "JOR": case "KWT": case "SDN": case "NGA": case "GMB": case "CMR": case "GHA": case "PAK": case "GRL": case "BHR": case "QAT": case "ARE": return "allied";
    case "ERI": case "ETH": return after("1941-05-20") ? "allied" : "axis";
    case "DJI": return after("1942-12-28") ? "allied" : after("1940-06-25") ? "co_bell" : "allied";
    case "SEN": case "MLI": case "MRT": case "NER": case "BFA": case "GIN": case "BEN": case "GNB": return after("1942-11-23") ? "allied" : after("1940-06-25") ? "co_bell" : "allied";
    case "TCD": return "allied";
    case "GEO": case "ARM": case "AZE": case "KAZ": case "TKM": case "UZB": return "soviet";
    case "GGY": case "JEY": return after("1940-07-01") && !after("1945-05-09") ? "axis_occ" : "allied";
    case "IMN": return "allied";
    default: return "neutral";
  }
};
// World view (110m, numeric ids): rough alignment for the rest of the world, by date.
const WORLD_CTRL = (n, t) => {
  const after = s => t >= pd(s); n = +n;
  if ([392, 410, 408, 158].includes(n)) return "axis";
  if (n === 156) return "allied";
  if (n === 840) return after("1941-12-08") ? "allied" : "neutral";
  if ([124, 36, 554, 356, 710, 50, 144].includes(n)) return "allied";
  if (n === 496) return "soviet";
  if (n === 764) return after("1941-12-21") ? "co_bell" : "neutral";
  if ([704, 418, 116].includes(n)) return after("1945-03-09") ? "axis_occ" : after("1940-09-22") ? "co_bell" : "neutral";
  if (n === 608) return after("1942-05-06") ? "axis_occ" : after("1941-12-08") ? "contested" : "allied";
  if (n === 360) return after("1942-03-09") ? "axis_occ" : "allied";
  if (n === 458) return after("1942-02-15") ? "axis_occ" : after("1941-12-08") ? "contested" : "allied";
  if (n === 104) return after("1942-05-20") ? "axis_occ" : "allied";
  if (n === 598) return after("1942-01-23") ? "contested" : "allied";
  if (n === 76) return after("1942-08-22") ? "allied" : "neutral";
  if (n === 484) return after("1942-05-22") ? "allied" : "neutral";
  return "neutral";
};
const ALIAS = { CYN: "CYP", ALD: "FIN", SAH: "ESP" };

let WR = {}, W = [], ART = {}, SNAPS = [], FRONTS = {}, ATL = null, EVENTS = [], ATLAS = null, WORLD = null, SITMAPS = {};
let sel = 0, view = store.get("ww2.view", "theatre"), pal = store.get("ww2.pal", "paper"), mode = store.get("ww2.panel", "logbook");
let layers = { front: true, culture: false, all: false };
let proj, path, zoom, zt = d3.zoomIdentity, mapW = 800, mapH = 600;
const svg = d3.select("#map");
let gRoot, gZoom, gScreen, defs;

async function J(p, opt) { const r = await fetch(p); if (!r.ok) { if (opt) return opt; throw new Error(p + " " + r.status); } return r.json(); }

async function boot() {
  [WR, W, ART, SNAPS, FRONTS, ATL, EVENTS, ATLAS, WORLD, SITMAPS] = await Promise.all([J("data/warroom.json", {}),
    J("data/weeks.json"), J("data/artefacts.json", {}), J("data/snapshots.json"), J("data/fronts.json"), J("data/atlantic.json"),
    J("data/events.json", []), J("data/atlas.geojson"), J("data/world-110m.json", null), J("data/sitmaps.json", {})]);
  const rewind = fc => fc && fc.features.forEach(f => { const g = f.geometry; if (!g) return;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    polys.forEach(rings => rings.forEach((r, k) => { const a = d3.geoArea({ type: "Polygon", coordinates: [r] }); if ((k === 0) === (a > 2 * Math.PI)) r.reverse(); }));
  });
  rewind(ATLAS); Object.values(FRONTS).forEach(rewind);
  W.forEach((w, i) => { w.i = i; w.t0 = pd(w.start); w.t1 = pd(w.end); w.tm = new Date((+w.t0 + +w.t1) / 2); w.year = w.t1.getUTCFullYear(); w.on = onMap(w); });
  SNAPS.forEach(s => { s.t = new Date(Date.UTC(s.year, s.month - 1, 15)); });
  EVENTS.forEach(e => { e.t = pd(e.date); });
  const h = /^#w(\w+)$/.exec(location.hash); if (h) { const i = W.findIndex(w => w.id === h[1]); if (i >= 0) sel = i; }
  if (view === "warroom" && !store.get("ww2.palPicked")) pal = "maproom";
  setupControls(); buildLogbook(); applyPal(); applyView(false); setMode(mode);
  window.addEventListener("resize", debounce(() => { buildMap(); drawStrip(); drawRuler(); update(false); }, 150));
  update(true);
  renderWarroomPlates();
}
function debounce(f, ms) { let t; return () => { clearTimeout(t); t = setTimeout(f, ms); }; }
function onMap(w) { return w.lon >= -26 && w.lon <= 62 && w.lat >= 22 && w.lat <= 72; }
function snapFor(w) { let s = SNAPS[0]; for (const x of SNAPS) if (x.t <= w.t1) s = x; return s; }
function ctrl(id, snap, t) { id = ALIAS[id] || id; if (id === "RUS") return "soviet"; return (snap.control && snap.control[id]) || DEF_CTRL(id, t); }

/* ---------- controls ---------- */
function setupControls() {
  const eras = $("#eras");
  [1939, 1940, 1941, 1942, 1943, 1944, 1945].forEach(y => {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = y; b.dataset.y = y;
    b.onclick = () => select(W.findIndex(w => w.year === y)); eras.appendChild(b);
  });
  $$("#viewSeg .chip").forEach(b => b.onclick = () => { view = b.dataset.view; store.set("ww2.view", view); if (view === "warroom" && !store.get("ww2.palPicked")) { pal = "maproom"; applyPal(); } applyView(true); });
  $$("#palettes .pal").forEach(b => b.onclick = () => { pal = b.dataset.pal; store.set("ww2.pal", pal); store.set("ww2.palPicked", "1"); applyPal(); });
  $$("#panelSeg .chip").forEach(b => b.onclick = () => setMode(b.dataset.mode));
  $("#lyrFront").onchange = e => { layers.front = e.target.checked; update(false); };
  $("#lyrCulture").onchange = e => { layers.culture = e.target.checked; update(false); };
  $("#lyrAll").onchange = e => { layers.all = e.target.checked; update(false); };
  $("#prev").onclick = () => select(sel - 1); $("#next").onclick = () => select(sel + 1);
  $("#zIn").onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 1.6);
  $("#zOut").onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.6);
  $("#zReset").onclick = () => svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
  $("#q").oninput = e => filterLogbook(e.target.value.trim().toLowerCase());
  window.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp" && e.target.closest && e.target.closest("#logbook")) { e.preventDefault(); select(sel - 1); }
    else if (e.key === "ArrowRight" || e.key === "ArrowDown" && e.target.closest && e.target.closest("#logbook")) { e.preventDefault(); select(sel + 1); }
  });
  const lb = $("#lightbox");
  $("#plateBtn").onclick = () => openLb($("#plateImg"));
  $("#smBtn").onclick = () => openLb($("#smImg"));
  $("#lbClose").onclick = () => lb.hidden = true;
  lb.onclick = e => { if (e.target === lb) lb.hidden = true; };
  window.addEventListener("keydown", e => { if (e.key === "Escape") lb.hidden = true; });
}
function openLb(img) { if (!img.src) return; $("#lbImg").src = img.dataset.full || img.src; $("#lbImg").alt = img.alt; $("#lightbox").hidden = false; }
function applyPal() {
  document.documentElement.dataset.pal = pal;
  $$("#palettes .pal").forEach(b => b.setAttribute("aria-pressed", b.dataset.pal === pal));
  drawStrip(); drawRuler();
}
function applyView(redraw) {
  document.body.classList.toggle("v-warroom", view === "warroom");
  document.body.classList.toggle("v-world", view === "world");
  $$("#viewSeg .chip").forEach(b => b.setAttribute("aria-pressed", b.dataset.view === view));
  $("#warbar").hidden = view !== "warroom";
  buildMap(); if (redraw) update(false);
}
function setMode(m) {
  mode = m === "ruler" ? "ruler" : "logbook"; store.set("ww2.panel", mode);
  $$("#panelSeg .chip").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === mode));
  $("#logbook").hidden = mode !== "logbook"; $("#ruler").hidden = mode !== "ruler"; $("#q").hidden = mode !== "logbook";
  $("#panelTitle").textContent = mode === "ruler" ? "Ruler" : "Logbook";
  if (mode === "ruler") drawRuler(); else scrollRow(true);
}

/* ---------- map ---------- */
function buildMap() {
  const frame = $("#mapFrame");
  mapW = Math.max(300, frame.clientWidth);
  mapH = Math.round(view === "world" ? mapW * 0.52 : Math.min(760, Math.max(330, mapW * (mapW < 640 ? 0.92 : 0.74))));
  svg.attr("viewBox", `0 0 ${mapW} ${mapH}`).attr("height", mapH);
  svg.selectAll("*").remove();
  defs = svg.append("defs");
  mkPatterns();
  if (view === "world") {
    proj = d3.geoNaturalEarth1().fitExtent([[6, 6], [mapW - 6, mapH - 6]], { type: "Sphere" });
  } else {
    const pts = []; for (let lo = -14; lo <= 50; lo += 2) { pts.push([lo, 28.5], [lo, 70.5]); } for (let la = 28.5; la <= 70.5; la += 2) pts.push([-14, la], [50, la]);
    const box = { type: "MultiPoint", coordinates: pts };
    proj = d3.geoConicConformal().parallels([35, 65]).rotate([-17, 0]).fitExtent([[0, 0], [mapW, mapH]], box);
  }
  path = d3.geoPath(proj);
  gRoot = svg.append("g");
  gRoot.append("rect").attr("class", "sea").attr("width", mapW).attr("height", mapH);
  gZoom = gRoot.append("g").attr("class", "zoomable");
  gZoom.append("path").attr("class", "grat").attr("d", path(d3.geoGraticule().step(view === "world" ? [30, 30] : [10, 10])()));
  if (view === "world" && WORLD && window.topojson) {
    const land = topojson.feature(WORLD, WORLD.objects.countries);
    gZoom.append("g").selectAll("path").data(land.features).join("path").attr("class", "land wland").attr("d", path).style("fill", "var(--neutral)");
  }
  gZoom.append("g").attr("class", "countries").selectAll("path").data(ATLAS.features).join("path")
    .attr("class", "land").attr("d", path)
    .on("mousemove", (ev, d) => showTip(ev, `<b>${esc(d.properties.name)}</b><div>${esc(labelFor(ctrl(d.id, snapFor(W[sel]), W[sel].t1)))}</div>`))
    .on("mouseleave", hideTip);
  gZoom.append("g").attr("class", "hatch-layer");
  gZoom.append("g").attr("class", "fronts");
  if (view !== "world") {
    const gl = gZoom.append("g").attr("class", "labels");
    const fs = Math.max(8.5, Math.min(13, mapW / 90));
    S_LABELS.forEach(([n, lo, la]) => { const p = proj([lo, la]); gl.append("text").attr("class", "s-label").attr("x", p[0]).attr("y", p[1]).style("font-size", fs * 0.95 + "px").text(n); });
    C_LABELS.forEach(([n, lo, la, s]) => { const p = proj([lo, la]); if (mapW < 640 && s < 0.75) return; gl.append("text").attr("class", "c-label").attr("x", p[0]).attr("y", p[1]).style("font-size", fs * s + "px").text(n); });
  }
  gZoom.append("g").attr("class", "bob");
  gZoom.append("g").attr("class", "culture");
  gZoom.append("g").attr("class", "pins");
  gZoom.append("g").attr("class", "bbpins");
  gScreen = svg.append("g").attr("class", "screen");
  zoom = d3.zoom().scaleExtent([1, 14]).translateExtent([[-mapW * 0.2, -mapH * 0.2], [mapW * 1.2, mapH * 1.2]])
    .on("zoom", ev => { zt = ev.transform; gZoom.attr("transform", zt); rescale(); drawScreen(); });
  svg.call(zoom).on("dblclick.zoom", null);
  zt = d3.zoomIdentity;
  drawLegend();
}
function mkPatterns() {
  const p1 = defs.append("pattern").attr("id", "pOcc").attr("patternUnits", "userSpaceOnUse").attr("width", 5).attr("height", 5).attr("patternTransform", "rotate(45)");
  p1.append("rect").attr("width", 5).attr("height", 5).style("fill", "var(--land)");
  p1.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 5).style("stroke", "var(--axis-occ)").attr("stroke-width", 2.2);
  const p2 = defs.append("pattern").attr("id", "pCob").attr("patternUnits", "userSpaceOnUse").attr("width", 4).attr("height", 4);
  p2.append("rect").attr("width", 4).attr("height", 4).style("fill", "var(--cobell)");
  p2.append("circle").attr("cx", 2).attr("cy", 2).attr("r", 0.8).style("fill", "var(--ink)").attr("opacity", 0.45);
  const p3 = defs.append("pattern").attr("id", "pCon").attr("patternUnits", "userSpaceOnUse").attr("width", 6).attr("height", 6);
  p3.append("rect").attr("width", 6).attr("height", 6).style("fill", "var(--contested)").attr("opacity", 0.55);
  p3.append("path").attr("d", "M0,0L6,6M6,0L0,6").style("stroke", "var(--ink)").attr("stroke-width", 0.6).attr("opacity", 0.5);
  const p4 = defs.append("pattern").attr("id", "pFront").attr("patternUnits", "userSpaceOnUse").attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(-45)");
  p4.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6).style("stroke", "var(--ink)").attr("stroke-width", 0.9).attr("opacity", 0.38);
  const p5 = defs.append("pattern").attr("id", "pFrontS").attr("patternUnits", "userSpaceOnUse").attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)");
  p5.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6).style("stroke", "var(--soviet)").attr("stroke-width", 1.6).attr("opacity", 0.8);
}
function fillFor(c) {
  return { allied: "var(--allied)", axis: "var(--axis)", axis_occ: "url(#pOcc)", co_bell: "url(#pCob)", soviet: "var(--soviet)", neutral: "var(--neutral)", contested: "url(#pCon)" }[c] || "var(--neutral)";
}
function labelFor(c) { const f = LEGEND.find(l => l[0] === c); return f ? f[1] : c; }
function drawLegend() {
  const sw = c => `<svg width="14" height="10"><rect width="14" height="10" fill="${fillFor(c)}" stroke="var(--border)" stroke-width="0.6"/></svg>`;
  $("#legend").innerHTML = LEGEND.map(([c, n]) => `<div>${sw(c)}${n}</div>`).join("") +
    `<div><svg width="14" height="10"><path d="M1,5H13" stroke="var(--front)" stroke-width="2.4"/></svg>Front (approx.)</div>` +
    `<div><svg width="14" height="12"><circle cx="7" cy="6" r="4" fill="var(--pin)"/><circle cx="7" cy="6" r="5.5" fill="none" stroke="var(--bb)" stroke-width="1.5"/></svg>Big Board week</div>`;
}
function rescale() {
  const k = zt.k;
  gZoom.selectAll(".pin .dot").attr("r", d => (d.cur ? 6.5 : d.past ? 3.6 : 2.6) / Math.sqrt(k) * (mapW < 640 ? 1.1 : 1));
  gZoom.selectAll(".pin .ring").attr("r", d => (d.cur ? 10.5 : 6) / Math.sqrt(k));
  gZoom.selectAll(".pin .halo").attr("r", 15 / Math.sqrt(k));
  gZoom.selectAll(".cult").attr("r", 3.6 / Math.sqrt(k));
  gZoom.selectAll(".bbpins g, .pin-tag, .bob .blk, .string-pin").attr("transform", function () { const p = this.__p; return p ? `translate(${p[0]},${p[1]}) scale(${1 / k})` : null; });
  ["pOcc", "pCob", "pCon", "pFront", "pFrontS"].forEach(id => {
    const el = defs.select("#" + id); const base = id === "pOcc" || id === "pFrontS" ? "rotate(45)" : id === "pFront" ? "rotate(-45)" : "";
    el.attr("patternTransform", `${base} scale(${1 / k})`);
  });
}
function update(first) {
  const w = W[sel]; if (!w) return;
  const snap = snapFor(w);
  // countries
  gZoom.selectAll(".countries path").style("fill", d => fillFor(ctrl(d.id, snap, w.t1)));
  gZoom.selectAll(".wland").style("fill", d => fillFor(WORLD_CTRL(d.id, w.t1)));
  // fronts
  const gf = gZoom.select(".fronts"); gf.selectAll("*").remove();
  const fc = snap.front && FRONTS[snap.front];
  if (layers.front && fc) {
    fc.features.forEach(f => {
      const side = f.properties.side;
      gf.append("path").attr("class", "front-zone").attr("d", path(f)).style("fill", side === "soviet" ? "url(#pFrontS)" : side === "contested" ? "url(#pCon)" : "url(#pFront)");
      gf.append("path").attr("class", "front-line").attr("d", path(f));
      if (view === "warroom") {
        const ring = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
        ring.slice(0, -1).forEach(c => { const p = proj(c); const pg = gf.append("g").attr("class", "string-pin"); pg.node().__p = p; pg.append("circle").attr("r", 2.6); });
      }
    });
  }
  drawPins(w); drawBB(w); drawCulture(w); drawBoB(w); drawScreen(); rescale();
  // readout
  const bb = w.bigboard ? ` · <span style="color:var(--bb)">Big Board</span>` : "";
  const dl = w.start === w.end ? fmtD(w.t0) : `${w.dates_label}`;
  $("#mapRead").innerHTML = `<div class="mr-week">Week ${esc(w.id)}${bb}${w.on ? "" : " · " + esc(REGION_LABEL[w.region] || "Elsewhere")}</div><div class="mr-date">${esc(dl)}</div><div class="mr-snap">Shading: ${esc(MON[snap.month - 1])} ${snap.year} snapshot (${esc(snap.label)})</div>`;
  renderCard(w, snap); markRow(); drawStripCursor(); drawRulerMarker(); renderWar(w);
  if (!first) history.replaceState(null, "", "#w" + w.id);
}
function drawPins(w) {
  const gp = gZoom.select(".pins"); gp.selectAll("*").remove();
  let list;
  if (view === "world") list = W.filter(x => x.i <= sel && x.i > sel - 8 || (layers.all && Math.abs(x.i - sel) < 400));
  else list = W.filter(x => x.on && (x.i === sel || (x.i < sel && x.i >= sel - 5) || layers.all));
  if (!list.includes(w) && (w.on || view === "world")) list.push(w);
  list.sort((a, b) => (a.i === sel) - (b.i === sel) || a.i - b.i);
  const data = list.map(x => ({ w: x, cur: x.i === sel, past: x.i < sel && x.i >= sel - 5 }));
  const g = gp.selectAll("g").data(data).join("g")
    .attr("class", d => `pin${d.cur ? " cur" : ""}${d.past ? " past" : ""}${d.w.bigboard ? " bb" : ""}${d.w.sober ? " sober" : ""}`)
    .attr("transform", d => { const p = proj([d.w.lon, d.w.lat]); return `translate(${p[0]},${p[1]})`; })
    .style("opacity", d => d.cur ? 1 : d.past ? 0.35 + 0.12 * (5 - (sel - d.w.i)) : 0.3)
    .on("click", (ev, d) => { ev.stopPropagation(); select(d.w.i, true); })
    .on("mousemove", (ev, d) => showTip(ev, `<b>Week ${esc(d.w.id)}</b> · ${esc(d.w.dates_label)}<div>${esc(d.w.headline)}</div>`))
    .on("mouseleave", hideTip);
  g.filter(d => d.cur).append("circle").attr("class", "halo");
  g.filter(d => d.w.bigboard && !d.w.sober && !w.sober && (d.cur || d.past)).append("circle").attr("class", "ring");
  g.append("circle").attr("class", "dot");
  // typed tag on current pin (theatre/warroom)
  const p = proj([w.lon, w.lat]);
  const nearBB = view !== "world" && !w.sober && (BB_PINS[w.id] || []).some(([, lo, la]) => { const q = proj([lo, la]); return Math.hypot(q[0] - p[0], q[1] - p[1]) < 40; });
  if ((w.on || view === "world") && p && !nearBB) {
    const tag = gp.append("g").attr("class", "pin-tag").style("pointer-events", "none");
    tag.node().__p = p;
    const txt = (view === "warroom" ? `WK ${w.id} · ` : "") + w.place;
    const t = tag.append("text").attr("x", 12).attr("y", -10).text(txt);
    if (view === "warroom") t.style("font-family", "var(--f-type)");
    const bw = Math.min(260, txt.length * 6.1 + 10);
    tag.insert("rect", "text").attr("x", 7).attr("y", -22).attr("width", bw).attr("height", 16).attr("rx", view === "warroom" ? 0 : 2);
  }
}
function drawBB(w) {
  const g = gZoom.select(".bbpins"); g.selectAll("*").remove();
  if (view === "world" || !BB_PINS[w.id] || w.sober) return;
  BB_PINS[w.id].forEach(([lab, lo, la], j) => {
    const p = proj([lo, la]); const pg = g.append("g").attr("class", "bb-pin"); pg.node().__p = p;
    if (view === "warroom") {
      pg.append("ellipse").attr("cx", 2).attr("cy", 3).attr("rx", 4).attr("ry", 2).attr("fill", "rgb(0 0 0 / .25)");
      pg.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", -12).attr("stroke", "#3a3a3a").attr("stroke-width", 1.2);
      pg.append("circle").attr("cy", -13).attr("r", 4.5).attr("fill", "var(--bb)").attr("stroke", "#5a120e").attr("stroke-width", 0.8);
      const tw = lab.length * 6 + 10, dy = j % 2 ? 8 : -34;
      pg.append("rect").attr("x", 6).attr("y", dy).attr("width", tw).attr("height", 15).attr("fill", "#f8f1dc").attr("stroke", "#2b2617").attr("stroke-width", 0.7)
        .attr("transform", `rotate(${j % 2 ? 2 : -2})`);
      pg.append("text").attr("x", 11).attr("y", dy + 11).text(lab).attr("transform", `rotate(${j % 2 ? 2 : -2})`);
    } else {
      pg.append("circle").attr("r", 5).attr("fill", "none").attr("stroke", "var(--bb)").attr("stroke-width", 2);
      pg.append("text").attr("x", 8).attr("y", j % 2 ? 14 : -7).style("font-family", "var(--f-mono)").style("fill", "var(--bb)").style("font-size", "10px")
        .style("paint-order", "stroke").style("stroke", "var(--land)").style("stroke-width", "3px").text(lab);
    }
  });
}
function drawCulture(w) {
  const g = gZoom.select(".culture"); g.selectAll("*").remove();
  if (!layers.culture) return;
  const ym = w.end.slice(0, 7), ym0 = w.start.slice(0, 7);
  const list = EVENTS.filter(e => (e.ym === ym || e.ym === ym0) && e.lat != null);
  g.selectAll("circle").data(list).join("circle").attr("class", "cult")
    .attr("cx", e => proj([e.lon, e.lat])[0]).attr("cy", e => proj([e.lon, e.lat])[1])
    .on("mousemove", (ev, e) => showTip(ev, `<b>${esc(e.date)}</b> · ${esc(e.kind || "")}<div><b style="font-family:var(--f-body)">${esc(e.title)}</b></div><div>${esc(e.blurb)}</div>`))
    .on("mouseleave", hideTip).on("click", (ev, e) => { ev.stopPropagation(); showTip(ev, `<b>${esc(e.date)}</b><div><b style="font-family:var(--f-body)">${esc(e.title)}</b></div><div>${esc(e.blurb)}</div>`); });
}
function drawBoB(w) {
  const g = gZoom.select(".bob"); g.selectAll("*").remove();
  return; // drawn as a screen-space inset instead (see drawInsets)
  const n = parseInt(w.id, 10);
  const arrows = [[[2.6, 50.35], [0.35, 51.3]], [[1.9, 49.9], [-0.25, 50.85]], [[3.3, 50.9], [1.0, 51.55]]];
  arrows.forEach(([a, b]) => {
    const pa = proj(a), pb = proj(b); const ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
    g.append("path").attr("d", `M${pa[0]},${pa[1]}L${pb[0]},${pb[1]}M${pb[0]},${pb[1]}l${-6 * Math.cos(ang - 0.45)},${-6 * Math.sin(ang - 0.45)}M${pb[0]},${pb[1]}l${-6 * Math.cos(ang + 0.45)},${-6 * Math.sin(ang + 0.45)}`);
  });
  const blocks = [[[2.2, 50.55], "H.04", "30+", "15000"], [[1.5, 50.15], "H.07", "50+", "18000"], [[2.7, 51.05], "H.11", "20+", "12000"]];
  blocks.forEach(([ll, id, n2, ht]) => {
    const p = proj(ll); const b = g.append("g").attr("class", "blk"); b.node().__p = p;
    b.append("rect").attr("x", -16).attr("y", -13).attr("width", 32).attr("height", 26);
    b.append("text").attr("x", -13).attr("y", -4).text(id); b.append("text").attr("x", -13).attr("y", 4).text(n2); b.append("text").attr("x", -13).attr("y", 11).text(ht);
  });
  const pn = proj([-5.5, 49.3]);
  const note = g.append("g").attr("class", "blk"); note.node().__p = pn;
  note.append("text").attr("class", "bob-note").text("Illustrative plotting-table blocks (Fighter Command style) — not a real raid");
}
function regionEdge(w) {
  // Off-map weeks: point toward the theatre in the margin.
  const lon = w.lon, lat = w.lat;
  let side;
  if (lon > 62 || lon < -100) side = "right"; else if (lon < -26) side = "left"; else if (lat < 22) side = "bottom"; else side = "top";
  return side;
}
function drawScreen() {
  if (!gScreen) return;
  gScreen.selectAll("*").remove();
  const w = W[sel];
  if (view === "warroom") {
    const gg = gScreen.append("g").attr("class", "wgrid"); const step = mapW < 640 ? 70 : 100;
    for (let x = step, i = 0; x < mapW; x += step, i++) { gg.append("line").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", mapH); gg.append("text").attr("x", x - step / 2).attr("y", 12).attr("text-anchor", "middle").text(String.fromCharCode(65 + i)); }
    gg.append("text").attr("x", mapW - step / 2 + (mapW % step) / 2).attr("y", 12).attr("text-anchor", "middle").text(String.fromCharCode(65 + Math.floor(mapW / step)));
    for (let y = step, j = 1; y < mapH + step; y += step, j++) { if (y < mapH) gg.append("line").attr("x1", 0).attr("x2", mapW).attr("y1", y).attr("y2", y); gg.append("text").attr("x", 4).attr("y", y - step / 2 + 4).text(j); }
  }
  if (w && view === "warroom" && mapW >= 640) drawInsets(w);
  if (!w || view === "world") return;
  let p = proj([w.lon, w.lat]);
  const inFrame = p && w.on;
  let sp = p ? zt.apply(p) : null;
  const visible = sp && sp[0] >= 0 && sp[0] <= mapW && sp[1] >= 0 && sp[1] <= mapH;
  if (inFrame && visible) return;
  let x, y, ang;
  if (!w.on) {
    const side = regionEdge(w);
    const yy = Math.max(110, Math.min(mapH * 0.62, mapH * (0.85 - (Math.max(-10, Math.min(70, w.lat)) + 10) / 110)));
    if (side === "right") { x = mapW - 8; y = yy; ang = 0; } else if (side === "left") { x = 8; y = yy; ang = Math.PI; }
    else if (side === "bottom") { x = Math.max(60, Math.min(mapW - 60, zt.apply(proj([Math.max(-20, Math.min(55, w.lon)), 26]))[0])); y = mapH - 8; ang = Math.PI / 2; }
    else { x = mapW / 2; y = 8; ang = -Math.PI / 2; }
  } else {
    const cx = mapW / 2, cy = mapH / 2; ang = Math.atan2(sp[1] - cy, sp[0] - cx);
    const tx = (mapW / 2 - 10) / Math.abs(Math.cos(ang) || 1e-9), ty = (mapH / 2 - 10) / Math.abs(Math.sin(ang) || 1e-9);
    const t = Math.min(tx, ty); x = cx + Math.cos(ang) * t; y = cy + Math.sin(ang) * t;
  }
  const g = gScreen.append("g").attr("class", "edge-call").attr("transform", `translate(${x},${y})`)
    .on("click", () => { if (!w.on) { view = "world"; store.set("ww2.view", view); applyView(true); } else svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity); });
  g.append("path").attr("d", "M0,0l-9,-5v10z").attr("transform", `rotate(${ang * 180 / Math.PI})`);
  const lab = (REGION_LABEL[w.region] || "Elsewhere") + (w.on ? "" : " ↗");
  const sub = w.place.length > 26 ? w.place.slice(0, 25) + "…" : w.place;
  const bw = Math.max(lab.length, sub.length) * 6.4 + 14;
  let bx = Math.cos(ang) > 0.3 ? -bw - 14 : Math.cos(ang) < -0.3 ? 14 : -bw / 2;
  let by = Math.sin(ang) > 0.3 ? -46 : Math.sin(ang) < -0.3 ? 12 : -17;
  g.append("rect").attr("x", bx).attr("y", by).attr("width", bw).attr("height", 34).attr("rx", 3);
  g.append("text").attr("x", bx + 7).attr("y", by + 14).text(lab);
  g.append("text").attr("class", "edge-sub").attr("x", bx + 7).attr("y", by + 27).text(sub);
}
function showTip(ev, html) {
  const tip = $("#tip"), fr = $("#mapFrame").getBoundingClientRect();
  tip.innerHTML = html; tip.hidden = false;
  let x = ev.clientX - fr.left + 12, y = ev.clientY - fr.top + 12;
  if (x + 260 > fr.width) x = Math.max(4, ev.clientX - fr.left - 270);
  tip.style.left = x + "px"; tip.style.top = Math.min(y, fr.height - 60) + "px";
}
function hideTip() { $("#tip").hidden = true; }
svg.on("click.tip", hideTip);

const isBoB = w => { const n = parseInt(w.id, 10); return n >= 48 && n <= 56; };
function drawInsets(w) {
  const iw = 250, ih = 170, x0 = mapW - iw - 12, y0 = mapH - ih - 12;
  const g = gScreen.append("g").attr("class", "inset").attr("transform", `translate(${x0},${y0})`);
  g.append("rect").attr("class", "ibg").attr("width", iw).attr("height", ih);
  if (isBoB(w)) {
    g.append("text").attr("class", "ititle").attr("x", 8).attr("y", 14).text("PLOTTING TABLE · NO. 11 GROUP");
    const ix = 8, iy = 20, iww = iw - 16, ihh = ih - 44;
    const cp = g.append("clipPath").attr("id", "clipBoB"); cp.append("rect").attr("x", ix).attr("y", iy).attr("width", iww).attr("height", ihh);
    const pj = d3.geoMercator().fitExtent([[ix, iy], [ix + iww, iy + ihh]], { type: "MultiPoint", coordinates: [[-1.2, 50.3], [3.2, 52.0]] });
    const pp = d3.geoPath(pj); const gi = g.append("g").attr("clip-path", "url(#clipBoB)");
    gi.append("rect").attr("class", "isea").attr("x", ix).attr("y", iy).attr("width", iww).attr("height", ihh);
    gi.selectAll("path.iland").data(ATLAS.features.filter(f => ["GBR", "FRA", "BEL", "NLD"].includes(f.id))).join("path").attr("class", "iland").attr("d", pp);
    const gr = gi.append("g").attr("class", "igrid"); for (let k = 1; k < 8; k++) { gr.append("line").attr("x1", ix + k * iww / 8).attr("x2", ix + k * iww / 8).attr("y1", iy).attr("y2", iy + ihh); if (k < 5) gr.append("line").attr("x1", ix).attr("x2", ix + iww).attr("y1", iy + k * ihh / 5).attr("y2", iy + k * ihh / 5); }
    [[[2.4, 50.6], [0.3, 51.3]], [[1.9, 50.35], [-0.2, 50.95]], [[2.9, 51.15], [0.9, 51.5]]].forEach(([a, b]) => {
      const pa = pj(a), pb = pj(b), an = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
      gi.append("path").attr("class", "arr").attr("d", `M${pa[0]},${pa[1]}L${pb[0]},${pb[1]}M${pb[0]},${pb[1]}l${-7 * Math.cos(an - 0.45)},${-7 * Math.sin(an - 0.45)}M${pb[0]},${pb[1]}l${-7 * Math.cos(an + 0.45)},${-7 * Math.sin(an + 0.45)}`);
    });
    [[[2.45, 50.75], "H.04", "30+", "15", "r"], [[1.9, 50.45], "H.07", "50+", "18", "r"], [[3.0, 51.3], "H.11", "20+", "12", "r"], [[0.2, 51.15], "74 SQN", "12", "20", ""], [[-0.6, 50.95], "43 SQN", "12", "16", ""]].forEach(([ll, a, b, c, cls]) => {
      const p = pj(ll); const bk = gi.append("g").attr("class", "blk " + cls).attr("transform", `translate(${p[0] - 14},${p[1] - 11})`);
      bk.append("rect").attr("width", 30).attr("height", 22); bk.append("text").attr("x", 2).attr("y", 7).text(a); bk.append("text").attr("x", 2).attr("y", 13.5).text(b + " a/c"); bk.append("text").attr("x", 2).attr("y", 20).text("ANG " + c);
    });
    g.append("text").attr("class", "inote").attr("x", 8).attr("y", ih - 13).text("Illustrative only: plotting-table conventions,");
    g.append("text").attr("class", "inote").attr("x", 8).attr("y", ih - 4).text("not a record of a real raid on this date.");
  } else {
    g.append("text").attr("class", "ititle").attr("x", 8).attr("y", 14).text("CONVOY PLOT · SHIPPING SUNK");
    const ser = ATL.series.map(d => ({ t: new Date(Date.UTC(+d.ym.slice(0, 4), +d.ym.slice(5, 7) - 1, 15)), v: d.kt })).filter(d => d.t <= D1);
    const ix = 30, iy = 24, iww = iw - 40, ihh = ih - 64;
    const xs = d3.scaleUtc().domain([D0, D1]).range([ix, ix + iww]), ys = d3.scaleLinear().domain([0, d3.max(ser, d => d.v)]).nice().range([iy + ihh, iy]);
    const gr = g.append("g").attr("class", "igrid");
    ys.ticks(4).forEach(v => { gr.append("line").attr("x1", ix).attr("x2", ix + iww).attr("y1", ys(v)).attr("y2", ys(v)); g.append("text").attr("class", "iax").attr("x", ix - 3).attr("y", ys(v) + 3).attr("text-anchor", "end").text(v); });
    d3.utcYear.range(D0, D1).forEach(y => { gr.append("line").attr("x1", xs(y)).attr("x2", xs(y)).attr("y1", iy).attr("y2", iy + ihh); g.append("text").attr("class", "iax").attr("x", xs(y)).attr("y", iy + ihh + 10).attr("text-anchor", "middle").text("'" + String(y.getUTCFullYear()).slice(2)); });
    g.append("path").attr("class", "iarea").attr("d", d3.area().x(d => xs(d.t)).y0(iy + ihh).y1(d => ys(d.v))(ser));
    g.append("path").attr("class", "iline").attr("d", d3.line().x(d => xs(d.t)).y(d => ys(d.v))(ser));
    g.append("line").attr("class", "icur").attr("x1", xs(w.tm)).attr("x2", xs(w.tm)).attr("y1", iy).attr("y2", iy + ihh);
    let best = ser[0]; ser.forEach(d => { if (Math.abs(d.t - w.tm) < Math.abs(best.t - w.tm)) best = d; });
    g.append("text").attr("class", "inote").attr("x", 8).attr("y", ih - 13).text(`${MON[best.t.getUTCMonth()]} ${best.t.getUTCFullYear()}: about ${best.v}k GRT sunk (rounded series)`);
    g.append("text").attr("class", "inote").attr("x", 8).attr("y", ih - 4).text("Drawn from our monthly teaching series, not a plot.");
  }
}

/* ---------- selection ---------- */
function select(i, fly) {
  if (i < 0 || i >= W.length || i == null) return;
  sel = i; update(false);
  const w = W[sel];
  if (fly && w.on && view !== "world") {
    const p = proj([w.lon, w.lat]); const k = Math.max(zt.k, 3.2);
    svg.transition().duration(650).call(zoom.transform, d3.zoomIdentity.translate(mapW / 2, mapH / 2).scale(k).translate(-p[0], -p[1]));
  }
}

/* ---------- card ---------- */
function renderCard(w, snap) {
  const dl = w.start === w.end ? fmtD(w.t0) : w.dates_label;
  $("#sitrep").textContent = `SITREP · WEEK ${w.id} · ${dl.toUpperCase()}`;
  const tags = [];
  if (w.bigboard) tags.push(`<span class="badge bb">On the Big Board: ${esc(w.bigboard)}</span>`);
  if (!w.on) tags.push(`<span class="badge off">${esc(REGION_LABEL[w.region] || "Elsewhere")} · off the map</span>`);
  else tags.push(`<span class="badge">${esc(REGION_LABEL[w.region] || "")}</span>`);
  if (w.id.length > 3 || /[a-z]$/.test(w.id)) tags.push(`<span class="badge">Mid-week special</span>`);
  $("#cardTags").innerHTML = tags.join("");
  $("#evLabel").textContent = w.headline;
  $("#evPlace").textContent = w.place;
  $("#evSum").textContent = w.article;
  $("#soberNote").hidden = !w.sober;
  $("#stamp").hidden = !(view === "warroom" && w.bigboard && !w.sober);
  document.body.classList.toggle("is-sober", !!w.sober);
  const a = ART[w.id];
  if (a) {
    $("#plate").hidden = false;
    const img = $("#plateImg"); img.src = "img/" + a.file; img.alt = a.desc ? a.desc.slice(0, 160) : w.headline;
    const bits = [a.artist, a.date, a.license].filter(Boolean).map(esc).join(" · ");
    $("#capCredit").innerHTML = `${bits} · <a href="${esc(a.page)}" target="_blank" rel="noopener">Wikimedia Commons</a>`;
  } else { $("#plate").hidden = true; }
  const sm = SITMAPS[w.id];
  if (sm) {
    $("#sitmap").hidden = false; $("#noSitmap").hidden = true;
    const im = $("#smImg"); im.src = sm.file; im.alt = `HQ Twelfth Army Group situation map, ${sm.date}`;
    $("#smCredit").innerHTML = `HQ Twelfth Army Group situation map, situation of ${esc(fmtD(pd(sm.date)))}. US Army, public domain. <a href="${esc(sm.loc_item)}" target="_blank" rel="noopener">Library of Congress</a> · <a href="${esc(sm.page)}" target="_blank" rel="noopener">Commons</a>`;
  } else {
    $("#sitmap").hidden = true;
    const after = w.t1 >= pd("1944-06-06");
    $("#noSitmap").hidden = !(after || view === "warroom");
    $("#noSitmap").textContent = after ? "No dated 12th Army Group situation map was found for this week." : "No dated Allied situation map is shown for this week; the front on the atlas is our approximation.";
  }
  $("#episode").innerHTML = `TimeGhost episode: “${esc(w.episode)}” · <a href="${esc(w.url)}" target="_blank" rel="noopener">Watch the episode ↗</a>`;
  $("#prev").disabled = sel === 0; $("#next").disabled = sel === W.length - 1;
}

/* ---------- war room bar ---------- */
const CITIES = [["London", 0], ["Washington", -5], ["Moscow", 3], ["Berlin", 1]];
function renderWar(w) {
  if (view !== "warroom") return;
  const H = 12; // nominal 12:00 GMT on the week's last day
  $("#clocks").innerHTML = CITIES.map(([c, off]) => {
    const h = (H + off + 24) % 24, m = 0;
    const ah = ((h % 12) + m / 60) * 30, am = m * 6;
    const ticks = d3.range(12).map(i => { const a = i * 30 * Math.PI / 180; return `<line class="tick" x1="${20 + 15 * Math.sin(a)}" y1="${20 - 15 * Math.cos(a)}" x2="${20 + 17.5 * Math.sin(a)}" y2="${20 - 17.5 * Math.cos(a)}"/>`; }).join("");
    return `<div class="clock"><svg viewBox="0 0 40 40"><circle class="face" cx="20" cy="20" r="18.5"/>${ticks}<line class="hand h" x1="20" y1="20" x2="${20 + 9 * Math.sin(ah * Math.PI / 180)}" y2="${20 - 9 * Math.cos(ah * Math.PI / 180)}"/><line class="hand m" x1="20" y1="20" x2="${20 + 13 * Math.sin(am * Math.PI / 180)}" y2="${20 - 13 * Math.cos(am * Math.PI / 180)}"/></svg><span class="c-city">${c}</span><span class="c-time">${String(h).padStart(2, "0")}:00</span></div>`;
  }).join("") + `<div class="clock" style="align-self:center;justify-items:start"><span class="c-city">${esc(fmtD(w.t1))}</span><span class="c-time">nominal, 12:00 GMT</span></div>`;
  const near = W.slice(Math.max(0, sel - 2), Math.min(W.length, sel + 4));
  $("#ticker").innerHTML = near.map(x => `<span>${x.bigboard ? "<b>BIG BOARD</b> " : ""}WK ${esc(x.id)} · ${esc(x.dates_label.toUpperCase())} · ${esc(x.headline.toUpperCase())} +++</span>`).join("");
}
function renderWarroomPlates() {
  const host = $("#wrPlates"); const keys = Object.keys(WR);
  host.innerHTML = keys.map(k => { const a = WR[k]; return `<figure><img src="img/${esc(a.file)}" alt="${esc(a.caption || "")}" loading="lazy"><figcaption><b>${esc(a.caption || "")}</b><br>${esc([a.artist, a.license].filter(Boolean).join(" · "))} · <a href="${esc(a.page)}" target="_blank" rel="noopener">Commons</a></figcaption></figure>`; }).join("");
}

/* ---------- strip: leaders + shipping spine ---------- */
let sx, stripM, stripH;
function drawStrip() {
  const s = d3.select("#strip"); if (!W.length) return;
  const width = Math.max(300, $("#chartBox").clientWidth);
  const nameW = width < 640 ? 46 : 64, laneH = 17, spineH = 44;
  stripM = { l: nameW, r: 8, t: 4 };
  stripH = stripM.t + LANES.length * (laneH + 3) + 8 + spineH + 20 + 14;
  s.attr("viewBox", `0 0 ${width} ${stripH}`).attr("height", stripH); s.selectAll("*").remove();
  sx = d3.scaleUtc().domain([D0, D1]).range([stripM.l, width - stripM.r]);
  const tw = (t) => t.length * 5.6;
  LANES.forEach((lane, li) => {
    const y = stripM.t + li * (laneH + 3);
    s.append("text").attr("class", "lane-name").attr("x", 0).attr("y", y + 12).text(lane.k);
    const segs = lane.rows.map((r, j) => ({ r, j, x0: sx(pd(r[1])), x1: sx(pd(r[2])) }));
    const surname = r => r[0].split(" ").slice(-1)[0];
    const allFit = segs.every(o => (o.x1 - o.x0) > tw(surname(o.r)) + 8);
    const g = s.append("g").attr("data-lane", li);
    segs.forEach(o => {
      const gg = g.append("g").attr("class", "seg").datum({ lane: li, ...o });
      gg.append("rect").attr("class", `seg-r ${o.j % 2 ? "odd" : "even"}`).attr("x", o.x0).attr("y", y).attr("width", Math.max(1, o.x1 - o.x0)).attr("height", laneH).attr("rx", 2);
      const lab = allFit ? ((o.x1 - o.x0) > tw(o.r[0]) + 8 ? o.r[0] : surname(o.r)) : "";
      if (lab) gg.append("text").attr("class", "seg-t").attr("x", (o.x0 + o.x1) / 2).attr("y", y + 12).attr("text-anchor", "middle").text(lab);
      gg.style("cursor", "pointer").on("mouseenter mousemove click", ev => showLead(ev, o.r)).on("mouseleave", () => $("#leadCard").hidden = true);
    });
  });
  const y0 = stripM.t + LANES.length * (laneH + 3) + 8;
  s.append("text").attr("class", "lane-name").attr("x", width < 640 ? stripM.l : stripM.l).attr("y", y0 - 1 + 0).text("").attr("visibility", "hidden");
  const ser = ATL.series.map(d => ({ t: new Date(Date.UTC(+d.ym.slice(0, 4), +d.ym.slice(5, 7) - 1, 15)), v: d.kt })).filter(d => d.t <= D1);
  const sy = d3.scaleLinear().domain([0, d3.max(ser, d => d.v) * 1.05]).range([y0 + spineH, y0 + 2]);
  s.append("path").attr("class", "spine-area").attr("d", d3.area().x(d => sx(d.t)).y0(y0 + spineH).y1(d => sy(d.v)).curve(d3.curveMonotoneX)(ser));
  s.append("path").attr("class", "spine").attr("d", d3.line().x(d => sx(d.t)).y(d => sy(d.v)).curve(d3.curveMonotoneX)(ser));
  s.append("text").attr("class", "lane-name").attr("x", 0).attr("y", y0 + 12).text(width < 640 ? "Ships" : "Shipping");
  s.append("text").attr("x", width - stripM.r).attr("y", y0 + 9).attr("text-anchor", "end").style("font-size", "9px").style("fill", "var(--muted)").text(width < 640 ? "Allied shipping sunk, k GRT/mo (rounded)" : "Allied merchant shipping sunk, thousand GRT a month (rounded teaching series)");
  const ax = s.append("g").attr("class", "axis").attr("transform", `translate(0,${y0 + spineH + 2})`).call(d3.axisBottom(sx).ticks(d3.utcYear.every(1)).tickFormat(d3.utcFormat("%Y")).tickSize(4));
  ax.select(".domain").remove();
  s.append("text").attr("x", stripM.l).attr("y", stripH - 2).style("font-size", "9.5px").text(width < 640 ? "Fixed: Hitler · Stalin · Chiang" : FIXED_HEADS);
  s.append("line").attr("class", "cursor").attr("y1", 0).attr("y2", y0 + spineH);
  s.append("circle").attr("class", "cur-dot").attr("r", 3.5);
  s.node().__sy = sy; s.node().__ser = ser;
  drawStripCursor();
}
function drawStripCursor() {
  const s = d3.select("#strip"); const w = W[sel]; if (!sx || !w) return;
  const x = sx(w.tm); s.select(".cursor").attr("x1", x).attr("x2", x);
  const ser = s.node().__ser, sy = s.node().__sy;
  if (ser) { let best = ser[0]; ser.forEach(d => { if (Math.abs(d.t - w.tm) < Math.abs(best.t - w.tm)) best = d; }); s.select(".cur-dot").attr("cx", x).attr("cy", sy(best.v)); }
  s.selectAll(".seg").each(function (o) {
    const cur = w.tm >= pd(o.r[1]) && w.tm < pd(o.r[2]);
    d3.select(this).select("rect").classed("cur", cur); d3.select(this).select("text").classed("cur", cur);
  });
}
function showLead(ev, r) {
  const c = $("#leadCard"), box = $("#chartBox").getBoundingClientRect();
  $("#lcName").textContent = r[0]; $("#lcMeta").textContent = `${r[3]} · ${fmtD(pd(r[1]))} – ${r[2] === "1945-05-09" ? "VE Day" : fmtD(pd(r[2]))}`; $("#lcNote").textContent = r[4];
  c.hidden = false;
  const x = Math.min(box.width - c.offsetWidth - 4, Math.max(4, ev.clientX - box.left - c.offsetWidth / 2));
  const y = ev.clientY - box.top - c.offsetHeight - 14;
  c.style.left = x + "px"; c.style.top = Math.max(0, y) + "px";
}

/* ---------- Logbook ---------- */
function buildLogbook() {
  const host = $("#logbook"); let html = "", yr = null;
  W.forEach(w => {
    if (w.year !== yr) {
      yr = w.year;
      html += `<div class="lb-year" data-year="${yr}">${yr}</div><div class="lb-head" data-year="${yr}"><span>Week</span><span class="lb-d-h">Dates covered</span><span>Headline · TimeGhost episode</span></div>`;
    }
    const dl = w.start === w.end ? fmtD(w.t0) : w.dates_label;
    const off = w.on ? "" : `<span class="lb-off">${esc(REGION_LABEL[w.region] || "Elsewhere")}</span>`;
    html += `<button type="button" class="lb-row${w.bigboard ? " bb" : ""}${w.sober ? " sober" : ""}" data-i="${w.i}" data-year="${yr}" aria-current="false">
      <span class="lb-w">${esc(w.id)}</span><span class="lb-d">${esc(dl)}</span>
      <span class="lb-txt"><span class="lb-h">${esc(w.headline)}</span>${off}<span class="lb-ep">${esc(w.episode)}</span>${w.bigboard ? `<span class="lb-bb">On the Big Board: ${esc(w.bigboard)}</span>` : ""}</span></button>`;
  });
  host.innerHTML = html;
  host.addEventListener("click", e => { const b = e.target.closest(".lb-row"); if (b) select(+b.dataset.i, true); });
  host.addEventListener("focusin", e => { const b = e.target.closest(".lb-row"); if (b && +b.dataset.i !== sel) select(+b.dataset.i, false); });
}
function filterLogbook(q) {
  const host = $("#logbook"); const vis = new Set();
  $$(".lb-row", host).forEach(r => {
    const w = W[+r.dataset.i];
    const ok = !q || (w.id + " " + w.headline + " " + w.article + " " + w.episode + " " + w.place + " " + (w.bigboard || "")).toLowerCase().includes(q);
    r.hidden = !ok; if (ok) vis.add(r.dataset.year);
  });
  $$(".lb-year, .lb-head", host).forEach(h => h.hidden = !vis.has(h.dataset.year));
}
function markRow() {
  $$("#logbook .lb-row[aria-current='true']").forEach(r => r.setAttribute("aria-current", "false"));
  const r = $(`#logbook .lb-row[data-i="${sel}"]`); if (r) r.setAttribute("aria-current", "true");
  scrollRow(false);
}
function scrollRow(instant) {
  const host = $("#logbook"); const r = $(`#logbook .lb-row[data-i="${sel}"]`);
  if (!r || host.hidden || r.hidden) return;
  const top = r.offsetTop - host.offsetTop, h = host.clientHeight;
  if (top < host.scrollTop + 70 || top > host.scrollTop + h - 60) host.scrollTo({ top: Math.max(0, top - h / 3), behavior: instant ? "auto" : "smooth" });
}

/* ---------- Ruler ---------- */
let rx;
function drawRuler() {
  const s = d3.select("#rulerSvg"); if (!W.length || $("#ruler").hidden) return;
  const width = Math.max(300, $("#ruler").clientWidth - 28), H = 110, by = 62;
  s.attr("viewBox", `0 0 ${width} ${H}`); s.selectAll("*").remove();
  rx = d3.scaleUtc().domain([D0, D1]).range([18, width - 18]);
  s.append("rect").attr("width", width).attr("height", H).attr("fill", "transparent");
  W.forEach(w => s.append("line").attr("class", "wt" + (w.bigboard ? " bb" : "")).attr("x1", rx(w.t0)).attr("x2", rx(w.t0)).attr("y1", by - 7).attr("y2", by));
  const months = d3.utcMonth.range(D0, D1);
  const mStep = (width / months.length) > 15;
  months.forEach(m => {
    const x = rx(m); s.append("line").attr("class", "mt").attr("x1", x).attr("x2", x).attr("y1", by - 14).attr("y2", by + 6);
    if (mStep && m.getUTCMonth() !== 0) s.append("text").attr("class", "ml").attr("x", x + (rx(d3.utcMonth.offset(m, 1)) - x) / 2).attr("y", by + 17).text(width > 900 ? MON[m.getUTCMonth()][0] : "");
  });
  const roomy = rx(pd("1940-01-01")) - rx(D0) > 62;
  [D0, ...d3.utcYear.range(D0, D1)].forEach((y, i) => {
    const x = rx(y); s.append("line").attr("class", "yt").attr("x1", x).attr("x2", x).attr("y1", by - 26).attr("y2", by + 12);
    if (i === 0 && !roomy) return;
    s.append("text").attr("class", "yl").attr("x", x).attr("y", by + 30).style("text-anchor", i === 0 ? "start" : "middle").text(i === 0 ? "Sep 1939" : y.getUTCFullYear());
  });
  s.append("line").attr("class", "yt").attr("x1", rx(D1)).attr("x2", rx(D1)).attr("y1", by - 26).attr("y2", by + 12);
  if (roomy) s.append("text").attr("class", "yl").attr("x", rx(D1)).attr("y", by + 30).style("text-anchor", "end").text("VE Day");
  s.append("line").attr("class", "base").attr("x1", rx(D0)).attr("x2", rx(D1)).attr("y1", by).attr("y2", by);
  const mk = s.append("g").attr("class", "mk");
  mk.append("line").attr("y1", 24).attr("y2", by + 10);
  mk.append("path").attr("d", "M-6,16L6,16L0,24Z");
  mk.append("text").attr("y", 12);
  const pick = ev => { const [mx] = d3.pointer(ev, s.node()); const t = rx.invert(mx); let best = 0, bd = Infinity; W.forEach(w => { const d = Math.abs(w.tm - t); if (d < bd) { bd = d; best = w.i; } }); if (best !== sel) select(best, false); };
  s.on("pointerdown", ev => { s.node().setPointerCapture(ev.pointerId); s.node().__drag = true; pick(ev); })
   .on("pointermove", ev => { if (s.node().__drag) pick(ev); })
   .on("pointerup pointercancel", () => { s.node().__drag = false; });
  drawRulerMarker();
}
function drawRulerMarker() {
  const w = W[sel]; if (!rx || !w) return;
  const s = d3.select("#rulerSvg"); const x = rx(w.tm), width = rx.range()[1] + 14;
  s.select(".mk").attr("transform", `translate(${x},0)`).select("text").text("W" + w.id).style("text-anchor", x < 30 ? "start" : x > width - 30 ? "end" : "middle");
  s.attr("aria-valuenow", sel + 1).attr("aria-valuetext", `Week ${w.id}, ${w.dates_label}`);
  const dl = w.start === w.end ? fmtD(w.t0) : `${fmtD(w.t0)} – ${fmtD(w.t1)}`;
  $("#rulerRead").innerHTML = `<b>Week ${esc(w.id)}</b> · ${esc(dl)}${w.bigboard ? ' · <span style="color:var(--bb)">Big Board</span>' : ""}<span class="rr-h">${esc(w.headline)}</span>`;
}

boot().catch(err => { console.error(err); const b = document.createElement("p"); b.className = "boot"; b.textContent = "Could not load data: " + err.message + " (serve over http or open on GitHub Pages)."; $("#app").prepend(b); });
})();
