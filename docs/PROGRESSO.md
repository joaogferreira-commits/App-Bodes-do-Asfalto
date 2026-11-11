# Progresso

O agente atualiza este arquivo ao fim de cada tarefa. Toda nova sessão começa lendo-o.

## Situação atual

- **Etapa:** 0 — Prova técnica e portões (não iniciada)
- **Última atualização:** 11/11/2026
- **Próxima tarefa:** Etapa 0 — conversor de imagens (tarefa 5), estilo do mapa (6) e pesquisa ANP (7). Dono: tarefa 3 (Google Cloud).

## Feito

- 11/11/2026 — `.claude/settings.json` criado; especificação renomeada para `docs/ESPECIFICACAO.md`; `settings.json` da raiz removido (movido para `.claude/`).
- 11/11/2026 — Imagens recebidas (Caminho A), lotes 1 a 26a, em `docs/assets-originais/` (detalhes no LEIAME de lá). Portão "Lotes 1 a 8 e 22 a 25" da Etapa 0 cumprido.
- 11/11/2026 — Dono criou conta Expo (usuário `joaogferreira`) e o segredo `EXPO_TOKEN` no GitHub.
- 11/11/2026 — Etapa 0, tarefas 2 a 4: app Expo SDK 58 (React Native 0.88, TypeScript estrito, Expo Router em `app/src/app`), tema "Patch de Colete" em `app/src/theme` (com teste de contraste), traduções pt-BR/es/en em `app/src/i18n` (teste de chaves iguais), componentes base em `app/src/ui` (botão, chip, cartão bordado com overlock, avatar com anel de status, divisória, folha inferior, barra com 5 abas, ícones vetoriais) e telas "menu de testes" e "Catálogo de componentes". 26 testes passando; lint e tipos limpos. CI no GitHub (`.github/workflows/ci.yml`) e build de teste pelo EAS (`build-teste.yml`, disparada ao mudar `.github/build-request.txt`).

## Falta nesta etapa

1. Texto do pedido de CarPlay (fica para quando a conta Apple existir).
5. Conversor de imagens para WebP (`tools/`).
6. Estilo do mapa `app/src/map/estilo-bodes.json` (MapLibre + OpenFreeMap) e tela do mapa.
7. Pesquisa ANP (preço e nota dos postos).
8. Prova de navegação Google no Android (depende da chave do Google — tarefa 3 do dono).
9. Prova no Android Auto (DHU).
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
