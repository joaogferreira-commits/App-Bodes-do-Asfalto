# Sistema de design — Bodes do Asfalto (identidade "Patch de Colete")

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
- Criar um estilo **MapLibre** próprio como arquivo de estilo (JSON, especificação MapLibre, dados OpenFreeMap) em `app/src/map/estilo-bodes.json`, versionado no repositório.
- Base escura quente: terra `#1A1712`, água `#22323D` com rios `#3E5C7A`, vegetação `#1E2A1C`, relevo em sombreamento suave (hillshade) a 25%.
- Estradas: rodovias creme `#EFE3C8` 60%, demais caramelo 35%; rótulos em Inter, creme/caramelo com halo escuro.
- **Destaque de estradas com curvas** (opcional, v2): camada em laranja 40% para trechos sinuosos.
- Rota ativa: laranja com contorno escuro e setas; trecho percorrido em caramelo.
- Pinos com agrupamento (cluster) em emblema com contador.
- Versão clara não é necessária na v1.

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
