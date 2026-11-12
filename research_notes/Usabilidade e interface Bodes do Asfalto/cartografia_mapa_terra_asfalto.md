# Cartografia do mapa escuro: asfalto x terra, rotas e pinos (Bodes do Asfalto)

Pesquisa feita em 12/11/2026. Limites de rede da sessão: os sites wiki.openstreetmap.org, valhalla.github.io, docs.stadiamaps.com e heigit.org não puderam ser abertos (o DNS não resolveu fora da lista de domínios liberados). Para esses temas usei o código-fonte no GitHub (por download direto) e trechos de resultados de busca. O que não pude confirmar está em "Gaps".

## 1. Como apps e estilos de referência mostram estrada de terra (e que opções de rota oferecem)

### Takeaway
O estilo de referência do OSM (OSM Carto) e o esquema de dados OpenMapTiles (o mesmo do OpenFreeMap, que o projeto vai usar) reduzem a etiqueta `surface` a duas classes, `paved` e `unpaved`. O OSM Carto desenha estrada de terra como a mesma via com um **padrão picotado/granulado no preenchimento** (mantém cor e largura da classe). Já as trilhas (`highway=track`) são **marrons e tracejadas**, e o espaçamento do traço aumenta do grade1 ao grade5. Nos apps de moto, "evitar terra" é uma opção do tipo liga/desliga com peso: Kurviger tem força de 1 a 5, o Garmin usa controles deslizantes de curvas, morros e rodovias, e o Calimoto não tem filtro de piso documentado.

### Cited Findings
**OSM Carto (estilo padrão do openstreetmap.org)**
- Função `carto_highway_int_surface`: classifica como **unpaved** os valores `unpaved, compacted, dirt, earth, fine_gravel, grass, grass_paver, gravel, ground, mud, pebblestone, salt, sand, woodchips, clay, ice, snow` e como **paved** `paved, asphalt, cobblestone, cobblestone:flattened, sett, concrete, concrete:lanes, concrete:plates, paving_stones, metal, wood, unhewn_cobblestone`. Qualquer outro valor, ou a falta da etiqueta, vira NULL (desconhecido) e é desenhado como asfalto. — [functions.sql](https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/master/functions.sql)
- A via sem asfalto mantém a cor da sua classe, mas o preenchimento troca a cor sólida por um padrão SVG (`line-pattern-file: symbols/unpaved/unpaved_primary-fill.svg`, `unpaved_secondary-fill.svg`, `unpaved_residential-fill.svg`, entre outros). Abaixo do z12 usa variantes `*-low-zoom.svg`. A terciária reaproveita o padrão da residencial. O SVG da primária usa fundo `#ffe1af` com granulado por cima. — [roads.mss](https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/master/style/roads.mss); [unpaved_primary-fill.svg](https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/master/symbols/unpaved/unpaved_primary-fill.svg)
- Na ordem de desenho, a via sem asfalto fica **abaixo** da asfaltada da mesma classe (`CASE WHEN int_surface IN ('unpaved') THEN 0 ELSE 1 END AS sort_score`). — [project.mml](https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/master/project.mml)
- Trilhas (`highway=track`): cor `@track-fill: #996600` (marrom), contorno branco, `line-opacity: 0.8`, pontas arredondadas. Tracejado padrão sem grade: `5,4,2,4` (traço-ponto). Por grade no z13–14: grade1 `100,0` (contínuo), grade2 `8.8,3.2`, grade3 `5.6,4.0`, grade4 `3.2,4.8`, grade5 `1.6,6.4`. No z15 ou mais: grade2 `11,4`, grade3 `7,5`, grade4 `4,6`, grade5 `2,8`. Larguras: 0.5 px no z13 e 1.5 px no z15 (grade1 e grade2 usam 0.75 px no z15 e recebem contorno maior "com os tracejados mais pesados"). — [roads.mss](https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/master/style/roads.mss)
- Cores e larguras das vias no OSM Carto (fundo claro): preenchimento motorway `#e892a2`, trunk `#f9b29c`, primary `#fcd6a4`, secondary `#f7fabf`, tertiary e residential `#ffffff`. Contornos: motorway `#dc2a67`, trunk `#c84e2f`, primary `#a06b00`, secondary `#707d05`. — [road-colors-generated.mss](https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/master/style/road-colors-generated.mss)
- Larguras totais da primária: z8 1, z9 1.4, z10 1.8, z12 3.5, z13 5, z15 10, z17 18, z19 27 px. Secundária: z12 3.5, z13 5, z15 9, z16 10. Terciária: z10 0.7, z12 2.5, z13 4, z15 9. O preenchimento é a largura total menos 2× o contorno (por exemplo, primária no z12 = 2.5 px). — [roads.mss](https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/master/style/roads.mss)
- Túneis usam contorno tracejado `4,2`. Por isso o tracejado já carrega um significado ("túnel") no OSM Carto, e a terra precisa de um sinal diferente. — [roads.mss](https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/master/style/roads.mss)

**OpenMapTiles / OpenFreeMap (fonte de dados do mapa do app)**
- A camada `transportation` traz o atributo `surface` com dois valores: `paved` (paved, asphalt, cobblestone, concrete, concrete:lanes, concrete:plates, metal, paving_stones, sett, unhewn_cobblestone, wood) e `unpaved` (unpaved, compacted, dirt, earth, fine_gravel, grass, grass_paver, gravel, gravel_turf, ground, ice, mud, pebblestone, salt, sand, snow, woodchips, rock, clay, laterite). Existe ainda `class=track`, mapeada de `highway=track`. — [transportation.yaml (OpenMapTiles)](https://raw.githubusercontent.com/openmaptiles/openmaptiles/master/layers/transportation/transportation.yaml)

**OsmAnd**
- O estilo padrão tem cores próprias por piso, como `surfacePavedColor` e `surfaceLooselyPavedColor` (tons de azul tracejados), que só aparecem com a opção "Show road surface" ligada (fonte de 2014). — [Google Groups OsmAnd](https://groups.google.com/g/osmand/c/9-CmlnyRZCQ)
- O OsmAnd tem renderização de piso (surface) e de qualidade (smoothness). Um estilo personalizado de usuário desenha a terra como linha vermelha pontilhada. — [diário de Joost Schouppe (OSM)](https://www.openstreetmap.org/user/joost%20schouppe/diary/38103)

**Organic Maps**
- Há uma proposta (feature request) de desenhar um tracejado por cima da linha da via quando o piso não é asfaltado, combinando `surface` e `smoothness`. Não encontrei confirmação de que foi implementada. Uma comparação na wiki do OSM indica falta de suporte (vista só pelo trecho da busca). — [organicmaps issue #5967](https://www.github.com/organicmaps/organicmaps/issues/5967)

**Outros**
- O estilo Karoo (Hammerhead, ciclismo, base OSM) usa contorno marrom: contínuo para estrada, tracejado para caminho. — [Karoo Map Style Legend](https://support.hammerhead.io/hc/en-us/articles/360044351394-Karoo-Map-Style-Legend)
- Um app de planejamento de rotas desenha os trechos sem asfalto **da rota** com linha branca tracejada sobre a linha da rota, e os asfaltados com linha lisa. A busca não mostrou qual app é (aparece como "support.followmychallenge.com"). — [resultado da busca](https://support.followmychallenge.com/?p=274)

**Opções de rota dos apps de moto**
- Kurviger: modos "Curvy" (equilíbrio entre diversão e desvio) e "Extra curvy" (prefere estradas sinuosas e foge mais das cidades, aceitando desvios longos). "Evitar estradas sem asfalto" é uma caixa de seleção de **força fixa e muito forte**, que costuma gerar desvios longos para fugir de um trecho curto. Quem assina o Tourer pode baixar a força de 5 para 1 ou 2. A documentação avisa que evitar coisas demais limita muito o cálculo e gera rotas ruins. — [Kurviger Tourer docs](https://docs.kurviger.com/web/kurviger_tourer); [Kurviger definições](https://docs.kurviger.com/general/definitions); [fórum Kurviger: Unpaved Roads](https://forum.kurviger.de/t/unpaved-roads/6886)
- Kurviger, ida e volta (round trip): define-se início, direção, distância, nível de curvas e o que evitar. Cada clique em "Gerar volta" sugere uma nova. Usuários relatam propostas repetidas entre os modos de curvas. Um desenvolvedor sugeriu Extra Curvy + evitar rodovias + evitar vias principais na força 5 para cair em estradas pequenas, possivelmente de terra. — [Kurviger forum: Round Trip / gravel](https://forum.kurviger.com/t/kurviger-round-trip-any-way-to-avoid-known-dangerous-gravel-roads/23332); [Kurviger getting started](https://docs.kurviger.com/web/getting_started)
- Calimoto: 4 perfis (mais rápido com rodovia, mais rápido sem rodovia, Winding (padrão) e Twisty). O perfil pode ser trocado **por trecho entre pontos de passagem**. A ida e volta tem **8 direções** e os 4 perfis, e exclui automaticamente vias bloqueadas. Não há filtro de piso documentado: o suporte diz que vias "unclassified" não são excluídas, só recebem prioridade menor. — [Calimoto: Routing Profiles](https://support.calimoto.com/hc/articles/9952806702492); [Twisty Roads Algorithm](https://support.calimoto.com/hc/en-us/articles/10514787546908-Our-Twisty-Roads-Algorithm); [motorcycle.com sobre Calimoto](https://blog.motorcycle.com/features/the-calimoto-riding-app-is-more-than-a-gps-app.html)
- Garmin zūmo, "Adventurous Routing": prefere estradas com curvas, morros e menos rodovias, com controles deslizantes para curvas, morros e rodovias. Avisa que pode aumentar tempo e distância. — [Garmin zūmo 595 manual](https://www8.garmin.com/manuals/webhelp/zumo595/EN-US/GUID-2779F56A-1AEA-4DB2-8AB3-A58F15303128.html); [Garmin Adventurous Routing](https://www8.garmin.com/manuals/webhelp/GUID-8C1A9F1D-A749-4151-8B0C-42EEAD6ADB34/EN-US/GUID-B4521394-3E75-4BDC-A2F0-8B04DD2E0C45.html)
- Usuário de zūmo XT2 relata rotas que mandam para estradas de terra sem querer. — [MyRoute forum](https://forum.myrouteapp.com/post/63886)

### Inferences
- Para o MapLibre com OpenFreeMap, a regra de dados mais simples é o filtro `["==", ["get","surface"], "unpaved"]` na camada `transportation`, mais `class == "track"` desenhada sempre como terra. Uma via **sem** atributo `surface` deve ser tratada como **desconhecida** (o OSM Carto a mostra como asfalto). Em Mato Grosso muita estrada vicinal não tem a etiqueta, então mostrar "piso desconhecido" de forma neutra (sem o ocre) é mais honesto que pintá-la de asfalto.
- As duas famílias de solução são: (a) **padrão/textura** dentro da via (OSM Carto); (b) **tracejado por cima** da via (proposta do Organic Maps, rota tracejada no app de rotas, `DESIGN.md` do projeto: "terra em tracejado ocre `#C68A45` sobre marrom `#5A3E1F`"). No mapa escuro e pequeno do celular, a (b) é mais legível e mais barata no MapLibre (`line-dasharray` em vez de `line-pattern`). Isso confirma a decisão do DESIGN.md.
- O tracejado do OSM Carto por grade das trilhas é um bom ponto de partida: traço longo = mais firme, traço curto e espaçado = mais ruim. Ver a proposta de `line-dasharray` na seção 3.
- O padrão de mercado é "evitar terra" com **intensidade** (Kurviger 1–5), não um corte binário. Isso combina com as 3 opções do produto: Só asfalto = evitar força alta; Misto = neutro; Prefiro terra = favorecer.

### Gaps
- Não consegui abrir as páginas de ajuda do Komoot, do Gaia GPS, do Rever, do Scenic, do Garmin BaseCamp/Explore, do Google Maps nem do Apple Maps sobre o desenho de terra. Pela minha memória (sem verificar): o Komoot mostra no resumo do passeio um detalhamento "tipos de via e pisos" com km e porcentagem por piso, e o Google e o Apple não diferenciam terra visualmente na navegação. Confirmar antes de citar.
- As cores exatas do estilo padrão atual do OsmAnd (default.render.xml) não foram verificadas (a fonte é de 2014).
- A página "Rendering of road surface in standard OSM style" e a "User:CMoffroad/Unpaved Rendering" (comparação entre renderizadores) estão na wiki do OSM, que estava bloqueada.

## 2. Dados OSM (surface, tracktype, smoothness), qualidade no Brasil/MT e como os roteadores tratam piso

### Takeaway
Só cerca de 1/3 das vias do OSM no mundo têm a etiqueta `surface` (dado da HeiGIT, visto por resumo de busca). Não encontrei um estudo específico da completude de `surface` no Brasil ou em Mato Grosso. No Valhalla, o perfil `motorcycle` tem `use_trails` (0–1, padrão 0), que penaliza fortemente a terra quando está baixo e a favorece levemente quando passa de 0.5. Isso permite as 3 opções do produto (Só asfalto / Misto / Prefiro terra) sem roteador extra.

### Cited Findings
- Cerca de 33% das vias do OSM têm informação de piso, com lacunas maiores nos países em desenvolvimento. O conjunto de dados asfalto/terra da HeiGIT (classificado por IA sobre imagens) cobre 36,7 milhões de km de vias. Visto pelo resumo da busca: heigit.org estava bloqueado. — [HeiGIT: road surface data](https://heigit.org/?p=25565)
- Há estudo brasileiro com imagens de câmera em veículo classificando vias como asfaltadas ou de terra por rede neural (Anita Garibaldi, SC). É um método de classificação, não uma medida de completude. — [ESSD 18, 267, 2026](https://essd.copernicus.org/articles/18/267/2026/essd-18-267-2026.pdf)
- Avaliação do OSM em metrópole do Nordeste: completude dos eixos de via de 82% nas áreas checadas (geometria, não piso). — [Boletim de Ciências Geodésicas (biblat)](https://biblat.unam.mx/ca/revista/boletim-de-ciencias-geodesicas/articulo/the-quality-of-openstreetmap-in-a-large-metropolis-in-northeast-brazil-preliminary-assessment-of-geospatial-data-for-road-axes)
- `tracktype` vai de grade1 (pavimentada ou muito firme) a grade5 (terra mole, não compactada). Quando falta o `tracktype`, a trilha aparece em traço-ponto. Visto pelo trecho da busca, porque a wiki estava bloqueada. O código do OSM Carto confirma o traço-ponto `5,4,2,4` como padrão. — [OSM wiki Grade (via busca)](https://wiki.openstreetmap.org/wiki/Grade); [roads.mss](https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/master/style/roads.mss)
- Valhalla `motorcyclecost.cc`: `kDefaultUseHighways = 0.5`, `kDefaultUseTolls = 0.5`, `kDefaultUseTrails = 0.0`, todos de 0 a 1. Penalidade por piso `kSurfaceFactor`: liso/pavimentado/pavimento ruim 0.0, compactado 0.1, terra 0.2, cascalho 0.5, caminho 1.0. Com `use_trails < 0.5`, `surface_factor = kMaxTrailBiasFactor(8.0) × (1 − 2·use_trails)²`, ou seja, 8 no padrão 0. O código converte para inteiro com `static_cast<uint32_t>`, então valores intermediários são truncados (por exemplo, 0.2 → 8×0.36 = 2.88 → 2). Com `use_trails ≥ 0.5`, `surface_factor = (0.5 − use_trails)³`, que chega a −0.125 em 1.0 (favorece levemente a terra). Arestas com piso pior que `kImpassable` são proibidas. A penalidade entra no custo como `+ surface_factor_ * kSurfaceFactor[surface]`. — [valhalla motorcyclecost.cc (commit 28eaf7a)](https://www.github.com/valhalla/valhalla/blob/28eaf7a827715c682cfbc5634eb1d4bd3ca1fddd/src/sif/motorcyclecost.cc)
- O perfil de moto do Valhalla foi feito para ajustar a rota entre "road touring" (estradas) e "tracks and trails" (aventura), e `use_trails` expressa o "desejo de aventura" do piloto. `exclude_unpaved` é um booleano nas opções de custo (no proto e no perfil `auto`). — [valhalla options.proto](https://www.github.com/valhalla/valhalla/blob/c5b037a110a3c74948a9879d7cd832cc77f7a921/proto/options.proto); [Globus CostingOptions.Motorcycle](https://getyourmap.com/docs/java/api/latest/globus/glroute/CostingOptions.Motorcycle.html); [valhalla-client Rust auto](https://docs.rs/crate/valhalla-client/0.5.1/source/src/costing/auto.rs)
- `use_highways` é preferência suave: 0 tenta evitar rodovias, mas não garante. — [valhalla-client Rust auto](https://docs.rs/crate/valhalla-client/0.5.1/source/src/costing/auto.rs)
- O Valhalla tem o serviço `trace_attributes`, que devolve atributos por aresta de um trajeto (incluindo piso). Serve para calcular km de terra de uma rota ou GPX. — [transit.land: trace attributes](https://www.transit.land//documentation/routing-platform/trace-attributes)

### Inferences
- Mapeamento proposto das 3 preferências para o Valhalla `motorcycle`. Calibrar em teste com rotas reais de MT.
  - **Só asfalto:** `use_trails: 0` (fator 8: cascalho custa +4×, terra +1.6×) e, se o produto quiser corte duro, `exclude_unpaved: true`. Verificar se o perfil `motorcycle` respeita esse booleano na versão instalada. Cuidado: corte duro pode não achar rota até fazendas e sítios. Nesse caso, avisar "não há rota só de asfalto; X km de terra".
  - **Misto:** `use_trails ≈ 0.4–0.5`. Pelo truncamento, qualquer valor entre ~0.15 e 0.5 dá fator 0, ou seja, piso neutro. Na prática, o "Misto" é piso neutro.
  - **Prefiro terra:** `use_trails: 1.0` (fator −0.125, preferência leve) e `use_highways` baixo (por exemplo 0.2). O favorecimento é fraco por desenho. Para um bate-volta "terra", combinar com pontos de passagem.
- Como os dados de piso estão incompletos (~1/3 global, provavelmente menos no interior de MT), a rota pode dizer "só asfalto" e passar por terra não etiquetada. A interface deve mostrar 3 estados (asfalto / terra / piso desconhecido) no resumo e no traço da rota, e deixar o irmão **marcar "aqui é terra"**, colaborando com o OSM ou com uma tabela própria.
- Para calcular "% de terra" no cartão de rota: somar o comprimento das arestas pelo `surface` devolvido pelo Valhalla (atributos de aresta / `trace_attributes`).

### Gaps
- Não achei estatística de completude de `surface` para Brasil/MT. Pode ser medida pelo próprio projeto com ohsome API ou Overpass (comprimento de `highway=*` com e sem `surface` em MT), mas não executei.
- A documentação oficial atual do Valhalla (descrição textual de `use_trails` e `exclude_unpaved` no motorcycle, e os campos de piso em `edge` e `trace_attributes`) não pôde ser aberta (valhalla.github.io e docs.stadiamaps.com bloqueados). Os valores vêm do código de um commit antigo: confirmar na versão instalada.
- GraphHopper (custom model com `surface`/`road_environment`) e BRouter (perfis com `tracktype`/`surface`) não foram pesquisados por falta de chamadas.
- Mapeamento exato de `surface=*` → enum `Surface` do Valhalla (em `graph_lua_proc`/`osmway`) não verificado.

## 3. Pesquisa sobre mapas escuros e navegação noturna, e aplicação às cores do projeto

### Takeaway
A evidência empírica diz que o mapa deve combinar com a luz do ambiente: claro funciona melhor de dia e escuro à noite. Usuários tendem a preferir menos o escuro e a ler "escuro = mais" mesmo no modo escuro. Para um mapa sempre escuro que precisa funcionar ao sol, a regra prática é: vias e rota com **alto contraste de luminância** (≥ 4.5:1 sobre o fundo) e diferenças codificadas também por **forma** (largura e tracejado), não só por cor.

### Cited Findings
- Estudo com rastreamento ocular (Transactions in GIS, 2023) comparou mapas claros e escuros, de dia e à noite: o mapa claro foi melhor de dia, e o escuro foi melhor à noite em algumas tarefas. Combinar mapa e iluminação foi o que mais pesou, e o mapa escuro é bem menos preferido pelos usuários. — [Transactions in GIS 27:516 (2023), resumo ADS](https://ui.adsabs.harvard.edu/abs/2023TrGIS..27..516Q/abstract)
- Schiewe (KN J. Cartogr. Geogr. Inf., 2024, 214 participantes): no modo escuro, o viés "escuro = mais" continua sendo a estratégia mais usada para ler escalas de cor. — [Springer s42489-024-00171-z](https://link.springer.com/article/10.1007/s42489-024-00171-z)
- Resumo ICA 2026: no modo escuro, as fixações na legenda foram mais frequentes e mais longas, e a legenda reduziu diferenças de percepção da hierarquia de cor. — [ICA Abstracts 12, 49, 2026](https://ica-abs.copernicus.org/articles/12/49/2026/ica-abs-12-49-2026.pdf)
- HERE: dirigir à noite amplia o ofuscamento de rótulos muito claros ou de alto contraste. Recomenda hierarquia por cor **e espessura** (rodovia > primária > secundária) e testar nos extremos de dia e de noite. — [HERE Style Editor: advanced map styling](https://docs.here.com/style-editor/docs/advanced-map-styling)
- O estilo "Night" da Ordnance Survey foi feito para ambientes escuros, e pixels escuros economizam bateria em telas OLED. — [Ordnance Survey: basemap style updates](https://www.ordnancesurvey.co.uk/blog/base-map-style-updates)
- O novo Streets da MapTiler tem variante escura com cores ajustadas para navegação noturna e hierarquia de vias mais clara. — [MapTiler: new generation of street map](https://www.maptiler.com/news/2025/12/a-new-generation-of-street-map/)
- Referência de estilo escuro da Mapbox (documentação do estilo "Dark"). — [Mapbox Dark style reference](https://docs.mapbox.com/map-styles/reference/dark.md). Uso só como referência visual: Mapbox está fora do projeto.
- Paletas: 10 a 12 cores são o padrão para a paleta de um mapa inteiro, e ícones devem ser legíveis a partir de ~11 px. — [Mapbox: How to design a map](https://mapbox.com/insights/map-design-process)
- Daltonismo: pares azul/roxo e marrom/malva confundem alguns daltônicos. A discussão sugere rótulo ou ícone como reforço. — [openstreetmap-americana issue #1038](https://www.github.com/ZeLonewolf/openstreetmap-americana/issues/1038)

**Contraste calculado (fórmula WCAG de luminância relativa) das cores do `docs/DESIGN.md` sobre a base do mapa `#1A1712`** (cálculo próprio, reproduzível):
| Cor | Contraste com a base |
| --- | --- |
| creme `#EFE3C8` (100%) | 14.0:1 |
| rodovias creme 60% (≈ `#9A917F`) | 5.7:1 |
| demais vias caramelo 35% (≈ `#574831`) | **2.0:1** |
| rota laranja `#D9622B` | 4.9:1 |
| terra ocre `#C68A45` | 6.1:1 |
| fundo da terra marrom `#5A3E1F` | **1.8:1** |
| dourado `#D8A93B` | 8.2:1 |
| alerta `#F5C518` | 11.0:1 |
| verde-posto `#2E7D5B` | 3.6:1 |
| jeans `#3E5C7A` | **2.6:1** |
| vermelho `#B3261E` | **2.7:1** |
Entre si: laranja × creme 60% = **1.17:1**; laranja × ocre = **1.24:1**; laranja × dourado = 1.68:1; ocre × marrom = 3.3:1.

### Inferences
- **Problema 1, rota contra as estradas:** a rota laranja tem quase a mesma luminância das rodovias creme 60% (1.17:1) e da terra ocre (1.24:1). Separa-se só pelo matiz, o que falha ao sol forte e para daltônicos (protan/deutan confundem laranja, ocre e creme amarelado). Correção: rota **mais larga** que qualquer via (≥ 1.6× a rodovia no mesmo zoom), com **contorno escuro** (`#0C0A08` ou `laranja-escuro #5E230B`, 2 px de cada lado) e, por baixo, um halo claro fino opcional para o sol. Ao entrar no modo navegação, baixar as vias para ~40–50% de opacidade.
- **Problema 2, vias menores invisíveis ao sol:** caramelo 35% (2.0:1) some sob luz direta. Sugestão: vias locais com ≥ 3:1 (por exemplo caramelo 55–60%), e as menores só a partir do z13.
- **Problema 3, terra x rota:** como o ocre é mais luminoso que o laranja, uma estrada de terra pode parecer "mais importante" que a rota. Manter o ocre **fino e tracejado** (nunca mais largo que a via), e desenhar a terra **abaixo** da rota e das vias asfaltadas da mesma classe (como o OSM Carto faz).
- **Proposta de estilo MapLibre (para validar com o dono)**, larguras em px, interpolação exponencial base 1.5:
  - Rodovias (motorway/trunk): z6 1.0 → z10 2.5 → z14 6 → z17 14. Creme 60–70%, sem tracejado.
  - Primária/secundária: z8 0.8 → z12 2.5 → z15 6 → z17 12. Creme 45–55%.
  - Terciária/local: z11 0.6 → z14 2 → z17 8. Caramelo 55–60%.
  - **Terra (`surface=unpaved` em qualquer classe):** duas camadas. Embaixo, "leito" marrom `#5A3E1F` com a largura da classe. Em cima, tracejado ocre `#C68A45` com 55–65% da largura e `line-dasharray: [2, 1.5]` (no MapLibre o tracejado é em múltiplos da largura). O tracejado continua visível quando a linha engorda no zoom.
  - **Trilha (`class=track`):** só tracejado ocre sem leito. Usar a escala de grade do OSM Carto convertida para unidades de largura: grade1 contínuo, grade2 `[3,1]`, grade3 `[2,1.5]`, grade4 `[1,1.5]`, grade5 `[0.5,2]`. Sem grade: traço-ponto `[2.5,1.5,1,1.5]`. Valores derivados de `11,4 / 7,5 / 4,6 / 2,8` do OSM Carto. Atenção: o OpenMapTiles não exporta `tracktype`; se o OpenFreeMap não trouxer grade, usar um tracejado único.
  - **Piso desconhecido:** desenho de asfalto, mas sem destaque, e "desconhecido" no resumo da rota.
  - **Rótulos:** Inter, creme `#EFE3C8` ou caramelo com halo `#0C0A08` de 1.5–2 px e `halo-blur` 0.5. Na navegação, só nomes e números de rodovia (escudos BR-/MT-).
- **Redundância para daltonismo:** terra = cor **+ tracejado**. Rota sobre terra = laranja **+ pesponto claro** (`creme` tracejado `[1,2]` no centro da rota), como já está no DESIGN.md e no padrão "linha branca tracejada no trecho sem asfalto" do app de rotas citado na seção 1.

### Gaps
- Não encontrei estudo empírico com valores mínimos de contraste ou largura de via em mapa escuro para navegação. A orientação de hierarquia vem de fornecedores (HERE, MapTiler, OS). O valor de 4.5:1 é da WCAG (texto), aplicado aqui por analogia.
- Não verifiquei larguras mínimas de linha para legibilidade em celular, nem a cor das rotas do Google ou da Apple à noite.

## 4. Desenho de pinos (POI): categorias, agrupamento, colisão e seleção

### Takeaway
Pesquisas comparativas mostram que o pino se decompõe em **moldura** (forma e cor) e **pictograma**, e que quem usa apps de navegação raramente abre a legenda. Por isso só símbolos intuitivos funcionam. Não achei estudo com um número máximo de categorias de cor. Na prática, uma paleta de mapa inteiro fica em 10–12 cores, então os pinos devem usar poucas cores e diferenciar categorias pelo ícone.

### Cited Findings
- ISPRS IJGI (2023): comparação de símbolos turísticos em mapas e apps online. As duas dimensões principais são a moldura e o pictograma. — [DOAJ: POI Symbol Design in Web Cartography](https://doaj.org/article/823df18ae76749288d547c44203aeb29)
- ICA 2022: 14 mapas online (Google, OSM, Bing, Maps.me, HERE WeGo etc.) agrupados por categorias semânticas. Exemplo: hotel geralmente azul, com moldura circular e cama. — [ICA Abstracts 5, 152, 2022](https://ica-abs.copernicus.org/articles/5/152/2022/ica-abs-5-152-2022.pdf)
- Polish Cartographical Review (2022, 127 respondentes): a intuitividade dos símbolos de apps de navegação varia, e usuários costumam pular a legenda. — [DOAJ: Do navigation maps need a legend?](https://doaj.org/article/bc04776e42b0475590ee9c94d28552b8)
- Mapbox: 10–12 cores por mapa. Ícones simples, reconhecíveis entre culturas e legíveis a partir de 11 px. — [Mapbox: map design process](https://mapbox.com/insights/map-design-process)
- Agrupamento (clustering): pinos se juntam em áreas densas e se separam com o zoom (guia de produto, não é pesquisa). — [Mapline](https://mapline.com/?p=36237)

### Inferences
- O kit do projeto já atribui cor por função (ouro = sedes/conquistas, verde = postos, azul = Lojas, laranja = ação). Manter **≤ 7–8 cores de moldura**: irmãos (avatar, sem cor de categoria), sede/capítulo (ouro), Loja (azul), posto (verde), monumento/turismo, negócio de irmão, Ágape. Diferenciar as demais pelo pictograma em creme. O azul das Lojas (`#7FA6C2`) e o jeans (`#3E5C7A`) são próximos de roxo/cinza para daltônicos: o pictograma deve ser bem distinto.
- Agrupamento (no `GeoJSONSource` do MapLibre, `cluster: true`): sugestão inicial de `clusterRadius` ~50 px e `clusterMaxZoom` 14, por camada (irmãos agrupam entre si; postos entre si). Cluster com número em Barlow Condensed e cor da categoria. Sedes e Ágapes **nunca agrupam** (são poucos e importantes). Valores a calibrar: não há fonte com limiar recomendado.
- Colisão: rótulos de POI com `text-optional: true` (o ícone fica mesmo se o texto não couber) e prioridade (`symbol-sort-key`): SOS > Ágape > sede > posto na rota > irmão > Loja > turismo.
- Selecionado: pino 1.25–1.4× maior, contorno laranja (o "overlock" do DESIGN.md) e cartão inferior. Mantém o pictograma, não muda a cor da categoria.
- Postos com preço: o preço vai como "etiqueta" ao lado do pino só a partir de ~z12, e só nos postos visíveis na rota, para não poluir.

### Gaps
- Não encontrei documentação oficial do desenho de pinos do Google, da Apple e do Waze (redesigns, quantidade de categorias, limiares de agrupamento).
- Não encontrei pesquisa sobre o número máximo de cores de categoria reconhecíveis em pinos.

## 5. Padrões de interface de planejamento de rota (comparação, alternativas, pontos, ida e volta, GPX)

### Takeaway
Os apps de moto se apoiam em: perfil de rota trocável **por trecho** entre pontos de passagem (Calimoto), ida e volta por **direção + distância + perfil** com "gerar de novo" (Calimoto com 8 direções; Kurviger), e a opção de evitar com força ajustável (Kurviger). Para o Bodes, o cartão de rota deve mostrar **km de terra e %** e alertar quando "Só asfalto" não foi possível.

### Cited Findings
- Calimoto: perfil por trecho entre pontos de passagem. A ida e volta tem 8 direções × 4 perfis, e as sugestões podem ser editadas. — [Calimoto Routing Profiles](https://support.calimoto.com/hc/articles/9952806702492); [Calimoto: plan motorcycle ride](https://calimoto.com/en/blog/article/plan-motorcycle-ride); [Calimoto: avoid blocked roads](https://www.calimoto.com/en/blog/article/avoid-blocked-roads)
- Kurviger: ida e volta com início, direção, distância, curvas e o que evitar, e "gerar de novo" para variar. A documentação avisa que evitar coisas demais gera desvios longos. — [Kurviger getting started](https://docs.kurviger.com/web/getting_started); [Kurviger definições](https://docs.kurviger.com/general/definitions)
- Garmin: a rota "aventureira" tem controles deslizantes e o aviso de que aumenta tempo e distância. — [Garmin zūmo 395 manual](https://www8.garmin.com/manuals/webhelp/zumo395/EN-US/GUID-2779F56A-1AEA-4DB2-8AB3-A58F15303128.html)
- Rota com trechos de terra tracejados em branco sobre a linha da rota (app de rotas não identificado). — [support.followmychallenge.com](https://support.followmychallenge.com/?p=274)

### Inferences
- **Cartão de comparação de rotas** (até 3 alternativas, barras grandes, público de 40–60 anos): tempo (grande), km, **"Terra: 23 km (12%)"** com ícone e tracejado ocre, "Piso desconhecido: 8 km", curvas (selo), pedágio, e postos na rota. Sem tempo de percurso como pontuação (princípio de segurança). No mapa, as alternativas ficam em cinza-caramelo a ~50% e mais finas, e ao tocar viram a principal.
- **Seletor de tipo de estrada** (decisão de 12/11): três botões grandes (Só asfalto / Misto / Prefiro terra) com miniatura do traço (linha contínua / mista / tracejada). Se "Só asfalto" ainda tiver terra, mostrar um aviso de alerta curto: "Não há caminho só de asfalto. 4 km de terra perto de X".
- **Barra de piso ao longo da rota:** uma faixa horizontal no cartão (como um perfil de altimetria) com segmentos creme (asfalto), ocre tracejado (terra) e cinza (desconhecido). Tocar num segmento leva ao trecho.
- **Progresso na navegação:** o trecho já percorrido fica cinza ou escurecido (~30% de opacidade), e o trecho à frente segue laranja com o pesponto na terra. Avisar por voz "terra em 2 km, 6 km de extensão" (a voz é o canal permitido pilotando).
- **Ida e volta (bate-volta):** distância (slider), direção (rosa de 8 setores como no Calimoto), "mais curvas" e o tipo de estrada. Botão "Outra opção". Mostrar % de terra antes de aceitar.
- **GPX:** ao importar, recalcular o piso com `trace_attributes` do Valhalla para mostrar % de terra de rotas de terceiros. Ao exportar, cortar início e fim perto da zona privada (regra do CLAUDE.md).

### Gaps
- Não verifiquei como Scenic, Rever, Komoot, Gaia GPS, Google e Apple mostram alternativas e resumo de piso (páginas não acessadas). Nenhuma fonte confirmou um app de moto que mostre "% de terra" no resumo. O Komoot provavelmente mostra (memória, não verificado).
- Não há evidência coletada sobre a edição de pontos de passagem (arrastar a rota e reordenar) nos apps de moto.
