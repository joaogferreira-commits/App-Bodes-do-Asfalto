# Progresso

O agente atualiza este arquivo ao fim de cada tarefa. Toda nova sessão começa lendo-o.

## Situação atual

- **Etapa:** 0 — Ponto de Teste 0 **aprovado** (A–E); faltam portões do dono para iniciar a Etapa 1
- **Última atualização:** 11/11/2026
- **Próxima tarefa:** dono responder aos portões da Etapa 1 (telas, catálogo, licença da marca, orçamento/empresa, capítulos de Cuiabá); depois apresentar o plano da Etapa 1.

## Feito

- 11/11/2026 — `.claude/settings.json` criado; especificação renomeada para `docs/ESPECIFICACAO.md`; `settings.json` da raiz removido (movido para `.claude/`).
- 11/11/2026 — Imagens recebidas (Caminho A), lotes 1 a 26a, em `docs/assets-originais/` (detalhes no LEIAME de lá). Portão "Lotes 1 a 8 e 22 a 25" da Etapa 0 cumprido.
- 11/11/2026 — Dono criou conta Expo (usuário `joaogferreira`) e o segredo `EXPO_TOKEN` no GitHub.
- 11/11/2026 — Etapa 0, tarefas 2 a 4: app Expo SDK 58 (React Native 0.88, TypeScript estrito, Expo Router em `app/src/app`), tema "Patch de Colete" em `app/src/theme` (com teste de contraste), traduções pt-BR/es/en em `app/src/i18n` (teste de chaves iguais), componentes base em `app/src/ui` (botão, chip, cartão bordado com overlock, avatar com anel de status, divisória, folha inferior, barra com 5 abas, ícones vetoriais) e telas "menu de testes" e "Catálogo de componentes". 26 testes passando; lint e tipos limpos. CI no GitHub (`.github/workflows/ci.yml`) e build de teste pelo EAS (`build-teste.yml`, disparada ao mudar `.github/build-request.txt`).
- 11/11/2026 — Etapa 0, tarefa 5: conversor `tools/converter_imagens.py` (Python + Pillow + numpy; 5 testes em `tools/test_converter_imagens.py`). Gerou 44 WebP em `app/assets/gerados/` (≈2 MB no total; emblemas ≤ 40 KB, texturas ≤ 50 KB e sem emenda, ilustrações ≤ 150 KB). Prancha de conferência: `docs/assets-originais/prancha-convertidos.png`.
- 11/11/2026 — Dono criou o projeto `bodes-do-asfalto` no Google Cloud (Navigation SDK, Maps SDK Android/iOS e Routes API ativados; orçamento com alerta em R$ 50) e o segredo `GOOGLE_MAPS_API_KEY` no GitHub.
- 11/11/2026 — Etapa 0, tarefa 8 (código): Google Navigation SDK 0.19 (Navigation SDK Android 8.0), plugin `app/plugins/withNavegacaoGoogle.js` (desugaring + Jetifier; Kotlin 2.3.21 via expo-build-properties), `app.config.ts` lê a chave do ambiente do EAS, tela `src/app/navegacao.tsx` (destinos: Chapada, Centro de Cuiabá, ponto a 5 km; modo moto TWO_WHEELER; voz com Bluetooth; modo noite). Lógica em `src/navegacao/` com 10 testes. Prebuild Android conferido localmente. Primeira build EAS pedida pelo workflow.
- 11/11/2026 — Etapa 0, tarefa 7: pesquisa ANP em `docs/decisoes/postos-anp.md`. Cadastro de postos com coordenadas: aberto. Preço ANP: parcial (LPC, até 390 municípios). Nota de qualidade do "ANP com VC": sem dado aberto/API — não exibir até acesso oficial (pedido via Fala.BR é opção futura do dono). Preço colaborativo dos irmãos completa.
- 11/11/2026 — Primeira build EAS (Android, preview) enviada: projeto `@joaogferreira/bodes-do-asfalto` (ID 59391c5b-87c0-4b6a-8861-bff6fefd01c6), keystore criada no servidor do Expo. Workflow `status-build.yml` mostra o resultado das builds no log do GitHub (o agente não alcança expo.dev).
- 11/11/2026 — Etapa 0, tarefa 6: estilo `app/src/map/estilo-bodes.json` (MapLibre, dados OpenFreeMap, cores da seção 3 do DESIGN.md, atribuição OSM) validado por teste com o style-spec; tela `src/app/mapa.tsx` centrada em Cuiabá. Relevo (hillshade) fica para a Etapa 2 (precisa de fonte de elevação).
- 11/11/2026 — Etapa 0, tarefa 9 (código): plugin `app/plugins/withAndroidAuto.js` + classes Java em `app/plugins/android-auto/` (CarAppService categoria NAVIGATION, Session, tela que estende `AndroidAutoBaseScreen` do Google com botões Alerta e SOS). Manifesto, permissões e descritor conferidos no prebuild; compilação Java só é verificada no EAS (sem Android SDK no ambiente do agente). Build 2 pedida.
- 11/11/2026 — Etapa 0, tarefa 10: `docs/CUSTOS.md` — R$ 0/mês até o lançamento; ~R$ 230/mês (300 irmãos) e ~R$ 365/mês (1.000) depois. Atenção: Vercel grátis não permite uso comercial → painel no Cloudflare Pages (grátis).
- 11/11/2026 — Dono instalou Android Studio + DHU e preparou o celular (depuração USB, Android Auto em modo desenvolvedor com fontes desconhecidas). Roteiro do teste em `docs/TESTE_ETAPA0.md`. As duas builds estavam em fila (IN_QUEUE) às 18:18 UTC — fila do plano grátis.
- 11/11/2026 — Builds 1 e 2 falharam na etapa "Bundle JavaScript": o teste `telas.test.tsx` estava dentro de `src/app/` e o Expo Router o tratou como tela (puxando a biblioteca de testes para o app). Corrigido: testes de tela ficam em `src/__tests__/`. O CI agora roda `expo export` para pegar esse tipo de erro antes do EAS. Build 3 pedida (fbd1b759).
- 11/11/2026 — Build 3 também falhou (fase ainda desconhecida). O GitHub Actions ficou parado (fila sem iniciar por 8+ min, aviso de instabilidade do GitHub), então pedi ao dono o texto do erro na página do Expo.
- 11/11/2026 — Build 3: o JavaScript empacotou; a compilação Android passou pelo MapLibre e começou o Google Navigation SDK, mas o Gradle morreu por falta de memória (servidor grátis do EAS). Correção: só arm64-v8a, Gradle com 4 GB, 2 tarefas, sem paralelo (plugin `withNavegacaoGoogle`). Aviso falso do expo-doctor sobre o SDK do Google silenciado em package.json. Build 4 pedida.
- 11/11/2026 — Build 4 (64d008b8): memória resolvida, compilou todo o Android; falhou só em `BodesCarScreen.java` — o SDK do Google 0.19 declara `setNightModeOption` na interface `INavigationViewController` e a tela base não implementa (bug do pacote em Beta). Corrigido na nossa tela + teste `plugins/android-auto.test.js` que compara a interface do SDK com a base e a nossa tela. `npm audit fix` aplicado (sem quebra). Build 5 pedida.
- 11/11/2026 — **Build 5 terminou sem erros** (Android, preview, só arm64). Enviado ao dono o roteiro do PONTO DE TESTE 0. Peso do APK: medir na próxima consulta de situação.
- 11/11/2026 — Resultado parcial do PONTO DE TESTE 0: A (instalar), B (catálogo) e C (mapa) **funcionaram**. D (navegação) **fecha o app** — falta o registro do erro (pedido ao dono via `adb logcat -b crash`). E (Android Auto/DHU): a janela do DHU abre e fecha — pedido o texto do Prompt de Comando.
- 11/11/2026 — Causa do D: `SecurityException: my location requires permission` — o `NavigationView` era montado com `myLocationEnabled` antes da permissão. Correção: a tela só monta o mapa do Google depois da permissão (3 testes novos em `src/__tests__/navegacao-tela.test.tsx`). Causa do E: DHU 2.0 (2022) do dono conecta e o celular derruba a conexão — atualizar o DHU no SDK Manager. Build 6 pedida.
- 11/11/2026 — DHU 2.0 é a versão mais recente; abriu e conectou, mas com lentidão (decodificação do vídeo no PC; Google Maps e música também travam — não é do app). Orientado `headunit.ini` com 800x480. Fluidez real fica para o teste no carro.
- 11/11/2026 — **Build 6: item D (navegação) funcionou no celular.** Falta o E (navegação no Android Auto/DHU).
- 11/11/2026 — **Item E funcionou** (app, Alerta/SOS e rota no DHU). Ponto de Teste 0 completo. Peso do APK (build 6, só arm64): **80,7 MB** — acima da meta de ~60 MB; plano no `docs/RELATORIO_ETAPA0.md`. Relatório final da Etapa 0 escrito.

## Falta nesta etapa

1. Texto do pedido de CarPlay (fica para quando a conta Apple existir).
Tarefas 2 a 12 concluídas (ver "Feito"). Pendências levadas para a Etapa 1: reduzir o peso do APK, restringir a chave do Google.

## Decisões tomadas durante o desenvolvimento

- 11/11/2026 — Dono aceitou todas as recomendações (lista no topo do CLAUDE.md) e pediu orçamento o mais apertado possível e uma tarefa por vez. Plano da Etapa 0 aprovado. Caminho A para imagens.
- 11/11/2026 — Selo "Visita a Lojas" mantém esquadro e compasso, por decisão do dono (exceção à regra do guia de estilo; vale só para esse selo).

## Problemas em aberto / aguardando o dono do projeto

- 11/11/2026 — Avisos do `npm`: `npm audit fix` seguro aplicado. Restam 31 avisos (glob/minimatch/deepmerge) só em ferramentas de build e teste (Expo CLI, Jest, typescript-eslint) — não entram no app instalado; a correção depende de versões novas do Expo/Jest (exigiriam `--force`, com quebra). Reavaliar a cada atualização do Expo. ESLint 9 é o exigido pelo eslint-config-expo do SDK 58; subir junto com o próximo SDK.

- 11/11/2026 — O ambiente do agente não alcança `api.expo.dev` (bloqueio de rede); por isso as versões de teste são geradas pelo GitHub Actions, com o `EXPO_TOKEN`. `npx expo install` funciona com `EXPO_OFFLINE=1`.

- 11/11/2026 — Perguntas enviadas ao dono antes da Etapa 0 (contradições entre CLAUDE.md, ETAPAS.md, DESIGN.md e a atualização de 11/11 da especificação): mapa/navegação (Mapbox × Google + MapLibre + Valhalla); navegação curva a curva grátis × Premium; contas em CPF × empresa; CarPlay espera ou não; teto de custo (R$ 200 × R$ 500); limite do avatar por IA; revisão de segurança externa; anúncios e aviso de rastreamento do iPhone; caminho das imagens (A ou B).

## Contas e chaves configuradas

- Expo (usuário `joaogferreira`): token em GitHub Secrets como `EXPO_TOKEN`.
- Google Cloud (projeto `bodes-do-asfalto`): chave em GitHub Secrets como `GOOGLE_MAPS_API_KEY`; o workflow copia para as variáveis do EAS (sensível). Falta restringir a chave ao app (pacote + SHA-1) depois da primeira build.
