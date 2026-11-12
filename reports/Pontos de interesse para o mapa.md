# Dados abertos e irmãos alimentam o mapa

**Resposta curta:** o mapa do Bodes do Asfalto pode ser alimentado quase de graça. A base é um extrato do **OpenStreetMap importado no próprio Supabase/PostGIS**, com cachoeiras, mirantes, monumentos, trilhas, postos, pousadas e restaurantes. Por cima entram os **dados abertos da ANP** para posição e preço de postos, o **Wikidata** para fotos e nomes de atrativos e o **CNUC/MMA** para parques e unidades de conservação. O resto vem do cadastro feito pelos próprios irmãos: sedes, Lojas, negócios, pontos de encontro e passeios.

Três achados mudam o desenho:

1. **A Rota Biker não tem nenhum monumento em Mato Grosso** (até out/2026) e não publica dados abertos. Os marcos mais próximos ficam em Goiás, no DF e, de forma provisória, em Campo Grande (MS).
2. **A sede nacional do clube fica em Feira de Santana (BA), não em Cuiabá.** O clube chama seus capítulos de "facções" e declara 331 delas.
3. **Um "robô" que raspa Instagram, Facebook, Wikiloc ou Strava não é viável.** Os termos de uso dessas plataformas vedam ou restringem a coleta. Pela LGPD, ligar perfis públicos a irmãos inferiria filiação maçônica, que é dado sensível.

O caminho legítimo tem custo próximo de R$ 0/mês: robôs que leem só fontes abertas, mais sugestões dos irmãos, e tudo passa por uma fila de revisão humana. Na interface, as sugestões ficam discretas no mapa (um contador e pinos agrupados) e completas numa tela própria, "Sugestões de passeios", ordenada por distância.

Uma ressalva vale para o relatório inteiro: **os pesquisadores não conseguiram abrir boa parte das páginas** (bloqueio de rede). Por isso, vários dados vieram de trechos de busca. Esses itens estão marcados como *(não verificado)* e reunidos na lista "Conferir antes de usar".

## OpenStreetMap no próprio banco cobre quase todas as categorias pedidas

O OpenStreetMap (OSM) é a base mais completa e barata para as categorias pedidas. Cachoeiras usam `waterway=waterfall`, normalmente como um nó com `name` e `height`; a etiqueta alternativa `natural=waterfall` foi abandonada em 2013 ([Tag:waterway=waterfall](https://wiki.openstreetmap.org/Tag:waterway=waterfall); [Proposal:Waterfall](https://wiki.openstreetmap.org/wiki/Proposal:Waterfall)). As demais etiquetas de uso corrente, que ainda precisam ser conferidas na wiki porque as páginas não abriram, são:

- mirantes: `tourism=viewpoint`;
- trilhas: `highway=path` com `sac_scale`, e relações `route=hiking`;
- atrativos: `tourism=attraction`;
- monumentos e memoriais: `historic=monument` e `historic=memorial`;
- postos: `amenity=fuel`;
- hospedagem: `tourism=hotel|motel|guest_house|camp_site`;
- comida: `amenity=restaurant|fast_food|cafe`;
- lojas e estacionamento de moto: `shop=motorcycle` e `amenity=motorcycle_parking`.

Para motoclubes, a etiqueta documentada é `club=motorcycle`, com status "in use" ([OSM Wiki](https://wiki.openstreetmap.org/wiki/Tag:club%3Dmotorcycle)).

**A forma de acesso importa mais que a fonte.** A instância pública do Overpass tolera cerca de **10.000 requisições por dia** e já bloqueou usuários comerciais e faixas inteiras de IP da AWS e do Azure ([Overpass API/status](https://wiki.openstreetmap.org/wiki/Overpass_API/status); [community.openstreetmap.org](https://community.openstreetmap.org/t/overpass-api-will-block-azure-and-aws-for-some-time/136817)). A própria wiki recomenda dividir os números "seguros" por 100 em uso automatizado, o que dá menos de **~100 consultas e ~10 MB por dia** ([Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)). Com 300 a 1.000 irmãos consultando o mapa, chamar o Overpass a partir do app ou de uma Edge Function estouraria esse limite no primeiro dia.

O desenho correto é outro. A Geofabrik regenera extratos diariamente, com arquivos de diferenças (diffs) diários ([Geofabrik](https://www.geofabrik.de/data/download.html)). Um job agendado no GitHub Actions baixa o extrato do Centro-Oeste, filtra as etiquetas com `osmium` e importa o resultado para uma tabela `poi_osm` no Supabase. O custo é só o processamento no runner gratuito e alguns megabytes no Postgres. Os tamanhos exatos dos extratos do Brasil e do Centro-Oeste ficaram *(não verificado)*.

A licença do OSM, a ODbL, permite uso comercial. Ela exige a atribuição "© OpenStreetMap contributors", que o app já precisa exibir por usar tiles do OpenFreeMap. O cuidado está no "share-alike": se uma base derivada do OSM for usada publicamente, ela precisa ser publicada sob ODbL ([Produced Work Guideline](https://osmfoundation.org/wiki/Community_Guidelines/Produced_Work_-_Guideline); [diário SimonPoole](https://api.openstreetmap.org/user/SimonPoole/diary/21225)). A consequência prática é manter `poi_osm` **separada** das tabelas próprias (sedes, Lojas, negócios) e juntá-las só na hora de exibir. Assim, os dados dos irmãos nunca viram parte de uma base derivada do OSM.

O Wikidata complementa o OSM com nome em pt/es/en, foto e link da Wikipédia. O serviço de consultas aceita até 60 s por consulta e 60 s de processamento por minuto por cliente, e exige um User-Agent descritivo ([WikidataQueryServiceR](https://search.r-project.org/CRAN/packages/WikidataQueryServiceR/WikidataQueryServiceR.pdf); [Wikidata:Data access](https://www.wikidata.org/wiki/Wikidata:Data_access)). Os dados do Wikidata são CC0, mas isso ficou *(não verificado)*. As fotos do Commons têm licença por arquivo e pedem crédito na ficha do lugar ([Commons: Reusing content](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)). Os textos do Wikivoyage são CC BY-SA 4.0 e os resumos derivados herdam essa licença ([Wikivoyage:Copyleft](https://www.wikipedia.org/wiki/Wikivoyage:Copyleft)).

Para restaurantes de estrada e pousadas, que o OSM cobre mal no interior, há duas bases abertas sem share-alike:

- **Overture Places**, sob CDLA-Permissive-2.0 e Apache 2.0, sem exigência de logo; o crédito sugerido é "© Overture Maps Foundation" ([Overture Places Guide](https://docs.overturemaps.org/guides/places)).
- **Foursquare OS Places**, com mais de 100 milhões de POIs sob Apache 2.0 e atualização mensal ([Foursquare](https://foursquare.com/resources/blog/data/evolving-fsq-open-source-places/)).

Nenhuma das duas tem cobertura de Mato Grosso medida. Por isso devem entrar só como **sugestão a validar** por um irmão, nunca como pino automático.

Quatro fontes ficam fora:

- **Google Places:** só o `place_id` pode ser guardado sem prazo, e latitude/longitude por no máximo 30 dias ([Google Maps Service Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms/index-20240422)). Isso é incompatível com o modo offline e com o orçamento.
- **Wikiloc:** o uso é restrito a pessoas físicas e a fins domésticos ([Wikiloc Terms](https://www.wikiloc.com/wikiloc/terms_en.html)).
- **AllTrails** e **Komoot:** não têm API pública encontrada.

| Fonte | O que entrega | Licença | Custo / limite | Uso recomendado | Verificado? |
| --- | --- | --- | --- | --- | --- |
| OSM via extrato Geofabrik | cachoeiras, mirantes, monumentos, trilhas, postos, hospedagem, comida, `club=motorcycle` | ODbL (atribuição + share-alike na base derivada) | R$ 0; extrato diário | **Base principal**, tabela separada `poi_osm` | Limites sim; tamanhos e contagens em MT não |
| Overpass público | o mesmo, sob demanda | ODbL | ~100 consultas/dia em uso automatizado | Só para testes manuais | Sim (wiki) |
| Wikidata + Commons | nome trilíngue, foto, link | CC0 (dados) / por arquivo (fotos) | R$ 0; 60 s/min por cliente | Enriquecer atrativos | Licença CC0 não |
| Wikivoyage | texto de destino | CC BY-SA 4.0 | R$ 0 | Resumo com atribuição e link | Sim |
| ANP (revendedores, preços, PMQC, fiscalização) | postos com lat/lon, preço semanal por CNPJ | dados abertos gov.br (licença a confirmar) | R$ 0 | **Postos: preço e indicador de qualidade** | Parcial |
| CNUC/MMA | polígonos de unidades de conservação | Creative Commons Atribuição | R$ 0; mensal | Parques e Estradas Parque | Sim |
| Cadastur (MTur) | meios de hospedagem | aberto | R$ 0 | Não usar como base | Último CSV de 2021, sem coordenadas confirmadas |
| Overture / Foursquare OS | restaurantes, hotéis, comércio | CDLA-P-2.0 / Apache 2.0 | R$ 0 (GeoParquet) | Sugestão a validar | Cobertura de MT não |
| Google Places | tudo | proprietária | pago; cache proibido | Fora (no máximo guardar `place_id`) | Sim |
| Wikiloc, AllTrails, Komoot, Strava | trilhas e rotas | proprietária | — | **Fora**; só o GPX do próprio irmão | Wikiloc e Strava sim |

## A ANP entrega posição e preço dos postos, mas não a nota do app

A ANP é a melhor fonte do governo para o app. O cadastro aberto de revendedores e a API Revendedores trazem **CNPJ, município e latitude/longitude do posto**, com um campo de validação geográfica ([Manual da API Revendedores](https://www.gov.br/anp/pt-br/centrais-de-conteudo/paineis-dinamicos-da-anp/paineis-dinamicos-do-abastecimento/api-revendedores-manual-usuario.pdf)).

A série de preços por revenda traz CNPJ, endereço, bandeira, produto, data e valor, mas **não traz coordenadas** ([metadados SHPC](https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/shpc/metadados-serie-historica-precos-combustiveis.pdf)). Ela também é uma amostra: em 2017 cobria cerca de **5.800 postos por semana** ([ANP à Câmara, 2017](https://www2.camara.leg.br/atividade-legislativa/comissoes/comissoes-permanentes/cdc/apresentacoes-em-eventos/realizadas-em-2017/preco-dos-combustiveis/apresentacao-anp/view)). Em resumo, o preço oficial chega por CNPJ e só para os postos amostrados. O preço colaborativo dos irmãos continua necessário, sempre com a fonte e a data.

A nota de qualidade é o ponto fraco. O app "ANP com VC – Postos", lançado em jul/2026, dá **nota de 0 a 5** a cada posto com base nas fiscalizações dos últimos 5 anos ([TNH1](https://www.tnh1.com.br/noticia/nid/anp-cria-app-para-motorista-conferir-qualidade-de-posto-de-combustivel/); [O POVO](https://mais.opovo.com.br/jornal/farol/2026/07/14/anp-cria-app-para-motorista-conferir-qualidade-de-posto-de-combustivel.html)). **Não foi encontrado dataset aberto nem API dessa nota.** Há ainda uma contradição sobre o formato: uma fonte diz que o app funciona só no navegador, outra diz que tem versões iOS e Android ([Tribuna de Minas](https://tribunademinas.com.br/?p=853670); [AMDJUS](https://amdjus.com.br/anp-lanca-app-para-avaliar-qualidade-de-postos-de-combustivel/)).

Os ingredientes da nota, porém, são abertos: as ações de fiscalização ([metadados](https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/arquivos-acoes-de-fiscalizacao/metadados-acoes-fiscalizacao.pdf)) e as amostras do PMQC, que têm latitude/longitude ([metadados PMQC](https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/pmqc/pmqc-metadados.pdf)). A recomendação é mostrar um "**histórico de fiscalização ANP**" calculado pelo app, com o texto "baseado em dados abertos da ANP, atualizado em [data]". Ele **nunca** deve ser chamado de "nota ANP", para não sugerir que é o número oficial do app da ANP.

Para parques, o MMA publica mensalmente os polígonos das unidades de conservação (CNUC) em shapefile, sob licença Creative Commons Atribuição ([dados.mma.gov.br](https://dados.mma.gov.br/de/dataset/unidadesdeconservacao/resource/6ba9a557-87e8-4882-acb7-b3e0f0ea192d)). Com isso o app pode mostrar "você está entrando no Parque Nacional X" e destacar a Estrada Parque da Transpantaneira.

O Cadastur só tem CSV aberto de hospedagem atualizado em 2021 ([dados.turismo.gov.br](https://dados.turismo.gov.br/dataset/meios-de-hospedagem/resource/3a889034-b544-493d-b1ee-866a470b763e)), e a API dele no Conecta gov.br é voltada a órgãos públicos ([Conecta](https://www.gov.br/conecta/catalogo/apis/cadastur-cadastro-de-prestadores-de-servicos-turisticos)). Serve, no máximo, para marcar os municípios turísticos do Mapa do Turismo. As fontes de IBGE, DNIT e da Secretaria de Turismo de MT **não foram pesquisadas com sucesso**, e não apareceu nenhuma lista oficial georreferenciada de atrativos de Chapada dos Guimarães, Nobres ou do Pantanal.

## A Rota Biker não chegou a Mato Grosso e não publica dados abertos

A Rota Biker é um movimento **privado**, criado em 2023 por Marcos Turbay a partir do Serpenteando Café, em Bocaiúva do Sul (PR) ([Wikipedia](https://pt.wikipedia.org/wiki/Rota_Biker)). É uma rede de monumentos numerados em estabelecimentos parceiros, com um passaporte de carimbos físico, sem versão digital ([Motociclistas Unidos](https://motociclistasunidos.com.br/rota-bikers/)). O site oficial tem lista e mapa ([monumentobikers.com.br](https://monumentobikers.com.br/monumentos/)), mas não abriu nesta pesquisa: não se sabe se há arquivo KML ou termos de uso.

A rede cresce rápido. Eram "22 monumentos em 6 estados" em 2025 e a numeração chegou ao **nº 45 em out/2026** ([Blog do Chaddad](http://blogdochaddad.blogspot.com/2025/01/rota-biker-o-novo-movimento-do.html?m=0); [Estrada a Dois](https://www.estradaadois.com/blog/monumentos-rota-biker-locais-enderecos-horarios)). A concentração é em PR, SC, SP e MG, e o Paraná já reconheceu 7 pontos em lei ([aRede](https://arede.info/ponta-grossa/692658/parana-sanciona-lei-que-oficializa-rota-biker-com-parada-em-ponta-grossa)).

No Centro-Oeste existem:

- o **nº 36 "Route 60"**, em Goiás (GO);
- o **nº 43 "Parada Route"**, em São Miguel do Passa Quatro (GO);
- um ponto no DF, citado por guias de terceiros ([monumentobikers.com.br](https://monumentobikers.com.br/monumentos/); [Brapdoo](https://brapdoo.com/rota-biker-guia-monumentos-motociclismo));
- uma exposição provisória em Campo Grande (MS) durante o MS Moto Week, de 29/10 a 01/11/2026 ([A Crítica](https://acritica.net/entretenimento/monumento-rota-biker-feira-central-campo-grande/)).

**Nenhum monumento a motociclistas foi encontrado em Mato Grosso**, nem da Rota Biker nem municipal.

A conclusão é jurídica e prática. Endereço de estabelecimento é fato. Já copiar a lista inteira, com numeração, nomes e descrições, pode infringir o direito sobre a compilação, que a Lei 9.610/98 protege como base de dados (art. 7º, XIII; [Planalto](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm)). Além disso, a lista desatualizaria em um mês. A recomendação é **pedir autorização à organização** e, até lá, oferecer uma categoria "Marco motociclístico" que os irmãos cadastram com moderação, com link para o site oficial.

Os eventos têm datas públicas e servem de semente para a agenda:

- Barretos Motorcycles: 30/04 a 02/05/2026 ([Motonline](https://motonline.com.br/noticia/barretos-motorcycles-2026-datas/));
- Bike Fest: São Lourenço de 14 a 17/05 e Tiradentes de 24 a 28/06 ([Autopapo](https://autopapo.com.br/motos/bike-fest-sao-lourenco-e-tiradentes-2026/));
- Capital Moto Week: 23/07 a 01/08 em Brasília, com 863 mil visitantes ([Motoo](https://www.motoo.com.br/capital-moto-week-2026-bate-recorde-com-863-mil-visitantes/)).

Em MT há dois eventos fixos. O **Moto Encontro Agosto Lilás** entrou no calendário oficial do estado pela Lei 13.260/2026 e acontece na 3ª semana de agosto; a cidade-sede não foi identificada ([ALMT](https://www.al.mt.gov.br/norma-juridica/urn:lex:br;mato.grosso:estadual:lei.ordinaria:2026-03-25;13260/gerar-pdf-redacao)). O **Mato Grosso Motorcycle Weekend**, em Chapada dos Guimarães, dura 3 dias e é gratuito; a data exata não foi obtida ([Correio da Manhã](https://www.correiodamanha.com.br/nacional/centro-oeste/2026/08/309202-mt-chapada-dos-guimaraes-tera-encontro-de-motos-e-shows.html)). A Lei 13.436/2026 reconhece as atividades de motoclubes de MT como de relevante interesse social e cultural ([ALMT](https://www.al.mt.gov.br/norma-juridica/urn:lex:br;mato.grosso:estadual:lei.ordinaria:2026-06-09;13436/gerar-pdf-redacao)). As agendas de terceiros, como a do Motonline, são texto editorial: datas podem ser cadastradas uma a uma, citando a fonte, mas não importadas em massa.

**Pontos de encontro tradicionais de motociclistas em Cuiabá não aparecem documentados online.** Esse conhecimento está com os irmãos do capítulo e é a primeira coisa a pedir a eles.

Para estradas cênicas, as referências próximas de Cuiabá são três:

- **MT-251** (Cuiabá–Chapada). Tem risco de queda de rochas no Portão do Inferno e **16 pontos de atenção** no trecho Salgadeira–Mata Fria ([Nota técnica, O Eco](https://oeco.org.br/wp-content/uploads/2024/06/NT_FormadObservaSOSChapada.pdf)). Merece um alerta permanente na camada de alertas.
- **Transpantaneira (MT-060).** São cerca de 145 km de terra, com 120 a 125 pontes, limite de 60 km/h e **nenhum posto no trajeto**. A seca vai de maio a outubro ([Wikipedia](https://en.wikipedia.org/wiki/Transpantaneira); [Seguro Viagem](https://www.seguroviagem.srv.br/blog/viagem-estrada-transpantaneira/)). É o caso exemplar para "Prefiro terra" e para o aviso "sem combustível por X km".
- **Acesso a Nobres/Bom Jardim** (BR-364 + MT-241), com trechos sem sinal de celular ([Quanto Custa Viajar](https://quantocustaviajar.com/blog/nobres-mato-grosso)). Isso reforça a importância do mapa offline do trajeto.

## Sede nacional fica em Feira de Santana, e o clube declara 331 facções

O Moto Clube Bodes do Asfalto foi fundado em **01/08/2003**, com **sede nacional em Feira de Santana (BA)**. Pelo site oficial, com dados autodeclarados de ago/2023, são **mais de 12 mil associados, 331 subsidiárias municipais e presença em 18 países** ([bodesdoasfalto.org.br](https://www.bodesdoasfalto.org.br/app/apresentacao.html); [Jornal Grande Bahia](https://jornalgrandebahia.com.br/2018/08/feira-de-santana-moto-clube-bodes-do-asfalto-comemora-15-anos-de-fundacao/)). Outros números circulam: 12.087 membros segundo a GLMPE e "mais de 8 mil" numa página de facção ([GLMPE](https://www.glmpe.org.br/motoclube)).

Em Mato Grosso, o clube foi fundado em **02/02/2008** ([GLEMT](https://www.glemt.org.br/page/bodes-do-asfalto)). A "Coordenação Mato Grosso" já levou projetos de lei à ALMT ([ALMT 2025](https://www.al.mt.gov.br/storage/webdisco/cp/20250402113514159600.pdf)), e há uma subcoordenação em Rondonópolis ([Maiores do Estado](https://maioresdoestado.com.br/cidades/rondonopolis/rondonopolis-atraira-motoclubes-de-todo-o-pais-durante-o-caveiras-moto-festival/)). A hierarquia provável é Sede Nacional → Coordenação Estadual → Subcoordenação → Facção. O modelo atual do app tem só `capitulos`, e convém prever um campo de coordenação estadual.

O termo do clube é "**facção**". No Brasil, essa palavra também remete ao crime organizado, e os próprios buscadores misturam os resultados. Por isso a escolha do termo na interface é do dono.

Facções com fonte pública, em lista **parcial e não exaustiva**, sem endereços:

| Facção / unidade | UF | Fonte |
| --- | --- | --- |
| Sede nacional, Feira de Santana | BA | [Instagram @apriscodosbodes](https://www.instagram.com/apriscodosbodes/) |
| Cuiabá | MT | [GOB](https://www.gob.org.br/registro-da-visita-dos-integrantes-do-bodes-do-asfalto-de-cuiaba-mt/) |
| Rondonópolis (subcoordenação) | MT | [Maiores do Estado](https://maioresdoestado.com.br/cidades/rondonopolis/rondonopolis-atraira-motoclubes-de-todo-o-pais-durante-o-caveiras-moto-festival/) |
| Fortaleza | CE | [Facebook](https://www.facebook.com/p/Bodes-do-Asfalto-Motoclube-Fortaleza-CE-100064486911370/) |
| João Pessoa | PB | [bodesjoaopessoa.com.br](https://www.bodesjoaopessoa.com.br/) |
| Natal | RN | [Instagram](https://www.instagram.com/mcbda.natalrn/) |
| Blumenau | SC | [Motociclismo do Brasil](https://motociclismodobrasil.com.br/motoclubes/motoclube_1461.html) |
| Chapecó | SC | [Instagram](https://www.instagram.com/mcbda_chapeco/) |
| Curitiba | PR | [Instagram](https://www.instagram.com/bodesdoasfaltocuritiba/) |
| Londrina | PR | [site](https://bodesdoasfaltolondrina.com.br/nossa-historia/) |
| Francisco Beltrão (incerto) | PR | [bodesdoasfaltofb.com.br](http://www.bodesdoasfaltofb.com.br/) |
| Serra Gaúcha | RS | [Instagram](https://www.instagram.com/bodes_do_asfalto_serra_gaucha/) |
| São Paulo Sul | SP | [Instagram](https://www.instagram.com/bodesdoasfalto_saopaulo_sul/) |
| Vale do Paraíba e Litoral Norte | SP | [Instagram](https://www.instagram.com/bodesdoasfalto_vpln/) |
| Zona Oeste (Rio de Janeiro) | RJ | [Instagram](https://www.instagram.com/mcbdazorj/) |
| Sul Fluminense | RJ | [smallpage](https://bodessulfluminense.smallpage.com.br/) |
| Campo das Vertentes | MG | [Instagram](https://www.instagram.com/bda.campodasvertentes/) |

A tabela serve para semear a tabela `capitulos` e convidar diretorias, **não para pôr endereços no mapa**. Com 331 unidades declaradas, o cadastro à mão é inviável. A lista oficial provavelmente existe na área restrita do site do clube e deve vir da diretoria. O certo é que cada diretoria cadastre a própria sede pelo painel. A sede de uma facção muitas vezes é a casa ou o bar de um membro. Ligar esse endereço a "clube de maçons" revela dado sensível (LGPD, art. 5º, II e art. 11; [Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)). Por isso, sede visível **só a membros logados**, com a opção "mostrar só a cidade", como já vale para as Lojas.

**Outros motoclubes pedem mais cautela ainda.** Não existe cadastro nacional oficial: a CBM cuida do esporte ([CBM](https://www.cbm.esp.br/federacoes.php)), e os diretórios privados são irregulares e desatualizados, com termos de uso não lidos ([motoclub.run](https://motoclub.run/clubes); [accassola](https://www.accassola.com.br/moto-clubes-e-grupos.php)). Na cultura MC, colete e brasão são identidade e território, e o brasão "só deve ser recebido por quem o merece" ([El Bando MC](https://www.elbando.com.br/2014/12/24/definicoes-sobre-moto-clubes/)). Há também risco reputacional: em 2026 houve prisões ligadas à sede de um motoclube no Rio ([Mais Goiás](https://www.maisgoias.com.br/brasil/membros-de-motoclube-sao-presos-por-suspeita-de-apologia-do-nazismo-no-rj/)).

A recomendação tem seis pontos:

1. Só mostrar sedes de outros clubes **cadastradas pelo próprio clube** (opt-in), por um formulário "Cadastrar meu motoclube" com aceite de termos, campo de visibilidade e botão "remover".
2. Nunca importar em massa, nem mesmo os registros `club=motorcycle` do OSM.
3. Nunca exibir o brasão de outro clube sem autorização.
4. Nunca mostrar posição ao vivo de irmãos perto dessas sedes.
5. Usar um **ícone próprio e genérico** para esses pinos, distinto do escudo do Bodes.
6. No lançamento em Cuiabá, mostrar só sedes do Bodes.

O app também **nunca deve enviar sedes do Bodes ao OSM**, porque isso tornaria pública a ligação entre o local e a filiação maçônica.

## Robô de redes sociais é vedado; robô de dados abertos custa zero

Um coletor automático de Instagram, Facebook, TikTok, Strava ou Wikiloc não é viável para este app, por três razões que se somam.

A primeira são os termos e as APIs:

- **Instagram:** a busca por hashtag permite só **30 hashtags únicas a cada 7 dias**, por conta Business/Creator, e exige revisão do app pela Meta ([Meta for Developers](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/hashtag-search)). Isso expõe o projeto à Meta como "app de motoclube maçônico".
- **Meta em geral:** os termos proíbem coleta automatizada sem permissão *(cláusula não reconferida)*. O caso Meta v. Bright Data, que favoreceu a raspagem sem login, é americano e estreito ([Quinn Emanuel](https://www.quinnemanuel.com/the-firm/news-events/client-alert-what-does-the-meta-v-bright-data-summary-judgment-ruling-mean-for-web-scraping/)).
- **Strava:** só permite mostrar os dados ao próprio atleta e proíbe uso em IA ([DC Rainmaker](https://dcrainmaker.com/2024/11/stravas-changes-to-kill-off-apps.html); [the5krunner](https://the5krunner.com/2024/11/20/strava-issues-clarification/)).
- **TikTok Research:** o Brasil não é elegível ([TikTok](https://developers.tiktok.com/products/research-api)).
- **X:** desde fev/2026 não há plano gratuito ([Open Terms Archive](https://opentermsarchive.org/en/memos/x-replaces-its-dollar200-entry-level-api-plan-with-a-pay-per-use-model/)).
- **Reddit:** o plano grátis é só não comercial e precisa de aprovação ([Data365](https://data365.co/blog/reddit-api-pricing)).
- **Wikiloc:** uso comercial só com conta aprovada expressamente ([Wikiloc](https://es.wikiloc.com/wikiloc/terms_es.html)).

A segunda é a lei brasileira. A LGPD exige finalidade compatível e boa-fé no uso de dado público (art. 7º, §§3º, 4º e 7º; [Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)). A ANPD afirma que dado público não é dado livre, e sua **primeira sanção** envolveu justamente raspagem ([TabNews](https://www.tabnews.com.br/NewsletterOficial/anpd-alerta-que-web-scraping-de-dados-pessoais-viola-lgpd); [Baptista Luz](https://www.baptista.com.br/comercializacao-de-dados-pessoais-aplicacao-da-primeira-multa-pela-anpd-e-abordagens-internacionais-de-web-scraping/?lang=en)). O dado sensível, como a filiação filosófica, não admite "legítimo interesse" como base legal (art. 11).

A terceira é o direito autoral. Fotos e textos de posts são obras protegidas (art. 29 da Lei 9.610/98), enquanto ideias e informações não são (art. 8º; [Planalto](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm)).

**O pior cenário do projeto inteiro seria um robô que ligasse quem postou #bodesdoasfalto a um irmão do app.** Isso é tratar filiação maçônica inferida sem base legal.

Isso não mata as sugestões automáticas. Muda o que o robô coleta: **lugares, nunca pessoas**. As alternativas legítimas, todas com custo próximo de zero, são:

- **Fontes abertas:** OSM, Wikidata e Wikivoyage, com atribuição.
- **YouTube Data API**, guardando só o ID do vídeo e reatualizando título e descrição a cada 30 dias, como manda a política ([YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies-guide); [Derived Metrics](https://developers.google.com/youtube/terms/derived-metrics-policy)).
- **GPX enviado pelo próprio irmão**, com licença explícita de exibição a membros.
- **Link colado por um irmão** (Reel, vídeo, post). O app mostra só um cartão com o link, e o moderador extrai o lugar.
- **Parcerias por escrito** com secretarias de turismo e federações, por planilha, iCal ou RSS.

O coletor roda em cron no GitHub Actions e segue regras fixas:

- respeita robots.txt e termos de uso;
- usa User-Agent genérico ("BodesBot/1.0" + URL de contato do domínio do projeto, **sem o nome do dono**);
- faz no máximo 1 requisição a cada poucos segundos por domínio;
- nunca usa login;
- guarda só nome do lugar, coordenada, tipo, URL de origem, data e licença;
- joga tudo numa **fila de revisão humana** antes de publicar.

## Sugestões de passeios: discretas no mapa, completas numa tela própria

Os apps de moto convergem num padrão de quatro partes:

1. camadas de POI que se ligam e desligam por categoria no mapa;
2. uma área separada de "Descobrir", ordenada por proximidade e qualidade;
3. coleções curadas ao lado do conteúdo da comunidade;
4. avaliação pedida **depois** do passeio.

Exemplos de cada parte:

- **Calimoto:** 10 categorias de POI (turismo, passos, trechos de curvas, encontros de motociclistas, postos, comida, hotéis biker-friendly, estacionamento, camping e sorveteria), mais gerador de bate-volta com 8 direções ([calimoto Help](https://support.calimoto.com/hc/en-us/articles/10763643158428-POI-Points-of-Interest)).
- **Kurviger:** cafés e encontros mantidos pela própria equipe, porque o OSM não tem fotos nem detalhes, e aceita envio de POIs por usuários ([Kurviger: Submit POI](https://docs.kurviger.de/web/pois)).
- **Komoot:** pede avaliação dos "Highlights" depois da atividade e **oculta os que recebem muitas avaliações negativas** ([komoot Help](https://www.komoot.com/help/highlights)).
- **REVER:** separa "Featured Routes", curadas à mão, de "Incredible Roads", avaliadas pela Butler Maps ([REVER](https://www.rever.co/post/new-riding-season-new-way-to-discover-rides)).

O equivalente no Bodes é **"Passeios do clube"** (curados por diretoria ou moderador) ao lado de **"Rotas de irmãos"** (compartilhadas e avaliadas depois de rodar).

A segurança define o resto. A NHTSA limita o olhar fora da via a **2 s por vez e 12 s no total**, e recomenda bloquear digitação com o veículo em movimento ([US DOT](https://www.transportation.gov/briefing-room/us-dot-releases-guidelines-minimize-vehicle-distractions)). No Android Auto, o texto das listas é truncado em 2 linhas e cada linha precisa ter distância e uma ação ([Google Cars](https://developers.google.com/cars/design/create-apps/apps-for-drivers/templates/place-list-map-template)). Por isso, descobrir, filtrar e avaliar só funcionam **com a moto parada**. No modo pilotando, as sugestões somem e só postos e paradas do passeio aparecem, como ícones sem rótulo.

No mapa, o relatório de usabilidade já fixou os limiares (R44, [relatório de usabilidade](Usabilidade%20e%20interface%20Bodes%20do%20Asfalto.md)):

- no máximo 7 a 8 cores de moldura;
- categorias distinguidas pelo pictograma creme;
- agrupamento com `clusterRadius 50` e `clusterMaxZoom 14`;
- sedes e Ágapes nunca agrupam;
- prioridade: SOS > Ágape > sede > posto na rota > irmão > Loja > turismo.

Sem rótulos de texto abaixo do zoom 13, porque usuários do Kurviger pedem com frequência para escondê-los ([Kurviger forum](https://forum.kurviger.de/t/make-it-possible-to-enable-disable-poi-texts-on-the-map/903)). As **rotas sugeridas não são desenhadas no mapa por padrão**, para evitar um emaranhado de linhas. Aparecem só um pino discreto no ponto de partida e um chip "Passeios perto: N". A linha surge quando o irmão abre o cartão.

Os números a seguir para a tela de sugestões são **inferências de design**, não medições. Nenhuma fonte deu valores específicos para motociclistas de 40 a 60 anos.

- **Raio de busca** em 4 botões grandes: 50, 100, 200 e 400 km (meio dia, dia, dia longo, fim de semana).
- **3 a 5 cartões por tela.**
- **Ordem:** "Recomendado pelo clube" no topo, depois os demais por distância até o início.
- **Filtros** numa folha inferior, só quatro: Duração, Piso (Só asfalto / Misto / Prefiro terra), Tipo (Bate-volta / Ida) e Curvas (Tranquila / Com curvas / Muitas curvas).
- **Cartão:** foto, nome, km, tempo, % de terra, nível de curvas, nota "TFA" e quantos irmãos fizeram. Botões "Usar rota" (laranja) e "Salvar".
- **Recálculo:** "Usar rota" recalcula a partir da posição atual, como no Komoot e no app da Harley-Davidson ([H-D App](https://www.harley-davidson.com/us/en/explore/discover/harley-davidson-app)).
- **Offline:** "Usar rota" baixa o trajeto mais os postos, oficinas e hospitais do corredor.

As categorias de POI propostas, com ícones, ficam na tabela abaixo. Ela segue as cores do DESIGN.md: `laranja` só para destaques e `vermelho` só para SOS. Os pictogramas são de traço, sem emoji. A prioridade (P1, P2, P3) é inferida a partir das categorias comuns em Calimoto e Kurviger, porque **nenhuma pesquisa confiável ranqueia o uso** ([calimoto](https://support.calimoto.com/hc/en-us/articles/10763643158428-POI-Points-of-Interest); [Kurviger](https://docs.kurviger.de/web/getting_started)).

| Prior. | Categoria | Fonte de dados | Pictograma (traço) | Grupo de moldura | Padrão no mapa |
| --- | --- | --- | --- | --- | --- |
| P1 | Sede/facção do Bodes | painel (diretoria) | escudo do clube (simplificado) | Clube | ligado, nunca agrupa |
| P1 | **Sede de outro motoclube** | cadastro opt-in do próprio clube | **capacete + bandeirola genérica** (nunca brasão alheio) | moldura neutra com contorno tracejado | desligado |
| P1 | Loja maçônica | irmão da Loja | coluna (discreta, sem esquadro e compasso; decisão do dono) | Clube | ligado só para membros |
| P1 | Ágape / evento / encontro | diretoria, irmãos | taça ou calendário | Clube (destaque laranja) | ligado, nunca agrupa |
| P1 | Posto de combustível | OSM + ANP + preço colaborativo | bomba | Estrada | ligado |
| P1 | Parada/café biker-friendly e ponto de encontro | irmãos (curado) | xícara | Comer/dormir | ligado |
| P1 | Mirante | OSM `tourism=viewpoint` | binóculo | Natureza/turismo | desligado |
| P1 | Monumento / memorial | OSM `historic=*` + Wikidata | obelisco | Natureza/turismo | desligado |
| P1 | Ponto turístico | OSM `tourism=attraction` + Wikidata | estrela de contorno | Natureza/turismo | desligado |
| P1 | Marco motociclístico (Rota Biker etc.) | irmãos + link oficial / licença | moto de perfil | Clube | desligado |
| P2 | Cachoeira | OSM `waterway=waterfall` + CNUC | gota/queda | Natureza/turismo | desligado |
| P2 | Trilha / estrada de terra | OSM `highway=path/track` | linha tracejada (não é pino) | — | só com "Prefiro terra" |
| P2 | Negócio de irmão (oficina, pousada, restaurante) | Guia de Negócios | chave inglesa, cama, talher | Negócios | ligado |
| P2 | Oficina / borracharia / loja de moto | OSM `shop=motorcycle` + irmãos | chave inglesa | Estrada | desligado |
| P2 | Pousada/hotel (atributo "garagem para moto") | OSM `tourism=*` + irmãos | cama | Comer/dormir | desligado |
| P2 | Restaurante de estrada | OSM `amenity=restaurant` + Overture (validar) | talher | Comer/dormir | desligado |
| P2 | Parque / unidade de conservação | CNUC/MMA | folha (polígono leve) | Natureza/turismo | desligado |
| P3 | Hospital/UPA, PRF | OSM | cruz, escudo PRF | Socorro | só no SOS e sob demanda |
| — | Buraco, cascalho, radar, obra | irmãos/alertas | — | `alerta` | **alerta por voz, não pino** |

São seis grupos de moldura (Clube, Estrada, Comer/dormir, Natureza/turismo, Negócios, Socorro), mais o `alerta`. Assim o limite de 7 a 8 cores é respeitado. A sede de outro motoclube fica fora dos grupos de cor e se distingue pela forma: moldura neutra com **contorno tracejado** e pictograma de capacete. Com isso, nunca se confunde com o escudo do Bodes.

## Conferir antes de usar

Estes itens vieram de trechos de busca ou de fontes secundárias e precisam ser abertos na fonte antes de virar dado do app ou texto público:

| # | Item | Por que conferir | Onde |
| --- | --- | --- | --- |
| 1 | Etiquetas OSM de mirante, trilha, monumento, posto, hospedagem e moto | páginas da wiki não abriram | wiki.openstreetmap.org |
| 2 | Tamanho e data dos extratos Brasil e Centro-Oeste | página bloqueada | download.geofabrik.de |
| 3 | Contagem de POIs por categoria em MT, incluindo `club=motorcycle` | taginfo/Overpass bloqueados | taginfo.geofabrik.de |
| 4 | Licença CC0 do Wikidata | não confirmada | wikidata.org |
| 5 | Licença e periodicidade dos dados da ANP; CSV de preços 2021–2026 ainda semanal | gov.br bloqueado | gov.br/anp (dados abertos) |
| 6 | Existência de dataset/API da nota do "ANP com VC – Postos"; app só web ou também nativo | fontes divergem | ANP (pedido via Fala.BR se preciso) |
| 7 | Cobertura de Overture/Foursquare em MT | não medida | GeoParquet filtrado por bbox |
| 8 | Lista e mapa da Rota Biker, existência de KML e termos de uso | site não abriu | monumentobikers.com.br |
| 9 | Monumento da Rota Biker em Campo Grande (MS) virou permanente? | só notícia | organização Rota Biker |
| 10 | Datas do MT Motorcycle Weekend e cidade do Agosto Lilás | não obtidas | organizadores / ALMT |
| 11 | Sede nacional em Feira de Santana, endereço, 331 facções, "Dia do Bodes" em SP/ES | autodeclarado ou snippet | dono / diretoria nacional |
| 12 | Facção de Francisco Beltrão (domínio "fb") | inferência pelo nome | diretoria |
| 13 | Cláusulas da Meta e da Wikiloc sobre robôs; termos de AllTrails e Relive | não reconferidos | sites oficiais |
| 14 | Cota do YouTube (10.000 unidades/dia; `search.list` = 100) | não confirmada | developers.google.com/youtube |
| 15 | Textos legais citados (LGPD arts. 5º, 7º e 11; LDA arts. 7º, 8º, 29 e 87) | citados de memória/snippet | planalto.gov.br |
| 16 | Cotas grátis atuais do GitHub Actions e do Supabase | não reconferidas | páginas de preço |

## Plano de implementação recomendado

O plano encaixa nas etapas já previstas em `docs/ETAPAS.md`: Etapa 2 (mapa e lugares), Etapa 3 (rotas), Etapa 4 (passeios) e Etapa 6 (confraternização). Ele não pede nenhuma conta paga.

**Fase A — Base de dados aberta (início da Etapa 2, cerca de 1 semana)**

1. Criar o workflow `poi-osm.yml` (cron semanal). Ele baixa o extrato Centro-Oeste da Geofabrik, filtra com `osmium tags-filter` pelas etiquetas da tabela de categorias e gera um GeoJSON ou SQL compacto. Para o lançamento em Cuiabá, basta MT. A importação no Supabase usa a chave guardada só em GitHub Secrets.
2. Migration da tabela `poi_osm`: `osm_tipo`, `osm_id` (chave composta), `categoria`, `nome`, `geom geography(Point)`, `tags jsonb` reduzidas, `atualizado_em`. Índice GIST, RLS de **leitura só para membros** e escrita só pelo job. A tabela fica separada das tabelas próprias, por causa da ODbL.
3. Migration de `poi_aberto` (fontes não OSM): `fonte` (anp, wikidata, cnuc, overture), `id_fonte`, `licenca`, `atribuicao`, `categoria`, `geom`, `dados jsonb`, `atualizado_em`. A tabela `cnuc_poligonos` fica à parte, com `geography(MultiPolygon)` simplificado.
4. Job ANP semanal: cadastro de revendedores (lat/lon por CNPJ) ligado ao `amenity=fuel` por CNPJ ou por proximidade de até 100 m. Esse limiar é inferência e deve ser calibrado com dados reais. Depois anexa o último preço por CNPJ (`posto_preco`: produto, valor, data, fonte = "ANP" ou "irmão") e o "histórico de fiscalização ANP" calculado a partir dos dados de fiscalização e do PMQC.
5. Job Wikidata mensal: SPARQL por itens com coordenada em MT e tipo cachoeira, mirante, parque ou monumento. Guarda o QID, nomes em pt/es/en e a foto P18, com autor e licença lidos do Commons.
6. Atribuição visível no mapa e na ficha do lugar: "© OpenStreetMap contributors", "Dados: ANP", "Foto: autor/licença (Wikimedia Commons)".

**Fase B — Lugares do clube e de terceiros (Etapa 2)**

7. Migration de `lugares` (cadastro próprio): `tipo` (sede_bodes, sede_motoclube, loja, negocio, ponto_encontro, marco_moto), `capitulo_id`, `responsavel_id`, `visibilidade` (membros / só cidade / oculto), `consentimento_em`, `status` (pendente, aprovado, removido), `geom`, `geom_publica`. A coordenada exata só sai para quem a RLS permite. A posição "só cidade" é gerada no servidor.
8. Tabela `motoclubes_externos` (nome, cidade, contato do responsável, aceite de termos, data). O formulário "Cadastrar meu motoclube" fica no painel ou num link público simples, tem moderação, e o próprio clube pode pedir remoção. Sem brasão na v1. Ícone: capacete com bandeirola em moldura tracejada.
9. Semear `capitulos` com as facções conhecidas (tabela acima), sem endereço. Cada diretoria cadastra a própria sede.
10. Pedir aos irmãos de Cuiabá os 10 a 20 pontos de encontro, cafés e paradas tradicionais. Eles entram como `ponto_encontro`, curados.
11. Função `lugares_na_area(bbox, categorias[])` (RPC, `security definer` revisado) que une `poi_osm`, `poi_aberto` e `lugares` visíveis e devolve no máximo ~300 pontos por chamada, para manter o mapa leve. Esse teto é inferência. Testes pgTAP cobrem a visibilidade de sedes e Lojas e a ausência de coordenada exata em "só cidade".
12. Componentes de pino em `app/src/map/` com os seis grupos de moldura e os pictogramas da tabela, convertidos para SVG a partir do Kit. Agrupamento por camada (`clusterRadius 50`, `clusterMaxZoom 14`), rótulos só a partir do zoom 13, chips de filtro: ligados Irmãos, Sedes/Ágapes e Postos; demais desligados, com a escolha lembrada.

**Fase C — Sugestões de passeios (Etapas 3 e 4)**

13. Migration de `sugestoes_passeio`: `origem` (clube, irmao, osm_wikivoyage, youtube_link), `autor_id`, `capitulo_id`, `geom geography(LineString)`, `inicio geography(Point)`, `km`, `pct_terra`, `curvas` (1 a 3), `duracao_estimada`, `licenca_aceita_em`, `status` (fila, aprovada, oculta), `fonte_url`, `fonte_licenca`. Tabela `avaliacoes_passeio`: TFA, "já fiz", "quero fazer", comentário curto. A ocultação é automática quando a proporção de avaliações negativas passa de um limite configurável no painel (padrão Komoot; o número fica para calibrar).
14. Fila de revisão no painel: a diretoria aprova as sugestões do próprio capítulo, e o moderador as demais.
15. Os trajetos gravados entram como sugestão só se o irmão marcar "compartilhar como sugestão". O corte automático do início e do fim perto da zona privada já é regra do projeto.
16. Tela "Sugestões de passeios": botões de raio 50/100/200/400 km, busca por cidade, 4 filtros, "Recomendado pelo clube" no topo e cartões grandes. "Usar rota" abre o planejador (Valhalla) a partir da posição atual e baixa o corredor para uso offline.
17. Camada no mapa: chip "Passeios perto: N" e pino de início pequeno, sem linha até abrir o cartão. Tudo escondido no modo pilotando. Notificação "Como foi?" depois de encerrar.
18. Link de vídeo colado por irmão: cartão com o link via oEmbed, guardando só a URL ou o ID do vídeo. O moderador extrai o lugar. Nada de autor, foto ou texto copiado.

**Fase D — Depois do lançamento em Cuiabá**

19. Contato formal com a Rota Biker. Se autorizarem, importar os marcos com link e crédito; se não, manter o cadastro por irmãos.
20. Agenda: eventos fixos (Agosto Lilás, MT Motorcycle Weekend, Capital Moto Week etc.) cadastrados um a um, com fonte. Parcerias por escrito com SEDEC-MT/Secretaria de Turismo e federações, para receber planilha ou iCal.
21. Overture/Foursquare como "sugestões a validar" de restaurantes e pousadas no corredor das rotas, só se a cobertura medida em MT valer a pena.
22. Abrir os motoclubes externos para outros estados, conforme a decisão do dono.

## Decisões para o dono

1. **Sede nacional:** confirmar que a sede nacional é Feira de Santana (BA) e se o endereço dela pode aparecer no app, para membros.
2. **Terminologia:** usar "facção" (termo do clube), "capítulo" (termo atual do projeto) ou outro na interface? "Facção" pode soar mal fora do clube.
3. **Hierarquia:** incluir no app o nível "Coordenação estadual" (ex.: Coordenação Mato Grosso, subcoordenação Rondonópolis)?
4. **Lista oficial de facções:** o dono ou a diretoria nacional pode fornecer a lista de facções e cidades? Ela existe na área restrita do site do clube.
5. **Outros motoclubes:** mostrar só com cadastro voluntário do próprio clube (recomendado), não mostrar na v1, ou mostrar também os do OSM com aviso?
6. **Brasões de outros clubes:** confirmar que não aparecem (pino genérico) até haver autorização por escrito.
7. **Rota Biker:** o dono autoriza o contato com a organização para pedir permissão de uso da lista? Quem assina o pedido?
8. **Ícone das Lojas:** coluna discreta, esquadro e compasso, ou só um pino de "Loja" sem símbolo maçônico?
9. **Nota de postos:** aceitar o "histórico de fiscalização ANP" calculado pelo app até a ANP abrir a nota oficial? Ou mostrar só o preço?
10. **Quem aprova as sugestões:** diretoria do capítulo, moderadores ou ambos? Uma rota de irmão pode ser vista por todos os capítulos ou só pelo dele, por padrão?
11. **Pontos de encontro de Cuiabá:** quem do capítulo levanta a lista inicial de cafés, paradas e encontros tradicionais?
12. **Eventos de outros motoclubes** (ex.: MT Motorcycle Weekend): entram na agenda do app ou só eventos do Bodes e maçônicos?

## Conclusão

O valor do mapa não vai vir de uma base comprada nem de um robô esperto. Vai vir do encaixe entre dados abertos, bons para o "onde" (OSM, ANP, CNUC), e conhecimento dos irmãos, bom para o "vale a pena" (paradas, encontros, passeios, sedes). As fontes abertas cobrem rápido a geografia de Mato Grosso, mas não sabem onde o motociclista de Cuiabá toma café antes de subir a MT-251. Essa lacuna, que nenhuma fonte online preencheu, é exatamente o diferencial que o clube tem e os concorrentes não.

O risco também mudou de lugar. O perigo jurídico do projeto não está nos POIs, que são fatos e quase todos abertos. Está em qualquer recurso que associe uma pessoa ou um endereço a um motoclube de maçons: robôs de redes sociais, sedes importadas sem consentimento, envio de sedes ao OSM. A regra que organiza todo o plano é simples: **coletar lugares, nunca pessoas; publicar sedes só com consentimento e só para membros.**
