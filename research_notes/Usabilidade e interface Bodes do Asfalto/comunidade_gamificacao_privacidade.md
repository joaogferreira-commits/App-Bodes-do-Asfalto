# Comunidade, gamificação e privacidade de localização — Bodes do Asfalto

Escopo: UX de rede social privada, UX de privacidade no compartilhamento de localização e ética/segurança da gamificação para um motoclube de maçons (40–60 anos, Brasil, LGPD). Pesquisa feita em 12/11/2026 com ~16 buscas na web. Os números de fontes secundárias (blogs de fornecedores) estão marcados como tal.

## 1. Gamificação: o que gera engajamento saudável e o que aumenta o risco (velocidade/tempo)

### Takeaway
A gamificação funciona "em geral", mas o efeito depende muito do contexto e do usuário. Pontos, níveis e rankings aumentam sobretudo a *quantidade* de ação, não a motivação intrínseca. Rankings desanimam quem está embaixo e quem é pouco competitivo. Competir por tempo ou velocidade em trechos reais de via já tem histórico de mortes e processos (Strava). Para o Bodes: XP por presença, visitas, check-ins e contribuições sociais, km com teto diário, ranking relativo/opcional, e nenhuma métrica de velocidade ou tempo.

### Cited Findings
**Evidência geral**
- A revisão de Hamari, Koivisto e Sarsa (HICSS 2014) analisou 24 estudos empíricos revisados por pares. A maioria encontrou efeitos positivos, mas "muito dependentes do contexto em que a gamificação é implementada e dos usuários" — [PDF do artigo](https://www.lescahiersdelinnovation.com/wp-content/uploads/2019/06/2014-hamari_et_al-does_gamification_work.pdf); [resumo gamification-research.org](https://gamification-research.org/2013/09/does-gamification-work-a-look-into-research/)
- Mekler et al. (2017, *Computers in Human Behavior* 71:525–534) fizeram um experimento online 2×4 com pontos, níveis e ranking numa tarefa de marcar imagens. Os elementos aumentaram a quantidade de marcações, mas **não** mudaram a motivação intrínseca nem a sensação de competência. Conclusão dos autores: os elementos agiram como incentivo extrínseco, eficaz só para a quantidade — [PDF anotado, Harvard Glassman Lab](https://glassmanlab.seas.harvard.edu/annotated_works/mekler17.pdf); [gamification-research.org](https://gamification-research.org/2014/08/gamification-considered-harmful/)

**Rankings (leaderboards)**
- Posições baixas no ranking são associadas a perda de motivação (Domínguez et al., 2013, citado). A literatura é conflitante, e um estudo de 2020 mostrou que usuários pouco competitivos se afastam com rankings, enquanto os muito competitivos se engajam mais — [Internet Research, Emerald](https://www.emerald.com/insight/content/doi/10.1108/intr-12-2021-0897/full/html)
- Num estudo com estudantes em Hong Kong, rankings *relativos* (posição perto da sua) estimularam competição construtiva em todos. Rankings *absolutos* geraram mais pressão nos alunos do meio e do fim. Os autores recomendam limitar a exibição pública de quem está embaixo — [HKU repositório](https://hub.hku.hk/bitstream/10722/368255/1/content.pdf)
- Num app de saúde (179 participantes), a posição no ranking influenciou a sensação de competência e de pertencimento. Junto com a autonomia, isso melhorou a atitude do usuário, o que bate com a teoria da autodeterminação (competência, autonomia, pertencimento) — [resultado da busca, Emerald/Internet Research](https://www.emerald.com/intr/article/33/7/1/178330)

**Velocidade e tempo: o caso Strava**
- Em 2010, o ciclista William "Kim" Flint morreu ao frear para desviar de um carro numa descida (limite de 30 mph). Ele estaria tentando recuperar o "KOM" (melhor tempo) do segmento. A família processou o Strava em junho de 2012 por negligência: o app não avisava que a via não servia para corrida. O Strava contestou e entrou com ação contra os autores — [BikeRadar](https://www.bikeradar.com/news/family-sues-strava-for-cycling-death); [Bicycle Retailer](https://bicycleretailer.com/north-america/2012/06/19/strava-sued-negligence-cyclist%E2%80%99s-death); [contra-ação](https://bicycleretailer.com/north-america/2012/10/18/strava-countersues-death-california-cyclist)
- O desfecho do processo não está confirmado (uma fonte diz que o Strava venceu, sem registro judicial encontrado). O Strava mudou os termos para "não responsável pelas atividades" e passou a permitir marcar segmentos como perigosos — [BikeRadar, termos](https://www.bikeradar.com/news/strava-not-liable-for-activities-in-updated-tcs); [road.cc](https://road.cc/content/news/60145-family-sues-strava-causing-cyclists-death)
- Caso relacionado em San Francisco (2012): o ciclista Chris Bucchere foi acusado de homicídio culposo na morte do pedestre Sutchi Hui. Os promotores disseram que ele registrava a velocidade no Strava — [road.cc](https://road.cc/content/news/78248-strava-founder-and-ceo-insists-company-encourages-responsible-riding); [inkl/Guardian](https://www.inkl.com/news/strava-the-app-that-turns-cyclists-into-racers)

**Gamificação usada para direção mais segura**
- PNAS 2024 (Penn): motoristas ganhavam pontos por reduzir o uso do celular na mão e competiam num ranking semanal. O uso caiu até 28%, e a queda se manteve por até 65 dias depois do fim do jogo — [ScienceDaily](https://www.sciencedaily.com/releases/2024/07/240729173324.htm)
- Estudo naturalístico (Sensors 2025, app OSeven) com incentivos e feedback: o percentual de tempo acima do limite caiu de 4,80% para 3,67% nos motoristas medianos e de 10,66% para 8,47% nos de alto risco. Os de alto risco continuaram os piores. Os autores avisam que há valores divergentes nas tabelas — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12736760/)
- Apps de telemetria de seguro usam pontuação de segurança, rankings e selos; quem usa o app com frequência melhora mais (estudo do próprio fornecedor CMT, viés de autosseleção) — [CMT](https://m.cmtelematics.com/hubfs/CMT%20Study%20-%20UBI%20Engagement%20Impact.pdf)
- Uso do celular na mão e velocidade alta foram associados a mais eventos de risco em 119 adolescentes — [PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11581603/)

### Inferences
- **Nunca** pontuar velocidade, tempo de trecho, média horária ou "segmento mais rápido". O caso Strava mostra que competir por tempo numa via pública gera risco e processo. No Brasil, o risco jurídico pelo Código de Defesa do Consumidor seria provavelmente maior. Isso confirma o Princípio 1 do CLAUDE.md.
- Recompensas mais seguras, em ordem de preferência: (1) **presença e confraternização** (passeio com check-in a ≤200 m, Ágape, visita a sede ou Loja, ajuda no Socorro Fraterno); (2) **contribuição** (cadastrar posto/preço com data, Loja, evento, foto útil); (3) **descoberta** (monumentos e cidades novas: conta lugares *diferentes*, não repetições); (4) **km com teto diário e semanal** e retornos decrescentes, para não premiar "virar a noite" nem fadiga. Pausas e paradas para café podem valer XP ("pilotou 2 h, parou 15 min": selo de pausa).
- Usar a gamificação a favor da segurança, como fizeram o estudo da Penn e o OSeven: XP por *não* mexer no celular pilotando (modo pilotando ativo e sem toques fora dos 6 botões), por cumprir o tempo previsto de pausa, por usar o reagrupar no comboio. Nunca penalizar publicamente.
- Rankings: **mensais com reinício** (todos recomeçam e quem entra tarde tem chance) mais um histórico pessoal acumulado. Mostrar a posição *relativa* ("você e os 2 acima/abaixo") e o top 10 do capítulo. Esconder as últimas posições. Sair do ranking com um toque (já decidido) e sem perder XP e selos. Dar peso maior a métricas coletivas do capítulo ("Cuiabá rodou 12.000 km em passeios este mês"), que favorecem o pertencimento.
- Antifraude (já na especificação): exigir GPS ativo, descartar trechos >200 km/h e saltos de posição, check-in a ≤200 m. Acrescentar: teto de km por dia; km em comboio só conta se ≥2 irmãos confirmam presença próxima; ignorar atividades marcadas como "carro/caminhão" (velocidade alta e constante sem curvas, a detectar). Não mostrar a velocidade da fraude descartada, só "trecho não contabilizado".
- Por causa do estudo de Mekler, não esperar que XP crie vínculo. O vínculo vem do conteúdo de confraternização. Os selos devem contar histórias ("Primeiro Ágape em Rondonópolis") e não ser só contadores.

### Gaps
- Não encontrei estudo revisado por pares que meça diretamente se os pontos do Waze ou o km acumulado aumentam a exposição ao risco. A recomendação de teto de km é inferência.
- Não encontrei evidência específica de motociclistas e gamificação (a literatura é de carros e bicicletas).
- Não confirmei o efeito do reinício mensal de rankings em estudos controlados. A recomendação é inferência a partir dos achados sobre rankings relativos.
- Não verifiquei o texto do artigo de Sailer et al. sobre selos (busca sem resultado).

## 2. UX de privacidade no compartilhamento de localização (e LGPD)

### Takeaway
Até "zonas de privacidade" bem-intencionadas vazam a casa quando a distância total ou os pontos de entrada aparecem. Por isso o corte e a aproximação devem ser feitos no servidor e a distância publicada deve ser recalculada. O usuário decide principalmente por **quem pede**, **quão precisa é a posição** e **para quê**. O compartilhamento temporário (1 h / até o fim do dia / até desligar) é o padrão de mercado. Na LGPD, a filiação maçônica é dado sensível: só consentimento específico e destacado (art. 11, I). O legítimo interesse não vale.

### Cited Findings
**Zonas privadas falham**
- KU Leuven (ACM CCS 2022): o ataque achou o local protegido em até 85% das zonas de privacidade de ponto final, testando 1,4 milhão de atividades do Strava. Usou a distância vazada nos metadados (a distância total inclui o trecho escondido), a malha de ruas e os pontos de entrada na zona. Zonas maiores reduzem o sucesso do ataque; áreas pouco povoadas o facilitam. Os autores propõem 6 contramedidas, com custo de usabilidade — [lepoch.at, artigo](https://lepoch.at/publication/epz-inference-attacks); [Dark Reading](https://www.darkreading.com/application-security/popular-fitness-apps-leak-location-data-even-when-users-set-privacy-zones); [Cycling Weekly](https://www.cyclingweekly.com/news/hackers-can-find-your-home-on-strava-even-if-you-use-privacy-settings-researchers-find)
- IEEE ConPro'23: o mapa de calor do Strava permitiu identificar o endereço de usuários muito ativos em áreas remotas — [PDF](https://conpro23.ieee-security.org/papers/childs-conpro23.pdf)
- Mapa de calor global do Strava (jan/2018) revelou bases militares. O Strava pôs o mapa atrás de login, borrou o detalhe de rua para o público, só mostrou áreas depois de vários usuários e prometeu simplificar a privacidade. Na época, o "privado por padrão" vinha **desligado** — [TechCrunch](https://techcrunch.com/2018/01/29/strava-simplify-privacy-options-review-features/?ncid=mobilenavtrend); [road.cc](https://road.cc/content/news/238678-strava-tweaks-global-heatmap-feature-response-military-security-concerns); [Wareable](https://www.wareable.com/sport/strava-feature-opt-out-update-app-8829)

**Percepção e comportamento (HCI)**
- Os três fatores mais importantes para aceitar compartilhar a localização foram: quem pede, quão específica é a descrição do local e o motivo do pedido (estudo ESM citado no CHI 2014) — [CHI 2014, Locasa](https://homes.luddy.indiana.edu/kapadia/papers/feedback-chi14.pdf)
- CHI 2014 (Locasa): em alguns arranjos, mais ações de controle *aumentaram* o desconforto e a sensação de compartilhar demais. Ou seja, muitos ajustes manuais não tranquilizam por si — [CHI 2014](https://homes.luddy.indiana.edu/kapadia/papers/feedback-chi14.pdf)
- CHI 2021 EA (LYLO, casais): desligar o compartilhamento pode levantar suspeitas, e revelar as *configurações* de compartilhamento aumentou a transparência — [LMU PDF](https://www.medien.informatik.uni-muenchen.de/pubdb/publications/pub/schneegassch2021lylo/schneegassch2021lylo.pdf); [TU Delft](https://research.tudelft.nl/en/publications/lylo-exploring-disclosed-configurations-for-inter-personal-locati)

**Padrões de produto**
- Life360 lançou "Bubbles" (ideia de "modo fantasma" vinda de adolescentes no TikTok): mostra uma área aproximada em vez do ponto exato por um tempo — [TechCrunch 2020](https://techcrunch.com/2020/10/12/family-tracking-app-life360-launches-bubbles-a-location-sharing-feature-inspired-by-teens-on-tiktok); Zenly tinha "modo fantasma" (fonte secundária) — [impulsec](https://impulsec.com/parental-control-software/life360-vs-zenly/)
- The Markup (2021): o Life360 vendia localização precisa a corretores de dados, sem reduzir a precisão nem agregar. A empresa contestou. É um contraexemplo de confiança — [The Markup](https://themarkup.org/privacy/2021/12/06/the-popular-family-safety-app-life360-is-selling-precise-location-data-on-its-tens-of-millions-of-user)
- Durações do Google: 1 hora, até o fim do dia, até você desligar, e duração personalizada (Find Hub). No Google Mensagens, a duração personalizada vai até 24 h — [Find Hub](https://support.google.com/android/answer/15992026?hl=en); [Google Mensagens](https://support.google.com/messages/answer/16929688?hl=en). Apple Find My: uma hora, até o fim do dia, ou indefinidamente (citação do documento da Apple em fórum) — [Apple Community](https://origin-discussions2-us-dr-prz.apple.com/thread/254007163)

**LGPD**
- O Guia da ANPD sobre legítimo interesse (02/02/2024) reafirma que essa base **não** se aplica a dados sensíveis — [Mattos Filho](https://www.mattosfilho.com.br/unico/anpd-legitimo-interesse-lgpd/)
- O art. 11 traz uma lista fechada de bases legais. No consentimento (art. 11, I), ele precisa ser "específico e destacado, para finalidades específicas", e o consentimento genérico é nulo — [Confidata](https://confidata.com.br/blog/dados-sensiveis-lgpd-bases-legais-cuidados); [Galicia Educação](https://www.galiciaeducacao.com.br/blog/lgpd-dados-sensiveis-consentimento-e-alternativas-do-art-11/)

### Inferences
- **Padrão "aproximado ~5 km" (já decidido) está certo.** Completar com: (a) arredondar para uma grade fixa (célula) calculada no servidor, sem ruído aleatório a cada atualização (a média de várias leituras com ruído revela o ponto); (b) não atualizar a posição aproximada mais de uma vez a cada X minutos; (c) se a célula tiver menos de N irmãos ou ficar em área rural, ampliar para "cidade" (lição do ConPro'23 e do mapa de calor do Strava: área vazia identifica a pessoa).
- **Zonas privadas e trilhas publicadas:** cortar o trecho dentro da zona *e* um trecho aleatório extra (200–800 m) depois da borda; recalcular a distância, o tempo e o ganho de altitude publicados **sem** o trecho escondido; usar raio mínimo de 500 m a 1 km. Isso responde diretamente às três fontes de vazamento do estudo da KU Leuven.
- **Modo temporário:** oferecer as mesmas durações que as pessoas já conhecem do Google e da Apple: "1 hora", "2 horas", "Até o fim do passeio", "Até o fim do dia". "Sempre" fica num nível de menu mais escondido. Mostrar um aviso fixo ("Você está visível como 'preciso' para o comboio até 18:40") com botão Desligar.
- **Transparência (LYLO):** mostrar a cada irmão *como os outros o veem* ("prévia: assim você aparece para os membros") e mostrar o nível dos outros só como rótulo neutro ("posição aproximada"). Não mostrar "Fulano ficou invisível às 14h", para evitar suspeita e cobrança social.
- **Poucas e boas opções (Locasa):** 5 níveis fixos com nomes simples e um único seletor. Nada de matriz por pessoa. Bater com quem pede (amigos, comboio, todos) e com a precisão — os dois fatores principais do estudo ESM.
- **Telas de consentimento LGPD (sugestão de texto):** uma tela própria, separada dos termos, só para "Dados maçônicos (Loja, Oriente, Potência)": "Esses dados revelam sua filiação à Maçonaria, que a lei considera dado sensível. São opcionais. Você escolhe quem vê cada um e pode apagar quando quiser. Nunca vão para anúncios, análise de uso ou terceiros." Botões "Concordo e quero preencher" / "Agora não", com o mesmo peso visual. Outra tela, também separada, para "Usar o app revela que você é do Bodes do Asfalto (motoclube de maçons)" no cadastro. Outra para localização em segundo plano. Registrar data, versão do texto e finalidade de cada consentimento, e permitir revogar em Perfil > Privacidade.
- **Nunca** vender nem agregar dados para terceiros (contraexemplo do Life360). Dizer isso na política em uma frase simples e visível.

### Gaps
- Não encontrei artigo do CHI ou SOUPS específico sobre Life360 ou Zenly. Os dados de produto vêm de imprensa e fontes secundárias.
- Não li o texto original do Guia da ANPD (só resumos de escritórios). Conferir no gov.br/anpd antes de citar na política.
- Não achei estudo quantitativo sobre a eficácia de um raio de ~5 km contra reidentificação. O tamanho certo da célula e o N mínimo precisam de teste com dados reais.

## 3. Feed social para 40–60 anos, moderação e exigências das lojas; por que clubes ficam no WhatsApp

### Takeaway
As lojas exigem termos aceitos antes de postar, denúncia dentro do app, bloqueio de usuário e ação da moderação, em todos os tipos de conteúdo (post, comentário, perfil, mensagem). O público 45–60 desliga notificações mais cedo (20% com 1 push por semana, contra 7% dos 18–29, dado de fonte secundária). O WhatsApp é onipresente no Brasil. O app precisa oferecer o que o WhatsApp não dá (mapa, comboio, SOS, passeios, Lojas) e conviver com ele (compartilhar para o WhatsApp), não brigar com ele.

### Cited Findings
- Apple, diretriz 1.2: apps com conteúdo de usuário precisam de filtro de material ofensivo, mecanismo de denúncia com resposta rápida, bloqueio de usuários abusivos e contato publicado. Desde 2025/2026 isso inclui explicitamente imagem íntima não consentida, inclusive gerada por IA — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/); [Apple News](https://developer.apple.com/news?id=vvzx6cul)
- Fontes secundárias dizem que os revisores procuram "Denunciar" em *cada* tipo de conteúdo (posts, comentários, perfis, mensagens) e que o bloqueio deve sumir com o conteúdo do bloqueado do feed, das mensagens e da busca (não confirmado pela Apple) — [Vettly](https://vettly.pages.dev/blog/app-store-guideline-1-2)
- Google Play: termos aceitos antes de criar conteúdo, denúncia dentro do app de conteúdo e de usuários, bloqueio em qualquer interação 1:1 (mensagens, marcações, menções), funções separadas e com rótulo claro, e moderação contínua — [Google Play Help 9876937](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en)
- NN/g mantém um relatório com 87 diretrizes de UX para idosos, testado com pessoas de 65 a 89 anos (layout, texto, busca, suporte) — [NN/g](https://www.nngroup.com/reports/senior-citizens-on-the-web/). Fonte secundária do NN/g: idosos travam em erros simples de digitação. Aceitar vários formatos de entrada (ex.: telefone com ou sem parênteses) — [ZURB](https://radar.zurb.com/article/design-for-seniors-ship-a-better-product-for-everyone)
- Notificações (dado da Helplama repetido por agregadores, com divergências): com 1 push por semana, cerca de 10% desligam; 42% desligariam com 2 a 5 por semana. Com 1 por semana, 20% das pessoas de 45–60 desligam, contra 7% das de 18–29 — [Business of Apps](https://www.businessofapps.com/marketplace/push-notifications/research/push-notifications-statistics/); [WiserNotify](https://wisernotify.com/blog/push-notification-stats/). A MIDiA mostra que a taxa de opt-out sobe com a frequência — [MIDiA](https://www.midiaresearch.com/blog/chart-of-the-week-over-half-of-app-user-enable-push-notifications)
- WhatsApp no Brasil (Panorama Mobile Time/Opinion Box): é usado por 98% dos brasileiros (2024) — [MacMagazine](https://macmagazine.com.br/post/2024/01/16/whatsapp-e-usado-por-98-dos-brasileiros-tiktok-por-48/); fica na tela inicial de 58% dos celulares; e 46% o escolheriam como o único app que manteriam — [Minha Operadora](https://www.minhaoperadora.com.br/2024/05/whatsapp-e-o-app-mais-presente-na-tela-inicial-do-smartphone-dos-brasileiros.html). Média de 5,3 grupos ativos por pessoa (ano da edição não claro); 74% estão em grupo de família e 57% em grupo de trabalho — [Mobile Time](https://www.mobiletime.com.br/?p=439411); [Mobile Time](https://www.mobiletime.com.br/?p=664115)
- InternetLab: a conversa sobre política em grupos de amigos no WhatsApp caiu de 38% (2020) para 24% (2024), um sinal de cansaço com conflito em grupos — [Olhar Digital](https://olhardigital.com.br/2025/12/15/internet-e-redes-sociais/brasileiros-estao-falando-menos-de-politica-em-grupos-de-whatsapp/)

### Inferences
- **Feed:** um cartão por tela no celular, com foto grande, título em Barlow 22–26 px e ações com texto e ícone ("TFA", "Comentar", "Compartilhar"), nunca só ícone. Esconder contadores de vaidade para quem vê (mostrar "12 irmãos reagiram" só ao autor) reduz a comparação. Ordem cronológica com o filtro "Meu capítulo" é mais previsível para esse público do que um algoritmo.
- **Moderação no lançamento:** menu "⋯" em post, comentário, story, perfil, mensagem, Loja, negócio e evento com "Denunciar" e "Bloquear" separados. O bloqueio é silencioso e esconde tudo, inclusive no mapa (o bloqueado deixa de ver o irmão no mapa ao vivo; isso é crítico para a segurança). Aceite dos termos antes do primeiro post. Fila de denúncias no painel com prazo (ex.: 24 h). Filtro automático de palavrões e de nudez em imagens antes de publicar.
- **Notificações:** cada tipo com chave própria (já decidido). O padrão deve ser **ligado** apenas para SOS, aceno recebido, mensagem direta e mudança de passeio confirmado; resumo diário opcional para curtidas e comentários; horário de silêncio padrão 22h–7h (exceto SOS). Teto suave de ~3 push "sociais" por dia por irmão. O público 45–60 desliga cedo.
- **WhatsApp:** não tentar substituir o grupo do capítulo no WhatsApp no começo. Dar o botão "Enviar para o WhatsApp" em passeios, Ágapes e SOS (já decidido) com link e prévia. O valor exclusivo do app é o mapa, o comboio, o SOS, os postos, as Lojas e a navegação. O chat do app vence quando está *ligado ao contexto* (grupo do passeio criado sozinho, que some depois).

### Gaps
- Não encontrei estudo comparando Mighty Networks, Circle, Discord e Facebook Groups com o WhatsApp para clubes. Não há dado confiável sobre por que motoclubes ficam no WhatsApp. A inferência se apoia na presença do WhatsApp.
- Os números de desligamento de notificações vêm de fornecedores e agregadores, com divergências (10% contra 12% com 1 por semana). Use apenas como direção.
- Não consegui o texto completo do relatório do NN/g (pago).

## 4. Eventos, presença confirmada (RSVP) e coordenação de passeio em grupo

### Takeaway
Eventos gratuitos têm uma mediana de cerca de 28% de faltas (37% nos pequenos, de 10 a 49 pessoas). Planejar o passeio contando com essa folga, pedir nova confirmação perto da data e usar check-in real no ponto de encontro.

### Cited Findings
- PheedLoop Event Data Lab: faltas medianas de ~28% em eventos gratuitos contra ~17% nos pagos; 22% dos eventos gratuitos perdem mais da metade do público esperado; eventos gratuitos pequenos (10–49) têm ~37% de faltas e grandes (500+) ~24% — [PheedLoop](https://pheedloop.com/blog/event-data-lab-report-5)
- Fornecedores dizem que um lembrete ~72 h antes reduz as faltas em 15–30% (sem fonte primária) — [resultados da busca: Eventbrite](https://www.eventbrite.co.uk/blog/how-to-manage-attendance-free-events-ds00/); organizadores do Meetup reclamam da baixa relação entre presentes e inscritos, sem números — [szabgab](https://szabgab.com/ideas-for-meetup-com)

### Inferences
- **Vou / Talvez / Não vou** (o cartão já decidido), mais uma nova confirmação 24–48 h antes ("Ainda vai? Sim / Não"), e quem não responder vira "Talvez".
- O grupo do passeio é criado com quem confirmou "Vou". O check-in no ponto de encontro (≤200 m) gera XP e é a base do comboio. Não punir faltas publicamente. Mostrar à diretoria apenas "confirmados × presentes" agregado.
- O cartão do passeio deve ter: ponto e hora de encontro, tipo de estrada (Só asfalto / Misto / Terra), distância, paradas (posto, café, Ágape), nível de exigência e o "road captain" (líder) e o "cerra-fila". Avisos rápidos (pausa, combustível baixo, ficou para trás) e reagrupar vão por voz.
- Lembretes com horário: 72 h ("confirmar"), na véspera às 19h ("previsão do tempo + o que levar") e 1 h antes ("saída em 1 h, ponto: …"). Nada entre 22h e 7h.

### Gaps
- Não encontrei documentação pública confiável sobre como o HOG (Harley Owners Group) ou os clubes do Strava fazem o RSVP e a liderança de comboio no app. Não há dado de faltas específico de motoclube.

## 5. Onboarding por aprovação, tela de espera, sinais de confiança, estados vazios e mascote

### Takeaway
Não achei pesquisa sólida específica sobre isso no tempo disponível. As recomendações abaixo são inferências a partir das regras já decididas e das achados acima (público 40–60, sensibilidade da filiação, LYLO e Locasa sobre transparência).

### Cited Findings
- Aceitar entrada em vários formatos e perdoar erros de digitação ajuda pessoas mais velhas (NN/g, via fonte secundária) — [ZURB](https://radar.zurb.com/article/design-for-seniors-ship-a-better-product-for-everyone)
- Revelar as configurações e o estado dá transparência e reduz a desconfiança (LYLO, CHI 2021 EA) — [LMU PDF](https://www.medien.informatik.uni-muenchen.de/pubdb/publications/pub/schneegassch2021lylo/schneegassch2021lylo.pdf)

### Inferences
- **Tela "pendente":** mostrar quem vai aprovar ("a diretoria de Cuiabá" ou "a administração do app"), o status em etapas (Enviado → Indicação confirmada por *Fulano* → Em análise → Aprovado), o prazo típico, um botão "Falar com o suporte (WhatsApp)" e "Editar meu pedido". Push ao ser aprovado. Não mostrar conteúdo do clube antes da aprovação (já decidido), mas pode mostrar o Bodinho e um texto sobre o que o irmão vai encontrar.
- **Formulário:** dividir em 3 passos curtos (Quem sou / Fotos do colete e da carteirinha / Quem me indica). Explicar *por que* cada foto é pedida e que ela só é vista por quem aprova e apagada depois da aprovação (minimização da LGPD). Usar a câmera com guia de enquadramento.
- **Sinais de confiança no perfil:** capítulo e "membro desde", "aprovado por diretoria de X" e selos de confraternização. Nunca grau. Loja, Oriente e Potência apenas conforme a visibilidade escolhida.
- **Estados vazios:** frase curta, uma ação principal e o Bodinho (boas-vindas, estados vazios, conquistas; nunca no modo pilotando, como já decidido). Tom de irmão mais velho, bem-humorado mas sóbrio. Sem infantilizar, sem confete em SOS ou em erro. Nunca usar o mascote em telas de privacidade, consentimento, denúncia ou SOS: ali o tom deve ser sério e claro.

### Gaps
- Não encontrei estudos revisados por pares sobre telas de espera de aprovação, nem sobre o efeito de mascotes na confiança em apps "sérios" para 40–60 anos. As recomendações acima são de prática de design, não de evidência.
