# Tree Translocation Monitor

Plataforma web estática (GitHub Pages) para acompanhar em tempo real as submissões do formulário Survey123
**Survey 4_1 – Tree Transplanting Preparation and Nursery Tracking**.

Lê diretamente o Feature Service do ArcGIS Online (uma camada, uma entrada por árvore, 4 fotografias por fase)
e verifica novas submissões a cada 30 s (configurável).

## O que mostra

- Interface em **inglês** (como o formulário) com botão **EN / PT**; a escolha fica guardada no browser
- Indicadores: entradas submetidas, árvores levantadas, preparação concluída, prontas, encaixotadas e sobrevivência
- **Cobertura do levantamento**: árvores levantadas face às 147 planeadas (`plannedTreeIds` em `js/config.js`), com a lista dos Tree IDs pendentes
- Fluxo de translocação: Caracterizada → Preparação concluída → Pronta → Encaixotada → No viveiro (última entrada de cada árvore)
- Mapa (satélite / topográfico) com as árvores coloridas pelo *Overall Status* e miniatura da foto
- Submissões recentes com as 4 fotos de fase de cada entrada
- Gráficos: estado geral, prontidão, espécies, tratamentos, técnico, estado IUCN e entradas por dia
- **Galeria de fotografias** com separadores por fase (Características, Preparação, Transplante, Viveiro) e visualizador em ecrã inteiro
- Tabela com pesquisa, filtros, ordenação e indicador das fases com foto; painel de detalhe com a sequência das 4 fotos
- **PDF report**: resumo, cobertura, fluxo, mapa, gráficos, registo de árvores, observações e registo fotográfico por fase (uma linha por árvore)
- **Excel data**: a tabela do Feature Service (todos os campos, datas Excel, coordenadas) + folha `photos` com a fase e o link de cada fotografia

## Estrutura

```
index.html        página
css/styles.css    estilos
js/config.js      ← configuração (o único ficheiro a editar)
js/i18n.js        textos EN/PT e rótulos das listas do formulário
js/exports.js     relatório PDF e exportação Excel
js/app.js         lógica: ligação ao serviço, tempo real, mapa, gráficos, tabela
.nojekyll
```

## 1. Obter o URL do Feature Service

1. ArcGIS Online → **Conteúdo** → abra o item *Feature Layer* criado pelo Survey123
   (não o item *Form*).
2. No canto inferior direito, copie o **URL** — termina em `/FeatureServer`.
3. Recomendado: em **Criar vista** crie uma *View layer* só de leitura e use o URL da vista.
   Assim pode partilhá-la sem expor a camada onde o formulário escreve.

Cole o URL em `js/config.js` (já vem configurado com a vista pública só de leitura `Survey_4_1_-_Tree_Transplanting_Preparation_and_Nursery_Tracking_2_view`):

```js
serviceUrl: "https://services.arcgis.com/XXXXXXXX/arcgis/rest/services/survey123_xxxxx/FeatureServer",
```

A camada do formulário é detetada automaticamente (campo `tree_id`); se necessário defina `layerId`.

## 2. Escolher o acesso

**A) Vista pública (mais simples).** Partilhe a View layer com *Todos (público)*. Não precisa de mais nada.
Qualquer pessoa com o link do site vê os dados.

**B) Dados privados (início de sessão ArcGIS).**
1. ArcGIS Online → **Conteúdo → Novo item → Desenvolver aplicações / Credenciais OAuth** (Application).
2. Em **Redirect URLs** adicione o endereço exato do site, por ex.
   `https://<utilizador>.github.io/<repositorio>/`
3. Copie o **Client ID** para `clientId` em `js/config.js`.
4. Só utilizadores da organização com acesso à camada conseguem ver os dados.

## 3. Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie estes ficheiros para a raiz (ou para `/docs`).
2. **Settings → Pages → Build and deployment → Deploy from a branch** → `main` / `(root)` → Save.
3. Depois de 1–2 minutos o site fica em `https://<utilizador>.github.io/<repositorio>/`.

## Modo de demonstração

Com `serviceUrl` vazio (ou adicionando `?demo` ao endereço) a plataforma abre com dados de exemplo
e simula uma nova submissão a cada 20 s.

## Notas

- "Tempo real" = verificação periódica (`pollSeconds`). Em cada ciclo é feita uma consulta leve
  (contagem + data da última edição); os dados completos só são descarregados quando algo mudou.
  Para isto funcionar bem, mantenha o **Editor tracking** ativo na camada (o Survey123 ativa-o por defeito).
- A verificação pausa quando o separador do browser não está visível e retoma ao voltar.
- Os rótulos das listas vêm dos domínios da camada; se não existirem, usa os rótulos do XLSForm (em `js/i18n.js`).
- Se acrescentar campos ao formulário, adicione-os em `SECTIONS` (painel de detalhe) e/ou `COLS` (tabela) em `js/app.js`, e os rótulos em `js/i18n.js`.
- As fases das fotografias são identificadas pela palavra-chave do anexo (nome da pergunta `image`: `tree_photo`, `prep_photo`, `transpla_photo`, `nursery_photo`), definidas em `photoPhases`.
- Se acrescentar árvores à lista `tree_id` do formulário, acrescente-as também a `plannedTreeIds`.
- Bibliotecas usadas (carregadas do cdnjs): Leaflet 1.9.4 (mapa), JSZip 3.10.1 (Excel), pdf-lib 1.17.1 (PDF).
