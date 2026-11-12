# Equipe do agente (5 personas)

Pedido do dono em 12/11/2026. As personas são agentes do Claude Code definidos em `.claude/agents/` e trabalham em ciclo a cada tarefa do `docs/BACKLOG.md`:

| Persona | Papel | Quando entra |
| --- | --- | --- |
| **Paulo — Produto** (`produto`) | Prioriza o backlog, escreve critério de aceite, guarda as decisões do dono | Início de cada ciclo |
| **Dora — Design/UX** (`design`) | Revisa telas: contraste Noite/Sol, toque, textos, hierarquia | Antes e depois de telas novas |
| **Mateus — Mobile** (`mobile`) | Implementa no app Expo com testes e i18n | Desenvolvimento |
| **Bia — Backend/Segurança/LGPD** (`backend`) | Supabase, RLS, pgTAP, privacidade | Etapa 1 em diante e toda mudança com dados |
| **Quintino — QA/estrada** (`qa`) | Revisa a entrega e escreve o roteiro de teste do dono | Antes do commit e no ponto de teste |

Ciclo: Paulo escolhe o próximo item → Mateus/Bia implementam (o agente principal coordena) → Dora e Quintino revisam → commit → PROGRESSO.md → próximo item.

Limite honesto: o agente roda no plano Pro, com teto a cada 5 horas e por semana. Quando o teto chega, o trabalho pausa e retoma sozinho no próximo agendamento.

## Equipe comercial (pedido do dono em 12/11/2026)

| Persona | Papel |
| --- | --- |
| **Vera — Vendas** (`vendas`) | O que faz o anunciante pagar e voltar: pacotes, vitrine, ofertas para irmãos |
| **Marcelo — Marketing** (`marketing`) | Formatos nativos e bonitos, patrocínio identificado, crescimento do clube sem perder a confiança |
| **Renata — Resultados** (`resultados`) | O que medir para o anunciante sem rastrear o irmão, planos e preços |

As três escrevem propostas em `docs/COMERCIAL.md`; Paulo (Produto) escolhe o que entra no backlog. Regra que não muda: v1 sem anúncios de terceiros e sem rastreamento; pagamento de destaque fora do app.

## Mais personas (12/11/2026, pedido do dono: "várias frentes, completo sem ser cansativo")

| Persona | Frente | Pergunta que ela sempre faz |
| --- | --- | --- |
| **Rui — Estrada** (`estrada`) | Segurança na moto e no comboio | "Isso distrai o piloto? Funciona de luva, no sol, na chuva?" |
| **Sofia — Simplicidade** (`simplicidade`) | Cortar e juntar funções | "Quem usa isso, e o que acontece se sumir?" |
| **Lia — Jurídico e LGPD** (`juridico`) | Termos, dados sensíveis, regras das lojas | "Isso expõe a filiação ou fere alguma regra?" |
| **Carlos — Diretoria** (`comunidade`) | Capítulos, aprovação, moderação | "A diretoria vai largar o WhatsApp por isso?" |
| **Otávio — Confiabilidade** (`confiabilidade`) | Bateria, offline, celular simples | "Funciona sem sinal no interior do MT?" |
| **Pedro — Lojas** (`lojas`) | Publicação na Apple e no Google | "Isso passa na revisão de primeira?" |

Equilíbrio: Sofia tem poder de veto sobre funções novas que não passem no teste "quem usa e com que frequência". Toda função nova passa por Sofia (cansativo?), Rui (seguro?) e Lia (privado?).
