/*
 * Configuração da plataforma — é o único ficheiro que precisa de editar.
 *
 * serviceUrl : URL do Feature Service criado pelo Survey123 (termina em /FeatureServer).
 *              Recomendado: criar uma "View layer" só de leitura, partilhada com "Todos (público)",
 *              e usar o URL dessa vista. Deixe vazio ("") para abrir em modo de demonstração.
 *
 * clientId   : só é necessário se o serviço NÃO for público. Crie uma "Application"
 *              (OAuth 2.0 credentials) no ArcGIS Online e adicione como Redirect URI o
 *              endereço do site no GitHub Pages (ex.: https://utilizador.github.io/repositorio/).
 */
window.APP_CONFIG = {
  serviceUrl: "https://services8.arcgis.com/Yb7xytb4Ff2eEN6Y/arcgis/rest/services/Survey_4_1_-_Tree_Transplanting_Preparation_and_Nursery_Tracking_2_view1/FeatureServer",

  layerId: 0,           // camada do formulário (survey_4_1_tree_transplanting); null = deteção automática

  pollSeconds: 30,      // intervalo de verificação de novas submissões

  portalUrl: "https://www.arcgis.com",
  clientId: "",

  projectTitle: "Survey 4_1 · Tree Translocation",
  projectSubtitle: "Preparation, transplanting & nursery tracking",

  // Fotografias do formulário, pela ordem das fases (nome da pergunta "image" no XLSForm)
  photoPhases: ["tree_photo", "prep_photo", "transpla_photo", "nursery_photo"],

  // Árvores planeadas (lista tree_id do XLSForm) — usada para medir a cobertura do levantamento
  plannedTreeIds: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 31, 32, 33, 34, 35, 36, 37, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
    81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111,
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138,
    139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156
  ]
};
