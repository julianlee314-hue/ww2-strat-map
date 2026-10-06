/* WW2 Europe strategic map — v1.1 monthly grain */
(function () {
  const COLORS = {
    allied: '#3d7ea6',
    axis: '#8b3a3a',
    axis_occ: '#5c2a2a',
    soviet: '#c45c2a',
    co_bell: '#6b4a6b',
    neutral: '#3a4550',
    contested: '#c4a35a',
  };
  const LABELS = {
    allied: 'Allied / liberated',
    axis: 'Axis homeland',
    axis_occ: 'Axis-occupied',
    soviet: 'Soviet',
    co_bell: 'Axis ally / client',
    neutral: 'Neutral',
    contested: 'Contested / in flux',
  };
  const ERAS = [
    { id: 'descent', label: '1939', ym: '1939-09' },
    { id: 'west', label: '1940', ym: '1940-06' },
    { id: 'barb', label: '1941', ym: '1941-09' },
    { id: 'turn', label: '1942–43', ym: '1942-11' },
    { id: 'italy', label: 'Italy', ym: '1943-09' },
    { id: 'overlord', label: '1944', ym: '1944-06' },
    { id: 'end', label: '1945', ym: '1945-05' },
  ];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const state = {
    snapshots: [],
    fronts: {},
    events: [],
    artefacts: {},
    atlantic: null,
    europe: null,
    idx: 0,
    selectedEvent: null,
    perspective: 'now', // now | then
    showMetric: true,
    countryLayer: null,
    frontLayer: null,
    markers: [],
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  function ymKey(y, m) { return `${y}-${String(m).padStart(2,'0')}`; }
  function parseYm(ym) { const [y,m] = ym.split('-').map(Number); return { y, m }; }
  function formatYm(ym) {
    const { y, m } = parseYm(ym);
    return `${MONTHS[m-1]} ${y}`;
  }
  function snapAt(idx) { return state.snapshots[idx]; }

  function nearestSnapIndex(ym) {
    const { y, m } = parseYm(ym);
    const t = y * 12 + m;
    let best = 0, bestD = Infinity;
    state.snapshots.forEach((s, i) => {
      const st = s.year * 12 + s.month;
      const d = Math.abs(st - t);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  async function load() {
    const [snapshots, fronts, events, artefacts, atlantic, europe] = await Promise.all([
      fetch('data/snapshots.json').then(r => r.json()),
      fetch('data/fronts.json').then(r => r.json()),
      fetch('data/events.json').then(r => r.json()),
      fetch('data/artefacts.json').then(r => r.json()),
      fetch('data/atlantic.json').then(r => r.json()),
      fetch('data/europe.geojson').then(r => r.json()),
    ]);
    state.snapshots = snapshots;
    state.fronts = fronts;
    state.events = events;
    state.artefacts = artefacts;
    state.atlantic = atlantic;
    state.europe = europe;
  }

  function initMap() {
    state.map = L.map('map', {
      center: [50.5, 15],
      zoom: 4.2,
      minZoom: 3.2,
      maxZoom: 8,
      zoomSnap: 0.25,
      worldCopyJump: false,
      attributionControl: true,
    });
    // Esri Dark Gray Canvas — free, no API key (CARTO basemaps now watermark without a key)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri — Esri, HERE, Garmin, FAO, NOAA, USGS',
      maxZoom: 16,
    }).addTo(state.map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      opacity: 0.9,
      pane: 'shadowPane',
    }).addTo(state.map);

    state.countryLayer = L.geoJSON(state.europe, {
      style: () => ({ color: '#1a222c', weight: 0.6, fillColor: COLORS.neutral, fillOpacity: 0.72 }),
      onEachFeature: (feat, layer) => {
        layer.bindTooltip(feat.properties.name, { sticky: true, opacity: 0.9, className: 'event-tip' });
      },
    }).addTo(state.map);

    state.frontLayer = L.geoJSON(null, {
      style: (f) => {
        const side = f.properties.side;
        const fill = side === 'soviet' ? COLORS.soviet : side === 'contested' ? COLORS.contested : COLORS.axis_occ;
        return { color: fill, weight: 1.2, fillColor: fill, fillOpacity: 0.28, dashArray: '4 3' };
      },
    }).addTo(state.map);

    // Event markers
    state.events.forEach((ev) => {
      const icon = L.divIcon({ className: '', html: '<div class="event-marker"></div>', iconSize: [12,12], iconAnchor: [6,6] });
      const m = L.marker([ev.lat, ev.lon], { icon, riseOnHover: true });
      m.bindTooltip(`${ev.title}`, { direction: 'top', offset: [0, -8], className: 'event-tip' });
      m.on('click', () => selectEvent(ev.id, true));
      m.addTo(state.map);
      m._eid = ev.id;
      state.markers.push(m);
    });
  }

  function styleCountries(snap) {
    state.countryLayer.eachLayer((layer) => {
      const id = layer.feature.properties.id;
      const ctrl = snap.control[id] || 'neutral';
      layer.setStyle({
        fillColor: COLORS[ctrl] || COLORS.neutral,
        fillOpacity: ctrl === 'neutral' ? 0.45 : 0.78,
        color: '#0c1014',
        weight: 0.7,
      });
    });
  }

  function styleFront(snap) {
    state.frontLayer.clearLayers();
    if (snap.front && state.fronts[snap.front]) {
      state.frontLayer.addData(state.fronts[snap.front]);
    }
  }

  function markerClassFor(ev, snap) {
    const et = parseYm(ev.ym);
    const st = { y: snap.year, m: snap.month };
    const evT = et.y * 12 + et.m;
    const snT = st.y * 12 + st.m;
    if (state.selectedEvent === ev.id) return 'event-marker active';
    if (evT > snT) return 'event-marker'; // future — still show lightly
    if (evT < snT - 2) return 'event-marker past';
    return 'event-marker';
  }

  function refreshMarkers(snap) {
    state.markers.forEach((m) => {
      const ev = state.events.find(e => e.id === m._eid);
      const cls = markerClassFor(ev, snap);
      const el = m.getElement();
      if (el) {
        const dot = el.querySelector('.event-marker') || el.firstChild;
        if (dot) dot.className = cls;
      }
      // Hide events more than ~2 months in the future relative to scrub
      const et = parseYm(ev.ym);
      const snT = snap.year * 12 + snap.month;
      const evT = et.y * 12 + et.m;
      if (evT > snT + 1) m.setOpacity(0.12);
      else if (evT < snT - 3) m.setOpacity(0.28);
      else m.setOpacity(1);
    });
  }

  function setSnap(idx, opts = {}) {
    idx = Math.max(0, Math.min(state.snapshots.length - 1, idx));
    state.idx = idx;
    const snap = snapAt(idx);
    styleCountries(snap);
    styleFront(snap);
    refreshMarkers(snap);

    $('#dateBig').textContent = formatYm(snap.id);
    $('#snapLabel').textContent = snap.label;
    const note = perspectiveNote(snap);
    $('#snapNote').textContent = note;

    const scrub = $('#scrubber');
    scrub.value = idx;
    scrub.max = state.snapshots.length - 1;

    // era pills
    $$('.era-pills button').forEach((b) => {
      const target = nearestSnapIndex(b.dataset.ym);
      b.setAttribute('aria-current', target === idx ? 'true' : 'false');
    });

    drawSpark(snap.id);
    renderList();

    if (opts.pickEvent) {
      // auto-select nearest event at/before this month
      const candidates = state.events.filter(e => {
        const t = parseYm(e.ym);
        return t.y * 12 + t.m <= snap.year * 12 + snap.month;
      });
      if (candidates.length) selectEvent(candidates[candidates.length - 1].id, false);
    }
  }

  function perspectiveNote(snap) {
    if (state.perspective === 'then') {
      return `Contemporary framing: ${snap.note} (Allied publics often learned of open-source fronts weeks late; this map still uses postwar knowledge of borders.)`;
    }
    return snap.note;
  }

  function selectEvent(id, fly) {
    state.selectedEvent = id;
    const ev = state.events.find(e => e.id === id);
    if (!ev) return;
    // Move scrub toward event month
    const idx = nearestSnapIndex(ev.ym);
    if (idx !== state.idx) setSnap(idx, {});
    else refreshMarkers(snapAt(state.idx));

    if (fly) {
      state.map.flyTo([ev.lat, ev.lon], Math.max(state.map.getZoom(), 5.5), { duration: 0.7 });
    }
    showTab('event');
    renderEventCard(ev);
    renderList();
  }

  function renderEventCard(ev) {
    const art = state.artefacts[ev.id];
    const sober = ev.sober
      ? `<div class="sober-note">Handled carefully: this entry concerns mass murder and bureaucratic genocide. It is not gamified on the map scrubber.</div>`
      : '';
    const plate = art
      ? `<div class="plate"><img src="img/${art.file}" alt="" loading="lazy"></div>
         <p class="credit">${escapeHtml(art.artist)} · ${escapeHtml(art.license)} · <a href="${art.commons_url}" target="_blank" rel="noopener">Commons</a></p>`
      : `<p class="empty-hint">Archive plate not yet attached for this event.</p>`;
    const kind = ev.kind ? `<span>${escapeHtml(ev.kind)}</span>` : '';
    $('#eventPane').innerHTML = `
      ${sober}
      <h2>${escapeHtml(ev.title)}</h2>
      <div class="meta-row"><span>${escapeHtml(ev.date)}</span><span>${escapeHtml(ev.place)}</span><span>${escapeHtml(ev.chapter)}</span>${kind}</div>
      <p class="blurb">${escapeHtml(ev.blurb)}</p>
      ${plate}
    `;
  }

  function renderList() {
    const snap = snapAt(state.idx);
    const snT = snap.year * 12 + snap.month;
    const ul = $('#listPane');
    ul.innerHTML = state.events.map((ev) => {
      const t = parseYm(ev.ym);
      const past = t.y * 12 + t.m <= snT;
      const active = ev.id === state.selectedEvent ? 'active' : '';
      const k = ev.kind ? ` · ${escapeHtml(ev.kind)}` : '';
      return `<li class="${active}" data-id="${ev.id}" style="opacity:${past ? 1 : 0.45}">
        <div class="d">${ev.date.slice(0,7)}</div>
        <div><div class="t">${escapeHtml(ev.title)}</div><div class="p">${escapeHtml(ev.place)}${k}</div></div>
      </li>`;
    }).join('');
    ul.onclick = (e) => {
      const li = e.target.closest('li[data-id]');
      if (li) selectEvent(li.dataset.id, true);
    };
  }

  function drawSpark(currentYm) {
    const host = $('#spark');
    if (!state.showMetric || !state.atlantic) { host.innerHTML = ''; return; }
    const series = state.atlantic.series;
    const w = host.clientWidth || 600;
    const h = 36;
    const max = Math.max(...series.map(s => s.kt));
    const pts = series.map((s, i) => {
      const x = (i / (series.length - 1)) * (w - 2) + 1;
      const y = h - 4 - (s.kt / max) * (h - 8);
      return [x, y, s.ym, s.kt];
    });
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    // cursor at current ym
    let ci = pts.findIndex(p => p[2] >= currentYm);
    if (ci < 0) ci = pts.length - 1;
    const cur = pts[ci];
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <path d="${d}" fill="none" stroke="#3d7ea6" stroke-width="1.5" opacity="0.85"/>
      <circle cx="${cur[0]}" cy="${cur[1]}" r="3" fill="#c4a35a"/>
    </svg>
    <div class="spark-label">Atlantic sinkings ~${cur[3]}k GRT / mo</div>`;
  }

  function showTab(name) {
    $$('.side-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false'));
    $$('.tab-pane').forEach(p => p.hidden = p.id !== name + 'Pane' && !(name === 'event' && p.id === 'eventPane') && !(name === 'list' && p.id === 'listPane') && !(name === 'about' && p.id === 'aboutPane'));
    // simpler:
    $('#eventPane').hidden = name !== 'event';
    $('#listPane').hidden = name !== 'list';
    $('#aboutPane').hidden = name !== 'about';
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function wire() {
    const scrub = $('#scrubber');
    scrub.min = 0;
    scrub.max = state.snapshots.length - 1;
    scrub.value = 0;
    scrub.addEventListener('input', () => setSnap(+scrub.value, { pickEvent: true }));

    $('#prevBtn').onclick = () => setSnap(state.idx - 1, { pickEvent: true });
    $('#nextBtn').onclick = () => setSnap(state.idx + 1, { pickEvent: true });

    const eras = $('.era-pills');
    eras.innerHTML = ERAS.map(e => `<button type="button" data-ym="${e.ym}">${e.label}</button>`).join('');
    eras.onclick = (e) => {
      const b = e.target.closest('button[data-ym]');
      if (!b) return;
      setSnap(nearestSnapIndex(b.dataset.ym), { pickEvent: true });
    };

    $('#perspectiveBtn').onclick = () => {
      state.perspective = state.perspective === 'now' ? 'then' : 'now';
      $('#perspectiveBtn').setAttribute('aria-pressed', state.perspective === 'then' ? 'true' : 'false');
      $('#perspectiveBtn').textContent = state.perspective === 'then' ? 'Perspective: 1940s framing' : 'Perspective: what we know now';
      setSnap(state.idx);
    };

    $('#metricBtn').onclick = () => {
      state.showMetric = !state.showMetric;
      $('#metricBtn').setAttribute('aria-pressed', state.showMetric ? 'true' : 'false');
      drawSpark(snapAt(state.idx).id);
      $('.spark').style.display = state.showMetric ? '' : 'none';
    };

    $$('.side-tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));

    window.addEventListener('resize', () => drawSpark(snapAt(state.idx).id));

    // keyboard
    window.addEventListener('keydown', (e) => {
      if (e.target.matches('input,textarea')) return;
      if (e.key === 'ArrowLeft') setSnap(state.idx - 1, { pickEvent: true });
      if (e.key === 'ArrowRight') setSnap(state.idx + 1, { pickEvent: true });
    });
  }

  async function main() {
    await load();
    initMap();
    wire();
    showTab('about');
    setSnap(0, { pickEvent: false });
    // Start at Fall of France for drama? or eve of war — eve is better pedagogy
    $('#status').textContent = `${state.events.length} events · ${state.snapshots.length} map frames`;
  }

  main().catch((err) => {
    console.error(err);
    document.body.innerHTML = `<pre style="padding:2rem;color:#f88">Failed to load: ${err}</pre>`;
  });
})();
