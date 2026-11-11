# Progresso

O agente atualiza este arquivo ao fim de cada tarefa. Toda nova sessão começa lendo-o.

## Situação atual

- **Etapa:** 0 — Prova técnica e portões (não iniciada)
- **Última atualização:** 11/11/2026
- **Próxima tarefa:** Etapa 0 — estilo do mapa (6) e pesquisa ANP (7). Dono: aguardando a primeira versão de teste (EAS).

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

## Falta nesta etapa

1. Texto do pedido de CarPlay (fica para quando a conta Apple existir).
8. Prova de navegação Google no Android — código pronto; falta testar no celular.
9. Prova no Android Auto (DHU) — código pronto; falta compilar no EAS e testar no PC do dono.
10. Estimativa de custos (300 e 1.000 irmãos).
11. Versão de teste (EAS) e medição do peso.
12. Relatório e roteiro do PONTO DE TESTE 0.

## Decisões tomadas durante o desenvolvimento

- 11/11/2026 — Dono aceitou todas as recomendações (lista no topo do CLAUDE.md) e pediu orçamento o mais apertado possível e uma tarefa por vez. Plano da Etapa 0 aprovado. Caminho A para imagens.
- 11/11/2026 — Selo "Visita a Lojas" mantém esquadro e compasso, por decisão do dono (exceção à regra do guia de estilo; vale só para esse selo).

## Problemas em aberto / aguardando o dono do projeto

- 11/11/2026 — O ambiente do agente não alcança `api.expo.dev` (bloqueio de rede); por isso as versões de teste são geradas pelo GitHub Actions, com o `EXPO_TOKEN`. `npx expo install` funciona com `EXPO_OFFLINE=1`.

- 11/11/2026 — Perguntas enviadas ao dono antes da Etapa 0 (contradições entre CLAUDE.md, ETAPAS.md, DESIGN.md e a atualização de 11/11 da especificação): mapa/navegação (Mapbox × Google + MapLibre + Valhalla); navegação curva a curva grátis × Premium; contas em CPF × empresa; CarPlay espera ou não; teto de custo (R$ 200 × R$ 500); limite do avatar por IA; revisão de segurança externa; anúncios e aviso de rastreamento do iPhone; caminho das imagens (A ou B).

## Contas e chaves configuradas

- Expo (usuário `joaogferreira`): token em GitHub Secrets como `EXPO_TOKEN`.
- Google Cloud (projeto `bodes-do-asfalto`): chave em GitHub Secrets como `GOOGLE_MAPS_API_KEY`; o workflow copia para as variáveis do EAS (sensível). Falta restringir a chave ao app (pacote + SHA-1) depois da primeira build.
