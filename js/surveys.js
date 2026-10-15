/*
 * Formulários da plataforma — uma aba por formulário, pela ordem desta lista.
 * Para mudar o serviço de um formulário, altere apenas o seu serviceUrl.
 *
 * Cada dashboard genérico define: indicadores (kpis), cor do mapa (colorBy), gráficos (charts),
 * colunas da tabela (columns), filtros, fotografias (photos) e texto das submissões recentes (feed).
 * Os rótulos dos campos e das respostas vêm automaticamente do XLSForm (js/schemas.js).
 */
window.PLATFORM = { title: "Ecological Monitoring Platform", pollSeconds: 30, portalUrl: "https://www.arcgis.com", clientId: "" };

(function () {
  const yes = (v) => v === "yes";
  const num = (v) => (typeof v === "number" && isFinite(v) ? v : (v != null && v !== "" && !isNaN(+v) ? +v : null));
  const avg = (arr) => { const v = arr.map(num).filter((x) => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

  const HST_CHECKS = ["site_clean", "safe_access", "signage", "slip_trip", "animals_ctrl", "weather_safe", "waste_mgmt",
    "ppe_worn", "emergency_aware", "tools_ok", "vehicles_ok", "fa_kit", "fa_complete", "fa_expiry", "fa_training"];
  const THREAT = /\((CR|EN|VU)\)/;

  window.SURVEYS = [
    /* ===================== 1. SURVEY 4 ===================== */
    {
      id: "survey4", page: "index.html", tab: "Survey 4", navSub: "Retention · Translocation · Removal",
      title: "Survey 4 · Tree Retention, Translocation & Removal", subtitle: { en: "Tree characteristics and fate assessment", pt: "Características das árvores e avaliação do destino" },
      serviceUrl: "https://services8.arcgis.com/Yb7xytb4Ff2eEN6Y/arcgis/rest/services/Survey_4_Tree_Retention_view/FeatureServer",
      layerId: 0,
      dateField: "col_date", photoIdField: "tree_uid",
      recordTitle: (x, h) => `${x.a.tree_uid || "Tree"} · ${h.label("species", x.a.species)}`,
      feed: { title: (x, h) => `${x.a.tree_uid || "—"} · <i>${h.esc(h.label("species", x.a.species))}</i>`, sub: (x, h) => `${h.label("survey_intention", x.a.survey_intention)} · ${h.label("technician_name", x.a.technician_name)}` },
      colorBy: { field: "survey_intention", colors: { translocation: "--k1", retention: "--k3", removal: "--k4" } },
      kpis: [
        { label: { en: "Trees assessed", pt: "Árvores avaliadas" }, value: (R) => R.length, sub: (R, h) => h.t("today_n", { n: R.filter((x) => x.created >= today0()).length }) },
        { label: { en: "Translocation", pt: "Translocação" }, value: (R) => R.filter((x) => x.a.survey_intention === "translocation").length, sub: (R) => `${pct(R.filter((x) => x.a.survey_intention === "translocation").length, R.length)}%` },
        { label: { en: "Retention", pt: "Retenção" }, value: (R) => R.filter((x) => x.a.survey_intention === "retention").length, sub: (R) => `${pct(R.filter((x) => x.a.survey_intention === "retention").length, R.length)}%` },
        { label: { en: "Salvage / Removal", pt: "Recuperação / Remoção" }, value: (R) => R.filter((x) => x.a.survey_intention === "removal").length, sub: (R) => `${pct(R.filter((x) => x.a.survey_intention === "removal").length, R.length)}%` },
        { label: { en: "Damaged or stressed", pt: "Danificadas ou em stress" }, value: (R) => `${pct(R.filter((x) => x.a.health_status === "damaged_stressed").length, R.filter((x) => x.a.health_status).length)}%`, sub: (R, h) => h.t("n_of_m", { a: R.filter((x) => x.a.health_status === "damaged_stressed").length, b: R.filter((x) => x.a.health_status).length }) },
        { label: { en: "Avg. survival probability", pt: "Prob. média de sobrevivência" }, value: (R) => { const v = avg(R.map((x) => x.a.survival_probability)); return v == null ? "—" : `${Math.round(v)}%`; }, sub: (R) => { const v = avg(R.map((x) => x.a.viability_estimate)); return v == null ? "" : `Retention viability ${Math.round(v)}%`; } }
      ],
      charts: [
        { title: { en: "Survey intention", pt: "Intenção do levantamento" }, kind: "cat", fields: ["survey_intention"], colorFrom: "colorBy" },
        { title: { en: "Species", pt: "Espécies" }, kind: "cat", fields: ["species"], top: 12, italic: true },
        { title: { en: "Health status", pt: "Estado de saúde" }, kind: "cat", fields: ["health_status"], colors: { no_damage: "--k1", damaged_stressed: "--k4" } },
        { title: { en: "Health issues", pt: "Problemas de saúde" }, kind: "multi", fields: ["health_issues"] },
        { title: { en: "Tree attributes (Yes)", pt: "Atributos da árvore (Sim)" }, kind: "yeslist", fields: ["mother_tree", "nurse_plant", "soil_stabilisation", "landscape_prominent"] },
        { title: { en: "IUCN status", pt: "Estado IUCN" }, kind: "cat", fields: ["iucn_status"] },
        { title: { en: "Estimated root ball", pt: "Torrão estimado" }, kind: "cat", fields: ["root_ball"], order: true },
        { title: { en: "Estimated weight", pt: "Peso estimado" }, kind: "cat", fields: ["tree_weight"], order: true },
        { title: { en: "Machinery requirement", pt: "Maquinaria necessária" }, kind: "cat", fields: ["machinery"] },
        { title: { en: "Survival probability (%)", pt: "Probabilidade de sobrevivência (%)" }, kind: "hist", fields: ["survival_probability"], bins: [0, 25, 50, 75, 101] },
        { title: { en: "Salvage potential (Yes)", pt: "Potencial de recuperação (Sim)" }, kind: "yeslist", fields: ["mulch_potential", "seed_potential", "propagation_potential", "habitat_log_potential", "restoration_potential", "biomass_potential"] },
        { title: { en: "Retention requirements (Yes)", pt: "Requisitos de retenção (Sim)" }, kind: "yeslist", fields: ["irrigation_required", "pruning_required", "monitoring_required", "barrier_required"] }
      ],
      filters: ["survey_intention", "species", "health_status", "technician_name"],
      columns: ["tree_uid", "species", "survey_intention", "plot_number", "dbh_cm", "tree_height", "crown_diameter", "health_status", "survival_probability", "viability_estimate", "technician_name", "_created"],
      photos: [{ field: "tree_image", label: { en: "Tree", pt: "Árvore" } }, { field: "trunk_image", label: { en: "Trunk", pt: "Tronco" } }, { field: "leaves_image", label: { en: "Leaves / fruit", pt: "Folhas / fruto" } }]
    },

    /* ===================== 2. SURVEY 4.1 (dashboard dedicado) ===================== */
    { id: "survey41", page: "survey-4-1.html", tab: "Survey 4.1", navSub: "Transplanting & Nursery", dedicated: true },

    /* ===================== 3. BIODIVERSITY ===================== */
    {
      id: "biodiversity", page: "biodiversity.html", tab: "Biodiversity", navSub: "Fauna · Nests · Habitat",
      title: "Biodiversity Survey", subtitle: { en: "Fauna, nests, burrows, corridors, camera traps, birds, transects and habitat", pt: "Fauna, ninhos, tocas, corredores, câmaras, aves, transectos e habitat" },
      serviceUrl: "https://services8.arcgis.com/Yb7xytb4Ff2eEN6Y/arcgis/rest/services/Biodiversity_Survey5_view/FeatureServer",
      layerId: 0,
      dateField: "survey_date", photoIdField: "form_ref",
      recordTitle: (x, h) => x.a.sp_common_en || x.a.species_other || h.label("species", x.a.species) || x.a.form_ref || "Record",
      feed: {
        title: (x, h) => `${h.esc(x.a.sp_common_en || x.a.species_other || h.label("species", x.a.species) || "—")}${x.a.sp_scientific ? ` · <i>${h.esc(x.a.sp_scientific)}</i>` : ""}${THREAT.test(x.a.sp_iucn || "") ? ' <span class="badge danger">' + h.esc((x.a.sp_iucn.match(THREAT) || [])[1]) + "</span>" : ""}`,
        sub: (x, h) => `${h.label("survey_methods", x.a.survey_methods)} · ${h.esc(x.a.collection_site || "—")}`
      },
      colorBy: { field: "taxon_group", colors: { mammal: "--k4", small_mammal: "--k2", bird: "--k3", reptile: "--k1", amphibian: "--k5", insect: "--k6", arachnid: "--k7", mollusc: "--k8" } },
      kpis: [
        { label: { en: "Records", pt: "Registos" }, value: (R) => R.length, sub: (R, h) => h.t("today_n", { n: R.filter((x) => x.created >= today0()).length }) },
        { label: { en: "Species recorded", pt: "Espécies registadas" }, value: (R) => new Set(R.map((x) => x.a.species).filter((s) => s && s !== "other" && s !== "unidentified")).size, sub: (R) => `${new Set(R.map((x) => x.a.taxon_group).filter(Boolean)).size} taxa` },
        { label: { en: "Threatened species records", pt: "Registos de espécies ameaçadas" }, value: (R) => R.filter((x) => THREAT.test(x.a.sp_iucn || "")).length, sub: () => "IUCN CR / EN / VU" },
        { label: { en: "Individuals counted", pt: "Indivíduos contados" }, value: (R) => R.reduce((s, x) => s + ["fa_individuals", "ct_individuals", "bp_individuals", "lt_individuals"].reduce((t, f) => t + (num(x.a[f]) || 0), 0), 0), sub: () => "fauna · camera · birds · transects" },
        { label: { en: "Active nests / burrows", pt: "Ninhos / tocas ativos" }, value: (R) => R.filter((x) => yes(x.a.ne_active) || yes(x.a.bu_active)).length, sub: (R) => `${R.filter((x) => x.a.ne_nest_id).length} nests · ${R.filter((x) => x.a.bu_burrow_id).length} burrows` },
        { label: { en: "Sites surveyed", pt: "Locais levantados" }, value: (R) => new Set(R.map((x) => (x.a.collection_site || "").trim().toLowerCase()).filter(Boolean)).size, sub: (R) => `${new Set(R.map((x) => x.a.plot_number).filter(Boolean)).size} plots` }
      ],
      charts: [
        { title: { en: "Taxonomic group", pt: "Grupo taxonómico" }, kind: "cat", fields: ["taxon_group"], colorFrom: "colorBy" },
        { title: { en: "Species (top 12)", pt: "Espécies (top 12)" }, kind: "cat", fields: ["sp_scientific"], top: 12, italic: true },
        { title: { en: "IUCN status", pt: "Estado IUCN" }, kind: "cat", fields: ["sp_iucn"] },
        { title: { en: "Survey methods", pt: "Métodos de levantamento" }, kind: "multi", fields: ["survey_methods"] },
        { title: { en: "Evidence", pt: "Evidências" }, kind: "multi", fields: ["fa_evidence", "ne_evidence", "bu_evidence", "co_evidence", "lt_evidence"] },
        { title: { en: "Habitat", pt: "Habitat" }, kind: "cat", fields: ["ha_habitat", "ne_habitat", "bu_habitat", "co_habitat"] },
        { title: { en: "Behaviour", pt: "Comportamento" }, kind: "multi", fields: ["fa_behaviour", "ct_behaviour"] },
        { title: { en: "Corridor threats", pt: "Ameaças nos corredores" }, kind: "multi", fields: ["co_threats"] },
        { title: { en: "Habitat disturbance", pt: "Perturbação do habitat" }, kind: "cat", fields: ["ha_disturbance"], order: true }
      ],
      filters: ["taxon_group", "species", "sp_iucn", "technician"],
      columns: ["survey_date", "sp_common_en", "sp_scientific", "taxon_group", "sp_iucn", "survey_methods", "fa_individuals", "collection_site", "plot_number", "technician"],
      photos: [{ field: "fa_photo", label: { en: "Fauna", pt: "Fauna" } }, { field: "ne_photo", label: { en: "Nest", pt: "Ninho" } }, { field: "bu_photo", label: { en: "Burrow", pt: "Toca" } },
        { field: "co_photo", label: { en: "Corridor", pt: "Corredor" } }, { field: "ct_photo", label: { en: "Camera trap", pt: "Câmara" } }, { field: "ha_photo", label: { en: "Habitat", pt: "Habitat" } }]
    },

    /* ===================== 4. HST ===================== */
    {
      id: "hst", page: "hst.html", tab: "HST", navSub: "Health & Safety",
      title: "HST Survey · Health & Safety", subtitle: { en: "Site conditions, worker safety, PPE, first aid, hazards and actions", pt: "Condições do local, segurança, EPI, primeiros socorros, perigos e ações" },
      serviceUrl: "https://services8.arcgis.com/Yb7xytb4Ff2eEN6Y/arcgis/rest/services/HST_Survey_view/FeatureServer",
      layerId: 0,
      dateField: "survey_date", photoIdField: "form_ref",
      recordTitle: (x) => `${x.a.form_ref || "Inspection"} · ${x.a.collection_site || ""}`,
      feed: { title: (x, h) => `${h.esc(x.a.collection_site || "—")} · <span class="chip" style="--c:var(${({ low: "--s-alive", medium: "--s-stressed", high: "--s-damaged", critical: "--s-dead" })[x.a.risk_level] || "--s-none"})">${h.esc(h.label("risk_level", x.a.risk_level))}</span>`, sub: (x, h) => `${h.label("activity_type", x.a.activity_type)} · ${h.label("technician", x.a.technician)}${yes(x.a.non_conformity) ? " · NC" : ""}` },
      colorBy: { field: "risk_level", colors: { low: "--s-alive", medium: "--s-stressed", high: "--s-damaged", critical: "--s-dead" } },
      kpis: [
        { label: { en: "Inspections", pt: "Inspeções" }, value: (R) => R.length, sub: (R) => `${new Set(R.map((x) => (x.a.collection_site || "").trim().toLowerCase()).filter(Boolean)).size} sites` },
        { label: { en: "Compliance", pt: "Conformidade" }, value: (R) => { let y = 0, n = 0; R.forEach((x) => HST_CHECKS.forEach((f) => { if (x.a[f]) { n++; if (yes(x.a[f])) y++; } })); return n ? `${Math.round((y / n) * 100)}%` : "—"; }, sub: () => "15 checks · Yes / answered" },
        { label: { en: "High / critical risk", pt: "Risco alto / crítico" }, value: (R) => R.filter((x) => x.a.risk_level === "high" || x.a.risk_level === "critical").length, sub: (R) => `${R.filter((x) => x.a.risk_level === "critical").length} critical` },
        { label: { en: "Non-conformities", pt: "Não-conformidades" }, value: (R) => R.filter((x) => yes(x.a.non_conformity)).length, sub: (R) => `${pct(R.filter((x) => yes(x.a.non_conformity)).length, R.length)}% of inspections` },
        { label: { en: "Actions required", pt: "Ações necessárias" }, value: (R) => R.filter((x) => yes(x.a.immediate_action)).length, sub: (R, h) => h.t("overdue_n", { n: R.filter((x) => yes(x.a.immediate_action) && x.a.action_deadline && x.a.action_deadline < today0()).length }) },
        { label: { en: "Avg. checks failed", pt: "Média de verificações falhadas" }, value: (R) => { const v = avg(R.map((x) => x.a.issues_count)); return v == null ? "—" : v.toFixed(1); }, sub: () => "of 15 per inspection" }
      ],
      charts: [
        { title: { en: "Overall risk level", pt: "Nível de risco" }, kind: "cat", fields: ["risk_level"], colorFrom: "colorBy", order: true },
        { title: { en: "Compliance by check (% Yes)", pt: "Conformidade por verificação (% Sim)" }, kind: "yesrate", fields: HST_CHECKS, wide: true },
        { title: { en: "PPE in use", pt: "EPI em uso" }, kind: "multi", fields: ["ppe_in_use"] },
        { title: { en: "Hazards identified", pt: "Perigos identificados" }, kind: "multi", fields: ["hazards"] },
        { title: { en: "Type of activity", pt: "Tipo de atividade" }, kind: "cat", fields: ["activity_type"] },
        { title: { en: "Inspections by site", pt: "Inspeções por local" }, kind: "cat", fields: ["collection_site"], top: 10 },
        { title: { en: "By technician", pt: "Por técnico" }, kind: "cat", fields: ["technician"] }
      ],
      actions: { when: (x) => yes(x.a.immediate_action), what: "action_description", who: "action_responsible", due: "action_deadline", where: "collection_site" },
      filters: ["risk_level", "activity_type", "collection_site", "technician"],
      columns: ["form_ref", "survey_date", "collection_site", "activity_type", "risk_level", "issues_count", "non_conformity", "immediate_action", "action_deadline", "inspector"],
      photos: [{ field: "hazard_photo", label: { en: "Hazard", pt: "Perigo" } }, { field: "nc_photo", label: { en: "Non-conformity", pt: "Não-conformidade" } }],
      hiddenPhotos: ["inspector_signature", "supervisor_signature"]
    }
  ];
})();
