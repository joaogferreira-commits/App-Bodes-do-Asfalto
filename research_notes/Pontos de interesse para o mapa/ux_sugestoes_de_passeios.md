# UX de sugestões de passeios e pontos de interesse (POIs) em apps de moto/outdoor

Notas de pesquisa (12/11/2026). Método: buscas web; a leitura completa de páginas (WebFetch) foi bloqueada pela rede da sessão para komoot.com e rever.co, então vários achados vêm de resumos de busca de páginas oficiais (help centers, blogs, App Store). Onde a fonte é só listagem de loja ou blog secundário, isso está indicado.

## 1. Como cada app apresenta passeios sugeridos e POIs (o que mostram, como ordenam, como moderam, o que é Premium)

### Takeaway
O padrão dominante é: (a) uma camada de POIs por categoria que se liga/desliga no mapa, (b) uma aba/tela "Descobrir" separada do mapa de navegação, com rotas ordenadas por proximidade + qualidade/popularidade, (c) coleções curadas (editores/parceiros) ao lado do conteúdo da comunidade, e (d) avaliação depois do passeio como principal mecanismo de qualidade. Descoberta e consulta costumam ser grátis; navegação, offline, camadas especiais e criação de coleções costumam ser Premium.

### Cited Findings
**Calimoto**
- POIs em 10 categorias oficiais: pontos turísticos, passos de montanha, "twisty highlights" (trechos de curvas), encontros de motociclistas, postos, onde comer/beber, hotéis biker-friendly, estacionamento de moto, campings e sorveterias — [calimoto Help: POI](https://support.calimoto.com/hc/en-us/articles/10763643158428-POI-Points-of-Interest)
- Gerador de bate-volta: só ponto de partida + distância; 8 direções e 4 perfis de roteamento; "Calimeter" indica quão sinuosa é a rota antes de rodar; opção de rota aleatória — [App Store calimoto](https://apps.apple.com/app/id1209129603); [Motorcycle.com](https://blog.motorcycle.com/features/the-calimoto-riding-app-is-more-than-a-gps-app.html)
- "Milhares de recomendações de passeios" vindas de outros motociclistas — [App Store calimoto](https://apps.apple.com/gb/app/id1209129603)
- Premium: mapas offline mundiais, navegação por voz, limites de velocidade, alertas de pontos de atenção (radares), terreno/satélite, perfil extra de rota, análise de inclinação; Android Auto/CarPlay e localização em grupo. Preço: US$ 79,99/ano com 14 dias grátis; semanal US$ 12,99 — [calimoto Premium overview](https://support.calimoto.com/hc/en-us/articles/9036581115164-calimoto-Premium-Product-Overview); [calimoto pricing](https://calimoto.com/en/pricing)
- Atualização de roteamento (jul/2026): perfil "Twisty" evita cidades grandes; balsas e pedágios agora aparecem no mapa — [calimoto blog: routing update](https://calimoto.com/en/blog/article/routing-update)
- Críticas de usuários: bate-voltas com "curvas artificiais" (rotatórias), estradas fechadas por obra, tempo estimado otimista — [App Store calimoto (reviews)](https://apps.apple.com/gb/app/id1209129603)

**REVER (com Butler Maps)**
- Abas Track e Discover fundidas numa aba de mapa; descoberta por um ícone de binóculo — [REVER blog: new way to discover rides](https://www.rever.co/post/new-riding-season-new-way-to-discover-rides)
- Categorias: "Incredible Roads" (recomendações Butler Maps, estradas rodadas e avaliadas por quão cênicas, sinuosas e dramáticas são) e "Featured Routes" (curadas à mão pela REVER, parceiros e "super-users"); depois entraram Backcountry Discovery Routes e rotas de piso misto — [REVER blog](https://www.rever.co/post/new-riding-season-new-way-to-discover-rides)
- Freemium: grátis vê algumas estradas Butler G1; camadas Butler Maps são PRO — mesma fonte
- Curadoria por envio: usuário sugere rota por e-mail (título, foto, descrição, categoria proposta) — mesma fonte. (Post sem data clara.)
- Comunidades (grupos) dentro do app — [REVER: How to Use Communities](https://rever.co/post/how-to-use-communities-in-rever)

**Kurviger**
- Camadas de POI no mapa: hospedagem biker-friendly, tours de moto, pontos de encontro/cafés de motociclistas (editorial, com fotos), postos (OSM), passos de montanha, museus técnicos, mecânicas e lojas de moto, atrações turísticas, mirantes — [Kurviger docs: Getting started](https://docs.kurviger.de/web/getting_started)
- Cafés/encontros são pesquisados e mantidos pela própria equipe porque permite fotos e informações que o OSM não tem; usuários podem enviar novos POIs — [Kurviger: Submit a new POI](https://docs.kurviger.de/web/pois)
- Camadas ligam/desligam por categoria (ex.: desligar postos remove símbolo e nome) — [Kurviger forum](https://forum.kurviger.com/t/points-of-interest/2537)
- Busca ao longo da rota: biker hangout, estacionamento de moto, oficina, hospedagem, camping, restaurante, café, sorveteria, museu, ponto de interesse, mirante, carregador, supermercado — [Kurviger docs: search along route](https://docs.kurviger.com/search_along_route); limitações (cafés em padarias não aparecem) — [Kurviger forum](https://forum.kurviger.com/t/search-along-route-or-in-area-suche-entlang-der-route-oder-in-einem-bereich/19775)
- Usuários pedem mostrar só categorias escolhidas perto da rota durante a navegação — [Kurviger forum: POIs during navigation](https://forum.kurviger.com/t/pois-during-navigation/24751)
- Premium Tourer+: até 15 overlays simultâneos — [Kurviger Tourer](https://docs.kurviger.com/web/kurviger_tourer)

**Scenic**
- Biblioteca de rotas compartilhadas e avaliadas por usuários locais; listagem cita 200.000+ rotas criadas por usuários; buscar uma área, gerar bate-volta, importar GPX/KML/link Google Maps; modos curvy/straight/paved/dirt — [App Store Scenic](https://apps.apple.com/app/id1089668246)
- Não encontrei documentação pública sobre "Scenic picks" nem regras de moderação — busca sem resultado (ver Gaps)

**Komoot**
- Highlights = lugares favoritos da comunidade (trilhas, mirantes, trechos de asfalto liso); após a atividade o app pede para avaliar os Highlights por onde passou e, opcionalmente, deixar dica/foto; Highlights com muitas avaliações negativas ou poucas recomendações podem ser ocultados — [komoot Help: Highlights](https://www.komoot.com/help/highlights) (via resumo de busca)
- Adicionar um Highlight a uma rota faz o planejador recalcular passando por ele — mesma fonte
- "Tours near you": começa na localização atual; lista ordenada com os passeios de melhor qualidade no topo, baseada nas atividades de outros na área — [komoot Help: Tour recommendations](https://www.komoot.com/help/tour-recommendations); [komoot newsroom](https://newsroom.komoot.com/226177-komoot-launches-new-discover-features-finding-personalised-tours-is-easier-than-ever)
- Ranking usa popularidade de estradas/trilhas, tipo de piso e Highlights — [BikeRadar](https://www.bikeradar.com/news/komoot-tour-discover)
- Collections: criadas por editores, grupos, parceiros e amigos; salvar com ícone de marcador; criar Collections pessoais é Premium; navegar coleções e mapa é grátis — [BikeRadar guide](https://www.bikeradar.com/advice/buyers-guides/guide-to-using-komoot); [Country Walking/PressReader](https://www.pressreader.com/uk/country-walking-magazine-uk/20211001/283772792064900)

**Wikiloc / AllTrails / Ride with GPS (outdoor)**
- Wikiloc: filtros de tipo de atividade, distância, desnível, circular/ida, dificuldade — [Wikiloc Help: search trails](https://help.wikiloc.com/article/192-search-trails-website); [Wikiloc blog 2011](https://wikiloc.blogspot.com/2011/06)
- AllTrails: filtro "Distance away" restrito a Plus/Peak (pago) — [AllTrails Help: filters](https://support.alltrails.com/hc/en-us/articles/37227964040852-How-to-use-filters-to-find-trails)
- Ride with GPS Explore: comprimento, desnível, piso (asfalto / quase todo asfalto / misto / quase todo terra / terra), tipo (circular, ida-e-volta, ponto a ponto); % sem asfalto e trechos de terra em linha pontilhada (dados OSM, incompletos — exemplo: 82% estimado vs 77% no app) — [Gravelstoke](https://gravelstoke.com/gravel-cycling-gear-blog/ridewithgps-surface-types); [bikepacking.com](https://bikepacking.com/?p=106292); [GearJunkie](https://gearjunkie.com/biking/ride-with-gps-surface-types)
- Ride with GPS "Inspect": segurar o dedo no mapa para achar rotas perto de um ponto (aparentemente pago em 2022) — [the5krunner](https://the5krunner.com/2022/06/08/rwgps-inspect-route-discovery/)

**Google Maps / Waze**
- Google Maps "Saved": feed de carrosséis; "Nearby saved" com distância; "Your lists" recolhida em 4 itens; "Nearby saved" só aparece se houver salvos a até 25 km — [9to5Google](https://9to5google.com/2020/08/26/google-maps-saved-android-ios/); [Google Maps Help](https://support.google.com/maps/answer/9948049)
- Listas compartilháveis — [Android Central](https://www.androidcentral.com/how-create-and-share-lists-google-maps)
- Waze Modo Moto no Brasil desde 13/07/2026: rotas para moto, alertas de buraco, quebra-molas, faixa elevada, fim de acostamento, ponte estreita (comunidade + editores motociclistas); voz "Menos Falante" só com riscos, curvas e troca de faixa — [Olhar Digital](https://olhardigital.com.br/2026/07/13/carros-e-tecnologia/waze-ganha-modo-para-motos-e-muda-a-forma-de-calcular-rotas/); [AutoPapo](https://autopapo.com.br/curta/waze-agora-desvia-motociclistas-de-buracos-e-quebra-molas-veja-todas-as-novidades/); [MacMagazine](https://macmagazine.com.br/post/2026/07/13/waze-ganha-modo-moto-navegacao-personalizada-e-mais-integracoes-com-o-gemini/)

**Harley-Davidson App**
- Planejar rota com concessionárias e postos como paradas; salvar/compartilhar; rotas do Ride Planner web aparecem no app; achar concessionária, favoritar, ver eventos da concessionária; check-in em eventos/concessionárias (membership grátis); desafios com pontos e ranking — [H-D App](https://www.harley-davidson.com/us/en/explore/discover/harley-davidson-app); [H-D Membership](https://www.harley-davidson.com/us/en/content/membership); [Cycle News](https://www.cyclenews.com/2023/06/article/h-d-membership-program-launched/)

**EatSleepRIDE**
- Ranking por milhas e por paradas em POIs "bike-friendly"; salvar rotas; diário — [App Store EatSleepRIDE](https://apps.apple.com/us/app/id541036952)

**Moderação de conteúdo comunitário em geral**
- Best Biking Roads: estradas "adicionadas e revisadas por pares"; Motoguru: "toda rota avaliada por pilotos, não por algoritmos"; fórum MyRoute: moderação é crítica para manter qualidade — [MyRoute forum](https://forum.myrouteapp.com/topic/10516/suggestions-great-roads/12); [Motoguru](https://motoguru2.netlify.app/)

### Inferences
- Para o Bodes: modelo híbrido funciona melhor — "Passeios do clube" (curados por diretoria/moderador, equivalente às Featured/Collections) + "Rotas de irmãos" (compartilhadas, avaliadas depois de rodar). Ocultar automaticamente rotas/POIs com muitas avaliações negativas (como Komoot) e manter denúncia.
- Pedir avaliação só depois do passeio (padrão Komoot) evita poluir a tela e gera dados com quem realmente rodou.
- "Usar rota" deve recalcular a partir da posição atual e permitir acrescentar um POI como parada (padrão Komoot/H-D).
- Cafés/encontros como categoria editorial (Kurviger) combinam com sedes, Lojas e negócios de irmãos já cadastrados pelo painel.
- O que concorrentes cobram (offline, camadas, criar coleções) não conflita com a regra do projeto; manter descoberta, consulta, GPX e rota offline do trajeto grátis.

### Gaps
- Não obtive o texto integral das páginas da Komoot e REVER (bloqueio de rede); detalhes vêm de resumos de busca.
- Não encontrei como "Scenic picks" são escolhidas nem regras de moderação do Scenic; nem detalhes de Relive.
- Nenhuma fonte deu fórmulas numéricas de ranking (pesos de distância x popularidade x nota).

## 2. Categorias de POI que motociclistas mais valorizam

### Takeaway
As categorias que aparecem em praticamente todos os apps de moto são: postos, comida/café/pontos de encontro de motociclistas, estradas sinuosas/cênicas, mirantes/atrações, hospedagem biker-friendly, oficinas/lojas e estacionamento de moto. Alertas de risco (buraco, radar) são tratados como camada de alerta por voz, não como POI. Não encontrei pesquisa confiável com ranking de uso.

### Cited Findings
- Calimoto (10 categorias) — [calimoto Help](https://support.calimoto.com/hc/en-us/articles/10763643158428-POI-Points-of-Interest)
- Kurviger (9 camadas + busca ao longo da rota com 13 tipos) — [Kurviger docs](https://docs.kurviger.de/web/getting_started); [search along route](https://docs.kurviger.com/search_along_route)
- H-D: concessionárias, postos, eventos — [H-D App](https://www.harley-davidson.com/us/en/explore/discover/harley-davidson-app)
- Waze Moto: buraco, quebra-molas, faixa elevada, fim de acostamento, ponte estreita como alertas — [AutoPapo](https://autopapo.com.br/curta/waze-agora-desvia-motociclistas-de-buracos-e-quebra-molas-veja-todas-as-novidades/)
- Calimoto: radares são "caution points" anunciados por voz (Premium) — [App Store calimoto](https://apps.apple.com/us/app/id1209129603?l=en-us)
- Guias de apps citam com mais frequência roteamento cênico/sinuoso e paradas de combustível/comida; offline e lugares específicos (bares de motociclistas, hotéis para moto) em segundo plano — [Cardo blog](https://cardosystems.com/blogs/cardo-blog/our-top-choice-motorcycle-trip-planners); [Viking Bags](https://www.vikingbags.com/blogs/news/10-essential-motorcycle-touring-apps-for-all-riders)
- Pesquisas com números (ex.: "71% de quem roda >3.000 km/ano usa app") aparecem só em sites de baixa qualidade sem editor identificado — não usar — [bottegadelsarto (não confiável)](https://shop.bottegadelsarto.com/opinion/best-apps-for-motorcycle-road-trips-357896)
- Brasil: não achei mapa colaborativo de pousadas/oficinas "moto friendly"; pontos de apoio existentes são para motoboys de app (99/Rio, Trampay/DF) — [Mobile Time](https://www.mobiletime.com.br/noticias/27/11/2025/99-relatorio-moto-brasil/); [Metrópoles](https://www.metropoles.com/distrito-federal/startup-brasiliense-cria-ponto-de-apoio-para-entregadores-na-asa-sul)

### Inferences
Lista priorizada sugerida para o Bodes (P1 = lançamento):
1. **P1 Postos** (preço/nota ANP, "mais próximo" e "na rota"; distância até o próximo posto em trechos longos — especialmente relevante no Centro-Oeste).
2. **P1 Sedes/capítulos, Lojas, negócios de irmãos, Ágapes/eventos/encontros** (diferencial do clube; equivalente aos "biker meetups" e concessionárias/eventos H-D).
3. **P1 Café/restaurante/parada biker-friendly** (curado, com foto; indicação de irmãos).
4. **P1 Mirantes, monumentos e pontos turísticos** (OSM, já previsto).
5. **P2 Oficina mecânica / borracharia / loja de peças** (socorro na estrada; ligado ao Socorro Fraterno).
6. **P2 Hospedagem com garagem coberta/segura para moto** (campo "garagem para moto" como atributo, não categoria nova).
7. **P2 Estradas cênicas/sinuosas e trechos de terra** (como linha no mapa, não pino).
8. **P2 Cachoeiras/atrativos naturais com acesso de moto** (com tipo de acesso: asfalto/terra).
9. **P3 Hospital/UPA, polícia rodoviária (PRF)** — mostrar sob demanda e no SOS, não como camada sempre ligada.
10. **Alertas, não POI:** buraco, cascalho, radar, obra — por voz durante a pilotagem (padrão Waze/calimoto).
- Rotas sem pedágio: filtro de planejamento (calimoto já mostra pedágios no mapa), não categoria de POI.

### Gaps
- Nenhuma pesquisa confiável (revista, associação) com ranking de categorias mais usadas; nada específico do Brasil ou de pilotos 40–60 anos.
- Não verifiquei Reddit/ADVrider diretamente (fetch bloqueado).

## 3. Padrões de mapa e telas de descoberta (marcadores, agrupamento, zoom, filtros, cartões)

### Takeaway
Agrupar (clustering) com raio em pixels e um zoom de corte por volta de 14–15, camadas ligáveis por categoria, e uma tela de descoberta separada com lista ordenada por "perto de mim" + qualidade e filtros de distância, piso e tipo de rota. Cartões mostram distância, duração/km, piso (% terra), curvas e foto.

### Cited Findings
- Clustering: raio medido em pixels de tela; padrão de bibliotecas ~80 px; em celular não usar raio < 20; zoom máximo de agrupamento padrão 14 (MapMe), ou 15 onde se distinguem prédios; tocar no grupo dá zoom até separar — [PixTrail docs](https://sukitsubaki.github.io/pixTrail/visualization/clustering); [Wemap help](https://en.help.getwemap.com/article/356-how-do-i-customize-the-clusters-on-my-map); [MapMe](https://cdn.mapme.com/support/knowledgebase/create-cluster-markers/); [Medium Homes engineering](https://medium.com/homes-engineering/map-marker-clusters-c90b2f192324); [Google Maps iOS utility](https://developers.google.com/maps/documentation/ios-sdk/utility/marker-clustering)
- Agrupamento esconde dados e pode frustrar quem espera ver todos os pontos — [neura.market (blog)](https://neura.market/directories/deepseek/blog/devto-3510665)
- Filtros de descoberta usados por outdoor: distância, desnível, piso (5 níveis), tipo de rota (circular, ida-e-volta, ponto a ponto), dificuldade — [Gravelstoke](https://gravelstoke.com/gravel-cycling-gear-blog/ridewithgps-surface-types); [Wikiloc Help](https://help.wikiloc.com/article/192-search-trails-website)
- Calimoto: 8 direções x distância para bate-volta; índice de sinuosidade (Calimeter) — [App Store calimoto](https://apps.apple.com/app/id1209129603)
- Komoot: lista começa na localização atual, melhores no topo — [komoot newsroom](https://newsroom.komoot.com/193187-komoot-unlocks-tour-search-in-the-uk-bringing-inspiration-and-hundreds-of-thousands-of-routes-to-its-community-s-fingertips/)
- Google Maps: lista de salvos recolhida em 4 itens; "perto" = 25 km — [9to5Google](https://9to5google.com/2020/08/26/google-maps-saved-android-ios/); [Google Maps Help](https://support.google.com/maps/answer/9948049)
- Android Auto, Place List (map): mostrar distância ou duração em cada item; cada linha precisa ter ação; limitar aos locais mais próximos/relevantes; número de linhas depende do veículo (ConstraintManager); texto truncado em 2 linhas dirigindo — [Google Cars: Place list map template](https://developers.google.com/cars/design/create-apps/apps-for-drivers/templates/place-list-map-template); [List template](https://developers.google.com/cars/design/create-apps/apps-for-drivers/templates/list-template?authuser=8)
- Kurviger: ocultar textos de POI no mapa é um pedido recorrente (poluição visual) — [Kurviger forum](https://forum.kurviger.de/t/make-it-possible-to-enable-disable-poi-texts-on-the-map/903)

### Inferences
- Mapa inicial (escuro): pinos discretos (ícone de traço sobre círculo de cor da categoria), sem rótulo de texto abaixo de ~zoom 13; agrupar com raio ~60–80 px e corte em zoom 14; rotas sugeridas não desenhadas por padrão no mapa — só um contador/cartão "Passeios perto" e a linha aparece ao abrir o cartão (evita espaguete de linhas).
- Camadas: no máximo 6–8 chips de filtro visíveis; padrão ligado = Irmãos, Sedes/Ágapes, Postos; demais desligadas até o irmão ligar (lembrar escolha).
- Tela "Passeios sugeridos": lista de 3–5 cartões por tela (cartões grandes com foto), ordenada por distância do ponto de partida com selo "Recomendado pelo clube" no topo; raios em botões grandes: 50 / 100 / 200 / 400 km (meio dia / dia / dia longo / fim de semana). Inferência a partir dos padrões acima e do público 40–60; nenhuma fonte deu esses números para moto.
- Filtros (folha inferior, poucos): Duração (até 2 h / meio dia / dia inteiro / fim de semana), Piso (Só asfalto / Misto / Prefiro terra — já decidido no projeto), Tipo (Bate-volta / Ida), Curvas (Tranquila / Com curvas / Muitas curvas). Evitar "dificuldade" técnica; usar "Curvas" e "% terra".
- Cartão de rota: foto, nome, km, tempo estimado, % terra (com traço/cor próprios), nível de curvas (1–3 ícones), distância até o início, nota (estrelas ou "TFA" de irmãos) e quantos irmãos fizeram, quem criou/capítulo; botões "Usar rota" (laranja) e "Salvar".
- No carro: lista curta com distância em cada linha e ação direta (navegar), respeitando o limite do veículo.

### Gaps
- Nenhuma fonte com estudos de quantidade ideal de itens por tela para 40–60 anos em apps de mapa; números sugeridos são inferência.
- Não encontrei limiares de zoom específicos usados pela Komoot/Calimoto.

## 4. Segurança: sugestões não interativas com a moto em movimento; offline

### Takeaway
Diretrizes de distração (NHTSA) limitam olhar fora da via a 2 s por vez e 12 s no total e recomendam bloquear entrada de texto e navegação na internet em movimento; Android Auto trunca texto e exige listas curtas. Logo: descobrir/filtrar/avaliar só parado; em movimento, só aviso por voz de POIs essenciais (posto, parada do passeio) e botões grandes.

### Cited Findings
- NHTSA (2013, voluntário): olhos fora da via ≤ 2 s por vez e ≤ 12 s no total; bloquear digitação manual de texto, navegação na internet e vídeo com o veículo em movimento — [US DOT](https://www.transportation.gov/briefing-room/us-dot-releases-guidelines-minimize-vehicle-distractions); [Autoblog](https://www.autoblog.com/2013/04/25/nhtsa-voluntary-guidelines-distracted-driving/)
- Android Auto: texto de lista truncado em 2 linhas dirigindo; limite de linhas por veículo — [Google Cars List template](https://developers.google.com/cars/design/create-apps/apps-for-drivers/templates/list-template?authuser=8)
- Waze Moto: voz reduzida a riscos/curvas/faixas ("Menos Falante"); relato de alertas por voz (Gemini) sem tirar a mão do guidão — [MacMagazine](https://macmagazine.com.br/post/2026/07/13/waze-ganha-modo-moto-navegacao-personalizada-e-mais-integracoes-com-o-gemini/); [Correio 24 horas](https://www.correio24horas.com.br/transito/novo-recurso-do-waze-usa-inteligencia-artificial-para-conversar-com-o-motociclista-e-avisar-sobre-acidentes-sem-que-ele-precise-tirar-as-maos-do-guidao-0726)
- Offline: calimoto cobra mapas offline mundiais (Premium) — [calimoto Premium](https://support.calimoto.com/hc/en-us/articles/9036581115164-calimoto-Premium-Product-Overview); guias recomendam checar suporte offline antes de sair da cobertura — [Viking Bags](https://www.vikingbags.com/blogs/news/best-motorcycle-trip-planner-apps-for-a-long-road-trip)

### Inferences
- No modo pilotando: esconder cartões de sugestão, contador "Nesta área" e camadas não essenciais; pinos de postos/paradas do passeio só como ícone, sem toque (ou toque abre só "Ir para lá" grande). Avaliação de rota/Highlight só depois de encerrar (notificação "Como foi?").
- Ao salvar ou "Usar rota", baixar automaticamente o trajeto + POIs essenciais do corredor (postos, oficinas, hospitais) para uso offline — grátis, conforme regra do projeto.

### Gaps
- Não encontrei diretriz específica de distração para motociclistas (as da NHTSA são para carros) nem regra publicada de apps de moto que bloqueie a descoberta em movimento.
