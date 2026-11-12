# Fontes abertas de pontos de interesse (POIs) para o mapa do Bodes do Asfalto (Brasil / Mato Grosso)

> Nota de método (12/11/2026): nesta sessão o acesso direto (fetch) a download.geofabrik.de, operations.osmfoundation.org, overpass-api.de e www.gov.br foi bloqueado pela rede do agente. Os achados abaixo vêm de buscas na web (trechos de páginas oficiais e de terceiros). Onde um número não pôde ser confirmado na fonte primária, ele está em "Gaps". Para liberar a checagem direta, esses domínios precisam ser permitidos na configuração de rede da sessão.

## 1. OpenStreetMap: tags, acesso (Overpass, Geofabrik, auto-hospedagem) e obrigações da ODbL

### Takeaway
OSM é a base mais completa e barata para trilhas, cachoeiras, mirantes, monumentos, postos, hospedagem e restaurantes; a forma correta para um app é importar um extrato (Geofabrik, atualização diária) para o próprio PostGIS e não depender do Overpass público (limite de uso ~10 mil requisições/dia, bloqueia abusos e nuvens). A licença ODbL permite uso comercial, exige atribuição "© OpenStreetMap contributors" e impõe share-alike apenas à base derivada se ela for "usada publicamente" — misturar OSM com dados próprios na mesma tabela pode obrigar a publicar essa tabela derivada sob ODbL.

### Cited Findings
**Tags (OSM wiki)**
- Cachoeira: `waterway=waterfall`, normalmente um nó com `name` e `height`, às vezes com um `natural=cliff` em linha; em ways a semântica é ambígua (borda vs extensão vertical). A proposta alternativa `natural=waterfall` foi retirada em 2013 — [Tag:waterway=waterfall](https://wiki.openstreetmap.org/Tag:waterway=waterfall); [Waterfalls in OSM](https://wiki.openstreetmap.org/wiki/Waterfalls_in_OSM); [Proposal:Waterfall](https://wiki.openstreetmap.org/wiki/Proposal:Waterfall)
- Corredeiras são mapeadas à parte com `waterway=rapids` — [Tag:waterway=rapids](https://wiki.openstreetmap.org/wiki/Tag:waterway%3Drapids)
- Demais tags pedidas (mirante `tourism=viewpoint`; trilhas `highway=path`/`highway=footway` com `sac_scale=*` e relações `route=hiking`; atrativos `tourism=attraction`; monumentos/memoriais `historic=monument` / `historic=memorial`; postos `amenity=fuel`; hospedagem `tourism=hotel|motel|guest_house|hostel|camp_site`; restaurantes `amenity=restaurant|fast_food|cafe`; `shop=motorcycle`, `amenity=motorcycle_parking`, `motorcycle=yes|designated`): a busca não retornou as páginas da wiki com esses detalhes nesta sessão (ver Gaps). Estão listadas aqui como as tags padrão de uso corrente, a confirmar em wiki.openstreetmap.org.

**Overpass API (instância pública)**
- A política de uso permitida da instância principal é de **10.000 requisições por dia**; em 2024/2025 usuários comerciais foram bloqueados por excesso de requisições simultâneas — [Overpass API/status (OSM wiki)](https://wiki.openstreetmap.org/wiki/Overpass_API/status)
- Regra prática da wiki: para uso **regular/automatizado**, dividir os números "seguros" por 100 → menos de ~100 consultas e ~10 MB por dia — [Overpass API (OSM wiki)](https://wiki.openstreetmap.org/wiki/Overpass_API)
- Cada um dos três servidores da instância principal tem capacidade total de ~1.000.000 requisições/dia (capacidade, não cota por usuário) — [Overpass API (OSM wiki)](https://wiki.openstreetmap.org/wiki/Overpass_API)
- O Overpass bloqueou temporariamente faixas de IP de Azure e AWS por abuso — [community.openstreetmap.org](https://community.openstreetmap.org/t/overpass-api-will-block-azure-and-aws-for-some-time/136817)
- Excesso retorna HTTP 429; usuários pesados devem montar a própria instância — [Overpass API User's Manual](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html); [community thread sobre IP bloqueado](https://community.openstreetmap.org/t/blocked-ip-on-overpass-api/146883)
- Relato de experiência de montar servidor Overpass próprio ("how hard can it be?") — [diário SomeoneElse](https://api.openstreetmap.org/user/SomeoneElse/diary/409111)

**Geofabrik (extratos)**
- O extrato da América do Sul inteira tem ~3,3 GB (.osm.pbf) — [download.geofabrik.de](https://download.geofabrik.de)
- Extratos regenerados diariamente; diffs diários (.osc.gz) disponíveis — [Geofabrik download server](https://www.geofabrik.de/data/download.html); [atlas.co sobre Geofabrik](https://atlas.co/data-sources/geofabrik/)
- Os .shp.zip trazem só uma seleção de feições e atributos ("não completos"); nem toda sub-região tem shapefile — [Geofabrik technical](https://download.geofabrik.de/technical.html)
- Extratos sob ODbL, atribuição e share-alike para bases derivadas — [atlas.co](https://atlas.co/data-sources/geofabrik/)
- Página do Brasil com sub-regiões (centro-oeste, norte, nordeste, sudeste, sul): URL esperada https://download.geofabrik.de/south-america/brazil.html (não pôde ser aberta; ver Gaps)

**ODbL**
- A OSMF tem diretriz para decidir se o resultado é "Produced Work" (ex.: mapa renderizado — exige atribuição, não exige share-alike) ou "Derivative Database" (deve ser publicada sob ODbL se usada publicamente) — [Produced Work Guideline (OSMF)](https://osmfoundation.org/wiki/Community_Guidelines/Produced_Work_-_Guideline)
- Se um Produced Work é usado publicamente, a base derivada usada para produzi-lo é considerada "Publicly Used" (ODbL 4.4(c)) e cai no share-alike — [diário SimonPoole](https://api.openstreetmap.org/user/SimonPoole/diary/21225)
- Casos de uso e dúvidas de atribuição documentados na wiki — [Open Data License/Use Cases](https://wiki.openstreetmap.org/wiki/Open_Data_License/Use_Cases)

### Inferences
- Para 300–1.000 usuários, consultar Overpass a partir do app ou de uma Edge Function violaria a regra prática de uso regular; o caminho é: baixar `centro-oeste-latest.osm.pbf` (ou `brazil-latest`), filtrar com `osmium tags-filter` pelas tags acima e importar com `osm2pgsql` (flex) ou `imposm` para uma tabela `poi_osm` no Supabase. Custo: só CPU de um runner do GitHub Actions (grátis) + espaço no Postgres (POIs filtrados de MT devem caber em poucos MB).
- Manter `poi_osm` separada de `lugares_cadastrados` (sedes, Lojas, negócios) e só combiná-las na hora de exibir reduz o risco de a tabela própria virar "Derivative Database" sob share-alike. Se combinar/corrigir dados OSM, publicar o diff/base derivada sob ODbL é a obrigação (não precisa abrir os dados privados de membros, que não derivam do OSM).
- O app já usa tiles OpenFreeMap (derivados de OSM): a atribuição "© OpenStreetMap contributors" visível no mapa é obrigatória de qualquer forma.

### Gaps
- Tamanhos exatos de brazil-latest.osm.pbf e centro-oeste-latest.osm.pbf e data da última atualização: página da Geofabrik bloqueada nesta sessão (estimativa não verificada: Brasil na casa de 1,5–2 GB; centro-oeste em centenas de MB).
- Texto literal da política de uso do Overpass e da ODbL/attribution guideline (operations.osmfoundation.org bloqueado). O limite "1 GB/dia" frequentemente citado não foi confirmado.
- Contagens por categoria em MT/Brasil via taginfo (taginfo.geofabrik.de/south-america:brazil) não foram obtidas; nenhum número de POIs por categoria pôde ser confirmado.
- Existência de tag consolidada para clube/encontro de motociclistas (`club=motorcycle` aparece em uso livre, sem confirmação na wiki nesta sessão).

## 2. Wikidata, Wikimedia Commons e Wikivoyage

### Takeaway
Wikidata é útil para enriquecer atrativos (nome, imagem, link da Wikipédia) via SPARQL com timeout de 60 s e cota de 60 s de processamento por minuto por cliente; a licença dos dados é CC0 (não confirmada nesta sessão). Imagens do Commons e textos do Wikivoyage exigem atribuição por arquivo (CC BY / CC BY-SA), o que complica o uso comercial em app mas é viável com crédito na ficha do lugar.

### Cited Findings
- WDQS: prazo máximo de 60 s por consulta (GUI e endpoint público) — [WikidataQueryServiceR (CRAN)](https://search.r-project.org/CRAN/packages/WikidataQueryServiceR/WikidataQueryServiceR.pdf); [Phabricator T410635](https://phabricator.wikimedia.org/T410635)
- Por cliente (User-Agent + IP): 60 s de processamento a cada 60 s e no máximo 30 consultas com erro por minuto — [WikidataQueryServiceR](https://search.r-project.org/CRAN/packages/WikidataQueryServiceR/WikidataQueryServiceR.pdf)
- Exigência de User-Agent descritivo; quem não segue pode ser bloqueado — [Wikidata:Data access](https://www.wikidata.org/wiki/Wikidata:Data_access)
- Wikivoyage: texto sob CC BY-SA 4.0 e derivados devem manter CC BY-SA 4.0 — [Wikivoyage:Copyleft](https://www.wikipedia.org/wiki/Wikivoyage:Copyleft); a versão alemã ainda indica CC BY-SA 3.0 — [de.wikivoyage](https://de.wikivoyage.org/wiki/Wikivoyage:LB)
- Commons: cada arquivo tem licença própria; quem reutiliza deve cumprir a licença do arquivo e atribuir quando exigido; o crédito correto está na página do arquivo — [Commons:Reusing content outside Wikimedia](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia); [Wikivoyage:Image policy](https://en.wikivoyage.org/wiki/Wikivoyage:IP)

### Inferences
- Fluxo barato: rodar SPARQL em lote (ex.: itens com P625 coordenadas dentro de MT e instância de cachoeira Q34038, mirante, parque, monumento) num job agendado, guardar QID, nome pt/es/en e imagem P18; exibir a foto com autor+licença lidos da API do Commons.
- Fotos CC BY-SA no app são "uso" sem obrigação de licenciar o app inteiro, mas a imagem (e edições dela) mantém a licença; evitar recortes/marca d'água sobre elas.

### Gaps
- Confirmação textual de que o conteúdo estruturado do Wikidata é CC0 (conhecimento consolidado, mas a busca não trouxe a página de licença).
- Densidade de itens Wikidata com coordenadas em Mato Grosso não foi medida.

## 3. Fontes do governo brasileiro (ANP, ICMBio/MMA, MTur/Cadastur, IBGE, DNIT, MT)

### Takeaway
A ANP é a melhor fonte governamental: tem dados abertos do cadastro de revendedores com latitude/longitude e API de revendedores, série de preços por revenda (CNPJ, endereço, bandeira, sem coordenadas) e, desde jul/2026, o app "ANP com VC – Postos" com nota de 0 a 5 por posto (sem dataset aberto confirmado). Unidades de conservação estão em shapefile mensal do CNUC (MMA, CC-BY). Cadastur/Mapa do Turismo têm dados abertos parciais/desatualizados, sem coordenadas confirmadas.

### Cited Findings
**ANP – postos e preços**
- A ANP publica dados abertos dos revendedores varejistas de combustíveis; o manual da API Revendedores lista CNPJ, UF, município, **latitude e longitude do posto**, latitude/longitude "ANP4C" e um campo de validação geográfica; consulta geral ou por CNPJ/UF/município — [Manual da API Revendedores (ANP)](https://www.gov.br/anp/pt-br/centrais-de-conteudo/paineis-dinamicos-da-anp/paineis-dinamicos-do-abastecimento/api-revendedores-manual-usuario.pdf); [Apresentação SDL 2025](https://www.gov.br/anp/pt-br/centrais-de-conteudo/apresentacoes-palestras/2025/arquivos/seminario-de-avaliacao-do-mercado-de-combustiveis/05-sdl.pdf)
- Dataset de pontos de abastecimento autorizados com metadados próprios — [metadados PA (ANP)](https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/arquivos-pontos-de-abastecimento-autorizados/metadados-pa.pdf)
- PMQC (Programa de Monitoramento da Qualidade): campos CNPJ do posto e **latitude/longitude**, mas cobre a amostra monitorada — [metadados PMQC](https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/pmqc/pmqc-metadados.pdf)
- Série histórica de preços por revenda: campos Região, Estado, Município, Revenda, CNPJ, Rua, Número, Complemento, Bairro, CEP, Produto, Data da Coleta, Valor de Venda, Valor de Compra, Unidade, Bandeira (sem coordenadas); uma versão dos metadados cita dados até ago/2020 — [metadados SHPC (ANP)](https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/shpc/metadados-serie-historica-precos-combustiveis.pdf); arquivos semestrais CSV espelhados em [AmeriGEOSS](https://data.amerigeoss.org/dataset/serie-historica-de-precos-de-combustiveis-por-revenda/resource/a55e53b0-2030-4d50-b97f-b2c480955273)
- A pesquisa de preços cobre cerca de 5.800 postos por semana (amostra, não todos os postos) — [apresentação ANP à Câmara, 2017](https://www2.camara.leg.br/atividade-legislativa/comissoes/comissoes-permanentes/cdc/apresentacoes-em-eventos/realizadas-em-2017/preco-dos-combustiveis/apresentacao-anp/view)
- Dados de ações de fiscalização também são abertos — [metadados ações de fiscalização](https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/arquivos-acoes-de-fiscalizacao/metadados-acoes-fiscalizacao.pdf)
- "ANP com VC – Postos" (lançado em jul/2026): nota de 0 a 5 por posto com base em fiscalizações dos últimos 5 anos (qualidade do combustível, aferição de bombas, preços abusivos); mostra endereço, CNPJ, nº de fiscalizações e resultados de amostras; busca por CNPJ — [TNH1](https://www.tnh1.com.br/noticia/nid/anp-cria-app-para-motorista-conferir-qualidade-de-posto-de-combustivel/); [O POVO](https://mais.opovo.com.br/jornal/farol/2026/07/14/anp-cria-app-para-motorista-conferir-qualidade-de-posto-de-combustivel.html); [O Imparcial](https://oimparcial.com.br/noticias/2026/07/anp-lanca-aplicativo-com-informacoes-de-postos-de-combustiveis-e-canal-direto-de-denuncias/)
- A nota também usaria resultados do PMQC — [Diário do Pará](https://diariodopara.com.br/seu-bolso/quer-saber-se-um-posto-e-confiavel-novo-aplicativo-da-anp-mostra-historico-e-notas/)
- Informações atualizadas mensalmente; funciona no navegador e substitui o "ANP no Posto" (2020) — [Tribuna de Minas](https://tribunademinas.com.br/?p=853670); contradito por [AMDJUS](https://amdjus.com.br/anp-lanca-app-para-avaliar-qualidade-de-postos-de-combustivel/), que diz haver versões iOS/Android

**ICMBio / MMA – Unidades de Conservação (CNUC)**
- O MMA publica snapshots do polígono CNUC em shapefile zipado (ex.: 2025_03 e 2025_08; arquivo `shp_cnuc_2025_08.zip`), licença indicada "Creative Commons Atribuição" — [dados.mma.gov.br – Polígono CNUC 2025_08](https://dados.mma.gov.br/de/dataset/unidadesdeconservacao/resource/6ba9a557-87e8-4882-acb7-b3e0f0ea192d); [Polígono CNUC 2025_03](https://dados.mma.gov.br/de/dataset/unidadesdeconservacao/resource/20327e02-d4fe-4a1b-bd12-e381ab461d97)
- Camada federal (ICMBio) em escalas 1:10.000 a 1:250.000, atualizada sob demanda; referência oficial de cada UC é o decreto de criação — [SNIRH metadados UC federais](https://metadados.snirh.gov.br/geonetwork/srv/api/records/7394d63d-abe7-47d7-af08-6163b8c5cf92); [SNIRH Unidades de Conservação](https://metadados.snirh.gov.br/geonetwork/srv/api/records/9407d38f-84d2-48ea-97dd-ee152c493043)

**Ministério do Turismo – Cadastur e Mapa do Turismo**
- Dados abertos de "meios de hospedagem" (Cadastur) existem em dados.turismo.gov.br em CSV, mas o recurso encontrado ("Primeiro Trimestre 2020") foi atualizado pela última vez em 04/10/2021 — [dados.turismo.gov.br](https://dados.turismo.gov.br/dataset/meios-de-hospedagem/resource/3a889034-b544-493d-b1ee-866a470b763e)
- IBGE cita dados abertos do MTur (agências, hospedagem, organizadoras de eventos) via dados.gov.br — [Anuário IBGE 2023](https://anuario.ibge.gov.br/images/aeb/2023/s5/2_pdf/s5t4202.pdf)
- API Cadastur no Conecta gov.br (endpoints PJ e guia) — acesso via adesão do Conecta, voltada a órgãos públicos — [Conecta gov.br – CADASTUR](https://www.gov.br/conecta/catalogo/apis/cadastur-cadastro-de-prestadores-de-servicos-turisticos)
- Cadastur passou de 150 mil estabelecimentos cadastrados (2023) — [Agência Gov](https://agenciagov.ebc.com.br/noticias/202308/recorde-cadastur-ja-ultrapassa-150-mil-estabelecimentos-cadastrados)
- Mapa do Turismo: painel de consulta (SISmapa) lançado em 2023; MT tinha 85 municípios no Mapa na atualização 2019–2021 — [Agência Gov](https://agenciagov.ebc.com.br/noticias/202308/ministerio-do-turismo-lanca-novo-painel-de-consulta-no-mapa-do-turismo-brasileiro); [TCE-MT, governança do turismo em MT](https://www.tce.mt.gov.br/index.php/conteudo/download/governanca-do-setor-de-turismo-no-estado-de-mato-grossopdf/138477)

### Inferences
- Postos: combinar `amenity=fuel` do OSM (posição) com o cadastro ANP (CNPJ + lat/lon) por proximidade/CNPJ, e anexar o preço da série semanal por CNPJ (quando o posto estiver na amostra) com data e fonte; fora da amostra, preço colaborativo dos irmãos. A nota de qualidade pode ser aproximada a partir dos datasets abertos de fiscalização e PMQC enquanto a ANP não abrir a nota do "ANP com VC".
- Dados do governo federal publicados em portais abertos geralmente vêm sob licença aberta (CC-BY ou equivalente) e permitem uso comercial com citação da fonte; confirmar a licença em cada dataset.
- Mapa do Turismo serve para destacar municípios turísticos (ex.: Chapada dos Guimarães, Nobres, Poconé/Pantanal), não para POIs pontuais.

### Gaps
- Licença exata e periodicidade dos datasets de revendedores da ANP e se o CSV de preços atual (2021–2026) ainda é publicado semanalmente (www.gov.br bloqueado).
- Não há confirmação de dataset aberto/API da nota do "ANP com VC – Postos".
- Cadastur: não confirmado se o CSV atual traz endereço com coordenadas.
- IBGE (BC250 / localidades), DNIT (SNV) e SEDEC-MT/Secretaria de Turismo de MT: não pesquisados com sucesso nesta sessão (limite de buscas); nenhuma lista oficial georreferenciada de atrativos de Chapada dos Guimarães, Pantanal ou Nobres foi encontrada.

## 4. Bases globais abertas e comerciais: GeoNames, Foursquare OS Places, Overture, Google Places, Wikiloc/AllTrails/Komoot

### Takeaway
Overture Places (CDLA-Permissive-2.0 + Apache 2.0, sem share-alike) e Foursquare OS Places (Apache 2.0, >100 mi POIs, atualização mensal) são as alternativas comerciais livres para restaurantes/hotéis/comércio; ambas sem dados de Brasil/MT confirmados. GeoNames é CC BY (útil só para topônimos). Google Places não serve como base: só o `place_id` pode ser guardado indefinidamente. Wikiloc proíbe uso não doméstico e não foi encontrado API público de AllTrails/Komoot.

### Cited Findings
- **Foursquare OS Places:** GA em nov/2024, >100 milhões de POIs globais, licença Apache 2.0, uso comercial livre, atualização mensal, 22 atributos centrais — [Foursquare blog](https://foursquare.com/resources/blog/data/evolving-fsq-open-source-places/); [Simon Willison](https://simonwillison.net/2024/Nov/20/foursquare-open-source-places); cobre >200 países ([The Letter Two](https://thelettertwo.com/2024/11/19/foursquare-releases-its-places-data-as-open-source/)). Foursquare pede contato de quem usa a cópia pública no S3 em produção — [Foursquare blog](https://foursquare.com/resources/blog/data/evolving-fsq-open-source-places/). Comunidade OSM questiona Apache 2.0 como licença de dados — [community.openstreetmap.org](https://community.openstreetmap.org/t/foursquare-releases-100m-poi-dataset-under-apache-2-0/121883). Espelho em GeoParquet — [source.coop](https://source.coop/fused/fsq-os-places)
- **Overture Maps Places:** sem dados OSM e sem share-alike da ODbL; licença por registro conforme a fonte — Foursquare = Apache 2.0, demais (Meta ~60,3 mi, Microsoft ~5,9 mi, PinMeTo, Uberall, BrightQuery) = CDLA-Permissive-2.0, AllThePlaces = CC0 — [Overture Places Guide](https://docs.overturemaps.org/guides/places); [release notes 24/09/2025](https://docs.overturemaps.org/blog/2025/09/24/release-notes/)
- Overture não exige texto de atribuição nem logo nos mapas; crédito sugerido "© Overture Maps Foundation"; registros Foursquare exigem cópia da licença Apache e aviso de alterações — [Overture Places Guide](https://docs.overturemaps.org/guides/places)
- **Google Places:** os termos permitem guardar o `place_id`; demais campos com restrições — [Google Maps Service Specific Terms (arquivo 2025-06-04)](https://cloud.google.com/archive/maps-platform/terms/maps-service-terms-20250604); análise de terceiro: só place_id indefinidamente, lat/lon até 30 dias, nome/endereço/nota/fotos sem exceção de cache — [openplacesapi.com](https://openplacesapi.com/blog/can-you-store-places-api-results) (fonte com interesse comercial; confirmar nas Places API Policies)
- **GeoNames:** dados sob Creative Commons Attribution (o espelho Tryton diz 4.0 mas linka 3.0 — versão inconsistente); arquivo postal BR.zip só tem CEPs principais (terminados em -000) — [espelho Tryton](https://downloads.tryton.org/geonames/); [GeoNames export/zip](https://www.geonames.org/export/zip/); estatísticas de feature codes do Brasil — [GeoNames Brazil statistics](https://www.geonames.org/statistics/brazil.html)
- **Wikiloc:** termos restringem o serviço a pessoas físicas e uso "doméstico e privado"; uso acima do de 99% dos usuários é presumido abusivo — [Wikiloc Terms](https://www.wikiloc.com/wikiloc/terms_en.html); proibição de download em massa/re-hospedagem segundo resumo — [Wikipedia: Wikiloc](https://en.wikipedia.org/wiki/Wikiloc)

### Inferences
- Para restaurantes de beira de estrada e hotéis em MT, Overture/FSQ podem complementar o OSM sem share-alike; download por GeoParquet filtrado por bbox de MT (DuckDB) é grátis. Qualidade no interior de MT tende a ser fraca e com registros fechados/duplicados — validar antes de exibir.
- Google Places fica fora: custo por chamada e proibição de cache conflitam com o orçamento e com o modo offline.
- Trilhas: fonte reutilizável é só o OSM (`route=hiking`, `highway=path`); Wikiloc/AllTrails/Komoot não são fontes legítimas de dados para o app. Trilhas de terra para moto podem vir de `highway=track` + `tracktype`/`surface` no OSM (tags a confirmar).

### Gaps
- Contagem de POIs de Overture/FSQ no Brasil e em MT não encontrada.
- Termos/API de AllTrails e Komoot não foram encontrados nesta sessão (presume-se ausência de API pública aberta, não confirmado).
- Preços atuais da Google Places API (New) não confirmados em fonte oficial.
- GeoNames: licença exata (CC BY 4.0 vs 3.0) não confirmada na página oficial.
