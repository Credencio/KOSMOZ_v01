/* Exportações: Excel (.xlsx com a tabela do Feature Service + lista de fotografias) e relatório PDF. */
(function () {
  "use strict";
  const today = () => new Date().toISOString().slice(0, 10);

  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function busy(btn, fn) {
    if (btn.disabled) return;
    btn.disabled = true; btn.setAttribute("aria-busy", "true");
    try { await fn(); } finally { btn.disabled = false; btn.removeAttribute("aria-busy"); }
  }

  /* ======================= EXCEL ======================= */
  const xesc = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const colName = (i) => { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const excelDate = (ms) => ms / 864e5 + 25569 - new Date(ms).getTimezoneOffset() / 1440;

  function fieldsFor(meta, records) {
    if (meta && meta.fields) return meta.fields.map((f) => ({ name: f.name, date: f.type === "esriFieldTypeDate" }));
    const names = []; records.forEach((r) => Object.keys(r.raw).forEach((k) => { if (!names.includes(k)) names.push(k); }));
    return names.map((n) => ({ name: n, date: /date$/i.test(n) || n === "start" || n === "end" }));
  }
  function sheetXml(fields, records, noGeo) {
    const cols = noGeo ? [...fields] : [...fields, { name: "x (longitude)", geo: "x" }, { name: "y (latitude)", geo: "y" }];
    const width = cols.map((c) => Math.min(45, Math.max(10, c.name.length + 2)));
    const rows = [`<row r="1">${cols.map((c, i) => `<c r="${colName(i)}1" t="inlineStr" s="1"><is><t>${xesc(c.name)}</t></is></c>`).join("")}</row>`];
    records.forEach((r, ri) => {
      const rn = ri + 2;
      const cells = cols.map((c, i) => {
        const ref = `${colName(i)}${rn}`;
        const v = c.geo ? (r.geom ? r.geom[c.geo] : null) : r.raw[c.name];
        if (v == null || v === "") return "";
        if (c.date && typeof v === "number") return `<c r="${ref}" s="2"><v>${excelDate(v)}</v></c>`;
        if (typeof v === "number" && isFinite(v)) return `<c r="${ref}"><v>${v}</v></c>`;
        const s = String(v); width[i] = Math.min(60, Math.max(width[i], s.length + 2));
        return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xesc(s)}</t></is></c>`;
      }).join("");
      rows.push(`<row r="${rn}">${cells}</row>`);
    });
    const last = `${colName(cols.length - 1)}${Math.max(1, records.length + 1)}`;
    return {
      ref: `A1:${last}`,
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${width.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>
<sheetData>${rows.join("")}</sheetData>
<autoFilter ref="A1:${last}"/>
</worksheet>`
    };
  }
  function buildXlsx(sheets) {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n")}
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`);
    zip.file("docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Survey 4_1 - Tree Translocation data</dc:title><dc:creator>Tree Translocation Monitor</dc:creator>
<dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created>
</cp:coreProperties>`);
    zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${sheets.map((s, i) => `<sheet name="${xesc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>
<definedNames>${sheets.map((s, i) => `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xesc(s.name)}'!$A$1:${s.ref.split(":")[1].replace(/([A-Z]+)(\d+)/, "$$$1$$$2")}</definedName>`).join("")}</definedNames>
</workbook>`);
    zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("\n")}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
    zip.file("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFF3EBD3"/><name val="Calibri"/><family val="2"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F5233"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`);
    sheets.forEach((s, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, s.xml));
    return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", compression: "DEFLATE" });
  }

  async function xlsx(btn) {
    const T = window.TTM, { S, t, toast } = T;
    if (typeof JSZip === "undefined") { toast(t("lib_missing")); return; }
    await busy(btn, async () => {
      const note = toast(t("xlsx_working"), 4000);
      try {
        const m = S.meta;
        const main = Object.assign({ name: ((m && m.name) || "survey_4_1_tree_transplanting").slice(0, 31) }, sheetXml(fieldsFor(m, S.records), S.records));
        const att = [];
        S.records.forEach((x) => T.photosOf(x).forEach((ph) => att.push({ raw: {
          objectid: x.oid, globalid: x.raw.globalid || x.raw.GlobalID || x.gid, tree_id: x.a.tree_id || "", phase: ph.phase, phase_label: T.phaseLabel(ph.phase),
          attachment_id: ph.id, name: ph.name, content_type: ph.type || "", size_bytes: ph.size == null ? "" : ph.size,
          url: ph.url.startsWith("data:") ? "(demo)" : ph.url
        }, geom: null })));
        const attFields = ["objectid", "globalid", "tree_id", "phase", "phase_label", "attachment_id", "name", "content_type", "size_bytes", "url"].map((n) => ({ name: n }));
        const photos = Object.assign({ name: "photos" }, sheetXml(attFields, att, true));
        download(await buildXlsx([main, photos]), `survey_4_1_tree_translocation_data_${today()}.xlsx`);
        note.remove(); toast(t("xlsx_done", { a: S.records.length, b: att.length }));
      } catch (e) { console.error(e); note.remove(); toast(t("xlsx_err", { e: e.message })); }
    });
  }

  /* ======================= PDF ======================= */
  const WIN = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ".split(""));
  const clean = (s) => String(s == null ? "" : s).replace(/→/g, "->").replace(/[   ]/g, " ")
    .split("").map((c) => (c.charCodeAt(0) < 256 && c.charCodeAt(0) >= 32) || WIN.has(c) ? c : (c === "\n" ? " " : "?")).join("");
  const hex = (h) => { h = h.replace("#", ""); return PDFLib.rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255); };

  const C = {
    ink: "#1B1D18", muted: "#6A6A5C", line: "#D9D3C0", cream: "#F4EDDA", creamDark: "#E8DEC2",
    green: "#2F5233", leaf: "#5E9A47", band: "#141A12",
    status: { alive: "#3E8E3A", stressed: "#C9A227", damaged: "#D27A2C", dead: "#B23A2E", not_assessed: "#9A9A8E", _none: "#9A9A8E" },
    ready: { ready: "#3E8E3A", conditionally_ready: "#C9A227", not_ready: "#D27A2C", hold: "#B23A2E", _none: "#9A9A8E" }
  };

  class Report {
    constructor(pdf, f) { this.pdf = pdf; this.f = f; this.pages = []; this.M = 40; }
    add(landscape) {
      const size = landscape ? [841.89, 595.28] : [595.28, 841.89];
      this.page = this.pdf.addPage(size); this.W = size[0]; this.H = size[1];
      this.y = this.H - this.M - 18; this.pages.push(this.page); return this.page;
    }
    ensure(h, landscape) { if (this.y - h < this.M + 20) { this.add(landscape); return true; } return false; }
    width(s, size, font) { return (font || this.f.reg).widthOfTextAtSize(clean(s), size); }
    fit(s, w, size, font) {
      s = clean(s); font = font || this.f.reg;
      if (font.widthOfTextAtSize(s, size) <= w) return s;
      while (s.length > 1 && font.widthOfTextAtSize(s + "…", size) > w) s = s.slice(0, -1);
      return s + "…";
    }
    wrap(s, w, size, font) {
      const words = clean(s).split(/\s+/); const lines = []; let cur = "";
      words.forEach((wd) => { const next = cur ? `${cur} ${wd}` : wd; if (this.width(next, size, font) > w && cur) { lines.push(cur); cur = wd; } else cur = next; });
      if (cur) lines.push(cur); return lines;
    }
    text(s, x, y, o = {}) { this.page.drawText(clean(s), { x, y, size: o.size || 9, font: o.font || this.f.reg, color: hex(o.color || C.ink) }); }
    rect(x, y, w, h, color, o = {}) { this.page.drawRectangle(Object.assign({ x, y, width: w, height: h, color: color ? hex(color) : undefined }, o.border ? { borderColor: hex(o.border), borderWidth: o.bw || 0.6 } : {})); }
    line(x1, y1, x2, y2, color, th) { this.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: th || 0.5, color: hex(color || C.line) }); }
    h2(s, landscape) {
      this.ensure(40, landscape);
      this.y -= 8;
      this.rect(this.M, this.y - 2, 3, 13, C.leaf);
      this.text(s, this.M + 9, this.y, { size: 12.5, font: this.f.bold, color: C.green });
      this.y -= 20;
    }
  }

  function hbarsPdf(R, x, y, w, title, entries, colorOf, italic) {
    const { fmtNum, t } = window.TTM;
    R.text(title, x, y, { size: 10, font: R.f.bold, color: C.green });
    y -= 14;
    if (!entries.length) { R.text(t("no_data"), x, y, { color: C.muted }); return y - 14; }
    const max = Math.max(1, ...entries.map((e) => e.n));
    entries.forEach((e) => {
      R.text(R.fit(e.label, w - 34, 8.5, italic ? R.f.it : R.f.reg), x, y, { size: 8.5, font: italic ? R.f.it : R.f.reg });
      const num = fmtNum(e.n); R.text(num, x + w - R.width(num, 8.5), y, { size: 8.5, color: C.muted });
      R.rect(x, y - 7, w, 3.5, C.cream);
      R.rect(x, y - 7, Math.max(1.5, (e.n / max) * w), 3.5, colorOf(e));
      y -= 19;
    });
    return y;
  }

  const R_EARTH = 6378137;
  const merc = (lon, lat) => [R_EARTH * lon * Math.PI / 180, R_EARTH * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2))];
  async function mapBlock(R, w, h) {
    const { S, t, label } = window.TTM;
    const pts = S.latest.filter((x) => x.lat != null).map((x) => ({ lat: x.lat, lon: x.lon, st: x.a.overall_status || "_none" }));
    if (!pts.length) { R.text(t("r_none"), R.M, R.y, { color: C.muted }); R.y -= 16; return; }
    const xy = pts.map((p) => merc(p.lon, p.lat));
    let x0 = Math.min(...xy.map((p) => p[0])), x1 = Math.max(...xy.map((p) => p[0]));
    let y0 = Math.min(...xy.map((p) => p[1])), y1 = Math.max(...xy.map((p) => p[1]));
    let dx = Math.max(x1 - x0, 300), dy = Math.max(y1 - y0, 300);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    dx *= 1.25; dy *= 1.25;
    if (dx / dy < w / h) dx = dy * (w / h); else dy = dx * (h / w);
    x0 = cx - dx / 2; x1 = cx + dx / 2; y0 = cy - dy / 2; y1 = cy + dy / 2;
    const top = R.y, bottom = R.y - h;
    let ok = false;
    try {
      const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${x0},${y0},${x1},${y1}&bboxSR=3857&imageSR=3857&size=${Math.round(w * 2)},${Math.round(h * 2)}&format=jpg&f=image`;
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 12000);
      const r = await fetch(url, { signal: ctl.signal }); clearTimeout(to);
      if (r.ok && /image/.test(r.headers.get("content-type") || "")) {
        const img = await R.pdf.embedJpg(await r.arrayBuffer());
        R.page.drawImage(img, { x: R.M, y: bottom, width: w, height: h }); ok = true;
      }
    } catch (e) { ok = false; }
    if (!ok) {
      R.rect(R.M, bottom, w, h, C.cream);
      for (let i = 1; i < 6; i++) { R.line(R.M + (w * i) / 6, bottom, R.M + (w * i) / 6, top, C.creamDark); R.line(R.M, bottom + (h * i) / 6, R.M + w, bottom + (h * i) / 6, C.creamDark); }
    }
    pts.forEach((p, i) => {
      const X = R.M + ((xy[i][0] - x0) / (x1 - x0)) * w, Y = bottom + ((xy[i][1] - y0) / (y1 - y0)) * h;
      R.page.drawCircle({ x: X, y: Y, size: 3.6, color: hex(C.status[p.st] || C.status._none), borderColor: hex("#FFFFFF"), borderWidth: 0.9 });
    });
    R.rect(R.M, bottom, w, h, null, { border: C.line });
    R.y = bottom - 12;
    R.text(ok ? `${t("r_map_note")}  Imagery: Esri, Maxar, Earthstar Geographics.` : `${t("r_map_note")} ${t("r_map_noimg")}`, R.M, R.y, { size: 7.5, color: C.muted });
    R.y -= 10;
    let lx = R.M;
    ["alive", "stressed", "damaged", "dead", "not_assessed"].forEach((k) => {
      R.page.drawCircle({ x: lx + 3, y: R.y - 2.5, size: 3, color: hex(C.status[k]) });
      const l = label("overall_status", k); R.text(l, lx + 9, R.y - 5, { size: 7.5 }); lx += R.width(l, 7.5) + 22;
    });
    R.y -= 16;
  }

  function table(R, cols, rows, landscape) {
    const head = () => {
      R.rect(R.M, R.y - 5, R.W - 2 * R.M, 16, C.green);
      let x = R.M + 4;
      cols.forEach((c) => { const s = R.fit(c.label, c.w - 6, 7.5, R.f.bold); R.text(s, c.align === "right" ? x + c.w - 8 - R.width(s, 7.5, R.f.bold) : x, R.y, { size: 7.5, font: R.f.bold, color: C.cream }); x += c.w; });
      R.y -= 16;
    };
    head();
    if (!rows.length) { R.text(window.TTM.t("r_none"), R.M + 4, R.y - 2, { color: C.muted }); R.y -= 16; return; }
    rows.forEach((r, i) => {
      if (R.ensure(16, landscape)) head();
      if (i % 2) R.rect(R.M, R.y - 5, R.W - 2 * R.M, 15, "#F8F4E8");
      let x = R.M + 4;
      cols.forEach((c, ci) => {
        const font = c.italic ? R.f.it : ci === 0 ? R.f.bold : R.f.reg;
        const dot = c.color && r[ci] && r[ci] !== "—";
        const s = R.fit(r[ci] == null ? "—" : r[ci], c.w - 6 - (dot ? 8 : 0), 7.5, font);
        if (dot) R.page.drawCircle({ x: x + 2.5, y: R.y + 2.5, size: 2.4, color: hex(c.color(r, ci)) });
        R.text(s, c.align === "right" ? x + c.w - 8 - R.width(s, 7.5, font) : x + (dot ? 8 : 0), R.y, { size: 7.5, font });
        x += c.w;
      });
      R.y -= 15;
    });
  }

  async function jpegBytes(src) {
    let url = src, revoke = null;
    if (!src.startsWith("data:")) {
      const r = await fetch(src); if (!r.ok) throw new Error(`HTTP ${r.status}`);
      url = revoke = URL.createObjectURL(await r.blob());
    }
    try {
      const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("image")); im.src = url; });
      const k = Math.min(1, 700 / Math.max(img.naturalWidth || 400, img.naturalHeight || 300));
      const cv = document.createElement("canvas"); cv.width = Math.round((img.naturalWidth || 400) * k); cv.height = Math.round((img.naturalHeight || 300) * k);
      const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
      const blob = await new Promise((res) => cv.toBlob(res, "image/jpeg", 0.78));
      return { bytes: await blob.arrayBuffer(), w: cv.width, h: cv.height };
    } finally { if (revoke) URL.revokeObjectURL(revoke); }
  }

  async function pdf(btn) {
    const T = window.TTM;
    const { S, t, label, fmtNum, fmtDate, fmtDateTime, toast } = T;
    if (typeof PDFLib === "undefined") { toast(t("lib_missing")); return; }
    await busy(btn, async () => {
      const note = toast(t("pdf_working"), 15000);
      try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const doc = await PDFDocument.create();
        doc.setTitle(t("r_title")); doc.setAuthor("Tree Translocation Monitor"); doc.setCreationDate(new Date());
        const f = { reg: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold), it: await doc.embedFont(StandardFonts.HelveticaOblique) };
        const R = new Report(doc, f);
        const st = T.stats();
        const W = 595.28 - 80;

        /* ---- Página 1: capa, resumo, cobertura, fluxo, mapa ---- */
        R.add(false);
        R.rect(0, R.H - 118, R.W, 118, C.band);
        R.rect(0, R.H - 121, R.W, 3, C.leaf);
        R.text(t("r_title"), R.M, R.H - 52, { size: 21, font: f.bold, color: C.cream });
        R.text(T.CFG.projectTitle || "Survey 4_1", R.M, R.H - 72, { size: 11, color: "#CFC6AC" });
        R.text(t("r_generated", { d: fmtDateTime(Date.now()) }), R.M, R.H - 96, { size: 8.5, color: "#A7A58F" });
        R.text(R.fit(`${t("r_source")}: ${T.isDemo() ? "Demo data" : (S.serviceName || "")}`, W, 8, f.reg), R.M, R.H - 108, { size: 8, color: "#A7A58F" });
        R.y = R.H - 150;

        R.h2(t("r_summary"));
        const bw = (W - 20) / 3, bh = 54;
        st.kpis.forEach((k, i) => {
          const col = i % 3, row = Math.floor(i / 3);
          const x = R.M + col * (bw + 10), y = R.y - row * (bh + 10) - bh + 12;
          R.rect(x, y, bw, bh, C.cream); R.rect(x, y, 3, bh, C.leaf);
          R.text(R.fit(k.label.toUpperCase(), bw - 20, 7, f.bold), x + 11, y + bh - 14, { size: 7, font: f.bold, color: C.muted });
          R.text(typeof k.value === "number" ? fmtNum(k.value) : k.value, x + 11, y + 17, { size: 20, font: f.bold, color: C.green });
          R.text(R.fit(k.sub, bw - 20, 7.5), x + 11, y + 6, { size: 7.5, color: C.muted });
        });
        R.y -= 2 * (bh + 10) + 6;

        R.h2(t("r_workflow"));
        const cov = st.coverage;
        if (cov.planned) {
          R.text(t("coverage"), R.M, R.y, { size: 9, font: f.bold });
          const bx = R.M + 190, bwid = W - 190 - 70;
          R.rect(bx, R.y - 1, bwid, 7, C.cream); R.rect(bx, R.y - 1, Math.max(1, (cov.done / cov.planned) * bwid), 7, C.green);
          const lab = `${cov.done} / ${cov.planned}`; R.text(lab, R.M + W - R.width(lab, 9, f.bold), R.y, { size: 9, font: f.bold, color: C.green });
          R.y -= 17;
        }
        st.pipeline.forEach((s) => {
          R.text(t("stage", { n: s.step }), R.M, R.y, { size: 7.5, color: C.muted });
          R.text(s.name, R.M + 50, R.y, { size: 9, font: f.bold });
          const bx = R.M + 190, bwid = W - 190 - 70;
          R.rect(bx, R.y - 1, bwid, 7, C.cream); R.rect(bx, R.y - 1, Math.max(1, (s.pct / 100) * bwid), 7, C.leaf);
          const lab = `${fmtNum(s.n)}  (${s.pct}%)`; R.text(lab, R.M + W - R.width(lab, 9, f.bold), R.y, { size: 9, font: f.bold, color: C.green });
          R.y -= 17;
        });
        if (cov.planned && cov.pending.length) {
          const lines = R.wrap(`${t("pending", { n: cov.pending.length })}: ${cov.pending.join(", ")}`, W, 7.5);
          lines.slice(0, 4).forEach((ln) => { R.text(ln, R.M, R.y, { size: 7.5, color: C.muted }); R.y -= 10; });
          if (lines.length > 4) { R.text("…", R.M, R.y, { size: 7.5, color: C.muted }); R.y -= 10; }
        }
        R.y -= 4;
        R.h2(t("r_map"));
        if (R.y - R.M - 60 < 150) { R.add(false); R.h2(t("r_map")); }
        await mapBlock(R, W, Math.min(240, R.y - R.M - 50));

        /* ---- Página 2: distribuições + diário ---- */
        R.add(false);
        R.h2(t("r_charts"));
        const cw = (W - 24) / 2;
        let yA = R.y;
        const y1 = hbarsPdf(R, R.M, yA, cw, t("ch_status"), st.status, (e) => C.status[e.key] || C.status._none);
        const y2 = hbarsPdf(R, R.M + cw + 24, yA, cw, t("ch_ready"), st.ready, (e) => C.ready[e.key] || C.ready._none);
        yA = Math.min(y1, y2) - 10;
        const y3 = hbarsPdf(R, R.M, yA, cw, t("ch_species"), st.species.slice(0, 16), () => C.leaf, true);
        const y4 = hbarsPdf(R, R.M + cw + 24, yA, cw, t("ch_treat"), st.treat, () => C.green);
        const y5 = hbarsPdf(R, R.M + cw + 24, y4 - 10, cw, t("ch_iucn"), st.iucn, () => C.leaf);
        const y6 = hbarsPdf(R, R.M + cw + 24, y5 - 10, cw, t("ch_tech"), st.tech, () => C.green);
        R.y = Math.min(y3, y6) - 10;

        R.ensure(180);
        R.h2(t("r_daily"));
        const chH = 110, chX = R.M + 22, chW = W - 22, base = R.y - chH;
        const max = Math.max(4, ...st.daily.map((d) => d.n)), step = Math.ceil(max / 4), topV = step * 4;
        for (let v = 0; v <= topV; v += step) { const yy = base + (v / topV) * chH; R.line(chX, yy, chX + chW, yy, C.creamDark); R.text(String(v), R.M, yy - 3, { size: 7, color: C.muted }); }
        const bwD = chW / st.daily.length;
        st.daily.forEach((d, i) => {
          if (d.n) R.rect(chX + i * bwD + bwD * 0.18, base, bwD * 0.64, (d.n / topV) * chH, i === st.daily.length - 1 ? C.leaf : C.green);
          if (i % 5 === 4 || i === st.daily.length - 1) { const l = new Date(d.t).toLocaleDateString(t("locale"), { day: "2-digit", month: "2-digit" }); R.text(l, chX + i * bwD + bwD / 2 - R.width(l, 7) / 2, base - 11, { size: 7, color: C.muted }); }
        });
        R.y = base - 26;

        /* ---- Registo de árvores (paisagem) ---- */
        R.add(true);
        R.h2(`${t("r_register")} (${S.records.length})`, true);
        const recs = T.sortRows([...S.records], { key: "tree_id", dir: 1 });
        const n1 = (v) => (v == null || v === "" ? "—" : fmtNum(v, 1));
        const rows = recs.map((x) => {
          const r = [x.a.tree_id || "—", x.a.tree_tag || "—", label("species", x.a.species), x.a.plot_number || "—", label("tree_technician", x.a.tree_technician),
            n1(x.a.dbh_cm), n1(x.a.tree_height), n1(x.a.rootball_diam), label("readiness", x.a.readiness), label("overall_status", x.a.overall_status),
            fmtDate(x.a.prep_date), fmtDate(x.a.boxer_date), `${T.photosOf(x).length}/${T.PHASES.length}`];
          r._ready = x.a.readiness; r._status = x.a.overall_status; return r;
        });
        table(R, [
          { label: t("c_tree_id"), w: 44 }, { label: t("c_tag"), w: 44 }, { label: t("c_species"), w: 104, italic: true }, { label: t("c_plot"), w: 40 },
          { label: t("c_tech"), w: 84 }, { label: t("c_dbh"), w: 44, align: "right" }, { label: t("c_height"), w: 48, align: "right" }, { label: t("c_rootball"), w: 54, align: "right" },
          { label: t("c_ready"), w: 98, color: (r) => C.ready[r._ready] || C.ready._none }, { label: t("c_status"), w: 70, color: (r) => C.status[r._status] || C.status._none },
          { label: t("c_prep"), w: 56 }, { label: t("c_boxer"), w: 60 }, { label: t("c_photos"), w: 15 + 0 }
        ].map((c, i, arr) => (i === arr.length - 1 ? Object.assign(c, { w: 761.89 - arr.slice(0, -1).reduce((s, x) => s + x.w, 0) }) : c)), rows, true);

        const obs = recs.filter((x) => x.a.observations && String(x.a.observations).trim());
        if (obs.length) {
          R.ensure(60, true); R.y -= 6; R.h2(`${t("r_obs")} (${obs.length})`, true);
          const ow = R.W - 2 * R.M - 230;
          obs.forEach((x, i) => {
            const lines = R.wrap(x.a.observations, ow, 8), hgt = 6 + lines.length * 11;
            R.ensure(hgt + 4, true);
            if (i % 2) R.rect(R.M, R.y - hgt + 9, R.W - 2 * R.M, hgt, "#F8F4E8");
            R.text(`Tree ${x.a.tree_id || "—"}`, R.M + 4, R.y, { size: 8, font: f.bold });
            R.text(R.fit(label("species", x.a.species), 100, 8, f.it), R.M + 64, R.y, { size: 8, font: f.it });
            R.text(fmtDate(x.created), R.M + 170, R.y, { size: 8, color: C.muted });
            lines.forEach((ln, k) => R.text(ln, R.M + 230, R.y - k * 11, { size: 8 }));
            R.y -= hgt;
          });
        }

        /* ---- Registo fotográfico por fase: uma linha por árvore, uma coluna por fase ---- */
        const withPh = recs.filter((x) => T.photosOf(x).length);
        const LIMIT = 60;
        if (withPh.length) {
          R.add(false);
          R.h2(`${t("r_photos")} (${withPh.length})`);
          if (withPh.length > LIMIT) { R.text(t("r_photos_cap", { n: LIMIT }), R.M, R.y, { size: 8, color: C.muted }); R.y -= 14; }
          const P = T.PHASES, gap = 8, cw2 = (W - gap * (P.length - 1)) / P.length, ih = cw2 * 0.75, rowH = ih + 40;
          const phaseHead = () => { P.forEach((p, i) => R.text(R.fit(`${i + 1}. ${T.phaseLabel(p)}`, cw2, 8, f.bold), R.M + i * (cw2 + gap), R.y, { size: 8, font: f.bold, color: C.green })); R.y -= 12; };
          phaseHead();
          let skipped = 0;
          for (const x of withPh.slice(0, LIMIT)) {
            if (R.ensure(rowH + 4)) phaseHead();
            R.text(R.fit(`Tree ${x.a.tree_id || "—"} · ${label("species", x.a.species)}${x.a.tree_tag ? ` · tag ${x.a.tree_tag}` : ""} · ${fmtDate(x.created)}`, W, 8.5, f.bold), R.M, R.y, { size: 8.5, font: f.bold });
            const top = R.y - 6;
            for (let i = 0; i < P.length; i++) {
              const cx = R.M + i * (cw2 + gap), ph = T.photoOfPhase(x, P[i]);
              R.rect(cx, top - ih, cw2, ih, "#EFE9D8");
              if (!ph) { const s = t("missing_photo"); R.text(s, cx + cw2 / 2 - R.width(s, 7.5) / 2, top - ih / 2 - 3, { size: 7.5, color: C.muted }); continue; }
              try {
                const jb = await jpegBytes(T.photoSrc(ph)); const img = await doc.embedJpg(jb.bytes);
                const k = Math.min(cw2 / jb.w, ih / jb.h), iw = jb.w * k, hh = jb.h * k;
                R.page.drawImage(img, { x: cx + (cw2 - iw) / 2, y: top - ih + (ih - hh) / 2, width: iw, height: hh });
              } catch (e) { skipped++; R.text("—", cx + cw2 / 2, top - ih / 2, { color: C.muted }); }
            }
            R.y = top - ih - 16;
          }
          if (skipped) { R.ensure(14); R.text(t("r_photos_skip", { n: skipped }), R.M, R.y, { size: 8, color: C.muted }); R.y -= 14; }
        }

        /* ---- Rodapé ---- */
        const total = R.pages.length;
        R.pages.forEach((pg, i) => {
          const { width } = pg.getSize();
          pg.drawLine({ start: { x: 40, y: 32 }, end: { x: width - 40, y: 32 }, thickness: 0.5, color: hex(C.line) });
          pg.drawText(clean(`${t("r_title")} · ${fmtDateTime(Date.now())}`), { x: 40, y: 20, size: 7.5, font: f.reg, color: hex(C.muted) });
          const pn = clean(t("r_page", { n: i + 1, t: total }));
          pg.drawText(pn, { x: width - 40 - f.reg.widthOfTextAtSize(pn, 7.5), y: 20, size: 7.5, font: f.reg, color: hex(C.muted) });
        });

        download(new Blob([await doc.save()], { type: "application/pdf" }), `tree_translocation_report_${today()}.pdf`);
        note.remove(); toast(t("pdf_done"));
      } catch (e) { console.error(e); note.remove(); toast(t("pdf_err", { e: e.message })); }
    });
  }

  window.TTMExports = { xlsx, pdf };
})();
