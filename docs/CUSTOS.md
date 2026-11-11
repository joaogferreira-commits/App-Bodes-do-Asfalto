# Estimativa de custos mensais (Etapa 0 — 11/11/2026)

Câmbio usado: US$ 1 = R$ 5,50. Valores de referência; conferir nas páginas de preço antes de assinar.
Regra do dono: **o mínimo indispensável**. Até o lançamento, só planos grátis.

## Hoje (desenvolvimento e testes)

| Serviço | Plano | Custo |
| --- | --- | --- |
| GitHub (repositório privado + Actions) | Grátis (2.000 min/mês) | R$ 0 |
| Expo / EAS Build | Grátis (fila mais lenta, cota mensal de builds) | R$ 0 |
| Google Cloud (navegação) | Cota grátis | R$ 0 (alerta em R$ 50) |
| OpenFreeMap (mapa principal) | Gratuito, sem chave | R$ 0 |
| Supabase (a partir da Etapa 1) | Grátis (pausa após 7 dias sem uso — ok para testes) | R$ 0 |
| **Total** | | **R$ 0/mês** |

## Depois do lançamento

| Item | 300 irmãos | 1.000 irmãos | Observação |
| --- | --- | --- | --- |
| Supabase Pro | R$ 138 | R$ 138 | Necessário em produção (sem pausa, backup diário). A escala prevista cabe no plano básico. |
| Google Navigation SDK | R$ 0 | ~R$ 85 | Só assinantes Premium navegam. Hipótese: 20% Premium × 8 destinos/mês = 480 e 1.600 destinos; 1.000 grátis/mês; ~US$ 0,025 por destino acima (valor da especificação, **confirmar** na tabela do Google). |
| Servidor de rotas (Valhalla) | ~R$ 45 | ~R$ 95 | Etapa 3. Começar só com MT e estados vizinhos num servidor de 4 GB; Brasil inteiro pede 8 GB. |
| Painel web (admin) | R$ 0 | R$ 0 | O plano grátis da Vercel não permite uso comercial: publicar no Cloudflare Pages (grátis, uso comercial liberado) ou passar à Vercel Pro (~R$ 110) se preferir. |
| Sentry, RevenueCat, push do Expo | R$ 0 | R$ 0 | Planos grátis cobrem essa escala. |
| Domínio .com.br | ~R$ 4 | ~R$ 4 | R$ 40/ano. |
| Apple Developer | ~R$ 45 | ~R$ 45 | US$ 99/ano, só quando for testar no iPhone/publicar. |
| **Total de infraestrutura** | **~R$ 230/mês** | **~R$ 365/mês** | Abaixo do alerta de R$ 500/mês. |

Pagamentos únicos: Google Play (US$ 25 ≈ R$ 140, conta da empresa) e revisão de segurança por desenvolvedor (4 a 8 h, antes do envio às lojas).

## Riscos de custo e proteções

- **Google:** orçamento com alerta (R$ 50 já configurado) e, antes do lançamento, cota diária de destinos no console. A navegação só abre para Premium, então o custo cresce junto com a receita (R$ 9,90 por assinante).
- **OpenFreeMap:** gratuito e sem garantia de serviço. Plano B: hospedar os blocos do mapa do Brasil num armazenamento barato (~R$ 10/mês) se houver instabilidade.
- **EAS:** o plano grátis tem cota de builds; se faltar, gerar menos builds ou pagar um mês avulso (US$ 19) só no período de publicação.
