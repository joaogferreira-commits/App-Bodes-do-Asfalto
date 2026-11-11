# Postos: dados da ANP (pesquisa da Etapa 0 — 11/11/2026)

## Resumo

| Dado | Existe aberto? | Uso no app |
| --- | --- | --- |
| Localização dos postos (CNPJ, endereço, latitude/longitude) | **Sim** — cadastro de revendedores varejistas (dados abertos e "API Revendedores" da ANP) | Fonte principal da lista de postos; OpenStreetMap completa onde faltar |
| Preço por posto | **Parcial** — Levantamento de Preços de Combustíveis (LPC), semanal, por amostra. Desde jun/2025 cobre no máximo 390 municípios | Mostrar quando houver, com "Fonte: ANP" e a data da semana |
| Preço colaborativo | — | Irmãos informam o preço (com data); mostrar "Fonte: irmão, há X dias" |
| Nota de qualidade 0 a 5 (app "ANP com VC – Postos", lançado em 13/07/2026) | **Não encontrada** em dados abertos ou API pública | Não exibir "nota ANP" até haver acesso oficial |

## Detalhes

- A nota do "ANP com VC" combina o histórico de fiscalização (5 anos, com peso maior para infrações recentes) e o Programa de Monitoramento da Qualidade (PMQC). Os dados brutos de **ações de fiscalização** e do **PMQC** são abertos, mas o PMQC só lista amostras conformes e a fórmula da nota não é pública. Calcular uma "nota" própria poderia divergir da oficial e induzir o irmão a erro — por isso não faremos.
- Caminho para ter a nota: pedir à ANP acesso ao conjunto de dados da nota (pedido gratuito pelo Fala.BR, Lei de Acesso à Informação). Se liberarem, entra numa versão seguinte.
- O app sempre mostra a **fonte** e a **data** do preço (regra do CLAUDE.md).

## Decisão técnica

1. Importar o cadastro de revendedores da ANP para uma tabela `postos` (PostGIS), atualizada mensalmente por tarefa agendada.
2. Importar o LPC semanal para `precos_postos` (fonte `anp`), ligado por CNPJ.
3. Preço colaborativo em `precos_postos` (fonte `irmao`, autor, data), com moderação por denúncia.
4. Campo `nota_anp` previsto na tabela, vazio até haver acesso oficial.

## Fontes

- Metadados da série histórica de preços: https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/shpc/metadados-serie-historica-precos-combustiveis.pdf
- Redução do LPC para 390 municípios: https://monitormercantil.com.br/anp-reduz-abrangencia-do-levantamento-de-precos-de-combustiveis/
- Manual da API Revendedores (CNPJ, endereço, latitude/longitude): https://www.gov.br/anp/pt-br/centrais-de-conteudo/paineis-dinamicos-da-anp/paineis-dinamicos-do-abastecimento/api-revendedores-manual-usuario.pdf
- Metadados das ações de fiscalização: https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/arquivos-acoes-de-fiscalizacao/metadados-acoes-fiscalizacao.pdf
- Metadados do PMQC: https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/pmqc/pmqc-metadados.pdf
- App ANP com VC – Postos (Agência Gov): https://agenciagov.ebc.com.br/noticias/202607/anp-com-vc-postos-aplicativo-disponibiliza-dados-de-postos-e-canal-de-denuncias-ao-consumidor
