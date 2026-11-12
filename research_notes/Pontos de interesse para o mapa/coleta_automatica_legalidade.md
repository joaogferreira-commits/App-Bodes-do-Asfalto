# Coleta automática ("robô"/scraper) para sugestões de passeios — viabilidade técnica e legal no Brasil

> Pesquisa, não parecer jurídico. Data da pesquisa: 12/11/2026. Limitação desta sessão: a rede do agente bloqueou o acesso direto a `es.wikiloc.com` e `developers.google.com` (WebFetch falhou por DNS), então alguns pontos vieram de resultados de busca e de páginas secundárias; estão marcados. Itens marcados "(texto de lei, conferir em planalto.gov.br)" vêm do texto legal conhecido e devem ser reconferidos na fonte antes de citar em documento público.

## 1. Plataforma por plataforma: termos de uso, APIs oficiais, custo/limites e o que pode ser guardado/exibido

### Takeaway
Para um app pequeno e sensível (maçons, LGPD), **raspar redes sociais e apps de trilhas é vedado pelos termos ou exige parceria**; as APIs oficiais existem mas são estreitas (Instagram: 30 hashtags/7 dias, só conta Business/Creator e revisão do app; YouTube: cota gratuita com regra de apagar/atualizar dados em 30 dias; X: pago por uso, sem plano grátis; Reddit: só não comercial com aprovação; TikTok Research: Brasil não elegível; Strava: proíbe mostrar dados a terceiros e uso em IA; Komoot: sem API pública). O caminho realista é **link para o original + fatos mínimos (nome do lugar, coordenada) curados por humanos**.

### Cited Findings

**Instagram / Facebook (Meta)**
- Instagram Graph API — Hashtag Search: contas Business e Creator podem consultar no máximo **30 hashtags únicas em janela móvel de 7 dias**, contada por conta (IG user ID); reconsultar a mesma hashtag dentro da janela não consome nova vaga nem reinicia o prazo. — [Meta for Developers – Hashtag Search](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/hashtag-search); [IG Hashtag Search reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag-search)
- O edge `recently_searched_hashtags` lista as hashtags consultadas nos últimos 7 dias (até 30 por página com `limit=30`). — [Recently Searched Hashtags](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/recently_searched_hashtags)
- Hashtags em Stories e emojis em hashtags não são suportados; hashtags sensíveis/ofensivas retornam erro genérico. Exige o recurso **Instagram Public Content Access** e a permissão `instagram_basic`, ambos com **App Review** da Meta. — [Meta for Developers – Hashtag Search](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/hashtag-search)
- Ao estourar o limite, a API retorna erro ("Your IG business account reached hashtags search limit") — informação de terceiros, não confirmada na doc da Meta. — [Ayrshare docs](https://www.ayrshare.com/docs/apis/hashtags/search-hashtags.md)
- Limite de 30 hashtags/7 dias existe desde 2018 (não é mudança recente). — [MarTech, 2018](https://martech.org/instagram-introduces-new-hashtag-search-api-for-businesses)
- **Meta v. Bright Data (N.D. Cal., caso 3:23-cv-00077-EMC, jan/2024):** o juiz Edward Chen deu julgamento sumário a favor da Bright Data na alegação de quebra de contrato, porque ela só raspou dados públicos **sem login**; a cláusula de "sobrevivência" que proibia raspagem para sempre foi considerada inexequível. — [Farella Braun + Martel](https://www.fbm.com/data-analytics/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/); [TechCrunch](https://techcrunch.com/2024/01/24/court-rules-in-favor-of-a-web-scraper-bright-data-which-meta-had-used-and-then-sued)
- A decisão é estreita: analisou só os termos da Meta e **não** torna lícita em geral a raspagem de dados públicos; outras teses jurídicas continuam disponíveis aos donos de conteúdo. — [Quinn Emanuel – client alert](https://www.quinnemanuel.com/the-firm/news-events/client-alert-what-does-the-meta-v-bright-data-summary-judgment-ruling-mean-for-web-scraping/)
- Relato (fonte menos autorizada) de que a Meta desistiu do processo em 23/02/2024. — [EnrichLayer blog](https://enrichlayer.com/blog/meta-lost-the-scraping-legal-battle-to-bright-data)
- Termos de Serviço da Meta proíbem acessar ou coletar dados dos produtos "por meios automatizados" sem permissão prévia (cláusula 3.2.3 nos termos do Facebook) — texto conhecido, **não reconferido nesta sessão**. — [Termos do Facebook](https://www.facebook.com/terms)

**YouTube Data API v3**
- Regra das políticas de desenvolvedor: se o usuário pedir exclusão ou não for possível verificar a autorização, apagar os dados em até 30 dias. — [YouTube – Complying with Developer Policies](https://developers.google.com/youtube/terms/developer-policies-guide)
- Política de métricas derivadas: clientes aceitos podem guardar métricas estatísticas (views, likes, inscritos) por até 36 meses; **títulos, nomes de criadores, descrições e comentários continuam sob a regra de atualizar/apagar em 30 dias**. — [YouTube Derived Metrics Policy](https://developers.google.com/youtube/terms/derived-metrics-policy)
- Cota padrão de 10.000 unidades/dia e custo de 100 unidades por `search.list` (≈100 buscas/dia): valor amplamente conhecido, **não confirmado nesta sessão** (página `determine_quota_cost` bloqueada pela rede do agente). — [YouTube – Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost) (não acessada)

**X / Twitter**
- Em 06/02/2026 o X trocou os planos por **pagamento por uso** como padrão; **não há plano gratuito**. O plano Basic (US$ 200/mês) fechou para novos e, a partir de 01/06/2026, assinantes remanescentes foram migrados. — [Open Terms Archive](https://opentermsarchive.org/en/memos/x-replaces-its-dollar200-entry-level-api-plan-with-a-pay-per-use-model/); [Gigazine](https://gigazine.net/gsc_news/en/20260209-x-api-pay-per-use)
- Leitura de post ≈ US$ 0,005; consulta de usuário ≈ US$ 0,01; teto mensal de leituras reportado como 2 ou 3 milhões (fontes divergem). Preços vêm de sites terceiros — conferir em docs.x.com. — [Postproxy](https://postproxy.dev/blog/x-api-pricing-2026); [OpenTweet](https://opentweet.io/x-api-pricing)

**TikTok Research API**
- Regiões elegíveis: EUA, EEE, Reino Unido e Suíça; exige vínculo com instituição acadêmica sem fins lucrativos (ou órgão de pesquisa independente sem fins lucrativos) nessas regiões e aprovação ética. — [TikTok Research API](https://developers.tiktok.com/products/research-api); [About Research API](https://developers.tiktok.com/doc/about-research-api/)
- NetLab/UFRJ classifica o TikTok como "Não" (sem acesso a pesquisadores) para o Brasil. — [NetLab UFRJ – Data not found, apêndice TikTok](https://netlab-eco-ufrj.github.io/data_not_found/chapters/appendices/tiktok.html)

**Strava**
- Atualização do API Agreement (nov/2024): apps de terceiros **só podem mostrar os dados de atividade do usuário a ele mesmo**, não a outros usuários. — [DC Rainmaker](https://dcrainmaker.com/2024/11/stravas-changes-to-kill-off-apps.html); [Cycling News](https://www.cyclingnews.com/news/strava-plan-to-restrict-third-party-apps-has-users-in-an-uproar)
- Cláusula: "You may not use the Strava API Materials (including Strava Data), directly or indirectly, for any model training related to artificial intelligence, machine learning or similar applications." — [the5krunner](https://the5krunner.com/2024/11/20/strava-issues-clarification/)
- Em jul/2026 desenvolvedores ainda questionavam se inferência de IA sobre dados do próprio atleta é permitida; sem resposta oficial encontrada. — [Strava Community Hub](https://communityhub.strava.com/developers-api-7/is-ai-inference-on-an-athlete-s-own-data-no-training-permitted-under-the-api-agreement-13753)

**Wikiloc**
- Condições de uso: uso dos serviços restrito a fins pessoais; **uso comercial só com contas aprovadas expressamente** (Geopromotion Packs, Wikiloc ORG); uso acima do que faz 99% dos usuários num período pode ser tratado como abusivo e bloqueado (cláusulas 4-20, 4-21). Não foi possível confirmar texto expresso sobre robôs/API (página bloqueada nesta sessão; informação via resumo de busca). — [Wikiloc – Condiciones de uso](https://es.wikiloc.com/wikiloc/terms_es.html)

**Komoot**
- Sem API pública; integração só para parceiros B2B aprovados (relatos de desenvolvedores, não termo oficial). — [MagicMirror Forum](https://forum.magicmirror.builders/post/87466); [issue de GitHub citada](https://opentoall.onrender.com/issue/282/)
- Existem "scrapers" comerciais de Komoot (Apify etc.), mas isso não indica permissão. — [Apify – Komoot scraper](https://apify.com/solidcode/komoot-scraper.md)

**Google Maps / Places**
- A maioria dos produtos do Google Maps Platform proíbe cache; algumas exceções permitem até 30 dias. **O place ID é isento** e pode ser guardado indefinidamente. — [Google – Optimizing Web Service Usage](https://developers.google.com/maps/optimize-web-services); [Manage costs](https://developers.google.com/maps/billing-and-pricing/manage-costs)
- Termos específicos: latitude/longitude da Places API podem ficar em cache por até 30 dias corridos e depois devem ser apagadas. — [Google Maps Platform Service Specific Terms (2024)](https://cloud.google.com/maps-platform/terms/maps-service-terms/index-20240422)
- Cotas gratuitas mensais por SKU (página atual): Place Details Essentials 10.000; Place Details Pro 5.000; Place Details Essentials (IDs Only) ilimitado. — [Google Maps Platform pricing](https://developers.google.com/maps/billing/pricing)

**Reddit**
- Camada gratuita: ~100 consultas/minuto por cliente OAuth, **só para uso não comercial aprovado**; desde 11/11/2025 todo cliente novo precisa de aprovação do Reddit. Uso comercial exige contrato; preços (≈US$ 0,24/1.000 chamadas, mínimo de US$ 12 mil) só em blogs e conflitantes. — [Data365](https://data365.co/blog/reddit-api-pricing); [Octolens](https://octolens.com/blog/reddit-api-pricing)

### Inferences
- Instagram: 30 hashtags/semana até bastam para monitorar poucas tags (#motoclube, #bodesdoasfalto, #rotadamoto…), mas exigem conta Business do clube, App Review da Meta e expõem o app à Meta como "app de motoclube maçônico" — conflito com o princípio de discrição. E a API devolve mídia de terceiros cuja exibição/cópia esbarra em direito autoral e LGPD; o uso adequado é **link para o post**, não cópia.
- Raspagem logada do Instagram/Facebook é claramente contra os termos; mesmo a não logada (caso Bright Data) é precedente americano estreito, sem valor no Brasil, e não afasta LGPD nem direito autoral.
- YouTube é a fonte social mais viável: cota gratuita, mas guardar só o ID do vídeo e reconsultar título/descrição (30 dias); exibir via player/link oficial.
- Strava, Wikiloc, Komoot, AllTrails e Relive: tratar como **não utilizáveis por robô**. Rotas desses apps só entram no Bodes se o próprio irmão exportar o GPX dele e enviar.
- X e Reddit: custo/aprovação desproporcionais e pouco conteúdo brasileiro de moto; descartar na v1.
- Google Places: compatível com a stack já escolhida (Google) só para enriquecer um lugar já curado (guardar place_id); não serve como fonte de "passeios".

### Gaps
- Texto atual exato dos Termos da Meta (cláusula de coleta automatizada) e da Wikiloc sobre robôs — não reconferido (rede bloqueada).
- Termos da AllTrails e da Relive não pesquisados nesta sessão (sem tempo de busca); presume-se proibição de raspagem, mas não confirmado.
- Cota/custo exatos do YouTube (`search.list` = 100 unidades, 10.000/dia) não confirmados na fonte oficial nesta sessão.
- Preço oficial do X e do Reddit só em fontes secundárias e conflitantes.

## 2. Lei brasileira: LGPD, ANPD, Marco Civil, direitos autorais, bases de dados, concorrência desleal, casos

### Takeaway
No Brasil, "dado público" não é dado livre: a LGPD exige finalidade compatível, boa-fé e necessidade (art. 7º §§3º, 4º e 7º), e a ANPD já multou empresa por raspagem e declara que estar público não autoriza o uso. Como cruzar perfis de redes com o app pode revelar ou inferir filiação maçônica (dado sensível, art. 11, sem base de "legítimo interesse"), qualquer coleta que toque **pessoas** é de alto risco; coletar só **fatos sobre lugares** e linkar o original é o desenho defensável. Não há jurisprudência do STJ consolidada sobre scraping.

### Cited Findings
- LGPD art. 7º §3º: tratamento de dados de acesso público deve considerar a finalidade, a boa-fé e o interesse público que justificaram sua disponibilização; §4º: dispensa consentimento para dados tornados manifestamente públicos pelo titular, resguardados direitos e princípios; §7º (incluído pela Lei 13.853/2019): tratamento posterior para novas finalidades só com propósitos legítimos e específicos e preservação dos direitos do titular (texto de lei, conferir). — [Lei 13.709/2018 – Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- LGPD art. 5º II: dado sensível inclui filiação a organização de caráter religioso, filosófico ou político; art. 11 lista bases próprias para dado sensível, **sem** "legítimo interesse" (texto de lei, conferir). — [Lei 13.709/2018 – Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- ANPD: o fato de as informações estarem acessíveis publicamente não autoriza seu uso ("Só porque é possível encontrar essas informações publicamente, não quer dizer que podem ser usadas"). — [TabNews – resumo de alerta da ANPD](https://www.tabnews.com.br/NewsletterOficial/anpd-alerta-que-web-scraping-de-dados-pessoais-viola-lgpd)
- **Primeira sanção da ANPD** (empresa de telemarketing) envolveu coleta por raspagem de dados publicamente disponíveis sem base legal adequada. — [Baptista Luz](https://www.baptista.com.br/comercializacao-de-dados-pessoais-aplicacao-da-primeira-multa-pela-anpd-e-abordagens-internacionais-de-web-scraping/?lang=en)
- Raspagem e agregação de dados citada como prioridade de fiscalização da ANPD em 2025 (citação secundária). — [TabNews](https://www.tabnews.com.br/NewsletterOficial/anpd-alerta-que-web-scraping-de-dados-pessoais-viola-lgpd)
- Votos do Conselho Diretor da ANPD de 2026 tratam de raspagem em larga escala por plataformas; um voto afirma que a ANPD não tem competência sobre o "tráfego de dados de plataformas". — [ANPD – CD 09/2026 votos](https://www.gov.br/anpd/pt-br/assuntos/deliberacoes-do-conselho-diretor-1/circuitos-deliberativos-ano-2026/cd-09-2026-votos.pdf/@@display-file/file)
- Doutrina: web scraping não é ilícito em si, mas a coleta genérica e indiscriminada de dados pessoais pode violar o princípio da necessidade. — [Jus.com.br](https://jus.com.br/artigos/87950/web-sscraping-na-lei-geral-protecao-de-dados-pessoais)
- Lei de Direitos Autorais (Lei 9.610/98): fotos e textos são obras protegidas; reprodução depende de autorização prévia (art. 29); bases de dados com seleção/organização criativa são protegidas (art. 7º XIII) e o titular tem direito exclusivo sobre reprodução/distribuição da base (art. 87); ideias e informações em si não são protegidas (art. 8º); citação de trechos com indicação de autor é permitida (art. 46 III) (texto de lei, conferir). — [Lei 9.610/1998 – Planalto](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm)
- Marco Civil da Internet (Lei 12.965/2014): princípios de proteção da privacidade e dos dados pessoais; guarda de registros de acesso por provedores de aplicação (art. 15) (texto de lei, conferir). — [Lei 12.965/2014 – Planalto](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm)
- Concorrência desleal (Lei 9.279/96, art. 195): o STJ (REsp 2.209.066/SP, 2025) apontou lacuna na tutela penal de dados corporativos; o art. 195 XI trata divulgação não autorizada de dados confidenciais. — [Migalhas](https://www.migalhas.com.br/depeso/443218/o-furto-de-informacoes-e-seu-o-vacuo-legislativo)
- Não foi encontrada decisão do STJ tratando diretamente de scraping como concorrência desleal ou violação de base de dados (busca em Migalhas/Conjur/STJ). — [Resultado de busca – Migalhas, Conjur](https://www.conjur.com.br/?p=433021)

### Inferences
- **Risco maçônico específico:** se o robô ligar perfis públicos de redes (ex.: quem postou #bodesdoasfalto) a irmãos do app, o Bodes passa a tratar dado sensível inferido sem base legal do art. 11 — o pior cenário de LGPD do projeto. Regra prática: o coletor **nunca** guarda autor, @, rosto, foto ou texto de post; só o lugar.
- Fatos (nome do lugar, coordenada, "estrada X tem curvas") não são obra protegida (art. 8º LDA); copiar fotos/textos de blogs e redes sem licença é violação (art. 29). Copiar sistematicamente uma base inteira (ex.: catálogo de trilhas Wikiloc) pode violar art. 87 e os termos do site.
- Termos de uso são contrato: violar pode gerar bloqueio e ação civil, mesmo sem crime específico; no Brasil não há equivalente consolidado do caso Bright Data.
- Postura da ANPD (público ≠ livre; prioridade de fiscalização) pesa mais para app com dado sensível e com encarregado pessoa física (o dono).

### Gaps
- Não encontrei guia oficial consolidado da ANPD sobre raspagem (nem o "Guia de Legítimo Interesse" foi lido nesta sessão).
- O caso ANPD x Meta de 2024 (medida preventiva sobre uso de posts públicos para treinar IA) é relevante, mas não foi reconferido nesta sessão — não citar sem verificar em gov.br/anpd.
- Data e número exatos da primeira multa da ANPD não confirmados.
- Sem jurisprudência brasileira específica (TJSP/STJ) sobre scraping localizada.

## 3. Alternativas legítimas, desenho técnico do coletor e custos

### Takeaway
Dá para ter "sugestões de passeios" automáticas e legais com custo ~zero: **dados abertos (OSM, Wikidata, Wikivoyage/Wikipedia CC BY-SA com atribuição)**, YouTube por API (só IDs + link), **GPX enviado pelos irmãos com licença explícita**, votação/curadoria dos membros, calendários/RSS de secretarias de turismo com permissão, e **"link-out"** para posts de redes colados pelos próprios irmãos. O robô roda em GitHub Actions agendado, grava só fatos em fila de revisão humana no Supabase.

### Cited Findings
- YouTube: guardar ID e reatualizar título/descrição em 30 dias; métricas podem ter regra própria. — [YouTube Derived Metrics Policy](https://developers.google.com/youtube/terms/derived-metrics-policy)
- Google Places: place_id pode ser guardado sem prazo; IDs-Only é gratuito sem limite. — [Google Maps Platform pricing](https://developers.google.com/maps/billing/pricing); [Optimizing Web Service Usage](https://developers.google.com/maps/optimize-web-services)
- Dado público pode ser tratado para nova finalidade só com propósito legítimo e específico (LGPD art. 7º §7º) — sustenta coletar apenas o necessário (lugares, não pessoas). — [Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- Instagram por API exige App Review e conta Business; limite de 30 hashtags/7 dias. — [Meta – Hashtag Search](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/hashtag-search)

### Inferences (alternativas e desenho proposto — com base nos achados acima e conhecimento geral; licenças/custos a reconferir)
- **Fontes abertas (grátis):**
  - OpenStreetMap (ODbL): estradas cênicas, mirantes, monumentos, `tourism=*`, `historic=*`, via Overpass API; exige atribuição "© OpenStreetMap contributors" e, se a base derivada for publicada, compartilhamento pela mesma licença. Já previsto na stack.
  - Wikidata (CC0): coordenadas e nomes de atrações, sem atribuição obrigatória.
  - Wikivoyage/Wikipedia (CC BY-SA): textos podem ser resumidos por IA **com atribuição e link** e o resumo herda CC BY-SA.
  - Dados de turismo de governo (ex.: Mapa do Turismo Brasileiro / dados.gov.br, secretarias estaduais como a de MT para Cuiabá): verificar licença de cada conjunto.
- **Comunidade (melhor fonte e sem risco):** irmão importa GPX próprio (já grátis no app) e marca "compartilhar como sugestão" com licença explícita no termo (ex.: licença de uso ao app + exibição a membros); votos "Já fiz / Quero fazer"; diretoria de capítulo aprova sugestões; "Usar rota" no feed já gera dados.
- **Redes sociais sem robô:** irmão cola o link de um Reel/vídeo/post; o app mostra só o cartão com link (oEmbed oficial onde existir), e um moderador extrai o lugar. Nada de autor/foto guardados.
- **Parcerias:** secretarias de turismo e associações de motoclubes enviando calendário (RSS/iCal/planilha) com autorização por escrito.
- **Práticas do coletor (para fontes permitidas, ex.: sites de eventos com permissão, RSS):** respeitar robots.txt e termos; user-agent identificável genérico ("BodesBot/1.0 + URL de contato do domínio do projeto", sem nome do dono); 1 requisição a cada poucos segundos por domínio, cache/ETag; só páginas públicas, nunca com login; guardar apenas: nome do lugar, coordenada, tipo, URL de origem, data da coleta, licença; nada de texto integral, foto ou dado de pessoa; tudo vai para **fila de revisão humana** (moderador/diretoria) antes de aparecer; registro de origem para atender pedidos de remoção.
- **Custos estimados:** GitHub Actions agendado (cron) dentro da cota gratuita de repositório (minutos mensais gratuitos — conferir limite atual do plano), Supabase plano gratuito (tabela `sugestoes_passeio` + fila de revisão, RLS), Overpass/Wikidata grátis (com uso educado), YouTube API grátis na cota padrão, IA de resumo pelos provedores grátis já usados no projeto (Gemini/Cloudflare) só sobre texto CC BY-SA. Total esperado: R$ 0/mês; Instagram/X/Reddit/Strava ficam fora.
- **Recomendação de nome no app:** "Sugestões de passeios" com selo da fonte ("Sugerido por irmão", "OpenStreetMap", "Wikivoyage", "Vídeo no YouTube").

### Gaps
- Licenças exatas dos dados do Mapa do Turismo Brasileiro e da Secretaria de Turismo de MT não pesquisadas.
- Cota gratuita atual do GitHub Actions e limites do plano gratuito do Supabase não reconferidos nesta sessão.
- Política de uso da Overpass API pública (limites de requisição) não reconferida.
