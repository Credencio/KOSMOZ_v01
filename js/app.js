/* Tree Translocation Monitor — lê o Feature Service do Survey123 (ArcGIS Online) e atualiza em tempo real.
   Estrutura: uma camada, uma entrada por árvore, 4 fotografias por fase (anexos). */
(function () {
  "use strict";

  const CFG = Object.assign({ pollSeconds: 30, portalUrl: "https://www.arcgis.com", photoPhases: ["tree_photo", "prep_photo", "transpla_photo", "nursery_photo"], plannedTreeIds: [] }, window.APP_CONFIG || {});
  const params = new URLSearchParams(location.search);
  const DEMO = !CFG.serviceUrl || params.has("demo");
  const SERVICE = (CFG.serviceUrl || "").replace(/\/+$/, "");
  const PHASES = CFG.photoPhases;
  const PLANNED = (CFG.plannedTreeIds || []).map(String);

  /* ---------- Idioma ---------- */
  let LANG = "en";
  try { LANG = localStorage.getItem("ttm_lang") || CFG.defaultLanguage || "en"; } catch (e) { LANG = CFG.defaultLanguage || "en"; }
  if (!window.I18N[LANG]) LANG = "en";
  function t(key, vars) {
    let s = (window.I18N[LANG] && window.I18N[LANG][key]) ?? window.I18N.en[key] ?? key;
    if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
    return s;
  }
  const loc = () => t("locale");
  const fieldLabel = (k) => {
    const f = window.FIELD_LABELS[k]; if (f) return f[LANG === "pt" ? 1 : 0];
    const mf = S.meta && S.meta.fields && S.meta.fields.find((x) => x.name.toLowerCase() === k);
    return (mf && mf.alias && mf.alias !== mf.name) ? mf.alias : k;
  };
  // Medida da copa associada a cada fase de fotografia (campos do formulário)
  const PHASE_NOTES = Object.assign({ tree_photo: "tree_crown", prep_photo: "tree_crowm_p", transpla_photo: "tree_crowm_t", nursery_photo: "tree_crowm_n" }, (window.APP_CONFIG || {}).phaseNotes || {});
  const noteOf = (x, phase) => {
    const f = PHASE_NOTES[phase]; const v = f ? x.a[f] : null;
    if (v == null || v === "") return "";
    return typeof v === "number" ? t("crown_val", { v: fmtNum(v, 2) }) : label(f, v);
  };
  const CROWN_FIELDS = [["tree_photo", "tree_crown"], ["prep_photo", "tree_crowm_p"], ["transpla_photo", "tree_crowm_t"], ["nursery_photo", "tree_crowm_n"]];

  const FIELD_LIST = {
    tree_iucn: "iucn", arrival_condition: "condition", readiness: "readiness", prep_completed: "yes_no",
    stabilisation: "stabilisation", post_stabilisation: "stabilisation", overall_status: "overall_status", treatment: "treatment"
  };
  const SPECIES = ["Acacia nigrescens", "Balanites maughamii", "Boscia albitrunca", "Cassia abbreviata", "Colophospermum mopane", "Combretum apiculatum",
    "Diospyros mespiliformis", "Guibourtia conjugata", "Kirkia acuminata", "Manilkara mochisia", "Ozoroa engleri", "Peltophorum africanum",
    "Pappea capensis", "Sclerocarya birrea", "Terminalia sericea", "Ziziphus mucronata"];

  const STATUS_COLOR = { alive: "--s-alive", stressed: "--s-stressed", damaged: "--s-damaged", dead: "--s-dead", not_assessed: "--s-none" };
  const READY_COLOR = { ready: "--s-alive", conditionally_ready: "--s-stressed", not_ready: "--s-damaged", hold: "--s-dead" };

  const SECTIONS = [
    ["sec_caract", ["tree_id", "tree_tag", "plot_number", "species", "tree_iucn", "tree_technician", "dbh_cm", "tree_height", "tree_crown"]],
    ["sec_prep", ["rootball_diam", "rootball_height", "treatment", "tree_crowm_p"]],
    ["sec_transfer", ["stabilisation", "prep_date", "prep_completed", "readiness", "ready_date", "boxer_date", "tree_crowm_t"]],
    ["sec_nursery", ["arrival_condition", "post_stabilisation", "overall_status", "observations", "tree_crowm_n"]],
    ["sec_general", ["source_site", "survey_intention", "survey_type", "nursery", "_coords", "precision_gps"]],
    ["sec_submission", ["_created", "_creator"]]
  ];

  /* ---------- Estado ---------- */
  const S = {
    records: [], latest: [], meta: null, domains: {}, photos: new Map(),
    seen: new Set(), fresh: new Set(), lastSync: null, lastSig: null, firstLoad: true, timer: null, liveState: "",
    sort: { key: "_created", dir: -1 }, map: null, layers: {}, basemaps: {}, fitted: false, openGid: null,
    galleryAll: false, galleryPhase: "", lb: { list: [], i: 0 }, showPending: false
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const fmtNum = (n, d = 0) => n == null || n === "" || isNaN(n) ? "—" : Number(n).toLocaleString(loc(), { maximumFractionDigits: d });
  const fmtDate = (ms) => ms ? new Date(ms).toLocaleDateString(loc(), { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtDateTime = (ms) => ms ? new Date(ms).toLocaleString(loc(), { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  function ago(ms) {
    if (!ms) return "—";
    const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (s < 60) return t("s_ago", { n: s });
    const m = Math.round(s / 60); if (m < 60) return t("m_ago", { n: m });
    const h = Math.round(m / 60); if (h < 24) return t("h_ago", { n: h });
    return t("d_ago", { n: Math.round(h / 24) });
  }
  const pretty = (v) => String(v).replace(/_/g, " ").trim();
  function label(field, code) {
    if (code == null || code === "") return "—";
    const list = FIELD_LIST[field];
    const ch = window.CHOICES[LANG] || window.CHOICES.en;
    if (field === "treatment") return String(code).split(",").map((c) => c.trim()).filter(Boolean).map((c) => (ch.treatment[c] || pretty(c))).join(", ");
    if (list && ch[list] && ch[list][code]) return ch[list][code];
    const dom = S.domains[field];
    if (dom && dom[code] != null) return dom[code];
    if (field === "species" || field === "tree_technician") return /_/.test(code) && code === code.toLowerCase() ? pretty(code).replace(/\b\w/g, (c) => c.toUpperCase()) : pretty(code);
    return String(code);
  }
  const treatments = (x) => String(x.a.treatment || "").split(",").map((c) => c.trim()).filter(Boolean);
  const treeKey = (x) => (x.a.tree_id != null && x.a.tree_id !== "" ? String(x.a.tree_id) : `#${x.gid}`);
  const phaseLabel = (p) => t(`ph_${p}`) === `ph_${p}` ? pretty(p) : t(`ph_${p}`);

  /* ================= Autenticação (OAuth 2.0 PKCE, só para serviços privados) ================= */
  const AUTH_KEY = "ttm_auth";
  const Auth = {
    data: null,
    load() { try { this.data = JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch (e) { this.data = null; } },
    save(d) { this.data = d; try { localStorage.setItem(AUTH_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ } },
    clear() { this.data = null; try { localStorage.removeItem(AUTH_KEY); } catch (e) { /* ignore */ } },
    redirectUri() { return location.origin + location.pathname; },
    async token() {
      if (!this.data) return null;
      if (Date.now() < this.data.expires - 60000) return this.data.access_token;
      if (this.data.refresh_token) {
        try { await this.exchange({ grant_type: "refresh_token", refresh_token: this.data.refresh_token }); return this.data.access_token; }
        catch (e) { this.clear(); }
      }
      return null;
    },
    async login() {
      if (!CFG.clientId) { toast(t("err_clientid")); return; }
      const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
      const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
      const st = b64url(crypto.getRandomValues(new Uint8Array(16)));
      sessionStorage.setItem("ttm_pkce", JSON.stringify({ verifier, st }));
      const q = new URLSearchParams({ client_id: CFG.clientId, response_type: "code", redirect_uri: this.redirectUri(), code_challenge: challenge, code_challenge_method: "S256", state: st, expiration: "20160" });
      location.href = `${CFG.portalUrl}/sharing/rest/oauth2/authorize?${q}`;
    },
    async handleRedirect() {
      const code = params.get("code"); if (!code) return;
      let pk = null; try { pk = JSON.parse(sessionStorage.getItem("ttm_pkce") || "null"); } catch (e) { /* ignore */ }
      history.replaceState(null, "", this.redirectUri());
      if (!pk || pk.st !== params.get("state")) { toast(t("err_state")); return; }
      await this.exchange({ grant_type: "authorization_code", code, code_verifier: pk.verifier, redirect_uri: this.redirectUri() });
      sessionStorage.removeItem("ttm_pkce");
    },
    async exchange(body) {
      const r = await fetch(`${CFG.portalUrl}/sharing/rest/oauth2/token`, { method: "POST", body: new URLSearchParams(Object.assign({ client_id: CFG.clientId, f: "json" }, body)) });
      const j = await r.json();
      if (j.error || !j.access_token) throw new Error((j.error && (j.error.message || j.error_description)) || "token");
      this.save({ access_token: j.access_token, refresh_token: j.refresh_token || (this.data && this.data.refresh_token), expires: Date.now() + (j.expires_in || 1800) * 1000, username: j.username || (this.data && this.data.username) });
    }
  };
  function b64url(bytes) { let s = ""; bytes.forEach((b) => (s += String.fromCharCode(b))); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }

  /* ================= Pedidos REST ================= */
  class ApiError extends Error { constructor(msg, code) { super(msg); this.code = code; } }
  async function api(url, p = {}) {
    const q = new URLSearchParams(Object.assign({ f: "json" }, p));
    const tk = await Auth.token(); if (tk) q.set("token", tk);
    const long = q.toString().length > 1800;
    const r = long ? await fetch(url, { method: "POST", body: q }) : await fetch(`${url}?${q}`);
    if (!r.ok) throw new ApiError(`HTTP ${r.status}`, r.status);
    const j = await r.json();
    if (j.error) throw new ApiError(j.error.message || "Service error", j.error.code);
    return j;
  }
  const normGuid = (g) => String(g || "").replace(/[{}]/g, "").toLowerCase();
  const lc = (o) => { const out = {}; for (const k in o) out[k.toLowerCase()] = o[k]; return out; };

  async function discover() {
    let metas;
    if (CFG.layerId != null) {
      // camada indicada: lê-a diretamente (não depende da página do serviço)
      metas = [Object.assign(await api(`${SERVICE}/${CFG.layerId}`), { id: Number(CFG.layerId) })];
    } else {
      const svc = await api(SERVICE);
      const all = [...(svc.layers || []), ...(svc.tables || [])];
      metas = await Promise.all(all.map((l) => api(`${SERVICE}/${l.id}`).then((m) => Object.assign(m, { id: l.id }))));
    }
    const has = (m, f) => (m.fields || []).some((x) => x.name.toLowerCase() === f);
    const m = CFG.layerId != null ? metas.find((x) => x.id === Number(CFG.layerId)) : (metas.find((x) => has(x, "tree_id")) || metas[0]);
    if (!m) throw new ApiError(t("err_layer"), "cfg");
    m.url = `${SERVICE}/${m.id}`;
    m.oidField = (m.objectIdField || (m.fields.find((f) => f.type === "esriFieldTypeOID") || {}).name || "objectid").toLowerCase();
    m.gidField = (m.globalIdField || "globalid").toLowerCase();
    const ef = m.editFieldsInfo || {};
    m.createdField = (ef.creationDateField || "").toLowerCase() || null;
    m.creatorField = (ef.creatorField || "").toLowerCase() || null;
    m.editField = (ef.editDateField || "").toLowerCase() || null;
    m.fields.forEach((f) => {
      if (f.domain && f.domain.codedValues) { const d = {}; f.domain.codedValues.forEach((cv) => (d[cv.code] = cv.name)); S.domains[f.name.toLowerCase()] = d; }
    });
    S.meta = m;
    S.serviceName = SERVICE.split("/services/")[1] || SERVICE;
    renderSource();
  }

  async function queryAll(m) {
    const out = []; let offset = 0; const page = Math.min(m.maxRecordCount || 1000, 2000);
    for (;;) {
      const j = await api(`${m.url}/query`, { where: "1=1", outFields: "*", returnGeometry: "true", outSR: "4326", orderByFields: `${m.oidField} ASC`, resultOffset: offset, resultRecordCount: page });
      out.push(...(j.features || []));
      if (!j.exceededTransferLimit || !(j.features || []).length) break;
      offset += j.features.length;
    }
    return out;
  }

  async function signature() {
    const m = S.meta;
    const stats = [{ statisticType: "count", onStatisticField: m.oidField, outStatisticFieldName: "n" }];
    if (m.editField) stats.push({ statisticType: "max", onStatisticField: m.editField, outStatisticFieldName: "e" });
    const j = await api(`${m.url}/query`, { where: "1=1", outStatistics: JSON.stringify(stats) });
    const a = lc((j.features && j.features[0] && j.features[0].attributes) || {});
    return `${a.n}|${a.e || ""}`;
  }

  function normalize(features, m) {
    return features.map((f) => {
      const a = lc(f.attributes || {});
      const g = f.geometry || {};
      let lat = g.y, lon = g.x;
      if (lat == null || isNaN(lat)) { lat = a.pc_latitude; lon = a.pc_longitude; }
      return {
        raw: f.attributes || {}, geom: f.geometry || null,
        a, oid: a[m.oidField], gid: normGuid(a[m.gidField]),
        lat: lat != null && !isNaN(lat) && lat !== 0 ? +lat : null, lon: lon != null && !isNaN(lon) && lon !== 0 ? +lon : null,
        created: (m.createdField && a[m.createdField]) || a.creationdate || a.end || a.start || null,
        creator: (m.creatorField && a[m.creatorField]) || a.creator || null
      };
    });
  }

  async function loadLive(force) {
    if (!force && S.lastSig) {
      try { const sig = await signature(); if (sig === S.lastSig) { S.lastSync = Date.now(); return; } } catch (e) { /* leitura completa */ }
    }
    const recs = normalize(await queryAll(S.meta), S.meta);
    await loadPhotos(recs);
    ingest(recs);
    try { S.lastSig = await signature(); } catch (e) { S.lastSig = null; }
  }

  /* ---------- Fotografias (anexos) agrupadas por fase ---------- */
  function phaseOf(att) {
    const kw = String(att.keywords || "").toLowerCase();
    const nm = String(att.name || "").toLowerCase();
    return PHASES.find((p) => kw === p.toLowerCase()) || PHASES.find((p) => nm.startsWith(p.toLowerCase())) || kw || "other";
  }
  function mkPhoto(a, url) { return { id: a.id, name: a.name, keywords: a.keywords || "", size: a.size, type: a.contentType, url, phase: phaseOf(a) }; }
  async function loadPhotos(recs) {
    const m = S.meta; if (!m || !m.hasAttachments || !recs.length) { S.photos = new Map(); return; }
    const map = new Map();
    const isImg = (a) => /^image\//i.test(a.contentType || "image/");
    try {
      const oids = recs.map((x) => x.oid);
      for (let i = 0; i < oids.length; i += 250) {
        const j = await api(`${m.url}/queryAttachments`, { objectIds: oids.slice(i, i + 250).join(","), returnUrl: "true" });
        (j.attachmentGroups || []).forEach((g) => {
          const list = (g.attachmentInfos || []).filter(isImg).map((a) => mkPhoto(a, a.url || `${m.url}/${g.parentObjectId}/attachments/${a.id}`));
          if (list.length) map.set(g.parentObjectId, list);
        });
      }
    } catch (e) {
      await Promise.all(recs.map(async (x) => {
        try {
          const j = await api(`${m.url}/${x.oid}/attachments`);
          const list = (j.attachmentInfos || []).filter(isImg).map((a) => mkPhoto(a, `${m.url}/${x.oid}/attachments/${a.id}`));
          if (list.length) map.set(x.oid, list);
        } catch (err) { /* ignora */ }
      }));
    }
    map.forEach((list) => list.sort((p, q) => phaseIdx(p.phase) - phaseIdx(q.phase)));
    S.photos = map;
  }
  const phaseIdx = (p) => { const i = PHASES.indexOf(p); return i < 0 ? 99 : i; };
  const photosOf = (x) => S.photos.get(x.oid) || [];
  const photoOfPhase = (x, p) => photosOf(x).find((ph) => ph.phase === p) || null;
  const photoSrc = (ph) => (ph.url.startsWith("data:") || !(Auth.data && Auth.data.access_token) ? ph.url : `${ph.url}${ph.url.includes("?") ? "&" : "?"}token=${encodeURIComponent(Auth.data.access_token)}`);
  function allPhotos(phase) {
    const out = [];
    S.records.forEach((x) => photosOf(x).forEach((ph) => { if (!phase || ph.phase === phase) out.push({ ph, x }); }));
    return out.sort((a, b) => (b.x.created || 0) - (a.x.created || 0) || phaseIdx(a.ph.phase) - phaseIdx(b.ph.phase));
  }

  /* ================= Integração de dados ================= */
  function ingest(recs) {
    S.records = recs;
    const by = new Map();
    recs.forEach((x) => { const k = treeKey(x); const cur = by.get(k); if (!cur || (x.created || 0) > (cur.created || 0)) by.set(k, x); });
    S.latest = [...by.values()];
    const fresh = recs.filter((x) => !S.seen.has(x.gid));
    if (!S.firstLoad && fresh.length) {
      fresh.forEach((x) => S.fresh.add(x.gid));
      const who = label("tree_technician", fresh[0].a.tree_technician);
      toast(t("toast_new", { n: fresh.length, e: fresh.length === 1 ? t("toast_e1") : t("toast_en"), who: who && who !== "—" ? ` · ${who}` : "" }));
    }
    recs.forEach((x) => S.seen.add(x.gid));
    S.lastSync = Date.now();
    render();
    S.firstLoad = false;
  }

  /* ================= Cálculos partilhados (página e PDF) ================= */
  const now = () => Date.now();
  const stageOf = (x) => ({
    characterised: true,
    prepared: x.a.prep_completed === "yes",
    ready: x.a.readiness === "ready" || x.a.readiness === "conditionally_ready",
    boxed: !!x.a.boxer_date && x.a.boxer_date <= now(),
    nursery: !!x.a.arrival_condition
  });
  const STAGES = ["characterised", "prepared", "ready", "boxed", "nursery"];
  function countBy(arr, fn) { const m = new Map(); arr.forEach((x) => { const k = fn(x); m.set(k, (m.get(k) || 0) + 1); }); return m; }

  function coverage() {
    const surveyed = new Set(S.records.map((x) => x.a.tree_id).filter((v) => v != null && v !== "").map(String));
    const pending = PLANNED.filter((id) => !surveyed.has(id));
    const extra = [...surveyed].filter((id) => PLANNED.length && !PLANNED.includes(id)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return { planned: PLANNED.length, done: PLANNED.length - pending.length, pending, extra };
  }

  function stats() {
    const T = S.latest, n = T.length, st = T.map(stageOf);
    const assessed = T.filter((x) => x.a.overall_status && x.a.overall_status !== "not_assessed");
    const alive = assessed.filter((x) => x.a.overall_status === "alive" || x.a.overall_status === "stressed").length;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const techs = new Set(S.records.map((x) => x.a.tree_technician).filter(Boolean)).size;
    const cnt = (k) => st.filter((s) => s[k]).length;
    const pct = (a) => (n ? Math.round((a / n) * 100) : 0);
    const cov = coverage();
    const kpis = [
      { id: "entries", label: t("kpi_entries"), value: S.records.length, sub: `${t("today", { n: S.records.filter((x) => x.created && x.created >= today.getTime()).length })} · ${t(techs === 1 ? "tech_1" : "tech_n", { n: techs })}` },
      { id: "trees", label: t("kpi_trees"), value: n, sub: cov.planned ? t("of_planned", { n: cov.planned }) : "" },
      { id: "prep", label: t("kpi_prep"), value: cnt("prepared"), sub: n ? t("of_total", { p: pct(cnt("prepared")) }) : "—" },
      { id: "ready", label: t("kpi_ready"), value: cnt("ready"), sub: n ? t("of_total", { p: pct(cnt("ready")) }) : "—" },
      { id: "boxed", label: t("kpi_boxed"), value: cnt("boxed"), sub: n ? t("of_total", { p: pct(cnt("boxed")) }) : "—" },
      { id: "surv", label: t("kpi_surv"), value: assessed.length ? `${Math.round((alive / assessed.length) * 100)}%` : "—", sub: assessed.length ? t("assessed", { a: alive, b: assessed.length }) : t("no_assess") }
    ];
    const pipeline = STAGES.map((k, i) => ({ key: k, name: t(`st_${k}`), step: i + 1, n: cnt(k), pct: pct(cnt(k)) }));
    const sc = countBy(T, (x) => x.a.overall_status || "_none");
    const status = ["alive", "stressed", "damaged", "dead", "not_assessed", "_none"].filter((k) => sc.get(k))
      .map((k) => ({ key: k, label: k === "_none" ? t("no_status") : label("overall_status", k), n: sc.get(k), color: STATUS_COLOR[k] || "--s-none" }));
    const rc = countBy(T, (x) => x.a.readiness || "_none");
    const ready = ["ready", "conditionally_ready", "not_ready", "hold", "_none"].filter((k) => rc.get(k))
      .map((k) => ({ key: k, label: k === "_none" ? t("not_eval") : label("readiness", k), n: rc.get(k), color: READY_COLOR[k] || "--s-none" }));
    const sorted = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([l, v]) => ({ label: l, n: v }));
    const species = sorted(countBy(T, (x) => label("species", x.a.species)));
    const tech = sorted(countBy(S.records, (x) => label("tree_technician", x.a.tree_technician)));
    const tm = new Map(); T.forEach((x) => treatments(x).forEach((c) => tm.set(label("treatment", c), (tm.get(label("treatment", c)) || 0) + 1)));
    const treat = sorted(tm);
    const iucn = sorted(countBy(T, (x) => label("tree_iucn", x.a.tree_iucn)));
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const daily = []; for (let i = 29; i >= 0; i--) { const d = new Date(end); d.setDate(d.getDate() - i); daily.push({ t: d.getTime(), n: 0 }); }
    S.records.forEach((x) => { if (!x.created) return; const d = new Date(x.created); d.setHours(0, 0, 0, 0); const b = daily.find((y) => y.t === d.getTime()); if (b) b.n++; });
    const crown = CROWN_FIELDS.map(([ph, f]) => {
      const vals = T.map((x) => x.a[f]).filter((v) => typeof v === "number" && isFinite(v));
      return vals.length ? { key: ph, label: phaseLabel(ph), n: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100, count: vals.length } : null;
    }).filter(Boolean);
    return { kpis, pipeline, status, ready, species, tech, treat, iucn, daily, crown, coverage: cov };
  }

  /* ================= Renderização ================= */
  function render() {
    const st = stats();
    renderHeader(); renderKpis(st); renderPipeline(st); renderMap(); renderFeed(); renderCharts(st); renderFilters(); renderTable(); renderLegend(); renderGallery();
  }

  function applyStatic() {
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
    $("langEn").classList.toggle("active", LANG === "en"); $("langPt").classList.toggle("active", LANG === "pt");
    $("langEn").setAttribute("aria-pressed", LANG === "en"); $("langPt").setAttribute("aria-pressed", LANG === "pt");
    syncAuthBtn();
  }
  function setLang(l) {
    LANG = l; try { localStorage.setItem("ttm_lang", l); } catch (e) { /* ignore */ }
    applyStatic(); renderSource(); render(); updateLiveText();
    if (S.openGid) { const x = S.records.find((y) => y.gid === S.openGid); if (x) openTree(x); }
  }
  function renderSource() {
    $("sourceInfo").textContent = DEMO ? t("src_demo") : S.meta ? t("src_live", { s: S.serviceName, a: S.meta.id }) : "";
  }

  function renderHeader() {
    if (CFG.projectTitle) $("projectTitle").textContent = CFG.projectTitle;
    if (CFG.projectSubtitle) $("projectSubtitle").textContent = CFG.projectSubtitle;
    const src = new Set(S.records.map((p) => p.a.source_site).filter(Boolean));
    const dst = new Set(S.records.map((p) => p.a.nursery).filter(Boolean));
    $("route").innerHTML = src.size || dst.size
      ? `<span class="muted">${t("origin")}</span>${[...src].slice(0, 3).map((s) => `<span class="place">${esc(s)}</span>`).join("")}<span class="arrow">→</span><span class="muted">${t("nursery")}</span>${[...dst].slice(0, 3).map((s) => `<span class="place">${esc(s)}</span>`).join("")}`
      : "";
  }

  const prevKpi = {};
  function renderKpis(st) {
    $("kpis").innerHTML = st.kpis.map((k) => `<div class="kpi"><span class="label">${esc(k.label)}</span><span class="value${!S.firstLoad && prevKpi[k.id] !== undefined && prevKpi[k.id] !== k.value ? " flash" : ""}">${typeof k.value === "number" ? fmtNum(k.value) : esc(k.value)}</span><span class="sub">${esc(k.sub)}</span></div>`).join("");
    st.kpis.forEach((k) => (prevKpi[k.id] = k.value));
    setTimeout(() => document.querySelectorAll(".kpi .value.flash").forEach((e) => e.classList.remove("flash")), 1600);
  }

  function renderPipeline(st) {
    const c = st.coverage;
    $("coverage").innerHTML = c.planned ? `
      <div class="cov-top"><span class="cov-label">${t("coverage")}</span><span class="cov-txt">${esc(t("coverage_txt", { a: c.done, b: c.planned }))}</span>
        <button type="button" class="btn ghost small-btn" id="pendingBtn" aria-expanded="${S.showPending}">${esc(c.pending.length ? t("pending", { n: c.pending.length }) : t("pending_none"))}</button></div>
      <div class="cov-bar"><i style="width:${(c.done / c.planned) * 100}%"></i></div>
      ${S.showPending && c.pending.length ? `<div class="pending">${c.pending.map((id) => `<span class="tag">${esc(id)}</span>`).join("")}</div>` : ""}
      ${c.extra.length ? `<p class="muted small">${esc(t("extra_ids", { ids: c.extra.join(", ") }))}</p>` : ""}` : "";
    const pb = $("pendingBtn"); if (pb) pb.addEventListener("click", () => { S.showPending = !S.showPending; renderPipeline(stats()); });
    $("pipeline").innerHTML = st.pipeline.map((s) =>
      `<li class="stage"><span class="step">${t("stage", { n: s.step })}</span><div class="top"><span class="n">${fmtNum(s.n)}</span><span class="pct">${s.pct}%</span></div><div class="bar"><i style="width:${s.pct}%"></i></div><span class="name">${esc(s.name)}</span></li>`).join("");
  }

  /* ---------- Mapa ---------- */
  function initMap() {
    if (typeof L === "undefined") { $("map").innerHTML = `<p class="empty" style="padding:16px">${t("map_fail")}</p>`; return; }
    S.map = L.map("map", { zoomControl: true, attributionControl: true }).setView([-25.0, 32.7], 8);
    const esri = (svc) => `https://server.arcgisonline.com/ArcGIS/rest/services/${svc}/MapServer/tile/{z}/{y}/{x}`;
    S.basemaps.imagery = L.layerGroup([
      L.tileLayer(esri("World_Imagery"), { maxZoom: 19, attribution: "Esri, Maxar, Earthstar Geographics" }),
      L.tileLayer(esri("Reference/World_Boundaries_and_Places"), { maxZoom: 19 })
    ]);
    S.basemaps.topo = L.tileLayer(esri("World_Topo_Map"), { maxZoom: 19, attribution: "Esri, HERE, Garmin, USGS" });
    S.basemaps.imagery.addTo(S.map);
    S.layers.trees = L.layerGroup().addTo(S.map);
    S.layers.pulse = L.layerGroup().addTo(S.map);
    document.querySelectorAll("[data-basemap]").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll("[data-basemap]").forEach((x) => x.classList.toggle("active", x === b));
      Object.values(S.basemaps).forEach((l) => S.map.removeLayer(l));
      S.basemaps[b.dataset.basemap].addTo(S.map);
    }));
  }
  function renderLegend() {
    $("mapLegend").innerHTML = Object.keys(STATUS_COLOR).map((k) => `<span><i style="background:var(${STATUS_COLOR[k]})"></i>${esc(label("overall_status", k))}</span>`).join("")
      + `<span><i style="background:var(--s-none)"></i>${t("no_status")}</span>`;
  }
  function renderMap() {
    if (!S.map) return;
    S.layers.trees.clearLayers(); S.layers.pulse.clearLayers();
    const pts = [];
    S.latest.forEach((x) => {
      if (x.lat == null) return;
      const c = L.circleMarker([x.lat, x.lon], { radius: 7, color: cssVar("--paper") || "#000", weight: 2, fillColor: cssVar(STATUS_COLOR[x.a.overall_status] || "--s-none"), fillOpacity: 0.95 });
      const ph = photoOfPhase(x, PHASES[0]) || photosOf(x)[0];
      c.bindTooltip(`${ph ? `<img class="tip-img" src="${esc(photoSrc(ph))}" alt="">` : ""}<b>Tree ${esc(x.a.tree_id || "")}</b> · <i>${esc(label("species", x.a.species))}</i><br>${esc(label("overall_status", x.a.overall_status))} · ${esc(label("readiness", x.a.readiness))}`, { direction: "top", offset: [0, -6] });
      c.on("click", () => openTree(x));
      c.addTo(S.layers.trees); pts.push([x.lat, x.lon]);
      if (S.fresh.has(x.gid)) L.marker([x.lat, x.lon], { interactive: false, icon: L.divIcon({ className: "", html: '<div class="pulse-ring" style="width:34px;height:34px"></div>', iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(S.layers.pulse);
    });
    if (!S.fitted && pts.length) { S.map.fitBounds(L.latLngBounds(pts).pad(0.2), { maxZoom: 18 }); S.fitted = true; }
  }

  /* ---------- Feed ---------- */
  const sortedRecords = () => [...S.records].sort((a, b) => (b.created || 0) - (a.created || 0));
  function phaseStrip(x, cls) {
    return `<div class="${cls || "strip"}">${PHASES.map((p) => { const ph = photoOfPhase(x, p); return ph
      ? `<button type="button" class="strip-cell" data-gid="${esc(x.gid)}" data-phase="${esc(p)}" title="${esc(phaseLabel(p))}"><img src="${esc(photoSrc(ph))}" alt="${esc(phaseLabel(p))}" loading="lazy"></button>`
      : `<span class="strip-cell empty-cell" title="${esc(phaseLabel(p))}: ${esc(t("missing_photo"))}"></span>`; }).join("")}</div>`;
  }
  function renderFeed() {
    const items = sortedRecords().slice(0, 25);
    $("feedCount").textContent = t(S.records.length === 1 ? "entries_1" : "entries_n", { n: S.records.length });
    $("feed").innerHTML = items.length ? items.map((x) => {
      const isNew = S.fresh.has(x.gid);
      return `<li data-gid="${esc(x.gid)}" class="${isNew ? "is-new" : ""}" tabindex="0">
        <div class="row1"><span class="who">Tree ${esc(x.a.tree_id || "—")} · <i class="sp">${esc(label("species", x.a.species))}</i>${isNew ? `<span class="new-pill">${t("new")}</span>` : ""}</span><span class="when" title="${esc(fmtDateTime(x.created))}">${ago(x.created)}</span></div>
        <div class="what">${esc(label("tree_technician", x.a.tree_technician))} · ${esc(x.a.source_site || "—")} → ${esc(x.a.nursery || "—")}${x.a.overall_status ? ` · <span class="chip" style="--c:var(${STATUS_COLOR[x.a.overall_status] || "--s-none"})">${esc(label("overall_status", x.a.overall_status))}</span>` : ""}</div>
        ${photosOf(x).length ? phaseStrip(x, "strip mini") : ""}
      </li>`;
    }).join("") : `<li class="empty">${t("no_subs")}</li>`;
  }

  /* ---------- Gráficos ---------- */
  function hbars(el, entries, opts = {}) {
    const max = Math.max(1, ...entries.map((e) => e.n));
    el.innerHTML = entries.length ? `<div class="hbars">${entries.map((e) =>
      `<div class="hbar"><span class="lbl">${opts.italic ? `<em>${esc(e.label)}</em>` : esc(e.label)}</span><span class="num">${fmtNum(e.n, opts.dec || 0)}${opts.unit || ""}</span><span class="track"><i style="width:${(e.n / max) * 100}%;--c:${e.color ? `var(${e.color})` : "var(--accent)"}"></i></span></div>`).join("")}</div>`
      : `<p class="empty">${t("no_data")}</p>`;
  }
  function renderCharts(st) {
    const box = $("chartStatus");
    if (S.latest.length) {
      box.innerHTML = `<div class="stack">${st.status.map((s) => `<i style="flex-grow:${s.n};--c:var(${s.color})" title="${esc(s.label)}: ${s.n}"></i>`).join("")}</div><div></div>`;
      hbars(box.lastElementChild, st.status);
    } else hbars(box, []);
    hbars($("chartReady"), st.ready);
    hbars($("chartSpecies"), st.species.slice(0, 12), { italic: true });
    hbars($("chartTreat"), st.treat);
    hbars($("chartTech"), st.tech);
    hbars($("chartIucn"), st.iucn);
    hbars($("chartCrown"), st.crown, { dec: 2, unit: " m" });
    renderDaily(st.daily);
  }
  function renderDaily(daily) {
    daily = daily || stats().daily;
    const el = $("chartDaily"); el.className = "daily";
    const days = daily.length, W = Math.max(320, el.clientWidth || 900), H = 170, padL = 30, padB = 22, padT = 10;
    const max = Math.max(4, ...daily.map((b) => b.n)), step = Math.ceil(max / 4), top = step * 4;
    const y = (v) => padT + (H - padT - padB) * (1 - v / top);
    const bw = (W - padL) / days;
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("ch_daily"))}">`;
    for (let v = 0; v <= top; v += step) svg += `<line class="gl" x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${padL - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`;
    daily.forEach((b, i) => {
      const x = padL + i * bw + bw * 0.18;
      if (b.n) svg += `<rect class="col${i === days - 1 ? " today" : ""}" x="${x}" y="${y(b.n)}" width="${bw * 0.64}" height="${y(0) - y(b.n)}" rx="2"><title>${fmtDate(b.t)}: ${b.n}</title></rect>`;
      if ((W < 600 ? i % 10 === 9 : i % 5 === 4) || i === days - 1) svg += `<text x="${padL + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${new Date(b.t).toLocaleDateString(loc(), { day: "2-digit", month: "2-digit" })}</text>`;
    });
    el.innerHTML = svg + "</svg>";
  }

  /* ---------- Tabela ---------- */
  const COLS = [
    ["tree_id", "c_tree_id", "id"], ["tree_tag", "c_tag"], ["species", "c_species"], ["plot_number", "c_plot"],
    ["tree_technician", "c_tech"], ["dbh_cm", "c_dbh", "num"], ["tree_height", "c_height", "num"],
    ["readiness", "c_ready"], ["overall_status", "c_status"], ["prep_date", "c_prep", "date"],
    ["boxer_date", "c_boxer", "date"], ["_photos", "c_photos", "photo"], ["_created", "c_submitted", "date"]
  ];
  const val = (x, k) => (k === "_created" ? x.created : k === "_photos" ? photosOf(x).length : x.a[k]);

  function fillSelect(el, allLabel, entries) {
    const cur = el.value;
    el.innerHTML = `<option value="">${esc(allLabel)}</option>` + entries.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("");
    if ([...el.options].some((o) => o.value === cur)) el.value = cur;
  }
  function renderFilters() {
    const uniq = (fn) => [...new Set(S.records.map(fn).filter((x) => x != null && x !== ""))];
    fillSelect($("fSpecies"), t("all_species"), uniq((x) => x.a.species).map((v) => [v, label("species", v)]).sort((a, b) => a[1].localeCompare(b[1])));
    fillSelect($("fTech"), t("all_tech"), uniq((x) => x.a.tree_technician).map((v) => [v, label("tree_technician", v)]));
    fillSelect($("fStatus"), t("all_status"), uniq((x) => x.a.overall_status).map((v) => [v, label("overall_status", v)]));
    fillSelect($("fReady"), t("all_ready"), uniq((x) => x.a.readiness).map((v) => [v, label("readiness", v)]));
  }
  function filtered() {
    const q = $("fSearch").value.trim().toLowerCase();
    const fs = $("fSpecies").value, ft = $("fTech").value, fst = $("fStatus").value, fr = $("fReady").value;
    const rows = S.records.filter((x) =>
      (!fs || x.a.species === fs) && (!ft || x.a.tree_technician === ft) && (!fst || x.a.overall_status === fst) && (!fr || x.a.readiness === fr) &&
      (!q || [x.a.tree_id, x.a.tree_tag, x.a.plot_number, label("species", x.a.species), x.a.observations, x.a.source_site, label("tree_technician", x.a.tree_technician)]
        .some((v) => v != null && String(v).toLowerCase().includes(q))));
    return sortRows(rows, S.sort);
  }
  function sortRows(rows, { key, dir }) {
    return rows.sort((a, b) => {
      let x = val(a, key), y = val(b, key);
      if (FIELD_LIST[key] || key === "species" || key === "tree_technician") { x = x == null ? x : label(key, x); y = y == null ? y : label(key, y); }
      if (x == null || x === "") return 1; if (y == null || y === "") return -1;
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), loc(), { numeric: true })) * dir;
    });
  }
  function cell(x, [k, , type]) {
    const v = val(x, k);
    if (type === "photo") return `<td>${PHASES.length ? `<button type="button" class="ph-dots" data-photos="${esc(x.gid)}" ${v ? "" : "disabled"} aria-label="${esc(t("photos"))}: ${v}">${PHASES.map((p) => `<i class="${photoOfPhase(x, p) ? "on" : ""}" title="${esc(phaseLabel(p))}"></i>`).join("")}<span>${v}</span></button>` : v}</td>`;
    if (type === "num") return `<td class="num">${fmtNum(v, 1)}</td>`;
    if (type === "date") return `<td>${fmtDate(v)}</td>`;
    if (type === "id") return `<td><b>${esc(v == null || v === "" ? "—" : v)}</b></td>`;
    if (k === "species") return `<td class="sp">${esc(label("species", v))}</td>`;
    if (k === "tree_tag") return `<td>${v ? `<span class="tag">${esc(v)}</span>` : "—"}</td>`;
    if (k === "overall_status") return `<td>${v ? `<span class="chip" style="--c:var(${STATUS_COLOR[v] || "--s-none"})">${esc(label(k, v))}</span>` : "—"}</td>`;
    if (k === "readiness") return `<td>${v ? `<span class="chip" style="--c:var(${READY_COLOR[v] || "--s-none"})">${esc(label(k, v))}</span>` : "—"}</td>`;
    return `<td>${esc(FIELD_LIST[k] || k === "tree_technician" ? label(k, v) : v == null || v === "" ? "—" : v)}</td>`;
  }
  function renderTable() {
    $("tblHead").innerHTML = COLS.map(([k, l]) => `<th data-k="${k}" ${S.sort.key === k ? `aria-sort="${S.sort.dir > 0 ? "ascending" : "descending"}"` : ""} scope="col">${t(l)}</th>`).join("");
    const rows = filtered();
    $("tblCount").textContent = t("rows", { a: rows.length, b: S.records.length });
    $("tblBody").innerHTML = rows.length ? rows.map((x) => `<tr data-gid="${esc(x.gid)}" class="${S.fresh.has(x.gid) ? "is-new" : ""}">${COLS.map((c) => cell(x, c)).join("")}</tr>`).join("")
      : `<tr><td colspan="${COLS.length}" class="empty">${t(S.records.length ? "no_match" : "no_subs")}</td></tr>`;
  }

  /* ---------- Painel de detalhe ---------- */
  function fmtField(x, k) {
    if (k === "_coords") return x.lat != null ? `${x.lat.toFixed(6)}, ${x.lon.toFixed(6)}` : "—";
    if (k === "_created") return fmtDateTime(x.created);
    if (k === "_creator") return x.creator || "—";
    const v = x.a[k];
    if (v == null || v === "") return "—";
    if (/date$/.test(k)) return fmtDate(v);
    if (FIELD_LIST[k] || S.domains[k] || k === "species" || k === "tree_technician") return label(k, v);
    if (typeof v === "number") return fmtNum(v, 2);
    return String(v);
  }
  function openTree(x) {
    S.openGid = x.gid;
    $("drawerEyebrow").innerHTML = `${esc(label("species", x.a.species))}${x.a.tree_tag ? ` · <span class="tag">${esc(x.a.tree_tag)}</span>` : ""}`;
    $("drawerTitle").textContent = `Tree ${x.a.tree_id || `#${x.oid}`}`;
    const list = photosOf(x);
    const timeline = `<section class="dsec"><h3>${t("phase_photos")}</h3>
      ${!DEMO && S.meta && !S.meta.hasAttachments ? `<p class="empty">${t("no_attach")}</p>` : `<div class="timeline">${PHASES.map((p, i) => { const ph = photoOfPhase(x, p); return `
        <figure class="tl-item"><span class="tl-step">${i + 1}</span>${ph
          ? `<button type="button" class="ph-thumb" data-phase="${esc(p)}"><img src="${esc(photoSrc(ph))}" alt="${esc(phaseLabel(p))}" loading="lazy"></button>`
          : `<div class="ph-missing">${t("missing_photo")}</div>`}<figcaption>${esc(phaseLabel(p))}${noteOf(x, p) ? `<span class="tl-note">${esc(noteOf(x, p))}</span>` : ""}</figcaption></figure>`; }).join("")}</div>
        ${list.filter((ph) => phaseIdx(ph.phase) === 99).length ? `<div class="photos">${list.filter((ph) => phaseIdx(ph.phase) === 99).map((ph) => `<button type="button" class="ph-thumb" data-name="${esc(ph.name)}"><img src="${esc(photoSrc(ph))}" alt="${esc(ph.name)}" loading="lazy"></button>`).join("")}</div>` : ""}`}
      </section>`;
    // só campos que existem no serviço; os campos novos aparecem automaticamente em "Other fields"
    const exists = (k) => k.startsWith("_") || !S.meta || !S.meta.fields || S.meta.fields.some((f) => f.name.toLowerCase() === k) || x.a[k] != null;
    const shown = new Set(SECTIONS.flatMap(([, f]) => f));
    const SYS = /^(objectid|globalid|start|end|device_id|pc_latitude|pc_longitude|creationdate|creator|editdate|editor|shape.*)$/;
    const extra = (S.meta && S.meta.fields ? S.meta.fields.map((f) => f.name.toLowerCase()) : Object.keys(x.a)).filter((k) => !shown.has(k) && !SYS.test(k));
    const secs = SECTIONS.map(([title, fields]) => [t(title), fields.filter(exists)]).concat(extra.length ? [[t("sec_other"), extra]] : []);
    $("drawerBody").innerHTML = timeline + secs.map(([title, fields]) => `<section class="dsec"><h3>${esc(title)}</h3><dl class="dl">${fields.map((k) => `<dt>${esc(fieldLabel(k))}</dt><dd>${esc(fmtField(x, k))}</dd>`).join("")}</dl></section>`).join("")
      + (x.lat != null ? `<section class="dsec"><a class="btn" href="https://www.google.com/maps?q=${x.lat},${x.lon}" target="_blank" rel="noopener">${t("gmaps")}</a></section>` : "");
    $("drawer").classList.add("open"); $("drawer").setAttribute("aria-hidden", "false"); $("drawerBg").hidden = false;
    const items = list.map((ph) => ({ ph, x }));
    $("drawerBody").querySelectorAll(".ph-thumb").forEach((b) => b.addEventListener("click", () => {
      const i = items.findIndex((it) => (b.dataset.phase ? it.ph.phase === b.dataset.phase : it.ph.name === b.dataset.name));
      openLightbox(items, Math.max(0, i));
    }));
  }
  function closeDrawer() { S.openGid = null; $("drawer").classList.remove("open"); $("drawer").setAttribute("aria-hidden", "true"); $("drawerBg").hidden = true; }

  /* ---------- Galeria + visualizador ---------- */
  function renderGallery() {
    const tabs = ["", ...PHASES];
    const counts = Object.fromEntries(tabs.map((p) => [p, allPhotos(p).length]));
    $("galleryTabs").innerHTML = tabs.map((p) => `<button type="button" class="seg-btn${S.galleryPhase === p ? " active" : ""}" data-phase="${esc(p)}">${esc(p ? phaseLabel(p) : t("all_phases"))} <span class="cnt">${counts[p]}</span></button>`).join("");
    $("galleryTabs").querySelectorAll("[data-phase]").forEach((b) => b.addEventListener("click", () => { S.galleryPhase = b.dataset.phase; S.galleryAll = false; renderGallery(); }));
    const items = allPhotos(S.galleryPhase);
    const max = S.galleryAll ? items.length : 12;
    $("galleryCount").textContent = t(counts[""] === 1 ? "photos_1" : "photos_n", { n: counts[""] });
    $("gallery").innerHTML = items.length ? items.slice(0, max).map(({ ph, x }, i) => `
      <figure class="g-item${S.fresh.has(x.gid) ? " is-new" : ""}">
        <button type="button" class="g-open" data-i="${i}" aria-label="Tree ${esc(x.a.tree_id || "")} ${esc(phaseLabel(ph.phase))}"><img src="${esc(photoSrc(ph))}" alt="${esc(ph.name)}" loading="lazy"><span class="g-phase">${phaseIdx(ph.phase) < 99 ? phaseIdx(ph.phase) + 1 : "·"}</span></button>
        <figcaption><b>Tree ${esc(x.a.tree_id || "—")}</b> <i>${esc(label("species", x.a.species))}</i><span>${esc(phaseLabel(ph.phase))} · ${fmtDate(x.created)}</span></figcaption>
      </figure>`).join("") : `<p class="empty">${t("no_photos_all")}</p>`;
    $("gallery").querySelectorAll(".g-open").forEach((b) => b.addEventListener("click", () => openLightbox(items, +b.dataset.i)));
    const more = $("galleryMore");
    more.hidden = items.length <= 12;
    more.textContent = S.galleryAll ? t("show_less") : t("show_all", { n: items.length });
  }
  function openLightbox(list, i) { S.lb = { list, i }; $("lightbox").hidden = false; document.body.classList.add("lb-open"); showLb(); $("lbClose").focus(); }
  function showLb() {
    const { list, i } = S.lb; const it = list[i]; if (!it) return;
    const src = photoSrc(it.ph);
    $("lbImg").src = src; $("lbImg").alt = it.ph.name;
    $("lbCap").innerHTML = `<b>Tree ${esc(it.x.a.tree_id || "—")}</b> · <i>${esc(label("species", it.x.a.species))}</i>${it.x.a.tree_tag ? ` · <span class="tag">${esc(it.x.a.tree_tag)}</span>` : ""}<br><span class="muted">${esc(phaseLabel(it.ph.phase))} · ${esc(it.ph.name)} · ${fmtDateTime(it.x.created)}</span>${noteOf(it.x, it.ph.phase) ? `<br><span class="lb-note">${esc(noteOf(it.x, it.ph.phase))}</span>` : ""}`;
    $("lbIdx").textContent = `${i + 1} / ${list.length}`;
    $("lbOrig").href = src;
    $("lbPrev").disabled = list.length < 2; $("lbNext").disabled = list.length < 2;
  }
  function stepLb(d) { const n = S.lb.list.length; if (n < 2) return; S.lb.i = (S.lb.i + d + n) % n; showLb(); }
  function closeLb() { $("lightbox").hidden = true; document.body.classList.remove("lb-open"); $("lbImg").removeAttribute("src"); }

  /* ---------- UI auxiliar ---------- */
  function toast(msg, ms) {
    const d = document.createElement("div"); d.className = "toast"; d.textContent = msg;
    $("toasts").appendChild(d); setTimeout(() => d.remove(), ms || 6000);
    return d;
  }
  function setLive(state, key) {
    const el = $("live"); el.classList.toggle("on", state === "on"); el.classList.toggle("err", state === "err");
    S.liveState = state; S.liveKey = key || null;
    updateLiveText();
  }
  function updateLiveText() {
    if (S.liveState === "on" && S.lastSync) {
      const next = Math.max(0, Math.round((S.nextAt - Date.now()) / 1000));
      $("liveText").textContent = document.hidden ? t("live_hidden", { ago: ago(S.lastSync) }) : t(DEMO ? "demo_live" : "live", { ago: ago(S.lastSync), n: next });
    } else if (S.liveKey) $("liveText").textContent = t(S.liveKey);
    const rs = sortedRecords();
    document.querySelectorAll(".feed .when").forEach((e, i) => { if (rs[i]) e.textContent = ago(rs[i].created); });
  }
  function syncAuthBtn() {
    const ab = $("authBtn");
    if (S.authNeeded || CFG.clientId) {
      ab.hidden = false;
      ab.textContent = Auth.data ? t("signout", { u: Auth.data.username || "" }) : t(S.authNeeded ? "signin_arcgis" : "signin");
      ab.classList.toggle("primary", !!S.authNeeded && !Auth.data);
    }
  }

  /* ================= Ciclo de atualização ================= */
  async function cycle(force) {
    clearTimeout(S.timer);
    try {
      if (DEMO) Demo.step(); else await loadLive(force);
      S.nextAt = Date.now() + CFG.pollSeconds * 1000;
      setLive("on");
    } catch (e) {
      S.nextAt = Date.now() + CFG.pollSeconds * 1000;
      handleError(e);
    }
    S.timer = setTimeout(() => { if (!document.hidden) cycle(false); else S.pendingWhileHidden = true; }, CFG.pollSeconds * 1000);
  }
  function handleError(e) {
    console.error(e);
    if ([498, 499, 403, 401, "GWM_0003"].includes(e.code)) {
      if (Auth.data) Auth.clear();
      S.authNeeded = true; syncAuthBtn();
      setLive("err", "need_session");
      toast(t("err_private"), 10000);
    } else {
      setLive("err", "offline");
      toast(t("err_service", { e: e.message, n: CFG.pollSeconds }));
    }
  }

  /* ================= Modo de demonstração ================= */
  function demoPhoto(seed, id, phase) {
    const r = (k) => ((Math.sin(seed * 9.73 + k * 3.1) + 1) / 2);
    const pi = phaseIdx(phase);
    const sky = ["#9DB8C9", "#C9B48A", "#A9C3B0", "#B7C4CF"][pi % 4], ground = ["#7A6A45", "#8C7B4F", "#6F7448", "#5E6B3E"][pi % 4];
    const trunkX = 140 + r(1) * 120, crownR = 50 + r(2) * 30, crownY = 120 + r(3) * 25;
    const extra = pi === 1 ? `<ellipse cx="${trunkX}" cy="214" rx="46" ry="12" fill="#3B2C1C"/>` : pi === 2 ? `<rect x="${trunkX - 40}" y="190" width="80" height="40" fill="#9B7A4C" stroke="#5A4630"/>` : pi === 3 ? `<rect x="0" y="230" width="400" height="8" fill="#4A5A36"/><rect x="${trunkX + 70}" y="150" width="6" height="80" fill="#888"/>` : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="${sky}"/><rect y="200" width="400" height="100" fill="${ground}"/><rect x="${trunkX - 7}" y="${crownY}" width="14" height="${210 - crownY}" fill="#4A3826"/><ellipse cx="${trunkX}" cy="${crownY}" rx="${crownR * 1.3}" ry="${crownR}" fill="#3F6B35"/><ellipse cx="${trunkX + 20}" cy="${crownY - 15}" rx="${crownR * .8}" ry="${crownR * .6}" fill="#55854A"/>${extra}<rect x="0" y="262" width="400" height="38" fill="rgba(0,0,0,.45)"/><text x="14" y="286" font-family="sans-serif" font-size="15" fill="#F3EBD3">Tree ${id} · ${phase} · sample image</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  const Demo = {
    rnd: (function (seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; })(42),
    pick(a) { return a[Math.floor(this.rnd() * a.length)]; },
    n: 0, recs: [], started: false, pool: [], center: [-25.93, 32.59],
    mk(ts) {
      if (!this.pool.length) this.pool = (PLANNED.length ? PLANNED : Array.from({ length: 150 }, (_, i) => String(i + 1))).slice().sort(() => this.rnd() - 0.5);
      const id = this.pool.pop();
      this.n++;
      const age = (Date.now() - ts) / 864e5;
      const prep = age > 2 ? this.pick(["yes", "yes", "yes", "pending"]) : this.pick(["yes", "pending", "no"]);
      const ready = prep === "yes" ? this.pick(["ready", "ready", "conditionally_ready", "not_ready"]) : this.pick(["not_ready", "hold"]);
      const boxed = ready === "ready" && age > 3;
      const status = boxed ? this.pick(["alive", "alive", "alive", "alive", "stressed", "stressed", "damaged", "dead"]) : this.pick(["alive", "alive", "stressed", "not_assessed"]);
      const sp = this.pick(SPECIES);
      const dbh = Math.round((8 + this.rnd() * 40) * 10) / 10;
      const a = {
        objectid: this.n, globalid: `d${this.n}`, source_site: "Node A", survey_intention: "Transplantation", survey_type: "Tree translocation Survey4_1", nursery: "BOH",
        tree_id: id, tree_technician: this.pick(["Anelarda Vicente", "Felix Zacarias"]), tree_tag: String(1000 + Number(id)), plot_number: `P${1 + Math.floor(this.rnd() * 6)}`,
        species: sp, tree_iucn: /Terminalia|Ziziphus/.test(sp) ? "LC" : "NE",
        dbh_cm: dbh, tree_height: Math.round((2 + dbh / 6 + this.rnd() * 3) * 10) / 10, tree_crown: Math.round((1.5 + this.rnd() * 5) * 10) / 10,
        rootball_diam: Math.round(dbh * 9 + this.rnd() * 30), rootball_height: Math.round((0.4 + this.rnd() * 0.6) * 100) / 100,
        treatment: ["Crown_Pruning", "Root_Pruning", "Root_ball_Preparation", "Burlap_wrapping"].filter(() => this.rnd() > 0.4).join(",") || "Root_Pruning",
        stabilisation: prep === "yes" ? "stabilised" : "not_stabilised", prep_date: ts, prep_completed: prep, readiness: ready,
        ready_date: ready === "ready" ? ts + 2 * 864e5 : null, boxer_date: boxed ? ts + 3 * 864e5 : null,
        arrival_condition: boxed ? this.pick(["good", "good", "fair", "poor"]) : null, post_stabilisation: boxed ? this.pick(["stabilised", "re_stabilised"]) : null,
        observations: this.pick(["", "", "Extra watering recommended.", "Check stake on next visit.", "Some wilting after transfer."]), overall_status: status,
        tree_crowm_p: null, tree_crowm_t: null, tree_crowm_n: null,
        CreationDate: ts, Creator: "demo"
      };
      if (prep === "yes") a.tree_crowm_p = Math.round(a.tree_crown * (0.7 + this.rnd() * 0.15) * 100) / 100;
      if (boxed) { a.tree_crowm_t = Math.round(a.tree_crowm_p * (0.9 + this.rnd() * 0.1) * 100) / 100; a.tree_crowm_n = Math.round(a.tree_crowm_t * (0.95 + this.rnd() * 0.15) * 100) / 100; }
      const x = { raw: a, a: lc(a), oid: this.n, gid: `d${this.n}`, created: ts, creator: "demo" };
      x.lat = this.center[0] + (this.rnd() - 0.5) * 0.02; x.lon = this.center[1] + (this.rnd() - 0.5) * 0.02; x.geom = { x: x.lon, y: x.lat };
      const nPh = boxed ? 4 : prep === "yes" ? 3 : 2;
      S.photos.set(this.n, PHASES.slice(0, nPh).map((p, k) => ({ id: this.n * 10 + k, name: `${p}-demo-${id}.jpg`, keywords: p, type: "image/svg+xml", phase: p, url: demoPhoto(this.n * 7 + k, id, p) })));
      this.recs.push(x); return x;
    },
    seed() { for (let d = 20; d >= 0; d--) { const k = d === 0 ? 2 : Math.floor(this.rnd() * 6); for (let i = 0; i < k; i++) this.mk(Date.now() - d * 864e5 - this.rnd() * 8 * 3600e3); } },
    step() {
      if (!this.started) { this.seed(); this.started = true; }
      else if (this.rnd() > 0.35) { const k = 1 + Math.floor(this.rnd() * 2); for (let j = 0; j < k; j++) this.mk(Date.now() - this.rnd() * 30e3); }
      ingest(this.recs.map((x) => Object.assign({}, x)));
    }
  };

  /* ================= API para exports.js ================= */
  window.TTM = {
    S, CFG, PHASES, t, label, noteOf, fieldLabel, fmtNum, fmtDate, fmtDateTime, stats, sortRows, val, cssVar, treatments,
    lang: () => LANG, isDemo: () => DEMO, toast, api, photosOf, photoOfPhase, photoSrc, allPhotos, phaseLabel, phaseIdx,
    STATUS_COLOR, READY_COLOR, FIELD_LIST
  };

  /* ================= Arranque ================= */
  async function start() {
    Auth.load();
    applyStatic();
    initMap();
    $("refreshBtn").addEventListener("click", () => cycle(true));
    $("langEn").addEventListener("click", () => setLang("en"));
    $("langPt").addEventListener("click", () => setLang("pt"));
    $("pdfBtn").addEventListener("click", () => window.TTMExports.pdf($("pdfBtn")));
    $("xlsxBtn").addEventListener("click", () => window.TTMExports.xlsx($("xlsxBtn")));
    $("authBtn").addEventListener("click", () => { if (Auth.data) { Auth.clear(); location.reload(); } else Auth.login(); });
    ["fSearch", "fSpecies", "fTech", "fStatus", "fReady"].forEach((id) => $(id).addEventListener("input", renderTable));
    $("tblHead").addEventListener("click", (e) => {
      const th = e.target.closest("th"); if (!th) return;
      const k = th.dataset.k; S.sort = { key: k, dir: S.sort.key === k ? -S.sort.dir : (k === "_created" ? -1 : 1) }; renderTable();
    });
    $("tblBody").addEventListener("click", (e) => {
      const pb = e.target.closest("[data-photos]");
      if (pb) { e.stopPropagation(); const x = S.records.find((y) => y.gid === pb.dataset.photos); if (x && photosOf(x).length) openLightbox(photosOf(x).map((ph) => ({ ph, x })), 0); return; }
      const tr = e.target.closest("tr[data-gid]"); if (!tr) return;
      const x = S.records.find((y) => y.gid === tr.dataset.gid); if (x) openTree(x);
    });
    $("feed").addEventListener("click", (e) => {
      const cellBtn = e.target.closest(".strip-cell[data-phase]");
      const li = e.target.closest("li[data-gid]"); if (!li) return;
      const x = S.records.find((y) => y.gid === li.dataset.gid); if (!x) return;
      if (cellBtn) { const items = photosOf(x).map((ph) => ({ ph, x })); openLightbox(items, Math.max(0, items.findIndex((it) => it.ph.phase === cellBtn.dataset.phase))); return; }
      openTree(x);
    });
    $("feed").addEventListener("keydown", (e) => { if (e.key !== "Enter") return; const li = e.target.closest("li[data-gid]"); const x = li && S.records.find((y) => y.gid === li.dataset.gid); if (x) openTree(x); });
    $("drawerClose").addEventListener("click", closeDrawer);
    $("drawerBg").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => {
      if (!$("lightbox").hidden) { if (e.key === "Escape") closeLb(); else if (e.key === "ArrowRight") stepLb(1); else if (e.key === "ArrowLeft") stepLb(-1); return; }
      if (e.key === "Escape") closeDrawer();
    });
    $("lbClose").addEventListener("click", closeLb);
    $("lbPrev").addEventListener("click", () => stepLb(-1));
    $("lbNext").addEventListener("click", () => stepLb(1));
    $("lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox" || e.target.classList.contains("lb-stage")) closeLb(); });
    $("lbRecord").addEventListener("click", () => { const x = S.lb.list[S.lb.i] && S.lb.list[S.lb.i].x; closeLb(); if (x) openTree(x); });
    $("galleryMore").addEventListener("click", () => { S.galleryAll = !S.galleryAll; renderGallery(); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && S.pendingWhileHidden) { S.pendingWhileHidden = false; cycle(false); } });
    setInterval(updateLiveText, 1000);
    let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => renderDaily(), 200); });

    if (DEMO) { CFG.pollSeconds = Math.min(CFG.pollSeconds, 20); renderSource(); cycle(true); return; }
    try { await Auth.handleRedirect(); } catch (e) { toast(t("err_login", { e: e.message })); }
    syncAuthBtn();
    setLive("", "connecting_svc");
    connect();
  }
  async function connect() {
    try { await discover(); cycle(true); }
    catch (e) {
      handleError(e);
      if (e.code !== "cfg" && ![498, 499, 403, 401, "GWM_0003"].includes(e.code)) S.timer = setTimeout(connect, CFG.pollSeconds * 2000);
    }
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
})();
