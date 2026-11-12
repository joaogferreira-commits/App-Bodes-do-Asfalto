# Diretrizes oficiais de plataforma: Android Auto, CarPlay, Material/HIG e lojas (pesquisa de 12/11/2026)

Nota de método: as páginas da Apple (CarPlay Developer Guide, edição de outubro de 2026, e HIG) e de developer.android.com foram lidas na íntegra. Os hosts developers.google.com, m3.material.io, support.google.com (Central de Políticas do Play) e osmfoundation.org foram **bloqueados pela rede desta sessão**. Os itens que dependem deles estão em "Gaps" e precisam ser conferidos antes de virar regra.

## 1. Android for Cars: qualidade, NavigationTemplate e revisão do Play

### Takeaway
O app de navegação para Android Auto precisa atingir o nível "Car optimized" (Tier 2) para ser aceito no Play. Além disso, passa por uma revisão manual extra. Os pontos que mais derrubam apps são estes:
- curva a curva obrigatório, com notificação TBT e dados para o painel (cluster);
- na superfície, só mapa;
- mapa claro e escuro;
- "test drive" simulado;
- tratamento de intents de navegação;
- no máximo 5 templates por tarefa;
- nenhuma animação, vídeo, texto rolando ou anúncio.

### Cited Findings
**Níveis e revisão**
- Os apps de categorias usadas ao dirigir (navegação incluída) "must meet all of the applicable requirements" do Tier 2 (Car optimized) para serem aceitos no Play. O Tier 1 (Car differentiated) é opcional e inclui o NF-9 (cluster) — [Car app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- Os apps para carro passam por "additional manual review beyond normal Play Store review". Se reprovado, o contato é feito pelo e-mail da conta do Play Console. **Enquanto o app de carro não é aprovado, nenhuma atualização é distribuída, nem para celular.** A orientação é não usar o APK de produção para prototipar Android Auto — [Car app quality, FAQ](https://developer.android.com/docs/quality-guidelines/car-app-quality)

**Critérios de navegação (IDs exatos)**
- NF-1: deve oferecer navegação curva a curva — [Car app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- NF-2: na superfície dos templates de navegação, desenha-se só conteúdo de mapa. Instruções em texto, faixas e ETA ficam nos componentes do template. Informação de direção (limite de velocidade, obstrução) pode ser desenhada na "safe area" do mapa — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- NF-3: se houver instruções em texto, também é preciso disparar notificações de navegação (TBT) — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- NF-4: as instruções da próxima manobra devem ir para o painel (cluster) do carro, via NavigationManager.updateTrip — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- NF-5: quando outro app de navegação estiver guiando, nada de notificação TBT, voz ou dados de cluster — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- NF-6: o app deve tratar intents de navegação vindos de outros apps e do Assistente — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- NF-7: deve ter um modo "test drive" que simula a condução, implementado com `NavigationManagerCallback.onAutoDriveEnabled` e testado com `adb shell dumpsys activity service <CarAppService> AUTO_DRIVE` — [Car app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality); [Build a navigation app](https://developer.android.com/training/cars/apps/navigation)
- NF-8 foi removido e substituído pelo MR-1 — [Car app quality, change notes](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- MR-1 (Navigation, POI, Weather): o mapa deve sair claro ou escuro quando o sistema mandar (`CarContext.isDarkMode`, `Session.onCarConfigurationChanged`). O usuário pode escolher ficar sempre em um dos temas — [Car app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality); [Build apps (Support dark theme)](https://developer.android.com/training/cars/apps)
- NF-9 (Tier 1): no painel (cluster) desenham-se só tiles de mapa, com a rota opcional — [Car app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- VC-1: o app deve suportar comandos de voz do Gemini e do Google Assistant (via intents de navegação) — [Car app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- DD-1: o canal de áudio de navegação é só para instruções de navegação. O foco de áudio deve usar `USAGE_ASSISTANCE_NAVIGATION_GUIDANCE` e `AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK` — [Car app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality); [Build a navigation app](https://developer.android.com/training/cars/apps/navigation)
- TH-1: quem aplicar tema próprio aos componentes (biblioteca 1.9 ou superior) precisa suportar tema claro e escuro — [Car app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality)

**Critérios gerais aplicáveis à navegação (Car ready / Car optimized)**
- SA-1: proibido exibir elementos animados (gráficos animados, vídeo). Exceção: animação de canvas com o carro parado, se relevante para a direção — [Car app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- ST-1: proibido texto que rola sozinho — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- AD-1: proibido anúncio em texto, salvo o nome do anunciante ou do produto. NA-1: proibido anúncio por notificação — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- IU-1: elementos do app não exibem imagens. Exceções:
  - uma imagem estática de contexto;
  - ícones na gaveta;
  - imagens/fotos que ajudem na decisão ao dirigir;
  - imagens de faixa ou de junção (navegação).

  [Mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- VI-1: se o usuário precisar ir ao celular (ex.: permissão), mostrar mensagem para olhar o celular só quando for seguro — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- Critério de 5 telas: "Users must be able to complete tasks in the app using five screens or fewer". O critério aparece rotulado `AC-1` na página, provavelmente por erro de rótulo — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- DR-1: botões respondem em até 2 s. DR-2: o app abre em até 10 s. DR-3: o conteúdo carrega em até 10 s — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- VD-1: ícones e cores devem atender aos requisitos de contraste do Android Auto — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- PA-1: compras só em fluxos simples. Proibido configurar meio de pagamento, escolher vários itens ou **assinar recorrência (assinaturas)** no carro — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- IN-1: notificar só o que for relevante ao motorista — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- EP-2: ao reabrir, restaurar o estado anterior o mais fielmente possível. PC-1: nada fora da categoria declarada — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)
- UX-1/2/3 (alvo de 64 dp, 24 dp de espaçamento, fonte de 24 sp) valem só para Video/Games/Browsers. Para a navegação, o toque é tratado pelos templates — [mesma fonte](https://developer.android.com/docs/quality-guidelines/car-app-quality)

**Manifesto e templates**
- Categoria `androidx.car.app.category.NAVIGATION` + permissão `androidx.car.app.NAVIGATION_TEMPLATES` (e outra permissão para desenhar mapas). Para o cluster, também a categoria `androidx.car.app.category.FEATURE_CLUSTER` — [Build a navigation app](https://developer.android.com/training/cars/apps/navigation)
- Templates de navegação: `NavigationTemplate` e `MapWithContentTemplate` (Car App API 7). `MapTemplate`, `PlaceListNavigationTemplate` e `RoutePreviewNavigationTemplate` estão **deprecated**. A orientação é migrar listas de lugares e prévia de rota para `MapWithContentTemplate` + `ListTemplate`/`PaneTemplate` — [Build a navigation app](https://developer.android.com/training/cars/apps/navigation)

**Composição do NavigationTemplate**
- Mapa em tela cheia desenhado pelo app, cartão de rota com manobras e cartão de estimativa (ETA, tempo, distância).
- **Action strip com até 4 ações do app.**
- **Map action strip opcional com até 4 botões** (só ícone), para zoom, recentrar, bússola etc. Some quando o mapa está ocioso.

[Navigation template (design)](https://developer.android.com/design/ui/cars/guides/templates/navigation-template); [Build apps](https://developer.android.com/training/cars/apps)

**Requisitos de UX do Navigation template**
- MUST: pelo menos 1 manobra no cartão de rota.
- MUST: pelo menos 1 botão na action strip.
- MUST: botão de pan na map action strip se o app aceita gesto de pan.
- SHOULD: mapa escuro no cluster.
- SHOULD: só botões de mapa na map action strip.
- SHOULD: botão "encerrar navegação".
- SHOULD: símbolos padronizados.
- SHOULD: imagem de junção só com conteúdo de navegação, na largura do cartão.
- SHOULD: imagens de faixa com fundo transparente.
- SHOULD: alertas só não distrativos.
- MAY: 2 manobras quando forem seguidas.
- MAY: desenhar velocidade atual, limite e radar no mapa.
- MAY: mudar a cor de fundo do cartão de rota conforme o tipo de via.

[Navigation template (design)](https://developer.android.com/design/ui/cars/guides/templates/navigation-template)

**Cartão de rota**
- Estados possíveis: rota (manobra atual com ícone, distância e texto; faixas OU imagem de junção; próxima manobra) ou mensagem (até 2 linhas + imagem).
- Spinner permitido para carregando, calculando ou recalculando. No recálculo, use `Trip.Builder.setLoading(true)`, não `navigationEnded`.

[Navigation template (design)](https://developer.android.com/design/ui/cars/guides/templates/navigation-template); [Build a navigation app](https://developer.android.com/training/cars/apps/navigation)

**Requisitos de UX de apps de navegação**
- MUST: tudo o que é desenhado no mapa atende ao contraste.
- MUST: na superfície, só mapa e conteúdo de direção.
- MUST: mapa claro ou escuro sob comando.
- MUST: notificação TBT quando o usuário está fora do NavigationTemplate durante a navegação.
- SHOULD: **texto no mapa ≥ 24 dp**, salvo se acompanhado de elemento visual ou se for estático.
- SHOULD: **imagens, ícones e marcadores ≥ 36 × 36 dp**.
- SHOULD: indicar quando uma tarefa vai alterar a rota.
- SHOULD: atualizar duração e distância durante o trajeto.
- MAY: animações quando ajudam a dirigir.
- MAY: cor de fundo da notificação TBT.

[Navigation apps (design)](https://developer.android.com/design/ui/cars/guides/app-types/navigation-apps)

**Alerta (Alert/AlertCallback)**
- Só existe dentro do NavigationTemplate.
- Tem título, duração (barra de progresso) e, opcionalmente, subtítulo, ícone e **até 2 ações**.
- **Duração recomendada: 10 s.**
- Fecha por timeout (`onCancel(REASON_TIMEOUT)`, depois `onDismiss`), por ação ou pelo app (`dismissAlert`).
- `REASON_NOT_SUPPORTED` indica que o host não suporta alertas.
- Mesmo `alertId` não atualiza o alerta; outro id substitui o anterior.
- Não usar para a informação principal (curvas, ETA). Exemplos de uso: trânsito, radar, "aceita buscar alguém?". Fora do template, use notificação heads-up (HUN).

[Build a navigation app](https://developer.android.com/training/cars/apps/navigation); [Navigation template (design)](https://developer.android.com/design/ui/cars/guides/templates/navigation-template)

**Notificação TBT**
- Requisitos: `setOngoing(true)`, `CATEGORY_NAVIGATION` e `CarAppExtender`.
- Aparece no "rail widget". Com `IMPORTANCE_HIGH`, vira HUN; `setOnlyAlertOnce(true)` faz o alerta tocar uma vez só.
- As HUNs de TBT são suprimidas enquanto o app mostra a rota na tela.

[Build a navigation app](https://developer.android.com/training/cars/apps/navigation)

**TravelEstimate**
- Aceita `setTripIcon` e `setTripText` (texto/ícone ao lado ou no lugar de ETA, tempo e distância).

[Build a navigation app](https://developer.android.com/training/cars/apps/navigation)

**Limite de passos (template quota)**
- No máximo 5 templates por tarefa. O último deve ser NavigationTemplate, PaneTemplate, MessageTemplate, MediaPlayback, SignInTemplate ou LongMessageTemplate.
- Refresh do mesmo tipo com o mesmo conteúdo principal não conta.
- Voltar (pop) devolve a quota.
- O NavigationTemplate zera a quota.
- Abrir o app por notificação ou pelo launcher também zera a quota.
- Estourar a quota faz o host mostrar erro e fechar o app.
- Há um overlay de depuração dos passos no modo desenvolvedor.

[Build apps (Template restrictions)](https://developer.android.com/training/cars/apps)

**Pan, zoom e interação com o mapa**
- `SurfaceCallback` oferece: onClick (API 5), onScale/onScroll/onFling (API 2) e double-tap.
- Para receber esses eventos é **obrigatório** ter `Action.PAN` na map action strip. Em tela de toque o botão de pan fica oculto.
- Nem toda central aceita multitoque, então ofereça zoom +/- por botões.

[Build apps](https://developer.android.com/training/cars/apps); [NavigationTemplate reference](https://developer.android.com/reference/androidx/car/app/navigation/model/NavigationTemplate)

**Cores (CarColor)**
- Disponíveis: as cores padrão (DEFAULT, PRIMARY, SECONDARY, RED, GREEN, BLUE, YELLOW), primária e secundária via tema (`carColorPrimary` / `carColorPrimaryDark` etc.; as variantes clara e escura são obrigatórias) e `createCustom`.
- **Se a cor não passar no contraste, o host troca pela padrão.**
- As cores padrão são recomendadas por garantirem contraste.

[CarColor reference](https://developer.android.com/reference/androidx/car/app/model/CarColor)

**Texto**
- `CarText` aceita variantes de tamanho (API 2+) para telas diferentes.

[Build apps](https://developer.android.com/training/cars/apps)

**Teclado e entrada**
- A entrada de texto pertence ao SignInTemplate/SearchTemplate.
- Ações que exigem o carro parado usam `ParkedOnlyOnClickListener`.
- No Android Auto o diálogo de permissão abre **no celular**. Para ele aparecer em Android 14+, é preciso a versão 1.7.0-alpha01 ou superior.

[Build apps](https://developer.android.com/training/cars/apps)

### Inferences
- Rede social, feed, chat em texto e conquistas **não podem** ir para o Android Auto. O PC-1 restringe à categoria de navegação, e o PA-1 proíbe assinatura no carro. O botão "Assinar Premium" fica no celular; no carro, quando o recurso for Premium, mostrar só uma MessageTemplate do tipo "disponível no Premium", sem fluxo de compra.
- O desenho de 5 botões do painel (Alerta, Comboio, Posto mais próximo, Posto na rota, SOS) não cabe diretamente na action strip (até 4 ações), e a map action strip deve ter só ações de mapa. Um caminho: 3 ações + "Mais" na action strip, levando a uma Grid/List com as demais. Alternativa: tirar o "Comboio" da strip e mostrar seu estado no TravelEstimate/Alert.
- "Postos na rota" e "Postos próximos" devem usar `MapWithContentTemplate` + `ListTemplate`, contando os passos (lista → detalhe → navegar = 3 de 5).
- Os avisos do comboio ("ficou para trás", "combustível baixo") se encaixam no `Alert` (10 s, até 2 ações) durante a navegação, e em HUN fora dela.
- O mapa MapLibre do carro precisa de estilo claro **e** escuro (MR-1), além do estilo "noite" do clube. A cor do cartão de rota pode diferenciar estrada de terra (MAY), ajudando a regra "terra com cor própria".
- Como o NF-1 exige curva a curva, e a navegação curva a curva é Premium, a revisão do Android Auto precisa ver o curva a curva funcionando. É preciso garantir que o revisor (conta demo) tenha Premium e que o modo test drive funcione.

### Gaps
- Limites exatos de caracteres por linha e de linhas por Row/ListTemplate (normalmente 6 itens com o carro em movimento, `ConstraintManager.getContentLimit`) não foram confirmados nesta sessão. Consultar a referência `ConstraintManager` antes de definir as listas.
- A página de design "Map + Content template" e as "global requirements for templated apps" (developers.google.com/cars/design) não foram lidas porque o host estava bloqueado.
- A política do Play "Android Auto" na Central de Políticas (support.google.com) não foi acessível.

## 2. Apple CarPlay: app de navegação (CPMapTemplate), entitlement e revisão

### Takeaway
O CarPlay Developer Guide (outubro de 2026) proíbe redes sociais no CarPlay e exige:
- curva a curva com manobras;
- base view só com mapa;
- botão de pan;
- cancelamento imediato da rota quando o sistema pedir;
- áudio de voz configurado de forma específica.

A barra de navegação tem até 2+2 botões e o mapa até 4 botões. A hierarquia vai a no máximo 5 templates. Listas, prévias e painéis têm no máximo 12 itens.

### Cited Findings
**Regras para todos os apps CarPlay**
1. O app deve ser feito principalmente para a função da categoria.
2. Nunca mandar pegar o iPhone.
3. Todo fluxo deve ser possível sem o iPhone.
4. Só recursos relacionados à tarefa principal (nada de configurações à parte).
5. **"No gaming or social networking"**.
6. **Nunca mostrar conteúdo de mensagens, textos ou e-mails na tela.**
7. Templates só para o fim previsto.

[CarPlay Developer Guide, out/2026, p.5](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf)

**Regras extras para navegação**
1. Curva a curva com as próximas manobras.
2. Base view só para desenhar mapa: nada de janelas, alertas, painéis ou overlays, nem faixas desenhadas (faixa vai como manobra secundária).
3. Templates para o fim previsto; imagem de manobra só para manobra.
4. Se houver pan, botão para entrar no modo pan.
5. Gestos no mapa só para pan, zoom, pitch e rotação.
6. Encerrar a rota imediatamente quando pedido (`mapTemplateDidCancelNavigation`).
7. A voz deve funcionar junto com o áudio do carro, sem sessão de áudio ativa à toa.
8. O mapa deve ser adequado a cada país.
9. Atender ao feedback da Apple e das montadoras.

[CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf)

**Entitlement**
- Pedido em developer.apple.com/carplay, informando a categoria e aceitando o CarPlay Entitlement Addendum. A Apple avalia e atribui o entitlement à conta.
- Depois, criar um Provisioning Profile com o entitlement. A chave é `com.apple.developer.carplay-maps` (iOS 12+).
- Entitlements diferentes não se combinam no mesmo app (exceção: EV charging + fueling).

[CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf)

**Profundidade e listas**
- Apps de navegação: profundidade máxima de **5 templates** (incluindo a raiz). A seleção hierárquica "must never exceed five levels".
- Alguns carros limitam as listas a **12 itens** dinamicamente.
- O teclado pode ser desativado com o carro em movimento (observe `CPSessionConfiguration.limitedUserInterfaces`).
- Tab bar com até 5 abas (4 em apps de áudio).

[CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf)

**CPMapTemplate**
- A barra de navegação tem **até 2 botões à esquerda e 2 à direita** (ícone ou texto) e some com a inatividade.
- **Até 4 map buttons** (ícones), para zoom e pan. Se houver qualquer pan, um deles **deve** ser o botão de pan, porque há carros só com botão giratório ou touchpad.
- Os botões podem mudar conforme o estado, por exemplo "Encerrar" durante a rota.

[CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf)

**Painéis**
- Trip preview: até 12 destinos, cada CPTrip com até 3 rotas.
- Textos das rotas e das instruções vão em arrays em ordem decrescente de tamanho; o CarPlay mostra o mais longo que couber.
- Guidance: 1 manobra (2 se forem seguidas). A segunda pode mostrar faixas ou junção.
- Mantenha sempre pelo menos 1 manobra em `upcomingManeuvers`.
- Atualize as estimativas só quando mudarem de forma significativa (por exemplo, quando o minuto mudar).
- Use `pauseTrip(.loading)` enquanto calcula.

[CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf)

**Tamanhos de símbolo**
| Elemento | Tamanho |
| --- | --- |
| 1ª manobra (símbolo e instrução em 1 linha) | 50×50 pt |
| 1ª manobra (2 linhas) | 120×50 pt |
| 2ª manobra (com instrução) | 18×18 pt |
| 2ª manobra (só símbolo, faixa) | 120×18 pt |
| Junção no Dashboard | 140×100 pt |

- Exigidas as variantes clara e escura (CPImageSet).
- Ícone do app CarPlay: 120 px (@2x) e 180 px (@3x).

[CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf); [HIG CarPlay](https://developer.apple.com/design/human-interface-guidelines/carplay)

**Navigation alert**
- Imagem, título, subtítulo, duração e **até 2 botões**.
- Desde o iOS 16 aceita subtítulo longo (antes, 3 linhas), alerta sem botões (só "fechar") e botões com cor própria.
- Vira notificação se o app estiver em segundo plano (`shouldShowNotificationFor`).

[CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf)

**CPMapPanel (iOS 27+)**
- Painel genérico com até 12 itens: CPListItem, CPGridButton, CPTrip, CPRouteChoice, CPTravelEstimates, CPRouteDetail, waypoint.

[CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf)

**Modo noturno e base view**
- O mapa é desenhado em tamanhos e proporções variadas e em claro/escuro (`contentStyle` / `contentStyleDidChange`), respeitando a safe area.
- O app não recebe toques diretos na base view.
- Telas comuns: 800×480, 960×540, 1280×720, 1920×720 px.
- A HIG pede funcionar em ambientes claros e escuros e testar as cores em carro real. O ícone não pode ter fundo preto.
- Coloque o mais importante na metade de cima.

[CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf); [HIG CarPlay](https://developer.apple.com/design/human-interface-guidelines/carplay)

**Voz**
- Sessão de áudio: categoria Playback, modo `VoicePrompt`, opções `InterruptSpokenAudioAndMixWithOthers` + `DuckOthers`.
- Ativar a sessão só para falar e desativar logo depois (no máximo "a few seconds").
- Respeitar o `promptStyle`: None = silêncio; Short = um tom; Normal = fala completa.
- A gravação de voz só é permitida dentro do Voice control template.

[CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf)

**Funcionamento com o iPhone**
- Tudo deve funcionar com o iPhone bloqueado ou guardado. Erros aparecem no CarPlay, nunca no iPhone. Configuração inicial no iPhone só antes de o carro andar.

[HIG CarPlay](https://developer.apple.com/design/human-interface-guidelines/carplay)

**Notificações e extras**
- As notificações de rota no CarPlay são tratadas pelo próprio framework. Para notificar em geral, inclua `.carPlay` nas opções de autorização.
- O app pode ter mapa secundário no Dashboard (iOS 13.4+) e no painel do carro (iOS 15.4+) e compartilhar manobras com o veículo (iOS 17.4+).

[CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf)

### Inferences
- No CarPlay, **nada do social** (feed, chat, aceno, ranking). "Never show the content of messages" impede exibir o texto de acenos ou respostas rápidas na tela. A saída é aviso só por voz, coerente com "Pilotando: aviso só por voz".
- Os 5 botões do painel (Alerta, Comboio, Posto mais próximo, Posto na rota, SOS) precisam caber em 2+2 botões de barra + 4 map buttons, sendo os map buttons para pan e zoom. Sugestão: barra com "Postos" (abre lista) e "SOS" à esquerda, "Alerta" e "Encerrar" à direita. Comboio e pausa ficam como navigation alert ou CPMapPanel.
- O SOS no CarPlay precisa ser defendido como "alerta ao grupo do comboio", e não como serviço de emergência. Ver a diretriz 5.1.5 da App Store no item 5.
- O CarPlay também exige o curva a curva funcionando no envio. Como o entitlement é por app e por categoria, pedir cedo, porque o lançamento não espera.

### Gaps
- Prazo típico de aprovação do entitlement: nenhuma fonte oficial encontrada.
- Os requisitos específicos de revisão do CarPlay no App Store Connect (vídeo ou demo) não foram encontrados.

## 3. Material Design 3 e Apple HIG (tema escuro, toque, tipografia, abas, mapas, háptico)

### Takeaway
Os números confirmados são estes:
- Android: alvo de toque ≥ 48 dp.
- iOS: controle ≥ 44×44 pt; corpo padrão 17 pt; mínimo 11 pt.
- Contraste mínimo de 4,5:1 (a Apple sugere 7:1 para texto pequeno em cores próprias).
- Tab bar com 5 abas ou menos.
- Logo e link legal do Apple Maps sempre visíveis (só se usar MapKit).

Os detalhes do M3 (tons do tema escuro, nav bar de 3 a 5 destinos, bottom sheets, FAB, escala tipográfica) não puderam ser verificados porque o m3.material.io estava bloqueado.

### Cited Findings
**Android**
- Todo alvo de toque deve ter pelo menos 48 dp, "even if this extends past the UI element visual" — [Android accessibility foundations](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility)

**Apple HIG**
- Tamanho mínimo de controle no iOS/iPadOS: 44×44 pt — [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- Texto no iOS: padrão de 17 pt, mínimo de 11 pt — [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- Dynamic Type: a tabela da HIG vai de xSmall (Body 14 pt) a AX5. É preciso adaptar o layout a todos os tamanhos (empilhar itens, menos colunas, truncar pouco, manter a hierarquia) e aumentar os ícones com a fonte. Testar com "Larger Accessibility Text Sizes" — [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- Dark Mode:
  - contraste nunca abaixo de 4,5:1; para cores próprias, buscar 7:1, sobretudo em texto pequeno;
  - testar com Increase Contrast e Reduce Transparency;
  - ícones/ilustrações separados para claro e escuro quando preciso.

  [HIG Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- Para o contraste, a Apple usa o WCAG AA como referência e cita o APCA. Se o padrão não atingir o mínimo, oferecer esquema de alto contraste com "Increase Contrast" — [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- Tab bar:
  - sempre visível ao navegar entre seções (exceto sob modal);
  - menos abas é mais fácil;
  - se personalizável, padrão de "five or fewer".

  [HIG Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- Mapas:
  - agrupar (cluster) pontos sobrepostos;
  - anotações no estilo do app;
  - marcador com texto de 2 a 3 caracteres.

  Se usar MapKit, o logo da Apple e o link legal devem ficar visíveis:
  - padding de 7 pt nas laterais e 10 pt acima/abaixo;
  - fixos ao mapa;
  - 10 pt acima da posição de repouso mais baixa de um cartão deslizante.

  [HIG Maps](https://developer.apple.com/design/human-interface-guidelines/maps)
- Háptico:
  - usar os padrões do sistema conforme o significado documentado;
  - ser consistente (causa e efeito);
  - **tornar opcional** (o usuário pode desligar).

  [HIG Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)

### Inferences
- O mínimo de 48 px do projeto já cobre 44 pt (iOS) e 48 dp (Android). O corpo de 17 px do DESIGN.md coincide com o padrão da Apple. O mínimo de 13 px fica acima do mínimo de 11 pt da Apple.
- O app usa MapLibre, não MapKit, então a regra do logo da Apple não se aplica. A mesma lógica de padding e de "10 pt acima do cartão" serve para a atribuição do OSM (ver o item 4).
- A barra inferior de 5 itens (Mapa, Feed, Passeios, Conquistas, Perfil) está dentro do limite do iOS ("five or fewer").

### Gaps
- M3: tons de superfície do tema escuro (surface, surfaceContainer...), elevação tonal, navigation bar (3 a 5 destinos), bottom sheet padrão × modal, uso do FAB, chips e escala tipográfica em sp (por exemplo, Body Large 16 sp). O m3.material.io foi bloqueado. Pelo conhecimento prévio (não verificado), o M3 recomenda de 3 a 5 destinos na navigation bar e um FAB principal por tela. Confirmar antes de citar.

## 4. Google Navigation SDK, termos do Google Maps Platform e atribuição OSM/OpenFreeMap

### Takeaway
Nada pôde ser verificado nesta sessão: developers.google.com, osmfoundation.org e openfreemap.org foram bloqueados pela rede. É um ponto crítico para a arquitetura MapLibre + Google Navigation SDK e precisa de verificação antes da Etapa 3.

### Cited Findings
- Nenhum achado verificado (hosts bloqueados).

### Inferences
- Mostrar no mapa principal (MapLibre/OpenFreeMap) dados obtidos do Google (rotas, lugares, ETA) pode conflitar com os termos do Google Maps Platform, que costumam proibir o uso de conteúdo Google com mapas que não sejam do Google. A arquitetura atual usa o Google só dentro da tela de navegação do próprio SDK, e o Valhalla para planejar rotas no MapLibre, o que tende a evitar o conflito. Confirmar no texto dos termos.

### Gaps
- Política de atribuição do Navigation SDK (logo do Google, avisos legais, licenças de código aberto) e limites de personalização da interface de navegação: confirmar em developers.google.com/maps/documentation/navigation/android-sdk/policies e na versão para iOS.
- Cláusula dos termos do Google Maps Platform sobre "no use with non-Google maps" (Service Specific Terms): não verificada.
- Diretriz de atribuição da OSMF: pelo conhecimento prévio, "© OpenStreetMap contributors" visível no mapa ou a um toque, com link para openstreetmap.org/copyright. Não verificada nesta sessão.
- Exigências de atribuição do OpenFreeMap (OpenMapTiles + OSM): não verificadas.

## 5. Requisitos das lojas que afetam a interface (exclusão de conta, conteúdo de usuários, localização, permissões)

### Takeaway
App Store:
- exclusão de conta dentro do app (5.1.1(v));
- filtro, denúncia, bloqueio e contato publicado para conteúdo de usuários (1.2);
- política de privacidade no app (5.1.1(i));
- consentimento antes de usar a localização (5.1.5);
- login alternativo equivalente se houver login social (4.8).

Ponto de atenção: a 5.1.5 diz que APIs de localização não devem ser usadas para "emergency services". O SOS precisa ser apresentado como alerta ao grupo, e não como serviço de emergência.

Android: pedir a permissão no contexto de uso, com tela de explicação que se pode cancelar, degradar com elegância e lembrar que, depois de 2 negativas, o sistema não pergunta mais. A política do Play para localização em segundo plano restringe o uso à funcionalidade principal (o texto completo da política não foi acessível).

### Cited Findings
**App Store**
- 5.1.1: "If your app supports account creation, you must also offer account deletion within the app." — [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 5.1.1(i): link para a política de privacidade no App Store Connect **e dentro do app**, em local de fácil acesso, identificando os dados coletados, o uso e os terceiros — [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 1.2: apps com conteúdo de usuários (inclui redes sociais) devem ter:
  - filtro de material ofensivo antes da publicação;
  - mecanismo de denúncia com resposta rápida;
  - bloqueio de usuários abusivos;
  - contato publicado.

  [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 5.1.5:
  - localização só quando for diretamente relevante;
  - "Location-based APIs shouldn't be used to provide emergency services or autonomous control over vehicles";
  - notificar e obter consentimento antes de coletar, transmitir ou usar a localização;
  - explicar o propósito no app.

  [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 5.1.2(i): permissão explícita antes de compartilhar dados pessoais com terceiros (inclui IA de terceiros). Rastreamento exige ATT — [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 2.5.4: serviços em segundo plano só para o fim previsto (localização, VoIP, áudio etc.) — [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 4.8: com login social (Google), oferecer outro login equivalente que limite os dados a nome e e-mail, permita esconder o e-mail e não rastreie para anúncios. Sign in with Apple atende — [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

**Android: permissões**
- Pedir a permissão no contexto, quando o usuário começa a usar o recurso.
- Não bloquear o usuário: a tela de explicação deve sempre poder ser cancelada.
- Se negada, degradar com elegância e informar o que deixa de funcionar.
- Usar `shouldShowRequestPermissionRationale`.
- Negar duas vezes equivale a "não perguntar de novo" (permanente).

[Request runtime permissions](https://developer.android.com/training/permissions/requesting)

**Android: localização em segundo plano**
- A política do Play restringe o acesso à localização em segundo plano a apps que precisam dela para a funcionalidade principal e cumprem os requisitos da política. Seguir as boas práticas não garante a aprovação.
- No Android 10+ é necessário declarar `ACCESS_BACKGROUND_LOCATION`.

[Background location](https://developer.android.com/training/location/background); [Location permissions](https://developer.android.com/training/location/permissions)

### Inferences
- Tela de Configurações: "Excluir minha conta" (iOS obrigatório), "Política de privacidade" e "Ajuda/contato".
- Feed e chat: denunciar, bloquear e filtro automático (lista de palavras) antes de publicar.
- Fluxo de localização:
  1. pedir "durante o uso" só ao abrir o Mapa ou começar uma rota, depois de uma tela própria de explicação que pode ser recusada;
  2. pedir "o tempo todo" separadamente, só ao ativar o mapa ao vivo ou a Chegada na Cidade, com uma segunda tela explicativa.

  Isso é coerente com o padrão do projeto (segundo plano desligado).
- Texto do SOS: "Avisa seus irmãos do comboio e seus contatos. Não substitui o 192/193". Evita o enquadramento de "serviço de emergência" da 5.1.5.

### Gaps
- Política de Localização do Play (declaração de localização em segundo plano, vídeo de demonstração exigido, "prominent disclosure" com texto mínimo), política de exclusão de conta do Play (link web + in-app, declaração no Data safety) e política de UGC do Play: a Central de Políticas (support.google.com) foi bloqueada. Pelo conhecimento prévio (não verificado), o Play exige:
  - aviso destacado antes do pedido de localização em segundo plano;
  - formulário de declaração com vídeo;
  - opção de excluir a conta dentro do app e por link web.

  Confirmar antes de usar.
