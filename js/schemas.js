/* Gerado automaticamente a partir dos XLSForms (build_schemas.py). Estrutura: grupos > campos; rótulos das escolhas. */
window.SCHEMAS = {
 "survey4": {
  "title": "Tree Retention, Translocation and Removal Survey",
  "groups": [
   {
    "name": "grp_general",
    "label": "General info",
    "relevant": "",
    "fields": [
     {
      "name": "col_date",
      "type": "date",
      "label": "Date and Time"
     },
     {
      "name": "technician_name",
      "type": "select_one",
      "label": "Field Technician Name",
      "list": "name"
     },
     {
      "name": "gps_point",
      "type": "geopoint",
      "label": "GPS Point"
     },
     {
      "name": "tree_uid",
      "type": "calculate",
      "label": "Tree Unique Number"
     },
     {
      "name": "plot_number",
      "type": "integer",
      "label": "Plot Number"
     },
     {
      "name": "plot_position",
      "type": "select_one",
      "label": "Tree Inside or Outside Plot?",
      "list": "plot_position"
     },
     {
      "name": "species",
      "type": "select_one",
      "label": "Tree Species",
      "list": "species"
     },
     {
      "name": "iucn_status",
      "type": "text",
      "label": "IUCN Status:"
     },
     {
      "name": "tree_image",
      "type": "image",
      "label": "Image of Tree"
     },
     {
      "name": "trunk_image",
      "type": "image",
      "label": "Optional: Tree Trunk Image"
     },
     {
      "name": "leaves_image",
      "type": "image",
      "label": "Optional: Image of Leaves or Fruit"
     },
     {
      "name": "dbh_cm",
      "type": "decimal",
      "label": "Diameter at Breast Height / Stem Diameter (cm)"
     },
     {
      "name": "tree_height",
      "type": "decimal",
      "label": "Height of Tree (m)"
     },
     {
      "name": "crown_diameter",
      "type": "decimal",
      "label": "Crown Diameter (m)"
     },
     {
      "name": "reproductive_status",
      "type": "select_one",
      "label": "Reproductive Status",
      "list": "reproductive"
     },
     {
      "name": "mother_tree",
      "type": "select_one",
      "label": "Is this a Mother Tree",
      "list": "yes_no"
     },
     {
      "name": "health_status",
      "type": "select_one",
      "label": "Health Status",
      "list": "health"
     },
     {
      "name": "health_issues",
      "type": "select_multiple",
      "label": "Select which options apply",
      "list": "health_issues",
      "relevant": "${health_status}='damaged_stressed'"
     },
     {
      "name": "nurse_plant",
      "type": "select_one",
      "label": "Is this tree a Nurse Plant",
      "list": "yes_no"
     },
     {
      "name": "soil_stabilisation",
      "type": "select_one",
      "label": "Is the Tree in current situ playing a key soil stabilisation role",
      "list": "yes_no"
     },
     {
      "name": "tree_notes",
      "type": "text",
      "label": "Tree Notes"
     },
     {
      "name": "landscape_prominent",
      "type": "select_one",
      "label": "Is the Tree prominent / Visible in the Landscape?",
      "list": "yes_no"
     },
     {
      "name": "survey_intention",
      "type": "select_one",
      "label": "Survey Intention",
      "list": "intention"
     }
    ]
   },
   {
    "name": "grp_translocation",
    "label": "Translocation Assessment",
    "relevant": "${survey_intention}='translocation'",
    "fields": [
     {
      "name": "root_ball",
      "type": "select_one",
      "label": "Estimated Root Ball",
      "list": "root_ball"
     },
     {
      "name": "root_depth",
      "type": "select_one",
      "label": "Estimated Root Depth",
      "list": "root_depth"
     },
     {
      "name": "tree_weight",
      "type": "select_one",
      "label": "Estimated Weight of Tree",
      "list": "tree_weight"
     },
     {
      "name": "machinery",
      "type": "select_one",
      "label": "Machinery Requirement",
      "list": "machinery"
     },
     {
      "name": "nursery_holding",
      "type": "select_one",
      "label": "Requires Nursery Holding?",
      "list": "yes_no"
     },
     {
      "name": "irrigation_requirement",
      "type": "text",
      "label": "Irrigation Requirement"
     },
     {
      "name": "boxing_requirement",
      "type": "text",
      "label": "Boxing Requirement"
     },
     {
      "name": "survival_probability",
      "type": "range",
      "label": "Survival Probability (%)"
     },
     {
      "name": "recommended_season",
      "type": "select_one",
      "label": "Recommended Season",
      "list": "season"
     },
     {
      "name": "technical_constraints",
      "type": "text",
      "label": "Technical Constraints"
     },
     {
      "name": "translocation_comments",
      "type": "text",
      "label": "Translocation Comments"
     }
    ]
   },
   {
    "name": "grp_removal",
    "label": "Salvage / Removal",
    "relevant": "${survey_intention}='removal'",
    "fields": [
     {
      "name": "mulch_potential",
      "type": "select_one",
      "label": "Mulch Production Potential",
      "list": "yes_no"
     },
     {
      "name": "seed_potential",
      "type": "select_one",
      "label": "Seed Collection Potential",
      "list": "yes_no"
     },
     {
      "name": "propagation_potential",
      "type": "select_one",
      "label": "Propagation Potential",
      "list": "yes_no"
     },
     {
      "name": "habitat_log_potential",
      "type": "select_one",
      "label": "Habitat Log Potential",
      "list": "yes_no"
     },
     {
      "name": "restoration_potential",
      "type": "select_one",
      "label": "Restoration Material Potential",
      "list": "yes_no"
     },
     {
      "name": "biomass_potential",
      "type": "select_one",
      "label": "Biomass Reuse Potential",
      "list": "yes_no"
     },
     {
      "name": "removal_comments",
      "type": "text",
      "label": "Comments"
     }
    ]
   },
   {
    "name": "grp_retention",
    "label": "Retention Assessment",
    "relevant": "${survey_intention}='retention'",
    "fields": [
     {
      "name": "protection_radius",
      "type": "text",
      "label": "Protection Radius Required (m)"
     },
     {
      "name": "root_protection_zone",
      "type": "text",
      "label": "Root Protection Zone (m)"
     },
     {
      "name": "construction_adjustments",
      "type": "text",
      "label": "Construction Adjustments required"
     },
     {
      "name": "irrigation_required",
      "type": "select_one",
      "label": "Irrigation Required",
      "list": "yes_no"
     },
     {
      "name": "pruning_required",
      "type": "select_one",
      "label": "Pruning Required",
      "list": "yes_no"
     },
     {
      "name": "monitoring_required",
      "type": "select_one",
      "label": "Monitoring Required",
      "list": "yes_no"
     },
     {
      "name": "barrier_required",
      "type": "select_one",
      "label": "Protection Barrier Required",
      "list": "yes_no"
     },
     {
      "name": "viability_estimate",
      "type": "range",
      "label": "Long Term Viability Estimate (%)"
     },
     {
      "name": "viability_justification",
      "type": "text",
      "label": "Viability Score Justification"
     }
    ]
   }
  ],
  "choices": {
   "intention": {
    "translocation": "Translocation",
    "removal": "Salvage / Removal",
    "retention": "Retention"
   },
   "yes_no": {
    "yes": "Yes",
    "no": "No"
   },
   "plot_position": {
    "inside": "Inside Plot",
    "outside": "Outside Plot"
   },
   "species": {
    "Acacia_nigrescens": "Acacia nigrescens",
    "Balanites_maughamii": "Balanites maughamii",
    "Boscia_albitrunca": "Boscia albitrunca",
    "Cassia_abbreviata": "Cassia abbreviata",
    "Colophospermum_mopane": "Colophospermum mopane",
    "Combretum_apiculatum": "Combretum apiculatum",
    "Diospyros_mespiliformis": "Diospyros mespiliformis",
    "Guibourtia_conjugata": "Guibourtia conjugata",
    "Kirkia_acuminata": "Kirkia acuminata",
    "Manilkara_mochisia": "Manilkara mochisia",
    "Ozoroa_engleri": "Ozoroa engleri",
    "Pappea_capensis": "Pappea capensis",
    "Peltophorum_africanum": "Peltophorum africanum",
    "Sclerocarya_birrea": "Sclerocarya birrea",
    "Terminalia_sericea": "Terminalia sericea",
    "Ziziphus_mucronata": "Ziziphus mucronata",
    "other": "Other"
   },
   "reproductive": {
    "reproductive": "Reproductive",
    "non_reproductive": "Non-Reproductive"
   },
   "health": {
    "no_damage": "No Damage; Normal Vigour",
    "damaged_stressed": "Damaged or Stressed"
   },
   "health_issues": {
    "pests_disease": "Presence of Pests / Disease",
    "mechanical_damage": "Mechanical Damage",
    "crown_dieback": "Crown Dieback",
    "cavities": "Cavities / Hollows present",
    "water_stressed": "Water Stressed",
    "fire": "Evidence of Fire"
   },
   "root_ball": {
    "small": "Small (<1m)",
    "medium": "Medium (1-2m)",
    "large": "Large (2-3m)",
    "very_large": "Very Large (3-5m)",
    "exceptional": "Exceptional (>5m)"
   },
   "root_depth": {
    "shallow": "Shallow (<0.5m)",
    "moderate": "Moderate (0.5-1m)",
    "deep": "Deep (1-1.5m)",
    "very_deep": "Very deep (1.5-2m)",
    "exceptional": "Exceptional (>2m)"
   },
   "tree_weight": {
    "light": "Light <500kg",
    "medium": "Medium 500kg-2 Tons",
    "heavy": "Heavy 2-10 Tons",
    "very_heavy": "Very Heavy 10-25 Tons",
    "exceptional": "Exceptional >25 Tons"
   },
   "machinery": {
    "crane": "Crane",
    "crane_truck": "Crane Truck"
   },
   "season": {
    "spring": "Spring",
    "summer": "Summer",
    "autumn": "Autumn",
    "winter": "Winter"
   },
   "name": {
    "Anelarda Vicente": "Anelarda Vicente",
    "Elisângela Rassul": "Elisângela Rassul",
    "Félix Zacarias Chaúque": "Félix Zacarias Chaúque"
   }
  }
 },
 "biodiversity": {
  "title": "Biodiversity Survey",
  "groups": [
   {
    "name": "grp_general",
    "label": "General information",
    "relevant": "",
    "fields": [
     {
      "name": "technician",
      "type": "select_one",
      "label": "Field Technician",
      "list": "technician"
     },
     {
      "name": "collection_site",
      "type": "text",
      "label": "Collection Site"
     },
     {
      "name": "form_ref",
      "type": "text",
      "label": "Form ID"
     },
     {
      "name": "survey_date",
      "type": "date",
      "label": "Survey Date"
     },
     {
      "name": "survey_time",
      "type": "time",
      "label": "Time"
     },
     {
      "name": "plot_number",
      "type": "text",
      "label": "Plot Number"
     },
     {
      "name": "gps_point",
      "type": "geopoint",
      "label": "GPS Coordinates"
     },
     {
      "name": "weather",
      "type": "select_one",
      "label": "Weather",
      "list": "weather"
     },
     {
      "name": "survey_methods",
      "type": "select_multiple",
      "label": "Survey methods carried out",
      "list": "methods"
     }
    ]
   },
   {
    "name": "grp_species",
    "label": "Species identification",
    "relevant": "selected(${survey_methods}, 'fauna') or selected(${survey_methods}, 'nest') or selected(${survey_methods}, 'burrow') or selected(${survey_methods}, 'camera_trap') or selected(${survey_methods}, 'bird_point') or selected(${survey_methods}, 'line_transect')",
    "fields": [
     {
      "name": "taxon_group",
      "type": "select_one",
      "label": "Taxonomic Group",
      "list": "taxon"
     },
     {
      "name": "species",
      "type": "select_one",
      "label": "Species Name",
      "list": "species"
     },
     {
      "name": "species_other",
      "type": "text",
      "label": "Specify species / description",
      "relevant": "${species}='other' or ${species}='unidentified'"
     },
     {
      "name": "sp_kingdom",
      "type": "calculate",
      "label": "sp_kingdom"
     },
     {
      "name": "sp_phylum",
      "type": "calculate",
      "label": "sp_phylum"
     },
     {
      "name": "sp_class",
      "type": "calculate",
      "label": "sp_class"
     },
     {
      "name": "sp_order",
      "type": "calculate",
      "label": "sp_order"
     },
     {
      "name": "sp_family",
      "type": "calculate",
      "label": "sp_family"
     },
     {
      "name": "sp_genus",
      "type": "calculate",
      "label": "sp_genus"
     },
     {
      "name": "sp_scientific",
      "type": "calculate",
      "label": "sp_scientific"
     },
     {
      "name": "sp_common_pt",
      "type": "calculate",
      "label": "sp_common_pt"
     },
     {
      "name": "sp_common_en",
      "type": "calculate",
      "label": "sp_common_en"
     },
     {
      "name": "sp_local",
      "type": "calculate",
      "label": "sp_local"
     },
     {
      "name": "sp_taxon_group",
      "type": "calculate",
      "label": "sp_taxon_group"
     },
     {
      "name": "sp_iucn",
      "type": "calculate",
      "label": "sp_iucn"
     },
     {
      "name": "sp_cites",
      "type": "calculate",
      "label": "sp_cites"
     },
     {
      "name": "sp_moz_protection",
      "type": "calculate",
      "label": "sp_moz_protection"
     },
     {
      "name": "sp_endemic",
      "type": "calculate",
      "label": "sp_endemic"
     },
     {
      "name": "sp_near_endemic",
      "type": "calculate",
      "label": "sp_near_endemic"
     },
     {
      "name": "sp_migratory",
      "type": "calculate",
      "label": "sp_migratory"
     },
     {
      "name": "sp_keystone",
      "type": "calculate",
      "label": "sp_keystone"
     },
     {
      "name": "sp_indicator",
      "type": "calculate",
      "label": "sp_indicator"
     },
     {
      "name": "sp_umbrella",
      "type": "calculate",
      "label": "sp_umbrella"
     },
     {
      "name": "sp_flagship",
      "type": "calculate",
      "label": "sp_flagship"
     },
     {
      "name": "sp_eco_engineer",
      "type": "calculate",
      "label": "sp_eco_engineer"
     },
     {
      "name": "sp_habitat",
      "type": "calculate",
      "label": "sp_habitat"
     },
     {
      "name": "sp_diet",
      "type": "calculate",
      "label": "sp_diet"
     },
     {
      "name": "sp_activity",
      "type": "calculate",
      "label": "sp_activity"
     },
     {
      "name": "sp_breeding",
      "type": "calculate",
      "label": "sp_breeding"
     },
     {
      "name": "sp_eco_function",
      "type": "calculate",
      "label": "sp_eco_function"
     },
     {
      "name": "sp_survey_method",
      "type": "calculate",
      "label": "sp_survey_method"
     },
     {
      "name": "sp_comments",
      "type": "calculate",
      "label": "sp_comments"
     },
     {
      "name": "observations",
      "type": "text",
      "label": "Observations"
     }
    ]
   },
   {
    "name": "grp_fauna",
    "label": "Fauna Survey",
    "relevant": "selected(${survey_methods}, 'fauna')",
    "fields": [
     {
      "name": "fa_individuals",
      "type": "integer",
      "label": "Individuals"
     },
     {
      "name": "fa_sex",
      "type": "select_one",
      "label": "Sex",
      "list": "sex"
     },
     {
      "name": "fa_age",
      "type": "select_one",
      "label": "Age",
      "list": "age"
     },
     {
      "name": "fa_behaviour",
      "type": "select_multiple",
      "label": "Behaviour",
      "list": "behaviour"
     },
     {
      "name": "fa_evidence",
      "type": "select_multiple",
      "label": "Evidence",
      "list": "evidence"
     },
     {
      "name": "fa_eco_function",
      "type": "select_multiple",
      "label": "Ecological Function observed",
      "list": "ecofunction"
     },
     {
      "name": "fa_priority",
      "type": "select_one",
      "label": "Priority",
      "list": "priority"
     },
     {
      "name": "fa_photo",
      "type": "image",
      "label": "Photo ID"
     },
     {
      "name": "fa_remarks",
      "type": "text",
      "label": "Remarks"
     }
    ]
   },
   {
    "name": "grp_nest",
    "label": "Nest Survey",
    "relevant": "selected(${survey_methods}, 'nest')",
    "fields": [
     {
      "name": "ne_nest_id",
      "type": "text",
      "label": "Nest ID"
     },
     {
      "name": "ne_habitat",
      "type": "select_one",
      "label": "Habitat",
      "list": "habitat"
     },
     {
      "name": "ne_nest_type",
      "type": "select_one",
      "label": "Nest Type",
      "list": "nest_type"
     },
     {
      "name": "ne_active",
      "type": "select_one",
      "label": "Active?",
      "list": "yes_no"
     },
     {
      "name": "ne_tree_species",
      "type": "text",
      "label": "Tree Species"
     },
     {
      "name": "ne_tree_height",
      "type": "decimal",
      "label": "Tree Height (m)"
     },
     {
      "name": "ne_nest_height",
      "type": "decimal",
      "label": "Nest Height (m)"
     },
     {
      "name": "ne_eggs",
      "type": "integer",
      "label": "Eggs",
      "relevant": "${ne_active}='yes'"
     },
     {
      "name": "ne_chicks",
      "type": "integer",
      "label": "Chicks",
      "relevant": "${ne_active}='yes'"
     },
     {
      "name": "ne_evidence",
      "type": "select_multiple",
      "label": "Evidence",
      "list": "evidence"
     },
     {
      "name": "ne_photo",
      "type": "image",
      "label": "Nest photo"
     },
     {
      "name": "ne_remarks",
      "type": "text",
      "label": "Remarks"
     }
    ]
   },
   {
    "name": "grp_burrow",
    "label": "Burrow Survey",
    "relevant": "selected(${survey_methods}, 'burrow')",
    "fields": [
     {
      "name": "bu_burrow_id",
      "type": "text",
      "label": "Burrow ID"
     },
     {
      "name": "bu_habitat",
      "type": "select_one",
      "label": "Habitat",
      "list": "habitat"
     },
     {
      "name": "bu_burrow_type",
      "type": "select_one",
      "label": "Burrow Type",
      "list": "burrow_type"
     },
     {
      "name": "bu_active",
      "type": "select_one",
      "label": "Active?",
      "list": "yes_no"
     },
     {
      "name": "bu_entrances",
      "type": "integer",
      "label": "Entrances"
     },
     {
      "name": "bu_diameter_cm",
      "type": "decimal",
      "label": "Diameter (cm)"
     },
     {
      "name": "bu_evidence",
      "type": "select_multiple",
      "label": "Evidence",
      "list": "evidence"
     },
     {
      "name": "bu_photo",
      "type": "image",
      "label": "Burrow photo"
     },
     {
      "name": "bu_remarks",
      "type": "text",
      "label": "Remarks"
     }
    ]
   },
   {
    "name": "grp_corridor",
    "label": "Wildlife Corridor",
    "relevant": "selected(${survey_methods}, 'corridor')",
    "fields": [
     {
      "name": "co_gps_start",
      "type": "geopoint",
      "label": "GPS Start"
     },
     {
      "name": "co_gps_end",
      "type": "geopoint",
      "label": "GPS End"
     },
     {
      "name": "co_habitat",
      "type": "select_one",
      "label": "Habitat",
      "list": "habitat"
     },
     {
      "name": "co_width_m",
      "type": "decimal",
      "label": "Width (m)"
     },
     {
      "name": "co_dominant_species",
      "type": "text",
      "label": "Dominant Species"
     },
     {
      "name": "co_evidence",
      "type": "select_multiple",
      "label": "Evidence",
      "list": "evidence"
     },
     {
      "name": "co_use_intensity",
      "type": "select_one",
      "label": "Use Intensity",
      "list": "priority"
     },
     {
      "name": "co_threats",
      "type": "select_multiple",
      "label": "Threats",
      "list": "threats"
     },
     {
      "name": "co_threats_other",
      "type": "text",
      "label": "Specify other threat",
      "relevant": "selected(${co_threats}, 'other')"
     },
     {
      "name": "co_photo",
      "type": "image",
      "label": "Corridor photo"
     },
     {
      "name": "co_remarks",
      "type": "text",
      "label": "Remarks"
     }
    ]
   },
   {
    "name": "grp_camera",
    "label": "Camera Trap",
    "relevant": "selected(${survey_methods}, 'camera_trap')",
    "fields": [
     {
      "name": "ct_camera_id",
      "type": "text",
      "label": "Camera ID"
     },
     {
      "name": "ct_location",
      "type": "text",
      "label": "Location"
     },
     {
      "name": "ct_deploy_date",
      "type": "date",
      "label": "Deploy Date"
     },
     {
      "name": "ct_retrieve_date",
      "type": "date",
      "label": "Retrieve Date"
     },
     {
      "name": "ct_individuals",
      "type": "integer",
      "label": "Individuals"
     },
     {
      "name": "ct_photo_no",
      "type": "text",
      "label": "Photo No."
     },
     {
      "name": "ct_behaviour",
      "type": "select_multiple",
      "label": "Behaviour",
      "list": "behaviour"
     },
     {
      "name": "ct_photo",
      "type": "image",
      "label": "Camera trap image"
     },
     {
      "name": "ct_remarks",
      "type": "text",
      "label": "Remarks"
     }
    ]
   },
   {
    "name": "grp_bird",
    "label": "Bird Point Count",
    "relevant": "selected(${survey_methods}, 'bird_point')",
    "fields": [
     {
      "name": "bp_point_id",
      "type": "text",
      "label": "Point ID"
     },
     {
      "name": "bp_time",
      "type": "time",
      "label": "Time"
     },
     {
      "name": "bp_observer",
      "type": "text",
      "label": "Observer"
     },
     {
      "name": "bp_individuals",
      "type": "integer",
      "label": "Individuals"
     },
     {
      "name": "bp_distance_band",
      "type": "select_one",
      "label": "Distance Band",
      "list": "distance_band"
     },
     {
      "name": "bp_call_seen",
      "type": "select_one",
      "label": "Call / Seen",
      "list": "call_seen"
     },
     {
      "name": "bp_remarks",
      "type": "text",
      "label": "Remarks"
     }
    ]
   },
   {
    "name": "grp_transect",
    "label": "Line Transect",
    "relevant": "selected(${survey_methods}, 'line_transect')",
    "fields": [
     {
      "name": "lt_transect_id",
      "type": "text",
      "label": "Transect"
     },
     {
      "name": "lt_gps_start",
      "type": "geopoint",
      "label": "Start GPS"
     },
     {
      "name": "lt_gps_end",
      "type": "geopoint",
      "label": "End GPS"
     },
     {
      "name": "lt_individuals",
      "type": "integer",
      "label": "Individuals"
     },
     {
      "name": "lt_perp_distance",
      "type": "decimal",
      "label": "Perpendicular Distance (m)"
     },
     {
      "name": "lt_bearing",
      "type": "integer",
      "label": "Bearing (°)"
     },
     {
      "name": "lt_evidence",
      "type": "select_multiple",
      "label": "Evidence",
      "list": "evidence"
     },
     {
      "name": "lt_remarks",
      "type": "text",
      "label": "Remarks"
     }
    ]
   },
   {
    "name": "grp_habitat",
    "label": "Habitat Assessment",
    "relevant": "selected(${survey_methods}, 'habitat')",
    "fields": [
     {
      "name": "ha_site",
      "type": "text",
      "label": "Site"
     },
     {
      "name": "ha_habitat",
      "type": "select_one",
      "label": "Habitat",
      "list": "habitat"
     },
     {
      "name": "ha_canopy_pct",
      "type": "integer",
      "label": "Canopy Cover (%)"
     },
     {
      "name": "ha_grass_pct",
      "type": "integer",
      "label": "Grass Cover (%)"
     },
     {
      "name": "ha_shrub_pct",
      "type": "integer",
      "label": "Shrub Cover (%)"
     },
     {
      "name": "ha_disturbance",
      "type": "select_one",
      "label": "Disturbance",
      "list": "disturbance"
     },
     {
      "name": "ha_fire_evidence",
      "type": "select_one",
      "label": "Fire Evidence",
      "list": "yes_no"
     },
     {
      "name": "ha_invasive_present",
      "type": "select_one",
      "label": "Invasive Species present?",
      "list": "yes_no"
     },
     {
      "name": "ha_invasive_species",
      "type": "text",
      "label": "Invasive Species",
      "relevant": "${ha_invasive_present}='yes'"
     },
     {
      "name": "ha_photo",
      "type": "image",
      "label": "Habitat photo"
     },
     {
      "name": "ha_remarks",
      "type": "text",
      "label": "Remarks"
     }
    ]
   },
   {
    "name": "grp_final",
    "label": "Comments",
    "relevant": "",
    "fields": [
     {
      "name": "comments",
      "type": "text",
      "label": "Comments"
     }
    ]
   }
  ],
  "choices": {
   "technician": {
    "anelarda_vicente": "Anelarda Vicente",
    "felix_zacarias_chauque": "Félix Zacarias Chaúque"
   },
   "methods": {
    "fauna": "Fauna Survey",
    "nest": "Nest Survey",
    "burrow": "Burrow Survey",
    "corridor": "Wildlife Corridor",
    "camera_trap": "Camera Trap",
    "bird_point": "Bird Point Count",
    "line_transect": "Line Transect",
    "habitat": "Habitat Assessment"
   },
   "weather": {
    "sunny": "Sunny",
    "partly_cloudy": "Partly cloudy",
    "overcast": "Overcast",
    "rain": "Rain",
    "windy": "Windy"
   },
   "taxon": {
    "mammal": "Mammal",
    "small_mammal": "Small Mammal",
    "bird": "Bird",
    "reptile": "Reptile",
    "amphibian": "Amphibian",
    "insect": "Insect",
    "arachnid": "Arachnid",
    "mollusc": "Mollusc"
   },
   "habitat": {
    "mopane_woodland": "Mopane Woodland",
    "miombo_woodland": "Miombo Woodland",
    "open_woodland": "Open Woodland",
    "shrubland": "Shrubland",
    "grassland": "Grassland",
    "rocky_area": "Rocky Area",
    "bare_ground": "Bare Ground",
    "disturbed_area": "Disturbed Area",
    "other": "Other"
   },
   "yes_no": {
    "yes": "Yes",
    "no": "No"
   },
   "evidence": {
    "do": "Direct Observation",
    "tr": "Tracks",
    "sc": "Scat",
    "bu": "Burrow",
    "ne": "Nest",
    "de": "Den",
    "ca": "Camera Trap",
    "vo": "Vocalization",
    "fe": "Feeding Sign",
    "dr": "Dung",
    "fm": "Feeding Marks",
    "rp": "Rubbing Post"
   },
   "sex": {
    "male": "Male",
    "female": "Female",
    "unknown": "Unknown"
   },
   "age": {
    "adult": "Adult",
    "subadult": "Subadult",
    "juvenile": "Juvenile",
    "infant": "Infant",
    "unknown": "Unknown"
   },
   "behaviour": {
    "feeding": "Feeding",
    "walking": "Walking",
    "running": "Running",
    "resting": "Resting",
    "flying": "Flying",
    "calling": "Calling",
    "breeding": "Breeding",
    "hunting": "Hunting",
    "browsing": "Browsing",
    "grazing": "Grazing"
   },
   "ecofunction": {
    "apex_predator": "Apex Predator",
    "predator": "Predator",
    "herbivore": "Herbivore",
    "browser": "Browser",
    "grazer": "Grazer",
    "omnivore": "Omnivore",
    "insectivore": "Insectivore",
    "pollinator": "Pollinator",
    "seed_disperser": "Seed Disperser",
    "scavenger": "Scavenger",
    "ecosystem_engineer": "Ecosystem Engineer",
    "bioindicator": "Bioindicator"
   },
   "priority": {
    "high": "High",
    "medium": "Medium",
    "low": "Low"
   },
   "nest_type": {
    "cup": "Cup",
    "platform": "Platform",
    "cavity": "Cavity",
    "ground": "Ground",
    "colonial_weaver": "Colonial / Weaver",
    "other": "Other"
   },
   "burrow_type": {
    "single_burrow": "Single burrow",
    "burrow_system_warren": "Burrow system / Warren",
    "termite_mound": "Termite mound",
    "rock_crevice": "Rock crevice",
    "den": "Den",
    "other": "Other"
   },
   "threats": {
    "roads_traffic": "Roads / traffic",
    "fencing": "Fencing",
    "settlements": "Settlements",
    "agriculture": "Agriculture",
    "mining_construction": "Mining / construction",
    "fire": "Fire",
    "poaching_snares": "Poaching / snares",
    "other": "Other"
   },
   "distance_band": {
    "d0_25": "0-25 m",
    "d25_50": "25-50 m",
    "d50_100": "50-100 m",
    "d100_plus": ">100 m"
   },
   "call_seen": {
    "call": "Call",
    "seen": "Seen",
    "both": "Both"
   },
   "disturbance": {
    "none": "None",
    "low": "Low",
    "medium": "Medium",
    "high": "High"
   },
   "species": {
    "Loxodonta_africana": "Loxodonta africana — African Elephant / Elefante-africano",
    "Panthera_leo": "Panthera leo — Lion / Leão",
    "Panthera_pardus": "Panthera pardus — Leopard / Leopardo",
    "Crocuta_crocuta": "Crocuta crocuta — Spotted Hyena / Hiena-malhada",
    "Syncerus_caffer": "Syncerus caffer — African Buffalo / Búfalo-africano",
    "Hippopotamus_amphibius": "Hippopotamus amphibius — Hippopotamus / Hipopótamo",
    "Aepyceros_melampus": "Aepyceros melampus — Impala / Impala",
    "Equus_quagga": "Equus quagga — Plains Zebra / Zebra-de-planície",
    "Connochaetes_taurinus": "Connochaetes taurinus — Blue Wildebeest / Gnu-azul",
    "Tragelaphus_strepsiceros": "Tragelaphus strepsiceros — Greater Kudu / Cudo-maior",
    "Phacochoerus_africanus": "Phacochoerus africanus — Common Warthog / Facócero",
    "Mungos_mungo": "Mungos mungo — Banded Mongoose / Mangusto-listrado",
    "Genetta_genetta": "Genetta genetta — Common Genet / Geneta-comum",
    "Sylvicapra_grimmia": "Sylvicapra grimmia — Common Duiker / Cabrito-cinzento",
    "Raphicerus_campestris": "Raphicerus campestris — Steenbok / Cabrito-de-campo",
    "Ceratotherium_simum": "Ceratotherium simum — White Rhinoceros / Rinoceronte-branco",
    "Tragelaphus_angasii": "Tragelaphus angasii — Nyala / Inhala",
    "Papio_ursinus": "Papio ursinus — Chacma Baboon / Babuíno-chacma",
    "Chlorocebus_pygerythrus": "Chlorocebus pygerythrus — Vervet Monkey / Macaco-verde",
    "Kobus_ellipsiprymnus": "Kobus ellipsiprymnus — Waterbuck / Cobo-de-água",
    "Giraffa_camelopardalis": "Giraffa camelopardalis — Giraffe / Girafa",
    "Lycaon_pictus": "Lycaon pictus — African Wild Dog / Mabeco",
    "Lupulella_mesomelas": "Lupulella mesomelas — Black-backed Jackal / Chacal-de-dorso-negro",
    "Otocyon_megalotis": "Otocyon megalotis — Bat-eared Fox / Raposa-orelhuda",
    "Felis_lybica": "Felis lybica — African Wildcat / Gato-bravo-africano",
    "Caracal_caracal": "Caracal caracal — Caracal / Caracal",
    "Leptailurus_serval": "Leptailurus serval — Serval / Serval",
    "Hydrictis_maculicollis": "Hydrictis maculicollis — Spotted-necked Otter / Lontra-de-pescoço-manchado",
    "Mellivora_capensis": "Mellivora capensis — Honey Badger / Texugo-do-mel",
    "Hystrix_africaeaustralis": "Hystrix africaeaustralis — Cape Porcupine / Porco-espinho-africano",
    "Smutsia_temminckii": "Smutsia temminckii — Ground Pangolin / Pangolim-terrestre",
    "Lepus_capensis": "Lepus capensis — Cape Hare / Lebre-do-Cabo",
    "Eidolon_helvum": "Eidolon helvum — Straw-coloured Fruit Bat / Morcego-da-fruta-africano",
    "Chaerephon_pumilus": "Chaerephon pumilus — Little Free-tailed Bat / Morcego-de-cauda-livre-pequeno",
    "Neoromicia_nana": "Neoromicia nana — Banana Bat / African Pipistrelle / Morcego-anão-africano",
    "Atherurus_africanus": "Atherurus africanus — African Brush-tailed Porcupine / Porco-espinho-de-cauda-pincel",
    "Heliosciurus_rufobrachium": "Heliosciurus rufobrachium — Red-legged Sun Squirrel / Esquilo-de-braços-vermelhos",
    "Galago_senegalensis": "Galago senegalensis — Senegal Bushbaby / Galago-do-Senegal",
    "Mastomys_natalensis": "Mastomys natalensis — Natal Multimammate Mouse / Rato-de-Mastomys",
    "Mus_minutoides": "Mus minutoides — African Pygmy Mouse / Rato-pigmeu-africano",
    "Graphiurus_murinus": "Graphiurus murinus — Woodland Dormouse / Rato-esquilo-africano",
    "Elephantulus_brachyrhynchus": "Elephantulus brachyrhynchus — Short-snouted Elephant Shrew / Musaranho-elefante-de-focinho-curto",
    "Atelerix_frontalis": "Atelerix frontalis — Southern African Hedgehog / Ouriço-cacheiro-africano",
    "Aethomys_chrysophilus": "Aethomys chrysophilus — Red Veld Rat / Rato-dourado-africano",
    "Aethomys_ineptus": "Aethomys ineptus — Tete Veld Rat / Rato-das-rochas",
    "Dendromus_melanotis": "Dendromus melanotis — Black-eared Dormouse / Rato-trepador-de-orelhas-pretas",
    "Chrysochloris_asiatica": "Chrysochloris asiatica — Cape Golden Mole / Toupeira-dourada-do-Cabo",
    "Rhinolophus_simulator": "Rhinolophus simulator — Eastern Long-fingered Horseshoe Bat / Morcego-ferradura-simulador",
    "Haliaeetus_vocifer": "Haliaeetus vocifer — African Fish Eagle / Águia-pesqueira-africana",
    "Stephanoaetus_coronatus": "Stephanoaetus coronatus — Crowned Eagle / Águia-coroada",
    "Gyps_coprotheres": "Gyps coprotheres — Cape Vulture / Abutre-do-Cabo",
    "Sagittarius_serpentarius": "Sagittarius serpentarius — Secretarybird / Secretário",
    "Ardeotis_kori": "Ardeotis kori — Kori Bustard / Abetarda-de-Kori",
    "Bucorvus_leadbeateri": "Bucorvus leadbeateri — Southern Ground Hornbill / Calaú-terrestre-do-sul",
    "Ploceus_velatus": "Ploceus velatus — Southern Masked Weaver / Tecelão-de-máscara-preta",
    "Lamprotornis_nitens": "Lamprotornis nitens — Cape Starling / Estorninho-brilhante-do-Cabo",
    "Scopus_umbretta": "Scopus umbretta — Hamerkop / Cabeça-de-martelo",
    "Halcyon_albiventris": "Halcyon albiventris — Brown-hooded Kingfisher / Guarda-rios-de-barriga-branca",
    "Coracias_caudatus": "Coracias caudatus — Lilac-breasted Roller / Rolieiro-de-peito-lilás",
    "Polemaetus_bellicosus": "Polemaetus bellicosus — Martial Eagle / Águia-marcial",
    "Terathopius_ecaudatus": "Terathopius ecaudatus — Bateleur Eagle / Águia-de-bateleur",
    "Halcyon_senegalensis": "Halcyon senegalensis — Woodland Kingfisher / Guarda-rios-de-floresta",
    "Turtur_chalcospilos": "Turtur chalcospilos — Emerald-spotted Wood Dove / Rola-de-olho-vermelho",
    "Dicrurus_adsimilis": "Dicrurus adsimilis — Fork-tailed Drongo / Drongo-africano",
    "Zapornia_flavirostra": "Zapornia flavirostra — Black Crake / Franga-de-água-preta",
    "Actophilornis_africanus": "Actophilornis africanus — African Jacana / Jacana-africana",
    "Lybius_torquatus": "Lybius torquatus — Black-collared Barbet / Barbudo-de-garganta-vermelha",
    "Laniarius_ferrugineus": "Laniarius ferrugineus — Southern Tchagra / Tchagra-ferruginoso",
    "Pterocles_bicinctus": "Pterocles bicinctus — Double-banded Sandgrouse / Ganga-de-duas-faixas",
    "Icthyophaga_vocifer": "Icthyophaga vocifer — African Fish Eagle / Águia-pesqueira-africana",
    "Alopochen_aegyptiaca": "Alopochen aegyptiaca — Egyptian Goose / Ganso-do-Egipto",
    "Ortygornis_sephaena": "Ortygornis sephaena — Crested Francolin / Francolim-do-mato",
    "Numida_meleagris": "Numida meleagris — Helmeted Guineafowl / Galinha-do-mato",
    "Pternistis_natalensis": "Pternistis natalensis — Natal Francolin / Francolim-de-Natal",
    "Crinifer_concolor": "Crinifer concolor — Grey Go-away-bird / Turaco-cinzento",
    "Circaetus_cinereus": "Circaetus cinereus — Brown Snake Eagle / Águia-cobreira-cinzenta",
    "Lophoceros_nasutus": "Lophoceros nasutus — African Grey Hornbill / Calaú-de-bico-cinzento",
    "Trachyphonus_vaillantii": "Trachyphonus vaillantii — Crested Barbet / Barbudo-de-crista-vermelha",
    "Buphagus_africanus": "Buphagus africanus — Yellow-billed Oxpecker / Pica-bois-amarelo",
    "Uraeginthus_angolensis": "Uraeginthus angolensis — Southern Blue Waxbill / Peito-celeste",
    "Tockus_leucomelas": "Tockus leucomelas — Southern Yellow-billed Hornbill / Calaú-de-bico-amarelo-do-sul",
    "Zenaida_macroura": "Zenaida macroura — Mourning Dove / Pombo-lamentador",
    "Lamprotornis_australis": "Lamprotornis australis — Burchell's Starling / Estorninho-brilhante-sul-africano",
    "Trigonoceps_occipitalis": "Trigonoceps occipitalis — White-headed Vulture / Abutre-de-cabeça-branca",
    "Gyps_africanus": "Gyps africanus — White-backed Vulture / Abutre-africano",
    "Torgos_tracheliotos": "Torgos tracheliotos — Lappet-faced Vulture / Abutre-de-cara-rugosa",
    "Lophaetus_occipitalis": "Lophaetus occipitalis — Long-crested Eagle / Águia-de-penacho",
    "Hieraaetus_wahlbergi": "Hieraaetus wahlbergi — Wahlberg's Eagle / Águia-de-Wahlberg",
    "Accipiter_tachiro": "Accipiter tachiro — African Goshawk / Açor-africano",
    "Milvus_migrans_parasitus": "Milvus migrans parasitus — Yellow-billed Kite / Milhafre-preto-africano",
    "Tyto_alba": "Tyto alba — Barn Owl / Coruja-das-torres",
    "Bubo_lacteus": "Bubo lacteus — Verreaux's Eagle-Owl / Bufo-real",
    "Strix_woodfordii": "Strix woodfordii — African Wood Owl / Coruja-da-floresta-africana",
    "Merops_viridissimus": "Merops viridissimus — African Green Bee-eater / Abelharuco-verde",
    "Lanius_collaris": "Lanius collaris — Fiscal Shrike / Picanço-de-dorso-cinzento",
    "Lanius_collurio": "Lanius collurio — Red-backed Shrike / Picanço-pequeno",
    "Melaenornis_pammelaina": "Melaenornis pammelaina — Southern Black Flycatcher / Papa-moscas-preto",
    "Hirundo_rustica": "Hirundo rustica — Barn Swallow / Andorinha-das-chaminés",
    "Hirundo_smithii": "Hirundo smithii — Wire-tailed Swallow / Andorinha-de-cauda-branca",
    "Passer_griseus": "Passer griseus — Northern Grey-headed Sparrow / Pardal-africano",
    "Ploceus_cucullatus": "Ploceus cucullatus — Village Weaver / Tecelão-de-cabeça-preta",
    "Vidua_macroura": "Vidua macroura — Pin-tailed Whydah / Viúva-de-cauda-longa",
    "Serinus_mozambicus": "Serinus mozambicus — Yellow-fronted Canary / Canário-de-Moçambique",
    "Crithagra_mozambica": "Crithagra mozambica — Yellow-fronted Canary / Canário-de-Moçambique",
    "Nectarinia_famosa": "Nectarinia famosa — Malachite Sunbird / Beija-flor-de-garganta-laranja",
    "Myrmecocichla_formicivora": "Myrmecocichla formicivora — Ant-eating Chat / Papa-moscas-formigueiro",
    "Treron_calvus": "Treron calvus — African Green Pigeon / Pombo-verde-africano",
    "Oena_capensis": "Oena capensis — Namaqua Dove / Rola-de-máscara",
    "Pternistis_afer": "Pternistis afer — Grey Francolin / Francolim-de-pescoço-cinzento",
    "Coturnix_coturnix_africana": "Coturnix coturnix africana — African Quail / Codorniz-africana",
    "Lissotis_melanogaster": "Lissotis melanogaster — Black-bellied Bustard / Abetarda-de-barriga-preta",
    "Balearica_regulorum": "Balearica regulorum — Grey Crowned Crane / Grou-coroado",
    "Crocodylus_niloticus": "Crocodylus niloticus — Nile Crocodile / Crocodilo-do-Nilo",
    "Python_natalensis": "Python natalensis — Southern African Python / Pitão-africano-do-sul",
    "Dendroaspis_polylepis": "Dendroaspis polylepis — Black Mamba / Mamba-negra",
    "Naja_mossambica": "Naja mossambica — Mozambique Spitting Cobra / Cobra cuspideira-de-Moçambique",
    "Varanus_niloticus": "Varanus niloticus — Nile Monitor / Varano-do-Nilo",
    "Acanthocercus_atricollis": "Acanthocercus atricollis — Black-necked Agama / Lagarto-ágama-de-pescoço-preto",
    "Trachylepis_spp": "Trachylepis spp. — Skinks / Lagartos-de-cauda-azul / Mabuias",
    "Chamaeleo_dilepis": "Chamaeleo dilepis — Flap-necked Chameleon / Camaleão-de-pescoço-dobrado",
    "Pelomedusa_subrufa": "Pelomedusa subrufa — Helmeted Terrapin / Tartaruga-de-capacete",
    "Stigmochelys_pardalis": "Stigmochelys pardalis — Leopard Tortoise / Tartaruga-leopardo",
    "Naja_pallida": "Naja pallida — Red Spitting Cobra / Cobra cuspideira-vermelha",
    "Naja_annulata": "Naja annulata — Banded Water Cobra / Cobra-de-água-anilhada",
    "Philothamnus_hoplogaster": "Philothamnus hoplogaster — Green Bush Snake / Cobra-verde-das-árvores",
    "Cordylus_tropidosternum": "Cordylus tropidosternum — Tropical Girdled Lizard / Lagarto-de-armadura-tropical",
    "Lycodonomorphus_rufulus": "Lycodonomorphus rufulus — Brown House Snake / Cobra-de-casa-africana",
    "Varanus_albigularis": "Varanus albigularis — White-throated Monitor / Varano-de-garganta-branca",
    "Thelotornis_capensis": "Thelotornis capensis — Cape Vine Snake / Cobra-vinha-do-Cabo",
    "Gerrhosaurus_nigrolineatus": "Gerrhosaurus nigrolineatus — Black-lined Plated Lizard / Lagarto-listrado",
    "Pachydactylus_spp": "Pachydactylus spp. — Thick-toed Geckos / Osga-de-dedos-grossos",
    "Chamaeleo_anchietae": "Chamaeleo anchietae — Anchieta’s Chameleon / Camaleão-de-Anchieta",
    "Sclerophrys_gutturalis": "Sclerophrys gutturalis — Guttural Toad / Sapo-de-garganta-rugosa",
    "Ptychadena_anchietae": "Ptychadena anchietae — Anchieta’s Grass Frog / Rã-de-Anchieta",
    "Hyperolius_marmoratus": "Hyperolius marmoratus — Painted Reed Frog / Rã-de-árvore-marmoreada",
    "Pyxicephalus_adspersus": "Pyxicephalus adspersus — African Bullfrog / Rã-touro-africana",
    "Ptychadena_mascareniensis": "Ptychadena mascareniensis — Mascarene Grass Frog / Rã-das-ervas-mascarena",
    "Phrynobatrachus_natalensis": "Phrynobatrachus natalensis — Natal Puddle Frog / Rã-de-poça-de-Natal",
    "Leptopelis_mossambicus": "Leptopelis mossambicus — Mozambique Tree Frog / Rã-de-árvore-de-Moçambique",
    "Sclerophrys_regularis": "Sclerophrys regularis — African Square-marked Toad / Sapo-comum-africano",
    "Breviceps_mossambicus": "Breviceps mossambicus — Mozambique Rain Frog / Sapo-da-chuva-de-Moçambique",
    "Hemisus_marmoratus": "Hemisus marmoratus — Marbled Snout-burrower / Rã-escavadora-marmoreada",
    "Hyperolius_argus": "Hyperolius argus — Argus Reed Frog / Rã-de-cana-argus",
    "Kassina_senegalensis": "Kassina senegalensis — Senegal Running Frog / Rã-corrente-senegalesa",
    "Ptychadena_oxyrhynchus": "Ptychadena oxyrhynchus — Sharp-snouted Grass Frog / Rã-de-focinho-agudo",
    "Xenopus_laevis": "Xenopus laevis — African Clawed Frog / Rã-de-unhas-africana",
    "Hemisus_guineensis": "Hemisus guineensis — Guinea Snout-burrower / Rã-escavadora-da-Guiné",
    "Hyperolius_spp": "Hyperolius spp. — Reed Frogs / Rãs-de-cana",
    "Ptychadena_spp": "Ptychadena spp. — Grass Frogs / Rãs-das-ervas",
    "Sclerophrys_spp": "Sclerophrys spp. — Toads / Sapos",
    "Anomala_spp": "Anomala spp. — Leaf Beetles / Besouros-das-folhas",
    "Apis_mellifera_scutellata": "Apis mellifera scutellata — African Honey Bee / Abelha-africana",
    "Bicyclus_anynana": "Bicyclus anynana — Squinting Bush Brown Butterfly / Borboleta-olho-de-pavão",
    "Camponotus_maculatus": "Camponotus maculatus — Carpenter Ant / Formiga-carpinteira",
    "Danaus_chrysippus": "Danaus chrysippus — African Monarch Butterfly / Borboleta-monarca-africana",
    "Dorylus_antarcticus": "Dorylus antarcticus — Driver Ant / Formiga-corredora",
    "Glossina_morsitans": "Glossina morsitans — Tsetse Fly / Mosca tsé-tsé",
    "Goliathus_goliatus": "Goliathus goliatus — Goliath Beetle / Besouro-golias",
    "Gonimbrasia_belina": "Gonimbrasia belina — Mopane Worm / Mariposa-imbrasia / Mopane worm",
    "Gynanisa_maja": "Gynanisa maja — Giant Silk Moth / Mariposa-gigante",
    "Imbrasia_cytherea": "Imbrasia cytherea — African Silkmoth / Mariposa-da-seda-africana",
    "Julodis_spp": "Julodis spp. — Jewel Beetles / Besouros-jóia",
    "Lepidoptera": "Lepidoptera — Butterflies and Moths / Borboletas e mariposas",
    "Locusta_migratoria": "Locusta migratoria — Migratory Locust / Gafanhoto-migratório",
    "Macrotermes_natalensis": "Macrotermes natalensis — Macrotermes Termite / Térmita-gigante",
    "Musca_domestica": "Musca domestica — House Fly / Mosca-doméstica",
    "Nezara_viridula": "Nezara viridula — Green Stink Bug / Percevejo-verde",
    "Odontotermes_mossambicus": "Odontotermes mossambicus — Termite / Térmita",
    "Papilio_demodocus": "Papilio demodocus — Citrus Swallowtail Butterfly / Borboleta-cauda-de-andorinha",
    "Pheidole_megacephala": "Pheidole megacephala — Big-headed Ant / Formiga-cabeçuda",
    "Schistocerca_gregaria": "Schistocerca gregaria — Desert Locust / Gafanhoto-do-deserto",
    "Trinervitermes_trinervoides": "Trinervitermes trinervoides — Harvester Termite / Térmita-ceifeira",
    "Xylocopa_caffra": "Xylocopa caffra — Carpenter Bee / Abelha-carpinteira",
    "Zonocerus_elegans": "Zonocerus elegans — Elegant Grasshopper / Gafanhoto-elegante",
    "Meliponula_bocandei": "Meliponula bocandei — Stingless Bee / Abelha-sem-ferrão",
    "Delta_dimidiatipenne": "Delta dimidiatipenne — Potter Wasp / Vespa-de-barro",
    "Cheilomenes_lunata": "Cheilomenes lunata — Ladybird Beetle / Joaninha",
    "Anax_imperator": "Anax imperator — Blue Emperor Dragonfly / Libélula-imperador",
    "Orthetrum_chrysostigma": "Orthetrum chrysostigma — Dragonfly / Libélula",
    "Sphodromantis_lineola": "Sphodromantis lineola — African Mantis / Louva-a-deus",
    "Scarabaeus_spp": "Scarabaeus spp. — Dung Beetles / Escaravelhos",
    "Kheper_spp": "Kheper spp. — Dung Beetles / Escaravelhos-do-esterco",
    "Papilio_nireus": "Papilio nireus — Narrow Green-banded Swallowtail / Borboleta-cauda-de-andorinha-verde",
    "Oecophylla_longinoda": "Oecophylla longinoda — African Weaver Ant / Formiga-tecedeira",
    "Platypleura_spp": "Platypleura spp. — Cicadas / Cigarras",
    "Bruchus_spp": "Bruchus spp. — Seed Beetles / Gorgulhos-de-semente",
    "Macrotermes_bellicosus": "Macrotermes bellicosus — Giant Termite / Térmita-gigante-africana",
    "Pandinus_imperator": "Pandinus imperator — Emperor Scorpion / Escorpião-imperador",
    "Heteropoda_spp": "Heteropoda spp. — Huntsman Spiders / Aranhas-caçadoras",
    "Argiope_spp": "Argiope spp. — Orb-weaver Spiders / Aranhas-tecedeiras",
    "Lycosidae_spp": "Lycosidae spp. — Wolf Spiders / Aranhas-lobo",
    "Achatina_fulica": "Achatina fulica — Giant African Land Snail / Caracol-gigante-africano",
    "Gulella_spp": "Gulella spp. — Land Snails / Caracóis-terrestres",
    "unidentified": "Unidentified species",
    "other": "Other (not in list)"
   }
  }
 },
 "hst": {
  "title": "HST Survey",
  "groups": [
   {
    "name": "grp_general",
    "label": "General information",
    "relevant": "",
    "fields": [
     {
      "name": "technician",
      "type": "select_one",
      "label": "Field Technician",
      "list": "technician"
     },
     {
      "name": "collection_site",
      "type": "text",
      "label": "Collection Site"
     },
     {
      "name": "form_ref",
      "type": "text",
      "label": "Form ID"
     },
     {
      "name": "survey_date",
      "type": "date",
      "label": "Survey Date"
     },
     {
      "name": "activity_type",
      "type": "select_one",
      "label": "Type of Activity",
      "list": "activity"
     },
     {
      "name": "gps_point",
      "type": "geopoint",
      "label": "GPS Coordinates"
     }
    ]
   },
   {
    "name": "grp_site",
    "label": "General Site Conditions",
    "relevant": "",
    "fields": [
     {
      "name": "site_clean",
      "type": "select_one",
      "label": "Area clean and organized",
      "list": "yes_no"
     },
     {
      "name": "safe_access",
      "type": "select_one",
      "label": "Safe access routes",
      "list": "yes_no"
     },
     {
      "name": "signage",
      "type": "select_one",
      "label": "Visible signage",
      "list": "yes_no"
     },
     {
      "name": "slip_trip",
      "type": "select_one",
      "label": "Slip/trip/fall hazards controlled",
      "list": "yes_no"
     },
     {
      "name": "animals_ctrl",
      "type": "select_one",
      "label": "Presence of dangerous animals controlled",
      "list": "yes_no"
     },
     {
      "name": "weather_safe",
      "type": "select_one",
      "label": "Safe weather conditions",
      "list": "yes_no"
     },
     {
      "name": "waste_mgmt",
      "type": "select_one",
      "label": "Waste properly managed",
      "list": "yes_no"
     }
    ]
   },
   {
    "name": "grp_safety",
    "label": "Worker Safety",
    "relevant": "",
    "fields": [
     {
      "name": "ppe_worn",
      "type": "select_one",
      "label": "Everyone wears appropriate PPE",
      "list": "yes_no"
     },
     {
      "name": "emergency_aware",
      "type": "select_one",
      "label": "Workers are aware of emergency procedures",
      "list": "yes_no"
     },
     {
      "name": "tools_ok",
      "type": "select_one",
      "label": "Tools in good condition",
      "list": "yes_no"
     },
     {
      "name": "vehicles_ok",
      "type": "select_one",
      "label": "Vehicles/equipment inspected",
      "list": "yes_no"
     }
    ]
   },
   {
    "name": "grp_ppe",
    "label": "PPE (Personal Protective Equipment)",
    "relevant": "",
    "fields": [
     {
      "name": "ppe_in_use",
      "type": "select_multiple",
      "label": "PPE in use",
      "list": "ppe"
     }
    ]
   },
   {
    "name": "grp_firstaid",
    "label": "First Aid",
    "relevant": "",
    "fields": [
     {
      "name": "fa_kit",
      "type": "select_one",
      "label": "First-aid kit available",
      "list": "yes_no"
     },
     {
      "name": "fa_complete",
      "type": "select_one",
      "label": "Kit complete",
      "list": "yes_no"
     },
     {
      "name": "fa_expiry",
      "type": "select_one",
      "label": "Supplies within expiry date",
      "list": "yes_no"
     },
     {
      "name": "fa_training",
      "type": "select_one",
      "label": "Team knows how to use the kit",
      "list": "yes_no"
     }
    ]
   },
   {
    "name": "grp_hazards",
    "label": "Identified Hazards",
    "relevant": "",
    "fields": [
     {
      "name": "hazards",
      "type": "select_multiple",
      "label": "Hazards identified on site",
      "list": "hazards"
     },
     {
      "name": "hazard_other",
      "type": "text",
      "label": "Specify other hazard",
      "relevant": "selected(${hazards}, 'other')"
     },
     {
      "name": "hazard_photo",
      "type": "image",
      "label": "Hazard photo",
      "relevant": "not(selected(${hazards}, 'none')) and ${hazards} != ''"
     }
    ]
   },
   {
    "name": "grp_result",
    "label": "Overall Risk and Actions",
    "relevant": "",
    "fields": [
     {
      "name": "issues_count",
      "type": "calculate",
      "label": "Checks answered No"
     },
     {
      "name": "risk_level",
      "type": "select_one",
      "label": "Overall Risk Level",
      "list": "risk"
     },
     {
      "name": "non_conformity",
      "type": "select_one",
      "label": "Non-conformities: is there any issue?",
      "list": "yes_no"
     },
     {
      "name": "nc_description",
      "type": "text",
      "label": "Describe the non-conformity",
      "relevant": "${non_conformity}='yes'"
     },
     {
      "name": "nc_photo",
      "type": "image",
      "label": "Non-conformity photo",
      "relevant": "${non_conformity}='yes'"
     },
     {
      "name": "immediate_action",
      "type": "select_one",
      "label": "Are any immediate actions required?",
      "list": "yes_no"
     },
     {
      "name": "action_description",
      "type": "text",
      "label": "Action required",
      "relevant": "${immediate_action}='yes'"
     },
     {
      "name": "action_responsible",
      "type": "text",
      "label": "Responsible person",
      "relevant": "${immediate_action}='yes'"
     },
     {
      "name": "action_deadline",
      "type": "date",
      "label": "Deadline",
      "relevant": "${immediate_action}='yes'"
     },
     {
      "name": "observations",
      "type": "text",
      "label": "Observations"
     }
    ]
   },
   {
    "name": "grp_sign",
    "label": "Sign-off",
    "relevant": "",
    "fields": [
     {
      "name": "inspector",
      "type": "text",
      "label": "Inspector"
     },
     {
      "name": "inspector_signature",
      "type": "image",
      "label": "Inspector signature"
     },
     {
      "name": "area_supervisor",
      "type": "text",
      "label": "Area Supervisor"
     },
     {
      "name": "supervisor_signature",
      "type": "image",
      "label": "Area Supervisor signature"
     }
    ]
   }
  ],
  "choices": {
   "technician": {
    "Anelarda Vicente": "Anelarda Vicente",
    "Elisângela Rassul": "Elisângela Rassul",
    "Félix Zacarias Chaúque": "Félix Zacarias Chaúque"
   },
   "activity": {
    "Tree Transplanting": "Tree Transplanting",
    "seed_collection": "Seed Collection",
    "fauna": "Fauna"
   },
   "yes_no": {
    "yes": "Yes",
    "no": "No"
   },
   "ppe": {
    "helmet": "Helmet",
    "gloves": "Gloves",
    "hi_vis_vest": "High-visibility vest",
    "hearing": "Hearing protection",
    "respiratory": "Respiratory protection",
    "fall_harness": "Fall-arrest harness",
    "none": "None"
   },
   "hazards": {
    "falls_height": "Falls / working at height",
    "dangerous_tools": "Dangerous tools",
    "wild_animals": "Wild animals",
    "bites": "Insect / snake bites",
    "moving_vehicles": "Moving vehicles",
    "dust_chemicals": "Dust / chemicals",
    "high_noise": "High noise levels",
    "other": "Other",
    "none": "None identified"
   },
   "risk": {
    "low": "Low (work may continue)",
    "medium": "Medium (improvements required)",
    "high": "High (immediate action required)",
    "critical": "Critical (stop the activity)"
   }
  }
 }
};
