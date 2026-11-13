# Sistema de design — Bodes do Asfalto (identidade "Patch de Colete")

> **Atualização de 12/11/2026 (tarde) — Pesquisa de usabilidade (prevalece sobre tudo abaixo).**
> Base: `reports/Usabilidade e interface Bodes do Asfalto.md` (59 recomendações R1–R59, com fontes).
> Fonte única dos valores: `app/src/theme/tokens.ts` (paletas `paletaNoite` e `paletaSol`, mesmas chaves).
> - **Noite (padrão):** fundo `#141110` (não preto puro, evita halação), superfícies `#1C1714`/`#241E19`/`#2C251E`, texto `#EFE3C8` (14,8:1), secundário `#C2B39B`, ação `#E8692A` **com texto escuro**, SOS `#C62D22` com anel claro, "na estrada" `#6F95B8`.
> - **Sol (alto contraste para luz do dia):** fundo `#F6F1E7`, cartões brancos, texto `#1A1410`, ação `#A8441A` com texto branco, SOS `#9E1B14`, postos `#1E6B4A`, Lojas `#2F5E86`, terra `#8A5A1E`.
> - Troca **automática** (Sol das 6h às 18h) e manual em Perfil → Aparência. Mapa e navegação do Google acompanham.
> - Texto: corpo 17 (Inter 500), mínimo 15 para ação, 13 só para metadados. Barlow Condensed só em títulos ≥ 24 e números ≥ 32; rótulos em Inter. Fonte do sistema sempre amplia; limite 1,3× só na barra, chips e modo pilotando.
> - Nada só por cor: pinos com forma própria (escudo, círculo, quadrado, losango); anéis de status com traço (contínuo/tracejado/pontilhado) e selo; aba ativa com traço em cima.
> - Superfícies opacas sobre o mapa (nada translúcido). Ícones com rótulo visível; zoom +/− no mapa.
> - **Modo pilotando:** 2 colunas × 3 linhas em pé (3 × 2 deitado), botões de ~150 × 120 dp com 24 dp de espaço; SOS **segurando 3 s** e Encerrar segurando 1,5 s, com faixa de progresso e vibração; demais ações com um toque e resposta em faixa (sem janela).
> - **Trava em movimento:** acima de 8 km/h feed, passeios, conquistas e perfil ficam cobertos; libera após 5 s abaixo de 3 km/h.
> - **Mapa:** gerado por `tools/gerar_estilo_mapa.py` (noite e sol). Terra = leito + tracejado ocre a 60 % `[2, 1.5]`, abaixo do asfalto; trilha com tracejado próprio; vias locais ≥ 3:1; rota 1,6× a rodovia com contorno de 2 px e pesponto `[1, 2]` na terra.
> - **Carro (Android Auto):** máximo 4 botões → SOS · Alerta · Postos · Encerrar; comboio vira texto e alertas.

> **Atualização de 12/11/2026 — Interface v2 (prevalece sobre as seções 1 e 2 abaixo).**
> O dono reprovou o primeiro visual (desproporcional, infantil, sem ícones). Vale agora a Interface v2:
> pranchas em `docs/telas/v2/` (Mapa, Planejar rota, Pilotando, Carro, Sistema) e tokens em `app/src/theme/tokens.ts`.
> - Cores com função única: fundo `#0B0907`, superfícies `#16120E`/`#201A15`, texto `#F3EADB`/`#B8A890`, ação `#E8692A`, SOS `#C62D22`, alerta `#F5C518`, ouro `#D8A93B` (sedes/conquistas), verde `#3FA27A` (postos), azul `#7FA6C2` (Lojas).
> - Mapa: asfalto creme contínuo; **terra em tracejado ocre `#C68A45` sobre marrom `#5A3E1F`**; rota laranja; rota na terra com pesponto claro.
> - O bordado fica só em emblemas, selos, níveis e mascote; botões, cartões e barras são limpos (grade de 8, raios 12–22, sombras `boxShadow`).
> - Ícones: traço 1,8 em grade 24 (`app/src/ui/icones.tsx`), nunca emoji.
> - Skia saiu do app (não é mais necessário para o visual v2).


Referência obrigatória para toda a interface. Telas de referência: `docs/telas/` (principal: `IconesPatch.dc.html`). Regra de ouro: **a IA de imagem gera matéria-prima (texturas, ilustrações, emblemas); a interface é desenhada em código** (cartões, botões, curvas, sombras, mapa).

## 1. Tokens

### Cores (fios)
| Token | Hex | Uso |
| --- | --- | --- |
| `sarja` | #17130F | Fundo de cartões e barras (com textura) |
| `noite` | #0C0A08 | Fundo da tela |
| `linha-escura` | #3A3028 | Divisórias, bordas discretas |
| `laranja` | #D9622B | Ação principal, borda overlock, destaque |
| `laranja-escuro` | #5E230B | Contorno externo do overlock, pressionado |
| `ferrugem` | #A3401A | Secundário quente |
| `creme` | #EFE3C8 | Texto principal, pictogramas |
| `caramelo` | #C9A46A | Texto secundário, detalhes |
| `dourado` | #D8A93B | Conquistas, eventos, Ágape |
| `jeans` | #3E5C7A | Informação, irmão "na estrada" |
| `oliva` | #6B7A3A | Natureza, sucesso |
| `vermelho` | #B3261E | Só SOS e erro |
| `alerta` | #F5C518 | Só alertas de estrada |
| `verde-posto` | #2E7D5B | Só postos |

Contraste mínimo 4,5:1 para texto (creme e caramelo sobre sarja passam).

### Tipografia
- Títulos e números: **Barlow Condensed** 600/700/800, caixa alta nos rótulos de patch, espaçamento +2% a +12%.
- Texto: **Inter** 400/600/700. Corpo 17 px; mínimo 13 px; respeitar o tamanho de fonte do sistema.

### Forma
- Raios: 8 (chips pequenos), 14 (botões, campos), 18 (cartões), 22 (folhas inferiores, barras), 999 (pílulas).
- Espaçamento: escala de 4 (4, 8, 12, 16, 20, 24, 32, 40).
- Toques: mínimo 48 px; modo pilotando ~100 px; carro 66 px.

### Profundidade (3 níveis, desenhados com Skia — nada de sombra genérica)
| Nível | Uso | Receita |
| --- | --- | --- |
| 1 · costurado | Cartões no feed | Sombra externa curta (0, 2, 4 px, preto 40%) + **sombra interna** suave nas bordas (efeito tecido acolchoado) |
| 2 · patch | Pinos, cartões de destaque, folhas | Sombra externa (0, 6, 14 px, preto 50%) + borda overlock |
| 3 · flutuante | Botão de ação, SOS, modais | Sombra externa (0, 12, 28 px, preto 55%) + brilho de fio no topo (linha clara 1 px, 10%) |

### Movimento
- Duração 160–240 ms, curva "ease-out"; nada de animação no modo pilotando além do essencial.
- Animações especiais em **Lottie ou Rive** (≤ 100 KB cada): selo "sendo bordado" ao desbloquear, aceno no mapa, carregamento com o Bodinho, confete de nível.

## 2. Componentes (implementar em `app/src/ui/` e numa tela interna "Catálogo de componentes")
- **Cartão bordado:** fundo `sarja` + textura de sarja repetida (opacidade 60%) + borda overlock opcional (imagem 9-slice) + profundidade 1.
- **Botão principal:** laranja, raio 14, texto Inter 700 cor `noite`; pressionado = `laranja-escuro` com leve afundamento (sombra interna).
- **Botão secundário:** contorno `linha-escura` 1,5 px, texto creme.
- **Chip/filtro:** pílula; ativo laranja; inativo sarja com contorno.
- **Pino do mapa:** emblema bordado (arquivo gerado) em 48–64 px; abaixo de 40 px, versão simplificada (escudo de cor sólida + pictograma vetorial).
- **Avatar:** círculo com anel de status (laranja aberto a encontro, jeans na estrada, cinza não perturbe) e moldura de pesponto tracejado.
- **Patch de nível e selos:** arquivos gerados; animação de desbloqueio em Lottie.
- **Barra de navegação:** sarja com textura, ícones duotom vetoriais (creme + laranja), indicador ativo em forma de pesponto.
- **Folha inferior (bottom sheet):** raio 22, alça bordada, profundidade 2.
- **Divisória:** linha de pesponto tracejado (`caramelo` 40%).

## 3. Mapa (estilo próprio)
Aprovado pelo dono em 13/11/2026 (`docs/MAPA_VISUAL_PROPOSTA.md`, opção A). Os dois estilos (noite e sol) são **gerados** por `python3 tools/gerar_estilo_mapa.py` em `app/src/map/estilo-bodes.json` e `estilo-bodes-sol.json`; nunca edite os JSON à mão. Dados OpenFreeMap (esquema OpenMapTiles), letras Noto Sans (Regular e Bold) do próprio OpenFreeMap; Barlow/Inter no mapa ficam para depois (exigem hospedar fontes).
- **Cores (noite / sol):** chão `#1A1612` / `#F2EEE6`; cidade `#2A231D` / `#E9E3D6`; mato `#213022` / `#CFE3BE`; parques `#25402A` / `#BFDDAA`; água `#1F3A4D` / `#A9CFE6`; rios `#3D6E8F` / `#5B8DB0`.
- **Estradas:** autoestrada e tronco âmbar `#F2B968` com contorno `#7A4A12` (sol `#FFD580` / `#B07A1E`); principais creme `#EFE3C8` (sol branco com contorno cinza); secundárias `#C9BBA2`; vias locais `#7A6A54` só a partir do zoom 13. Larguras das rodovias (zoom, px): (6, 1,4) (10, 3) (14, 8) (17, 18), contorno 1,35x; locais (13, 1) (16, 5). **Terra** continua tracejada ocre `#C68A45` sobre leito `#5A3E1F`: forma e cor, nunca só cor.
- **Escudos:** camadas `escudos-br` (BR, halo azul) e `escudos-estaduais` (MT etc., halo âmbar): número da rodovia (`ref`) em negrito, 15 a 19 px, sobre a linha, a cada 400 px, a partir do zoom 8. Sem sprite: o "escudo" é o halo grosso do texto. Escudo desenhado de verdade fica para quando houver sprite.
- **Nomes:** sem caixa alta; cidade 18 a 20 negrito (zoom 5+), cidade pequena 15 (zoom 8+), vila 13 (zoom 11+); halo 1,5 com blur 0,5; prioridade pelo campo `rank`.
- **Camadas extras (pesam, ficam por último):** `extra-relevo` (hillshade, AWS Terrain Tiles Terrarium, 25% noite / 35% sol, zoom 5 a 12) e `extra-predios` (prédios 3D, zoom 16+, opacidade 0,85). **Toda camada cujo id começa com `extra-` deve ser escondida no modo pilotando** (`setLayoutProperty(id, 'visibility', 'none')`; a lista também está em `metadata.camadasExtras` do estilo).
- **Dia e noite automático:** `app/src/map/temaMapa.ts` (nascer e pôr do sol calculados no aparelho, com histerese de 20 min).
- **Atribuição obrigatória:** OpenStreetMap, OpenMapTiles, OpenFreeMap e Terrain Tiles (Mapzen/AWS), já nas fontes do estilo.
- **Destaque de estradas com curvas** (opcional, v2): camada em laranja 40% para trechos sinuosos.
- Rota ativa: laranja com contorno escuro e setas; trecho percorrido em caramelo. Largura = 1,6x a rodovia.
- Pinos com agrupamento (cluster) em emblema com contador.

## 4. Limite de peso (obrigatório)
| Item | Limite |
| --- | --- |
| App instalado | ~60 MB |
| Ícones de interface | Sempre vetor (SVG → componentes) |
| Texturas | Blocos repetíveis 256 px, WebP, ≤ 50 KB cada, no máximo 5 |
| Borda overlock 9-slice | 1 arquivo, ≤ 40 KB |
| Pinos, níveis, selos (emblemas gerados) | WebP 256 px (2x e 3x), ≤ 40 KB cada; carregados sob demanda e guardados em cache (expo-image) |
| Ilustrações | WebP ≤ 150 KB, sob demanda |
| Animações | Lottie/Rive ≤ 100 KB |
| Vídeo | Nunca embutido no app |

Medir o tamanho do app a cada build de teste e registrar no PROGRESSO.md.

## 5. Ativos de imagem (lista completa)
Os prompts estão em `docs/PROMPTS_IMAGENS.md`. Destino: `app/assets/gerados/` (originais em `docs/assets-originais/`, fora do app).

| Grupo | Itens |
| --- | --- |
| Pinos (12) | irmao, sede, loja, posto, monumento, ponto-turistico, restaurante, oficina, agape, socorro-fraterno, sos, alerta |
| Níveis (4) | cabrito, bode, bode-velho, bode-lendario |
| Selos (6) | agape, socorro-fraterno, pantanal, visita-lojas, irmao-na-rota, sedes-mt |
| Avatares por categoria (9) | custom, touring, big-trail, naked, esportiva, street, trail, scooter, triciclo |
| Mascote (1) | bodinho |
| Texturas (4) | sarja, couro, jeans, lona (repetíveis) |
| Borda (1) | overlock-9slice |
| Ilustrações (6) | vazio-estrada, primeira-viagem, sem-sinal, boas-vindas, entrada-aprovada, nivel-novo |
| Tela de abertura (1) | splash |
| Referências de tela (não entram no app) | mapa, feed, pilotando |

Ícones da barra de navegação e de botões: **desenhar em vetor** a partir de `docs/telas/IconesPatch.dc.html` (não gerar como imagem).

## 6. Como os ativos são produzidos (dois caminhos)
**Caminho A — o dono gera no ChatGPT (sem custo extra, já incluso na assinatura):** ele cola o prompt mestre de `docs/PROMPTS_IMAGENS.md`, salva os PNGs em `docs/assets-originais/` com os nomes acima e avisa o agente. O agente recorta, remove fundo se preciso, converte para WebP nos tamanhos certos e confere o peso.

**Caminho B — o agente gera pela API (custo por imagem):** só se o dono tiver configurado a chave como segredo de rede do ambiente (ver COMO_COMECAR.md). Regras:
- Criar `tools/gerar-imagem.ts` que lê o prompt, chama a API configurada (OpenAI Images `gpt-image-2` ou Gemini Image) e salva em `docs/assets-originais/`.
- Qualidade "medium" para rascunhos, "high" só para a versão final aprovada pelo dono.
- **Limite de gasto: US$ 10 no total sem nova autorização.** Registrar cada geração (item, modelo, qualidade, custo estimado) em `docs/assets-originais/LOG.md`.
- Mostrar ao dono uma prancha de revisão (contact sheet) antes de converter tudo.
- Nunca enviar fotos de pessoas para a API, exceto no recurso de avatar com IA do próprio app, com consentimento.

## 7. Avatar com IA (recurso do app)
- Fluxo: foto do irmão + moto cadastrada (categoria e cor) + detalhes opcionais → 3 opções no estilo do app.
- Chamada feita por uma Edge Function do Supabase (a chave da API nunca fica no app).
- Foto apagada logo após a geração; consentimento específico (dado biométrico, LGPD); moderação de conteúdo antes de exibir; 1 grátis por conta, 2 por mês no Premium.
- Lista de marcas e modelos: Tabela FIPE (importar marcas/modelos/anos para uma tabela própria, atualização mensal), mapeando cada modelo para uma das 9 categorias; sem logotipos de fabricantes.
