# Ergonomia visual, leitura, acessibilidade e carga cognitiva — usuários 40–60 anos, uso externo, tema escuro

> Método e limites: pesquisa por busca na web (12/11/2026). A busca do ambiente funcionou, mas a leitura completa de páginas foi bloqueada pela rede da sessão para nngroup.com, w3.org e mural.maynoothuniversity.ie. Por isso vários achados vêm de trechos de busca (snippets) e de fontes secundárias; isso está sinalizado item a item. Valores das especificações oficiais (WCAG, Apple HIG, Material) são de conhecimento consolidado e citados nas URLs canônicas. Os contrastes dos tokens do projeto foram **calculados localmente** com a fórmula de luminância relativa da WCAG a partir de `docs/DESIGN.md`.

## 1. Visão aos 40–60 anos (presbiopia, contraste, ofuscamento, pupila, cor) e tamanho mínimo de texto

### Takeaway
Quase todo o público do app tem presbiopia (sintomas começam ~42–44 anos; até ~85% das pessoas com 40+), com perda de sensibilidade ao contraste, pupila menor (precisa de mais luz) e mais sensibilidade ao ofuscamento à noite. O corpo de 17 px já adotado é adequado (pesquisa com idosos preferiu 16 pt; a orientação da NN/g de 12 pt é um piso antigo para web desktop); o fator mais crítico não é só tamanho, mas contraste alto e respeito ao tamanho de fonte do sistema.

### Cited Findings
- Prevalência de presbiopia aumenta com a idade; até ~85% das pessoas com 40 anos ou mais desenvolvem presbiopia; ~1,8 bilhão de pessoas no mundo em 2015 — [Revisão narrativa, PMC9373794](https://pmc.ncbi.nlm.nih.gov/articles/PMC9373794)
- Primeiros sintomas tipicamente por volta dos 40 anos em sociedades ocidentais; idade média do primeiro relato entre 42 e 44 anos — [EyeWiki (AAO) – Presbyopia](https://eyewiki.aao.org/Presbyopia)
- Em motoristas idosos de visão normal, sensibilidade ao contraste e acuidade de baixo contraste se associaram ao desempenho de direção; a acuidade de alto contraste (teste padrão) não — [estudo em PMC (via busca)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9373794); ver também [Kimlin, tese QUT sobre motoristas idosos à noite](https://eprints.qut.edu.au/101497/1/Janessa_Kimlin_Thesis.pdf)
- Mudanças oculares do envelhecimento degradam a visão mesópica (crepúsculo), **aumentam a sensibilidade ao ofuscamento** e atrasam a adaptação a mudanças rápidas de luz; até 1/3 dos motoristas idosos relatam dificuldade visual para dirigir à noite — [Kimlin, tese QUT](https://eprints.qut.edu.au/101497/1/Janessa_Kimlin_Thesis.pdf)
- Miose senil: redução progressiva do diâmetro da pupila com a idade, menos luz chega à retina, pior desempenho com pouca luz — [Kimlin, tese QUT](https://eprints.qut.edu.au/101497/1/Janessa_Kimlin_Thesis.pdf)
- Pessoas na faixa dos 60 precisam de ~3 vezes mais luz para ler confortavelmente do que pessoas na faixa dos 20 — [NIH News in Health, "Your Aging Eyes"](https://newsinhealth.nih.gov/node/2346)
- Em experimento de leitura dinâmica (skim) com idosos do Reino Unido e da Tailândia, **16 pt foi o tamanho preferido** — [Kamollimsakul, tese Univ. Leeds](https://etheses.whiterose.ac.uk/id/eprint/9027/1/Thesis_Sorachai_Kamollimsakul_CS.pdf)
- NN/g recomenda fonte padrão mínima de 12 pt em sites voltados a idosos e que todo site permita aumentar o texto (orientação antiga, de web desktop) — [NN/g, Usability for Seniors](https://www.nngroup.com/articles/usability-seniors-improvements/) (lido só por snippet)
- Taxa de sucesso em tarefas: idosos 55,3% vs. 74,5% de usuários mais jovens (dado de rodada antiga da NN/g, data não confirmada no snippet); a NN/g fez nova rodada em 2018–19 com 18 idosos — [NN/g, Usability for Seniors](https://www.nngroup.com/articles/usability-seniors-improvements/) (snippet)
- WAI (W3C) mantém página específica sobre necessidades de usuários idosos (visão, motricidade, cognição) mapeadas para a WCAG — [W3C WAI, Older Users and Web Accessibility](https://www.w3.org/WAI/older-users/) (página não pôde ser aberta; só referência)
- Corpo padrão do iOS ("Body" no Dynamic Type, tamanho Large) = 17 pt — [Apple HIG, Typography](https://developer.apple.com/design/human-interface-guidelines/typography) (valor de conhecimento consolidado; a busca não retornou a tabela)
- Discriminação de cor azul-amarelo também cai com a idade (amarelamento do cristalino) — **não encontrei fonte primária na busca**; ver Gaps.

### Inferences
- Público 40–60 deve ser tratado como "todos usam óculos de perto ou não estão com eles": na moto, de capacete, frequentemente sem óculos de leitura. Isso justifica corpo ≥ 17 px no app e números grandes (≥ 28–34 px) nas telas de estrada.
- O mínimo de 13 px do DESIGN.md é aceitável só para metadados (data, fonte do preço) e nunca para informação de decisão. Sugestão: 15 px como mínimo prático para texto que o irmão precisa ler para agir.
- Como a acuidade de alto contraste não prediz bem o desempenho e a sensibilidade ao contraste sim, o design deve maximizar contraste (≥ 7:1 para texto principal, nível AAA), não apenas tamanho.
- À noite, a combinação pupila menor + ofuscamento sugere evitar áreas grandes muito claras (mapas brancos, banners brilhantes) e evitar trocas bruscas de luminância entre telas.

### Gaps
- Fonte primária quantificando a perda de discriminação azul-amarelo entre 40 e 60 anos não foi encontrada (busca não retornou). Implicação prática conhecida: não depender de azul vs. roxo/verde-azulado para distinguir categorias.
- Não foi possível abrir o artigo NN/g 2019 ("Usability for Older Adults: Challenges and Changes") para números atualizados.
- Não há estudo específico de motociclistas brasileiros 40–60 lendo celular.

## 2. Tema escuro vs. claro: polaridade, halação/astigmatismo, luz do sol, cores de superfície e texto

### Takeaway
Para visão normal, a pesquisa favorece polaridade positiva (texto escuro em fundo claro) em acuidade e revisão de texto, em todas as idades; idosos têm mais carga cognitiva com tema escuro em ambiente claro. O tema escuro do app é defensável para uso noturno e identidade, mas precisa de mitigação: fundo não totalmente preto, texto creme (não branco puro), peso de fonte maior, e um **modo claro/alto contraste automático para sol forte** (ou ao menos contraste muito alto e áreas grandes de cor sólida).

### Cited Findings
- Piepenbrock et al. (Düsseldorf): jovens (18–33) e idosos (60–85) com visão normal/corrigida; **independentemente da idade, a polaridade positiva foi melhor** em tarefas de acuidade visual e de revisão de texto — [resumo via NN/g "Dark Mode vs. Light Mode"](https://gi-radar.de/tl/DC-0313) (original: nngroup.com/articles/dark-mode, não acessível nesta sessão)
- A diferença entre modo claro e escuro na tarefa de acuidade teria sido **menor** nos idosos do que nos jovens — fonte secundária de baixa confiabilidade (blog), citada pela busca; tratar com cautela.
- Sethi & Ziat (2023), resumido em artigo arXiv de 2024: **idosos têm maior carga cognitiva com polaridade negativa (tema escuro) em ambientes claros**; jovens têm maior carga com tema escuro em ambientes escuros; a preferência dos idosos por polaridade positiva visava reduzir fadiga mental — [arXiv 2409.10841](https://arxiv.org/html/2409.10841v1)
- While & Sarvghad (IEEE VIS 2024): estudo com 134 participantes (<60 e 60+) sobre gráficos em ambas as polaridades — [arXiv 2409.10841](https://arxiv.org/pdf/2409.10841) (resultados não lidos na íntegra)
- Revisão da NN/g: evidência aponta vantagem da polaridade positiva para usuários de visão normal; tema escuro pode ajudar alguns usuários com baixa visão, sobretudo com **catarata** — [resumo via NN/g](https://gi-radar.de/tl/DC-0313)
- Halação: texto branco em fundo preto causa "embaçamento" para pessoas com astigmatismo; recomendação de evitar texto branco em fundo preto puro — [Level Access, Accessibility for People with Astigmatism](https://www.levelaccess.com/blog/accessibility-for-people-with-astigmatism/); evidência majoritariamente de artigos e relatos, não de ensaios controlados — [lens.com](https://www.lens.com/questions-answered/does-using-dark-mode-prevent-digital-eye-strain/)
- Prevalência de astigmatismo: estimativas variam de ~30% a 30–60% da população conforme a fonte — [Level Access](https://www.levelaccess.com/blog/accessibility-for-people-with-astigmatism/); [All About Vision](https://www.allaboutvision.com/digital-eye-strain/is-dark-mode-better-for-eyes/)
- Material Design (M2) recomenda **#121212** como superfície do tema escuro (não preto puro); elevação expressa clareando a superfície com sobreposição branca semitransparente (1dp 5% → #1E1E1E; 2dp 7% → #222222; 4dp 9% → #272727, valores em cópia secundária); cores de marca sobre superfície escura como sobreposição de 8%; texto/acentos com tom 200 (dessaturado) do primário, passando 4,5:1 em todas as elevações — [Material Design 2, Dark theme](https://m2.material.io/design/color/dark-theme); [Google Design, Material dark theme](https://design.google/library/material-design-dark-theme)
- Google descreve o tema escuro do Material com cinzas "esfumaçados" para reduzir fadiga visual e o "pixel bleed", dessaturando cores — [Google Design](https://design.google/library/material-design-dark-theme)
- Luz do sol: o problema principal é reflexo da superfície da tela; métricas de contraste de fabricantes são medidas no escuro; DisplayMate propôs um "Contrast Rating for High Ambient Light" — [DisplayMate (antigo, ~2010–11)](https://displaymate.com/Smartphone_Brightness_ShootOut_1.htm); [GSMArena sunlight legibility test](https://www.gsmarena.com/gsmarena_labs_announces_sunlit_legibility_display_test-news-4105.php)
- Celulares recentes atingem 1.000–1.750 nits de pico sob sol — [SamMobile (2026)](https://www.sammobile.com/news/how-do-i-make-my-phone-screen-brighter-in-direct-sunlight/); películas foscas reduzem reflexos — mesma fonte. Alegações de que o tema escuro "melhora o contraste sob sol" não trazem medições — não confiáveis.

### Contraste calculado dos tokens do projeto (fórmula WCAG; cálculo local)
| Primeiro plano | sobre `noite` #0C0A08 | sobre `sarja` #17130F | sobre #201A15 |
| --- | --- | --- | --- |
| creme #EFE3C8 | 15,5:1 | 14,5:1 | 13,5:1 |
| caramelo #C9A46A | 8,5:1 | 7,9:1 | 7,4:1 |
| laranja #D9622B | 5,4:1 | 5,0:1 | 4,7:1 |
| alerta #F5C518 | 12,1:1 | 11,3:1 | 10,6:1 |
| dourado #D8A93B | 9,1:1 | 8,5:1 | 7,9:1 |
| azul Lojas #7FA6C2 | 7,7:1 | 7,2:1 | 6,7:1 |
| oliva #6B7A3A | 4,2:1 | 3,9:1 | 3,7:1 |
| verde-posto #2E7D5B | 4,0:1 | 3,7:1 | 3,4:1 |
| ferrugem #A3401A | 3,1:1 | 2,9:1 | 2,7:1 |
| vermelho #B3261E | 3,0:1 | 2,8:1 | 2,6:1 |
| jeans #3E5C7A | 2,8:1 | 2,7:1 | 2,5:1 |
| linha-escura #3A3028 | 1,5:1 | 1,4:1 | 1,3:1 |

Pares de botão: texto creme sobre laranja = **2,9:1 (reprova)**; texto `noite` sobre laranja = 5,4:1 (passa); creme sobre vermelho = 5,1:1 (passa); `noite` sobre alerta = 12,1:1.

### Inferences
- Os tokens de texto (creme, caramelo) estão excelentes (AAA). O fundo `noite` #0C0A08 é quase preto (mais escuro que o #121212 do Material); com creme a 15,5:1 o risco de halação para astigmáticos é real. Sugestão: subir o fundo para algo como #141110–#17130F e/ou reduzir o creme levemente em textos longos; manter peso 500–600 em vez de 400 para texto claro em fundo escuro (traço fino "some" no escuro e sob sol).
- Botão principal laranja deve usar **texto escuro (`noite`)**, ou escurecer o laranja até o creme passar 4,5:1 — hoje creme sobre laranja reprova.
- `jeans` (irmão "na estrada"), `vermelho`, `ferrugem` e `linha-escura` ficam abaixo de 3:1 contra o fundo: não servem sozinhos como anel de status, borda de botão secundário ou ícone (reprovam WCAG 1.4.11). Precisam de versão mais clara para uso sobre fundo escuro (ex.: jeans clareado ~#6F95B8) ou contorno creme.
- Para o sol forte: pesquisa sugere que idosos sofrem mais com tema escuro em ambiente claro. Recomenda-se oferecer "Alto contraste / Sol" (tema claro ou escuro com contraste máximo e sem texturas) com troca automática por sensor de luz ou horário (pôr do sol), e manual sempre visível. O mapa noturno escuro é o caso mais bem justificado para o tema escuro (preserva adaptação ao escuro e reduz ofuscamento).

### Gaps
- Não encontrei estudo controlado e recente medindo legibilidade de tema escuro vs. claro **sob sol direto** em OLED/LCD modernos.
- Não confirmei na fonte primária os detalhes do estudo Piepenbrock nem os resultados do While & Sarvghad.
- Material Design 3 usa elevação tonal; não verifiquei os valores atuais de M3 (apenas M2).
- Não há dado sobre a API de sensor de luz ambiente no React Native/Expo (fora do escopo desta pesquisa).

## 3. WCAG 2.2, HIG, Material, Fitts/Hick, chunking, carga cognitiva, comprimento de linha

### Takeaway
Mínimos normativos: texto 4,5:1 (AA) / 7:1 (AAA), texto grande e elementos gráficos 3:1, alvo 24×24 CSS px (AA) / 44×44 (AAA); plataformas pedem 44 pt (iOS) e 48 dp (Android). Para 40–60 anos ao ar livre e com luva, os 48 px do projeto são piso, não alvo; botões de estrada de 66–100 px estão alinhados à evidência de que idosos precisam de alvos maiores e de mais espaçamento.

### Cited Findings
- WCAG 2.2 SC 2.5.8 Target Size (Minimum), AA: alvos de pelo menos 24×24 CSS px, com exceções (espaçamento: círculo de 24 px centrado no alvo sem sobrepor outros; equivalente; inline; controle do agente do usuário; essencial) — [W3C, What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/); [DAISY KB, Target Size Minimum](https://kb.daisy.org/publishing/docs/wcag/target-size-minimum.html)
- SC 2.5.5 Target Size (Enhanced), AAA: 44×44 CSS px sem exceção de espaçamento — [TetraLogical, What's new in WCAG 2.2](https://tetralogical.com/blog/2023/10/05/whats-new-wcag-2.2); [Smashing Magazine](https://shop.smashingmagazine.com/2024/07/getting-bottom-minimum-wcag-conformant-interactive-element-size/)
- SC 1.4.11 Non-text Contrast (AA): 3:1 para limites de componentes de interface e objetos gráficos necessários ao entendimento; indicadores de foco também 3:1 — [Deque, WCAG 2.2](https://dequeuniversity.com/resources/wcag-2.2); [W3C Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- SC 1.4.3 Contrast (Minimum) AA: 4,5:1 texto normal, 3:1 texto grande (≥ 18 pt ou ≥ 14 pt negrito); SC 1.4.6 Contrast (Enhanced) AAA: 7:1 e 4,5:1 — [W3C Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) (valores normativos consolidados)
- SC 1.4.4 Resize Text: texto ampliável até 200% sem perda de conteúdo/função — [W3C Understanding 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)
- Apple HIG: alvo mínimo 44×44 pt; Material: 48×48 dp (≈ 9 mm) — [Apple HIG, Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility); [Material 3, Accessibility – touch targets](https://m3.material.io/foundations/designing/structure) (valores consolidados, páginas não abertas)
- Tela sensível ao toque grande (65"): tamanho ótimo de botão 30 mm para jovens e **40 mm para idosos** (de 10 a 50 mm testados) — não transferível diretamente a celular — [Zhang et al., via busca](https://scholar.hit.edu.cn/en/publications/exploring-usability-disparities-in-multi-touch-screen-interaction/)
- Estudo de botões em touchscreen com idosos cardíacos: base 0,75" × 0,75" (≈ 19 mm), mínimo 0,5" × 0,5" (≈ 12,7 mm) — [LaVictoire & Everhart 2009, via Springer](https://rd.springer.com/content/pdf/10.1007/978-3-642-02707-9_29.pdf)
- Leitão & Silva (Maynooth): estudaram tamanho e espaçamento de alvos para tocar e deslizar em smartphones com idosos, medindo precisão, tempo e preferência, gerando padrões de design — [MURAL Maynooth 6045](https://mural.maynoothuniversity.ie/6045) (PDF bloqueado; números não extraídos)
- Franz, Findlater & Wobbrock (ASSETS 2019): idosos (60+) foram **melhores** que jovens em escolher o próprio tamanho ótimo de alvo; jovens subestimaram o menor alvo que acertavam — [ASSETS'19 PDF](https://faculty.washington.edu/wobbrock/pubs/assets-19.06.pdf)

### Inferences
- 48 px ≈ 7,6–9 mm conforme o aparelho; com luva de moto e vibração, a literatura (19 mm base em LaVictoire; 40 mm em telas grandes) sugere que botões do modo pilotando (~100 px ≈ 16–19 mm) e do carro (66 px) estão na faixa certa. No app parado, 48 px é piso; para ações frequentes (Vou/Talvez, acenar, aceitar), mirar 56 px de altura e ≥ 8–12 px entre alvos.
- Lei de Fitts (tempo ∝ log2(distância/tamanho+1)): colocar ações frequentes na metade inferior (alcance do polegar) e com largura total reduz erro; Lei de Hick (tempo ∝ log2(n+1)): menos opções por tela. Isso apoia "poucos itens por tela" do CLAUDE.md — mas não encontrei fonte primária com números para idosos nesta sessão.
- Como idosos estimam bem o próprio alvo, oferecer um ajuste "Botões maiores" nas preferências é uma solução barata e coerente com a evidência.

### Gaps
- Números exatos de Leitão & Silva (tamanho/espaçamento em mm para smartphone) não foram extraídos (PDF bloqueado pela rede).
- Não encontrei fonte primária, dentro do limite de buscas, para: limite de ~5–7 opções (Miller 1956 é sobre memória de curto prazo e frequentemente mal aplicado; Cowan 2001 propõe ~4 blocos), Lei de Hick com idosos, e comprimento de linha ideal em celular (tipicamente citado 45–75 caracteres para leitura contínua; em celular ~30–40 caracteres por linha é natural com 17 px).
- Nenhum estudo de alvo de toque com luvas de moto foi encontrado.

## 4. Fontes condensadas (Barlow Condensed) vs. humanistas (Inter), números, maiúsculas

### Takeaway
Pesquisas de leitura "num relance" (MIT AgeLab) mostram que fontes humanistas/abertas são mais legíveis que as geométricas/quadradas, que **largura condensada e tamanho pequeno pioram o desempenho**, e que o efeito é maior em pessoas mais velhas e em homens. Barlow Condensed deve ficar restrita a títulos curtos e números grandes; Inter (ou similar aberta) para todo texto, rótulos e números pequenos.

### Cited Findings
- Dobres et al.: fonte humanista vs. "square grotesque" (tarefa de decisão lexical, método de escada adaptativa); a fonte **interagiu significativamente com a idade**, sobretudo nas condições de limiar de legibilidade mais alto — [Dobres et al., PMC5213401](https://pmc.ncbi.nlm.nih.gov/articles/PMC5213401); [PubMed 26727912](https://www.pubmed.gov/26727912/)
- Frutiger (humanista) vs. Eurostile (quadrada) a 3 mm e 4 mm: humanista mais legível; diferença maior no tamanho menor (a quadrada perde detalhes ao reduzir) — [estudo AgeLab, via busca](https://core.ac.uk/download/78061816.pdf)
- Simulador de direção (MIT AgeLab): menus em humanista reduziram o **tempo total de olhar em 10,6%** vs. quadrada, só entre motoristas homens; efeito modesto ou ausente em mulheres — [MIT News 2012](https://news.mit.edu/2012/agelab-automobile-dashboard-fonts-1005.html); [MIT AgeLab, Glance-Based Legibility](https://agelab.mit.edu/transportation-and-livable-communities/projects/glance-based-legibility)
- Sawyer et al. 2017 (HFES): **texto em minúsculas e largura condensada também reduziram o desempenho, especialmente em tamanho menor** — [Sawyer et al., HFES 2017](https://flatisbad.com/resources/Sawyer-HFES17.pdf)
- Sawyer et al. 2020 (Ergonomics): oito fontes sem serifa populares diferem em legibilidade "num relance" — [Ergonomics 2020](https://informahealthcare.com/doi/full/10.1080/00140139.2020.1714748); [Readability Matters](https://readabilitymatters.org/articles/the-great-typography-bake-off)
- Reimer (AgeLab): o ideal para papel ou e-reader pode não ser o ideal para ambiente de olhar rápido no carro — [MIT News](https://news.mit.edu/2012/agelab-automobile-dashboard-fonts-1005.html)

### Inferences
- Público é 100% masculino e 40–60: exatamente o grupo em que o efeito de fonte no tempo de olhar apareceu. Em modo pilotando, Android Auto e CarPlay, preferir Inter (aberta, x-height alta) a Barlow Condensed para qualquer texto que não seja um número enorme.
- Barlow Condensed: usar em ≥ 24 px para títulos de 1–4 palavras e ≥ 32 px para números (km, preço, velocidade), peso 600–700; nunca em parágrafo, rótulo pequeno ou botão < 20 px.
- Rótulos em MAIÚSCULAS: usar só em textos curtos (≤ 2–3 palavras), ≥ 13–14 px, com espaçamento entre letras positivo (~+0,04 a +0,08 em) — prática tipográfica comum; não achei estudo quantitativo nesta sessão.
- Números: Inter tem algarismos tabulares (recurso `tnum`), úteis para distância/preço que mudam ao vivo sem "pular".

### Gaps
- Nenhum estudo testou Barlow Condensed ou Inter especificamente.
- Não encontrei pesquisa quantitativa sobre espaçamento de letras em rótulos em caixa alta nem tamanho mínimo para caixa alta pequena.
- Não encontrei estudo sobre legibilidade de algarismos condensados (confusão 3/8, 1/7) em celulares.

## 5. Ícones: com rótulo vs. só ícone

### Takeaway
Ícone com rótulo visível sempre vence ícone sozinho, sobretudo em navegação. Para o público 40–60, todo ícone de navegação e de ação principal deve ter texto; ícone sozinho só para gestos universais (fechar, voltar, buscar) e ainda assim com rótulo de acessibilidade.

### Cited Findings
- NN/g: rótulos de ícones devem estar **visíveis o tempo todo**, sem interação; rótulos são mais importantes em ícones de navegação — [NN/g, Icon Usability](https://www.nngroup.com/articles/icon-usability/) (lido por snippet)
- Caso Microsoft Outlook relatado pela NN/g: trocar desenho e posição de ícones quase não ajudou numa barra só de ícones; **adicionar texto ajudou** — [CXL, Icon usability testing](https://cxl.com/blog/icon-usability-testing/)
- Usuários previram a função do ícone em **88% das vezes com rótulo vs. 60% sem rótulo** — [UserTesting, User-friendly UI icons](https://www.usertesting.com/blog/user-friendly-ui-icons/) (fonte de mercado, não revisada por pares)
- Afirmação de que só 3 ícones (casa, imprimir, busca) são universalmente reconhecidos, atribuída à NN/g — fonte secundária, não confirmada na original.
- Ícone de hambúrguer hoje é amplamente reconhecido, mas o estudo da NN/g mediu só reconhecimento, não sucesso em tarefas — [NN/g, Hamburger menu icon recognizability](https://www.nngroup.com/articles/hamburger-menu-icon-recognizability/)

### Inferences
- Barra inferior (Mapa, Feed, Passeios, Conquistas, Perfil) já tem rótulos — manter sempre visíveis (não só no item ativo).
- Ícones de traço: usar 24–28 px no app com traço ~2 px (2,25–2,5 px em 28 px) para sobreviver ao sol e a telas foscas; no modo pilotando, ícones ≥ 40 px com rótulo curto em Inter 600.
- Pinos do mapa: forma + ícone + cor (redundância), nunca só cor.

### Gaps
- Não achei estudo específico de reconhecimento de ícones por idade 40–60 nem de espessura de traço ideal.

## 6. Daltonismo (público masculino) e codificação redundante

### Takeaway
Cerca de 1 em cada 12 homens (≈ 8%) tem deficiência de cor vermelho-verde (maioria deuteranomalia, ≈ 5%). Num clube de 300–1.000 homens, espera-se **~25 a 80 irmãos** com dificuldade em distinguir vermelho/verde/laranja/marrom. Toda cor de status ou categoria precisa de segunda pista (forma, ícone, texto, padrão).

### Cited Findings
- ~8% dos homens (1 em 12) e ~0,5% das mulheres (1 em 200) têm alguma deficiência de visão de cor — [Colour Blind Awareness](https://www.colourblindawareness.org/?p=409); [Henry Ford Health](https://www.henryford.com/blog/2024/10/why-men-are-more-likely-to-be-colorblind)
- Distribuição típica nos homens: ~1% deuteranopia, ~1% protanopia, ~1% protanomalia, ~5% deuteranomalia — [Color-Blindness.com, Deuteranopia](https://www.color-blindness.com/?p=2878)
- Prevalência maior em populações de ascendência europeia; não encontrei dado específico do Brasil — [News-Medical, Color Blindness Prevalence](https://www.news-medical.net/health/Color-Blindness-Prevalence.aspx)
- WCAG SC 1.4.1 Use of Color (A): cor não pode ser o único meio de transmitir informação — [W3C Understanding 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) (normativo, consolidado)

### Inferences (aplicadas ao DESIGN.md)
- Pares de risco nos tokens: `verde-posto` #2E7D5B vs. `laranja`/`ferrugem`/`vermelho` (vermelho-verde clássico); `oliva` vs. `dourado`/`caramelo`; `vermelho` SOS vs. `laranja` ação; terra (ocre/marrom) vs. vegetação verde-escura no mapa. Para deuteranômalos, laranja, vermelho, verde e oliva podem parecer variações de marrom-amarelado.
- O DESIGN.md já prevê terra com **tracejado** além da cor — bom exemplo de redundância; estender a lógica: pinos com **forma distinta por tipo** (escudo, gota, losango, círculo) + pictograma; anéis de status do avatar com **padrão/ícone** (ex.: contínuo = na estrada, tracejado = parado/café, ícone de xícara, ícone "não perturbe") além da cor.
- SOS: não depender só do vermelho; usar ícone + texto "SOS" + forma/animação própria.
- Testar todas as telas com simulador de deuteranopia/protanopia (ex.: filtros de daltonismo do Android em Opções do desenvolvedor) a cada ponto de teste.

### Gaps
- Não obtive fonte primária sobre paleta Okabe-Ito nem estudos de mapas com daltônicos nesta sessão.
- Sem dado brasileiro de prevalência.

## 7. Escala de fonte do sistema (Dynamic Type / Android até 200%)

### Takeaway
Android 14+ permite fonte até 200% com escala **não linear** (texto pequeno cresce mais, texto grande cresce menos); iOS com tamanhos de acessibilidade pode passar de 300% no corpo. O layout precisa reflowar (quebrar linha, empilhar) em vez de cortar, e telas de estrada precisam de teto de escala.

### Cited Findings
- Android 14 suporta escala de fonte até 200%, alinhada à WCAG — [Android 14 summary](https://developer.android.com/about/versions/14/summary)
- Escala não linear: texto maior cresce menos; 4sp + 20sp pode não somar 24sp — [Flutter, Android 14 nonlinear font scaling](https://docs.flutter.dev/release/breaking-changes/android-14-nonlinear-text-scaling-migration); [CommonsWare, Text Will Not Always Scale](https://commonsware.com/blog/2023/07/08/text-will-not-always-scale.html)
- Medições de um sistema de design: no ajuste 2,0×, 8sp passa de 200% e 57sp chega só a ~112%; no iOS, o corpo chega a ~310% no tamanho AX5; Dynamic Type não chega ao WKWebView e a escala não linear do Android vale só para views nativas — [ALPA, Text scaling behaviour](https://alpamobile-docs.alpa.org/component-specifications/text-scaling/text-scaling-behaviour.html) (fonte de terceiros)

### Inferences
- React Native: manter `allowFontScaling` ligado no app; usar `maxFontSizeMultiplier` (~1,3–1,5) somente em barras de navegação, chips e botões do modo pilotando/carro, que já são grandes. Teste visual a 100%, 130%, 200% (Android) e AX3/AX5 (iOS).
- Layout: não fixar altura de cartões/botões; permitir quebra em 2 linhas; em escalas altas, trocar linhas horizontais por pilhas verticais; barra inferior pode esconder rótulo só se o rótulo estiver disponível por long-press/acessibilidade (preferível reduzir rótulo a não ter).
- O público 40–60 provavelmente terá parcela significativa com fonte do sistema aumentada (evidência direta não encontrada); testar no ponto de teste com irmãos reais.

### Gaps
- Tabela oficial de Dynamic Type da Apple não foi retornada pela busca (corpo 17 pt é valor consolidado).
- Sem dado sobre % de usuários 40–60 que aumentam a fonte do sistema no Brasil.

## 8. Gestos, navegação inferior vs. hambúrguer, bottom sheets

### Takeaway
Tocar e deslizar são os gestos mais descobríveis e fáceis para idosos; gestos ocultos (pinça, long-press, deslizar lateral para ações) têm baixa descoberta. Navegação escondida (hambúrguer) reduz a descoberta em ~20% e deixa o uso 15% mais lento no celular — a barra inferior visível com 5 itens rotulados é a escolha certa.

### Cited Findings
- Descoberta de gestos em smartphones pode ser um problema para idosos; **tocar e deslizar foram os gestos mais descobríveis e fáceis** — [Leitão & Silva, novatos idosos e gestos](https://shura.shu.ac.uk/7445); [PDF Maynooth](https://mural.maynoothuniversity.ie/id/eprint/6032/1/PS-Study-Novice.pdf)
- O desempenho de idosos ao tocar varia conforme a região da tela ("zonas de atividade") — [da Silva, Investigating Activity Zones on Smartphones](https://mural.maynoothuniversity.ie/11919/1/daSilva_Investigating_EPCGI_2017.pdf); [IGI Global](https://new.igi-global.com/article/tap-and-swipe-activity-zones-on-smartphones-for-novice-older-adults/218885)
- Estudo NN/g (dez/2015; 179 participantes; 6 sites; celular e desktop): navegação escondida teve **queda de ~20% na descoberta**; usuários 39% mais lentos no desktop e **15% mais lentos no celular**; no celular a navegação escondida foi usada em 57% dos casos vs. 86% na combinada — [NN/g, Hamburger menus and hidden navigation](https://www.nngroup.com/articles/hamburger-menus/); [NN/g, Find navigation on mobile even with hamburger](https://www.nngroup.com/articles/find-navigation-mobile-even-hamburger/)
- Stößel & Blessing (2010): jovens e idosos geram gestos espontâneos diferentes para tarefas móveis — [Design Society](https://www.designsociety.org/download-publication/29391/TAP,+SWIPE+&+PINCH:+DESIGNING+SUITABLE+MULTI%E2%80%91TOUCH+GESTURES+FOR+OLDER+USERS)

### Inferences
- Toda ação feita por gesto (deslizar story, long-press para reagir, arrastar folha do mapa) precisa de equivalente em botão visível. Ex.: reação "TFA" por toque simples; denunciar/bloquear num menu "⋯" rotulado ("Mais").
- Bottom sheets no mapa: usar 2–3 alturas fixas com puxador visível grande e botão "Fechar" rotulado; não depender de arrastar para baixo para fechar.
- Pinça para zoom no mapa deve ter botões +/− (também úteis com luva).
- Ações principais na metade inferior da tela (alcance do polegar e zonas de melhor precisão).

### Gaps
- Não encontrei estudo comparando bottom navigation e hambúrguer especificamente com idosos, nem estudos de usabilidade de bottom sheets com idosos.
- Long-press com idosos não apareceu nos trechos obtidos.
- Bloqueio de rede impediu ler os números de Leitão & Silva.
