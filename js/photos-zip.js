/* Botão "Photos (ZIP)": descarrega todas as fotografias do formulário da aba atual num único ZIP,
   organizadas numa pasta por pergunta/fase, com um index.csv (registo, data, coordenadas, nome original).
   Funciona nas páginas genéricas (window.DASH) e na página dedicada do Survey 4.1 (window.TTM). */
(function () {
  const TXT = {
    en: { btn: "Photos (ZIP)", working: "Downloading photos {a} of {b}…", zipping: "Building ZIP…", done: "ZIP downloaded ({a} photos).",
      partial: "ZIP downloaded ({a} photos; {b} could not be downloaded, see index.csv).", none: "There are no photos to download yet.",
      err: "The ZIP could not be generated: {e}", lib: "The ZIP library did not load. Check the internet connection and reload the page.", wait: "Data still loading, try again in a few seconds." },
    pt: { btn: "Fotos (ZIP)", working: "A descarregar fotografias {a} de {b}…", zipping: "A criar o ZIP…", done: "ZIP descarregado ({a} fotografias).",
      partial: "ZIP descarregado ({a} fotografias; {b} não foi possível descarregar, ver index.csv).", none: "Ainda não há fotografias para descarregar.",
      err: "Não foi possível gerar o ZIP: {e}", lib: "A biblioteca ZIP não carregou. Verifique a ligação à internet e recarregue a página.", wait: "Os dados ainda estão a carregar; tente novamente dentro de segundos." }
  };
  const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o && o[k] != null ? o[k] : ""));
  const safe = (s) => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (ms, sep) => { if (!ms) return ""; const d = new Date(ms); return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join(sep == null ? "" : sep); };
  const csvCell = (v) => { const s = v == null ? "" : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const EXT = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif", "image/svg+xml": "svg", "image/bmp": "bmp", "image/tiff": "tif" };
  const extOf = (p) => { const m = /\.([A-Za-z0-9]{2,5})$/.exec(p.name || ""); return (m ? m[1].toLowerCase() : EXT[String(p.type || "").toLowerCase()]) || "jpg"; };

  /* Adaptador: devolve { name, lang, toast, items:[{x, p, folder, id, date, src}] } */
  function collect() {
    if (window.DASH) {
      const D = window.DASH, SV = D.SV, order = (SV.photos || []).map((c) => c.field);
      const idField = SV.photoIdField;
      const items = [];
      D.S.recs.forEach((x) => D.photosOf(x).forEach((p) => {
        const i = order.indexOf(p.field);
        items.push({ x, p, field: p.field, label: D.photoLabel(p.field), folder: `${i < 0 ? "99" : pad(i + 1)}_${safe(D.photoLabel(p.field)) || safe(p.field)}`,
          id: idField ? x.a[idField] : "", date: x.created || (SV.dateField ? x.a[SV.dateField] : null), src: D.photoSrc(p) });
      }));
      return { name: SV.tab || SV.id, lang: D.lang(), toast: D.toast, items, ready: !!(D.S.meta || D.isDemo()) };
    }
    if (window.TTM) {
      const T = window.TTM, items = [];
      T.S.records.forEach((x) => T.photosOf(x).forEach((p) => {
        const i = T.phaseIdx(p.phase);
        items.push({ x, p, field: p.phase, label: T.phaseLabel(p.phase), folder: `${i < 99 ? pad(i + 1) : "99"}_${safe(T.phaseLabel(p.phase)) || safe(p.phase)}`,
          id: x.a.tree_id, date: x.created, src: T.photoSrc(p) });
      }));
      return { name: "Survey 4.1", lang: T.lang(), toast: T.toast, items, ready: !!(T.S.meta || T.isDemo()) };
    }
    return null;
  }
  const curLang = () => { try { return (window.DASH ? window.DASH.lang() : window.TTM ? window.TTM.lang() : "en") === "pt" ? "pt" : "en"; } catch (e) { return "en"; } };

  async function run(btn) {
    const C = collect(); if (!C) return;
    const tx = TXT[C.lang === "pt" ? "pt" : "en"], toast = C.toast || ((m) => alert(m));
    if (typeof JSZip === "undefined") { toast(tx.lib); return; }
    if (!C.ready) { toast(tx.wait); return; }
    if (!C.items.length) { toast(tx.none); return; }
    btn.disabled = true; btn.setAttribute("aria-busy", "true");
    const label = btn.textContent;
    try {
      const zip = new JSZip(), root = zip.folder(`${safe(C.name)}_photos`);
      const used = new Set(), rows = [];
      let done = 0, ok = 0, failed = 0;
      const set = () => { btn.textContent = fill(tx.working, { a: done, b: C.items.length }); };
      set();
      // nome único: <ID do registo>_<data>_<pergunta>[_n].<ext>
      C.items.forEach((it) => {
        const base = [safe(it.id) || `OID${it.x.oid}`, ymd(it.date), safe(it.field)].filter(Boolean).join("_");
        let fn = `${base}.${extOf(it.p)}`, n = 2;
        while (used.has(`${it.folder}/${fn}`.toLowerCase())) fn = `${base}_${n++}.${extOf(it.p)}`;
        used.add(`${it.folder}/${fn}`.toLowerCase()); it.file = `${it.folder}/${fn}`;
      });
      let next = 0;
      async function worker() {
        while (next < C.items.length) {
          const it = C.items[next++];
          try {
            const r = await fetch(it.src); if (!r.ok) throw new Error("HTTP " + r.status);
            root.file(it.file, await r.arrayBuffer(), { binary: true, date: it.date ? new Date(it.date) : new Date() });
            it.status = "ok"; ok++;
          } catch (e) { it.status = "failed: " + (e.message || e); failed++; }
          done++; set();
        }
      }
      await Promise.all(Array.from({ length: Math.min(6, C.items.length) }, worker));
      const head = ["file", "record_id", "objectid", "globalid", "photo_question", "photo_label", "original_name", "date", "latitude", "longitude", "status"];
      C.items.forEach((it) => rows.push([it.file, it.id || "", it.x.oid, it.x.gid || "", it.field, it.label, it.p.name || "", ymd(it.date, "-"),
        it.x.geom ? it.x.geom.y : "", it.x.geom ? it.x.geom.x : "", it.status]));
      root.file("index.csv", "﻿" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n"));
      btn.textContent = tx.zipping;
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `${safe(C.name)}_photos_${ymd(Date.now(), "-")}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      toast(failed ? fill(tx.partial, { a: ok, b: failed }) : fill(tx.done, { a: ok }), 6000);
    } catch (e) {
      toast(fill(tx.err, { e: e.message || e }), 8000);
    } finally {
      btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = label; relabel();
    }
  }

  function relabel() { const b = document.getElementById("zipBtn"); if (b && !b.disabled) b.textContent = TXT[curLang()].btn; }
  function init() {
    const b = document.getElementById("zipBtn"); if (!b) return;
    b.addEventListener("click", () => run(b));
    ["langEn", "langPt"].forEach((id) => { const e = document.getElementById(id); if (e) e.addEventListener("click", () => setTimeout(relabel, 0)); });
    setTimeout(relabel, 0);
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
