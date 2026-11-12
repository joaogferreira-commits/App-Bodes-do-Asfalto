# Proposta: mapa mais bonito (grupo de trabalho de 12/11/2026)

Pedido do dono: "mapa mais bonito, agradável e parecido com os padrões dos mapas mais usados do mundo".
Participantes: Dora (design), Rui (estrada), Sofia (simplicidade), Mateus (mobile). Aguarda o OK do dono antes de virar código.

## Diagnóstico (consenso)
- O mapa está "técnico": escuro e chapado; chão, cidade e mato quase da mesma cor; todas as vias da mesma cor creme; nomes em CAIXA ALTA.
- A tela tem coisa demais por cima do mapa (cerca de 22 toques possíveis, legenda de 8 linhas, 7 filtros, 6 botões). Google e Apple têm 1 busca, poucos filtros, 2–3 botões e um cartão embaixo.
- Faltam o que dá "cara de app de estrada": escudos BR/MT, relevo suave, rodovias em destaque.

## Proposta (ordem de execução)
1. **Nova base do mapa** (Mateus): partir do estilo aberto "Liberty" do OpenFreeMap (grátis, já tem ícones, prédios e escudos) e recolorir com a nossa paleta. Corta camadas que não servem para estrada (desempenho).
2. **Cores com vida** (Dora): noite — chão #1A1612, cidade #2A231D, mato #213022, parques #25402A, água #1F3A4D; dia (tema Sol, estilo Google) — chão #F2EEE6, cidade #E9E3D6, mato #CFE3BE, água #A9CFE6.
3. **Rodovias em destaque** (Dora/Rui): rodovias âmbar #F2B968 com contorno marrom (como Google/Waze), principais creme, locais discretas e só de perto; vias mais grossas no zoom médio. Terra continua tracejada ocre (forma + cor, nunca só cor).
4. **Escudos BR-163 / MT-251** (Dora/Rui): número da rodovia em escudo, grande e legível (≥16 dp) desde o zoom médio.
5. **Nomes** (Dora): sem caixa alta, cidades maiores com letra maior, menos nomes ao mesmo tempo, contorno fino.
6. **Tela limpa** (Sofia):
   - busca "Para onde vamos?" + foto do perfil;
   - 4 filtros: Tudo · Irmãos · Postos · Mais (Natureza, Cultura, Apoio, Clube dentro do "Mais");
   - à direita, uma coluna só: Visibilidade, Minha posição, + e −;
   - SOS vermelho embaixo à esquerda;
   - cartão embaixo, arrastável (3 alturas, como o Apple Maps): recolhido mostra "Nesta área: 12 irmãos · 3 postos" e "Posto mais próximo";
   - legenda sai da tela (vai para a Ajuda e o toque no pino explica); Ágape só aparece quando está perto (até 10 km ou 2 h antes).
7. **Pinos** (Dora): de longe, pontos coloridos pequenos (como o Google); de perto (zoom 14+), o emblema. No máximo ~20 pinos ao mesmo tempo; o resto vira número agrupado. Preço do posto só de perto.
8. **Dia e noite automático** (Rui/Mateus): tema Sol de dia e Noite à noite, pelo nascer e pôr do sol do lugar, sem piscar.
9. **Relevo suave e prédios 3D** (Mateus): relevo grátis (AWS Terrain Tiles) e prédios só bem de perto; os dois desligados no modo pilotando. Por último, porque pesam.

## Regras de segurança (Rui) que valem para tudo
- Ordem do que mais aparece: rota laranja > alertas > rodovia com número > postos > resto.
- Pilotando: somem avatares, Lojas, negócios, monumentos, nomes de ruas locais e cartões; ficam rota, rodovias, postos, alertas, comboio e os 6 botões.
- Testar ao sol, no guidão e em celular simples antes de aprovar.

## Decisões do dono
- A) Aprovar a proposta inteira, na ordem acima (recomendado).
- B) Aprovar só as cores e as rodovias (itens 1 a 5) e rever a tela depois.
- Também: aceitar a letra Noto Sans no mapa por enquanto (Barlow/Inter exigem hospedar fontes, fica para depois)?
