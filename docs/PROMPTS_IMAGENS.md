# Prompts de imagem — Bodes do Asfalto

Um único prompt mestre gera todos os ativos em 26 lotes. Use no ChatGPT (gerador de imagens) ou no Gemini. Cole uma vez; se a ferramenta parar a cada lote, responda "ok". Se um lote sair fora do estilo: "refaça o Lote N mantendo exatamente o guia de estilo".

Salve cada item em `docs/assets-originais/` com o nome indicado entre colchetes (ex.: `pino-irmao.png`).

O agente (Caminho B, ver `docs/DESIGN.md`) usa os mesmos textos, um item por chamada, prefixando sempre o GUIA DE ESTILO.

---

```
Você vai criar o conjunto completo de ativos visuais do aplicativo "Bodes do Asfalto", um motoclube brasileiro. São 26 lotes. Siga o GUIA DE ESTILO em todas as imagens, sem exceção, para que pareçam feitas pelo mesmo designer.

COMO TRABALHAR
- Gere o Lote 1 agora. Cada lote é UMA imagem; quando houver dois itens, coloque-os lado a lado, alinhados, do mesmo tamanho, com bastante espaço vazio entre eles.
- Depois de cada lote, siga direto para o próximo. Se só puder gerar uma imagem por resposta, termine escrevendo "Pronto para o Lote N". Quando eu responder qualquer coisa (por exemplo "ok"), gere o lote seguinte sem pedir confirmação e sem mudar o estilo.
- Formato padrão: quadrado 1024x1024, fundo transparente (PNG). Se não for possível, fundo liso #0C0A08. Lotes com formato próprio dizem qual é.
- Não mude cores, espessura de borda, iluminação nem ângulo entre os lotes.

GUIA DE ESTILO (vale para tudo, salvo regra própria do lote)
- Patch bordado de colete de motoclube, visto de frente, plano, sem perspectiva.
- Borda overlock grossa em fio laranja queimado #D9622B, com a costura aparente e um contorno externo mais escuro #5E230B.
- Uma linha de pesponto tracejado fino em creme claro, logo por dentro da borda.
- Fundo do patch em sarja escura #17130F, com a trama diagonal do tecido visível.
- Ilustrações bordadas em ponto cetim, com brilho suave de fio e direção de ponto visível. Nada de degradê digital.
- Paleta de linhas (use só estas): creme #EFE3C8, caramelo #C9A46A, laranja #D9622B, ferrugem #A3401A, dourado #D8A93B, jeans #3E5C7A, oliva #6B7A3A, vermelho #B3261E, pele #C68A5E, marrom #6B4A2B, prata #C8C8C8, preto #111111.
- Iluminação de estúdio suave e uniforme, vinda de cima. Sombra curta e discreta sob o patch.
- Acabamento de designer profissional: formas simples e legíveis em tamanho pequeno, poucos elementos e muito bem desenhados.
- PROIBIDO: logotipos ou nomes de marcas reais (inclusive marcas de moto), esquadro e compasso ou qualquer símbolo maçônico, pessoas reais, emoji, texto além do que for pedido.
- Texto, quando pedido, em letras maiúsculas condensadas e bordadas, escrito EXATAMENTE como indicado e com os acentos.

PINOS DO MAPA: patch em forma de escudo, com a base em ponta arredondada, sem texto.
Lote 1: (a) [pino-irmao] IRMÃO: capacete aberto creme com faixa laranja no meio, óculos de estrada com lentes jeans e aro caramelo, rosto de pele com barba castanha. (b) [pino-sede] SEDE: sede de clube com telhado ferrugem de telhas, paredes creme de tábuas, porta marrom em arco, duas janelas jeans, bandeirinha laranja num mastro e grama oliva na base.
Lote 2: (a) [pino-loja] LOJA: fachada de templo neoclássico genérico, com frontão triangular creme, quatro colunas caneladas creme e escadaria caramelo. (b) [pino-posto] POSTO: bomba de combustível antiga vermelha, com globo creme e aro dourado no topo, mostrador de ponteiro, mangueira preta e bico prata.
Lote 3: (a) [pino-monumento] MONUMENTO: obelisco caramelo com um lado sombreado, base em degraus e sol dourado atrás. (b) [pino-ponto-turistico] PONTO TURÍSTICO: paredões de arenito ferrugem em camadas, como a Chapada dos Guimarães, com cachoeira creme, morros oliva, rio jeans e sol dourado.
Lote 4: (a) [pino-restaurante] RESTAURANTE: prato creme com um bife, garfo e faca prata dos lados e vapor subindo. (b) [pino-oficina] OFICINA: duas chaves de boca prata cruzadas em X sobre uma engrenagem caramelo.
Lote 5: (a) [pino-agape] ÁGAPE: duas canecas douradas de chope brindando, levemente inclinadas, com espuma creme e uma gota saltando. (b) [pino-socorro-fraterno] SOCORRO FRATERNO: aperto de mãos, com uma manga laranja e outra jeans, e uma pequena cruz vermelha acima.
Lote 6: (a) [pino-sos] SOS: o mesmo escudo, mas com o fundo vermelho escuro #8E1B15 e a borda creme; giroflex vermelho com raios amarelos e a palavra "SOS" bordada em creme embaixo. (b) [pino-alerta] ALERTA: placa triangular de advertência dourada, com borda preta, ponto de exclamação preto e poste prata.

PATCHES DE NÍVEL: patch redondo com o texto em arco no topo e uma faixa (fita) bordada na parte de baixo com o nome. O personagem é um bode simpático e original, de frente, com cabeça creme e focinho caramelo-claro. Não pode lembrar nenhum logotipo existente.
Lote 7: (a) [nivel-cabrito] arco "NÍVEL 1", fita oliva "CABRITO": filhote de bode com chifres curtinhos, sem barba e borda caramelo. (b) [nivel-bode] arco "NÍVEL 2", fita ferrugem "BODE": chifres médios curvados para trás, barbicha curta e borda laranja.
Lote 8: (a) [nivel-bode-velho] arco "NÍVEL 3", fita laranja "BODE VELHO": chifres longos e espiralados com anéis, barba longa, óculos de estrada na testa, olhos semicerrados de veterano e borda ferrugem. (b) [nivel-bode-lendario] arco "NÍVEL 4", fita preta com letras douradas "BODE LENDÁRIO": o mesmo bode veterano, com coroa de louros oliva, três estrelas douradas acima e borda dourada.

SELOS DO PASSAPORTE: patch redondo com a ilustração no centro e uma fita bordada embaixo com o nome. Cada um tem a borda numa cor.
Lote 9: (a) [selo-agape] fita "ÁGAPE", borda laranja: as duas canecas brindando. (b) [selo-socorro-fraterno] fita "SOCORRO FRATERNO", borda jeans: o aperto de mãos com a cruz vermelha.
Lote 10: (a) [selo-pantanal] fita "PANTANAL", borda oliva: um tuiuiú (ave do Pantanal, de corpo branco, pescoço e bico pretos e faixa vermelha no pescoço), de pé numa lagoa jeans, com sol dourado. (b) [selo-visita-lojas] fita "VISITA A LOJAS", borda caramelo: a fachada de templo neoclássico.
Lote 11: (a) [selo-irmao-na-rota] fita "IRMÃO NA ROTA", borda ferrugem: estrada em perspectiva com faixa central amarela tracejada e um pino de localização creme no horizonte. (b) [selo-sedes-mt] fita "SEDES DO MT", borda laranja: a sede do clube com a bandeirinha.

AVATAR POR CATEGORIA DE MOTO: patch retangular com cantos bem arredondados, em formato paisagem. Mostra um piloto (capacete creme com faixa laranja, jaqueta preta) montado na moto, vista de lado e voltada para a direita. Moto na cor laranja, com rodas pretas, cromados prata e sem marca. Na fita de baixo, o nome da categoria.
Lote 12: (a) [moto-custom] "CUSTOM": moto baixa e longa, garfo inclinado, guidão alto, piloto relaxado. (b) [moto-touring] "TOURING": carenagem frontal grande, bolsas laterais e baú traseiro.
Lote 13: (a) [moto-big-trail] "BIG TRAIL": moto alta, com bico frontal, para-brisa alto e roda dianteira maior. (b) [moto-naked] "NAKED": sem carenagem, farol redondo, tanque musculoso, piloto ereto.
Lote 14: (a) [moto-esportiva] "ESPORTIVA": carenagem completa, rabeta alta, piloto inclinado para a frente. (b) [moto-street] "STREET": moto urbana pequena e simples, piloto ereto.
Lote 15: (a) [moto-trail] "TRAIL": moto off-road alta e magra, para-lamas altos, pneus de cravos. (b) [moto-scooter] "SCOOTER": rodas pequenas, assoalho plano, escudo frontal, piloto sentado reto.
Lote 16: (a) [moto-triciclo] "TRICICLO": triciclo com duas rodas na frente e uma atrás. (b) [mascote-bodinho] MASCOTE "BODINHO": patch redondo sem texto, com o bode simpático usando meio-capacete laranja e óculos de estrada escuros, sorrindo, com barbicha.

Lote 17, [ref-icones-navegacao] REFERÊNCIA DE ÍCONES (regra própria; será redesenhada em vetor): uma folha com 5 ícones em fila, sobre uma faixa escura #17130F com cantos arredondados. Estilo plano, em duas cores (creme #EFE3C8 e um detalhe laranja #D9622B ou dourado), SEM textura de bordado, linhas firmes, legível em 24 px. Ícones: MAPA (mapa dobrado com rota tracejada laranja e um pino), FEED (moldura de foto com montanha e sol), PASSEIOS (calendário com topo laranja e uma pequena moto), CONQUISTAS (medalha dourada com fita laranja e estrela creme), PERFIL (capacete creme com faixa laranja e óculos). Sem texto.

ILUSTRAÇÕES (regra própria): formato paisagem 1536x1024, ilustração plana com textura sutil de tecido bordado, mesma paleta, sem texto, composição com espaço livre na parte de cima para um título.
Lote 18: (a) [ilustra-vazio-estrada] estrada vazia ao entardecer entre paredões de arenito ferrugem, com uma única moto ao longe e o céu laranja. (b) [ilustra-primeira-viagem] montanhas jeans à noite, com uma trilha pontilhada laranja subindo até uma bandeira laranja no cume.
Lote 19: [ilustra-sem-sinal] um celular escuro mostrando um mapa com a rota laranja salva, ao lado de um ícone de sinal cortado por um risco vermelho, sobre fundo de sarja escura.
Lote 20: (a) [ilustra-boas-vindas] o mascote Bodinho acenando, ao lado de uma moto laranja estacionada diante dos paredões da Chapada ao pôr do sol. (b) [ilustra-entrada-aprovada] o Bodinho entregando um patch de colete laranja, com pequenos pespontos e estrelas douradas em volta.
Lote 21: [ilustra-nivel-novo] três patches de nível (cabrito, bode, bode velho) em escada subindo, com o último brilhando em dourado e confete bordado.

TEXTURAS (regra própria): quadrado 1024x1024, PADRÃO CONTÍNUO SEM EMENDAS (seamless/tileable: as bordas esquerda/direita e topo/base devem encaixar perfeitamente), vista de cima, iluminação totalmente uniforme, sem sombras, sem objetos, sem texto, contraste baixo (será usada atrás de texto).
Lote 22: [textura-sarja] tecido de sarja de algodão escuro, cor #17130F, trama diagonal fina e regular.
Lote 23: [textura-couro] couro preto fosco com grão fino e suave, cor #141210.
Lote 24: (a) [textura-jeans] jeans escuro azul #22323D, trama visível. (b) [textura-lona] lona encerada caramelo escuro #3A3028. (Neste lote, faça duas imagens separadas se possível; senão, divida a imagem ao meio na vertical e mantenha cada metade contínua.)

BORDA (regra própria):
Lote 25: [borda-overlock-9slice] quadrado 1024x1024, fundo transparente. Um retângulo vazio com cantos arredondados (raio de cerca de 12% do lado) cuja moldura é uma borda overlock bordada em fio laranja #D9622B com contorno externo #5E230B e pesponto creme tracejado por dentro. O interior é transparente. A espessura da borda é igual nos quatro lados, e os trechos retos não têm nenhum detalhe que se repita de forma irregular (serão esticados).

TELA DE ABERTURA E REFERÊNCIAS (regra própria):
Lote 26: (a) [splash] vertical 1024x1792: fundo sarja escura com textura, o mascote Bodinho grande ao centro como patch bordado e, abaixo, a faixa bordada com o texto "BODES DO ASFALTO". (b) [ref-tela-mapa] vertical 1024x1792, mockup de tela de celular (sem moldura de aparelho, sem barra de status) de um app de mapa escuro e elegante: mapa vetorial em tons de marrom-escuro com estradas creme, rios jeans, relevo suave; pinos em forma de patch bordado (irmãos, sede, posto); um cartão inferior com textura de sarja, borda overlock laranja e botão laranja; barra de navegação inferior com textura de sarja. Interface limpa, tipografia condensada, nada de texto ilegível — use palavras curtas em português.

Comece agora pelo Lote 1.
```
