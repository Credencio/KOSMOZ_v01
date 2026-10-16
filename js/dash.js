/* Motor de dashboard genérico: lê um Feature Service do Survey123 e mostra-o segundo a configuração de js/surveys.js
   e a estrutura do XLSForm (js/schemas.js). Usado pelas abas Survey 4, Biodiversity e HST. */
(function () {
  "use strict";
  const P = Object.assign({ pollSeconds: 30, portalUrl: "https://www.arcgis.com", clientId: "" }, window.PLATFORM || {});
  const SID = document.body.dataset.survey;
  const SV = (window.SURVEYS || []).find((s) => s.id === SID);
  const SCH = (window.SCHEMAS || {})[SID] || { groups: [], choices: {} };
  const params = new URLSearchParams(location.search);
  const DEMO = !SV.serviceUrl || params.has("demo");
  const SERVICE = (SV.serviceUrl || "").replace(/\/+$/, "");
  const FIELDS = {}; SCH.groups.forEach((g) => g.fields.forEach((f) => (FIELDS[f.name] = Object.assign({ group: g.name }, f))));
  const PHOTO_FIELDS = (SV.photos || []).map((p) => p.field);
  const HIDDEN_PHOTOS = SV.hiddenPhotos || [];

  /* ---------- idioma ---------- */
  let LANG = "en";
  try { LANG = localStorage.getItem("ttm_lang") || "en"; } catch (e) { /* ignore */ }
  if (!window.DI18N[LANG]) LANG = "en";
  const t = (k, v) => { let s = (window.DI18N[LANG] || {})[k] ?? window.DI18N.en[k] ?? k; if (v) for (const x in v) s = s.split(`{${x}}`).join(v[x]); return s; };
  const L = (o) => (o == null ? "" : typeof o === "string" ? o : o[LANG] || o.en || "");
  const loc = () => t("locale");

  /* ---------- estado ---------- */
  const S = { recs: [], meta: null, domains: {}, photos: new Map(), seen: new Set(), fresh: new Set(), first: true, lastSync: null, lastSig: null,
    sort: { key: "_created", dir: -1 }, map: null, layer: null, fitted: false, galTab: "", galAll: false, lb: { list: [], i: 0 }, openGid: null };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const fmtNum = (n, d = 0) => (n == null || n === "" || isNaN(n) ? "—" : Number(n).toLocaleString(loc(), { maximumFractionDigits: d }));
  const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString(loc(), { day: "2-digit", month: "short", year: "numeric" }) : "—");
  const fmtDateTime = (ms) => (ms ? new Date(ms).toLocaleString(loc(), { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
  function ago(ms) {
    if (!ms) return "—";
    const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (s < 60) return t("s_ago", { n: s }); const m = Math.round(s / 60); if (m < 60) return t("m_ago", { n: m });
    const h = Math.round(m / 60); if (h < 24) return t("h_ago", { n: h }); return t("d_ago", { n: Math.round(h / 24) });
  }
  const isDateField = (f) => (FIELDS[f] && FIELDS[f].type === "date") || (S.meta && S.meta.dateFields && S.meta.dateFields.has(f));
  function label(f, v) {
    if (v == null || v === "") return "—";
    const def = FIELDS[f];
    const one = (c) => {
      c = String(c).trim();
      const list = def && def.list && SCH.choices[def.list];
      if (list && list[c] != null) return list[c];
      const dom = S.domains[f]; if (dom && dom[c] != null) return dom[c];
      return /_/.test(c) && !/\s/.test(c) ? c.replace(/_/g, " ") : c;
    };
    if (def && def.type === "select_multiple") return String(v).split(",").map((c) => c.trim()).filter(Boolean).map(one).join(", ");
    return one(v);
  }
  function fieldLabel(f) {
    if (f === "_created") return t("submitted");
    if (FIELDS[f]) return FIELDS[f].label;
    const mf = S.meta && S.meta.fields && S.meta.fields.find((x) => x.name.toLowerCase() === f);
    return mf ? mf.alias || mf.name : f;
  }
  function fmtVal(f, v) {
    if (f === "_created") return fmtDateTime(v);
    if (v == null || v === "") return "—";
    if (isDateField(f)) return fmtDate(v);
    if (FIELDS[f] && FIELDS[f].list) return label(f, v);
    if (S.domains[f]) return label(f, v);
    if (typeof v === "number") return fmtNum(v, 2);
    return String(v);
  }
  const H = { t, L, esc, label, fieldLabel, fmtVal, fmtNum, fmtDate };

  /* ---------- autenticação (OAuth PKCE, opcional) ---------- */
  const Auth = {
    data: null,
    load() { try { this.data = JSON.parse(localStorage.getItem("ttm_auth") || "null"); } catch (e) { this.data = null; } },
    token() { return this.data && Date.now() < this.data.expires - 60000 ? this.data.access_token : null; },
    clear() { this.data = null; try { localStorage.removeItem("ttm_auth"); } catch (e) { /* ignore */ } }
  };

  /* ---------- REST ---------- */
  class ApiError extends Error { constructor(m, c) { super(m); this.code = c; } }
  async function api(url, p = {}) {
    const q = new URLSearchParams(Object.assign({ f: "json" }, p));
    const tk = Auth.token(); if (tk) q.set("token", tk);
    const r = q.toString().length > 1800 ? await fetch(url, { method: "POST", body: q }) : await fetch(`${url}?${q}`);
    if (!r.ok) throw new ApiError(`HTTP ${r.status}`, r.status);
    const j = await r.json(); if (j.error) throw new ApiError(j.error.message || "Service error", j.error.code);
    return j;
  }
  const lc = (o) => { const x = {}; for (const k in o) x[k.toLowerCase()] = o[k]; return x; };
  const normGuid = (g) => String(g || "").replace(/[{}]/g, "").toLowerCase();
  async function discover() {
    const id = SV.layerId != null ? SV.layerId : 0;
    const m = await api(`${SERVICE}/${id}`); m.id = id; m.url = `${SERVICE}/${id}`;
    m.oidField = (m.objectIdField || "objectid").toLowerCase(); m.gidField = (m.globalIdField || "globalid").toLowerCase();
    const ef = m.editFieldsInfo || {};
    m.createdField = (ef.creationDateField || "").toLowerCase() || null; m.creatorField = (ef.creatorField || "").toLowerCase() || null; m.editField = (ef.editDateField || "").toLowerCase() || null;
    m.dateFields = new Set((m.fields || []).filter((f) => f.type === "esriFieldTypeDate").map((f) => f.name.toLowerCase()));
    (m.fields || []).forEach((f) => { if (f.domain && f.domain.codedValues) { const d = {}; f.domain.codedValues.forEach((c) => (d[c.code] = c.name)); S.domains[f.name.toLowerCase()] = d; } });
    S.meta = m; S.serviceName = SERVICE.split("/services/")[1] || SERVICE;
    $("sourceInfo").textContent = t("source", { s: S.serviceName, l: id });
  }
  async function queryAll(m) {
    const out = []; let off = 0; const page = Math.min(m.maxRecordCount || 1000, 2000);
    for (;;) {
      const j = await api(`${m.url}/query`, { where: "1=1", outFields: "*", returnGeometry: "true", outSR: "4326", orderByFields: `${m.oidField} ASC`, resultOffset: off, resultRecordCount: page });
      out.push(...(j.features || [])); if (!j.exceededTransferLimit || !(j.features || []).length) break; off += j.features.length;
    }
    return out;
  }
  async function signature() {
    const m = S.meta, st = [{ statisticType: "count", onStatisticField: m.oidField, outStatisticFieldName: "n" }];
    if (m.editField) st.push({ statisticType: "max", onStatisticField: m.editField, outStatisticFieldName: "e" });
    const j = await api(`${m.url}/query`, { where: "1=1", outStatistics: JSON.stringify(st) });
    const a = lc((j.features && j.features[0] && j.features[0].attributes) || {}); return `${a.n}|${a.e || ""}`;
  }
  function normalize(fs) {
    const m = S.meta;
    return fs.map((f) => {
      const a = lc(f.attributes || {}), g = f.geometry || {};
      let lat = g.y, lon = g.x; if (lat == null || isNaN(lat) || lat === 0) { lat = a.pc_latitude; lon = a.pc_longitude; }
      return { raw: f.attributes || {}, geom: f.geometry || null, a, oid: a[m.oidField], gid: normGuid(a[m.gidField]),
        lat: lat != null && !isNaN(lat) && lat !== 0 ? +lat : null, lon: lon != null && !isNaN(lon) && lon !== 0 ? +lon : null,
        created: (m.createdField && a[m.createdField]) || a.end || a.start || null, creator: (m.creatorField && a[m.creatorField]) || null };
    });
  }
  const fieldOfAtt = (a) => { const kw = String(a.keywords || "").toLowerCase(); const nm = String(a.name || "").toLowerCase();
    return kw || ([...PHOTO_FIELDS, ...HIDDEN_PHOTOS].find((p) => nm.startsWith(p)) || "other"); };
  async function loadPhotos(recs) {
    const m = S.meta; const map = new Map(); if (!m.hasAttachments || !recs.length) { S.photos = map; return; }
    const isImg = (a) => /^image\//i.test(a.contentType || "image/");
    const mk = (a, url) => ({ id: a.id, name: a.name, size: a.size, type: a.contentType, url, field: fieldOfAtt(a) });
    try {
      const oids = recs.map((x) => x.oid);
      for (let i = 0; i < oids.length; i += 250) {
        const j = await api(`${m.url}/queryAttachments`, { objectIds: oids.slice(i, i + 250).join(","), returnUrl: "true" });
        (j.attachmentGroups || []).forEach((g) => { const l = (g.attachmentInfos || []).filter(isImg).map((a) => mk(a, a.url || `${m.url}/${g.parentObjectId}/attachments/${a.id}`)); if (l.length) map.set(g.parentObjectId, l); });
      }
    } catch (e) {
      await Promise.all(recs.map(async (x) => { try { const j = await api(`${m.url}/${x.oid}/attachments`); const l = (j.attachmentInfos || []).filter(isImg).map((a) => mk(a, `${m.url}/${x.oid}/attachments/${a.id}`)); if (l.length) map.set(x.oid, l); } catch (err) { /* ignore */ } }));
    }
    const ord = (f) => { const i = PHOTO_FIELDS.indexOf(f); return i < 0 ? 99 : i; };
    map.forEach((l) => l.sort((p, q) => ord(p.field) - ord(q.field)));
    S.photos = map;
  }
  const photosOf = (x, withHidden) => (S.photos.get(x.oid) || []).filter((p) => withHidden || !HIDDEN_PHOTOS.includes(p.field));
  const photoSrc = (p) => (p.url.startsWith("data:") || !Auth.token() ? p.url : `${p.url}${p.url.includes("?") ? "&" : "?"}token=${encodeURIComponent(Auth.token())}`);
  const photoLabel = (f) => { const c = (SV.photos || []).find((p) => p.field === f); return c ? L(c.label) : fieldLabel(f); };
  function allPhotos(field) {
    const out = []; S.recs.forEach((x) => photosOf(x).forEach((p) => { if (!field || p.field === field) out.push({ p, x }); }));
    return out.sort((a, b) => (b.x.created || 0) - (a.x.created || 0));
  }

  async function loadLive(force) {
    if (!force && S.lastSig) { try { const s = await signature(); if (s === S.lastSig) { S.lastSync = Date.now(); return; } } catch (e) { /* full */ } }
    const recs = normalize(await queryAll(S.meta)); await loadPhotos(recs); ingest(recs);
    try { S.lastSig = await signature(); } catch (e) { S.lastSig = null; }
  }
  function ingest(recs) {
    S.recs = recs;
    const fresh = recs.filter((x) => !S.seen.has(x.gid));
    if (!S.first && fresh.length) { fresh.forEach((x) => S.fresh.add(x.gid)); toast(t("toast_new", { n: fresh.length, r: fresh.length === 1 ? t("rec1") : t("recn") })); }
    recs.forEach((x) => S.seen.add(x.gid)); S.lastSync = Date.now(); render(); S.first = false;
  }

  /* ---------- cálculos dos gráficos ---------- */
  function listOrder(f) { const d = FIELDS[f]; return d && d.list && SCH.choices[d.list] ? Object.keys(SCH.choices[d.list]) : null; }
  function colorOf(chart, code) {
    const map = chart.colors || (chart.colorFrom === "colorBy" && SV.colorBy ? SV.colorBy.colors : null);
    return map && map[code] ? map[code] : null;
  }
  function computeChart(c, R) {
    const fields = c.fields || [];
    if (c.kind === "cat" || c.kind === "multi") {
      const cnt = new Map();
      R.forEach((x) => fields.forEach((f) => {
        const v = x.a[f]; if (v == null || v === "") return;
        const codes = c.kind === "multi" || (FIELDS[f] && FIELDS[f].type === "select_multiple") ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : [String(v)];
        codes.forEach((code) => { const k = code; const e = cnt.get(k) || { code, f, n: 0 }; e.n++; cnt.set(k, e); });
      }));
      let out = [...cnt.values()].map((e) => ({ code: e.code, label: label(e.f, e.code), n: e.n, color: colorOf(c, e.code) }));
      const ord = c.order ? listOrder(fields[0]) : null;
      out.sort(ord ? (a, b) => ord.indexOf(a.code) - ord.indexOf(b.code) : (a, b) => b.n - a.n);
      return c.top ? out.slice(0, c.top) : out;
    }
    const isYes = (v) => /^(yes|sim|y|true|1)$/i.test(String(v).trim());
    if (c.kind === "yeslist") return fields.map((f) => { const ans = R.filter((x) => x.a[f]); const y = ans.filter((x) => isYes(x.a[f])).length; return { label: fieldLabel(f), n: y, display: `${y} / ${ans.length}` }; });
    if (c.kind === "yesrate") return fields.map((f) => { const ans = R.filter((x) => x.a[f]); const y = ans.filter((x) => isYes(x.a[f])).length; const p = ans.length ? Math.round((y / ans.length) * 100) : 0;
      return { label: fieldLabel(f), n: p, display: ans.length ? `${p}%` : "—", max: 100, color: p >= 90 ? "--s-alive" : p >= 70 ? "--s-stressed" : "--s-dead" }; });
    if (c.kind === "hist") {
      const b = c.bins; const out = b.slice(0, -1).map((lo, i) => ({ label: `${lo}–${b[i + 1] - 1}`, n: 0 }));
      R.forEach((x) => fields.forEach((f) => { const v = x.a[f]; if (v == null || v === "" || isNaN(v)) return; const i = b.findIndex((lo, k) => k < b.length - 1 && +v >= lo && +v < b[k + 1]); if (i >= 0) out[i].n++; }));
      return out;
    }
    return [];
  }
  function daily() {
    const end = new Date(); end.setHours(0, 0, 0, 0); const out = [];
    for (let i = 29; i >= 0; i--) { const d = new Date(end); d.setDate(d.getDate() - i); out.push({ t: d.getTime(), n: 0 }); }
    S.recs.forEach((x) => { if (!x.created) return; const d = new Date(x.created); d.setHours(0, 0, 0, 0); const b = out.find((y) => y.t === d.getTime()); if (b) b.n++; });
    return out;
  }
  const kpis = () => (SV.kpis || []).map((k) => { let v, s; try { v = k.value(S.recs, H); s = k.sub ? k.sub(S.recs, H) : ""; } catch (e) { v = "—"; s = ""; } return { label: L(k.label), value: v, sub: s }; });
  function actions() {
    const A = SV.actions; if (!A) return [];
    const now = Date.now(), soon = now + 7 * 864e5;
    return S.recs.filter((x) => A.when(x)).map((x) => {
      const due = x.a[A.due]; const st = !due ? "on_track" : due < new Date().setHours(0, 0, 0, 0) ? "overdue" : due <= soon ? "due_soon" : "on_track";
      return { x, what: x.a[A.what], who: x.a[A.who], due, where: x.a[A.where], status: st };
    }).sort((a, b) => (a.due || 9e15) - (b.due || 9e15));
  }

  /* ---------- renderização ---------- */
  function render() {
    renderKpis(); renderMap(); renderFeed(); renderCharts(); renderActions(); renderGallery(); renderFilters(); renderTable();
  }
  function applyStatic() {
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
    $("langEn").classList.toggle("active", LANG === "en"); $("langPt").classList.toggle("active", LANG === "pt");
    $("projectTitle").textContent = SV.title; $("projectSubtitle").textContent = L(SV.subtitle);
    document.title = `${SV.tab} · ${P.title}`;
  }
  function setLang(l) { LANG = l; try { localStorage.setItem("ttm_lang", l); } catch (e) { /* ignore */ } applyStatic(); render(); updateLive(); if (S.openGid) { const x = S.recs.find((r) => r.gid === S.openGid); if (x) openRec(x); } }

  const prevK = {};
  function renderKpis() {
    const K = kpis();
    $("kpis").innerHTML = K.map((k, i) => `<div class="kpi"><span class="label">${esc(k.label)}</span><span class="value${!S.first && prevK[i] !== undefined && prevK[i] !== k.value ? " flash" : ""}">${typeof k.value === "number" ? fmtNum(k.value) : esc(k.value)}</span><span class="sub">${esc(k.sub)}</span></div>`).join("");
    K.forEach((k, i) => (prevK[i] = k.value));
    setTimeout(() => document.querySelectorAll(".kpi .value.flash").forEach((e) => e.classList.remove("flash")), 1600);
  }

  function initMap() {
    if (typeof window.L === "undefined" || !window.L.map) { $("map").innerHTML = `<p class="empty" style="padding:16px">${t("map_fail")}</p>`; return; }
    const Lf = window.L;
    S.map = Lf.map("map").setView([-25.0, 32.7], 8);
    const esri = (s) => `https://server.arcgisonline.com/ArcGIS/rest/services/${s}/MapServer/tile/{z}/{y}/{x}`;
    const bm = { imagery: Lf.layerGroup([Lf.tileLayer(esri("World_Imagery"), { maxZoom: 19, attribution: "Esri, Maxar, Earthstar Geographics" }), Lf.tileLayer(esri("Reference/World_Boundaries_and_Places"), { maxZoom: 19 })]),
      topo: Lf.tileLayer(esri("World_Topo_Map"), { maxZoom: 19, attribution: "Esri, HERE, Garmin, USGS" }) };
    bm.imagery.addTo(S.map); S.layer = Lf.layerGroup().addTo(S.map);
    document.querySelectorAll("[data-basemap]").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll("[data-basemap]").forEach((x) => x.classList.toggle("active", x === b));
      Object.values(bm).forEach((l) => S.map.removeLayer(l)); bm[b.dataset.basemap].addTo(S.map);
    }));
  }
  const pointColor = (x) => { const cb = SV.colorBy; const v = cb ? x.a[cb.field] : null; return cssVar((cb && cb.colors[v]) || "--s-none"); };
  function renderMap() {
    const cb = SV.colorBy;
    if (cb) {
      const codes = Object.keys(cb.colors);
      $("mapLegend").innerHTML = codes.map((c) => `<span><i style="background:var(${cb.colors[c]})"></i>${esc(label(cb.field, c))}</span>`).join("") + `<span><i style="background:var(--s-none)"></i>${t("no_value")}</span>`;
    }
    if (!S.map) return;
    const Lf = window.L; S.layer.clearLayers(); const pts = [];
    S.recs.forEach((x) => {
      if (x.lat == null) return;
      const ph = photosOf(x)[0];
      const m = Lf.circleMarker([x.lat, x.lon], { radius: 7, color: cssVar("--paper") || "#000", weight: 2, fillColor: pointColor(x), fillOpacity: 0.95 });
      m.bindTooltip(`${ph ? `<img class="tip-img" src="${esc(photoSrc(ph))}" alt="">` : ""}<b>${esc(SV.recordTitle ? SV.recordTitle(x, H) : x.oid)}</b>${cb ? `<br>${esc(label(cb.field, x.a[cb.field]))}` : ""}`, { direction: "top", offset: [0, -6] });
      m.on("click", () => openRec(x)); m.addTo(S.layer); pts.push([x.lat, x.lon]);
      if (S.fresh.has(x.gid)) Lf.marker([x.lat, x.lon], { interactive: false, icon: Lf.divIcon({ className: "", html: '<div class="pulse-ring" style="width:34px;height:34px"></div>', iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(S.layer);
    });
    if (!S.fitted && pts.length) { S.map.fitBounds(Lf.latLngBounds(pts).pad(0.2), { maxZoom: 17 }); S.fitted = true; }
  }

  const sorted = () => [...S.recs].sort((a, b) => (b.created || 0) - (a.created || 0));
  function renderFeed() {
    $("feedCount").textContent = t(S.recs.length === 1 ? "records_1" : "records_n", { n: S.recs.length });
    const items = sorted().slice(0, 25);
    $("feed").innerHTML = items.length ? items.map((x) => {
      const ph = photosOf(x).slice(0, 4), isNew = S.fresh.has(x.gid);
      return `<li data-gid="${esc(x.gid)}" class="${isNew ? "is-new" : ""}" tabindex="0">
        <div class="row1"><span class="who">${SV.feed.title(x, H)}${isNew ? `<span class="new-pill">${t("new")}</span>` : ""}</span><span class="when" title="${esc(fmtDateTime(x.created))}">${ago(x.created)}</span></div>
        <div class="what">${SV.feed.sub(x, H)}</div>
        ${ph.length ? `<div class="strip mini">${ph.map((p) => `<span class="strip-cell"><img src="${esc(photoSrc(p))}" alt="" loading="lazy"></span>`).join("")}</div>` : ""}</li>`;
    }).join("") : `<li class="empty">${t("no_subs")}</li>`;
  }

  function hbars(el, entries, o = {}) {
    const max = Math.max(1, ...entries.map((e) => e.max || e.n));
    el.innerHTML = entries.length && entries.some((e) => e.n > 0 || e.display) ? `<div class="hbars">${entries.map((e) =>
      `<div class="hbar"><span class="lbl">${o.italic ? `<em>${esc(e.label)}</em>` : esc(e.label)}</span><span class="num">${esc(e.display || fmtNum(e.n))}</span><span class="track"><i style="width:${((e.n || 0) / (e.max || max)) * 100}%;--c:${e.color ? `var(${e.color})` : "var(--accent)"}"></i></span></div>`).join("")}</div>`
      : `<p class="empty">${t("no_data")}</p>`;
  }
  function renderCharts() {
    $("charts").innerHTML = (SV.charts || []).map((c, i) => `<div class="card${c.wide ? " wide2" : ""}"><div class="card-head"><h2>${esc(L(c.title))}</h2></div><div id="ch${i}"></div></div>`).join("")
      + `<div class="card wide"><div class="card-head"><h2>${t("daily")}</h2><span class="muted small">${t("last30")}</span></div><div id="chDaily" class="daily"></div></div>`;
    (SV.charts || []).forEach((c, i) => hbars($(`ch${i}`), computeChart(c, S.recs), { italic: c.italic }));
    renderDaily();
  }
  function renderDaily() {
    const el = $("chDaily"); if (!el) return; const d = daily();
    const W = Math.max(320, el.clientWidth || 900), Hh = 170, pl = 30, pb = 22, pt = 10, max = Math.max(4, ...d.map((b) => b.n)), st = Math.ceil(max / 4), top = st * 4;
    const y = (v) => pt + (Hh - pt - pb) * (1 - v / top), bw = (W - pl) / d.length;
    let s = `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(t("daily"))}">`;
    for (let v = 0; v <= top; v += st) s += `<line class="gl" x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`;
    d.forEach((b, i) => { if (b.n) s += `<rect class="col${i === d.length - 1 ? " today" : ""}" x="${pl + i * bw + bw * 0.18}" y="${y(b.n)}" width="${bw * 0.64}" height="${y(0) - y(b.n)}" rx="2"><title>${fmtDate(b.t)}: ${b.n}</title></rect>`;
      if ((W < 600 ? i % 10 === 9 : i % 5 === 4) || i === d.length - 1) s += `<text x="${pl + i * bw + bw / 2}" y="${Hh - 6}" text-anchor="middle">${new Date(b.t).toLocaleDateString(loc(), { day: "2-digit", month: "2-digit" })}</text>`; });
    el.innerHTML = s + "</svg>";
  }

  function renderActions() {
    const box = $("actionsCard"); if (!SV.actions) { box.hidden = true; return; }
    box.hidden = false; const A = actions();
    const colr = { overdue: "--s-dead", due_soon: "--s-stressed", on_track: "--s-alive" };
    $("actionsBody").innerHTML = A.length ? `<div class="table-scroll"><table class="tbl"><thead><tr><th>${t("a_where")}</th><th>${t("a_what")}</th><th>${t("a_who")}</th><th>${t("a_due")}</th><th></th></tr></thead><tbody>${A.map((a) =>
      `<tr data-gid="${esc(a.x.gid)}"><td>${esc(a.where || "—")}</td><td class="wrap">${esc(a.what || "—")}</td><td>${esc(a.who || "—")}</td><td>${fmtDate(a.due)}</td><td><span class="chip" style="--c:var(${colr[a.status]})">${t(a.status)}</span></td></tr>`).join("")}</tbody></table></div>`
      : `<p class="empty">${t("actions_none")}</p>`;
    $("actionsBody").querySelectorAll("tr[data-gid]").forEach((tr) => tr.addEventListener("click", () => { const x = S.recs.find((r) => r.gid === tr.dataset.gid); if (x) openRec(x); }));
  }

  function renderGallery() {
    const tabs = ["", ...PHOTO_FIELDS]; const cnt = Object.fromEntries(tabs.map((f) => [f, allPhotos(f).length]));
    $("galleryTabs").innerHTML = tabs.filter((f) => !f || cnt[f]).map((f) => `<button type="button" class="seg-btn${S.galTab === f ? " active" : ""}" data-f="${esc(f)}">${esc(f ? photoLabel(f) : t("all"))} <span class="cnt">${cnt[f]}</span></button>`).join("");
    $("galleryTabs").querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => { S.galTab = b.dataset.f; S.galAll = false; renderGallery(); }));
    const items = allPhotos(S.galTab), max = S.galAll ? items.length : 12;
    $("galleryCount").textContent = t(cnt[""] === 1 ? "photos_1" : "photos_n", { n: cnt[""] });
    $("gallery").innerHTML = items.length ? items.slice(0, max).map(({ p, x }, i) => `<figure class="g-item${S.fresh.has(x.gid) ? " is-new" : ""}"><button type="button" class="g-open" data-i="${i}"><img src="${esc(photoSrc(p))}" alt="${esc(p.name)}" loading="lazy"></button>
      <figcaption><b>${esc(SV.recordTitle ? SV.recordTitle(x, H) : "")}</b><span>${esc(photoLabel(p.field))} · ${fmtDate(x.created)}</span></figcaption></figure>`).join("") : `<p class="empty">${t("no_photos_all")}</p>`;
    $("gallery").querySelectorAll(".g-open").forEach((b) => b.addEventListener("click", () => openLb(items, +b.dataset.i)));
    const more = $("galleryMore"); more.hidden = items.length <= 12; more.textContent = S.galAll ? t("show_less") : t("show_all", { n: items.length });
  }

  function renderFilters() {
    $("filters").innerHTML = `<input id="fSearch" type="search" placeholder="${esc(t("search_ph"))}" aria-label="Search" value="${esc(S.q || "")}">` + (SV.filters || []).map((f) => {
      const vals = [...new Set(S.recs.flatMap((x) => (x.a[f] == null || x.a[f] === "" ? [] : FIELDS[f] && FIELDS[f].type === "select_multiple" ? String(x.a[f]).split(",") : [String(x.a[f])])))]
        .map((v) => [v, label(f, v)]).sort((a, b) => a[1].localeCompare(b[1]));
      const cur = (S.fv || {})[f] || "";
      return `<select data-f="${esc(f)}" aria-label="${esc(fieldLabel(f))}"><option value="">${esc(t("all_values", { f: fieldLabel(f) }))}</option>${vals.map(([v, l]) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    }).join("");
    $("fSearch").addEventListener("input", (e) => { S.q = e.target.value; renderTable(); });
    $("filters").querySelectorAll("select").forEach((s) => s.addEventListener("input", () => { S.fv = S.fv || {}; S.fv[s.dataset.f] = s.value; renderTable(); }));
  }
  const val = (x, k) => (k === "_created" ? x.created : x.a[k]);
  function filtered() {
    const q = (S.q || "").trim().toLowerCase(), fv = S.fv || {};
    const rows = S.recs.filter((x) => Object.entries(fv).every(([f, v]) => !v || (FIELDS[f] && FIELDS[f].type === "select_multiple" ? String(x.a[f] || "").split(",").includes(v) : String(x.a[f]) === v))
      && (!q || Object.keys(x.a).some((k) => { const v = x.a[k]; return v != null && typeof v !== "number" && (String(v).toLowerCase().includes(q) || String(label(k, v)).toLowerCase().includes(q)); })));
    return sortRows(rows, S.sort);
  }
  function sortRows(rows, { key, dir }) {
    return rows.sort((a, b) => {
      let x = val(a, key), y = val(b, key);
      if (FIELDS[key] && FIELDS[key].list) { x = x == null ? x : label(key, x); y = y == null ? y : label(key, y); }
      if (x == null || x === "") return 1; if (y == null || y === "") return -1;
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), loc(), { numeric: true })) * dir;
    });
  }
  function renderTable() {
    const C = SV.columns || [];
    $("tblHead").innerHTML = C.map((k) => `<th data-k="${k}" ${S.sort.key === k ? `aria-sort="${S.sort.dir > 0 ? "ascending" : "descending"}"` : ""} scope="col">${esc(fieldLabel(k))}</th>`).join("") + `<th>${t("photos")}</th>`;
    const rows = filtered();
    $("tblCount").textContent = t("rows", { a: rows.length, b: S.recs.length });
    $("tblBody").innerHTML = rows.length ? rows.map((x) => `<tr data-gid="${esc(x.gid)}" class="${S.fresh.has(x.gid) ? "is-new" : ""}">${C.map((k) => {
      const v = val(x, k); const cb = SV.colorBy;
      if (cb && k === cb.field && v) return `<td><span class="chip" style="--c:var(${cb.colors[v] || "--s-none"})">${esc(label(k, v))}</span></td>`;
      return `<td class="${typeof v === "number" && !isDateField(k) && k !== "_created" ? "num" : ""}">${esc(fmtVal(k, v))}</td>`;
    }).join("")}<td>${photosOf(x).length ? `<button type="button" class="ph-count" data-photos="${esc(x.gid)}"><span class="cam"></span>${photosOf(x).length}</button>` : "—"}</td></tr>`).join("")
      : `<tr><td colspan="${C.length + 1}" class="empty">${t(S.recs.length ? "no_match" : "no_subs")}</td></tr>`;
  }

  /* ---------- painel de detalhe ---------- */
  function openRec(x) {
    S.openGid = x.gid;
    $("drawerEyebrow").textContent = SV.tab;
    $("drawerTitle").textContent = SV.recordTitle ? SV.recordTitle(x, H) : `#${x.oid}`;
    const ph = photosOf(x, true);
    const secs = SCH.groups.map((g) => [g.label || "", g.fields.filter((f) => f.type !== "image" && f.type !== "geopoint" && x.a[f.name] != null && x.a[f.name] !== "")]).filter(([, f]) => f.length);
    $("drawerBody").innerHTML = (ph.length ? `<section class="dsec"><h3>${t("photos")}</h3><div class="photos">${ph.map((p, i) => `<button type="button" class="ph-thumb${HIDDEN_PHOTOS.includes(p.field) ? " sig" : ""}" data-i="${i}" title="${esc(photoLabel(p.field))}"><img src="${esc(photoSrc(p))}" alt="${esc(photoLabel(p.field))}" loading="lazy"><span class="ph-cap">${esc(photoLabel(p.field))}</span></button>`).join("")}</div></section>` : "")
      + secs.map(([title, fs]) => `<section class="dsec"><h3>${esc(title)}</h3><dl class="dl">${fs.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(fmtVal(f.name, x.a[f.name]))}</dd>`).join("")}</dl></section>`).join("")
      + `<section class="dsec"><h3>${t("submitted")}</h3><dl class="dl"><dt>${t("submitted")}</dt><dd>${fmtDateTime(x.created)}</dd><dt>${t("submitted_by")}</dt><dd>${esc(x.creator || "—")}</dd><dt>${t("location")}</dt><dd>${x.lat != null ? `${x.lat.toFixed(6)}, ${x.lon.toFixed(6)}` : "—"}</dd></dl></section>`
      + (x.lat != null ? `<section class="dsec"><a class="btn" href="https://www.google.com/maps?q=${x.lat},${x.lon}" target="_blank" rel="noopener">${t("gmaps")}</a></section>` : "");
    $("drawerBody").querySelectorAll(".ph-thumb").forEach((b) => b.addEventListener("click", () => openLb(ph.map((p) => ({ p, x })), +b.dataset.i)));
    $("drawer").classList.add("open"); $("drawer").setAttribute("aria-hidden", "false"); $("drawerBg").hidden = false;
  }
  function closeDrawer() { S.openGid = null; $("drawer").classList.remove("open"); $("drawer").setAttribute("aria-hidden", "true"); $("drawerBg").hidden = true; }

  function openLb(list, i) { S.lb = { list, i }; $("lightbox").hidden = false; document.body.classList.add("lb-open"); showLb(); $("lbClose").focus(); }
  function showLb() {
    const it = S.lb.list[S.lb.i]; if (!it) return; const src = photoSrc(it.p);
    $("lbImg").src = src; $("lbOrig").href = src; $("lbIdx").textContent = `${S.lb.i + 1} / ${S.lb.list.length}`;
    $("lbCap").innerHTML = `<b>${esc(SV.recordTitle ? SV.recordTitle(it.x, H) : "")}</b><br><span class="muted">${esc(photoLabel(it.p.field))} · ${esc(it.p.name)} · ${fmtDateTime(it.x.created)}</span>`;
    $("lbPrev").disabled = $("lbNext").disabled = S.lb.list.length < 2;
  }
  const stepLb = (d) => { const n = S.lb.list.length; if (n < 2) return; S.lb.i = (S.lb.i + d + n) % n; showLb(); };
  function closeLb() { $("lightbox").hidden = true; document.body.classList.remove("lb-open"); $("lbImg").removeAttribute("src"); }

  /* ---------- estado ao vivo ---------- */
  function toast(m, ms) { const d = document.createElement("div"); d.className = "toast"; d.textContent = m; $("toasts").appendChild(d); setTimeout(() => d.remove(), ms || 6000); return d; }
  function setLive(st, key) { const el = $("live"); el.classList.toggle("on", st === "on"); el.classList.toggle("err", st === "err"); S.liveSt = st; S.liveKey = key; updateLive(); }
  function updateLive() {
    if (S.liveSt === "on" && S.lastSync) $("liveText").textContent = document.hidden ? t("live_hidden", { ago: ago(S.lastSync) }) : t("live", { ago: ago(S.lastSync), n: Math.max(0, Math.round((S.nextAt - Date.now()) / 1000)) });
    else if (S.liveKey) $("liveText").textContent = t(S.liveKey);
    const rs = sorted(); document.querySelectorAll(".feed .when").forEach((e, i) => { if (rs[i]) e.textContent = ago(rs[i].created); });
  }
  async function cycle(force) {
    clearTimeout(S.timer);
    try { if (DEMO) Demo.step(); else await loadLive(force); S.nextAt = Date.now() + P.pollSeconds * 1000; setLive("on"); }
    catch (e) { console.error(e); S.nextAt = Date.now() + P.pollSeconds * 1000;
      if ([498, 499, 403, 401, "GWM_0003"].includes(e.code)) { setLive("err", "need_session"); toast(t("err_private"), 10000); }
      else { setLive("err", "offline"); toast(t("err_service", { e: e.message, n: P.pollSeconds })); } }
    S.timer = setTimeout(() => { if (!document.hidden) cycle(false); else S.pending = true; }, P.pollSeconds * 1000);
  }

  /* ---------- modo de demonstração (dados gerados a partir do XLSForm) ---------- */
  const Demo = {
    seed: 7, n: 0, recs: [], started: false,
    rnd() { this.seed = (this.seed * 16807) % 2147483647; return (this.seed - 1) / 2147483646; },
    pick(a) { return a[Math.floor(this.rnd() * a.length)]; },
    rel(expr, a) {
      if (!expr) return true;
      try {
        const js = expr.replace(/selected\(\$\{(\w+)\},\s*'([^']*)'\)/g, (m, f, v) => `(String(a.${f}||'').split(',').includes('${v}'))`)
          .replace(/contains\(\$\{(\w+)\},\s*'([^']*)'\)/g, (m, f, v) => `(String(a.${f}||'').includes('${v}'))`)
          .replace(/\$\{(\w+)\}/g, "a.$1").replace(/!=/g, "!==").replace(/([^!<>=])=([^=])/g, "$1===$2").replace(/\band\b/g, "&&").replace(/\bor\b/g, "||").replace(/\bnot\(/g, "!(");
        return !!Function("a", `return (${js});`)(a);
      } catch (e) { return true; }
    },
    make(ts) {
      this.n++; const a = { objectid: this.n, globalid: `demo${this.n}`, creationdate: ts };
      const SAMPLE = ["Checked with supervisor.", "Access by foot only.", "", "Follow up next visit.", "Area near the road."];
      SCH.groups.forEach((g) => {
        if (!this.rel(g.relevant, a)) return;
        g.fields.forEach((f) => {
          if (f.relevant && !this.rel(f.relevant, a)) return;
          const list = f.list && SCH.choices[f.list] ? Object.keys(SCH.choices[f.list]) : null;
          if (f.type === "select_one" && list) a[f.name] = this.pick(list.filter((c) => c !== "other") .length ? list.filter((c) => c !== "other") : list);
          else if (f.type === "select_multiple" && list) { const k = 1 + Math.floor(this.rnd() * Math.min(3, list.length)); a[f.name] = [...new Set(Array.from({ length: k }, () => this.pick(list.filter((c) => c !== "none" && c !== "other"))))].join(","); }
          else if (f.type === "integer") a[f.name] = /pct/.test(f.name) ? Math.round(this.rnd() * 100) : Math.floor(this.rnd() * 12);
          else if (f.type === "decimal") a[f.name] = Math.round((0.5 + this.rnd() * 30) * 10) / 10;
          else if (f.type === "range") a[f.name] = Math.round(this.rnd() * 20) * 5;
          else if (f.type === "date") a[f.name] = ts + Math.round((this.rnd() - 0.3) * 20) * 864e5;
          else if (f.type === "text") a[f.name] = /id$|ref|_no$/.test(f.name) ? `${f.name.slice(0, 2).toUpperCase()}-${100 + this.n}` : /site|location/.test(f.name) ? this.pick(["Node A", "Node B", "BOH", "Plot GR1"]) : this.pick(SAMPLE);
          else if (f.type === "calculate" && f.name === "tree_uid") a[f.name] = `TR26_${1000 + Math.floor(this.rnd() * 9000)}`;
        });
      });
      if (a.species && SCH.choices.species) {
        const lab = SCH.choices.species[a.species] || ""; const [sci, rest] = lab.split(" — "); a.sp_scientific = sci; a.sp_common_en = (rest || "").split(" / ")[0];
        a.sp_iucn = this.pick(["Least Concern (LC)", "Least Concern (LC)", "Least Concern (LC)", "Not Evaluated (NE)", "Vulnerable (VU)", "Endangered (EN)"]);
        if (a.iucn_status !== undefined) a.iucn_status = this.pick(["LC", "NE"]);
        if (a.endemism !== undefined) { a.endemism = this.pick(["Not endemic", "Not endemic", "Near-endemic", "Endemic"]); ["ThreatSearch_assessed", "protected_in_situ", "protected_ex_situ"].forEach((k) => { a[k] = this.pick(["Yes", "No"]); }); }
      }
      if (SID === "hst") { const checks = Object.keys(a).filter((k) => a[k] === "yes" || a[k] === "no"); a.issues_count = checks.filter((k) => a[k] === "no").length; }
      const x = { raw: Object.assign({}, a), a, oid: this.n, gid: `demo${this.n}`, created: ts, creator: "demo",
        lat: -25.93 + (this.rnd() - 0.5) * 0.03, lon: 32.59 + (this.rnd() - 0.5) * 0.03 }; x.geom = { x: x.lon, y: x.lat };
      const ph = PHOTO_FIELDS.filter((f) => this.rnd() > 0.3 && (!FIELDS[f] || this.rel(FIELDS[f].relevant, a) && this.rel((SCH.groups.find((g) => g.name === FIELDS[f].group) || {}).relevant, a)))
        .map((f, k) => ({ id: this.n * 10 + k, name: `${f}-demo-${this.n}.jpg`, type: "image/svg+xml", field: f, url: demoImg(this.n * 3 + k, f) }));
      if (ph.length) S.photos.set(this.n, ph);
      this.recs.push(x);
    },
    step() {
      if (!this.started) { for (let d = 20; d >= 0; d--) { const k = Math.floor(this.rnd() * 4); for (let i = 0; i < k; i++) this.make(Date.now() - d * 864e5 - this.rnd() * 8 * 3600e3); } this.started = true; }
      else if (this.rnd() > 0.4) this.make(Date.now() - this.rnd() * 30e3);
      ingest(this.recs.slice());
    }
  };
  function demoImg(seed, f) {
    const hue = (seed * 47) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="hsl(${hue},25%,62%)"/><rect y="190" width="400" height="110" fill="hsl(${(hue + 40) % 360},25%,35%)"/><circle cx="${120 + (seed % 160)}" cy="130" r="${40 + (seed % 30)}" fill="hsl(110,35%,30%)"/><rect x="0" y="262" width="400" height="38" fill="rgba(0,0,0,.45)"/><text x="14" y="286" font-family="sans-serif" font-size="15" fill="#F3EBD3">${f} · sample image</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------- API para dash-exports.js ---------- */
  window.DASH = { SV, SCH, S, P, FIELDS, t, L, H, label, fieldLabel, fmtVal, fmtNum, fmtDate, fmtDateTime, kpis, computeChart, daily, actions, sortRows, val,
    photosOf, photoSrc, photoLabel, pointColor, cssVar, toast, isDemo: () => DEMO, lang: () => LANG };

  /* ---------- arranque ---------- */
  async function start() {
    Auth.load(); applyStatic(); initMap();
    $("refreshBtn").addEventListener("click", () => cycle(true));
    $("langEn").addEventListener("click", () => setLang("en")); $("langPt").addEventListener("click", () => setLang("pt"));
    $("pdfBtn").addEventListener("click", () => window.DASHX.pdf($("pdfBtn"))); $("xlsxBtn").addEventListener("click", () => window.DASHX.xlsx($("xlsxBtn")));
    $("tblHead").addEventListener("click", (e) => { const th = e.target.closest("th[data-k]"); if (!th) return; const k = th.dataset.k; S.sort = { key: k, dir: S.sort.key === k ? -S.sort.dir : k === "_created" ? -1 : 1 }; renderTable(); });
    $("tblBody").addEventListener("click", (e) => {
      const pb = e.target.closest("[data-photos]");
      if (pb) { e.stopPropagation(); const x = S.recs.find((r) => r.gid === pb.dataset.photos); if (x) openLb(photosOf(x).map((p) => ({ p, x })), 0); return; }
      const tr = e.target.closest("tr[data-gid]"); if (tr) { const x = S.recs.find((r) => r.gid === tr.dataset.gid); if (x) openRec(x); }
    });
    $("feed").addEventListener("click", (e) => { const li = e.target.closest("li[data-gid]"); const x = li && S.recs.find((r) => r.gid === li.dataset.gid); if (x) openRec(x); });
    $("feed").addEventListener("keydown", (e) => { if (e.key !== "Enter") return; const li = e.target.closest("li[data-gid]"); const x = li && S.recs.find((r) => r.gid === li.dataset.gid); if (x) openRec(x); });
    $("drawerClose").addEventListener("click", closeDrawer); $("drawerBg").addEventListener("click", closeDrawer);
    $("lbClose").addEventListener("click", closeLb); $("lbPrev").addEventListener("click", () => stepLb(-1)); $("lbNext").addEventListener("click", () => stepLb(1));
    $("lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox" || e.target.classList.contains("lb-stage")) closeLb(); });
    $("lbRecord").addEventListener("click", () => { const it = S.lb.list[S.lb.i]; closeLb(); if (it) openRec(it.x); });
    $("galleryMore").addEventListener("click", () => { S.galAll = !S.galAll; renderGallery(); });
    document.addEventListener("keydown", (e) => {
      if (!$("lightbox").hidden) { if (e.key === "Escape") closeLb(); else if (e.key === "ArrowRight") stepLb(1); else if (e.key === "ArrowLeft") stepLb(-1); return; }
      if (e.key === "Escape") closeDrawer();
    });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && S.pending) { S.pending = false; cycle(false); } });
    setInterval(updateLive, 1000);
    let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(renderDaily, 200); });
    if (DEMO) { P.pollSeconds = Math.min(P.pollSeconds, 20); $("sourceInfo").textContent = "Demo data"; cycle(true); return; }
    setLive("", "connecting");
    const connect = async () => { try { await discover(); cycle(true); } catch (e) { console.error(e); setLive("err", [498, 499, 403, 401, "GWM_0003"].includes(e.code) ? "need_session" : "offline"); toast(t([498, 499, 403, 401, "GWM_0003"].includes(e.code) ? "err_private" : "err_service", { e: e.message, n: P.pollSeconds * 2 }), 10000); S.timer = setTimeout(connect, P.pollSeconds * 2000); } };
    connect();
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
})();
