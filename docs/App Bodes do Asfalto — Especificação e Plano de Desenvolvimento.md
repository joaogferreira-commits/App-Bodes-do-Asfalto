# App Bodes do Asfalto — Especificação e Plano de Desenvolvimento

Nov 10, 2026 · @João Guilherme

## Atualizações de 11/11/2026 (prevalecem sobre o restante deste documento)

Em caso de conflito vale esta ordem: `CLAUDE.md` > `docs/DESIGN.md` > `docs/ETAPAS.md` > este documento.

- **Empresa:** o app é do dono e será operado pela empresa dele (SLU no Simples Nacional), aberta até março de 2027. Receita e contratos no nome da empresa.
- **Contas das lojas:** Apple aberta como pessoa física para os testes e migrada para a empresa; Google Play aberto direto como conta de organização (com D-U-N-S), o que dispensa o teste obrigatório de 12 testadores por 14 dias. O teste fechado com irmãos é mantido.
- **Mapa e navegação:** mapa principal em **MapLibre** com estilo próprio e dados OpenFreeMap; navegação curva a curva com o **Google Navigation SDK** (trânsito ao vivo, recálculo, modo moto no Brasil, Android Auto e CarPlay), com o máximo de personalização que o Google permite; cálculo de rotas para planejamento, GPX, bate-volta e "posto na rota" num servidor **Valhalla** próprio. Plano B da navegação: Ferrostar + Valhalla. A Mapbox saiu do projeto.
- **Premium:** inclui a navegação curva a curva no app e no carro, estatísticas, diário, sem anúncios, visual exclusivo, regiões offline e avatar por IA (2 por mês). **Teste grátis de 7 dias.** Usuários gratuitos planejam a rota e abrem no Waze/Google Maps.
- **Offline:** a rota salva (linha e mapa do trajeto) segue grátis e offline no mapa principal; a navegação curva a curva do Google precisa de internet.
- **Avatar por IA:** 1 criação grátis por conta; Premium, 2 por mês.
- **CarPlay:** o lançamento não espera a aprovação da Apple; o CarPlay entra por atualização se atrasar.
- **Equipe:** sem programador e sem advogado contratados. A segurança é verificada por lista de verificação e varreduras automáticas; termos, privacidade e relatório de impacto são redigidos pelo agente e aprovados pelo dono.
- **Visual:** identidade "Patch de Colete" (docs/DESIGN.md), no lugar do tema provisório preto, laranja e cinza.
- **Custos e metas:** ver o Plano de Negócios (custo de cerca de R$ 1.020/mês no ano 1; meta de 10.000 cadastrados no ano 3).

## Visão geral

O app dos Bodes do Asfalto será a rede social e o copiloto de estrada do motoclube, publicado na App Store e no Google Play, com rotas no Android Auto e no CarPlay.

- **Público:** somente irmãos membros do Bodes do Asfalto, motoclube de maçons. O app é do dono do projeto, com licença do clube para nome e escudo.
- **Proposta:** planejar e rodar rotas juntos, registrar onde cada um passou e transformar quilômetros, sedes e monumentos em conquistas.
- **Princípio 1, segurança:** nada que distraia o piloto em movimento. Com a moto andando, o app só mostra rota, alertas e voz.
- **Princípio 2, identidade:** a cultura do clube (patches, hierarquia, sedes) está no centro da gamificação.
- **Princípio 3, lançar pequeno:** a primeira versão faz poucas coisas muito bem; o resto entra em versões seguintes.

## Decisões fechadas

Decisões tomadas na revisão de 10/11/2026; o agente segue esta tabela quando o resto do documento for menos específico.

| Tema | Decisão | Consequência para o desenvolvimento |
| --- | --- | --- |
| Propriedade | O app é do dono do projeto, operado pela empresa dele (SLU), não pela diretoria do clube | Dono = admin; moderadores nomeados por ele; licença escrita do clube para nome e escudo |
| Nome nas lojas | Bodes do Asfalto | Depende da licença do clube |
| Quem entra | Somente membros do Bodes do Asfalto | Capítulo com diretoria no app: ela aprova os próprios membros. Capítulo sem diretoria no app: formulário aprovado pelo dono ou moderadores, até a diretoria chegar; sem convidados na v1 |
| Natureza do clube | Motoclube de maçons | Filiação maçônica é dado sensível pela LGPD: consentimento específico, criptografia, anúncios só não personalizados; nunca coletar grau ou conteúdo reservado |
| Perfil maçônico | Loja, Oriente e Potência opcionais | Cada campo com visibilidade própria (ninguém, amigos, todos os membros) |
| Organização | Várias sedes/capítulos | Rankings geral e por capítulo |
| Papéis | Pendente, membro, diretoria de capítulo, diretoria geral, moderador, admin | Permissões aplicadas no banco (RLS) |
| Mapa ao vivo dos irmãos | Sim, com cinco níveis de visibilidade | Padrão aproximado (\~5 km), zonas privadas, modo temporário, status no marcador; aproximação feita no servidor |
| Chat pelo mapa | Sim, iniciado por aceno | Chat só abre se aceito; voz quando pilotando; bloqueio, denúncia e limite diário |
| Carro | Android Auto no lançamento; CarPlay no lançamento ou logo depois, conforme a aprovação da Apple | Android Auto testado no PC; CarPlay testado num carro com versão gerada na nuvem |
| Idiomas | Português, espanhol e inglês | Todos os textos traduzíveis desde o início |
| Receita | Freemium + publicidade + parceiros e negócios de irmãos | Anúncios só no feed e listas, nunca no modo pilotando, mapa ao vivo, chat ou carro; destaque pago no Guia de Negócios |
| Premium | Navegação curva a curva (Google) no app e no carro, estatísticas e diário de viagem, sem anúncios, visual exclusivo, regiões offline, avatar por IA 2/mês; teste grátis de 7 dias | Assinatura pelas lojas, via RevenueCat |
| SOS | Push para o grupo + mensagem pronta no WhatsApp | Sem custo por mensagem |
| Lugares | OpenStreetMap + cadastros no app | Sedes, Lojas e negócios cadastrados por irmãos, com moderação |
| Gamificação | Aprovada (Cabrito, Bode, Bode Velho, Bode Lendário) + selos de confraternização | Valores configuráveis no painel |
| Visual | Identidade “Patch de Colete” (docs/DESIGN.md) | Um único arquivo de tema |
| Publicação | Apple como pessoa física até a empresa existir; Google Play como organização da empresa | Teste fechado com irmãos (a conta de organização dispensa a regra obrigatória de 12 testadores); conta de demonstração para os revisores das lojas |
| Equipe | Dono sem programação, sem Mac | Agente explica em português simples; sem programador nem advogado contratados; segurança por lista de verificação e varreduras automáticas |
| Plano Claude | Pro | Prazo estimado de 14 a 18 semanas |

## Confraternização entre irmãos

O app existe para que irmãos do Bodes do Asfalto se encontrem, se ajudem e se visitem na estrada. Todo aviso de confraternização é opcional e configurável por tipo e raio.

| Recurso | Como funciona | Etapa |
| --- | --- | --- |
| Mapa ao vivo dos irmãos | Cada irmão escolhe: invisível, só cidade, aproximado (padrão), preciso para amigos ou só no comboio. Zonas privadas, modo temporário e status (na estrada, café, aberto a encontro, não perturbe) | 4 |
| Socorro Fraterno | Pedido de ajuda (pane, pneu, guincho, pouso) em raio crescente de 20, 50 e 100 km, com oficinas de irmãos e respostas "estou indo" | 4 |
| Chat pelo mapa | Aceno pelo marcador; chat abre só se aceito; respostas rápidas de estrada | 6 |
| Irmão na Rota | Irmãos, sedes, Lojas e negócios num corredor de \~30 km da rota; convite para café, almoço ou pouso que vira parada | 6 |
| Ágape Relâmpago | "Estou no Posto X até as 15h": convite num raio de 10, 50 ou 100 km, com contagem regressiva e check-in | 6 |
| Chegada na Cidade | Aviso de irmãos, sedes e Lojas locais e opção de avisar "estou na cidade até tal dia" | 6 |
| Visitação de Lojas | Lojas no mapa (cadastradas por irmãos delas) com dias de sessão e aviso prévio ao irmão de contato; a entrada segue o procedimento da Loja | 2 e 6 |
| Guia de Negócios de Irmãos | Oficinas, hotéis, pousadas, restaurantes de irmãos com benefício para membros; destaque no mapa como plano pago | 2 e 8 |

Esses recursos rendem selos no Passaporte do Bode: Ágape, Socorro Fraterno, Visitação de Lojas e Irmão na Rota.

## Regras detalhadas

Respostas da revisão de 10/11/2026 que o agente deve seguir.

| Tema | Regra |
| --- | --- |
| Desligamento | A diretoria do capítulo (ou o dono/moderador) desativa o irmão na hora |
| Formulário de entrada | Foto com o colete, foto da carteirinha e indicação de um membro, que confirma no app |
| Lista de membros | Visível a todos os membros |
| Login | E-mail, Google e Apple; sem SMS |
| Localização em segundo plano | Desligada por padrão; só se o irmão ativar |
| Trilhas gravadas | Privadas por padrão |
| Histórico de posições ao vivo | Apagado após 7 dias |
| Chat | 1:1 por aceno, grupo do passeio, grupo do capítulo e grupo temporário do Ágape |
| Feed | Posts para todos os membros por padrão |
| Moderação | Moderadores e dono em tudo; diretoria no próprio capítulo |
| Conteúdo maçônico | Sem regra específica; moderação por denúncia |
| Notificações | Todas na hora, ajustáveis por tipo |
| Eventos de Lojas e Potências | Divulgação gratuita |
| Premium | R$ 9,90/mês ou R$ 89/ano, com 7 dias grátis; inclui navegação curva a curva e regiões offline |
| Destaque no Guia de Negócios | Cobrado fora do app (Pix/boleto) e ativado no painel |
| Receita | No nome da empresa do dono (SLU), aberta até março de 2027 |
| Offline | Rota salva offline grátis no mapa principal; navegação curva a curva (Google) precisa de internet |
| GPX | Importar e exportar grátis |
| Rankings | O irmão pode sair |
| CarPlay | O lançamento não espera a Apple; o CarPlay entra por atualização se atrasar |
| Escala | 300 a 1.000 irmãos no primeiro ano |
| Orçamento | Limite diário e alerta de orçamento no Google Cloud; aviso se a infraestrutura passar de R$ 500/mês no ano 1 |
| Lançamento | Cuiabá primeiro, por cerca de 1 mês, depois os demais capítulos |
| Domínio | Comprar um novo |
| Suporte | Botão Ajuda no app, e-mail e WhatsApp |
| LGPD | Dono é o encarregado de dados; agente redige política e termos, dono revisa |

## O que os melhores apps fazem (pesquisa de 10/11/2026)

Nenhum concorrente junta navegação de moto, rede social de clube e confraternização por proximidade. Essa combinação é o diferencial do Bodes do Asfalto e o que permite expandir depois para outros clubes.

| App | O que faz melhor | O que levamos para o Bodes |
| --- | --- | --- |
| [Cardo Ride (ex-Riser)](https://cardosystems.com/blogs/cardo-blog/cardo-ride-app-launch/) | Passeio em grupo com avisos de "ficou para trás", "preciso de pausa" e alerta ao grupo; recap 3D; navegação pelo intercomunicador; CarPlay e Android Auto em painéis de moto | Avisos rápidos no comboio (pausa, combustível, ficou para trás); voz pelo intercomunicador; recap 3D no premium |
| [REVER](https://www.rever.co/) | Rastreio de viagem, amigos ao vivo, desafios; reclamação comum: gasta muita bateria | Modo economia de bateria desde a v1 |
| [calimoto](https://apps.apple.com/be/app/id1209129603?l=en-gb) | Gerador automático de rota circular por distância e direção; prioriza estradas com curvas; postos e restaurantes na rota; GPX; offline; CarPlay | Gerador de "bate-volta" (ida e volta em X km); perfil de rota com curvas; pontos de interesse na rota |
| [Strava](https://the5krunner.com/2026/06/12/strava-hiking-features-ipo/) | Clubes, feed, aplausos (kudos), desafios; a comunidade é o que segura o usuário | Reação própria "TFA" (tríplice fraternal abraço); cartão de viagem no feed com km, tempo, irmãos e XP |
| [Life360](https://parentzone.org.uk/article/life360) | "Bolha" que mostra só a região aproximada e estoura em caso de SOS ou acidente, revelando a posição exata | No SOS, quem está em "aproximado" ou "invisível" passa a mostrar a posição exata ao grupo e aos contatos |
| Zenly (encerrado) | Mapa social divertido, reações no mapa, modo fantasma | Mapa como tela inicial, avatares ilustrados, mascote e acenos |
| [Relive](https://apps.apple.com/app/id1201703657) | Vídeo 3D curto da viagem, fácil de compartilhar; o vídeo é o próprio marketing | Recap 3D com marca d'água do clube para WhatsApp e Instagram |
| [Harley-Davidson App](https://www.harley-davidson.com/au/en/content/h-d-app.html) | Eventos, grupos, feed social, desafios com pontos e ranking | Agenda de passeios, desafios e grupos por capítulo |
| [Detecht](https://www.riders-share.com/blog/article/is-there-an-app-for-motorcycle-routes) e REALRIDER | Detecção de queda com aviso automático, cobrada por assinatura | Detecção de queda depois do lançamento, como recurso premium experimental |
| [ANP com VC – Postos](https://www.vrum.com.br/noticias/2026/07/7461126-novo-app-da-anp-revela-a-nota-de-qualidade-dos-postos.html) e [Gaspass](https://apps.apple.com/br/app/gaspass/id1438985142) | Nota de 0 a 5 de cada posto pelas fiscalizações da ANP; preços informados pelos usuários | Posto mais próximo e posto na rota com nota ANP e preço colaborativo dos irmãos |

[Motos com CarPlay e Android Auto de fábrica](https://aoocci.com/blogs/motorcycle/can-you-install-apple-carplay-any-motorcycle) incluem a Honda Gold Wing, as Harley-Davidson Street Glide e Road Glide (2024 em diante) e as Indian com Ride Command. As demais usam telas de guidão compatíveis. A tela "do carro" do app é, na prática, também o painel dessas motos.

## Novos recursos incorporados

| Recurso | Etapa |
| --- | --- |
| Posto mais próximo e posto na rota (celular, modo pilotando e carro), com nota ANP, preço colaborativo e distância | 3, 9 e 10 |
| Mapa mostra tudo o que está na área visível: irmãos, capítulos, Lojas, postos, monumentos, pontos turísticos e negócios de irmãos, com contador "nesta área" | 2 e 4 |
| SOS que revela a posição exata mesmo para quem está em aproximado ou invisível | 4 |
| Avisos rápidos no comboio: pausa, combustível baixo, ficou para trás | 4 |
| Modo economia de bateria e voz pelo intercomunicador | 3 |
| Gerador de bate-volta e perfil de rota com curvas | 3 |
| Stories de 24 horas, vídeos curtos, enquetes, menções, hashtags, álbuns de fotos, salvar e compartilhar fora do app com marca do clube | 5 |
| Reação "TFA" e cartão de viagem no feed (km, tempo, irmãos, XP, selo, "usar esta rota") | 5 |
| Notificações centralizadas e mensagens diretas | 5 e 6 |
| Avatares ilustrados, mascote Bodinho e ilustrações de estado vazio | 1 |
| Recap 3D da viagem com marca d'água (premium) | 8 |
| Detecção de queda (premium, experimental) | Depois do lançamento |

As telas atualizadas estão no quadro [Bodes do Asfalto — Telas do App](https://claude.ai/artifact/8zuLJywareAGB34d8yUBjU).

## Acabamento visual e ativos de imagem

Identidade escolhida: Patch de Colete refinada. A IA de imagem gera a matéria-prima (emblemas, texturas, ilustrações) e o código desenha a interface, o que mantém o app bonito e leve.

| Camada | Como é feita | Limite |
| --- | --- | --- |
| Interface (cartões, botões, curvas, sombras) | Código com React Native Skia e tokens do sistema de design | Sem imagens |
| Ícones de navegação e botões | Vetor (SVG) | Sem imagens |
| Pinos, níveis, selos, avatares por categoria, mascote | Gerados por IA, convertidos para WebP | Até 40 KB cada, sob demanda |
| Texturas e borda overlock | Gerados por IA, blocos repetíveis e imagem 9-slice | Até 50 KB cada |
| Ilustrações e tela de abertura | Geradas por IA | Até 150 KB, sob demanda |
| Animações | Lottie ou Rive | Até 100 KB |
| Mapa | Estilo MapLibre próprio (mapa principal) e estilo de nuvem do Google (navegação) | O mapa principal funciona offline |

As imagens podem ser geradas pelo dono no ChatGPT, com o prompt mestre do pacote (sem custo extra), ou pelo agente via API, com a chave guardada como segredo de rede do ambiente do Claude Code e limite de US$ 10 sem nova autorização. A assinatura do ChatGPT não inclui a API, que é cobrada à parte. Detalhes em `docs/DESIGN.md`, `docs/PROMPTS_IMAGENS.md` e `COMO_COMECAR.md` do pacote.

## Restrições técnicas: Android Auto e CarPlay

Na tela do veículo só entram navegação, alertas e áudio. Apple e Google aceitam apenas modelos de tela prontos (lista, mapa, botões grandes) e reprovam o app que tentar mostrar feed, fotos ou texto longo.

| Recurso | Celular | Tela do veículo |
| --- | --- | --- |
| Rota com navegação curva a curva | Sim | Sim |
| Alertas da estrada (buraco, radar, obra) | Sim | Sim, com voz |
| Posição do comboio e aviso de reagrupamento | Sim | Sim, simplificado |
| Próximo posto, sede ou ponto turístico na rota | Sim | Sim, em lista |
| Check-in em sede ou monumento | Sim | Botão único, ou automático por GPS |
| SOS | Sim | Botão único |
| Feed, fotos, comentários, classificados, rankings | Sim | Não permitido |

- **CarPlay:** um app de navegação precisa da permissão (entitlement) de navegação do CarPlay, pedida à Apple com a conta de desenvolvedor. A aprovação pode levar semanas, então o pedido sai logo no início do projeto.
- **Android Auto:** usa a biblioteca Car App Library do Google, na categoria navegação. A revisão é feita na publicação na Play Store.
- **Na moto:** a maioria dos pilotos usa o celular no guidão, não uma central multimídia. Por isso o modo "pilotando" do celular segue as mesmas regras da tela do carro: botões grandes, voz e nada de feed.

## Funcionalidades por versão

A v1 entrega o essencial para um passeio do clube, do planejamento ao post final. As versões seguintes ampliam a parte social e a comunidade.

| Área | v1 (lançamento) | v2 | v3 |
| --- | --- | --- | --- |
| Conta e perfil | Login, perfil do piloto, garagem com as motos, aprovação de membros pela diretoria | Hierarquia digital (prospect, membro, diretoria) | Perfis de outros motoclubes |
| Rotas | Criar, salvar e compartilhar rota; navegação curva a curva; Android Auto e CarPlay | Rotas favoritas do clube com avaliação; previsão do tempo por trecho | Autonomia da moto e aviso de último posto |
| Passeios | Agenda com confirmação de presença; comboio ao vivo; ponto de reagrupamento | Check-in no evento por QR code | Encontros entre clubes com inscrição |
| Segurança | Botão SOS com localização para o grupo e contatos | Detecção de queda (experimental) | Rede Bode Amigo (pouso, guincho, oficina) |
| Mapa e lugares | Sedes, monumentos e pontos turísticos; check-in por GPS; lista de lugares visitados | Alertas colaborativos da estrada | Parceiros com desconto no mapa |
| Social | Feed com fotos e comentários; amigos; avisos da diretoria | Diário de viagem automático | Classificados |
| Gamificação | XP, níveis, selos do Passaporte do Bode, ranking mensal de km | Desafios mensais; patches digitais | Desafios entre motoclubes |
| Administração | Painel web simples da diretoria: membros, sedes, denúncias | Estatísticas do clube | Clube de vantagens e loja |

Os classificados ficaram para a v3 de propósito. Eles trazem moderação, golpes e responsabilidade legal, e não são o motivo para alguém instalar o app.

## Telas principais

A v1 tem cinco abas no celular, mais o modo pilotando e as telas do carro.

**Celular (barra inferior com 5 abas)**

1. **Feed:** posts do clube e dos amigos, avisos fixados da diretoria no topo e botão de postar foto.
2. **Mapa:** sedes, monumentos e pontos turísticos, com filtros, check-in e o botão "criar rota".
3. **Passeios:** agenda, detalhe do passeio (rota, horário, quem vai) e o botão "iniciar comboio".
4. **Conquistas:** nível e XP, Passaporte do Bode (selos), ranking do mês.
5. **Perfil:** dados do piloto, garagem, amigos, lugares visitados, configurações e contatos de emergência.

**Modo pilotando (celular no guidão)**

- Mapa em tela cheia, próxima manobra em letra grande e distância até o próximo ponto.
- Quatro botões grandes: alerta, reagrupar, SOS e encerrar.
- Avisos por voz no intercomunicador ou no fone.

**Android Auto e CarPlay**

- Mapa com navegação.
- Lista "na rota": próximos postos, sedes e pontos turísticos.
- Comboio: quem está à frente e quem ficou para trás.
- Botões de alerta e SOS.

**Painel web da diretoria**

- Aprovar e bloquear membros, cadastrar sedes e lugares, criar passeios e desafios, moderar denúncias.

## Regras da gamificação

A gamificação premia rodar junto e conhecer lugares, nunca velocidade. Os valores abaixo são uma proposta inicial para a diretoria ajustar.

**Como se ganha XP**

| Ação | XP | Limite |
| --- | --- | --- |
| Cada 10 km rodados com rota gravada | 10 | 1.000 XP por dia |
| Participar de passeio oficial do clube (check-in no início e no fim) | 200 | — |
| Check-in em sede de outro capítulo ou motoclube | 150 | 1 vez por sede a cada 30 dias |
| Check-in em monumento ou ponto turístico | 50 (raros: 300) | 1 vez por lugar |
| Post com foto | 5 | 5 posts por dia |
| Alerta da estrada confirmado por outros membros | 20 | — |
| Concluir um desafio | Definido no desafio | — |

**Níveis e patches:** o XP acumulado sobe o piloto de nível, e cada faixa dá um patch digital no perfil (por exemplo: Cabrito, Bode, Bode Velho, Bode Lendário). O patch de jogo é separado do cargo real no clube, que só a diretoria atribui.

**Passaporte do Bode:** coleções de selos por tema, como "todas as sedes do MT", "Pantanal", "Rota do Uruguai" e "capitais do Brasil". Completar uma coleção rende selo dourado e XP extra.

**Rankings:** mensal e anual, por km, por lugares visitados e por passeios. Haverá ranking geral, por capítulo e entre amigos. O ranking mensal zera todo mês para dar chance a quem entrou agora.

**Desafios:** criados pela diretoria no painel, com prazo e regra. Exemplos: "rodar 1.000 km em novembro", "visitar 3 sedes no trimestre", "passeio solidário".

**Antifraude**

- O km só conta com GPS ativo e velocidade compatível com moto. Trechos acima de 200 km/h ou com saltos de posição são descartados.
- O check-in exige estar a menos de 200 m do lugar.
- O XP de passeio oficial só vale com check-in no início e no fim.
- Nenhum ranking ou pontuação por velocidade média ou tempo de percurso.

## Arquitetura e tecnologias

Recomendação: React Native com Expo no app, Supabase no backend, MapLibre com dados OpenFreeMap no mapa principal, Google Navigation SDK na navegação curva a curva e um servidor Valhalla próprio para planejar rotas. São tecnologias populares, com boa documentação e que agentes de IA escrevem bem.

&#91;embedded content: arquitetura da v1 · 3 clientes, Supabase, Mapbox e push\]

O app, as telas do carro e o painel conversam com o Supabase; o mapa principal usa dados do OpenFreeMap, o planejamento de rotas usa o servidor Valhalla e a navegação vem do Google. (O diagrama abaixo ainda mostra a Mapbox, substituída por essas três peças.)

| Camada | Tecnologia | Por quê |
| --- | --- | --- |
| App no celular | React Native + Expo (TypeScript) | Um código só para iPhone e Android |
| Android Auto | Car App Library (Kotlin), como módulo do app | Exigência do Google para apps de navegação |
| CarPlay | Framework CarPlay (Swift), como módulo do app | Exigência da Apple |
| Mapas e navegação | Google Navigation SDK + MapLibre + Valhalla | Navegação curva a curva, com suporte a CarPlay e Android Auto |
| Backend | Supabase (Postgres + PostGIS) | Login, banco com geolocalização, fotos e tempo real num serviço só |
| Painel da diretoria | Next.js na Vercel | Site simples ligado ao mesmo banco |
| Notificações | Expo Notifications (APNs e FCM) | Avisos de passeio, SOS e conquistas |

A parte mais trabalhosa é ligar o app em React Native à navegação do Google e às telas do carro. Por isso ela é provada primeiro, na Etapa 0, antes de qualquer outra funcionalidade.

Também fazem parte da arquitetura: RevenueCat para a assinatura premium, Google AdMob para anúncios (com consentimento de privacidade e o aviso de rastreamento do iPhone), i18next para os três idiomas e Sentry para registrar erros que acontecem no celular dos membros.

## Como funciona o desenvolvimento

Um agente de programação (o Claude Code) trabalha de forma autônoma: escreve o código, roda os testes, corrige os próprios erros e só para nos pontos que exigem teste ou decisão humana. Com o plano Pro, a etapa de confraternização e testes feitos pelo dono do projeto, a estimativa para a v1 é de 14 a 18 semanas. Não haverá revisão de segurança externa: o agente mantém uma lista de verificação e varreduras automáticas, por causa da localização e da filiação maçônica dos irmãos.

**Como trabalhar com o agente**

- **Ciclo autônomo:** para cada funcionalidade, o agente escreve o teste, escreve o código, roda tudo e corrige até passar antes de seguir.
- **Memória do projeto:** o agente mantém um `CLAUDE.md` (regras do projeto) e um `docs/PROGRESSO.md` (o que foi feito, o que falta, decisões). Assim cada nova sessão continua de onde a anterior parou.
- **Pontos de parada obrigatórios:** login funcionando no celular, primeira rota navegada, primeiro comboio com 3 motos, primeira tela no carro e versão pronta para as lojas. Nesses pontos o agente gera uma versão de teste, lista o que testar e espera a resposta.
- **O que só o humano faz:** testar na estrada e no carro, criar contas e chaves, decidir regras do clube e enviar para as lojas.
- Este documento fica no repositório como `docs/ESPECIFICACAO.md` para o agente consultar sempre.

**Etapas da v1**

1. **Semana 0, em paralelo:** contas, pedido do CarPlay à Apple, licença do clube para nome e escudo, combinar o abono com a diretoria e nomear moderadores.
2. **Etapa 1, Fundação, acesso e perfil (semanas 1 e 2):** login, entrada por abono ou formulário, perfil maçônico opcional, consentimentos LGPD, garagem, três idiomas.
3. **Etapa 2, Mapa, lugares, Lojas e negócios (semana 3).**
4. **Etapa 3, Rotas e navegação (semanas 4 a 6).**
5. **Etapa 4, Passeios, mapa ao vivo e segurança (semanas 7 e 8):** comboio, mapa ao vivo dos irmãos, SOS e Socorro Fraterno.
6. **Etapa 5, Social (semana 9).**
7. **Etapa 6, Confraternização (semanas 10 e 11):** chat por aceno, Irmão na Rota, Ágape Relâmpago, Chegada na Cidade, visitação de Lojas.
8. **Etapa 7, Gamificação (semana 12).**
9. **Etapa 8, Monetização (semana 13).**
10. **Etapa 9, Android Auto (semanas 14 e 15).**
11. **Etapa 10, CarPlay (semanas 15 e 16):** depende da permissão da Apple.
12. **Etapa 11, Painel de administração (semana 16).**
13. **Etapa 12, Teste fechado e publicação (semanas 16 a 18).**

**Contas necessárias (Apple como pessoa física até a empresa existir; as demais no nome da empresa)**

| Conta | Para quê | Custo |
| --- | --- | --- |
| Apple Developer Program | Publicar no iPhone e pedir a permissão do CarPlay | US$ 99 por ano |
| Google Play Console | Publicar no Android (conta de organização, aberta com a empresa) | US$ 25, pagamento único |
| GitHub | Guardar o código | Gratuito no início |
| Supabase | Banco de dados, login, fotos, tempo real | Gratuito no início; plano pago quando crescer |
| Google Cloud (Maps Platform) | Navegação curva a curva com trânsito | 1.000 destinos por mês grátis; cerca de US$ 0,025 por destino acima disso, com limite diário |
| Expo (EAS) | Gerar as versões do app na nuvem, sem precisar de Mac | Gratuito no início |
| Domínio (ex.: bodesdoasfalto.com.br) | Site, e-mail e política de privacidade | Cerca de R$ 40 por ano |

Com o Google Play aberto como conta de organização da empresa, não há o teste fechado obrigatório de 12 testadores por 14 dias exigido de contas pessoais; mesmo assim, os irmãos fazem um teste fechado antes do lançamento. Também entram no orçamento o RevenueCat (gratuito até US$ 2.500 de receita mensal), o AdMob (gratuito; o Google paga pelos anúncios) e o servidor de rotas (cerca de R$ 120/mês).

**Rodar o agente na assinatura Claude, sem créditos extras**

O Claude Code está incluído nos planos pagos (Pro, Max e Ultra) e usa o mesmo limite do chat, que reinicia a cada 5 horas e tem um teto semanal. Para não gastar nada além da mensalidade:

- **Deixe os créditos de uso desligados** em Configurações > Uso, no claude.ai. Assim, quando o limite acabar, o agente pausa até o limite reiniciar, sem cobrança extra.
- **Entre no Claude Code com a sua conta Claude** (comando `/login`), nunca com chave de API. Se existir a variável `ANTHROPIC_API_KEY` no computador, ela é cobrada à parte.
- **Recuse a oferta de créditos de API** se ela aparecer, e acompanhe o consumo com o comando `/usage`.

**Onde rodar**

- **Claude Code na web (claude.ai/code):** roda na nuvem, ligado ao repositório do GitHub, e dá para acompanhar e responder pelo celular. Serve para escrever código, rodar testes e publicar versões de teste pelo Expo.
- **Claude Code num computador:** necessário para o agente rodar o emulador de Android e, num Mac, o simulador de iPhone e de CarPlay. Sem Mac, as versões de iPhone são geradas na nuvem pelo Expo (EAS Build) e testadas num iPhone de verdade.

**Fazer o limite render**

- **Plano:** o Pro (US$ 20 por mês) dá conta, mas o agente vai pausar com frequência e o prazo tende a ir para o lado das 12 semanas ou mais. O Max (US$ 100 por mês) dá cerca de 5 vezes mais uso e combina com o ritmo de 8 semanas. Dá para assinar o Max só nos meses mais intensos.
- **Sessões focadas:** uma tarefa por sessão, começando pelo `docs/PROGRESSO.md`. Conversas muito longas gastam mais limite.
- **Modelo certo:** um modelo mais leve (Sonnet) para tarefas de rotina, e o mais forte (Opus) para navegação, CarPlay e Android Auto.

Fontes: [Claude Code nos planos Pro e Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan), [Planos e preços](https://claude.com/pricing), [Créditos de uso](https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans).

## Primeiro prompt para o agente

As regras do projeto ficam no pacote de configuração do agente (`CLAUDE.md`, `docs/ETAPAS.md`, `docs/PROGRESSO.md`, `.claude/settings.json`). Por isso o prompt inicial é curto: ele manda o agente ler esses arquivos, apontar lacunas, apresentar o plano da Etapa 1 e trabalhar sozinho até o primeiro ponto de teste.

```text
O prompt inicial válido está no arquivo PROMPT_INICIAL.md do pacote de configuração (ele começa pela Etapa 0, prova técnica). Use sempre o texto de lá.
```

Para as etapas seguintes, abra uma sessão nova e peça: "Leia CLAUDE.md, docs/PROGRESSO.md e docs/ETAPAS.md. A Etapa N foi testada e aprovada; apresente o plano da Etapa N+1 e espere meu OK." Depois que o limite de uso reiniciar: "Leia CLAUDE.md e docs/PROGRESSO.md e continue de onde parou."

## Riscos e cuidados

Os três maiores riscos são a navegação do Google funcionar bem no app e no carro (pacote para React Native ainda em Beta), os dados de localização dos membros e a responsabilidade pelo SOS.

| Risco | O que fazer |
| --- | --- |
| A Apple demora ou nega a permissão de navegação do CarPlay | Pedir na semana 0. Decisão tomada: o lançamento não espera; se a Apple atrasar, o CarPlay entra por atualização. |
| LGPD: localização em tempo real e dados pessoais | Política de privacidade clara; localização ao vivo só durante o comboio e com o piloto ativando; opção de apagar a conta e os dados dentro do app (exigido pelas duas lojas). |
| SOS ou detecção de queda falharem | Deixar claro nos termos que o recurso é um auxílio e não substitui o 192/193. A detecção de queda fica marcada como experimental. |
| Gamificação estimular imprudência | Nenhum ponto por velocidade ou tempo; travas de antifraude; aviso para não mexer no celular pilotando. |
| Conteúdo impróprio no feed | Denúncia e bloqueio de usuário desde a v1 (as lojas exigem em apps sociais), com moderação pela diretoria. |
| Custos de mapa e servidor crescerem | Acompanhar o uso mensal; Google e Supabase cobram por volume: limite diário e alerta de orçamento no Google Cloud, e o painel avisa quando o custo passa do previsto. |
| Depender de uma só pessoa técnica | Como tudo depende do dono, guardar os acessos de emergência (lojas, banco de dados, domínio) com alguém de confiança num cofre de senhas; documentação no repositório para outra pessoa assumir. |
| Uso do nome e do escudo do clube | Confirmar com a diretoria quem autoriza e em nome de quem o app é publicado. |
