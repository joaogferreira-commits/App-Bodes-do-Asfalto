# Relatório da Etapa 0 — Prova técnica (11/11/2026)

## Resultado do Ponto de Teste 0 (feito pelo dono)

| Item | Resultado |
| --- | --- |
| A. Instalar o app no Android | Funcionou |
| B. Catálogo de componentes (visual Patch de Colete) | Funcionou |
| C. Mapa com estilo próprio (MapLibre + OpenFreeMap) | Funcionou |
| D. Navegação curva a curva do Google, com voz | Funcionou (na versão 6) |
| E. Android Auto no PC (DHU): app, botões Alerta/SOS e rota | Funcionou |

## A stack se confirma?

**Sim.** Google Navigation SDK + MapLibre + Expo SDK 58 funcionam juntos no Android, inclusive no Android Auto.

## O que deu trabalho (e já está resolvido)

1. Arquivo de teste dentro da pasta de telas quebrava o empacotamento → regra + verificação no CI.
2. Servidor grátis do EAS sem memória → build só arm64, Gradle limitado.
3. SDK do Google (Beta 0.19) exige um método que a própria base não implementa → implementado + teste que vigia isso.
4. Mapa do Google montado antes da permissão de localização fechava o app → só monta depois da permissão + testes.
5. Pane do GitHub Actions (≈1 h 20) atrasou as builds — fora do nosso controle.

## Riscos e pendências

| Risco | Situação | Plano |
| --- | --- | --- |
| **Peso do app: 80,7 MB** (APK só arm64), acima da meta de ~60 MB | Medido na build 6 | Etapa 1: ligar compactação de código e de recursos (R8/shrinkResources) com teste da navegação; tirar o `expo-dev-client` das versões de teste; publicar como AAB (a Play entrega só o necessário a cada aparelho). Medir de novo. |
| SDK do Google em Beta | Funciona; pode mudar entre versões | Teste automático da tela do carro; plano B (Ferrostar + Valhalla) documentado |
| Chave do Google sem restrição | Funciona, mas pode ser usada fora do app | Etapa 1: restringir a chave ao pacote `com.bodesdoasfalto.app` + SHA-1 da assinatura (passo a passo ao dono) |
| iPhone e CarPlay | Não testados (sem conta Apple, por economia) | Quando a conta Apple for aberta |
| DHU lento no PC | Esperado (decodificação de vídeo no PC) | Fluidez real testada no carro (Etapa 9) |
| Nota de qualidade ANP | Sem dado aberto | Não exibir; preço ANP parcial + preço dos irmãos (`docs/decisoes/postos-anp.md`) |

## Custos

R$ 0/mês até o lançamento; ~R$ 230/mês (300 irmãos) e ~R$ 365/mês (1.000) depois (`docs/CUSTOS.md`).

## Entregas da etapa

- App Expo com tema, traduções (pt-BR/es/en), componentes e Catálogo (`app/src/`)
- Conversor de imagens e 44 imagens em WebP (`tools/`, `app/assets/gerados/`)
- Estilo de mapa `app/src/map/estilo-bodes.json`
- Navegação Google (`app/src/app/navegacao.tsx`, `app/src/navegacao/`) e Android Auto (`app/plugins/`)
- CI no GitHub, builds pelo EAS e leitor de situação/erros das builds
- 49 testes do app + 5 do conversor, todos passando
