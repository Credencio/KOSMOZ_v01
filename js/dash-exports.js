/* Exportações dos dashboards genéricos: Excel (.xlsx) e relatório PDF. */
(function () {
  "use strict";
  const today = () => new Date().toISOString().slice(0, 10);
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  function download(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  async function busy(btn, fn) { if (btn.disabled) return; btn.disabled = true; try { await fn(); } finally { btn.disabled = false; } }

  /* ======================= EXCEL ======================= */
  const xesc = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const colName = (i) => { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const excelDate = (ms) => ms / 864e5 + 25569 - new Date(ms).getTimezoneOffset() / 1440;
  function sheetXml(cols, rows) {
    const width = cols.map((c) => Math.min(45, Math.max(10, c.name.length + 2)));
    const out = [`<row r="1">${cols.map((c, i) => `<c r="${colName(i)}1" t="inlineStr" s="1"><is><t>${xesc(c.name)}</t></is></c>`).join("")}</row>`];
    rows.forEach((r, ri) => {
      const rn = ri + 2;
      out.push(`<row r="${rn}">${cols.map((c, i) => {
        const v = c.get(r), ref = `${colName(i)}${rn}`; if (v == null || v === "") return "";
        if (c.date && typeof v === "number") return `<c r="${ref}" s="2"><v>${excelDate(v)}</v></c>`;
        if (typeof v === "number" && isFinite(v)) return `<c r="${ref}"><v>${v}</v></c>`;
        const s = String(v); width[i] = Math.min(60, Math.max(width[i], s.length + 2));
        return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xesc(s)}</t></is></c>`;
      }).join("")}</row>`);
    });
    const last = `${colName(cols.length - 1)}${Math.max(1, rows.length + 1)}`;
    return { ref: `A1:${last}`, xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${width.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${out.join("")}</sheetData><autoFilter ref="A1:${last}"/></worksheet>` };
  }
  function buildXlsx(sheets) {
    const z = new JSZip();
    z.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`);
    z.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
    z.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xesc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets><definedNames>${sheets.map((s, i) => `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xesc(s.name)}'!$A$1:${s.ref.split(":")[1].replace(/([A-Z]+)(\d+)/, "$$$1$$$2")}</definedName>`).join("")}</definedNames></workbook>`);
    z.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
    z.file("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFF3EBD3"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F5233"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>`);
    sheets.forEach((s, i) => z.file(`xl/worksheets/sheet${i + 1}.xml`, s.xml));
    return z.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", compression: "DEFLATE" });
  }
  async function xlsx(btn) {
    const D = window.DASH, { S, t } = D;
    if (typeof JSZip === "undefined") { D.toast(t("lib_missing")); return; }
    await busy(btn, async () => {
      const note = D.toast(t("xlsx_working"), 4000);
      try {
        const names = S.meta && S.meta.fields ? S.meta.fields.map((f) => ({ name: f.name, date: f.type === "esriFieldTypeDate" }))
          : [...new Set(S.recs.flatMap((x) => Object.keys(x.raw)))].map((n) => ({ name: n, date: /date$/i.test(n) }));
        const cols = names.map((n) => ({ name: n.name, date: n.date, get: (x) => x.raw[n.name] })).concat([{ name: "x (longitude)", get: (x) => (x.geom ? x.geom.x : null) }, { name: "y (latitude)", get: (x) => (x.geom ? x.geom.y : null) }]);
        const main = Object.assign({ name: ((S.meta && S.meta.name) || D.SV.id).slice(0, 31) }, sheetXml(cols, S.recs));
        const ph = []; S.recs.forEach((x) => D.photosOf(x, true).forEach((p) => ph.push({ x, p })));
        const pcols = [["objectid", (r) => r.x.oid], ["globalid", (r) => r.x.raw.globalid || r.x.gid], ["record", (r) => (D.SV.recordTitle ? D.SV.recordTitle(r.x, D.H).replace(/<[^>]+>/g, "") : "")], ["photo_field", (r) => r.p.field],
          ["photo_label", (r) => D.photoLabel(r.p.field)], ["name", (r) => r.p.name], ["content_type", (r) => r.p.type], ["size_bytes", (r) => r.p.size], ["url", (r) => (r.p.url.startsWith("data:") ? "(demo)" : r.p.url)]].map(([n, g]) => ({ name: n, get: g }));
        const photos = Object.assign({ name: "photos" }, sheetXml(pcols, ph));
        download(await buildXlsx([main, photos]), `${slug(D.SV.tab)}_data_${today()}.xlsx`);
        note.remove(); D.toast(t("xlsx_done", { a: S.recs.length, b: ph.length }));
      } catch (e) { console.error(e); note.remove(); D.toast(t("xlsx_err", { e: e.message })); }
    });
  }

  /* ======================= PDF ======================= */
  const WIN = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ".split(""));
  const clean = (s) => String(s == null ? "" : s).replace(/<[^>]+>/g, "").replace(/→/g, "->").replace(/≤/g, "<=").replace(/[   ]/g, " ")
    .split("").map((c) => ((c.charCodeAt(0) < 256 && c.charCodeAt(0) >= 32) || WIN.has(c) ? c : c === "\n" ? " " : "?")).join("");
  const hex = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); return PDFLib.rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255); };
  const C = { ink: "#1B1D18", muted: "#6A6A5C", line: "#D9D3C0", cream: "#F4EDDA", creamDark: "#E8DEC2", green: "#2F5233", leaf: "#5E9A47", band: "#141A12" };
  // cores do ecrã (tema escuro) convertidas para impressão: as muito claras escurecem
  function printColor(token) {
    let v = token ? window.DASH.cssVar(token) : ""; if (!/^#/.test(v)) return C.leaf;
    const h = v.replace("#", ""), r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.8 ? "#9A9A8E" : lum > 0.62 ? "#" + [r, g, b].map((x) => Math.round(x * 0.78).toString(16).padStart(2, "0")).join("") : v;
  }
  class Report {
    constructor(pdf, f) { this.pdf = pdf; this.f = f; this.pages = []; this.M = 40; }
    add(land) { const sz = land ? [841.89, 595.28] : [595.28, 841.89]; this.page = this.pdf.addPage(sz); this.W = sz[0]; this.H = sz[1]; this.y = this.H - this.M - 18; this.pages.push(this.page); }
    ensure(h, land) { if (this.y - h < this.M + 20) { this.add(land); return true; } return false; }
    width(s, size, font) { return (font || this.f.reg).widthOfTextAtSize(clean(s), size); }
    fit(s, w, size, font) { s = clean(s); font = font || this.f.reg; if (font.widthOfTextAtSize(s, size) <= w) return s; while (s.length > 1 && font.widthOfTextAtSize(s + "…", size) > w) s = s.slice(0, -1); return s + "…"; }
    wrap(s, w, size, font) { const ws = clean(s).split(/\s+/), out = []; let cur = ""; ws.forEach((x) => { const n = cur ? `${cur} ${x}` : x; if (this.width(n, size, font) > w && cur) { out.push(cur); cur = x; } else cur = n; }); if (cur) out.push(cur); return out; }
    text(s, x, y, o = {}) { this.page.drawText(clean(s), { x, y, size: o.size || 9, font: o.font || this.f.reg, color: hex(o.color || C.ink) }); }
    rect(x, y, w, h, color, o = {}) { this.page.drawRectangle(Object.assign({ x, y, width: w, height: h, color: color ? hex(color) : undefined }, o.border ? { borderColor: hex(o.border), borderWidth: o.bw || 0.6 } : {})); }
    line(x1, y1, x2, y2, c) { this.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: hex(c || C.line) }); }
    h2(s, land) { this.ensure(40, land); this.y -= 8; this.rect(this.M, this.y - 2, 3, 13, C.leaf); this.text(s, this.M + 9, this.y, { size: 12.5, font: this.f.bold, color: C.green }); this.y -= 20; }
  }
  function hbarsPdf(R, x, y, w, title, entries, italic) {
    R.text(R.fit(title, w, 10, R.f.bold), x, y, { size: 10, font: R.f.bold, color: C.green }); y -= 14;
    if (!entries.length) { R.text(window.DASH.t("no_data"), x, y, { color: C.muted }); return y - 14; }
    const max = Math.max(1, ...entries.map((e) => e.max || e.n));
    entries.forEach((e) => {
      const f = italic ? R.f.it : R.f.reg, num = e.display || window.DASH.fmtNum(e.n);
      R.text(R.fit(e.label, w - R.width(num, 8.5) - 8, 8.5, f), x, y, { size: 8.5, font: f }); R.text(num, x + w - R.width(num, 8.5), y, { size: 8.5, color: C.muted });
      R.rect(x, y - 7, w, 3.5, C.cream); R.rect(x, y - 7, Math.max(1.5, ((e.n || 0) / (e.max || max)) * w), 3.5, printColor(e.color)); y -= 19;
    });
    return y;
  }
  const merc = (lon, lat) => [6378137 * lon * Math.PI / 180, 6378137 * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2))];
  async function mapBlock(R, w, h) {
    const D = window.DASH, pts = D.S.recs.filter((x) => x.lat != null);
    if (!pts.length) { R.text(D.t("r_none"), R.M, R.y, { color: C.muted }); R.y -= 16; return; }
    const xy = pts.map((x) => merc(x.lon, x.lat));
    let x0 = Math.min(...xy.map((p) => p[0])), x1 = Math.max(...xy.map((p) => p[0])), y0 = Math.min(...xy.map((p) => p[1])), y1 = Math.max(...xy.map((p) => p[1]));
    let dx = Math.max(x1 - x0, 300) * 1.25, dy = Math.max(y1 - y0, 300) * 1.25; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (dx / dy < w / h) dx = dy * (w / h); else dy = dx * (h / w); x0 = cx - dx / 2; x1 = cx + dx / 2; y0 = cy - dy / 2; y1 = cy + dy / 2;
    const bottom = R.y - h; let ok = false;
    try {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
      const r = await fetch(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${x0},${y0},${x1},${y1}&bboxSR=3857&imageSR=3857&size=${Math.round(w * 2)},${Math.round(h * 2)}&format=jpg&f=image`, { signal: ctl.signal }); clearTimeout(to);
      if (r.ok && /image/.test(r.headers.get("content-type") || "")) { R.page.drawImage(await R.pdf.embedJpg(await r.arrayBuffer()), { x: R.M, y: bottom, width: w, height: h }); ok = true; }
    } catch (e) { ok = false; }
    if (!ok) { R.rect(R.M, bottom, w, h, C.cream); for (let i = 1; i < 6; i++) { R.line(R.M + (w * i) / 6, bottom, R.M + (w * i) / 6, R.y, C.creamDark); R.line(R.M, bottom + (h * i) / 6, R.M + w, bottom + (h * i) / 6, C.creamDark); } }
    const cb = D.SV.colorBy;
    pts.forEach((x, i) => { const X = R.M + ((xy[i][0] - x0) / (x1 - x0)) * w, Y = bottom + ((xy[i][1] - y0) / (y1 - y0)) * h;
      R.page.drawCircle({ x: X, y: Y, size: 3.6, color: hex(printColor(cb ? cb.colors[x.a[cb.field]] || "--s-none" : null)), borderColor: hex("#FFFFFF"), borderWidth: 0.9 }); });
    R.rect(R.M, bottom, w, h, null, { border: C.line }); R.y = bottom - 12;
    R.text(`${cb ? D.t("r_map_note", { f: D.fieldLabel(cb.field) }) : ""} ${ok ? "Imagery: Esri, Maxar, Earthstar Geographics." : D.t("r_map_noimg")}`, R.M, R.y, { size: 7.5, color: C.muted }); R.y -= 11;
    if (cb) { let lx = R.M; Object.keys(cb.colors).forEach((k) => { const l = D.label(cb.field, k); R.page.drawCircle({ x: lx + 3, y: R.y - 2.5, size: 3, color: hex(printColor(cb.colors[k])) }); R.text(l, lx + 9, R.y - 5, { size: 7.5 }); lx += R.width(l, 7.5) + 22; }); R.y -= 16; }
  }
  function table(R, cols, rows, land) {
    const head = () => { R.rect(R.M, R.y - 5, R.W - 2 * R.M, 16, C.green); let x = R.M + 4; cols.forEach((c) => { R.text(R.fit(c.label, c.w - 6, 7.5, R.f.bold), x, R.y, { size: 7.5, font: R.f.bold, color: C.cream }); x += c.w; }); R.y -= 16; };
    head(); if (!rows.length) { R.text(window.DASH.t("r_none"), R.M + 4, R.y - 2, { color: C.muted }); R.y -= 16; return; }
    rows.forEach((r, i) => { if (R.ensure(16, land)) head(); if (i % 2) R.rect(R.M, R.y - 5, R.W - 2 * R.M, 15, "#F8F4E8");
      let x = R.M + 4; cols.forEach((c, ci) => { R.text(R.fit(r[ci] == null ? "—" : r[ci], c.w - 6, 7.5, ci === 0 ? R.f.bold : R.f.reg), x, R.y, { size: 7.5, font: ci === 0 ? R.f.bold : R.f.reg }); x += c.w; }); R.y -= 15; });
  }
  async function jpegBytes(src) {
    let url = src, rev = null;
    if (!src.startsWith("data:")) { const r = await fetch(src); if (!r.ok) throw new Error(`HTTP ${r.status}`); url = rev = URL.createObjectURL(await r.blob()); }
    try {
      const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("image")); im.src = url; });
      const k = Math.min(1, 700 / Math.max(img.naturalWidth || 400, img.naturalHeight || 300)), cv = document.createElement("canvas");
      cv.width = Math.round((img.naturalWidth || 400) * k); cv.height = Math.round((img.naturalHeight || 300) * k);
      const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
      const b = await new Promise((res) => cv.toBlob(res, "image/jpeg", 0.78)); return { bytes: await b.arrayBuffer(), w: cv.width, h: cv.height };
    } finally { if (rev) URL.revokeObjectURL(rev); }
  }

  async function pdf(btn) {
    const D = window.DASH, { S, SV, t, fmtDate, fmtDateTime, fmtNum } = D;
    if (typeof PDFLib === "undefined") { D.toast(t("lib_missing")); return; }
    await busy(btn, async () => {
      const note = D.toast(t("pdf_working"), 15000);
      try {
        const doc = await PDFLib.PDFDocument.create(); const SF = PDFLib.StandardFonts;
        const f = { reg: await doc.embedFont(SF.Helvetica), bold: await doc.embedFont(SF.HelveticaBold), it: await doc.embedFont(SF.HelveticaOblique) };
        doc.setTitle(SV.title); doc.setCreationDate(new Date());
        const R = new Report(doc, f), W = 595.28 - 80;
        R.add(false);
        R.rect(0, R.H - 118, R.W, 118, C.band); R.rect(0, R.H - 121, R.W, 3, C.leaf);
        R.text(R.fit(SV.title, W, 19, f.bold), R.M, R.H - 52, { size: 19, font: f.bold, color: C.cream });
        R.text(R.fit(D.L(SV.subtitle), W, 10.5), R.M, R.H - 72, { size: 10.5, color: "#CFC6AC" });
        R.text(t("r_generated", { d: fmtDateTime(Date.now()) }), R.M, R.H - 96, { size: 8.5, color: "#A7A58F" });
        R.text(R.fit(D.isDemo() ? "Demo data" : S.serviceName || "", W, 8), R.M, R.H - 108, { size: 8, color: "#A7A58F" });
        R.y = R.H - 150;
        // indicadores
        R.h2(t("r_summary"));
        const K = D.kpis(), bw = (W - 20) / 3, bh = 54;
        K.forEach((k, i) => { const col = i % 3, row = Math.floor(i / 3), x = R.M + col * (bw + 10), y = R.y - row * (bh + 10) - bh + 12;
          R.rect(x, y, bw, bh, C.cream); R.rect(x, y, 3, bh, C.leaf);
          R.text(R.fit(k.label.toUpperCase(), bw - 20, 7, f.bold), x + 11, y + bh - 14, { size: 7, font: f.bold, color: C.muted });
          R.text(typeof k.value === "number" ? fmtNum(k.value) : String(k.value), x + 11, y + 17, { size: 20, font: f.bold, color: C.green });
          R.text(R.fit(k.sub, bw - 20, 7.5), x + 11, y + 6, { size: 7.5, color: C.muted }); });
        R.y -= Math.ceil(K.length / 3) * (bh + 10) + 6;
        R.h2(t("r_map")); if (R.y - R.M - 60 < 150) { R.add(false); R.h2(t("r_map")); }
        await mapBlock(R, W, Math.min(250, R.y - R.M - 50));
        // gráficos (2 colunas)
        R.add(false); R.h2(t("r_charts"));
        const cw = (W - 24) / 2; let col = 0, rowTop = R.y, rowLow = R.y;
        for (const c of SV.charts || []) {
          const e = D.computeChart(c, S.recs); const need = 30 + e.length * 19;
          if (col === 0 && rowTop - need < R.M + 30) { R.add(false); rowTop = rowLow = R.y; }
          const y = hbarsPdf(R, R.M + col * (cw + 24), rowTop, cw, D.L(c.title), e, c.italic);
          rowLow = Math.min(rowLow, y);
          col++; if (col === 2) { col = 0; rowTop = rowLow - 10; rowLow = rowTop; }
        }
        R.y = Math.min(rowLow, rowTop) - 6;
        // diário
        R.ensure(170); R.h2(t("r_daily"));
        const dd = D.daily(), chH = 100, chX = R.M + 22, chW = W - 22, base = R.y - chH, mx = Math.max(4, ...dd.map((d) => d.n)), st = Math.ceil(mx / 4), top = st * 4, bwD = chW / dd.length;
        for (let v = 0; v <= top; v += st) { const yy = base + (v / top) * chH; R.line(chX, yy, chX + chW, yy, C.creamDark); R.text(String(v), R.M, yy - 3, { size: 7, color: C.muted }); }
        dd.forEach((d, i) => { if (d.n) R.rect(chX + i * bwD + bwD * 0.18, base, bwD * 0.64, (d.n / top) * chH, i === dd.length - 1 ? C.leaf : C.green);
          if (i % 5 === 4 || i === dd.length - 1) { const l = new Date(d.t).toLocaleDateString(t("locale"), { day: "2-digit", month: "2-digit" }); R.text(l, chX + i * bwD + bwD / 2 - R.width(l, 7) / 2, base - 11, { size: 7, color: C.muted }); } });
        R.y = base - 26;
        // ações (HST)
        if (SV.actions) {
          const A = D.actions(); R.add(true); R.h2(`${t("actions_title")} (${A.length})`, true);
          table(R, [{ label: t("a_where"), w: 130 }, { label: t("a_what"), w: 330 }, { label: t("a_who"), w: 130 }, { label: t("a_due"), w: 80 }, { label: "", w: 91.89 }],
            A.map((a) => [a.where || "—", a.what || "—", a.who || "—", fmtDate(a.due), t(a.status)]), true);
        }
        // registo (paisagem)
        R.add(true); R.h2(`${t("r_register")} (${S.recs.length})`, true);
        const cols = SV.columns || [], LW = 841.89 - 80, cwid = LW / cols.length;
        const rows = D.sortRows([...S.recs], { key: "_created", dir: -1 }).map((x) => cols.map((k) => D.fmtVal(k, D.val(x, k))));
        table(R, cols.map((k) => ({ label: D.fieldLabel(k), w: cwid })), rows, true);
        // fotografias: uma linha por registo
        const withPh = D.sortRows(S.recs.filter((x) => D.photosOf(x).length), { key: "_created", dir: -1 }); const LIMIT = 60;
        if (withPh.length) {
          R.add(false); R.h2(`${t("r_photos")} (${withPh.length})`);
          if (withPh.length > LIMIT) { R.text(t("r_photos_cap", { n: LIMIT }), R.M, R.y, { size: 8, color: C.muted }); R.y -= 14; }
          const per = 4, gap = 8, cw2 = (W - gap * (per - 1)) / per, ih = cw2 * 0.75;
          for (const x of withPh.slice(0, LIMIT)) {
            const ps = D.photosOf(x).slice(0, per);
            R.ensure(ih + 46);
            R.text(R.fit(`${SV.recordTitle ? SV.recordTitle(x, D.H) : x.oid} · ${fmtDate(x.created)}`, W, 8.5, f.bold), R.M, R.y, { size: 8.5, font: f.bold });
            const top2 = R.y - 6;
            for (let i = 0; i < ps.length; i++) {
              const cx = R.M + i * (cw2 + gap); R.rect(cx, top2 - ih, cw2, ih, "#EFE9D8");
              try { const jb = await jpegBytes(D.photoSrc(ps[i])), img = await doc.embedJpg(jb.bytes), k = Math.min(cw2 / jb.w, ih / jb.h);
                R.page.drawImage(img, { x: cx + (cw2 - jb.w * k) / 2, y: top2 - ih + (ih - jb.h * k) / 2, width: jb.w * k, height: jb.h * k }); } catch (e) { R.text("—", cx + cw2 / 2, top2 - ih / 2, { color: C.muted }); }
              R.text(R.fit(D.photoLabel(ps[i].field), cw2, 7), cx, top2 - ih - 9, { size: 7, color: C.muted });
            }
            R.y = top2 - ih - 24;
          }
        }
        const total = R.pages.length;
        R.pages.forEach((pg, i) => { const { width } = pg.getSize();
          pg.drawLine({ start: { x: 40, y: 32 }, end: { x: width - 40, y: 32 }, thickness: 0.5, color: hex(C.line) });
          pg.drawText(clean(`${SV.title} · ${fmtDateTime(Date.now())}`), { x: 40, y: 20, size: 7.5, font: f.reg, color: hex(C.muted) });
          const pn = clean(t("r_page", { n: i + 1, t: total })); pg.drawText(pn, { x: width - 40 - f.reg.widthOfTextAtSize(pn, 7.5), y: 20, size: 7.5, font: f.reg, color: hex(C.muted) }); });
        download(new Blob([await doc.save()], { type: "application/pdf" }), `${slug(SV.tab)}_report_${today()}.pdf`);
        note.remove(); D.toast(t("pdf_done"));
      } catch (e) { console.error(e); note.remove(); D.toast(t("pdf_err", { e: e.message })); }
    });
  }
  window.DASHX = { xlsx, pdf };
})();
