# Etapas de desenvolvimento — v1

**Etapa atual: 0**

Cada etapa termina num **PONTO DE TESTE**. Só avance depois que o dono do projeto confirmar que testou e aprovou. Ao concluir uma etapa, atualize a linha "Etapa atual" e o `docs/PROGRESSO.md`.

Estimativa total com plano Claude Pro: 14 a 18 semanas.

---

## Semana 0 — Tarefas do dono do projeto (em paralelo, fora do código)

- [ ] Criar conta no GitHub e o repositório privado `bodes-do-asfalto`.
- [ ] Abrir Apple Developer Program (CPF, US$ 99/ano) só quando o agente pedir; Google Play Console como organização, quando a empresa (CNPJ + D-U-N-S) existir.
- [ ] Pedir à Apple o entitlement de navegação do CarPlay assim que a conta Apple existir (o agente prepara o texto).
- [ ] Criar contas gratuitas uma a uma, quando o agente pedir: Expo e Google Cloud (Etapa 0); Supabase (Etapa 1); RevenueCat (Etapa 8); Sentry e Vercel (Etapa 11). Sem AdMob na v1.
- [ ] Obter do clube autorização/licença escrita para uso do nome e do escudo num app de propriedade do dono.
- [ ] Combinar com a diretoria do clube como será o abono de membros e quem serão os primeiros moderadores.
- [ ] Separar pelo menos 15 irmãos testadores (Android e iPhone) e um carro com Android Auto e outro com CarPlay.

---

## Etapa 0 — Prova técnica e portões de início (1 a 2 semanas)

Feita pelo agente, em paralelo às tarefas da semana 0 do dono:
1. Projeto Expo mínimo com development build rodando num Android e num iPhone (via EAS).
2. Prova de navegação: rota real com o Google Navigation SDK, curva a curva com voz, num celular Android (iPhone quando a conta Apple existir).
2b. Levantamento de dados de postos: há dados abertos da ANP (preços por posto, nota de qualidade)? Se não, plano de preço colaborativo.
3. Prova de Android Auto: a mesma navegação aparecendo no Desktop Head Unit no PC do dono.
4. Estimativa de custos mensais (Supabase, Google incluindo cobrança por navegação, servidor Valhalla, Expo) para 300 e 1.000 usuários.
5. Sistema de design em código: tema com os tokens de `docs/DESIGN.md`, componentes base (cartão bordado, botões, chip, avatar, barra de navegação, folha inferior) com React Native Skia e uma tela interna "Catálogo de componentes".
6. Pipeline de imagens: script para converter os PNGs de `docs/assets-originais/` em WebP nos tamanhos e pesos do DESIGN.md; se o Caminho B estiver ativo, `tools/gerar-imagem.ts` com registro de custo.
7. Primeira versão do estilo de mapa `estilo-bodes.json` (MapLibre + OpenFreeMap) aplicada no mapa principal.
8. Relatório em português simples: o que funcionou, riscos, se a stack se confirma e o peso atual do app.

**PORTÕES PARA INICIAR A ETAPA 1 (todos com OK do dono):**
- [x] Prova técnica aprovada (navegação no celular e no Android Auto) — 11/11/2026.
- [ ] Telas de `docs/telas/` aprovadas.
- [ ] Contato feito com a sede nacional sobre a licença da marca (se ainda não houver resposta, o código usa nome provisório e tema trocável).
- [ ] Orçamento aceito e decisão sobre abrir empresa antes do lançamento.
- [ ] Lista inicial de capítulos, sedes e diretorias de Cuiabá obtida.
- [ ] Catálogo de componentes aprovado pelo dono (visual "Patch de Colete").
- [x] Pelo menos os Lotes 1 a 8 e 22 a 25 de imagens gerados (Caminho A ou B) — todos os 26 recebidos.

**PONTO DE TESTE 0** — o dono vê uma rota navegando no próprio celular, com o estilo de mapa próprio, e no Android Auto do PC; e navega pelo Catálogo de componentes.

---

## Etapa 1 — Fundação, acesso e perfil

Antes de codar: Interface v2 aprovada pelo dono (`docs/telas/v2/`); refazer tema e componentes a partir dela; ícone do app com o Bodinho; reduzir o peso do APK; restringir a chave do Google.

Entregar:
1. Estrutura do repositório (`app/`, `supabase/`, `e2e/`, `docs/`, `admin/` vazio), README, `.env.example`, CI no GitHub Actions (lint, tipos, testes).
2. Login: e-mail com link mágico, Google e Sign in with Apple.
3. Capítulos (tabela + seed de exemplo) e papéis `pendente`, `membro`, `diretoria_capitulo`, `diretoria_geral`, `moderador`, `admin`, com RLS.
4. Entrada só para membros do Bodes do Asfalto, decidida por capítulo: se o capítulo já tem diretoria ativa no app, ela aprova os próprios membros; se ainda não tem, o candidato preenche o formulário de solicitação (nome, apelido de estrada, capítulo, cidade, telefone, foto, membro que indica) e o admin ou um moderador aprova. Quando a diretoria do capítulo chega ao app, a aprovação passa para ela automaticamente. Pendente só vê a tela de espera; notificação ao ser aprovado ou recusado.
5. Perfil: nome, apelido, cidade, capítulo, foto, até 3 contatos de emergência.
6. Perfil maçônico opcional: Loja, Oriente, Potência, cada campo com visibilidade própria (ninguém, amigos, todos os membros). Sem grau. Dados criptografados.
7. Consentimentos LGPD separados: termos/privacidade, dados maçônicos (sensíveis), localização. Tela "Meus dados" para revisar, baixar e revogar.
8. Garagem: motos (marca, modelo, ano, apelido, foto, km).
9. Excluir conta e dados pelo app.
10. Cinco abas (Feed, Mapa, Passeios, Conquistas, Perfil); só Perfil funcional.
11. Tema escuro provisório e i18n com pt-BR, es e en.
12. Primeira build de teste para Android e iPhone via EAS.

Também: desativação de irmão pela diretoria; formulário com foto do colete, foto da carteirinha e indicação confirmada por um membro; lista de membros; botão Ajuda (chega no painel na Etapa 11; até lá, por e-mail).

Também: avatares ilustrados padrão e mascote Bodinho nas telas de boas-vindas e espera (ver `docs/telas/Kit.dc.html`).

**PONTO DE TESTE 1**
- Capítulo sem diretoria no app: pedir entrada pelo formulário; moderador aprova; o irmão passa a ver as abas.
- Capítulo com diretoria no app: o pedido vai só para a diretoria daquele capítulo, que aprova.
- Pendente não vê nada além da tela de espera.
- Loja marcada como "ninguém" não aparece para outro membro; marcada como "todos" aparece.
- Um membro não lê os contatos de emergência de outro.
- Trocar o idioma muda todos os textos; excluir a conta apaga os dados.

---

## Etapa 2 — Mapa, lugares, Lojas e negócios

Entregar:
1. Mapa MapLibre com sedes, monumentos e pontos turísticos; importação do OpenStreetMap (começando por MT e rotas do clube) com atribuição; filtros; detalhe do lugar.
2. Check-in por GPS (≤200 m) e lista de lugares visitados.
3. **Lojas:** cadastro feito por um irmão da Loja (nome, Oriente, Potência, dias de sessão, irmão de contato), visível só a membros; moderação de cadastros.
4. **Guia de Negócios de Irmãos:** irmão cadastra seu negócio (oficina, concessionária, hotel, pousada, restaurante etc.), com benefício para membros; categorias e filtro no mapa; campo "destaque" (o pagamento entra na Etapa 8).

Também: mapa mostra tudo da área visível com contador "Nesta área" e pinos por tipo do kit visual; postos no mapa (OpenStreetMap) com preço colaborativo e, se houver dados abertos, nota ANP.

Também: estilo de mapa refinado (relevo, rios, rodovias, rótulos) e pinos com os emblemas gerados e agrupamento.

**PONTO DE TESTE 2** — check-in numa sede real (e recusa longe dela); cadastrar uma Loja e um negócio e vê-los no mapa com outro usuário.

---

## Etapa 3 — Rotas e navegação

Entregar: criar rota com paradas, salvar, compartilhar (todos, capítulo ou amigos); navegação curva a curva com voz (Google Navigation SDK, Premium com 7 dias grátis; gratuitos abrem no Waze/Google Maps); servidor Valhalla para planejar rotas; recálculo; gravação da trilha e km; **modo pilotando** (tela cheia, próxima manobra grande, botões alerta/reagrupar/SOS/encerrar).

Também: rota em navegação salva para uso offline; importar e exportar GPX; trilhas privadas por padrão.

Também: **tipo de estrada** no planejamento — Só asfalto / Misto / Prefiro terra (Valhalla; navegação Google seguindo pontos de passagem; plano B Ferrostar+Valhalla para rotas com terra); estrada de terra sempre com cor/traço próprios no mapa e na rota.

Também: botões "Posto mais próximo" e "Posto na rota" no mapa e no modo pilotando (grade 3×2); gerador de bate-volta; modo economia de bateria; voz pelo intercomunicador.

**PONTO DE TESTE 3** — navegar uma rota real de pelo menos 20 km com o celular no guidão; voz no fone/intercomunicador; km gravados corretamente.

---

## Etapa 4 — Passeios, mapa ao vivo e segurança

Entregar:
1. Agenda de passeios por capítulo, confirmação de presença, notificações.
2. Comboio ao vivo (Supabase Realtime), aviso de quem ficou para trás, ponto de reagrupamento.
3. **Mapa ao vivo dos irmãos:** níveis `invisivel`, `cidade`, `aproximado` (padrão, ~5 km), `preciso_amigos`, `preciso_comboio`; aproximação e zonas privadas aplicadas no servidor; modo temporário que desliga sozinho; status no marcador (na estrada, parado para café, aberto a encontro, não perturbe); posições expiram automaticamente.
4. SOS: push para o grupo + WhatsApp com mensagem pronta e localização.
5. **Socorro Fraterno:** pedido de ajuda (pane, pneu, guincho, pouso) enviado em raio crescente (20, 50, 100 km) a irmãos que aceitam esses avisos; mostra oficinas do Guia de Negócios por perto; respostas "estou indo"; encerramento do pedido.

Também: localização em segundo plano só se o irmão ativar; histórico de posições apagado após 7 dias.

Também: SOS revela a posição exata mesmo em aproximado/invisível; avisos rápidos no comboio (pausa, combustível, ficou para trás).

**PONTO DE TESTE 4** — passeio de teste com 3 motos (posições, quem ficou para trás, reagrupar); irmão em "aproximado" não revela posição exata; zona privada de casa nunca aparece; modo temporário desliga no horário; SOS e Socorro Fraterno chegam aos irmãos certos.

---

## Etapa 5 — Social

Entregar: feed (clube, capítulo, amigos), fotos com compressão, comentários e curtidas, amigos, avisos fixados da diretoria e do dono, denunciar, bloquear, fila de moderação.

Também: posts para todos os membros por padrão; moderação pela diretoria no próprio capítulo; eventos de Lojas e Potências.

Também: stories de 24 h, vídeos curtos, enquetes, menções, hashtags, álbuns, salvar, compartilhar fora do app com marca d'água, reação TFA, cartão de viagem, notificações centralizadas; remover localização das fotos.

Também: cartões do feed com textura de sarja, borda overlock e profundidade conforme DESIGN.md.

**PONTO DE TESTE 5** — postar foto, comentar, adicionar amigo, denunciar e bloquear.

---

## Etapa 6 — Confraternização

Entregar:
1. **Chat pelo mapa:** aceno ao tocar no marcador; chat 1:1 só abre se aceito; respostas rápidas de estrada; aviso por voz quando pilotando; bloquear, denunciar, limite diário de acenos; mensagens com moderação.
2. **Irmão na Rota:** ao planejar uma rota, listar irmãos (que marcaram "aceito receber visita"), sedes, Lojas e negócios num corredor de ~30 km; propor café, almoço ou pouso; aceite vira parada na rota.
3. **Ágape Relâmpago:** convite com local, horário-limite e raio (10, 50, 100 km); aparece no mapa com contagem regressiva e confirmados; check-in de quem compareceu.
4. **Chegada na Cidade:** detectar chegada em outra cidade (geofence leve, sem rastreamento contínuo), mostrar irmãos/sedes/Lojas locais e permitir avisar "estou na cidade até tal dia" aos irmãos locais que aceitam esses avisos.
5. **Visitação de Lojas:** aviso prévio de visita ao irmão de contato da Loja, com resposta dele.
6. Central de preferências: cada tipo de aviso de confraternização ligado/desligado e raio configurável.

Também: grupos de chat do passeio, do capítulo e do Ágape (temporário).

**PONTO DE TESTE 6** — aceno aceito e recusado; chat com bloqueio; ágape com 2 irmãos por perto; rota com irmão aceitando café; aviso de chegada numa cidade; aviso de visita a uma Loja.

---

## Etapa 7 — Gamificação

Entregar: XP pelas regras da especificação (no servidor, Edge Functions), níveis e patches, Passaporte do Bode, selos de confraternização (Ágape, Socorro Fraterno, Visitação de Lojas, Irmão na Rota), rankings mensal e anual (geral, por capítulo, amigos), antifraude, valores configuráveis.

Também: opção de sair dos rankings.

Também: animação Lottie de selo sendo bordado ao desbloquear e de subida de nível; patches de nível e selos com os emblemas gerados.

**PONTO DE TESTE 7** — rodar, fazer check-in, comparecer a ágape e ajudar num Socorro Fraterno geram o XP/selo certo; trecho com velocidade absurda é descartado.

---

## Etapa 8 — Monetização

Entregar: assinatura premium via RevenueCat (estatísticas e diário de viagem, sem anúncios, visual exclusivo); sem anúncios na v1 (decisão de 11/11/2026); avatar por IA (1 grátis por conta, 2/mês no Premium); destaque pago do Guia de Negócios; tela "Seja Premium" e restaurar compras.

Também: preços R$ 9,90/mês e R$ 89/ano; regiões offline no premium; destaque do Guia de Negócios ativado manualmente no painel (pagamento fora do app).

Também: recap 3D da viagem (vídeo curto com marca d'água) como recurso premium.

**PONTO DE TESTE 8** — compra de teste (sandbox) libera o premium (navegação, estatísticas, visual); SOS, alertas e comboio seguem grátis.

---

## Etapa 9 — Android Auto

Entregar: tela do carro com a identidade do app (cor do cartão de manobra, ícones próprios, estilo de mapa na nuvem do Google, avisos de trecho de terra). Módulo Car App Library (navegação): rota, próxima manobra, lista "na rota" (postos, sedes, Lojas, negócios de irmãos), comboio simplificado, alerta e SOS, aviso de aceno por voz. Sem feed, fotos, chat em texto ou anúncios.

Também: botões Posto mais próximo e Posto na rota na tela do carro/painel da moto.

**PONTO DE TESTE 9** — roteiro passo a passo no Desktop Head Unit no PC; depois num carro.

---

## Etapa 10 — CarPlay

Entregar: os mesmos recursos da etapa 9 no CarPlay (entitlement de navegação). Build pela nuvem (EAS), TestFlight.

Também: botões Posto mais próximo e Posto na rota no CarPlay.

**PONTO DE TESTE 10** — teste num carro com CarPlay. Se o entitlement não tiver saído, registrar e seguir.

---

## Etapa 11 — Painel de administração

Entregar: painel web (Next.js, Vercel). Dono (admin): tudo, incluindo nomear moderadores. Moderadores: formulários de entrada, denúncias, Lojas e negócios. Diretoria: abono e passeios do seu capítulo (diretoria geral: todos os capítulos). Também: capítulos, sedes, desafios, valores de XP, destaques pagos, estatísticas simples.

Também: interruptor por capítulo para o lançamento em fases; alertas de custo (R$ 500/mês); fila do botão Ajuda.

**PONTO DE TESTE 11** — cada papel só vê e faz o que lhe cabe.

---

## Etapa 12 — Teste fechado e publicação

Entregar: textos das lojas em pt, es e en; capturas; política de privacidade e termos (com a seção de dados sensíveis); formulários de privacidade das lojas; **conta de demonstração para os revisores**; teste fechado com irmãos no Google Play (conta de organização) e TestFlight; correções; envio para revisão.

Também: domínio novo, e-mail de suporte, política e termos redigidos pelo agente e revisados pelo dono (encarregado de dados); lançamento primeiro em Cuiabá. O lançamento não espera a aprovação do CarPlay.

Também: tela de abertura (splash) e ícone do app a partir dos ativos gerados; conferir limite de peso final.

**PONTO DE TESTE 12** — aprovação nas duas lojas. Antes do envio, revisão de segurança por um desenvolvedor.

---

## Depois do lançamento (não implementar agora)

Família e amigos como convidados, calendário fraterno (Dia do Maçom, aniversário de iniciação opcional, passeios beneficentes), desafios mensais avançados, check-in de evento por QR, alertas colaborativos da estrada, previsão do tempo por trecho, detecção de queda (premium experimental), autonomia e último posto, classificados, outros motoclubes maçônicos.
