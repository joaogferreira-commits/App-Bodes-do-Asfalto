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
