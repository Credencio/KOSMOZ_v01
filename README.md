# Ecological Monitoring Platform

Plataforma web estática (GitHub Pages) com **um dashboard por formulário Survey123**, cada um a ler o seu
Feature Service do ArcGIS Online em tempo real (verificação de novas submissões a cada 30 s).

## Abas (pela ordem dos feature services)

| # | Aba | Página | Feature Service (view) |
|---|-----|--------|------------------------|
| 1 | Survey 4 – Tree Retention, Translocation and Removal | `index.html` | `Survey_4_Tree_Retention_view` |
| 2 | Survey 4.1 – Tree Transplanting Preparation and Nursery Tracking | `survey-4-1.html` | `Survey_4_1_-_Tree_Transplanting_Preparation_and_Nursery_Tracking_2_view1` |
| 3 | Biodiversity Survey | `biodiversity.html` | `Biodiversity_Survey5_view` |
| 4 | HST Survey | `hst.html` | `HST_Survey_view` |

Todas as páginas partilham a barra de abas, o tema (preto / verde / creme), o botão **EN / PT**,
o **Relatório PDF** e a exportação **Excel**. Acrescentar `?demo` ao URL mostra dados fictícios (o modo demo mantém-se ao mudar de aba).

## O que cada dashboard mostra

- **Survey 4**: árvores avaliadas, nº para translocação / retenção / remoção, % com danos, probabilidade média de sobrevivência; mapa colorido pela intenção; gráficos de espécies, IUCN, condição, danos, etc.; galeria de fotos (árvore, tronco, folhas/fruto…).
- **Survey 4.1** (dashboard dedicado, igual ao anterior): cobertura das 147 árvores planeadas, fluxo de translocação, fotos e copa (`tree_crown`, `tree_crown_p`, `tree_crown_t`, `tree_crown_n`) por fase.
- **Biodiversity**: registos, espécies, registos de espécies ameaçadas, indivíduos contados, ninhos/tocas ativos, locais; gráficos por grupo taxonómico, espécie, estado IUCN, habitat, etc.
- **HST**: inspeções, % de conformidade nas 15 verificações, riscos alto/crítico, não-conformidades, **acompanhamento de ações** (responsável, prazo, em atraso); as assinaturas não aparecem na galeria.

Em todos: mapa (satélite/topográfico), submissões recentes, submissões por dia, galeria por campo de foto,
tabela com pesquisa e filtros, e painel de detalhe com todas as respostas organizadas pelos grupos do formulário.

## Estrutura

```
index.html            Survey 4 (aba 1)
survey-4-1.html       Survey 4.1 (aba 2, dashboard dedicado)
biodiversity.html     Biodiversity (aba 3)
hst.html              HST (aba 4)
css/styles.css        estilos comuns
js/surveys.js         ← configuração de TODAS as abas (URLs, KPIs, gráficos, filtros, colunas, fotos)
js/schemas.js         grupos, perguntas e listas de escolha dos XLSForms (gerado)
js/nav.js             barra de abas
js/dash.js            motor dos dashboards genéricos (Survey 4, Biodiversity, HST)
js/dash-exports.js    PDF e Excel dos dashboards genéricos
js/dash-i18n.js       textos EN/PT dos dashboards genéricos
js/config.js          configuração do Survey 4.1 (URL, 147 Tree IDs planeados)
js/app.js, js/i18n.js, js/exports.js   dashboard dedicado do Survey 4.1
.nojekyll
```

## Publicar no GitHub Pages

1. Crie um repositório e carregue **todo o conteúdo** desta pasta (não a pasta em si) para a raiz.
2. **Settings → Pages → Build and deployment → Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. Após 1–2 minutos a plataforma fica em `https://<utilizador>.github.io/<repositório>/`.

## Alterar um serviço ou acrescentar uma aba

- Para trocar o URL de uma aba, edite `serviceUrl` na entrada correspondente de `js/surveys.js`
  (no Survey 4.1, edite `js/config.js`).
- A ordem das abas é a ordem do array `window.SURVEYS` em `js/surveys.js`.
- Para uma nova aba: copie `hst.html` com outro nome, altere `data-survey="..."` no `<body>`,
  acrescente a entrada em `js/surveys.js` e o esquema em `js/schemas.js`.

## Se mudar um formulário (XLSForm)

Os rótulos das perguntas e das escolhas vêm de `js/schemas.js`. Campos novos aparecem automaticamente
no painel de detalhe e no Excel (rotulados pelo domínio do serviço); para ter os rótulos do formulário,
volte a gerar `schemas.js` a partir dos XLSForms atualizados (ou peça-me para o fazer).
Se mudar o *nome* de um campo usado em KPIs, gráficos ou filtros, atualize-o em `js/surveys.js`.

## Segurança

- Use sempre **views só de leitura** partilhadas com o público (capabilities = *Query*).
- Se os serviços não puderem ser públicos, registe uma aplicação no ArcGIS Online e coloque o `clientId`
  em `js/surveys.js` (e em `js/config.js` para o Survey 4.1); a plataforma mostra então o botão *Sign in with ArcGIS*.
